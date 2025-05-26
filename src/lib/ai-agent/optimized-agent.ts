import { ChatOpenAI } from '@langchain/openai'
import { AgentExecutor } from 'langchain/agents'
import { createOpenAIToolsAgent } from 'langchain/agents'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages'
import { RunnableConfig } from '@langchain/core/runnables'
import { StructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

// Improved types - return objects instead of JSON strings
export interface ToolResult<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: Record<string, any>
}

// Streamlined tool interface
export abstract class FlowCraftTool extends StructuredTool {
  abstract execute(input: any): Promise<ToolResult>
  
  async _call(input: any): Promise<string> {
    try {
      const result = await this.execute(input)
      if (!result.success) {
        throw new Error(result.error || 'Tool execution failed')
      }
      return JSON.stringify(result.data)
    } catch (error) {
      console.error(`Tool ${this.name} failed:`, error)
      throw error
    }
  }
}

// Example optimized tool
export class IntentClassifierTool extends FlowCraftTool {
  name = 'classifyIntent'
  description = 'Classifies user intent for workflow operations'
  
  schema = z.object({
    userMessage: z.string(),
    context: z.object({
      hasExistingWorkflow: z.boolean().default(false),
      conversationHistory: z.array(z.string()).default([])
    }).default({
      hasExistingWorkflow: false,
      conversationHistory: []
    })
  })

  constructor(private llm: ChatOpenAI) {
    super()
  }

  async execute(input: z.infer<typeof this.schema>): Promise<ToolResult> {
    try {
      const prompt = `Classify this user intent: "${input.userMessage}"
      
Categories: create_workflow, modify_workflow, optimize_workflow, analyze_workflow, debug_workflow

Return JSON with: intent, confidence (0-1), reasoning`

      const response = await this.llm.invoke([
        { role: 'system', content: 'You are an intent classifier. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ])

      const parsed = JSON.parse(response.content as string)
      
      return {
        success: true,
        data: {
          intent: parsed.intent,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
          subIntent: parsed.subIntent,
          extractedEntities: parsed.extractedEntities || {}
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Intent classification failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
}

export class WorkflowDiscoveryTool extends FlowCraftTool {
  name = 'performDeepDiscovery'
  description = 'Analyzes automation requirements and extracts workflow structure'
  
  schema = z.object({
    prompt: z.string(),
    context: z.object({
      existing_workflows: z.array(z.string()).default([]),
      user_preferences: z.record(z.string(), z.any()).default({}),
      constraints: z.array(z.string()).default([])
    }).default({
      existing_workflows: [],
      user_preferences: {},
      constraints: []
    })
  })

  constructor(private llm: ChatOpenAI) {
    super()
  }

  async execute(input: z.infer<typeof this.schema>): Promise<ToolResult> {
    try {
      const prompt = `Analyze this automation request: "${input.prompt}"
      
Extract:
- Triggers (what starts the workflow)
- Actions (what the workflow does)
- Required services/integrations
- Complexity level
- Risk factors

Return detailed JSON analysis.`

      const response = await this.llm.invoke([
        { role: 'system', content: 'You are a workflow analysis expert. Return detailed JSON analysis.' },
        { role: 'user', content: prompt }
      ])

      const analysis = JSON.parse(response.content as string)
      
      return {
        success: true,
        data: analysis,
        metadata: {
          analysisTime: new Date().toISOString(),
          complexityScore: this.calculateComplexityScore(analysis)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Discovery analysis failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private calculateComplexityScore(analysis: any): number {
    // Simple complexity scoring logic
    let score = 1
    if (Array.isArray(analysis.identifiedTriggers) && analysis.identifiedTriggers.length > 1) score += 0.5
    if (Array.isArray(analysis.identifiedActions) && analysis.identifiedActions.length > 3) score += 0.5
    if (Array.isArray(analysis.requiredIntegrations) && analysis.requiredIntegrations.length > 2) score += 1
    return Math.min(score, 5)
  }
}

export class IntegrationResearchTool extends FlowCraftTool {
  name = 'researchIntegrations'
  description = 'Researches and generates integration code for specified services'
  
  schema = z.object({
    services: z.array(z.string()),
    requirements: z.object({
      authentication_types: z.array(z.string()).default([]),
      required_operations: z.array(z.string()).default([]),
      data_formats: z.array(z.string()).default([])
    }).default({
      authentication_types: [],
      required_operations: [],
      data_formats: []
    })
  })

  constructor(private llm: ChatOpenAI) {
    super()
  }

  async execute(input: z.infer<typeof this.schema>): Promise<ToolResult> {
    try {
      const prompt = `Research integrations for these services: ${input.services.join(', ')}
      
Requirements: ${JSON.stringify(input.requirements || {}, null, 2)}

Generate TypeScript integration code with:
- Authentication handling
- Error handling and retries
- Rate limiting
- Type definitions

Return JSON with integrations array.`

      const response = await this.llm.invoke([
        { role: 'system', content: 'You are an integration expert. Generate production-ready TypeScript code.' },
        { role: 'user', content: prompt }
      ])

      const integrations = JSON.parse(response.content as string)
      
      return {
        success: true,
        data: integrations,
        metadata: {
          servicesCount: input.services.length,
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Integration research failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
}

export class WorkflowGeneratorTool extends FlowCraftTool {
  name = 'generateWorkflow'
  description = 'Creates complete workflow structures with nodes, edges, and project files'
  
  schema = z.object({
    discovery: z.any(),
    integrations: z.array(z.object({
      serviceName: z.string(),
      className: z.string(),
      code: z.string()
    })),
    preferences: z.object({
      layout: z.enum(['vertical', 'horizontal', 'auto']).default('vertical'),
      error_handling: z.enum(['basic', 'advanced', 'enterprise']).default('advanced'),
      monitoring: z.boolean().default(true),
      testing: z.boolean().default(true)
    }).default({
      layout: 'vertical',
      error_handling: 'advanced',
      monitoring: true,
      testing: true
    })
  })

  constructor(private llm: ChatOpenAI) {
    super()
  }

  async execute(input: z.infer<typeof this.schema>): Promise<ToolResult> {
    try {
      const prompt = `Generate a complete workflow from this analysis:

Discovery: ${JSON.stringify(input.discovery, null, 2)}
Integrations: ${JSON.stringify(input.integrations, null, 2)}
Preferences: ${JSON.stringify(input.preferences || {}, null, 2)}

Create a complete workflow with:
- Nodes and edges with proper layout
- Project structure with all necessary files
- Test suite covering key scenarios
- Monitoring and alerting configuration
- Deployment instructions
- Security checklist

Return JSON with workflow and project structure.`

      const response = await this.llm.invoke([
        { role: 'system', content: 'You are a workflow architect. Generate production-ready workflow systems.' },
        { role: 'user', content: prompt }
      ])

      const workflow = JSON.parse(response.content as string)
      
      return {
        success: true,
        data: workflow,
        metadata: {
          nodesGenerated: workflow.workflow?.nodes?.length || 0,
          integrationsUsed: input.integrations.length,
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Workflow generation failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
}

// Main optimized agent
export class OptimizedFlowCraftAgent {
  private agent: Promise<AgentExecutor>
  private llm: ChatOpenAI
  private tools: FlowCraftTool[]

  constructor(config: {
    apiKey: string
    model?: string
    temperature?: number
    verbose?: boolean
  }) {
    this.llm = new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.model || 'gpt-4o',
      temperature: config.temperature || 0.3,
      maxTokens: 4000
    })

    // Initialize tools
    this.tools = [
      new IntentClassifierTool(this.llm),
      new WorkflowDiscoveryTool(this.llm),
      new IntegrationResearchTool(this.llm),
      new WorkflowGeneratorTool(this.llm)
    ]

    this.agent = this.createAgent()
  }

  private async createAgent(): Promise<AgentExecutor> {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', this.getSystemPrompt()],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad')
    ])

    const agent = await createOpenAIToolsAgent({
      llm: this.llm,
      tools: this.tools,
      prompt
    })

    return new AgentExecutor({
      agent,
      tools: this.tools,
      verbose: true,
      maxIterations: 10,
      handleParsingErrors: true,
      returnIntermediateSteps: true
    })
  }

  private getSystemPrompt(): string {
    return `You are FlowCraft AI, an expert automation workflow builder.

Your capabilities:
- Analyze user requests to understand automation needs
- Design and generate complete workflow systems
- Integrate with various services and APIs
- Optimize workflows for performance and reliability

Process:
1. First, classify the user's intent
2. If creating a workflow, perform deep discovery analysis
3. Research required integrations
4. Generate the complete workflow structure
5. Provide deployment guidance

Always be helpful, accurate, and provide production-ready solutions.

Available tools: ${this.tools.map(t => t.name).join(', ')}`
  }

  // Streamlined workflow generation
  async generateWorkflow(
    prompt: string,
    options: {
      conversationId?: string
      onProgress?: (update: ProgressUpdate) => void
    } = {}
  ): Promise<WorkflowResult> {
    const startTime = Date.now()
    const { onProgress } = options

    try {
      onProgress?.({
        phase: 'analyzing',
        message: 'Analyzing your automation request...',
        progress: 10
      })

      // Execute the agent with proper message handling
      const agent = await this.agent
      const result = await agent.invoke({
        input: `Create a complete automation workflow for: ${prompt}`,
        chat_history: []
      })

      onProgress?.({
        phase: 'complete',
        message: 'Workflow generation complete!',
        progress: 100
      })

      return {
        success: true,
        workflow: this.parseWorkflowFromResult(result.output),
        metadata: {
          executionTime: Date.now() - startTime,
          intermediateSteps: result.intermediateSteps?.length || 0,
          toolsUsed: this.extractToolsUsed(result.intermediateSteps)
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          executionTime: Date.now() - startTime,
          intermediateSteps: 0,
          toolsUsed: []
        }
      }
    }
  }

  // Conversation handling
  async processMessage(
    message: string,
    conversationHistory: BaseMessage[] = []
  ): Promise<string> {
    try {
      const agent = await this.agent
      const result = await agent.invoke({
        input: message,
        chat_history: conversationHistory
      })

      return result.output
    } catch (error) {
      console.error('Message processing failed:', error)
      return 'I encountered an error processing your request. Please try rephrasing or being more specific.'
    }
  }

  // Helper methods
  private parseWorkflowFromResult(output: string): any {
    try {
      // Try to extract JSON from the agent's response
      const jsonMatch = output.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return null
    } catch {
      return null
    }
  }

  private extractToolsUsed(intermediateSteps: any[]): string[] {
    if (!intermediateSteps) return []
    
    return intermediateSteps
      .map(step => step.action?.tool)
      .filter(Boolean)
  }

  // Add tool dynamically
  addTool(tool: FlowCraftTool): void {
    this.tools.push(tool)
    this.agent = this.createAgent() // Recreate agent with new tools
  }

  // Get agent statistics
  getStats(): AgentStats {
    return {
      toolCount: this.tools.length,
      availableTools: this.tools.map(t => ({
        name: t.name,
        description: t.description
      }))
    }
  }
}

// Supporting types
interface ProgressUpdate {
  phase: 'analyzing' | 'researching' | 'generating' | 'complete'
  message: string
  progress: number
  details?: Record<string, any>
}

interface WorkflowResult {
  success: boolean
  workflow?: any
  error?: string
  metadata: {
    executionTime: number
    intermediateSteps: number
    toolsUsed: string[]
  }
}

interface AgentStats {
  toolCount: number
  availableTools: Array<{
    name: string
    description: string
  }>
}

// Usage example
export function createOptimizedAgent(apiKey: string): OptimizedFlowCraftAgent {
  return new OptimizedFlowCraftAgent({
    apiKey,
    model: 'gpt-4o',
    temperature: 0.3,
    verbose: process.env.NODE_ENV === 'development'
  })
}

// Streaming wrapper for real-time updates
export class StreamingFlowCraftAgent extends OptimizedFlowCraftAgent {
  async generateWorkflowStream(
    prompt: string,
    onUpdate: (update: ProgressUpdate) => void
  ): Promise<WorkflowResult> {
    // Implement streaming with proper progress updates
    return this.generateWorkflow(prompt, { onProgress: onUpdate })
  }
} 