import type { AgentStreamingUpdate } from './ai-agent'
import type { Workflow, WorkflowProject } from '@/types/workflow'

export interface WorkflowGenerationResponse {
  success: boolean
  enthusiasm: string
  technical_summary: string
  instant_preview?: {
    workflow_nodes: unknown[]
    workflow_edges: unknown[]
    key_integrations: string[]
  }
  workflow: Workflow
  project: WorkflowProject
  insights: {
    complexity_analysis: string
    security_considerations: string[]
    performance_tips: string[]
    next_steps: string[]
  }
  execution_ready: boolean
  progress_updates: AgentStreamingUpdate[]
  error?: string
  fallback?: boolean
  message?: string
  instructions?: string[]
}

/**
 * Client-side API service for FlowCraft
 * Handles communication with server-side API routes
 */
export class FlowCraftAPIClient {
  private static baseUrl = '/api'

  /**
   * Generate a workflow using the server-side AI agent
   */
  static async generateWorkflow(
    prompt: string,
    onProgress?: (update: AgentStreamingUpdate) => void
  ): Promise<WorkflowGenerationResponse> {
    try {
      // Provide immediate feedback
      onProgress?.({
        phase: 'analyzing',
        message: '🚀 Starting AI-powered workflow generation...',
        progress: 5,
        details: { estimated_time: '60-90 seconds' }
      })

      const response = await fetch(`${this.baseUrl}/workflow/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      const data: WorkflowGenerationResponse = await response.json()

      // If we have progress updates from the server, replay them
      if (data.progress_updates && onProgress) {
        for (const update of data.progress_updates) {
          onProgress(update)
        }
      }

      // Handle fallback cases (missing API key, etc.)
      if (data.fallback) {
        onProgress?.({
          phase: 'complete',
          message: data.message || '⚠️ Creating basic workflow (AI features unavailable)',
          progress: 100,
          details: { 
            estimated_time: data.instructions ? 'Follow setup instructions for full AI features' : 'Basic workflow created'
          }
        })

        // Return a basic fallback workflow
        return {
          ...data,
          success: true,
          enthusiasm: "🔧 I've created a basic workflow structure for you!",
          technical_summary: data.message || "Basic workflow created without AI assistance",
          workflow: this.createFallbackWorkflow(prompt),
          project: this.createFallbackProject(),
          insights: {
            complexity_analysis: 'Basic workflow structure - configure OpenAI API key for AI-powered features',
            security_considerations: ['Set up environment variables securely', 'Configure proper authentication'],
            performance_tips: ['Add error handling', 'Implement monitoring', 'Configure rate limiting'],
            next_steps: data.instructions || [
              'Configure OpenAI API key for AI-powered features',
              'Customize workflow nodes as needed',
              'Add proper error handling'
            ]
          },
          execution_ready: false,
          progress_updates: []
        }
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API client error:', error)
      
      // Provide fallback response
      onProgress?.({
        phase: 'complete',
        message: '⚠️ Connection failed, creating basic workflow',
        progress: 100,
        details: { estimated_time: 'Basic workflow created as fallback' }
      })

      return {
        success: true,
        enthusiasm: "🔧 I've created a basic workflow for you!",
        technical_summary: "Basic workflow created due to connection issues",
        workflow: this.createFallbackWorkflow(prompt),
        project: this.createFallbackProject(),
        insights: {
          complexity_analysis: 'Basic workflow structure created as fallback',
          security_considerations: ['Configure proper authentication'],
          performance_tips: ['Add error handling', 'Implement monitoring'],
          next_steps: ['Check network connection', 'Verify API configuration', 'Customize workflow nodes']
        },
        execution_ready: false,
        progress_updates: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a basic fallback workflow when AI is not available
   */
  private static createFallbackWorkflow(prompt: string): Workflow {
    return {
      id: `fallback_${Date.now()}`,
      name: 'Basic Workflow',
      description: `Basic workflow for: ${prompt}`,
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 250, y: 50 },
          data: {
            label: 'Manual Trigger',
            description: 'Start the workflow manually',
            service: 'manual',
            operation: 'start',
            config: {}
          }
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 250, y: 200 },
          data: {
            label: 'Basic Action',
            description: 'Perform a basic action',
            service: 'webhook',
            operation: 'call',
            config: {
              url: 'https://example.com/webhook',
              method: 'POST'
            }
          }
        }
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'trigger-1',
          target: 'action-1',
          type: 'default'
        }
      ],
      status: 'draft',
      originalPrompt: prompt,
      generatedCode: '// Basic workflow implementation\n// Configure OpenAI API key for AI-generated code',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * Create a basic fallback project when AI is not available
   */
  private static createFallbackProject(): WorkflowProject {
    return {
      id: `project_${Date.now()}`,
      name: 'Basic Project',
      description: 'A basic project structure',
      complexity: 'simple',
      components: [],
      integrations: [],
      generatedFiles: [
        {
          path: 'README.md',
          content: '# Basic Workflow Project\n\nConfigure OpenAI API key for AI-powered features.',
          type: 'markdown',
          description: 'Project documentation'
        }
      ],
      testSuite: [],
      monitoring: {
        enabled: false,
        metrics: [],
        alerting: [],
        dashboardConfig: {}
      }
    }
  }
} 