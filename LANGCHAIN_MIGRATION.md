# LangChain Agent Migration Guide

## Overview

FlowCraft has been upgraded from a simple OpenAI-based AI service to a robust LangChain agent system. This migration provides:

- **Agentic Workflow Generation**: Multi-step reasoning with specialized tools
- **Structured Output**: Validated responses using Zod schemas
- **Better Error Handling**: Fallback mechanisms and retry logic
- **Conversational Context**: Persistent conversation memory
- **Tool Specialization**: Dedicated tools for discovery, integration research, and workflow generation

## What Changed

### Before (OpenAI-only)
```typescript
import { AIService } from '@/lib'

// Simple OpenAI call with JSON parsing issues
const result = await AIService.generateLovableWorkflow(prompt, onProgress)
```

### After (LangChain Agents)
```typescript
import { FlowCraftAIService } from '@/lib'

// Robust agent-based generation with structured tools
const result = await FlowCraftAIService.generateLovableWorkflow(prompt, onProgress)
```

## Key Improvements

### 1. Structured Tool System

**Old Approach**: Single OpenAI call trying to do everything
```typescript
// Everything in one massive prompt - prone to errors
const response = await openai.responses.create({
  model: "gpt-4o",
  input: prompt,
  instructions: "Do discovery, research integrations, and generate workflow..."
})
```

**New Approach**: Specialized tools for each phase
```typescript
// Phase 1: Deep Discovery
const discovery = await performDeepDiscovery.func({
  prompt,
  context: { existing_workflows: [], user_preferences: {} }
})

// Phase 2: Integration Research  
const integrations = await researchIntegrations.func({
  services: discovery.requiredIntegrations,
  requirements: { authentication_types: ['api_key', 'oauth2'] }
})

// Phase 3: Workflow Generation
const workflow = await generateWorkflow.func({
  discovery,
  integrations: integrations.integrations,
  preferences: { layout: 'vertical', error_handling: 'advanced' }
})
```

### 2. Validated Outputs with Zod

**Old Approach**: Manual JSON parsing with fallbacks
```typescript
try {
  const parsed = JSON.parse(response.content)
  // Hope it matches expected structure
} catch (error) {
  // Return hardcoded fallback
}
```

**New Approach**: Schema validation
```typescript
// Defined schemas ensure type safety
export const DeepDiscoveryOutputSchema = z.object({
  summary: z.string(),
  identifiedTriggers: z.array(z.object({
    type: z.string(),
    service: z.string(),
    confidence: z.number().min(0).max(100)
  })),
  // ... more structured fields
})

// Automatic validation
const validated = DeepDiscoveryOutputSchema.parse(parsed)
```

### 3. Conversation Context

**Old Approach**: Stateless interactions
```typescript
// No memory between calls
const result = await AIService.modifyWorkflow(workflow, "add slack notification")
```

**New Approach**: Persistent conversation context
```typescript
// Maintains conversation history and context
const result = await FlowCraftAIService.modifyWorkflowConversational(
  workflow, 
  "add slack notification",
  conversationId
)

// Access conversation history
const conversation = FlowCraftAIService.getConversation(conversationId)
```

### 4. Service-Specific Knowledge

**Old Approach**: Generic integration generation
```typescript
// AI had to guess service details every time
const integration = await generateIntegration(serviceName)
```

**New Approach**: Built-in service knowledge
```typescript
const serviceKnowledge = {
  slack: {
    authType: 'oauth2',
    baseUrl: 'https://slack.com/api',
    commonOperations: ['post_message', 'list_channels'],
    dependencies: ['@slack/web-api'],
    rateLimits: { requests: 100, period: 'minute' }
  }
  // ... more services
}
```

## Migration Steps

### 1. Update Imports
```typescript
// Old
import { AIService } from '@/lib/ai-service'

// New  
import { FlowCraftAIService } from '@/lib/ai-service-v2'
// or
import { AIService } from '@/lib' // Auto-imports new service
```

### 2. Update Method Calls

The API remains largely the same for backward compatibility:

```typescript
// This still works exactly the same
const result = await AIService.generateLovableWorkflow(prompt, onProgress)

// New conversational features
const modifyResult = await AIService.modifyWorkflowConversational(
  workflow,
  "add error handling",
  "user-session-123"
)
```

### 3. Handle New Response Structure

The response structure is enhanced but backward compatible:

```typescript
const result = await AIService.generateLovableWorkflow(prompt, onProgress)

// New fields available
console.log(result.generation_promise) // Promise<CompleteWorkflowResult>
console.log(result.instant_preview)    // Immediate visual preview

// Wait for complete generation
const complete = await result.generation_promise
console.log(complete.workflow)         // Full workflow
console.log(complete.project)          // Project structure  
console.log(complete.insights)         // AI insights
```

## New Features Available

### 1. Agent Statistics
```typescript
const stats = FlowCraftAIService.getAgentStats()
console.log(stats.totalConversations)
console.log(stats.totalToolCalls)
console.log(stats.averageConfidence)
```

### 2. Conversation Management
```typescript
// Get conversation history
const conversation = FlowCraftAIService.getConversation('session-123')

// Clear conversation
FlowCraftAIService.clearConversation('session-123')
```

### 3. Enhanced Progress Updates
```typescript
const result = await AIService.generateLovableWorkflow(prompt, (update) => {
  console.log(update.phase)        // 'analyzing' | 'researching' | 'generating'
  console.log(update.toolUsed)     // Which tool is currently running
  console.log(update.toolOutput)   // Tool output summary
  console.log(update.preview)      // Live preview of work in progress
})
```

## Removed/Deprecated Features

### Files Removed
- `src/lib/ai-service.ts` - Old OpenAI-only implementation (moved to legacy)
- `src/lib/ai/enhanced_ai_agent.ts` - Replaced by LangChain agent system

### Methods Deprecated
- `EnhancedFlowCraftAI.generateInstantEnthusiasm()` - Now internal method
- `EnhancedFlowCraftAI.performDeepDiscovery()` - Now a LangChain tool
- `EnhancedFlowCraftAI.researchAndGenerateIntegrations()` - Now a LangChain tool

## Environment Variables

Add your OpenAI API key:
```bash
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

## Testing the Migration

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Test Basic Generation**:
   ```typescript
   import { AIService } from '@/lib'
   
   const result = await AIService.generateLovableWorkflow(
     "Create a workflow that monitors Gmail and sends Slack notifications"
   )
   ```

3. **Test Conversational Features**:
   ```typescript
   const modifyResult = await AIService.modifyWorkflowConversational(
     existingWorkflow,
     "add error handling and retry logic"
   )
   ```

## Performance Improvements

- **Faster Initial Response**: Instant enthusiasm and preview while agent works
- **Better Error Recovery**: Each tool has fallback mechanisms
- **Structured Validation**: No more JSON parsing errors
- **Conversation Memory**: Reduces redundant context in follow-up requests
- **Service Knowledge**: Faster integration generation with built-in service data

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure to import from the new locations
2. **Type Errors**: The new system has better TypeScript support
3. **API Key**: Ensure `NEXT_PUBLIC_OPENAI_API_KEY` is set

### Debug Mode
```typescript
// Enable verbose logging in development
const agent = createAgent({
  verbose: true,
  model: { modelName: 'gpt-4o', temperature: 0.3 }
})
```

## Future Enhancements

The new agent system enables:
- **Custom Tools**: Add domain-specific tools for your use case
- **Vector Search**: Integration with vector databases for knowledge retrieval
- **Multi-Model Support**: Easy addition of other LLM providers
- **Workflow Templates**: AI-powered template suggestions
- **Advanced Reasoning**: Multi-step planning and execution

## Support

If you encounter issues during migration:
1. Check the console for detailed error messages
2. Verify all dependencies are installed
3. Ensure environment variables are set
4. Review the agent statistics for debugging info

The new system is designed to be more robust and provide better error messages to help with troubleshooting. 