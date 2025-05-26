import { DynamicStructuredTool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { 
  IntegrationResearchInputSchema, 
  IntegrationResearchOutputSchema,
  type IntegrationResearchInput,
  type IntegrationResearchOutput 
} from '../types'
import { promptTemplates } from '../config'

function getLLM() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.')
  }
  
  return new ChatOpenAI({ 
    model: 'gpt-4o', 
    temperature: 0.2,
    maxTokens: 4000,
    apiKey: apiKey,
    // @ts-expect-error - useResponsesApi property may not be in TS interface yet
    useResponsesApi: true
  })
}

// Service-specific integration templates and knowledge
const serviceKnowledge = {
  gmail: {
    authType: 'oauth2',
    baseUrl: 'https://gmail.googleapis.com',
    commonOperations: ['list_messages', 'send_message', 'get_message', 'search_messages'],
    dependencies: ['googleapis', '@google-cloud/local-auth'],
    rateLimits: { requests: 1000000000, period: 'day' }
  },
  slack: {
    authType: 'oauth2',
    baseUrl: 'https://slack.com/api',
    commonOperations: ['post_message', 'list_channels', 'get_user_info', 'upload_file'],
    dependencies: ['@slack/web-api'],
    rateLimits: { requests: 100, period: 'minute' }
  },
  notion: {
    authType: 'api_key',
    baseUrl: 'https://api.notion.com/v1',
    commonOperations: ['create_page', 'update_page', 'query_database', 'get_page'],
    dependencies: ['@notionhq/client'],
    rateLimits: { requests: 3, period: 'second' }
  },
  airtable: {
    authType: 'api_key',
    baseUrl: 'https://api.airtable.com/v0',
    commonOperations: ['list_records', 'create_record', 'update_record', 'delete_record'],
    dependencies: ['airtable'],
    rateLimits: { requests: 5, period: 'second' }
  },
  stripe: {
    authType: 'api_key',
    baseUrl: 'https://api.stripe.com/v1',
    commonOperations: ['create_customer', 'create_payment_intent', 'list_charges', 'create_subscription'],
    dependencies: ['stripe'],
    rateLimits: { requests: 100, period: 'second' }
  },
  webhook: {
    authType: 'bearer',
    baseUrl: 'configurable',
    commonOperations: ['send_webhook', 'receive_webhook', 'validate_signature'],
    dependencies: ['axios', 'crypto'],
    rateLimits: { requests: 1000, period: 'minute' }
  }
}

export const researchIntegrations = new DynamicStructuredTool({
  name: 'researchIntegrations',
  description: 'Researches and generates TypeScript integration code for specified services with proper authentication and error handling.',
  schema: IntegrationResearchInputSchema,
  
  func: async (input: IntegrationResearchInput): Promise<string> => {
    try {
      // Add debugging and validation
      console.log('Integration research input:', JSON.stringify(input, null, 2))
      
      if (!input.services || !Array.isArray(input.services) || input.services.length === 0) {
        throw new Error('Missing or invalid services array in integration research input')
      }
      
      const requirementsStr = input.requirements ? JSON.stringify(input.requirements, null, 2) : 'No specific requirements'
      
      const prompt = promptTemplates.integrationPrompt
        .replace('{services}', input.services.join(', '))
        .replace('{requirements}', requirementsStr)

      // Enhance prompt with service-specific knowledge
      const knownServices = input.services.filter(service => 
        serviceKnowledge[service.toLowerCase() as keyof typeof serviceKnowledge]
      )
      const unknownServices = input.services.filter(service => 
        !serviceKnowledge[service.toLowerCase() as keyof typeof serviceKnowledge]
      )

      let enhancedPrompt = prompt
      if (knownServices.length > 0) {
        enhancedPrompt += `\n\nKnown service details:\n`
        knownServices.forEach(service => {
          const knowledge = serviceKnowledge[service.toLowerCase() as keyof typeof serviceKnowledge]
          enhancedPrompt += `\n${service}:
- Auth: ${knowledge.authType}
- Base URL: ${knowledge.baseUrl}
- Common operations: ${knowledge.commonOperations.join(', ')}
- Dependencies: ${knowledge.dependencies.join(', ')}
- Rate limits: ${knowledge.rateLimits.requests} requests per ${knowledge.rateLimits.period}`
        })
      }

      if (unknownServices.length > 0) {
        enhancedPrompt += `\n\nUnknown services (research needed): ${unknownServices.join(', ')}`
      }

      const systemMessage = `${promptTemplates.systemPrompt}

You are now using the researchIntegrations tool. Generate comprehensive TypeScript integration code and return ONLY valid JSON matching this schema:

{
  "integrations": [
    {
      "serviceName": "service_name",
      "className": "ServiceNameIntegration",
      "code": "complete TypeScript class code with proper typing, error handling, and authentication",
      "dependencies": ["package1", "package2"],
      "configSchema": [
        {
          "name": "apiKey",
          "label": "API Key",
          "type": "password",
          "required": true,
          "placeholder": "Enter your API key"
        }
      ],
      "methods": [
        {
          "name": "methodName",
          "description": "What this method does",
          "parameters": [
            {
              "name": "param1",
              "type": "string",
              "required": true,
              "description": "Parameter description"
            }
          ],
          "returnType": "Promise<ResponseType>",
          "errorHandling": ["ValidationError", "NetworkError", "AuthError"]
        }
      ],
      "apiDocumentation": "https://docs.service.com/api",
      "rateLimits": {
        "requests": 100,
        "period": "minute"
      },
      "testingStrategy": "How to test this integration"
    }
  ]
}

Requirements for the generated code:
- Use proper TypeScript types and interfaces
- Include comprehensive error handling with custom error classes
- Implement retry logic with exponential backoff
- Add proper authentication handling
- Include rate limiting considerations
- Add JSDoc comments for all methods
- Use modern async/await patterns
- Include input validation
- Handle edge cases gracefully
- Make code production-ready

IMPORTANT: For configSchema type field, use ONLY these exact values:
- "text" (for text inputs)
- "email" (for email addresses)
- "url" (for URLs)
- "number" (for numeric inputs)
- "boolean" (for true/false)
- "select" (for dropdown selection)
- "multiselect" (for multiple selections)
- "password" (for sensitive data like API keys)

DO NOT use "string" - use "text" instead.

Return ONLY the JSON object, no markdown formatting.`

      const response = await getLLM().invoke([
        { role: 'system', content: systemMessage },
        { role: 'user', content: enhancedPrompt }
      ])

      // Clean and parse the response
      let content = response.content as string
      content = content.trim()
      
      // Remove markdown code blocks if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // Validate the response against our schema
      const parsed = JSON.parse(content)
      const validated = IntegrationResearchOutputSchema.parse(parsed)
      
      return JSON.stringify(validated, null, 2)
    } catch (error) {
      console.error('Integration research failed:', error)
      
      // Return fallback integrations for each service
      const services = input.services || ['generic']
      const fallbackIntegrations: IntegrationResearchOutput = {
        integrations: services.map(service => ({
          serviceName: service,
          className: `${service.charAt(0).toUpperCase() + service.slice(1)}Integration`,
          code: `/**
 * ${service} Integration
 * Generated fallback integration class
 */
export class ${service.charAt(0).toUpperCase() + service.slice(1)}Integration {
  private config: ${service.charAt(0).toUpperCase() + service.slice(1)}Config

  constructor(config: ${service.charAt(0).toUpperCase() + service.slice(1)}Config) {
    this.config = config
  }

  async execute(params: any): Promise<any> {
    try {
      // Implementation needed for ${service}
      throw new Error('Integration not yet implemented')
    } catch (error) {
      throw new Error(\`${service} integration failed: \${error.message}\`)
    }
  }
}

interface ${service.charAt(0).toUpperCase() + service.slice(1)}Config {
  apiKey?: string
  baseUrl?: string
}`,
          dependencies: ['axios'],
          configSchema: [
            {
              name: 'apiKey',
              label: 'API Key',
              type: 'password',
              required: true,
              placeholder: `Enter your ${service} API key`
            }
          ],
          methods: [
            {
              name: 'execute',
              description: `Execute ${service} operation`,
              parameters: [
                {
                  name: 'params',
                  type: 'any',
                  required: true,
                  description: 'Operation parameters'
                }
              ],
              returnType: 'Promise<any>',
              errorHandling: ['ValidationError', 'NetworkError']
            }
          ],
          apiDocumentation: `https://docs.${service}.com/api`,
          rateLimits: {
            requests: 100,
            period: 'minute'
          },
          testingStrategy: `Create unit tests for ${service} integration methods`
        }))
      }
      
      return JSON.stringify(fallbackIntegrations, null, 2)
    }
  }
}) 