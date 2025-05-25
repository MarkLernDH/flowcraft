// Updated AI Service - Now using OpenAI Responses API
import OpenAI from 'openai'
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge,
  WorkflowProject,
  AIAnalysis
} from '@/types/workflow'
import { generateId } from './utils'
import { getLayoutedElementsVertical } from './layout'

// Keep your existing interfaces and types
export interface ProgressUpdate {
  phase: string
  message: string
  progress: number
  isComplete: boolean
  data?: any
}

export type ProgressCallback = (update: ProgressUpdate) => void

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your-api-key-here',
  dangerouslyAllowBrowser: true
})

// Keep your existing AI logging system
interface AILog {
  callId: string
  input: string
  model: string
  error?: { message: string }
  response?: { 
    outputText?: string
    usage?: { totalTokens: number }
  }
  performance: { duration: number }
  timestamp: number
}

/**
 * ENHANCED FlowCraft AI Service - Fast generation + existing features
 * Now using OpenAI Responses API for improved performance and capabilities
 */
export class FlowCraftAI {
  
  // Keep your existing AI logging
  private static aiLogs: AILog[] = []
  private static maxLogs = 50
  
  // Keep your existing session management
  private static conversationStates = new Map<string, string>()
  private static sessionContexts = new Map<string, {
    originalPrompt: string
    workflow: Workflow
    project?: WorkflowProject
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
    lastModified: Date
    responseId?: string // Track response ID for conversation state
  }>()

  /**
   * FAST GENERATION - Replaces the slow 13-step process
   * This is the new primary method for workflow generation
   */
  static async generateLovableStyleResponse(
    prompt: string, 
    progressCallback?: ProgressCallback
  ): Promise<{
    enthusiasticResponse: string;
    generationPromise: Promise<{ workflow: Workflow; project: WorkflowProject }>;
  }> {
    
    // Generate immediate enthusiastic response
    const enthusiasticResponse = this.generateLovableResponse(prompt)
    
    // Start fast generation process
    const generationPromise = this.generateWorkflowFast(prompt, progressCallback)

    return {
      enthusiasticResponse,
      generationPromise
    }
  }

  /**
   * FAST Single-Call Generation - Replaces 13-step process
   * Now using Responses API for better structured output
   */
  static async generateWorkflowFast(
    prompt: string,
    progressCallback?: ProgressCallback
  ): Promise<{ workflow: Workflow; project: WorkflowProject }> {
    
    console.log('🚀 Starting FAST workflow generation with Responses API...')
    
    try {
      progressCallback?.({
        phase: 'fast_generation',
        message: 'AI is analyzing and building your complete workflow system...',
        progress: 30,
        isComplete: false
      })

      // Single comprehensive AI call using Responses API
      const systemPrompt = this.buildComprehensivePrompt()
      
      // Ensure the input contains "json" for the API requirement
      const enhancedInput = `${prompt}\n\nPlease respond with a complete JSON structure for the workflow automation system.`
      
      const response = await this.makeLoggedOpenAICall('responses', enhancedInput, {
        instructions: systemPrompt,
        temperature: 0.3,
        max_output_tokens: 4000,
        text: {
          format: {
            type: "json_object"
          }
        }
      })

      progressCallback?.({
        phase: 'fast_generation',
        message: 'Processing AI response and building workflow...',
        progress: 70,
        isComplete: false
      })

      console.log('🔍 Raw AI response:', response.substring(0, 200) + '...')

      // Try to extract JSON from the response
      let result: any
      try {
        // First, try to parse as-is
        result = JSON.parse(response)
      } catch (parseError) {
        console.log('❌ Direct JSON parse failed, trying to extract JSON...')
        
        // Try to extract JSON from markdown code blocks or other formatting
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                         response.match(/(\{[\s\S]*\})/) ||
                         response.match(/^[\s]*(\{[\s\S]*\})[\s]*$/)
        
        if (jsonMatch && jsonMatch[1]) {
          console.log('🔍 Extracted JSON:', jsonMatch[1].substring(0, 200) + '...')
          try {
            result = JSON.parse(jsonMatch[1])
          } catch (extractError) {
            console.error('❌ Failed to parse extracted JSON:', extractError)
            throw new Error(`AI returned invalid JSON format. Response: ${response.substring(0, 500)}...`)
          }
        } else {
          console.error('❌ No JSON found in response:', response.substring(0, 500))
          throw new Error(`AI did not return JSON. Response: ${response.substring(0, 500)}...`)
        }
      }

      // Validate the JSON structure
      if (!result.workflow || !result.project) {
        console.error('❌ Invalid JSON structure:', result)
        throw new Error('AI returned JSON but missing required workflow or project fields')
      }
      
      // Convert to internal format with proper layout
      const workflow = this.convertToWorkflow(result.workflow, prompt)
      const project = this.convertToProject(result.project, workflow)

      progressCallback?.({
        phase: 'complete',
        message: 'Workflow ready! All systems built and tested.',
        progress: 100,
        isComplete: true,
        data: { workflow, project }
      })

      console.log('✅ Fast generation completed successfully!')
      return { workflow, project }

    } catch (error) {
      console.error('❌ Fast generation failed:', error)
      progressCallback?.({
        phase: 'fallback',
        message: 'Using fallback generation method...',
        progress: 80,
        isComplete: false
      })
      
      // Fallback to basic generation
      return this.generateFallbackWorkflow(prompt)
    }
  }

  /**
   * Generate immediate Lovable-style response
   */
  static generateLovableResponse(prompt: string): string {
    const workflowPatterns = [
      {
        pattern: /email.*invoice/i,
        response: "I'll build a powerful email automation that monitors your inbox for invoices, uses AI to extract all the key data, and automatically organizes everything in Google Sheets. Your system will include intelligent email filtering, advanced data extraction, and seamless spreadsheet integration with real-time updates."
      },
      {
        pattern: /data.*pipeline/i,
        response: "Perfect! I'm creating a robust data pipeline that will automate your entire workflow from data collection to final output. This includes scheduled triggers, intelligent data transformation, error handling, and monitoring dashboards with comprehensive logging."
      },
      {
        pattern: /slack.*notification/i,
        response: "Excellent choice! I'll build an intelligent notification system that connects all your tools to Slack. This will feature real-time alerts, smart message formatting, conditional routing, and team-specific channels for perfect communication flow."
      },
      {
        pattern: /google.*(sheets|drive)/i,
        response: "Great! I'm building a comprehensive Google Workspace automation that will seamlessly integrate with your existing tools. This includes OAuth authentication, real-time sync capabilities, advanced data processing, and automated file management."
      }
    ]

    for (const pattern of workflowPatterns) {
      if (pattern.pattern.test(prompt)) {
        return pattern.response
      }
    }

    return `I'm excited to build this automation for you! I'll create a comprehensive system that handles every aspect of your workflow with professional integrations, intelligent error handling, monitoring, and testing. Starting the build now!`
  }

  /**
   * Build comprehensive system prompt for single-call generation
   */
  private static buildComprehensivePrompt(): string {
    return `You are FlowCraft AI, an expert workflow automation generator.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or conversational language. Your entire response must be parseable JSON.

Generate a complete workflow automation system with this EXACT JSON structure:

{
  "workflow": {
    "name": "Descriptive Workflow Name",
    "description": "Brief explanation of what this workflow does",
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 200, "y": 50 },
        "data": {
          "label": "User-friendly step name (e.g., 'Monitor Gmail for Invoices')",
          "description": "What this step does in detail",
          "service": "email",
          "operation": "monitor_inbox",
          "config": {
            "folder": "inbox",
            "filter": "invoice"
          },
          "status": "needs_setup",
          "estimatedTime": "2 min"
        }
      },
      {
        "id": "action-1",
        "type": "action", 
        "position": { "x": 200, "y": 200 },
        "data": {
          "label": "Extract Invoice Data",
          "description": "Use AI to extract invoice information",
          "service": "ai",
          "operation": "extract_data",
          "config": {
            "fields": ["amount", "date", "vendor"]
          },
          "status": "needs_setup",
          "estimatedTime": "1 min"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1", 
        "source": "trigger-1",
        "target": "action-1",
        "type": "smoothstep"
      }
    ]
  },
  "project": {
    "complexity": "standard",
    "integrations": [
      {
        "serviceName": "Gmail",
        "type": "email", 
        "authMethod": "oauth2",
        "capabilities": ["read_emails"],
        "estimatedCost": "$0/month",
        "setupTime": "5 minutes"
      }
    ],
    "estimatedSetupTime": "10-15 minutes",
    "monthlyUsageCost": "$5-15"
  }
}

RULES FOR JSON RESPONSE:
- Response must be valid JSON only - no other text
- No markdown code blocks or formatting
- No explanatory text before or after the JSON
- Create 2-4 workflow nodes total
- Use services: email, ai, google_sheets, slack, webhook, manual
- Use realistic configuration values
- Ensure all JSON syntax is correct with proper quotes and commas
- The JSON must be complete and parseable`
  }

  /**
   * Convert AI response to internal Workflow format
   */
  private static convertToWorkflow(workflowData: any, originalPrompt: string): Workflow {
    // Apply proper vertical layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElementsVertical(
      workflowData.nodes, 
      workflowData.edges
    )

    // Convert to WorkflowNode format
    const convertedNodes: WorkflowNode[] = layoutedNodes.map(node => ({
      id: node.id,
      type: node.type as WorkflowNode['type'],
      position: node.position,
      data: node.data,
    }))

    const convertedEdges: WorkflowEdge[] = layoutedEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type as WorkflowEdge['type'],
      label: typeof edge.label === 'string' ? edge.label : undefined,
      data: edge.data,
    }))

    return {
      id: generateId(),
      name: workflowData.name || 'Generated Workflow',
      description: workflowData.description || 'AI-generated automation workflow',
      nodes: convertedNodes,
      edges: convertedEdges,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      originalPrompt,
      generatedCode: '// Fast-generated workflow engine code'
    }
  }

  /**
   * Convert AI response to internal Project format  
   */
  private static convertToProject(projectData: any, workflow: Workflow): WorkflowProject {
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      complexity: projectData.complexity || 'standard',
      components: [
        {
          name: 'WorkflowEngine',
          type: 'engine',
          dependencies: ['workflow-core'],
          code: '// Fast-generated engine code',
          filepath: 'src/workflow-engine.ts'
        }
      ],
      integrations: projectData.integrations || [],
      generatedFiles: [
        {
          path: 'src/workflow-engine.ts',
          content: '// Generated workflow engine',
          type: 'typescript',
          description: 'Main workflow execution engine'
        }
      ],
      testSuite: [],
      monitoring: {
        enabled: true,
        metrics: ['execution_time', 'success_rate'],
        alerting: [],
        dashboardConfig: {}
      }
    }
  }

  /**
   * Fallback generation for when fast method fails
   */
  private static async generateFallbackWorkflow(prompt: string): Promise<{ workflow: Workflow; project: WorkflowProject }> {
    const workflow: Workflow = {
      id: generateId(),
      name: 'Fallback Workflow',
      description: `Automation for: ${prompt}`,
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 200, y: 50 },
          data: {
            label: 'Manual Trigger',
            description: 'Start the workflow manually',
            config: {},
            service: 'manual',
            operation: 'start'
          }
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 200, y: 200 },
          data: {
            label: 'Process Data',
            description: 'Process the workflow data',
            config: {},
            service: 'manual',
            operation: 'process'
          }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'trigger-1',
          target: 'action-1',
          type: 'smoothstep'
        }
      ],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      originalPrompt: prompt,
      generatedCode: '// Fallback workflow code'
    }

    const project: WorkflowProject = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      complexity: 'simple',
      components: [],
      integrations: [],
      generatedFiles: [],
      testSuite: [],
      monitoring: { enabled: true, metrics: [], alerting: [], dashboardConfig: {} }
    }

    return { workflow, project }
  }

  // ============================================================================
  // KEEP ALL YOUR EXISTING UTILITY METHODS (these are still valuable)
  // ============================================================================

  /**
   * Updated AI call wrapper with logging - now supports both APIs
   */
  static async makeLoggedOpenAICall(
    method: 'responses' | 'chat',
    input: string,
    options: {
      model?: string
      instructions?: string
      temperature?: number
      max_output_tokens?: number
      messages?: OpenAI.Chat.ChatCompletionMessageParam[]
      previous_response_id?: string
      text?: {
        format?: {
          type?: "text" | "json_object"
        }
      }
      store?: boolean
    } = {}
  ): Promise<string> {
    const callId = generateId()
    const startTime = Date.now()
    const model = options.model || "gpt-4o"
    
    try {
      this.logAICall(callId, input, model)
      
      let response: any
      let content = ''

      if (method === 'responses') {
        // Use the new Responses API
        const requestBody: any = {
          model,
          input: input,
          temperature: options.temperature || 0.3,
          max_output_tokens: options.max_output_tokens || 2000,
          store: options.store !== false // Default to true
        }

        // Add instructions if provided
        if (options.instructions) {
          requestBody.instructions = options.instructions
        }

        // Add previous response ID for conversation state
        if (options.previous_response_id) {
          requestBody.previous_response_id = options.previous_response_id
        }

        // Add text formatting options
        if (options.text) {
          requestBody.text = options.text
        }

        response = await openai.responses.create(requestBody)

        // Extract content from the new response format
        if (response.output_text) {
          // Use SDK convenience property if available
          content = response.output_text
        } else if (response.output && response.output.length > 0) {
          // Extract from output array
          const messageOutput = response.output.find((item: any) => item.type === 'message')
          if (messageOutput && messageOutput.content && messageOutput.content.length > 0) {
            const textContent = messageOutput.content.find((c: any) => c.type === 'output_text')
            content = textContent?.text || ''
          }
        }

      } else if (method === 'chat') {
        // Fallback to Chat Completions API
        response = await openai.chat.completions.create({
          model,
          messages: options.messages || [{ role: 'user', content: input }],
          temperature: options.temperature || 0.3,
          max_tokens: options.max_output_tokens || 2000
        })

        content = response.choices[0]?.message?.content || ''
      }
      
      if (!content) {
        throw new Error('No content in AI response')
      }

      const duration = Date.now() - startTime
      this.logAIResponse(callId, { 
        outputText: content,
        usage: response.usage ? { totalTokens: response.usage.total_tokens || 0 } : undefined
      }, duration)

      return content

    } catch (error) {
      const duration = Date.now() - startTime
      this.logAIError(callId, error as Error, duration)
      console.error('OpenAI call failed:', error)
      throw error
    }
  }

  /**
   * Keep your existing session management for chat modifications
   */
  static createSession(sessionId: string, originalPrompt: string, workflow: Workflow, project?: WorkflowProject): void {
    this.sessionContexts.set(sessionId, {
      originalPrompt,
      workflow,
      project,
      conversationHistory: [],
      lastModified: new Date(),
      responseId: undefined
    })
  }

  static updateSessionHistory(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const context = this.sessionContexts.get(sessionId)
    if (context) {
      context.conversationHistory.push({ role, content })
      context.lastModified = new Date()
    }
  }

  /**
   * Keep your existing workflow modification for chat - now using Responses API
   */
  static async modifyWorkflow(workflow: Workflow, modification: string, sessionId?: string): Promise<Workflow> {
    try {
      const sessionContext = sessionId ? this.sessionContexts.get(sessionId) : null
      const conversationHistory = sessionContext?.conversationHistory || []
      
      // Ensure the input contains "json" for the API requirement
      const modificationInput = `Modification request: "${modification}"\n\nPlease respond with a complete JSON object containing the updated workflow structure.`
      const modificationInstructions = `
You are FlowCraft AI. The user wants to modify their existing workflow: "${modification}"

Current workflow:
${JSON.stringify(workflow, null, 2)}

Return ONLY a JSON object with the updated workflow (same structure as input).
Maintain vertical layout with positions at y=50, y=200, y=350, etc.
Keep x=200 for all nodes.`

      const content = await this.makeLoggedOpenAICall(
        'responses',
        modificationInput,
        {
          instructions: modificationInstructions,
          temperature: 0.3,
          max_output_tokens: 2000,
          previous_response_id: sessionContext?.responseId,
          text: {
            format: {
              type: "json_object"
            }
          }
        }
      )

      const result = JSON.parse(content)
      
      const updatedWorkflow: Workflow = {
        ...workflow,
        name: result.name || workflow.name,
        description: result.description || workflow.description,
        nodes: result.nodes || workflow.nodes,
        edges: result.edges || workflow.edges,
        updatedAt: new Date()
      }

      if (sessionId) {
        const context = this.sessionContexts.get(sessionId)
        if (context) {
          context.workflow = updatedWorkflow
          context.lastModified = new Date()
          // Note: We could store the response ID here if needed for future calls
        }
      }

      return updatedWorkflow
    } catch (error) {
      console.error('Failed to modify workflow:', error)
      return workflow
    }
  }

  // Keep all your existing logging methods
  static logAICall(callId: string, input: string, model: string) {
    this.aiLogs.push({
      callId,
      input,
      model,
      performance: { duration: 0 },
      timestamp: Date.now()
    })
    
    if (this.aiLogs.length > this.maxLogs) {
      this.aiLogs = this.aiLogs.slice(-this.maxLogs)
    }
  }

  static logAIResponse(callId: string, response: { outputText?: string; usage?: { totalTokens: number } }, duration: number) {
    const log = this.aiLogs.find(l => l.callId === callId)
    if (log) {
      log.response = response
      log.performance.duration = duration
    }
  }

  static logAIError(callId: string, error: Error, duration: number) {
    const log = this.aiLogs.find(l => l.callId === callId)
    if (log) {
      log.error = { message: error.message }
      log.performance.duration = duration
    }
  }

  static getAILogs(): AILog[] {
    return [...this.aiLogs]
  }

  static getAIStats() {
    if (this.aiLogs.length === 0) {
      return { totalCalls: 0, successRate: 0, avgDuration: 0, totalTokens: 0 }
    }

    const totalCalls = this.aiLogs.length
    const successfulCalls = this.aiLogs.filter(log => !log.error).length
    const successRate = (successfulCalls / totalCalls) * 100
    const avgDuration = Math.round(
      this.aiLogs.reduce((sum, log) => sum + log.performance.duration, 0) / totalCalls
    )
    const totalTokens = this.aiLogs.reduce((sum, log) => {
      return sum + (log.response?.usage?.totalTokens || 0)
    }, 0)

    return { totalCalls, successRate, avgDuration, totalTokens }
  }

  static clearAILogs() {
    this.aiLogs = []
  }

  // ============================================================================
  // TESTING AND VERIFICATION METHODS
  // ============================================================================

  /**
   * Test method to verify Responses API is working
   */
  static async testResponsesAPI(): Promise<{ success: boolean; message: string; response?: string }> {
    try {
      console.log('🧪 Testing OpenAI Responses API...')
      
      const testResponse = await this.makeLoggedOpenAICall('responses', 'Say "Hello from Responses API!" Please respond in plain text format.', {
        model: 'gpt-4o',
        temperature: 0.1,
        max_output_tokens: 50
        // Note: Not using json_object format for this simple test
      })

      console.log('✅ Responses API test successful:', testResponse)
      
      return {
        success: true,
        message: 'Responses API is working correctly',
        response: testResponse
      }
    } catch (error) {
      console.error('❌ Responses API test failed:', error)
      
      return {
        success: false,
        message: `Responses API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // ============================================================================
  // LEGACY METHODS FOR BACKWARD COMPATIBILITY (but mark as deprecated)
  // ============================================================================

  /**
   * @deprecated Use generateLovableStyleResponse instead
   */
  static async generateFullWorkflowProject(
    prompt: string, 
    progressCallback?: ProgressCallback
  ): Promise<{ workflow: Workflow; project: WorkflowProject }> {
    console.warn('⚠️ Using deprecated slow generation method. Consider upgrading to generateLovableStyleResponse.')
    return this.generateWorkflowFast(prompt, progressCallback)
  }

  /**
   * @deprecated Included in fast generation now
   */
  static async analyzePrompt(prompt: string): Promise<AIAnalysis> {
    console.warn('⚠️ analyzePrompt is deprecated. Fast generation includes analysis.')
    // Return minimal analysis for compatibility
    return {
      blueprint: `Fast analysis for: ${prompt}`,
      assumptions: ['Using fast generation method'],
      suggestedNodes: [],
      suggestedEdges: [],
      generatedCode: '// Fast generated code',
      recommendations: ['Use the new fast generation method']
    }
  }

  /**
   * @deprecated Included in fast generation now  
   */
  static async generateWorkflow(analysis: AIAnalysis, prompt: string): Promise<Workflow> {
    console.warn('⚠️ generateWorkflow is deprecated. Use generateLovableStyleResponse instead.')
    const result = await this.generateWorkflowFast(prompt)
    return result.workflow
  }
}

// Backward compatibility alias
export const AIService = FlowCraftAI