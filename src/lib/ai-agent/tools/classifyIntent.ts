import { DynamicStructuredTool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

// Input/Output schemas
export const IntentClassificationInputSchema = z.object({
  userMessage: z.string().describe("The user message to classify"),
  context: z.object({
    hasExistingWorkflow: z.boolean().default(false),
    conversationHistory: z.array(z.string()).default([]),
    userPreferences: z.record(z.string(), z.any()).default({})
  }).default({
    hasExistingWorkflow: false,
    conversationHistory: [],
    userPreferences: {}
  })
})

export const IntentClassificationOutputSchema = z.object({
  intent: z.enum([
    'create_workflow',
    'modify_workflow', 
    'optimize_workflow',
    'analyze_workflow',
    'generate_test_suite',
    'debug_workflow',
    'explain_workflow',
    'unknown'
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  subIntent: z.string().nullable().optional(),
  extractedEntities: z.object({
    services: z.array(z.string()).default([]),
    operations: z.array(z.string()).default([]),
    constraints: z.array(z.string()).default([])
  }).default({
    services: [],
    operations: [],
    constraints: []
  })
})

export type IntentClassificationInput = z.infer<typeof IntentClassificationInputSchema>
export type IntentClassificationOutput = z.infer<typeof IntentClassificationOutputSchema>

function getLLM() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.')
  }
  
  return new ChatOpenAI({ 
    model: 'gpt-4o', 
    temperature: 0.1,
    maxTokens: 1000,
    apiKey: apiKey,
    // @ts-expect-error - useResponsesApi property may not be in TS interface yet
    useResponsesApi: true
  })
}

export const classifyIntent = new DynamicStructuredTool({
  name: 'classifyIntent',
  description: 'Classifies user intent to route to the appropriate workflow tools and processes.',
  schema: IntentClassificationInputSchema,
  
  func: async (input: IntentClassificationInput): Promise<string> => {
    try {
      // Add debugging to understand what input we're receiving
      console.log('Intent classification input:', JSON.stringify(input, null, 2))
      
      if (!input.userMessage) {
        throw new Error('Missing required userMessage field in intent classification input')
      }
      
      const contextStr = input.context ? JSON.stringify(input.context, null, 2) : 'No additional context'
      
      const systemMessage = `You are an intent classification agent. Given a user's message, classify what type of automation task they are requesting.

Analyze the user message and classify their intent into one of these categories:

- create_workflow: User wants to build a new automation workflow from scratch
- modify_workflow: User wants to change, update, or extend an existing workflow
- optimize_workflow: User wants to improve performance, efficiency, or reliability of a workflow
- analyze_workflow: User wants to understand, review, or get insights about a workflow
- generate_test_suite: User wants to create tests for their workflow
- debug_workflow: User is experiencing issues and needs troubleshooting help
- explain_workflow: User wants explanation of how something works
- unknown: Intent is unclear or doesn't fit other categories

Consider these indicators:
- Keywords like "build", "create", "make" → create_workflow
- Keywords like "change", "modify", "update", "add", "remove" → modify_workflow  
- Keywords like "optimize", "improve", "faster", "better" → optimize_workflow
- Keywords like "analyze", "review", "understand", "explain" → analyze_workflow
- Keywords like "test", "validate", "check" → generate_test_suite
- Keywords like "broken", "error", "not working", "debug" → debug_workflow

Also extract relevant entities like service names, operations, and constraints.

Return ONLY valid JSON matching this exact schema:
{
  "intent": "create_workflow",
  "confidence": 0.92,
  "reasoning": "User said 'build from scratch' and mentioned specific services like Gmail and Slack",
  "subIntent": "email_to_slack_automation",
  "extractedEntities": {
    "services": ["gmail", "slack"],
    "operations": ["new_email", "send_message"],
    "constraints": ["only_attachments", "work_hours"]
  }
}

Only return valid JSON, no explanations or markdown formatting.`

      const prompt = `User message: "${input.userMessage}"

Context: ${contextStr}

Classify this intent and extract relevant information.`

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Intent classification timed out after 20 seconds')), 20000)
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

      // Validate the response against our schema
      const parsed = JSON.parse(content)
      const validated = IntentClassificationOutputSchema.parse(parsed)
      
      return JSON.stringify(validated, null, 2)
    } catch (error) {
      console.error('Intent classification failed:', error)
      
      // Return a fallback response that matches the schema
      const fallback: IntentClassificationOutput = {
        intent: 'unknown',
        confidence: 0.5,
        reasoning: 'Unable to classify intent due to processing error. Manual review needed.',
        subIntent: 'needs_clarification',
        extractedEntities: {
          services: [],
          operations: [],
          constraints: []
        }
      }
      
      return JSON.stringify(fallback, null, 2)
    }
  }
}) 