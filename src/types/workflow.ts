export interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'loop' | 'transform'
  position: { x: number; y: number }
  data: {
    label: string
    description?: string
    config: Record<string, unknown>
    service?: string
    operation?: string
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type?: 'default' | 'conditional' | 'smoothstep'
  label?: string
  data?: {
    condition?: string
  }
}

export interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  status: 'draft' | 'active' | 'paused' | 'error'
  createdAt: Date
  updatedAt: Date
  originalPrompt: string
  generatedCode: string
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  logs: ExecutionLog[]
  result?: unknown
}

export interface ExecutionLog {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error'
  message: string
  nodeId?: string
  data?: unknown
}

export interface AIAnalysis {
  blueprint: string
  assumptions: string[]
  suggestedNodes: WorkflowNode[]
  suggestedEdges: WorkflowEdge[]
  generatedCode: string
  recommendations: string[]
}

export interface IntegrationConfig {
  id: string
  name: string
  type: string
  icon: string
  description: string
  fields: ConfigField[]
  category: 'trigger' | 'action' | 'transform'
}

export interface ConfigField {
  name: string
  label: string
  type: 'text' | 'email' | 'url' | 'number' | 'boolean' | 'select' | 'multiselect'
  required: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  validation?: string
}

// Enhanced AI types for dynamic generation
export interface ServiceResearch {
  serviceName: string
  apiDocumentation: string
  baseUrl: string
  authentication: 'api_key' | 'oauth2' | 'bearer' | 'basic'
  endpoints: ServiceEndpoint[]
  dataStructures: Record<string, unknown>
  rateLimits?: {
    requests: number
    period: string
  }
}

export interface ServiceEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  parameters: EndpointParameter[]
  responseSchema: Record<string, unknown>
}

export interface EndpointParameter {
  name: string
  type: string
  required: boolean
  description: string
  location: 'query' | 'body' | 'header' | 'path'
}

export interface GeneratedIntegration {
  serviceName: string
  className: string
  code: string
  dependencies: string[]
  configSchema: ConfigField[]
  methods: IntegrationMethod[]
}

export interface IntegrationMethod {
  name: string
  description: string
  parameters: MethodParameter[]
  returnType: string
  errorHandling: string[]
}

export interface MethodParameter {
  name: string
  type: string
  required: boolean
  description: string
}

export interface WorkflowProject {
  id: string
  name: string
  description: string
  complexity: 'simple' | 'standard' | 'advanced' | 'enterprise'
  components: ProjectComponent[]
  integrations: GeneratedIntegration[]
  generatedFiles: GeneratedFile[]
  testSuite: TestCase[]
  monitoring: MonitoringConfig
}

export interface ProjectComponent {
  name: string
  type: 'engine' | 'builder' | 'trigger' | 'action' | 'monitor' | 'test'
  dependencies: string[]
  code: string
  filepath: string
}

export interface GeneratedFile {
  path: string
  content: string
  type: 'typescript' | 'javascript' | 'json' | 'yaml' | 'markdown'
  description: string
}

export interface TestCase {
  id: string
  name: string
  description: string
  type: 'unit' | 'integration' | 'e2e'
  code: string
  expectedOutput: unknown
}

export interface MonitoringConfig {
  enabled: boolean
  metrics: string[]
  alerting: AlertConfig[]
  dashboardConfig: Record<string, unknown>
}

export interface AlertConfig {
  name: string
  condition: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  channels: string[]
}

export interface AIDiscoveryResult {
  summary: string
  keyComponents: string[]
  identifiedTriggers: ComponentSpec[]
  identifiedActions: ComponentSpec[]
  requiredIntegrations: string[]
  unknownServices: string[]
  complexity: 'simple' | 'standard' | 'advanced' | 'enterprise'
  recommendedApproach: string
  estimatedEffort: string
}

export interface ComponentSpec {
  type: string
  service: string
  operation?: string
  description: string
  configRequirements: string[]
  dependencies: string[]
} 