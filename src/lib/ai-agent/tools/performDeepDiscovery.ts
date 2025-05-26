import { DynamicStructuredTool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { 
  DeepDiscoveryInputSchema, 
  DeepDiscoveryOutputSchema,
  type DeepDiscoveryInput,
  type DeepDiscoveryOutput 
} from '../types'
import { promptTemplates } from '../config'

function getLLM() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.')
  }
  
  return new ChatOpenAI({ 
    model: 'gpt-4o', 
    temperature: 0.3,
    maxTokens: 3000,
    apiKey: apiKey,
    // @ts-expect-error - useResponsesApi property may not be in TS interface yet
    useResponsesApi: true
  })
}

export const performDeepDiscovery = new DynamicStructuredTool({
  name: 'performDeepDiscovery',
  description: 'Analyzes automation prompts and extracts structured workflow requirements including triggers, actions, and integrations.',
  schema: DeepDiscoveryInputSchema,
  
  func: async (input: DeepDiscoveryInput): Promise<string> => {
    try {
      // Add debugging to understand what input we're receiving
      console.log('Deep discovery input:', JSON.stringify(input, null, 2))
      
      if (!input.prompt) {
        throw new Error('Missing required prompt field in deep discovery input')
      }
      
      const contextStr = input.context ? JSON.stringify(input.context, null, 2) : 'No additional context provided'
      
      const prompt = promptTemplates.discoveryPrompt
        .replace('{prompt}', input.prompt)
        .replace('{context}', contextStr)

      const systemMessage = `${promptTemplates.systemPrompt}

You are now using the performDeepDiscovery tool. Analyze the automation request thoroughly and return ONLY valid JSON matching this exact schema:

{
  "summary": "Clear, concise summary of what the automation will do",
  "keyComponents": ["component1", "component2", "component3"],
  "identifiedTriggers": [
    {
      "type": "trigger_type",
      "service": "service_name", 
      "operation": "specific_operation",
      "description": "User-friendly description",
      "configRequirements": ["requirement1", "requirement2"],
      "dependencies": ["dependency1"],
      "confidence": 85
    }
  ],
  "identifiedActions": [
    {
      "type": "action_type",
      "service": "service_name",
      "operation": "specific_operation", 
      "description": "User-friendly description",
      "configRequirements": ["requirement1"],
      "dependencies": ["dependency1"],
      "confidence": 90
    }
  ],
  "requiredIntegrations": ["service1", "service2"],
  "unknownServices": [],
  "complexity": "simple|standard|advanced|enterprise",
  "recommendedApproach": "Detailed implementation strategy",
  "estimatedEffort": "Time estimate with reasoning",
  "riskFactors": ["risk1", "risk2"],
  "alternativeApproaches": ["approach1", "approach2"]
}

Focus on:
- Popular, well-documented services (Gmail, Slack, Notion, Airtable, Stripe, etc.)
- Realistic confidence scores based on service maturity
- Specific operations (not just generic "send" or "get")
- Practical configuration requirements
- Security and reliability considerations

Return ONLY the JSON object, no markdown formatting or explanations.`

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Deep discovery timed out after 30 seconds')), 30000)
      })
      
      const response = await Promise.race([
        getLLM().invoke([
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ]),
        timeoutPromise
      ]) as any

      // Clean and parse the response
      let content = response.content as string
      content = content.trim()
      
      // Remove markdown code blocks if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Remove any ReAct-style prefixes that might be present
      if (content.startsWith('Thought:') || content.startsWith('Tool:') || content.startsWith('Action:')) {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          content = jsonMatch[0]
        } else {
          throw new Error('No valid JSON found in response')
        }
      }

      // Validate the response against our schema
      const parsed = JSON.parse(content)
      const validated = DeepDiscoveryOutputSchema.parse(parsed)
      
      return JSON.stringify(validated, null, 2)
    } catch (error) {
      console.error('Deep discovery failed:', error)
      
      // Return a fallback response that matches the schema
      const fallback: DeepDiscoveryOutput = {
        summary: `Automation workflow for: ${input.prompt}`,
        keyComponents: ['trigger', 'processing', 'action'],
        identifiedTriggers: [{
          type: 'manual',
          service: 'manual',
          operation: 'start',
          description: 'Manual trigger to start the workflow',
          configRequirements: [],
          dependencies: [],
          confidence: 70
        }],
        identifiedActions: [{
          type: 'action',
          service: 'generic',
          operation: 'execute',
          description: 'Execute the automation action',
          configRequirements: ['target_configuration'],
          dependencies: [],
          confidence: 60
        }],
        requiredIntegrations: ['manual'],
        unknownServices: [],
        complexity: 'simple',
        recommendedApproach: 'Start with a simple manual trigger and basic action, then enhance based on requirements',
        estimatedEffort: '30-60 minutes for basic implementation',
        riskFactors: ['Limited analysis due to processing error'],
        alternativeApproaches: ['Consider breaking down into smaller components']
      }
      
      return JSON.stringify(fallback, null, 2)
    }
  }
}) 