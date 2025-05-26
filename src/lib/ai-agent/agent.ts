import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { 
  AgentConfig, 
  AgentResponse, 
  AgentStreamingUpdate,
  ConversationContext,
  ConversationMessage
} from './types'
import { agentConfig, promptTemplates } from './config'
import { performDeepDiscovery } from './tools/performDeepDiscovery'
import { researchIntegrations } from './tools/researchIntegrations'
import { generateWorkflow } from './tools/generateWorkflow'
import { classifyIntent } from './tools/classifyIntent'
import { applyWorkflowDelta } from './tools/applyWorkflowDelta'
import { FlowCraftPlannerAgent } from './agent-v2-simple'
import { Workflow } from '@/types/workflow'

export class FlowCraftAgent {
  private agent: Promise<AgentExecutor> | null = null
  private plannerAgent: FlowCraftPlannerAgent
  private conversations = new Map<string, ConversationContext>()
  private config: AgentConfig

  constructor(config: AgentConfig = agentConfig) {
    this.config = config
    this.plannerAgent = new FlowCraftPlannerAgent({
      model: {
        modelName: config.model.modelName,
        temperature: config.model.temperature,
        maxTokens: config.model.maxTokens || 4000
      },
      maxIterations: config.maxIterations,
      verbose: config.verbose
    })
    // Don't create agent immediately - wait until it's needed
  }

  private getAgent(): Promise<AgentExecutor> {
    if (!this.agent) {
      this.agent = this.createAgent()
    }
    return this.agent
  }

  private async createAgent(): Promise<AgentExecutor> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.')
    }

    const llm = new ChatOpenAI({
      model: this.config.model.modelName,
      temperature: this.config.model.temperature,
      maxTokens: this.config.model.maxTokens,
      apiKey: apiKey,
      // @ts-expect-error - useResponsesApi property may not be in TS interface yet
      useResponsesApi: true
    })

    const tools = [
      classifyIntent,
      performDeepDiscovery,
      researchIntegrations,
      generateWorkflow,
      applyWorkflowDelta
    ]

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', promptTemplates.systemPrompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad')
    ])

    const agent = await createOpenAIFunctionsAgent({
      llm,
      tools,
      prompt
    })

    return new AgentExecutor({
      agent,
      tools,
      verbose: this.config.verbose,
      maxIterations: this.config.maxIterations
    })
  }

  /**
   * Generate a complete workflow using the new planner agent (ReAct-style)
   */
  async generateWorkflowWithPlanner(
    prompt: string,
    onProgress?: (update: AgentStreamingUpdate) => void,
    conversationId: string = 'default'
  ): Promise<AgentResponse> {
    const result = await this.plannerAgent.planAndExecute(prompt, onProgress, conversationId)
    
    // Ensure compatibility with existing AgentResponse type
    return {
      success: result.success,
      result: result.result,
      metadata: {
        execution_time: result.metadata.execution_time,
        tools_used: result.metadata.tools_used,
        iterations: result.metadata.iterations || 0,
        confidence_score: result.metadata.confidence_score || 0
      },
      error: result.error
    }
  }

  /**
   * Generate a complete workflow with Lovable-style instant feedback (legacy method)
   */
  async generateLovableWorkflow(
    prompt: string,
    onProgress?: (update: AgentStreamingUpdate) => void,
    conversationId: string = 'default'
  ): Promise<AgentResponse> {
    const startTime = Date.now()
    const toolsUsed: string[] = []
    let iterations = 0

    try {
      // Initialize conversation context
      const context = this.getOrCreateConversation(conversationId)
      context.messages.push({
        role: 'user',
        content: prompt,
        timestamp: new Date()
      })

      // Phase 1: Deep Discovery
      onProgress?.({
        phase: 'analyzing',
        message: '🔍 Analyzing your automation requirements with AI...',
        progress: 10,
        details: { estimated_time: '30-60 seconds' }
      })

      const discoveryInput = {
        prompt,
        context: {
          existing_workflows: context.current_workflow ? [context.current_workflow.name] : [],
          user_preferences: context.user_preferences || {},
          constraints: []
        }
      }

      const discoveryResult = await performDeepDiscovery.func(discoveryInput)
      const discovery = JSON.parse(discoveryResult)
      toolsUsed.push('performDeepDiscovery')
      iterations++

      onProgress?.({
        phase: 'analyzing',
        message: `✅ Found ${discovery.identifiedTriggers.length} triggers and ${discovery.identifiedActions.length} actions`,
        progress: 25,
        toolUsed: 'performDeepDiscovery',
        toolOutput: `Complexity: ${discovery.complexity}, Integrations: ${discovery.requiredIntegrations.join(', ')}`,
        details: { 
          nodes_generated: discovery.identifiedTriggers.length + discovery.identifiedActions.length,
          estimated_time: '20-40 seconds'
        }
      })

      // Phase 2: Integration Research
      onProgress?.({
        phase: 'researching',
        message: '🔧 Researching integrations and building connections...',
        progress: 40,
        details: { integrations_found: discovery.requiredIntegrations.length }
      })

      const integrationInput = {
        services: discovery.requiredIntegrations,
        requirements: {
          authentication_types: ['api_key', 'oauth2'],
          required_operations: discovery.identifiedActions.map((action: { operation: string }) => action.operation),
          data_formats: ['json', 'xml']
        }
      }

      const integrationResult = await researchIntegrations.func(integrationInput)
      const integrations = JSON.parse(integrationResult)
      toolsUsed.push('researchIntegrations')
      iterations++

      onProgress?.({
        phase: 'researching',
        message: `🚀 Generated ${integrations.integrations.length} production-ready integrations`,
        progress: 60,
        toolUsed: 'researchIntegrations',
        toolOutput: `Services: ${integrations.integrations.map((i: { serviceName: string }) => i.serviceName).join(', ')}`,
        details: { integrations_found: integrations.integrations.length }
      })

      // Phase 3: Workflow Generation
      onProgress?.({
        phase: 'generating',
        message: '⚡ Generating workflow nodes and connections...',
        progress: 80,
        preview: {
          workflow_snippet: `Building ${discovery.identifiedTriggers.length} triggers → ${discovery.identifiedActions.length} actions`,
        }
      })

      const workflowInput = {
        discovery,
        integrations: integrations.integrations,
        preferences: {
          layout: 'vertical' as const,
          error_handling: 'advanced' as const,
          monitoring: true,
          testing: true
        }
      }

      const workflowResult = await generateWorkflow.func(workflowInput)
      const workflowData = JSON.parse(workflowResult)
      toolsUsed.push('generateWorkflow')
      iterations++

      onProgress?.({
        phase: 'complete',
        message: '🎉 Your workflow automation is ready!',
        progress: 100,
        toolUsed: 'generateWorkflow',
        details: {
          nodes_generated: workflowData.workflow.nodes.length,
          integrations_found: integrations.integrations.length,
          tests_created: workflowData.project.testSuite.length
        }
      })

      // Update conversation context
      context.current_workflow = workflowData.workflow
      context.messages.push({
        role: 'assistant',
        content: `Successfully generated workflow: ${workflowData.workflow.name}`,
        timestamp: new Date(),
        metadata: {
          tool_calls: toolsUsed,
          confidence_score: this.calculateConfidenceScore(discovery),
          workflow_changes: [`Created new workflow with ${workflowData.workflow.nodes.length} nodes`]
        }
      })

      const executionTime = Date.now() - startTime

      return {
        success: true,
        result: {
          workflow: workflowData.workflow,
          project: workflowData.project,
          insights: {
            complexity_analysis: `This ${discovery.complexity} workflow includes ${workflowData.workflow.nodes.length} nodes and ${integrations.integrations.length} integrations.`,
            security_considerations: workflowData.securityChecklist || [],
            performance_tips: [
              'Consider parallel execution for independent actions',
              'Implement caching for repeated API calls',
              'Add retry logic with exponential backoff'
            ],
            next_steps: workflowData.deploymentInstructions || []
          }
        },
        metadata: {
          execution_time: executionTime,
          tools_used: toolsUsed,
          iterations,
          confidence_score: this.calculateConfidenceScore(discovery)
        }
      }
    } catch (error) {
      console.error('Agent workflow generation failed:', error)
      
      return {
        success: false,
        result: {},
        metadata: {
          execution_time: Date.now() - startTime,
          tools_used: toolsUsed,
          iterations,
          confidence_score: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Enhanced conversational workflow modification using structured deltas
   */
  async modifyWorkflowConversational(
    workflow: Workflow,
    userMessage: string,
    conversationId: string = 'default'
  ): Promise<{
    response: string
    updatedWorkflow: Workflow
    changes: string[]
    suggestions: string[]
  }> {
    try {
      const context = this.getOrCreateConversation(conversationId)
      context.current_workflow = workflow
      context.messages.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      })

      // First, classify the intent
      const intentResult = await classifyIntent.func({
        userMessage,
        context: {
          hasExistingWorkflow: true,
          conversationHistory: context.messages.slice(-3).map(m => m.content),
          userPreferences: context.user_preferences || {}
        }
      })

      const intent = JSON.parse(intentResult)

      // If it's a modification intent, use the planner to generate structured changes
      if (intent.intent === 'modify_workflow') {
        // Use planner agent to understand the modification and generate deltas
        const plannerPrompt = `The user wants to modify their existing workflow: "${workflow.name}"

Current workflow structure:
- ${workflow.nodes.length} nodes: ${workflow.nodes.map(n => `${n.data.label} (${n.type})`).join(', ')}
- ${workflow.edges.length} connections

User modification request: "${userMessage}"

Please analyze what changes are needed and generate structured workflow deltas to apply these modifications.`

        const plannerResult = await this.plannerAgent.planAndExecute(plannerPrompt, undefined, conversationId)
        
        if (plannerResult.success && plannerResult.result.workflow) {
          // If planner generated a new workflow, create deltas to transform current workflow
          const updatedWorkflow = plannerResult.result.workflow
          
                     return {
             response: `I've analyzed your request and updated the workflow. The modifications have been applied successfully.`,
             updatedWorkflow,
             changes: [`Updated workflow based on: ${userMessage}`],
             suggestions: plannerResult.result.insights?.next_steps || ['Test the updated workflow', 'Review the changes before deploying']
           }
        }
      }

             // Fallback to conversational response for other intents
       const response = `I understand you want to ${intent.intent.replace('_', ' ')} the workflow. ${intent.reasoning} Let me help you with that.`
       
       context.messages.push({
         role: 'assistant',
         content: response,
         timestamp: new Date(),
         metadata: {
           tool_calls: [],
           confidence_score: intent.confidence,
           workflow_changes: []
         }
       })

       const suggestions = intent.intent === 'analyze_workflow' 
         ? ['Review workflow performance metrics', 'Check for optimization opportunities']
         : intent.intent === 'optimize_workflow'
         ? ['Consider parallel execution', 'Add error handling', 'Implement caching']
         : ['Be more specific about the changes you want', 'Describe the desired outcome']

       return {
         response,
         updatedWorkflow: workflow,
         changes: [],
         suggestions
       }
    } catch (error) {
      console.error('Conversational modification failed:', error)
      
      const fallbackResponse = `I understand you want to modify the workflow. Let me help you with that. Could you be more specific about what you'd like to change?`
      
      return {
        response: fallbackResponse,
        updatedWorkflow: workflow,
        changes: [],
        suggestions: ['Please be more specific about the changes you want', 'Try describing what new functionality you need']
      }
    }
  }

  /**
   * Get conversation context or create new one
   */
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

  /**
   * Convert conversation messages to LangChain format
   */
  private convertToLangChainMessages(messages: ConversationMessage[]): BaseMessage[] {
    return messages.map(msg => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content)
      } else {
        return new AIMessage(msg.content)
      }
    })
  }

  /**
   * Calculate confidence score based on discovery results
   */
  private calculateConfidenceScore(discovery: { 
    requiredIntegrations: string[]
    identifiedTriggers: Array<{ confidence: number }>
    identifiedActions: Array<{ confidence: number }>
    complexity: string 
  }): number {
    let score = 70 // Base score

    // Boost for known services
    const knownServices = ['gmail', 'slack', 'notion', 'airtable', 'stripe', 'webhook']
    const knownCount = discovery.requiredIntegrations.filter((service: string) => 
      knownServices.includes(service.toLowerCase())
    ).length
    score += (knownCount / discovery.requiredIntegrations.length) * 20

    // Boost for high confidence triggers/actions
    const avgTriggerConfidence = discovery.identifiedTriggers.reduce((sum: number, t: { confidence: number }) => sum + t.confidence, 0) / discovery.identifiedTriggers.length
    const avgActionConfidence = discovery.identifiedActions.reduce((sum: number, a: { confidence: number }) => sum + a.confidence, 0) / discovery.identifiedActions.length
    score += ((avgTriggerConfidence + avgActionConfidence) / 2) * 0.1

    // Penalty for complexity
    const complexityPenalty = {
      simple: 0,
      standard: -5,
      advanced: -10,
      enterprise: -15
    }
    score += complexityPenalty[discovery.complexity as keyof typeof complexityPenalty] || 0

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Extract changes from agent response
   */
  private extractChangesFromResponse(response: string): string[] {
    // Simple extraction - in a real implementation, you'd use more sophisticated parsing
    const changes: string[] = []
    if (response.toLowerCase().includes('add')) {
      changes.push('Adding new node or functionality')
    }
    if (response.toLowerCase().includes('remove') || response.toLowerCase().includes('delete')) {
      changes.push('Removing existing component')
    }
    if (response.toLowerCase().includes('modify') || response.toLowerCase().includes('change')) {
      changes.push('Modifying existing configuration')
    }
    return changes
  }

  /**
   * Extract suggestions from agent response
   */
  private extractSuggestionsFromResponse(response: string): string[] {
    // Simple extraction - in a real implementation, you'd use more sophisticated parsing
    const suggestions: string[] = []
    if (response.toLowerCase().includes('consider')) {
      suggestions.push('Consider the suggested improvements')
    }
    if (response.toLowerCase().includes('recommend')) {
      suggestions.push('Review the recommendations provided')
    }
    suggestions.push('Test the changes before deploying')
    return suggestions
  }

  /**
   * Get conversation history
   */
  getConversation(conversationId: string): ConversationContext | undefined {
    return this.conversations.get(conversationId)
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId)
  }

  /**
   * Get agent statistics
   */
  getStats(): { 
    totalConversations: number
    totalToolCalls: number
    averageConfidence: number 
  } {
    const conversations = Array.from(this.conversations.values())
    const totalToolCalls = conversations.reduce((sum, conv) => 
      sum + (conv.session_metadata?.tools_used.length || 0), 0
    )
    
    return {
      totalConversations: conversations.length,
      totalToolCalls,
      averageConfidence: 85 // Placeholder - would calculate from actual data
    }
  }
}

/**
 * Create a new FlowCraft agent instance
 */
export function createAgent(config?: Partial<AgentConfig>): FlowCraftAgent {
  const finalConfig = { ...agentConfig, ...config }
  return new FlowCraftAgent(finalConfig)
} 