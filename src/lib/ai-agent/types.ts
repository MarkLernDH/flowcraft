import { z } from 'zod'
import { 
  Workflow, 
  WorkflowNode, 
  WorkflowProject
} from '@/types/workflow'

// Agent Configuration
export interface AgentConfig {
  model: {
    provider: 'openai'
    modelName: string
    temperature: number
    maxTokens?: number
  }
  tools: string[]
  verbose?: boolean
  maxIterations?: number
}

// Streaming Updates
export interface AgentStreamingUpdate {
  phase: 'analyzing' | 'researching' | 'generating' | 'connecting' | 'optimizing' | 'complete'
  message: string
  progress: number // 0-100
  toolUsed?: string
  toolInput?: string
  toolOutput?: string
  details?: {
    nodes_generated?: number
    integrations_found?: number
    tests_created?: number
    estimated_time?: string
    iteration?: number
    iterations?: number
    step?: string
    tools_used?: number
    confidence?: number
  }
  preview?: {
    workflow_snippet?: string
    visual_preview?: WorkflowNode[]
    code_preview?: string
  }
}

// Agent Response Types
export interface AgentResponse {
  success: boolean
  result: {
    workflow?: Workflow
    project?: WorkflowProject
    insights?: {
      complexity_analysis: string
      security_considerations: string[]
      performance_tips: string[]
      next_steps: string[]
    }
  }
  metadata: {
    execution_time: number
    tools_used: string[]
    iterations: number
    confidence_score: number
  }
  error?: string
}

// Tool Input/Output Schemas using Zod
export const DeepDiscoveryInputSchema = z.object({
  prompt: z.string().describe('The user automation request to analyze'),
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

export const DeepDiscoveryOutputSchema = z.object({
  summary: z.string(),
  keyComponents: z.array(z.string()),
  identifiedTriggers: z.array(z.object({
    type: z.string(),
    service: z.string(),
    operation: z.string().nullable().optional(),
    description: z.string(),
    configRequirements: z.array(z.string()),
    dependencies: z.array(z.string()),
    confidence: z.number().min(0).max(100)
  })),
  identifiedActions: z.array(z.object({
    type: z.string(),
    service: z.string(),
    operation: z.string().nullable().optional(),
    description: z.string(),
    configRequirements: z.array(z.string()),
    dependencies: z.array(z.string()),
    confidence: z.number().min(0).max(100)
  })),
  requiredIntegrations: z.array(z.string()),
  unknownServices: z.array(z.string()),
  complexity: z.enum(['simple', 'standard', 'advanced', 'enterprise']),
  recommendedApproach: z.string(),
  estimatedEffort: z.string(),
  riskFactors: z.array(z.string()).nullable().optional(),
  alternativeApproaches: z.array(z.string()).nullable().optional()
})

export const IntegrationResearchInputSchema = z.object({
  services: z.array(z.string()).describe('List of services to research'),
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

export const IntegrationResearchOutputSchema = z.object({
  integrations: z.array(z.object({
    serviceName: z.string(),
    className: z.string(),
    code: z.string(),
    dependencies: z.array(z.string()),
    configSchema: z.array(z.object({
      name: z.string(),
      label: z.string(),
      type: z.enum(['text', 'email', 'url', 'number', 'boolean', 'select', 'multiselect', 'password']),
      required: z.boolean(),
      placeholder: z.string().optional(),
      options: z.array(z.object({
        label: z.string(),
        value: z.string()
      })).optional()
    })),
    methods: z.array(z.object({
      name: z.string(),
      description: z.string(),
      parameters: z.array(z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
        description: z.string()
      })),
      returnType: z.string(),
      errorHandling: z.array(z.string())
    })),
    apiDocumentation: z.string().optional(),
    rateLimits: z.object({
      requests: z.number(),
      period: z.string()
    }).optional(),
    testingStrategy: z.string().optional()
  }))
})

export const WorkflowGenerationInputSchema = z.object({
  discovery: z.any().describe('Discovery results from deep analysis'),
  integrations: z.array(z.any()).describe('Generated integrations'),
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

// Import new tool schemas
export { 
  IntentClassificationInputSchema, 
  IntentClassificationOutputSchema,
  type IntentClassificationInput,
  type IntentClassificationOutput 
} from '@/lib/ai-agent/tools/classifyIntent'

export { 
  ApplyDeltaInputSchema, 
  ApplyDeltaOutputSchema,
  WorkflowDeltaSchema,
  type ApplyDeltaInput,
  type ApplyDeltaOutput,
  type WorkflowDelta 
} from './tools/applyWorkflowDelta'

export const WorkflowGenerationOutputSchema = z.object({
  workflow: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    nodes: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number()
      }),
      data: z.object({
        label: z.string(),
        description: z.string().nullable().optional(),
        service: z.string().nullable().optional(),
        operation: z.string().nullable().optional(),
        config: z.record(z.string(), z.unknown()).nullable().optional()
      })
    })),
    edges: z.array(z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      type: z.string().nullable().optional(),
      label: z.string().nullable().optional(),
      data: z.object({
        condition: z.string().nullable().optional()
      }).nullable().optional()
    })),
    status: z.enum(['draft', 'active', 'paused', 'error']),
    originalPrompt: z.string(),
    generatedCode: z.string()
  }),
  project: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    complexity: z.enum(['simple', 'standard', 'advanced', 'enterprise']),
    components: z.array(z.object({
      name: z.string(),
      type: z.string(),
      dependencies: z.array(z.string()),
      code: z.string(),
      filepath: z.string()
    })),
    integrations: z.array(z.object({
      serviceName: z.string(),
      className: z.string(),
      code: z.string(),
      dependencies: z.array(z.string()),
      configSchema: z.array(z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(['text', 'email', 'url', 'number', 'boolean', 'select', 'multiselect', 'password']),
        required: z.boolean(),
        placeholder: z.string().optional(),
        options: z.array(z.object({
          label: z.string(),
          value: z.string()
        })).optional()
      })),
      methods: z.array(z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.array(z.object({
          name: z.string(),
          type: z.string(),
          required: z.boolean(),
          description: z.string()
        })),
        returnType: z.string(),
        errorHandling: z.array(z.string())
      })),
      apiDocumentation: z.string().optional(),
      rateLimits: z.object({
        requests: z.number(),
        period: z.string()
      }).optional(),
      testingStrategy: z.string().optional()
    })),
    generatedFiles: z.array(z.object({
      path: z.string(),
      content: z.string(),
      type: z.string(),
      description: z.string()
    })),
    testSuite: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      type: z.string(),
      code: z.string(),
      expectedOutput: z.unknown()
    })),
    monitoring: z.object({
      enabled: z.boolean(),
      metrics: z.array(z.string()),
      alerting: z.array(z.object({
        name: z.string(),
        condition: z.string(),
        severity: z.string(),
        channels: z.array(z.string())
      })),
      dashboardConfig: z.record(z.string(), z.unknown())
    })
  }),
  deploymentInstructions: z.array(z.string()).nullable().optional(),
  securityChecklist: z.array(z.string()).nullable().optional()
})

// Tool Types
export type DeepDiscoveryInput = z.infer<typeof DeepDiscoveryInputSchema>
export type DeepDiscoveryOutput = z.infer<typeof DeepDiscoveryOutputSchema>
export type IntegrationResearchInput = z.infer<typeof IntegrationResearchInputSchema>
export type IntegrationResearchOutput = z.infer<typeof IntegrationResearchOutputSchema>
export type WorkflowGenerationInput = z.infer<typeof WorkflowGenerationInputSchema>
export type WorkflowGenerationOutput = z.infer<typeof WorkflowGenerationOutputSchema>

// Conversation Types
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    tool_calls?: string[]
    confidence_score?: number
    suggestions?: string[]
    workflow_changes?: string[]
  }
}

export interface ConversationContext {
  id: string
  messages: ConversationMessage[]
  current_workflow?: Workflow
  user_preferences?: Record<string, unknown>
  session_metadata?: {
    start_time: Date
    total_iterations: number
    tools_used: string[]
  }
} 