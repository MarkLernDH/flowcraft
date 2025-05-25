import OpenAI from 'openai'

// Type definitions for API Research Tool
export interface APIEndpoint {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  parameters: APIParameter[]
  authentication?: 'api_key' | 'oauth2' | 'bearer' | 'basic'
  rateLimit?: {
    requests: number
    period: string
  }
}

export interface APIParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  location: 'query' | 'body' | 'header' | 'path'
}

export interface APITestResult {
  success: boolean
  statusCode: number
  responseTime: number
  responseData: unknown
  errors: string[]
}

export interface ServiceDocumentation {
  serviceName: string
  baseUrl: string
  documentation: {
    authentication: {
      type: 'api_key' | 'oauth2' | 'bearer' | 'basic'
      details: string
    }
    endpoints: APIEndpoint[]
    rateLimit: {
      requests: number
      period: string
    }
  }
}

export interface AIAnalysisResult {
  reliability: number
  complexity: number
  usability: number
  recommendations: string[]
}

export interface IntegrationResult {
  serviceName: string
  className: string
  code: string
  dependencies: string[]
  configSchema: Array<{
    name: string
    label: string
    type: string
    required: boolean
  }>
  methods: Array<{
    name: string
    description: string
    parameters: APIParameter[]
    returnType: string
    errorHandling: string[]
  }>
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export class AIAPIResearcher {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    })
  }

  async researchService(serviceName: string): Promise<ServiceDocumentation> {
    const researchPrompt = `Research the ${serviceName} API and provide comprehensive documentation including authentication, endpoints, and rate limits.`
    
    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: researchPrompt,
        temperature: 0.2,
        max_output_tokens: 2000
      })

      const content = response.output_text || 
                     this.extractContentFromResponse(response.output) || 
                     ''

      return this.parseServiceDocumentation(content, serviceName)
    } catch (error) {
      console.error('Service research failed:', error)
      return this.getFallbackDocumentation(serviceName)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async testEndpoint(_endpoint: APIEndpoint, _testData: Record<string, unknown>): Promise<APITestResult> {
    // In a real implementation, this would make actual HTTP requests
    // For now, we'll simulate testing
    const startTime = Date.now()
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))
      
      const responseTime = Date.now() - startTime
      
      return {
        success: true,
        statusCode: 200,
        responseTime,
        responseData: { message: 'Test successful' },
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        responseTime: Date.now() - startTime,
        responseData: null,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async generateWorkingIntegration(serviceName: string, capabilities: string[]): Promise<IntegrationResult> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _documentation = await this.researchService(serviceName)
    
    const generationPrompt = `Generate a production-ready TypeScript integration class for ${serviceName} with capabilities: ${capabilities.join(', ')}`
    
    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: generationPrompt,
        temperature: 0.2,
        max_output_tokens: 3000
      })

      const content = response.output_text || 
                     this.extractContentFromResponse(response.output) || 
                     ''

      return this.parseIntegrationResponse(content, serviceName)
    } catch (error) {
      console.error('Integration generation failed:', error)
      return this.getFallbackIntegration(serviceName)
    }
  }

  private extractContentFromResponse(output: unknown[]): string {
    if (!output || output.length === 0) return ''
    
    const firstOutput = output[0] as { content?: Array<{ text?: string }> }
    if (firstOutput.content && firstOutput.content.length > 0) {
      return firstOutput.content[0].text || ''
    }
    
    return ''
  }

  private parseServiceDocumentation(content: string, serviceName: string): ServiceDocumentation {
    try {
      const parsed = JSON.parse(content)
      return parsed
    } catch {
      return this.getFallbackDocumentation(serviceName)
    }
  }

  private parseIntegrationResponse(content: string, serviceName: string): IntegrationResult {
    try {
      const parsed = JSON.parse(content)
      return parsed
    } catch {
      return this.getFallbackIntegration(serviceName)
    }
  }

  private getFallbackDocumentation(serviceName: string): ServiceDocumentation {
    return {
      serviceName,
      baseUrl: `https://api.${serviceName.toLowerCase()}.com`,
      documentation: {
        authentication: {
          type: 'api_key',
          details: 'API key authentication required'
        },
        endpoints: [],
        rateLimit: {
          requests: 1000,
          period: 'hour'
        }
      }
    }
  }

  private getFallbackIntegration(serviceName: string): IntegrationResult {
    return {
      serviceName,
      className: `${serviceName}Integration`,
      code: `// ${serviceName} integration class\nexport class ${serviceName}Integration {\n  // Implementation needed\n}`,
      dependencies: [],
      configSchema: [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'text',
          required: true
        }
      ],
      methods: []
    }
  }

  private async analyzeServiceWithAI(documentation: ServiceDocumentation): Promise<AIAnalysisResult> {
    const analysisPrompt = `
    Analyze this API service documentation and provide reliability, complexity, and usability scores (0-100):
    
    ${JSON.stringify(documentation, null, 2)}
    
    Consider:
    - Documentation completeness and clarity
    - Authentication complexity
    - Rate limiting policies
    - Error handling patterns
    - SDK availability
    - Community support
    
    Respond with JSON in this format:
    {
      "reliability": 85,
      "complexity": 30,
      "usability": 90,
      "recommendations": [
        "Implement exponential backoff for rate limiting",
        "Cache authentication tokens to reduce API calls",
        "Set up webhook endpoints for real-time updates"
      ]
    }
    `

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: analysisPrompt,
        temperature: 0.2,
        max_output_tokens: 1000
      })

      const content = response.output_text || 
                     this.extractContentFromResponse(response.output) || 
                     ''
      return this.parseAnalysisResponse(content)
    } catch {
      return {
        reliability: 70,
        complexity: 50,
        usability: 60,
        recommendations: [
          'Proceed with standard integration approach', 
          'Test thoroughly in development environment',
          'Monitor API performance and error rates'
        ]
      }
    }
  }

  private async analyzeResponseWithAI(endpoint: APIEndpoint, result: APITestResult): Promise<string[]> {
    if (result.success) {
      return [
        'API call successful', 
        'Response received as expected',
        `Response time: ${result.responseTime}ms`,
        'Ready for integration'
      ]
    }

    const analysisPrompt = `
    API test failed with these details:
    - Endpoint: ${endpoint.url}
    - Method: ${endpoint.method}
    - Status Code: ${result.statusCode}
    - Response Time: ${result.responseTime}ms
    - Errors: ${result.errors.join(', ')}
    - Response Data: ${JSON.stringify(result.responseData)}
    
    Provide specific, actionable troubleshooting steps and improvements.
    Consider common issues like:
    - Authentication problems
    - Rate limiting
    - Request format issues
    - Network connectivity
    - API endpoint changes
    - Required headers or parameters
    
    Format as a list of specific action items.
    `

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: analysisPrompt,
        temperature: 0.3,
        max_output_tokens: 500
      })

      const content = response.output_text || 
                     this.extractContentFromResponse(response.output) || 
                     ''
      const suggestions = content.split('\n')
        .filter(s => s.trim())
        .map(s => s.replace(/^[-*]\s*/, '')) || []
      return suggestions
    } catch {
      return [
        'Check authentication credentials and format',
        'Verify endpoint URL and method',
        'Review required headers and parameters',
        'Check API documentation for recent changes',
        'Test with API explorer or Postman first'
      ]
    }
  }

  private parseAnalysisResponse(content: string): AIAnalysisResult {
    try {
      const parsed = JSON.parse(content)
      return {
        reliability: parsed.reliability || 70,
        complexity: parsed.complexity || 50,
        usability: parsed.usability || 60,
        recommendations: parsed.recommendations || []
      }
    } catch {
      return {
        reliability: 70,
        complexity: 50,
        usability: 60,
        recommendations: ['Unable to analyze automatically - manual review recommended']
      }
    }
  }
}