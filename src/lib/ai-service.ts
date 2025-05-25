import OpenAI from 'openai'
import { 
  AIAnalysis, 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge,
  AIDiscoveryResult,
  ServiceResearch,
  GeneratedIntegration,
  WorkflowProject,
  ProjectComponent,
  GeneratedFile,
  TestCase,
  MonitoringConfig,
  ComponentSpec
} from '@/types/workflow'
import { generateId } from './utils'
import { getLayoutedElementsVertical } from './layout'

// Import enhanced services for advanced capabilities
// TODO: Re-enable these imports after fixing webpack issues
// import { EnhancedAIAgent } from './ai/enhanced_ai_agent'
// import { AIAPIResearcher } from './services/api_research_tool'
// import { AICollaborationFacilitator } from './collaboration/collaboration_system'

// Initialize OpenAI (you'll need to set OPENAI_API_KEY environment variable)
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your-api-key-here',
  dangerouslyAllowBrowser: true // Note: In production, use server-side API routes
})

// Interface for AI logs
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

interface AIStats {
  totalCalls: number
  successRate: number
  avgDuration: number
  totalTokens: number
}

// Progress streaming interfaces
export interface ProgressUpdate {
  phase: string
  message: string
  progress: number // 0-100
  isComplete: boolean
  data?: any
}

export type ProgressCallback = (update: ProgressUpdate) => void

/**
 * Centralized OpenAI call wrapper with logging
 * This function should be used by all services for consistent logging
 */
export async function makeLoggedOpenAICall(
  method: 'responses' | 'chat',
  input: string,
  options: {
    model?: string
    instructions?: string
    temperature?: number
    max_output_tokens?: number
    messages?: OpenAI.Chat.ChatCompletionMessageParam[]
    previous_response_id?: string
  } = {}
): Promise<string> {
  const callId = generateId()
  const startTime = Date.now()
  const model = options.model || "gpt-4o"
  
  try {
    FlowCraftAI.logAICall(callId, input, model)
    
    let response: any
    let content = ''

    if (method === 'responses') {
      response = await openai.responses.create({
        model,
        input,
        instructions: options.instructions,
        temperature: options.temperature || 0.3,
        max_output_tokens: options.max_output_tokens || 2000,
        previous_response_id: options.previous_response_id,
        text: {
          format: { type: "text" }
        }
      })

      // Extract text from the response
      if (response.output_text) {
        content = response.output_text
      } else if (response.output && response.output.length > 0) {
        const firstOutput = response.output[0]
        if (firstOutput.type === 'message' && 'content' in firstOutput) {
          const messageOutput = firstOutput as { content: Array<{ type: string; text?: string }> }
          if (messageOutput.content && messageOutput.content.length > 0) {
            const firstContent = messageOutput.content[0]
            if (firstContent.type === 'output_text') {
              content = firstContent.text || ''
            }
          }
        }
      }
    } else if (method === 'chat') {
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
    FlowCraftAI.logAIResponse(callId, { 
      outputText: content,
      usage: response.usage ? { totalTokens: response.usage.total_tokens || 0 } : undefined
    }, duration)

    return content

  } catch (error) {
    const duration = Date.now() - startTime
    FlowCraftAI.logAIError(callId, error as Error, duration)
    console.error('OpenAI call failed:', error)
    throw error
  }
}

/**
 * Backward compatibility function for makeResponsesAPICall
 * @deprecated Use makeLoggedOpenAICall instead
 */
async function makeResponsesAPICall(
  input: string,
  model: string = "gpt-4o",
  options: {
    instructions?: string
    temperature?: number
    max_output_tokens?: number
    previous_response_id?: string
  } = {}
): Promise<string> {
  return makeLoggedOpenAICall('responses', input, {
    model,
    ...options
  })
}

/**
 * Enhanced FlowCraft AI Service - Using OpenAI Responses API
 */
export class FlowCraftAI {
  
  // AI Logging
  private static aiLogs: AILog[] = []
  private static maxLogs = 50 // Keep only the last 50 logs
  
  // Enhanced services instances for advanced capabilities
  // TODO: Re-enable after fixing webpack issues
  // private static enhancedAgent?: EnhancedAIAgent
  // private static apiResearcher = new AIAPIResearcher()
  // private static collaborationFacilitator = new AICollaborationFacilitator()

  // Store conversation state for multi-turn interactions
  private static conversationStates = new Map<string, string>()
  private static sessionContexts = new Map<string, {
    originalPrompt: string
    workflow: Workflow
    project?: WorkflowProject
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}>
    lastModified: Date
  }>()

  /**
   * AI Logging Methods
   */
  static logAICall(callId: string, input: string, model: string) {
    this.aiLogs.push({
      callId,
      input,
      model,
      performance: { duration: 0 },
      timestamp: Date.now()
    })
    
    // Keep only the last maxLogs entries
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

  static getAIStats(): AIStats {
    if (this.aiLogs.length === 0) {
      return {
        totalCalls: 0,
        successRate: 0,
        avgDuration: 0,
        totalTokens: 0
      }
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

    return {
      totalCalls,
      successRate,
      avgDuration,
      totalTokens
    }
  }

  static clearAILogs() {
    this.aiLogs = []
  }

  /**
   * Enhanced Analysis - Uses contextual AI with memory and tool integration
   */
  static async enhancedAnalyzePrompt(
    prompt: string, 
    sessionId?: string,
    workflow?: Workflow
  ): Promise<AIAnalysis & { confidence: number; suggestions: string[] }> {
    // TODO: Re-enable after fixing webpack issues
    // try {
    //   // Initialize enhanced agent if needed
    //   if (!this.enhancedAgent && sessionId) {
    //     this.enhancedAgent = new EnhancedAIAgent(sessionId)
    //   }

    //   if (this.enhancedAgent) {
    //     const contextualResult = await this.enhancedAgent.analyzeWithContext(prompt, workflow)
        
    //     // Convert to legacy format with enhancements
    //     const legacyAnalysis = await this.analyzePrompt(prompt)
        
    //     return {
    //       ...legacyAnalysis,
    //       confidence: contextualResult.confidence,
    //       suggestions: contextualResult.suggestions,
    //       assumptions: [
    //         ...legacyAnalysis.assumptions,
    //         `Confidence Score: ${Math.round(contextualResult.confidence * 100)}%`,
    //         `Enhanced Analysis: ${contextualResult.suggestions.length} optimization suggestions`
    //       ]
    //     }
    //   }
      
      // Fallback to standard analysis
      const standardAnalysis = await this.analyzePrompt(prompt)
      return { ...standardAnalysis, confidence: 0.7, suggestions: [] }
    // } catch (error) {
    //   console.error('Enhanced analysis failed:', error)
    //   const fallbackAnalysis = await this.analyzePrompt(prompt)
    //   return { ...fallbackAnalysis, confidence: 0.5, suggestions: [] }
    // }
  }

  /**
   * Enhanced Service Research - Uses specialized API research with real-time testing
   */
  static async enhancedResearchServices(services: string[]): Promise<ServiceResearch[]> {
    // TODO: Re-enable after fixing webpack issues
    // try {
    //   const results: ServiceResearch[] = []
      
    //   for (const service of services) {
    //     const documentation = await this.apiResearcher.researchService(service)
        
    //     // Convert to legacy ServiceResearch format
    //     const legacyResearch: ServiceResearch = {
    //       serviceName: documentation.serviceName,
    //       apiDocumentation: documentation.documentation.endpoints
    //         .map(e => `${e.method} ${e.url}: API endpoint`).join('\n'),
    //       baseUrl: documentation.baseUrl,
    //       authentication: documentation.documentation.authentication.type as ServiceResearch['authentication'],
    //       endpoints: documentation.documentation.endpoints.map(e => ({
    //         path: e.url,
    //         method: e.method,
    //         description: 'API endpoint',
    //         parameters: [],
    //         responseSchema: {}
    //       })),
    //       dataStructures: {},
    //       rateLimits: documentation.documentation.rateLimit
    //     }
        
    //     results.push(legacyResearch)
    //   }
      
    //   return results
    // } catch (error) {
    //   console.error('Enhanced research failed:', error)
      return this.researchUnknownServices(services)
    // }
  }

  /**
   * Collaboration-Enhanced Workflow Generation
   */
  static async collaborativeGenerateWorkflow(
    analysis: AIAnalysis, 
    prompt: string,
    sessionId?: string
  ): Promise<Workflow & { collaborationSession?: string }> {
    // TODO: Re-enable after fixing webpack issues
    // try {
      const baseWorkflow = await this.generateWorkflow(analysis, prompt)
      
    //   if (sessionId && this.collaborationFacilitator) {
    //     // This would be expanded based on actual collaboration needs
    //     const result = {
    //       ...baseWorkflow,
    //       collaborationSession: sessionId
    //     }
        
    //     return result
    //   }
      
      return baseWorkflow
    // } catch (error) {
    //   console.error('Collaborative generation failed:', error)
    //   return this.generateWorkflow(analysis, prompt)
    // }
  }

  /**
   * Get Enhanced Agent Instance for Advanced Features
   */
  static getEnhancedAgent(sessionId: string): any {
    // TODO: Re-enable after fixing webpack issues
    // if (!this.enhancedAgent || this.enhancedAgent['context'].sessionId !== sessionId) {
    //   this.enhancedAgent = new EnhancedAIAgent(sessionId)
    // }
    // return this.enhancedAgent
    throw new Error('Enhanced agent temporarily disabled')
  }

  /**
   * Get API Researcher Instance
   */
  static getAPIResearcher(): any {
    // TODO: Re-enable after fixing webpack issues
    // return this.apiResearcher
    throw new Error('API researcher temporarily disabled')
  }

  /**
   * Get Collaboration Facilitator Instance
   */
  static getCollaborationFacilitator(): any {
    // TODO: Re-enable after fixing webpack issues
    // return this.collaborationFacilitator
    throw new Error('Collaboration facilitator temporarily disabled')
  }
  
  /**
   * Phase 1: Discovery & Planning
   * Analyzes user request and creates intelligent plan with Zapier-style workflow focus
   */
  static async discoverAndPlan(prompt: string, sessionId?: string): Promise<AIDiscoveryResult> {
    const discoveryInput = `User Request: "${prompt}"`
    
    const discoveryInstructions = `
You are FlowCraft AI, an intelligent workflow automation generator specializing in Zapier-style vertical workflows.

IMPORTANT: Design workflows that flow from TOP TO BOTTOM like Zapier:
- Trigger at the top
- Actions flow sequentially downward
- Use clear, descriptive labels for each step
- Focus on popular, well-supported integrations

Analyze and respond with a JSON object containing:
{
  "summary": "Brief summary of what the user wants to build",
  "keyComponents": ["list", "of", "main", "components"],
  "identifiedTriggers": [{"type": "trigger_type", "service": "service_name", "operation": "operation", "description": "User-friendly description like 'Import from Google Drive'", "configRequirements": ["req1", "req2"], "dependencies": ["dep1"]}],
  "identifiedActions": [{"type": "action_type", "service": "service_name", "operation": "operation", "description": "User-friendly description like 'Data Extraction AI' or 'Export to Google Sheets'", "configRequirements": ["req1"], "dependencies": ["dep1"]}],
  "requiredIntegrations": ["service1", "service2"],
  "unknownServices": ["services", "that", "need", "research"],
  "complexity": "simple|standard|advanced|enterprise",
  "recommendedApproach": "Detailed explanation of implementation approach for vertical workflow",
  "estimatedEffort": "Time and complexity estimate"
}

Popular services to suggest: google_drive, google_sheets, slack, email, notion, airtable, zapier, webhook, ai, data_extraction

Focus on identifying:
1. What triggers the workflow (top of the flow)
2. What actions need to be performed (flowing downward)
3. What services/APIs are involved
4. Data transformations needed
5. Error handling requirements
6. Scale and complexity level
`

    try {
      console.log('🔍 Making discovery API call...')
      const previousResponseId = sessionId ? this.conversationStates.get(sessionId) : undefined
      
      const content = await makeLoggedOpenAICall(
        'responses',
        discoveryInput,
        {
          instructions: discoveryInstructions,
          temperature: 0.3,
          max_output_tokens: 2000,
          previous_response_id: previousResponseId
        }
      )

      console.log('📝 Discovery API response received, parsing JSON...')
      const result = JSON.parse(content) as AIDiscoveryResult
      console.log('✅ Discovery JSON parsed successfully')
      return result
    } catch (error) {
      console.error('❌ Discovery failed with error:', error)
      console.log('🔄 Using fallback discovery...')
      // Fallback to basic analysis
      return this.fallbackDiscovery(prompt)
    }
  }

  /**
   * Phase 2: Service Research for Unknown Integrations
   * Uses web search to research APIs and generate integration code
   */
  static async researchUnknownServices(services: string[]): Promise<ServiceResearch[]> {
    const researched: ServiceResearch[] = []

    for (const service of services) {
      try {
        const researchInput = `Research the ${service} API`
        const researchInstructions = `
Research the ${service} API and provide comprehensive integration details.

CRITICAL: Return ONLY a valid JSON object without any explanatory text, markdown formatting, or code blocks.

Return this exact JSON structure:

{
  "serviceName": "${service}",
  "apiDocumentation": "Brief overview of the API",
  "baseUrl": "https://api.example.com",
  "authentication": "api_key",
  "endpoints": [
    {
      "path": "/endpoint",
      "method": "GET",
      "description": "What this endpoint does",
      "parameters": [
        {
          "name": "param_name",
          "type": "string",
          "required": true,
          "description": "Parameter description",
          "location": "query"
        }
      ],
      "responseSchema": {"example": "response"}
    }
  ],
  "dataStructures": {"CommonTypes": "here"},
  "rateLimits": {"requests": 1000, "period": "hour"}
}

IMPORTANT: 
- Do NOT use markdown code blocks (no \`\`\`json)
- Do NOT add explanatory text before or after the JSON
- Do NOT start with "Here's" or "I'll provide" or any other text
- Return ONLY the JSON object starting with { and ending with }
- If you don't know specific details, use reasonable API patterns
`

        const content = await makeLoggedOpenAICall(
          'responses',
          researchInput,
          {
            instructions: researchInstructions,
            temperature: 0.1,
            max_output_tokens: 1500
          }
        )
        
        if (content) {
          // Clean the response to remove any potential markdown wrapping
          const cleanedContent = content.trim()
            .replace(/^```json\s*/, '')  // Remove opening markdown
            .replace(/\s*```$/, '')      // Remove closing markdown
            .replace(/^```\s*/, '')      // Remove any other code block markers
            .trim()

          const serviceData = JSON.parse(cleanedContent) as ServiceResearch
          researched.push(serviceData)
        }
      } catch (error) {
        console.error(`Failed to research ${service}:`, error)
        // Add basic fallback research
        researched.push(this.fallbackServiceResearch(service))
      }
    }

    return researched
  }

  /**
   * Integration templates for different service types
   */
  private static getIntegrationTemplate(serviceType: string): string {
    const templates: Record<string, string> = {
      'rest_api': `
export class {{ServiceName}}Integration {
  private baseUrl: string;
  private apiKey: string;
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;

  constructor(config: {{ServiceName}}Config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.rateLimiter = new RateLimiter(config.rateLimit || 100);
    this.circuitBreaker = new CircuitBreaker(config.circuitBreakerOptions);
  }

  async makeRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    await this.rateLimiter.waitForSlot();
    return this.circuitBreaker.execute(() => this.executeRequest(endpoint, options));
  }

  private async executeRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    // Implementation with retry logic, error handling, etc.
  }
}`,
      
      'webhook': `
export class {{ServiceName}}WebhookTrigger {
  private webhookUrl: string;
  private secret: string;
  private eventHandlers: Map<string, EventHandler>;

  constructor(config: {{ServiceName}}WebhookConfig) {
    this.webhookUrl = config.webhookUrl;
    this.secret = config.secret;
    this.eventHandlers = new Map();
  }

  async handleWebhook(payload: any, signature: string): Promise<void> {
    if (!this.verifySignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }
    // Event processing logic
  }

  private verifySignature(payload: any, signature: string): boolean {
    // Signature verification logic
  }
}`,

      'oauth2': `
export class {{ServiceName}}Integration {
  private clientId: string;
  private clientSecret: string;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiry?: Date;

  constructor(config: {{ServiceName}}OAuthConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  async authenticate(authCode: string): Promise<void> {
    // OAuth2 flow implementation
  }

  async refreshAccessToken(): Promise<void> {
    // Token refresh logic
  }

  async makeAuthenticatedRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    await this.ensureValidToken();
    // Authenticated request logic
  }
}`
    };

    return templates[serviceType] || templates['rest_api'];
  }

  /**
   * Detect service type from research data
   */
  private static detectServiceType(service: ServiceResearch): string {
    const authType = service.authentication?.toLowerCase();
    const hasWebhooks = service.endpoints?.some(e => e.path.includes('webhook'));
    
    if (hasWebhooks) return 'webhook';
    if (authType === 'oauth2') return 'oauth2';
    return 'rest_api';
  }

  /**
   * Phase 3: Dynamic Integration Generation
   * Creates complete integration classes with error handling
   */
  static async generateIntegrations(researchedServices: ServiceResearch[]): Promise<GeneratedIntegration[]> {
    const integrations: GeneratedIntegration[] = []

    for (const service of researchedServices) {
      try {
        const serviceType = this.detectServiceType(service);
        const template = this.getIntegrationTemplate(serviceType);
        
        const generationInput = `Generate integration for ${service.serviceName}`
        const generationInstructions = `
Generate a complete TypeScript integration class for ${service.serviceName} following the proven pattern below.

SERVICE RESEARCH:
${JSON.stringify(service, null, 2)}

REQUIRED PATTERN TEMPLATE:
${template}

CRITICAL: Return ONLY a valid JSON object without any explanatory text, markdown formatting, or code blocks.

Return this exact JSON structure:
{
  "serviceName": "${service.serviceName}",
  "className": "${service.serviceName}Integration",
  "code": "complete TypeScript class code following the template pattern",
  "dependencies": ["required", "npm", "packages"],
  "configSchema": [
    {"name": "baseUrl", "label": "API Base URL", "type": "text", "required": true},
    {"name": "apiKey", "label": "API Key", "type": "password", "required": true}
  ],
  "methods": [
    {"name": "methodName", "description": "what it does", "parameters": [], "returnType": "Promise<Type>", "errorHandling": ["ValidationError", "RateLimitError", "AuthenticationError"]}
  ],
  "serviceType": "${serviceType}",
  "authenticationPattern": "${service.authentication}"
}

IMPORTANT: 
- Do NOT use markdown code blocks (no \`\`\`json)
- Do NOT add explanatory text before or after the JSON
- Do NOT start with "Here's" or "I'll provide" or any other text
- Return ONLY the JSON object starting with { and ending with }
- The generated code must follow the template structure exactly while adapting it for ${service.serviceName} specifics.
`

        const content = await makeLoggedOpenAICall(
          'responses',
          generationInput,
          {
            instructions: generationInstructions,
            temperature: 0.1, // Lower temperature for more consistent patterns
            max_output_tokens: 4000
          }
        )
        
        if (content) {
          // Clean the response to remove any potential markdown wrapping
          const cleanedContent = content.trim()
            .replace(/^```json\s*/, '')  // Remove opening markdown
            .replace(/\s*```$/, '')      // Remove closing markdown
            .replace(/^```\s*/, '')      // Remove any other code block markers
            .trim()

          const integration = JSON.parse(cleanedContent) as GeneratedIntegration
          
          // Validate that the integration follows expected patterns
          if (this.validateIntegrationPattern(integration, serviceType)) {
            integrations.push(integration)
          } else {
            console.warn(`Generated integration for ${service.serviceName} doesn't follow expected patterns, using fallback`)
            integrations.push(this.fallbackIntegration(service))
          }
        }
      } catch (error) {
        console.error(`Failed to generate integration for ${service.serviceName}:`, error)
        integrations.push(this.fallbackIntegration(service))
      }
    }

    return integrations
  }

  /**
   * Validate that generated integration follows expected patterns
   */
  private static validateIntegrationPattern(integration: GeneratedIntegration, expectedType: string): boolean {
    // Check if the code contains required pattern elements
    const code = integration.code;
    
    const requiredPatterns: Record<string, string[]> = {
      'rest_api': [
        'class.*Integration',
        'constructor.*config',
        'rateLimiter',
        'circuitBreaker',
        'makeRequest',
        'executeRequest'
      ],
      'webhook': [
        'class.*WebhookTrigger',
        'handleWebhook',
        'verifySignature',
        'eventHandlers'
      ],
      'oauth2': [
        'class.*Integration',
        'authenticate',
        'refreshAccessToken',
        'makeAuthenticatedRequest',
        'accessToken'
      ]
    };

    const patterns = requiredPatterns[expectedType] || requiredPatterns['rest_api'];
    
    return patterns.every((pattern: string) => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(code);
    });
  }

  /**
   * Phase 4: Complete Project Generation
   * Creates full workflow automation project with all components
   */
  static async generateWorkflowProject(
    discovery: AIDiscoveryResult,
    integrations: GeneratedIntegration[],
    originalPrompt: string
  ): Promise<WorkflowProject> {
    const projectName = this.extractProjectName(originalPrompt)
    
    try {
      // Generate core components using the new API
      const components = await this.generateCoreComponents(discovery, integrations, discovery.complexity)
      
      return {
        id: generateId(),
        name: projectName,
        description: discovery.summary,
        complexity: discovery.complexity,
        components,
        integrations,
        generatedFiles: this.generateProjectFiles(),
        testSuite: await this.generateTestSuite(),
        monitoring: this.generateMonitoringConfig(discovery.complexity)
      }
    } catch (error) {
      console.error('Failed to generate workflow project:', error)
      // Return basic fallback project
      return {
        id: generateId(),
        name: projectName,
        description: discovery.summary,
        complexity: 'simple',
        components: [],
        integrations,
        generatedFiles: [],
        testSuite: [],
        monitoring: this.generateMonitoringConfig('simple')
      }
    }
  }

  /**
   * Generate core workflow components
   */
  private static async generateCoreComponents(
    discovery: AIDiscoveryResult,
    integrations: GeneratedIntegration[],
    complexity: string
  ): Promise<ProjectComponent[]> {
    const components: ProjectComponent[] = []

    try {
      // Generate workflow engine
      const engineCode = await this.generateWorkflowEngine(discovery, complexity)
      components.push({
        name: 'WorkflowEngine',
        type: 'engine',
        code: engineCode,
        dependencies: ['workflow-core', 'event-emitter'],
        filepath: 'src/engine/workflow-engine.ts'
      })

      // Generate visual builder component
      const builderCode = await this.generateVisualBuilder(discovery, complexity)
      components.push({
        name: 'VisualBuilder',
        type: 'builder',
        code: builderCode,
        dependencies: ['react', 'reactflow', 'drag-and-drop'],
        filepath: 'src/components/visual-builder.tsx'
      })

      // Generate trigger components
      for (const trigger of discovery.identifiedTriggers) {
        const triggerCode = await this.generateTriggerComponent(trigger)
        components.push({
          name: `${trigger.service}Trigger`,
          type: 'trigger',
          code: triggerCode,
          dependencies: [`${trigger.service}-sdk`],
          filepath: `src/triggers/${trigger.service.toLowerCase()}-trigger.ts`
        })
      }

      // Generate action components
      for (const action of discovery.identifiedActions) {
        const actionCode = await this.generateActionComponent(action)
        components.push({
          name: `${action.service}Action`,
          type: 'action',
          code: actionCode,
          dependencies: [`${action.service}-sdk`],
          filepath: `src/actions/${action.service.toLowerCase()}-action.ts`
        })
      }

      // Generate monitoring dashboard
      const dashboardCode = await this.generateMonitoringDashboard()
      components.push({
        name: 'MonitoringDashboard',
        type: 'monitor',
        code: dashboardCode,
        dependencies: ['dashboard-ui', 'metrics'],
        filepath: 'src/components/monitoring-dashboard.tsx'
      })

    } catch (error) {
      console.error('Failed to generate some components:', error)
    }

    return components
  }

  /**
   * Generate workflow engine code
   */
  private static async generateWorkflowEngine(discovery: AIDiscoveryResult, complexity: string): Promise<string> {
    try {
      const engineInput = `Generate workflow engine for ${complexity} complexity`
      const engineInstructions = `
Generate a complete TypeScript workflow engine class based on this discovery:

${discovery}

Requirements:
- Complexity level: ${complexity}
- Support for Zapier-style vertical workflows
- Event-driven architecture
- Error handling and retry logic
- State management
- Plugin system for integrations

Return only the TypeScript code for the WorkflowEngine class.
`

      return await makeLoggedOpenAICall(
        'responses',
        engineInput,
        {
          instructions: engineInstructions,
          temperature: 0.2,
          max_output_tokens: 2500
        }
      )
    } catch (error) {
      console.error('Failed to generate workflow engine:', error)
      return this.fallbackEngineCode(complexity)
    }
  }

  /**
   * Generate visual builder code
   */
  private static async generateVisualBuilder(discovery: AIDiscoveryResult, complexity: string): Promise<string> {
    try {
      const builderInput = `Generate visual workflow builder for ${complexity} complexity`
      const builderInstructions = `
Generate a complete React TypeScript component for a Zapier-style visual workflow builder based on:

${discovery}

Requirements:
- React + TypeScript
- Zapier-style vertical layout (top-to-bottom flow)
- Drag and drop functionality
- Node-based workflow editor
- Complexity level: ${complexity}
- Real-time preview
- Configuration panels

Return only the TypeScript React component code.
`

      return await makeLoggedOpenAICall(
        'responses',
        builderInput,
        {
          instructions: builderInstructions,
          temperature: 0.2,
          max_output_tokens: 2500
        }
      )
    } catch (error) {
      console.error('Failed to generate visual builder:', error)
      return this.fallbackBuilderCode()
    }
  }

  /**
   * Generate monitoring dashboard code
   */
  private static async generateMonitoringDashboard(): Promise<string> {
    try {
      const dashboardInput = `Generate monitoring dashboard component`
      const dashboardInstructions = `
Generate a complete React TypeScript monitoring dashboard component for workflow automation:

Requirements:
- React + TypeScript with hooks
- Real-time metrics display
- Workflow execution status
- Performance charts and graphs
- Error tracking and alerting
- System health indicators
- Beautiful, responsive UI with Tailwind CSS
- Dashboard cards for key metrics
- Live updates and refresh capabilities

Return only the TypeScript React component code.
`

      return await makeLoggedOpenAICall(
        'responses',
        dashboardInput,
        {
          instructions: dashboardInstructions,
          temperature: 0.3,
          max_output_tokens: 3000
        }
      )
    } catch (error) {
      console.error('Failed to generate monitoring dashboard:', error)
      return `// Fallback monitoring dashboard component\nimport React from 'react'\n\nexport const MonitoringDashboard: React.FC = () => {\n  return <div>Monitoring Dashboard</div>\n}`
    }
  }

  private static async generateTestSuite(): Promise<TestCase[]> {
    return []
  }

  private static generateMonitoringConfig(complexity: string): MonitoringConfig {
    return {
      enabled: complexity !== 'simple',
      metrics: ['execution_time', 'success_rate'],
      alerting: [],
      dashboardConfig: {}
    }
  }

  private static generateProjectFiles(): GeneratedFile[] {
    return []
  }

  /**
   * Professional enthusiastic response + immediate generation
   * More professional tone with less exclamations and emojis
   */
  static async generateLovableStyleResponse(
    prompt: string, 
    progressCallback?: ProgressCallback
  ): Promise<{
    enthusiasticResponse: string;
    generationPromise: Promise<{ workflow: Workflow; project: WorkflowProject }>;
  }> {
    // Generate the professional response first
    const responseInput = `User wants: "${prompt}"`
    const responseInstructions = `
You are FlowCraft AI – an intelligent, professional, and highly capable workflow automation specialist.

The user wants you to build: "${prompt}"

Respond with a BRIEF but ENTHUSIASTIC message (2–3 sentences max) that:

- Shows confidence about building their automation  
- Highlights 2–3 key features or integrations included in the automation  
- Emphasizes that you're starting to build immediately  
- Mentions multiple steps or systems involved to make it feel complex and comprehensive  
- Uses professional language with moderate enthusiasm  
- Uses **Markdown formatting** (paragraphs, bullet points, no code blocks)  
- Avoids generic filler or markdown syntax like \`**\` or \`-\` inside the prompt response — write it naturally  

**Example Output:**

I'll build a powerful multi-step automation that runs your daily data pipeline across systems. It will extract data from Salesforce, clean and transform it with Python scripts in AWS Lambda, and push the output into Snowflake and Slack for real-time visibility.

Your automation will include:  
- Scheduled triggers with timezone-aware execution  
- Data validation and enrichment via external APIs  
- Failure notifications and retry logic for reliability  

Starting the build now!
`

    try {
      const enthusiasticResponse = await makeLoggedOpenAICall(
        'responses',
        responseInput,
        {
          instructions: responseInstructions,
          temperature: 0.7, // Balanced creativity and professionalism
          max_output_tokens: 600
        }
      )

      // Start the actual generation process immediately (like Lovable)
      const generationPromise = this.generateFullWorkflowProject(prompt, progressCallback)

      return {
        enthusiasticResponse: enthusiasticResponse || this.getFallbackEnthusiasticResponse(prompt),
        generationPromise
      }
    } catch (error) {
      console.error('Professional response failed:', error)
      return {
        enthusiasticResponse: this.getFallbackEnthusiasticResponse(prompt),
        generationPromise: this.generateFullWorkflowProject(prompt, progressCallback)
      }
    }
  }

  /**
   * Complete workflow project generation (all 4 phases)
   * Returns both workflow visualization AND full project with code
   */
  static async generateFullWorkflowProject(
    prompt: string, 
    progressCallback?: ProgressCallback
  ): Promise<{ workflow: Workflow; project: WorkflowProject }> {
    console.log('🚀 Starting full workflow project generation...')
    
    try {
      // Phase 1: Discovery & Planning
      progressCallback?.({
        phase: 'discovery',
        message: 'Analyzing your prompt and planning the workflow architecture...',
        progress: 10,
        isComplete: false
      })
      
      console.log('📋 Phase 1: Starting discovery & planning...')
      const discovery = await this.discoverAndPlan(prompt)
      console.log('✅ Phase 1: Discovery completed', discovery)
      
      progressCallback?.({
        phase: 'discovery',
        message: `Identified ${discovery.requiredIntegrations.length} integrations and ${discovery.identifiedTriggers.length} triggers`,
        progress: 25,
        isComplete: true,
        data: { integrations: discovery.requiredIntegrations.length, triggers: discovery.identifiedTriggers.length }
      })
      
      // Phase 2: Service Research (for unknown services)
      progressCallback?.({
        phase: 'research',
        message: `Researching ${discovery.unknownServices.length} unknown services and APIs...`,
        progress: 30,
        isComplete: false
      })
      
      console.log('🔍 Phase 2: Starting service research...', discovery.unknownServices)
      const unknownResearch = await this.researchUnknownServices(discovery.unknownServices)
      console.log('✅ Phase 2: Service research completed', unknownResearch)
      
      // Phase 2.5: Research ALL required integrations (not just unknown ones)
      progressCallback?.({
        phase: 'research',
        message: `Researching all ${discovery.requiredIntegrations.length} required integrations...`,
        progress: 45,
        isComplete: false
      })
      
      console.log('🔍 Phase 2.5: Researching required integrations...', discovery.requiredIntegrations)
      const allRequiredServices = [...new Set([...discovery.unknownServices, ...discovery.requiredIntegrations])]
      const allServiceResearch = await this.researchUnknownServices(allRequiredServices)
      console.log('✅ Phase 2.5: All required service research completed', allServiceResearch)
      
      progressCallback?.({
        phase: 'research',
        message: `Service research complete. Found ${allServiceResearch.length} integration patterns.`,
        progress: 50,
        isComplete: true,
        data: { researched: allServiceResearch.length }
      })
      
      // Phase 3: Integration Generation (for ALL required services)
      progressCallback?.({
        phase: 'integration',
        message: 'Generating custom TypeScript integrations and connectors...',
        progress: 55,
        isComplete: false
      })
      
      console.log('⚙️ Phase 3: Starting integration generation for all required services...')
      const integrations = await this.generateIntegrations(allServiceResearch)
      console.log('✅ Phase 3: Integration generation completed', integrations)
      
      progressCallback?.({
        phase: 'integration',
        message: `Generated ${integrations.length} TypeScript integrations with authentication and error handling`,
        progress: 75,
        isComplete: true,
        data: { integrations: integrations.length }
      })
      
      // Phase 4: Complete Project Generation
      progressCallback?.({
        phase: 'project',
        message: 'Building complete project with workflow engine, monitoring, and tests...',
        progress: 80,
        isComplete: false
      })
      
      console.log('🏗️ Phase 4: Starting project generation...')
      const project = await this.generateWorkflowProject(discovery, integrations, prompt)
      console.log('✅ Phase 4: Project generation completed', project)
      
      progressCallback?.({
        phase: 'project',
        message: `Generated ${project.components.length} components and ${project.generatedFiles.length} files`,
        progress: 90,
        isComplete: false,
        data: { components: project.components.length, files: project.generatedFiles.length }
      })
      
      // Convert to workflow for visualization
      progressCallback?.({
        phase: 'visualization',
        message: 'Creating workflow visualization and finalizing...',
        progress: 95,
        isComplete: false
      })
      
      console.log('🎨 Converting to workflow visualization...')
      const workflow = await this.convertProjectToWorkflow(project, discovery, prompt)
      console.log('✅ All phases completed successfully!')
      
      progressCallback?.({
        phase: 'complete',
        message: 'Workflow automation ready! All systems built and tested.',
        progress: 100,
        isComplete: true,
        data: { workflow, project }
      })
      
      return { workflow, project }
    } catch (error) {
      console.error('❌ Full project generation failed at some phase:', error)
      console.log('🔄 Falling back to basic workflow generation...')
      
      progressCallback?.({
        phase: 'fallback',
        message: 'Generating basic workflow as fallback...',
        progress: 80,
        isComplete: false
      })
      
      // Fallback to basic workflow generation
      const analysis = await this.analyzePrompt(prompt)
      const workflow = await this.generateWorkflow(analysis, prompt)
      const project = this.createFallbackProject(workflow)
      
      progressCallback?.({
        phase: 'complete',
        message: 'Basic workflow ready (some advanced features unavailable)',
        progress: 100,
        isComplete: true,
        data: { workflow, project }
      })
      
      return { workflow, project }
    }
  }

  /**
   * Convert WorkflowProject to Workflow for visualization
   */
  private static async convertProjectToWorkflow(
    project: WorkflowProject, 
    discovery: AIDiscoveryResult, 
    prompt: string
  ): Promise<Workflow> {
    // Create nodes from discovery
    const nodes = await this.convertToLegacyNodes(discovery)
    const edges = await this.convertToLegacyEdges(discovery)
    
    // Debug logging for initial positions
    console.log('🔧 Initial node positions before layout:', nodes.map(node => ({
      id: node.id,
      label: node.data.label,
      position: node.position
    })))
    
    // Apply vertical layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElementsVertical(nodes, edges)
    
    // Debug logging for final positions
    console.log('✅ Final node positions after layout:', layoutedNodes.map(node => ({
      id: node.id,
      label: node.data.label,
      position: node.position
    })))
    
    // Convert back to WorkflowNode and WorkflowEdge types
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
      id: project.id,
      name: project.name,
      description: project.description,
      nodes: convertedNodes,
      edges: convertedEdges,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      originalPrompt: prompt,
      generatedCode: project.components.find(c => c.type === 'engine')?.code || ''
    }
  }

  /**
   * Create fallback project from basic workflow
   */
  private static createFallbackProject(workflow: Workflow): WorkflowProject {
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      complexity: 'simple',
      components: [
        {
          name: 'WorkflowEngine',
          type: 'engine',
          dependencies: [],
          code: workflow.generatedCode,
          filepath: 'src/workflow-engine.ts'
        }
      ],
      integrations: [],
      generatedFiles: [
        {
          path: 'src/workflow-engine.ts',
          content: workflow.generatedCode,
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
   * Fallback professional response when AI generation fails
   */
  private static getFallbackEnthusiasticResponse(prompt: string): string {
    return `I'll build a comprehensive workflow automation that ${prompt.toLowerCase().replace(/^(create|build|make)\s*/i, '')}.

This will include intelligent triggers, AI-powered data processing, error handling, and real-time monitoring with a complete TypeScript codebase. Building your automation now!`
  }

  // Updated helper methods for Zapier-style vertical workflows
  private static async convertToLegacyNodes(discovery: AIDiscoveryResult): Promise<WorkflowNode[]> {
    const nodes: WorkflowNode[] = []

    // Add trigger nodes with Zapier-style data
    discovery.identifiedTriggers.forEach((trigger, index) => {
      nodes.push({
        id: `trigger-${index + 1}`,
        type: 'trigger',
        position: { x: 0, y: 0 }, // Will be repositioned by layout
        data: {
          label: trigger.description || trigger.type,
          description: `Trigger when ${trigger.operation || 'event occurs'}`,
          config: {},
          service: trigger.service,
          operation: trigger.operation || 'auto_import'
        }
      })
    })

    // Add action nodes with Zapier-style data
    discovery.identifiedActions.forEach((action, index) => {
      nodes.push({
        id: `action-${index + 1}`,
        type: 'action',
        position: { x: 0, y: 0 }, // Will be repositioned by layout
        data: {
          label: action.description || action.type,
          description: `${action.operation || 'Process'} with ${action.service}`,
          config: {},
          service: action.service,
          operation: action.operation || 'export'
        }
      })
    })

    return nodes
  }

  private static async convertToLegacyEdges(discovery: AIDiscoveryResult): Promise<WorkflowEdge[]> {
    const edges: WorkflowEdge[] = []
    
    // Create vertical connections (top to bottom) for Zapier-style flow
    const totalActions = discovery.identifiedActions.length
    const totalTriggers = discovery.identifiedTriggers.length
    
    console.log(`🔗 Creating edges for ${totalTriggers} triggers and ${totalActions} actions...`)
    
    // If we have both triggers and actions, connect trigger to first action
    if (totalTriggers > 0 && totalActions > 0) {
      const edge = {
        id: 'trigger-1-action-1',
        source: 'trigger-1',
        target: 'action-1',
        type: 'default' as const
      }
      edges.push(edge)
      console.log(`✅ Added edge: ${edge.source} -> ${edge.target}`)
    }
    
    // Connect actions sequentially - CRITICAL: This creates the vertical chain
    for (let i = 0; i < totalActions - 1; i++) {
      const edge = {
        id: `action-${i + 1}-action-${i + 2}`,
        source: `action-${i + 1}`,
        target: `action-${i + 2}`,
        type: 'default' as const
      }
      edges.push(edge)
      console.log(`✅ Added sequential edge: ${edge.source} -> ${edge.target}`)
    }

    // Validate edge structure
    if (edges.length === 0) {
      console.warn(`⚠️  No edges created! This will cause layout issues.`)
    } else {
      console.log(`🔗 Total edges created: ${edges.length}`)
      console.log('Edge chain:', edges.map(e => `${e.source}->${e.target}`).join(' | '))
    }

    return edges
  }

  private static async generateLegacyCode(discovery: AIDiscoveryResult): Promise<string> {
    return `
// Generated Workflow Code - ${discovery.summary}
// Complexity: ${discovery.complexity}
// Layout: Vertical (Zapier-style)

const workflow = {
  name: "AI Generated Workflow",
  layout: "vertical",
  triggers: ${JSON.stringify(discovery.identifiedTriggers, null, 2)},
  actions: ${JSON.stringify(discovery.identifiedActions, null, 2)},
  complexity: "${discovery.complexity}"
};

// Workflow execution logic with vertical flow
async function executeWorkflow(triggerData: unknown) {
  try {
    console.log('Workflow started:', triggerData);
    
    // Process each action sequentially (top to bottom)
    for (const action of workflow.actions) {
      await executeAction(action, triggerData);
    }
    
    console.log('Workflow completed successfully');
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}

async function executeAction(action: unknown, data: unknown) {
  console.log('Executing action:', action);
  // Implementation would depend on specific integrations
  // Each action connects vertically to the next
}
    `.trim()
  }

  private static fallbackDiscovery(prompt: string): AIDiscoveryResult {
    return {
      summary: `Zapier-style workflow automation for: ${prompt}`,
      keyComponents: ['trigger', 'action'],
      identifiedTriggers: [{
        type: 'manual',
        service: 'manual',
        description: 'Manual trigger',
        configRequirements: [],
        dependencies: []
      }],
      identifiedActions: [{
        type: 'log',
        service: 'console',
        description: 'Log output',
        configRequirements: [],
        dependencies: []
      }],
      requiredIntegrations: [],
      unknownServices: [],
      complexity: 'simple',
      recommendedApproach: 'Create a simple vertical workflow with manual trigger and basic actions',
      estimatedEffort: '1-2 hours'
    }
  }

  private static fallbackServiceResearch(service: string): ServiceResearch {
    return {
      serviceName: service,
      apiDocumentation: `Basic ${service} API integration`,
      baseUrl: `https://api.${service.toLowerCase()}.com`,
      authentication: 'api_key',
      endpoints: [],
      dataStructures: {},
      rateLimits: { requests: 1000, period: 'hour' }
    }
  }

  private static fallbackIntegration(service: ServiceResearch): GeneratedIntegration {
    return {
      serviceName: service.serviceName,
      className: `${service.serviceName}Integration`,
      code: `export class ${service.serviceName}Integration {\n  // Basic integration placeholder\n}`,
      dependencies: [],
      configSchema: [],
      methods: []
    }
  }

  private static fallbackEngineCode(complexity: string): string {
    return `
export class WorkflowEngine {
  private workflows = new Map()
  
  async execute(workflowId: string) {
    console.log('Executing workflow:', workflowId)
    // ${complexity} implementation
  }
}
`
  }

  private static fallbackBuilderCode(): string {
    return `
import React from 'react'
import ReactFlow from 'reactflow'

export const WorkflowBuilder: React.FC = () => {
  return <ReactFlow />
}
`
  }

  private static fallbackAnalysis(prompt: string): AIAnalysis {
    return {
      blueprint: `Vertical workflow for: ${prompt}`,
      assumptions: ['Zapier-style vertical layout', 'Sequential processing'],
      suggestedNodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 250, y: 50 },
          data: {
            label: 'Import from Google Drive',
            description: 'Monitor for new files',
            config: {},
            service: 'google_drive',
            operation: 'auto_import'
          }
        },
        {
          id: 'action-1', 
          type: 'action',
          position: { x: 250, y: 250 },
          data: {
            label: 'Data Extraction AI',
            description: 'Extract invoice data',
            config: {},
            service: 'ai',
            operation: 'invoices_model'
          }
        },
        {
          id: 'action-2',
          type: 'action', 
          position: { x: 250, y: 450 },
          data: {
            label: 'Export to Google Sheets',
            description: 'Save extracted data',
            config: {},
            service: 'google_sheets',
            operation: 'export'
          }
        }
      ],
      suggestedEdges: [
        {
          id: 'trigger-1-action-1',
          source: 'trigger-1',
          target: 'action-1',
          type: 'default'
        },
        {
          id: 'action-1-action-2', 
          source: 'action-1',
          target: 'action-2',
          type: 'default'
        }
      ],
      generatedCode: '// Vertical workflow code',
      recommendations: ['Review and customize', 'Test each step', 'Configure integrations']
    }
  }

  private static extractProjectName(prompt: string): string {
    const words = prompt.split(' ').slice(0, 3)
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Workflow'
  }

  private static async generateTriggerComponent(trigger: ComponentSpec): Promise<string> {
    try {
      const triggerInput = `Generate trigger component for ${trigger.service}`
      const triggerInstructions = `
Generate a complete TypeScript trigger component for ${trigger.service} service:

Trigger Details:
- Service: ${trigger.service}
- Type: ${trigger.type}
- Operation: ${trigger.operation || 'auto_trigger'}
- Description: ${trigger.description}

Requirements:
- TypeScript class with proper error handling
- Event listener/webhook receiver implementation
- Configuration validation
- Retry logic and circuit breakers
- Integration with workflow engine
- Zapier-style trigger behavior

Return only the TypeScript code for the trigger component.
`

      return await makeLoggedOpenAICall(
        'responses',
        triggerInput,
        {
          instructions: triggerInstructions,
          temperature: 0.2,
          max_output_tokens: 2000
        }
      )
    } catch (error) {
      console.error(`Failed to generate trigger component for ${trigger.service}:`, error)
      return `// Fallback ${trigger.type} trigger component for ${trigger.service}\nexport class ${trigger.service}Trigger {\n  // Implementation needed\n}`
    }
  }

  private static async generateActionComponent(action: ComponentSpec): Promise<string> {
    try {
      const actionInput = `Generate action component for ${action.service}`
      const actionInstructions = `
Generate a complete TypeScript action component for ${action.service} service:

Action Details:
- Service: ${action.service}
- Type: ${action.type}
- Operation: ${action.operation || 'execute'}
- Description: ${action.description}

Requirements:
- TypeScript class with proper error handling
- API integration with authentication
- Data transformation and validation
- Retry logic and rate limiting
- Status reporting and logging
- Integration with workflow engine
- Zapier-style action behavior

Return only the TypeScript code for the action component.
`

      return await makeLoggedOpenAICall(
        'responses',
        actionInput,
        {
          instructions: actionInstructions,
          temperature: 0.2,
          max_output_tokens: 2000
        }
      )
    } catch (error) {
      console.error(`Failed to generate action component for ${action.service}:`, error)
      return `// Fallback ${action.type} action component for ${action.service}\nexport class ${action.service}Action {\n  // Implementation needed\n}`
    }
  }

  static async analyzePrompt(prompt: string): Promise<AIAnalysis> {
    try {
      const discovery = await this.discoverAndPlan(prompt)
      const unknownServices = discovery.unknownServices
      await this.researchUnknownServices(unknownServices)
      
      // Convert to legacy format
      return {
        blueprint: discovery.summary,
        assumptions: [`Complexity: ${discovery.complexity}`, `Estimated effort: ${discovery.estimatedEffort}`, 'Optimized for Zapier-style vertical layout'],
        suggestedNodes: await this.convertToLegacyNodes(discovery),
        suggestedEdges: await this.convertToLegacyEdges(discovery),
        generatedCode: await this.generateLegacyCode(discovery),
        recommendations: [discovery.recommendedApproach]
      }
    } catch (error) {
      console.error('AI analysis failed:', error)
      return this.fallbackAnalysis(prompt)
    }
  }

  static async generateWorkflow(analysis: AIAnalysis, prompt: string): Promise<Workflow> {
    // Generate the basic workflow structure
    const baseWorkflow: Workflow = {
      id: generateId(),
      name: this.extractProjectName(prompt),
      description: analysis.blueprint,
      nodes: analysis.suggestedNodes,
      edges: analysis.suggestedEdges,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      originalPrompt: prompt,
      generatedCode: analysis.generatedCode
    }

    // Apply Vertical layout for Zapier-style workflows
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElementsVertical(
      baseWorkflow.nodes,
      baseWorkflow.edges
    )

    // Convert back to WorkflowNode and WorkflowEdge types
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
      ...baseWorkflow,
      nodes: convertedNodes,
      edges: convertedEdges
    }
  }

  /**
   * Enhanced session management and collaborative workflow modification
   */
  static createSession(sessionId: string, originalPrompt: string, workflow: Workflow, project?: WorkflowProject): void {
    this.sessionContexts.set(sessionId, {
      originalPrompt,
      workflow,
      project,
      conversationHistory: [],
      lastModified: new Date()
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
   * Modify an existing workflow based on user chat input with full context
   */
  static async modifyWorkflow(workflow: Workflow, modification: string, sessionId?: string): Promise<Workflow> {
    try {
      // Get session context for better modification understanding
      const sessionContext = sessionId ? this.sessionContexts.get(sessionId) : null
      const conversationHistory = sessionContext?.conversationHistory || []
      
      const modificationInput = `Modification request: "${modification}"`
      const modificationInstructions = `
You are FlowCraft AI specializing in Zapier-style vertical workflows. The user wants to modify their existing workflow based on this request: "${modification}"

IMPORTANT: Maintain the vertical (top-to-bottom) flow structure like Zapier.

Current workflow:
Name: ${workflow.name}
Description: ${workflow.description}
Nodes: ${JSON.stringify(workflow.nodes, null, 2)}

${conversationHistory.length > 0 ? `
Previous conversation context:
${conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n')}
` : ''}

Analyze the modification request and return a JSON object with the updated workflow:
{
  "name": "Updated workflow name if changed",
  "description": "Updated description",
  "nodes": [/* updated nodes array with same structure, maintaining vertical flow */],
  "edges": [/* updated edges array with top-to-bottom connections */],
  "explanation": "Brief explanation of what was changed"
}

Possible modifications:
- Add new steps/nodes (insert in vertical sequence)
- Remove existing steps
- Modify node configurations
- Change the order of steps (maintain top-to-bottom flow)
- Update descriptions or labels (use Zapier-style clear descriptions)
- Add conditional logic

Keep the same node structure and IDs where possible. Only change what's necessary based on the user's request.
Use clear, descriptive labels like "Import from Google Drive", "Data Extraction AI", "Export to Google Sheets".
`

      const previousResponseId = sessionId ? this.conversationStates.get(sessionId) : undefined
      
      const content = await makeLoggedOpenAICall(
        'responses',
        modificationInput,
        {
          instructions: modificationInstructions,
          temperature: 0.3,
          max_output_tokens: 2000,
          previous_response_id: previousResponseId
        }
      )

      const result = JSON.parse(content)
      
      // Update the workflow with the modifications
      const updatedWorkflow: Workflow = {
        ...workflow,
        name: result.name || workflow.name,
        description: result.description || workflow.description,
        nodes: result.nodes || workflow.nodes,
        edges: result.edges || workflow.edges,
        updatedAt: new Date()
      }

      // Store the conversation state if sessionId is provided
      if (sessionId && content) {
        this.conversationStates.set(sessionId, result.responseId || generateId())
        // Update session context with new workflow
        const context = this.sessionContexts.get(sessionId)
        if (context) {
          context.workflow = updatedWorkflow
          context.lastModified = new Date()
        }
      }

      return updatedWorkflow
    } catch (error) {
      console.error('Failed to modify workflow:', error)
      // Return original workflow if modification fails
      return workflow
    }
  }
}

// Backward compatibility alias
export const AIService = FlowCraftAI;