import { ChatOpenAI } from '@langchain/openai'
import { 
  AgentConfig, 
  AgentResponse, 
  AgentStreamingUpdate,
  ConversationContext
} from './types'
import { Workflow, WorkflowProject } from '@/types/workflow'
import { performDeepDiscovery } from './tools/performDeepDiscovery'
import { researchIntegrations } from './tools/researchIntegrations'
import { generateWorkflow } from './tools/generateWorkflow'
import { classifyIntent } from './tools/classifyIntent'
import { applyWorkflowDelta } from './tools/applyWorkflowDelta'

interface PlannerStep {
  thought: string
  tool?: string
  toolInput?: Record<string, unknown>
  observation?: string
  action?: 'continue' | 'complete' | 'error' | 'clarify'
}

export class FlowCraftPlannerAgent {
  private llm: ChatOpenAI
  private conversations = new Map<string, ConversationContext>()
  private config: AgentConfig

  constructor(config: AgentConfig) {
    this.config = config
    
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.')
    }

    this.llm = new ChatOpenAI({
      model: config.model.modelName,
      temperature: config.model.temperature,
      maxTokens: config.model.maxTokens,
      apiKey: apiKey,
      // @ts-expect-error - useResponsesApi property may not be in TS interface yet
      useResponsesApi: true
    })
  }

  /**
   * Main planning method using ReAct pattern
   */
  async planAndExecute(
    userInput: string,
    onProgress?: (update: AgentStreamingUpdate) => void,
    conversationId: string = 'default'
  ): Promise<AgentResponse> {
    const startTime = Date.now()
    const steps: PlannerStep[] = []
    const toolsUsed: string[] = []
    let iterations = 0
    const maxIterations = this.config.maxIterations || 10

    try {
      // Initialize conversation context
      const context = this.getOrCreateConversation(conversationId)
      context.messages.push({
        role: 'user',
        content: userInput,
        timestamp: new Date()
      })

      onProgress?.({
        phase: 'analyzing',
        message: '🧠 Planning your automation workflow...',
        progress: 5,
        details: { estimated_time: '30-90 seconds' }
      })

      // Start ReAct loop
      let currentStep: PlannerStep = {
        thought: 'I need to understand what the user wants to accomplish.',
        action: 'continue'
      }

      while (currentStep.action === 'continue' && iterations < maxIterations) {
        iterations++
        
        // Generate next thought and action
        const plannerPrompt = this.buildPlannerPrompt(userInput, steps, context)
        const response = await this.llm.invoke([
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: plannerPrompt }
        ])

        const parsedStep = this.parseReActResponse(response.content as string)
        steps.push(parsedStep)

        onProgress?.({
          phase: 'analyzing',
          message: `💭 ${parsedStep.thought}`,
          progress: Math.min(10 + (iterations * 15), 80),
          details: { iteration: iterations, step: parsedStep.tool || 'thinking' }
        })

        // Execute tool if specified
        if (parsedStep.tool && parsedStep.toolInput) {
          try {
            const toolResult = await this.executeTool(
              parsedStep.tool, 
              parsedStep.toolInput,
              onProgress
            )
            
            parsedStep.observation = toolResult
            toolsUsed.push(parsedStep.tool)

            onProgress?.({
              phase: 'analyzing',
              message: `✅ Completed ${parsedStep.tool}`,
              progress: Math.min(20 + (iterations * 15), 85),
              toolUsed: parsedStep.tool,
              toolOutput: this.summarizeToolOutput(toolResult)
            })
          } catch (error) {
            parsedStep.observation = `Error: ${error}`
            parsedStep.action = 'error'
          }
        }

        currentStep = parsedStep
      }

      // Generate final answer
      const finalAnswerPrompt = this.buildFinalAnswerPrompt(userInput, steps)
      const finalResponse = await this.llm.invoke([
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: finalAnswerPrompt }
      ])

      const finalAnswer = this.parseFinalAnswer(finalResponse.content as string)

      onProgress?.({
        phase: 'complete',
        message: '🎉 Your automation workflow is ready!',
        progress: 100,
        details: {
          iterations,
          tools_used: toolsUsed.length,
          confidence: this.calculateConfidence(steps)
        }
      })

      // Update conversation context
      context.messages.push({
        role: 'assistant',
        content: `Successfully planned and executed workflow generation`,
        timestamp: new Date(),
        metadata: {
          tool_calls: toolsUsed,
          confidence_score: this.calculateConfidence(steps),
          workflow_changes: [`Generated workflow through ${iterations} planning iterations`]
        }
      })

      const executionTime = Date.now() - startTime

      return {
        success: true,
        result: finalAnswer,
        metadata: {
          execution_time: executionTime,
          tools_used: toolsUsed,
          iterations,
          confidence_score: this.calculateConfidence(steps)
        }
      }
    } catch (error) {
      console.error('Planner execution failed:', error)
      
      return {
        success: false,
        result: {
          insights: {
            complexity_analysis: 'Planning failed due to processing error',
            security_considerations: [],
            performance_tips: [],
            next_steps: [
              'Be more specific about what you want to automate',
              'Mention the specific services you want to connect',
              'Describe the trigger and desired outcome'
            ]
          }
        },
        metadata: {
          execution_time: Date.now() - startTime,
          tools_used: toolsUsed,
          iterations,
          confidence_score: 0
        },
        error: 'I encountered an error while planning your workflow. Please try rephrasing your request.'
      }
    }
  }

  private getSystemPrompt(): string {
    return `You are FlowCraft Planner, an expert automation architect agent.

Your job is to take a user's request and intelligently build a complete automation workflow using a step-by-step process. You have access to tools that can perform analysis, integration generation, and workflow creation.

You MUST:
1. Understand what the user wants
2. Think step-by-step using thoughts and tools
3. Use tools only when needed — don't assume
4. Re-evaluate based on tool outputs
5. Plan for validation, retries, and edge cases
6. Output a clean, final workflow in JSON schema

Format your responses EXACTLY like this:
Thought: [what are you thinking?]
Tool: [which tool to call or "none"]
Tool Input: [VALID JSON input for that tool or "none"]
Action: [continue|complete|error|clarify]

CRITICAL: Tool Input MUST be valid JSON on a single line. Examples:
- {"userMessage": "Create a workflow", "context": {}}
- {"prompt": "Create a workflow for data pipeline"}
- {"services": ["aws-s3", "aws-lambda"], "requirements": {}}
- none

Available tools:
- classifyIntent → Identify if the user wants to create, edit, optimize, or analyze
  Input: {"userMessage": "the user's request", "context": {...optional context...}}
- performDeepDiscovery → Analyze the request and extract structured triggers, actions, services
  Input: {"prompt": "the user's request", "context": {...optional context...}}
- researchIntegrations → Generate integration logic/code for services
  Input: {"services": ["service1", "service2"], "requirements": {...optional requirements...}}
- generateWorkflow → Turn discovery + integrations into executable workflow
  Input: {"discovery": {...discovery results...}, "integrations": [...integration results...], "preferences": {...optional preferences...}}
- applyWorkflowDelta → Modify an existing workflow using structured instructions
  Input: {"workflow": {...current workflow...}, "changes": [...list of changes...], "options": {...optional options...}}

IMPORTANT: Always format Tool Input as valid JSON with the exact field names shown above.

Think carefully. Be smart. If you're unsure, clarify or use tools to resolve ambiguity.
Never make assumptions about what the user wants - use the tools to understand their intent.`
  }

  private buildPlannerPrompt(userInput: string, steps: PlannerStep[], context: ConversationContext): string {
    const stepHistory = steps.map((step, i) => 
      `Step ${i + 1}:
Thought: ${step.thought}
Tool: ${step.tool || 'none'}
Tool Input: ${step.toolInput ? JSON.stringify(step.toolInput) : 'none'}
Observation: ${step.observation || 'none'}
Action: ${step.action}`
    ).join('\n\n')

    const contextInfo = context.current_workflow 
      ? `\nExisting workflow context: ${context.current_workflow.name} with ${context.current_workflow.nodes.length} nodes`
      : '\nNo existing workflow context'

    return `User Request: "${userInput}"${contextInfo}

Previous Steps:
${stepHistory || 'None yet'}

What should you do next? Think step by step and decide which tool to use (if any).
Remember to:
- Start with classifyIntent if you haven't already
- Use performDeepDiscovery to understand requirements
- Use researchIntegrations for unknown services
- Use generateWorkflow to create the final workflow
- Use applyWorkflowDelta to modify existing workflows

Respond in the exact format specified.`
  }

  private buildFinalAnswerPrompt(userInput: string, steps: PlannerStep[]): string {
    const stepSummary = steps.map((step, i) => 
      `${i + 1}. ${step.thought}${step.tool ? ` (used ${step.tool})` : ''}`
    ).join('\n')

    return `Based on the planning process, provide the final answer for: "${userInput}"

Planning Summary:
${stepSummary}

Generate a complete response that includes:
1. The workflow (if created)
2. Clear explanation of what was built
3. Next steps for the user
4. Any insights or recommendations

Format as JSON with these fields:
{
  "workflow": {...workflow object if created...},
  "project": {...project details if created...},
  "insights": {
    "summary": "What was accomplished",
    "complexity_analysis": "Analysis of the workflow complexity",
    "security_considerations": [...],
    "performance_tips": [...],
    "next_steps": [...]
  }
}`
  }

  private parseReActResponse(response: string): PlannerStep {
    const lines = response.split('\n').map(line => line.trim()).filter(line => line)
    
    let thought = ''
    let tool = undefined
    let toolInput = undefined
    let action: 'continue' | 'complete' | 'error' | 'clarify' = 'continue'

    for (const line of lines) {
      if (line.startsWith('Thought:')) {
        thought = line.replace('Thought:', '').trim()
      } else if (line.startsWith('Tool:')) {
        const toolValue = line.replace('Tool:', '').trim()
        tool = toolValue === 'none' ? undefined : toolValue
      } else if (line.startsWith('Tool Input:')) {
        const inputValue = line.replace('Tool Input:', '').trim()
        if (inputValue !== 'none') {
          try {
            toolInput = JSON.parse(inputValue)
          } catch (error) {
            console.error('Failed to parse tool input JSON:', inputValue, error)
            // Try to extract JSON from the line if it's malformed
            const jsonMatch = inputValue.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              try {
                toolInput = JSON.parse(jsonMatch[0])
              } catch {
                toolInput = inputValue
              }
            } else {
              toolInput = inputValue
            }
          }
        }
      } else if (line.startsWith('Action:')) {
        const actionValue = line.replace('Action:', '').trim()
        if (['continue', 'complete', 'error', 'clarify'].includes(actionValue)) {
          action = actionValue as 'continue' | 'complete' | 'error' | 'clarify'
        }
      }
    }

    return { thought, tool, toolInput, action }
  }

  private parseFinalAnswer(response: string): {
    workflow?: Workflow
    project?: WorkflowProject
    insights: {
      summary: string
      complexity_analysis: string
      security_considerations: string[]
      performance_tips: string[]
      next_steps: string[]
    }
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Fallback to structured response
      return {
        insights: {
          summary: response,
          complexity_analysis: 'Analysis completed through planning process',
          security_considerations: ['Review generated integrations for security'],
          performance_tips: ['Test workflow before production deployment'],
          next_steps: ['Deploy and monitor the workflow']
        }
      }
    } catch {
      return {
        insights: {
          summary: response,
          complexity_analysis: 'Unable to parse detailed analysis',
          security_considerations: [],
          performance_tips: [],
          next_steps: []
        }
      }
    }
  }

  private async executeTool(toolName: string, toolInput: unknown, onProgress?: (update: AgentStreamingUpdate) => void): Promise<string> {
    switch (toolName) {
      case 'classifyIntent':
        return await classifyIntent.func(toolInput as Parameters<typeof classifyIntent.func>[0])
      
      case 'performDeepDiscovery':
        onProgress?.({
          phase: 'analyzing',
          message: '🔍 Performing deep discovery analysis...',
          progress: 30
        })
        return await performDeepDiscovery.func(toolInput as Parameters<typeof performDeepDiscovery.func>[0])
      
      case 'researchIntegrations':
        onProgress?.({
          phase: 'researching',
          message: '🔧 Researching service integrations...',
          progress: 50
        })
        return await researchIntegrations.func(toolInput as Parameters<typeof researchIntegrations.func>[0])
      
      case 'generateWorkflow':
        onProgress?.({
          phase: 'generating',
          message: '⚡ Generating workflow structure...',
          progress: 70
        })
        return await generateWorkflow.func(toolInput as Parameters<typeof generateWorkflow.func>[0])
      
      case 'applyWorkflowDelta':
        onProgress?.({
          phase: 'generating',
          message: '🔄 Applying workflow modifications...',
          progress: 60
        })
        return await applyWorkflowDelta.func(toolInput as Parameters<typeof applyWorkflowDelta.func>[0])
      
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  }

  private summarizeToolOutput(output: string): string {
    try {
      const parsed = JSON.parse(output)
      
      if (parsed.intent) {
        return `Intent: ${parsed.intent} (${Math.round(parsed.confidence * 100)}% confidence)`
      }
      
      if (parsed.summary) {
        return `Discovery: ${parsed.summary}`
      }
      
      if (parsed.integrations) {
        return `Generated ${parsed.integrations.length} integrations`
      }
      
      if (parsed.workflow) {
        return `Created workflow with ${parsed.workflow.nodes?.length || 0} nodes`
      }
      
      if (parsed.changesApplied) {
        return `Applied ${parsed.changesApplied.length} changes`
      }
      
      return 'Tool executed successfully'
    } catch {
      return 'Tool completed'
    }
  }

  private calculateConfidence(steps: PlannerStep[]): number {
    const successfulSteps = steps.filter(step => step.observation && !step.observation.includes('Error'))
    const totalSteps = steps.length
    
    if (totalSteps === 0) return 0
    
    const baseConfidence = successfulSteps.length / totalSteps
    const toolUsageBonus = steps.filter(step => step.tool).length > 0 ? 0.1 : 0
    
    return Math.min(baseConfidence + toolUsageBonus, 1)
  }

  private getOrCreateConversation(conversationId: string): ConversationContext {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        id: conversationId,
        messages: [],
        session_metadata: {
          start_time: new Date(),
          total_iterations: 0,
          tools_used: []
        }
      })
    }
    return this.conversations.get(conversationId)!
  }
} 