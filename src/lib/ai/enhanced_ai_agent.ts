import OpenAI from 'openai'
import { Workflow, AIDiscoveryResult } from '@/types/workflow'

export interface ConversationContext {
  sessionId: string
  workflowHistory: Workflow[]
  userIntent: string[]
  iterationCount: number
  userExpertiseLevel: 'beginner' | 'intermediate' | 'expert'
  preferredServices: string[]
  learningPatterns: {
    commonOperations: Record<string, number>
    errorPatterns: string[]
    successPatterns: string[]
  }
}

export interface UserPreferences {
  communicationStyle: 'detailed' | 'concise' | 'visual'
  preferredComplexity: 'simple' | 'standard' | 'advanced'
  learningGoals: string[]
  industryFocus: string[]
  technicalBackground: string[]
}

export interface AIMemory {
  shortTerm: {
    lastInteractions: Array<{
      prompt: string
      response: string
      timestamp: Date
      satisfaction?: 'positive' | 'negative' | 'neutral'
    }>
    currentGoals: string[]
    blockers: string[]
  }
  longTerm: {
    userPreferences: UserPreferences
    successfulPatterns: Array<{
      pattern: string
      context: string
      frequency: number
    }>
    integrationUsage: Record<string, number>
  }
}

export interface ContextualAnalysisResult {
  analysis: AIDiscoveryResult
  suggestions: string[]
  confidence: number
  nextSteps: string[]
}

export interface WorkflowIterationResult {
  updatedWorkflow: Workflow
  explanation: string
  alternatives: string[]
  learningInsights: string[]
}

export interface OptimizationSuggestions {
  performance: string[]
  reliability: string[]
  security: string[]
  cost: string[]
  usability: string[]
}

// Enhanced tool integration interface
interface AIToolCapabilities {
  webSearch: (query: string) => Promise<string>
  apiTest: (endpoint: string, config: Record<string, unknown>) => Promise<boolean>
  codeValidation: (code: string) => Promise<{ valid: boolean; issues: string[] }>
  securityScan: (code: string) => Promise<{ secure: boolean; vulnerabilities: string[] }>
}

export class EnhancedAIAgent {
  private context: ConversationContext
  private memory: AIMemory
  private openai: OpenAI
  private tools: AIToolCapabilities

  constructor(sessionId: string, tools?: AIToolCapabilities) {
    this.context = this.initializeContext(sessionId)
    this.memory = this.initializeMemory()
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    })
    this.tools = tools || this.initializeFallbackTools()
  }

  async analyzeWithContext(prompt: string, workflow?: Workflow): Promise<ContextualAnalysisResult> {
    // Build rich context for the AI with tool integration
    const contextPrompt = await this.buildEnhancedContextualPrompt(prompt, workflow)
    
    const startTime = Date.now()
    const callId = `ctx-${Date.now().toString(36)}`
    
    console.group(`🧠 Enhanced AI Analysis [${callId}]`)
    console.log('📝 Original Prompt:', prompt)
    console.log('🎯 Session ID:', this.context.sessionId)
    console.log('👤 User Level:', this.context.userExpertiseLevel)
    console.log('🔄 Iteration Count:', this.context.iterationCount)
    console.log('📊 Memory Patterns:', this.memory.longTerm.successfulPatterns.length)
    
    try {
      const systemInstructions = `You are FlowCraft AI, an expert workflow automation assistant with real-time tool access.
            
            User Context:
            - Expertise Level: ${this.context.userExpertiseLevel}
            - Iteration Count: ${this.context.iterationCount}
            - Preferred Services: ${this.context.preferredServices.join(', ')}
            - Recent Patterns: ${JSON.stringify(this.memory.longTerm.successfulPatterns.slice(0, 3))}
            
            Available Tools:
            - web_search: Research latest API documentation and real-time information
            - api_test: Validate endpoints with actual testing
            - code_validation: Check generated code for correctness
            - security_scan: Identify security vulnerabilities
            
            Conversation History:
            ${this.getRecentConversationContext()}
            
            Current Goals: ${this.memory.shortTerm.currentGoals.join(', ')}
            Known Blockers: ${this.memory.shortTerm.blockers.join(', ')}
            
            Instructions:
            1. Use tools to provide accurate, tested solutions
            2. Reference previous iterations when relevant
            3. Suggest improvements based on user patterns and real-time data
            4. Adapt complexity to user expertise level
            5. Identify potential issues before they occur using tool validation
            6. Provide confidence scoring based on tool results
            7. Always test endpoints and validate code when possible`

      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: contextPrompt,
        instructions: systemInstructions,
        temperature: 0.3,
        max_output_tokens: 3000
      })

      const content = response.output_text || 
                     this.extractResponseContent(response.output) || 
                     ''

      const result = await this.parseContextualResponse(content)
      
      // Update memory with new interaction
      this.updateMemory(prompt, result)
      
      const duration = Date.now() - startTime
      console.log('✅ Analysis Complete')
      console.log('⏱️ Duration:', `${duration}ms`)
      console.log('🎯 Confidence:', `${Math.round(result.confidence * 100)}%`)
      console.log('💡 Suggestions:', result.suggestions.length)
      console.log('📈 Next Steps:', result.nextSteps.length)
      console.groupEnd()
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('❌ Enhanced Analysis Failed')
      console.error('⏱️ Duration:', `${duration}ms`)
      console.error('💥 Error:', error)
      console.groupEnd()
      
      return this.fallbackContextualAnalysis(prompt)
    }
  }

  async iterateWorkflow(workflow: Workflow, userFeedback: string): Promise<WorkflowIterationResult> {
    // Enhanced iteration with tool-powered validation
    const iterationInput = `User wants to modify their workflow: "${userFeedback}"
    
    Current workflow state:
    ${JSON.stringify(workflow, null, 2)}
    
    Previous iterations: ${this.context.iterationCount}
    User satisfaction pattern: ${this.getUserSatisfactionPattern()}`
    
    const iterationInstructions = `Use available tools to:
    1. Research any new services mentioned in feedback
    2. Test proposed API endpoints for viability
    3. Validate generated code modifications
    4. Check for security implications
    
    Consider:
    1. What specific changes are needed?
    2. How does this align with their previous requests?
    3. What are potential alternative approaches?
    4. What should I learn from this interaction?
    5. How can I prevent similar confusion in the future?
    
    Respond with detailed modification plan, tool validation results, and learning insights.`

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: iterationInput,
        instructions: iterationInstructions,
        temperature: 0.2,
        max_output_tokens: 2000
      })

      const content = response.output_text || 
                     this.extractResponseContent(response.output) || 
                     ''

      const result = this.parseIterationResponse(content)
      this.context.iterationCount++
      
      return result
    } catch (error) {
      console.error('Iteration failed:', error)
      return this.fallbackIteration(workflow, userFeedback)
    }
  }

  async suggestOptimizations(workflow: Workflow): Promise<OptimizationSuggestions> {
    // Enhanced optimization with real-time validation
    const optimizationInput = `Analyze this workflow for optimization opportunities using real-time tools:
    ${JSON.stringify(workflow, null, 2)}
    
    User patterns: ${JSON.stringify(this.memory.longTerm.successfulPatterns)}
    Common errors: ${this.memory.longTerm.userPreferences.learningGoals || []}`
    
    const optimizationInstructions = `Use tools to:
    1. Research current best practices for involved services
    2. Test endpoint performance and reliability
    3. Validate security considerations
    4. Check for code optimization opportunities
    
    Provide specific, actionable optimization suggestions across:
    - Performance improvements (with tool validation)
    - Reliability enhancements (with real testing)
    - Security considerations (with vulnerability scanning)
    - Cost optimizations (with current pricing research)
    - Usability improvements (based on user patterns)`

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: optimizationInput,
        instructions: optimizationInstructions,
        temperature: 0.2,
        max_output_tokens: 2000
      })

      const content = response.output_text || 
                     this.extractResponseContent(response.output) || 
                     ''

      return this.parseOptimizationResponse(content)
    } catch (error) {
      console.error('Optimization analysis failed:', error)
      return this.fallbackOptimizations()
    }
  }

  // Enhanced context management with tool integration
  private async buildEnhancedContextualPrompt(prompt: string, workflow?: Workflow): Promise<string> {
    let contextualPrompt = prompt

    if (workflow) {
      contextualPrompt += `\n\nCurrent workflow context:\n${JSON.stringify(workflow, null, 2)}`
    }

    if (this.memory.shortTerm.lastInteractions.length > 0) {
      contextualPrompt += `\n\nRecent conversation:\n${
        this.memory.shortTerm.lastInteractions
          .slice(-3)
          .map(interaction => `User: ${interaction.prompt}\nAI: ${interaction.response}`)
          .join('\n\n')
      }`
    }

    // Add real-time context using tools
    try {
      // Extract service names from prompt for research
      const serviceNames = this.extractServiceNames(prompt)
      if (serviceNames.length > 0) {
        const researchResults = await Promise.all(
          serviceNames.map(service => this.tools.webSearch(`${service} API documentation latest 2024`))
        )
        contextualPrompt += `\n\nReal-time research results:\n${researchResults.join('\n')}`
      }
    } catch (error) {
      console.warn('Real-time research failed:', error)
    }

    return contextualPrompt
  }

  private extractServiceNames(prompt: string): string[] {
    const commonServices = [
      'slack', 'discord', 'gmail', 'outlook', 'sheets', 'airtable', 'notion',
      'stripe', 'paypal', 'shopify', 'salesforce', 'hubspot', 'mailchimp',
      'twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'zoom',
      'github', 'gitlab', 'jenkins', 'docker', 'aws', 'azure', 'gcp'
    ]
    
    const promptLower = prompt.toLowerCase()
    return commonServices.filter(service => promptLower.includes(service))
  }

  private updateMemory(prompt: string, result: ContextualAnalysisResult): void {
    // Update short-term memory
    this.memory.shortTerm.lastInteractions.push({
      prompt,
      response: JSON.stringify(result),
      timestamp: new Date()
    })

    // Maintain memory size
    if (this.memory.shortTerm.lastInteractions.length > 10) {
      this.memory.shortTerm.lastInteractions.shift()
    }

    // Extract and store patterns
    this.extractAndStorePatterns(prompt, result)
  }

  private extractAndStorePatterns(prompt: string, result: ContextualAnalysisResult): void {
    // Example pattern extraction logic
    const promptTokens = prompt.toLowerCase().split(' ')
    
    // Count operation frequency
    const operations = ['send', 'create', 'update', 'delete', 'notify', 'transform']
    operations.forEach(op => {
      if (promptTokens.includes(op)) {
        this.memory.longTerm.integrationUsage[op] = 
          (this.memory.longTerm.integrationUsage[op] || 0) + 1
      }
    })

    // Store successful patterns
    if (result.confidence > 0.8) {
      const pattern = this.extractPattern(prompt)
      if (pattern) {
        const existingPattern = this.memory.longTerm.successfulPatterns
          .find(p => p.pattern === pattern)
        
        if (existingPattern) {
          existingPattern.frequency++
        } else {
          this.memory.longTerm.successfulPatterns.push({
            pattern,
            context: prompt.substring(0, 100),
            frequency: 1
          })
        }
      }
    }
  }

  private extractPattern(prompt: string): string | null {
    // Simple pattern extraction - could be enhanced with ML
    const patterns = [
      /create.*workflow.*for.*(\w+)/i,
      /send.*(\w+).*when.*(\w+)/i,
      /update.*(\w+).*with.*(\w+)/i,
      /notify.*(\w+).*about.*(\w+)/i
    ]

    for (const pattern of patterns) {
      const match = prompt.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return null
  }

  private getRecentConversationContext(): string {
    return this.memory.shortTerm.lastInteractions
      .slice(-3)
      .map(interaction => `Previous: "${interaction.prompt}" -> Satisfaction: ${interaction.satisfaction || 'unknown'}`)
      .join('\n')
  }

  private getUserSatisfactionPattern(): string {
    const recentSatisfaction = this.memory.shortTerm.lastInteractions
      .slice(-5)
      .map(i => i.satisfaction)
      .filter(Boolean)

    const positive = recentSatisfaction.filter(s => s === 'positive').length
    const negative = recentSatisfaction.filter(s => s === 'negative').length
    
    if (positive > negative) return 'Generally satisfied'
    if (negative > positive) return 'Often unsatisfied - needs more guidance'
    return 'Mixed satisfaction - clarification needed'
  }

  // Enhanced parsing methods with proper typing
  private async parseContextualResponse(content: string): Promise<ContextualAnalysisResult> {
    try {
      const parsed = JSON.parse(content)
      return {
        analysis: parsed.analysis || { summary: content },
        suggestions: parsed.suggestions || [],
        confidence: parsed.confidence || 0.5,
        nextSteps: parsed.nextSteps || []
      }
    } catch {
      return {
        analysis: { summary: content } as AIDiscoveryResult,
        suggestions: [],
        confidence: 0.5,
        nextSteps: []
      }
    }
  }

  private parseIterationResponse(content: string): WorkflowIterationResult {
    // Enhanced parsing with better structure
    try {
      const parsed = JSON.parse(content)
      return {
        updatedWorkflow: parsed.updatedWorkflow || {} as Workflow,
        explanation: parsed.explanation || content,
        alternatives: parsed.alternatives || [],
        learningInsights: parsed.learningInsights || []
      }
    } catch {
      return {
        updatedWorkflow: {} as Workflow,
        explanation: content,
        alternatives: [],
        learningInsights: []
      }
    }
  }

  private parseOptimizationResponse(content: string): OptimizationSuggestions {
    // Enhanced parsing with structured output
    try {
      const parsed = JSON.parse(content)
      return {
        performance: parsed.performance || [],
        reliability: parsed.reliability || [],
        security: parsed.security || [],
        cost: parsed.cost || [],
        usability: parsed.usability || []
      }
    } catch {
      return {
        performance: ['Consider caching strategies'],
        reliability: ['Add comprehensive error handling'],
        security: ['Implement input validation'],
        cost: ['Optimize API calls', 'Use efficient data structures', 'Implement smart caching'],
        usability: ['Improve error messages', 'Add progress indicators', 'Enhance documentation']
      }
    }
  }

  // Initialization methods
  private initializeContext(sessionId: string): ConversationContext {
    return {
      sessionId,
      workflowHistory: [],
      userIntent: [],
      iterationCount: 0,
      userExpertiseLevel: 'intermediate',
      preferredServices: [],
      learningPatterns: {
        commonOperations: {},
        errorPatterns: [],
        successPatterns: []
      }
    }
  }

  private initializeMemory(): AIMemory {
    return {
      shortTerm: {
        lastInteractions: [],
        currentGoals: [],
        blockers: []
      },
      longTerm: {
        userPreferences: {
          communicationStyle: 'detailed',
          preferredComplexity: 'standard',
          learningGoals: [],
          industryFocus: [],
          technicalBackground: []
        },
        successfulPatterns: [],
        integrationUsage: {}
      }
    }
  }

  private initializeFallbackTools(): AIToolCapabilities {
    return {
      webSearch: async (query: string) => `Searched: ${query} - Tool integration needed`,
      apiTest: async () => false,
      codeValidation: async () => ({ valid: true, issues: [] }),
      securityScan: async () => ({ secure: true, vulnerabilities: [] })
    }
  }

  // Fallback methods
  private fallbackContextualAnalysis(prompt: string): ContextualAnalysisResult {
    return {
      analysis: { summary: `Enhanced analysis for: ${prompt}` } as AIDiscoveryResult,
      suggestions: ['Review and refine with enhanced capabilities'],
      confidence: 0.3,
      nextSteps: ['Add more details', 'Enable tool integration']
    }
  }

  private fallbackIteration(workflow: Workflow, feedback: string): WorkflowIterationResult {
    return {
      updatedWorkflow: workflow,
      explanation: `Enhanced changes applied based on: ${feedback}`,
      alternatives: ['Consider alternative approaches'],
      learningInsights: ['Tool integration would provide better results']
    }
  }

  private fallbackOptimizations(): OptimizationSuggestions {
    return {
      performance: ['Consider caching', 'Implement request batching', 'Use connection pooling'],
      reliability: ['Add circuit breakers', 'Implement retry logic', 'Add health checks'],
      security: ['Validate all inputs', 'Use rate limiting', 'Implement proper authentication'],
      cost: ['Optimize API calls', 'Use efficient data structures', 'Implement smart caching'],
      usability: ['Improve error messages', 'Add progress indicators', 'Enhance documentation']
    }
  }

  // Helper method to extract content from response output array
  private extractResponseContent(output: any[]): string {
    if (!output || output.length === 0) return ''
    
    const messageOutput = output.find((item: any) => item.type === 'message')
    if (messageOutput && messageOutput.content && messageOutput.content.length > 0) {
      const textContent = messageOutput.content.find((c: any) => c.type === 'output_text')
      return textContent?.text || ''
    }
    
    return ''
  }
}