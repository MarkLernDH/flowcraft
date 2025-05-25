"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  File, 
  Folder, 
  FolderOpen, 
  Code, 
  Settings, 
  Database,
  ChevronRight,
  ChevronDown,
  Zap,
  FileText
} from 'lucide-react'
import { WorkflowProject } from '@/types/workflow'

interface CodeViewerProps {
  project: WorkflowProject
}

export function CodeViewer({ project }: CodeViewerProps) {
  const [activeFile, setActiveFile] = useState('workflow-engine.ts')
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src', 'integrations']))

  const fileTree = [
    {
      name: 'src',
      type: 'folder',
      children: [
        {
          name: 'workflow-engine.ts',
          type: 'file',
          icon: Code,
          content: project.components.find(c => c.type === 'engine')?.code || generateFallbackEngineCode()
        },
        {
          name: 'monitoring.ts',
          type: 'file', 
          icon: Settings,
          content: generateMonitoringCode()
        },
        {
          name: 'types.ts',
          type: 'file',
          icon: FileText,
          content: generateTypesCode()
        }
      ]
    },
    {
      name: 'integrations',
      type: 'folder',
      children: project.integrations.length > 0 
        ? project.integrations.map(integration => ({
            name: `${integration.serviceName.toLowerCase()}.ts`,
            type: 'file',
            icon: Database,
            content: integration.code || generateFallbackIntegrationCode(integration.serviceName)
          }))
        : [{
            name: 'example-integration.ts',
            type: 'file',
            icon: Database,
            content: generateExampleIntegrationCode()
          }]
    },
    {
      name: 'workflows',
      type: 'folder',
      children: [
        {
          name: 'main-workflow.ts',
          type: 'file',
          icon: Zap,
          content: generateWorkflowDefinitionCode(project)
        }
      ]
    }
  ]

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName)
    } else {
      newExpanded.add(folderName)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFileTree = (items: any[], depth = 0) => {
    return items.map((item, index) => (
      <div key={index}>
        {item.type === 'folder' ? (
          <div>
            <button
              onClick={() => toggleFolder(item.name)}
              className="flex items-center gap-2 w-full text-left px-2 py-1 hover:bg-gray-800 rounded text-gray-300 transition-colors"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {expandedFolders.has(item.name) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {expandedFolders.has(item.name) ? (
                <FolderOpen className="w-4 h-4" />
              ) : (
                <Folder className="w-4 h-4" />
              )}
              <span className="text-sm">{item.name}</span>
            </button>
            {expandedFolders.has(item.name) && (
              <div>
                {renderFileTree(item.children, depth + 1)}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setActiveFile(item.name)}
            className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-sm transition-colors ${
              activeFile === item.name 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-800'
            }`}
            style={{ paddingLeft: `${depth * 16 + 24}px` }}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </button>
        )}
      </div>
    ))
  }

  const getFileContent = (fileName: string) => {
    const findFile = (items: any[]): any => {
      for (const item of items) {
        if (item.type === 'file' && item.name === fileName) {
          return item
        }
        if (item.children) {
          const found = findFile(item.children)
          if (found) return found
        }
      }
      return null
    }
    
    const file = findFile(fileTree)
    return file?.content || '// File content will appear here'
  }

  return (
    <div className="h-full flex bg-gray-900">
      {/* File Tree */}
      <div className="w-64 bg-gray-900 border-r border-gray-700 p-4">
        <h3 className="text-white font-medium mb-4 text-sm">Project Files</h3>
        <div className="space-y-1">
          {renderFileTree(fileTree)}
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 bg-black p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
          <File className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 text-sm">{activeFile}</span>
        </div>
        <div className="overflow-auto h-full">
          <pre className="text-green-400 text-sm font-mono leading-relaxed">
            <code>{getFileContent(activeFile)}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

// Helper functions to generate code content
function generateFallbackEngineCode(): string {
  return `import { EventEmitter } from 'events'
import { WorkflowDefinition, WorkflowExecution } from './types'

export class WorkflowEngine extends EventEmitter {
  private workflows = new Map<string, WorkflowDefinition>()
  private executions = new Map<string, WorkflowExecution>()

  constructor() {
    super()
    this.setupErrorHandling()
  }

  async executeWorkflow(workflowId: string, input?: any): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(\`Workflow \${workflowId} not found\`)
    }

    const execution: WorkflowExecution = {
      id: this.generateId(),
      workflowId,
      status: 'running',
      startTime: new Date(),
      steps: [],
      input
    }

    this.executions.set(execution.id, execution)
    this.emit('executionStarted', execution)

    try {
      for (const step of workflow.steps) {
        await this.executeStep(step, execution)
      }
      
      execution.status = 'completed'
      execution.endTime = new Date()
      this.emit('executionCompleted', execution)
      
    } catch (error) {
      execution.status = 'failed'
      execution.error = error.message
      execution.endTime = new Date()
      this.emit('executionFailed', execution)
    }

    return execution
  }

  private async executeStep(step: any, execution: WorkflowExecution): Promise<void> {
    console.log(\`Executing step: \${step.name}\`)
    // Step execution logic here
    execution.steps.push({
      stepId: step.id,
      status: 'completed',
      startTime: new Date(),
      endTime: new Date()
    })
  }

  private setupErrorHandling(): void {
    this.on('error', (error) => {
      console.error('Workflow engine error:', error)
    })
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}`
}

function generateMonitoringCode(): string {
  return `import { WorkflowExecution } from './types'

export class WorkflowMonitor {
  private metrics = new Map<string, any>()

  trackExecution(execution: WorkflowExecution): void {
    const metric = {
      executionId: execution.id,
      workflowId: execution.workflowId,
      duration: this.calculateDuration(execution),
      status: execution.status,
      timestamp: new Date()
    }

    this.metrics.set(execution.id, metric)
    this.reportMetrics(metric)
  }

  private calculateDuration(execution: WorkflowExecution): number {
    if (!execution.endTime) return 0
    return execution.endTime.getTime() - execution.startTime.getTime()
  }

  private reportMetrics(metric: any): void {
    // Send metrics to monitoring service
    console.log('Workflow metric:', metric)
  }

  getPerformanceStats(): any {
    const executions = Array.from(this.metrics.values())
    return {
      totalExecutions: executions.length,
      averageDuration: this.calculateAverageDuration(executions),
      successRate: this.calculateSuccessRate(executions)
    }
  }

  private calculateAverageDuration(executions: any[]): number {
    if (executions.length === 0) return 0
    const total = executions.reduce((sum, exec) => sum + exec.duration, 0)
    return total / executions.length
  }

  private calculateSuccessRate(executions: any[]): number {
    if (executions.length === 0) return 0
    const successful = executions.filter(exec => exec.status === 'completed').length
    return (successful / executions.length) * 100
  }
}`
}

function generateTypesCode(): string {
  return `export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  triggers: WorkflowTrigger[]
  created: Date
  updated: Date
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'action' | 'condition' | 'transform'
  config: Record<string, any>
  nextStep?: string
  errorHandler?: string
}

export interface WorkflowTrigger {
  id: string
  type: 'manual' | 'scheduled' | 'webhook' | 'event'
  config: Record<string, any>
  enabled: boolean
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  startTime: Date
  endTime?: Date
  steps: StepExecution[]
  input?: any
  output?: any
  error?: string
}

export interface StepExecution {
  stepId: string
  status: 'running' | 'completed' | 'failed' | 'skipped'
  startTime: Date
  endTime?: Date
  input?: any
  output?: any
  error?: string
}

export interface Integration {
  id: string
  name: string
  type: string
  config: Record<string, any>
  methods: IntegrationMethod[]
}

export interface IntegrationMethod {
  name: string
  description: string
  parameters: Parameter[]
  returnType: string
}

export interface Parameter {
  name: string
  type: string
  required: boolean
  description: string
}`
}

function generateFallbackIntegrationCode(serviceName: string): string {
  return `import { Integration } from '../types'

export class ${serviceName}Integration implements Integration {
  id = '${serviceName.toLowerCase()}'
  name = '${serviceName}'
  type = 'api'
  
  private apiKey: string
  private baseUrl: string

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.${serviceName.toLowerCase()}.com'
  }

  async connect(): Promise<boolean> {
    try {
      // Test connection to ${serviceName} API
      const response = await fetch(\`\${this.baseUrl}/ping\`, {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch (error) {
      console.error('${serviceName} connection failed:', error)
      return false
    }
  }

  async executeAction(action: string, params: any): Promise<any> {
    const response = await fetch(\`\${this.baseUrl}/\${action}\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(\`${serviceName} API error: \${response.statusText}\`)
    }

    return await response.json()
  }

  async getData(endpoint: string, params?: any): Promise<any> {
    const url = new URL(\`\${this.baseUrl}/\${endpoint}\`)
    if (params) {
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, params[key])
      )
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(\`${serviceName} API error: \${response.statusText}\`)
    }

    return await response.json()
  }
}`
}

function generateExampleIntegrationCode(): string {
  return generateFallbackIntegrationCode('Example')
}

function generateWorkflowDefinitionCode(project: WorkflowProject): string {
  return `import { WorkflowDefinition } from '../types'

export const ${project.name.replace(/\s+/g, '')}Workflow: WorkflowDefinition = {
  id: '${project.id}',
  name: '${project.name}',
  description: '${project.description}',
  steps: [
    {
      id: 'step-1',
      name: 'Initialize Workflow',
      type: 'action',
      config: {
        action: 'initialize',
        timeout: 30000
      },
      nextStep: 'step-2'
    },
    {
      id: 'step-2', 
      name: 'Process Data',
      type: 'transform',
      config: {
        transformation: 'processInput',
        validation: true
      },
      nextStep: 'step-3'
    },
    {
      id: 'step-3',
      name: 'Execute Integration',
      type: 'action',
      config: {
        integration: '${project.integrations[0]?.serviceName || 'example'}',
        method: 'executeAction',
        retries: 3
      }
    }
  ],
  triggers: [
    {
      id: 'manual-trigger',
      type: 'manual',
      config: {},
      enabled: true
    }
  ],
  created: new Date('${project.id ? new Date().toISOString() : new Date().toISOString()}'),
  updated: new Date('${new Date().toISOString()}')
}

export default ${project.name.replace(/\s+/g, '')}Workflow`
} 