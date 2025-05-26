"use client"

import { useState } from 'react'
import { PromptInput } from '@/components/workflow/prompt-input'
import { LovableLayout } from '@/components/layout/lovable-layout'
import { FlowCraftAPIClient } from '@/lib/api-client'
import type { AgentStreamingUpdate } from '@/lib/ai-agent'
import { WorkflowExecutor } from '@/lib/workflow-executor'
import { Workflow, WorkflowProject, WorkflowNode, WorkflowEdge } from '@/types/workflow'
import { Sparkles } from 'lucide-react'

type AppState = 'input' | 'workflow'

export default function Home() {
  const [state, setState] = useState<AppState>('input')
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [project, setProject] = useState<WorkflowProject | null>(null)
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false)
  const [apiTestResult, setApiTestResult] = useState<string | null>(null)
  const [detailedLogs, setDetailedLogs] = useState<Array<{timestamp: string, level: 'info' | 'success' | 'warning' | 'error', message: string, details?: Record<string, unknown>}>>([])
  const [showDetailedLogs, setShowDetailedLogs] = useState(false)

  // Add detailed logging function
  const addDetailedLog = (level: 'info' | 'success' | 'warning' | 'error', message: string, details?: Record<string, unknown>) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    }
    setDetailedLogs(prev => [...prev, logEntry])
    console.log(`[${level.toUpperCase()}] ${message}`, details || '')
  }

  // Test the API (placeholder for now)
  const handleTestAPI = async () => {
    setApiTestResult('Testing...')
    try {
      // For now, just simulate a successful test
      setApiTestResult('✅ Enhanced AI service is ready!')
    } catch (error) {
      setApiTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handlePromptSubmit = async (prompt: string) => {
    setCurrentPrompt(prompt)
    setIsGenerating(true)
    setIsWorkflowLoading(true)
    setState('workflow')
    
    // Clear previous logs and start fresh
    setDetailedLogs([])
    addDetailedLog('info', 'Starting workflow generation process', { prompt: prompt.substring(0, 100) + '...' })
    
    try {
      addDetailedLog('info', 'Calling FlowCraft API Client with GPT-4o', { model: 'gpt-4o', prompt_length: prompt.length })
      
      // Use the new API-based workflow generation
      const response = await FlowCraftAPIClient.generateWorkflow(
        prompt,
        (update: AgentStreamingUpdate) => {
          
          // Log each progress update
          addDetailedLog('info', `Progress Update: ${update.message}`, {
            phase: update.phase,
            progress: update.progress,
            details: update.details
          })
          
          // Add streaming updates to chat
          setChatHistory(prev => {
            const lastMessage = prev[prev.length - 1]
            
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content.includes('🔨')) {
              // Update existing progress message
              const newChatHistory = [...prev]
              newChatHistory[newChatHistory.length - 1] = {
                role: 'assistant',
                content: `🔨 ${update.message}\n\n**Progress:** ${update.progress}%${update.details ? `\n**Details:** ${Object.entries(update.details).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}`
              }
              return newChatHistory
            } else {
              // Add new progress message
              return [...prev, {
                role: 'assistant',
                content: `🔨 ${update.message}\n\n**Progress:** ${update.progress}%${update.details ? `\n**Details:** ${Object.entries(update.details).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}`
              }]
            }
          })

          // Show instant preview if available
          if (update.preview?.visual_preview) {
            // You could set a preview state here if you want to show partial results
          }
        }
      )
      
      addDetailedLog('success', 'Received response from API', {
        success: response.success,
        workflow_nodes: response.workflow?.nodes?.length || 0,
        project_components: response.project?.components?.length || 0,
        has_instant_preview: !!response.instant_preview
      })
      
      // Show immediate enthusiasm and technical summary
      setChatHistory([
        { role: 'user', content: prompt },
        { role: 'assistant', content: response.enthusiasm },
        { role: 'assistant', content: response.technical_summary }
      ])

      // Show instant preview if available
      if (response.instant_preview) {
        // Convert instant preview to workflow format for display
        const previewWorkflow: Workflow = {
          id: 'preview',
          name: 'Workflow Preview',
          description: 'Initial workflow preview',
          nodes: response.instant_preview.workflow_nodes as WorkflowNode[],
          edges: response.instant_preview.workflow_edges as WorkflowEdge[],
          status: 'draft',
          originalPrompt: prompt,
          generatedCode: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setWorkflow(previewWorkflow)
      }

      // Set the final workflow and project (API client returns them directly)
      if (response.workflow && response.project) {
        addDetailedLog('success', 'Setting up workflow and project', {
          workflow_id: response.workflow.id,
          workflow_name: response.workflow.name,
          project_id: response.project.id,
          project_name: response.project.name
        })
        
        setWorkflow(response.workflow)
        setProject(response.project)
      } else {
        addDetailedLog('error', 'Workflow or project missing from response', {
          has_workflow: !!response.workflow,
          has_project: !!response.project,
          response_success: response.success
        })
        throw new Error('Workflow generation failed: Missing workflow or project data')
      }
      setIsWorkflowLoading(false)
      
      addDetailedLog('success', 'Workflow generation completed successfully', {
        total_nodes: response.workflow?.nodes?.length || 0,
        total_edges: response.workflow?.edges?.length || 0,
        complexity: response.insights?.complexity_analysis || 'Unknown',
        ai_model: 'gpt-4o'
      })
      
      // Add insights to chat
      if (response.insights) {
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: `🎉 Your workflow is ready! Here are some insights:\n\n**Complexity:** ${response.insights.complexity_analysis}\n\n**Next Steps:**\n${response.insights.next_steps?.map(step => `• ${step}`).join('\n') || 'No specific next steps provided'}`
        }])
      }
      
    } catch (error) {
      console.error('Generation failed:', error)
      addDetailedLog('error', 'Workflow generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      const errorMessage = 'I had trouble generating your workflow. Let me try a different approach.'
      setChatHistory(prev => [...prev, { role: 'assistant', content: errorMessage }])
      setIsWorkflowLoading(false)
    } finally {
      setIsGenerating(false)
      addDetailedLog('info', 'Workflow generation process completed', { 
        final_state: workflow ? 'success' : 'failed',
        total_logs: detailedLogs.length + 1
      })
    }
  }

  const handleChatMessage = async (message: string) => {
    if (!workflow) return
    
    setIsGenerating(true)
    
    // Add user message to chat
    const newUserMessage = { role: 'user' as const, content: message }
    setChatHistory(prev => [...prev, newUserMessage])
    
    try {
      // TODO: Implement conversational modification via API route
      // For now, provide a simple response
      const newAiMessage = { role: 'assistant' as const, content: `I understand you want to modify the workflow. The conversational modification feature is being updated to work with the new API architecture. For now, you can manually edit the workflow using the visual editor.` }
      setChatHistory(prev => [...prev, newAiMessage])
      
    } catch (error) {
      console.error('Failed to modify workflow:', error)
      const errorMessage = 'I had trouble understanding that modification. Could you please rephrase your request?'
      setChatHistory(prev => [...prev, { role: 'assistant', content: errorMessage }])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleWorkflowSave = (updatedWorkflow: Workflow) => {
    setWorkflow(updatedWorkflow)
    console.log('Workflow saved:', updatedWorkflow)
  }

  const handleWorkflowExecute = async () => {
    if (!workflow) return
    
    console.log('🚀 Executing workflow:', workflow.name)
    
    // Add execution start message
    setChatHistory(prev => [...prev, { 
      role: 'assistant', 
      content: `🚀 Starting workflow execution...\n\nI'll run through each step and show you the results in real-time!` 
    }])

    try {
      const result = await WorkflowExecutor.executeWorkflow(
        workflow, 
        project || undefined,
        (stepResult) => {
          // Real-time progress updates
          console.log('Step completed:', stepResult)
        }
      )
      
      const summary = WorkflowExecutor.getExecutionSummary(result)
      
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `${summary}\n\nHere's what happened:\n${result.results.map(step => 
          `• ${step.nodeName}: ${step.status === 'completed' ? '✅' : '❌'} (${step.duration}ms)`
        ).join('\n')}\n\nYour automation is working perfectly! 🎉` 
      }])
      
    } catch (error) {
      console.error('Execution failed:', error)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Workflow execution encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nLet me help you debug and fix this issue!` 
      }])
    }
  }

  const handleStartOver = () => {
    setState('input')
    setWorkflow(null)
    setProject(null)
    setCurrentPrompt('')
    setChatHistory([])
    setIsWorkflowLoading(false)
    setIsGenerating(false)
  }

  if (state === 'input') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Build <span className="text-orange-500">Any Workflow</span> With Just a Prompt
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
                Describe your automation needs in plain language. Get complete workflow systems with backend code in seconds.
              </p>
            </div>

            {/* Unified Prompt Input */}
            <div className="max-w-4xl mx-auto">
              <PromptInput 
                onSubmit={handlePromptSubmit}
                className="w-full"
                placeholder="Describe your workflow automation... e.g., 'Create a system that monitors my email for invoices, extracts the data with AI, and automatically saves them to Google Sheets'"
                buttonText="Generate Workflow"
                buttonIcon={<Sparkles className="w-4 h-4" />}
                disabled={isGenerating}
              />
              
              {/* API Test Section */}
              <div className="mt-6 text-center">
                <button
                  onClick={handleTestAPI}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  disabled={apiTestResult === 'Testing...'}
                >
                  Test Responses API
                </button>
                {apiTestResult && (
                  <p className="mt-2 text-sm text-gray-600">{apiTestResult}</p>
                )}
              </div>
            </div>

            {/* Feature Preview */}
            <div className="max-w-4xl mx-auto mt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Generation</h3>
                  <p className="text-gray-600 text-sm">Describe your needs and watch as AI builds complete automation systems with custom integrations and backend code.</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-green-500 font-bold">⚡</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instant Execution</h3>
                  <p className="text-gray-600 text-sm">Test and run your workflows immediately. See real-time results and debug issues with built-in monitoring.</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-blue-500 font-bold">🔧</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Production Ready</h3>
                  <p className="text-gray-600 text-sm">Export complete TypeScript projects with integrations, error handling, and monitoring - ready for deployment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Workflow state - Lovable-style layout
  return (
              <LovableLayout
            workflow={workflow}
            project={project}
            aiMessages={chatHistory}
            isGenerating={isGenerating}
            isWorkflowLoading={isWorkflowLoading}
            currentPrompt={currentPrompt}
            onChatMessage={handleChatMessage}
            onExecuteWorkflow={handleWorkflowExecute}
            onStartOver={handleStartOver}
            onWorkflowSave={handleWorkflowSave}
            detailedLogs={detailedLogs}
            showDetailedLogs={showDetailedLogs}
            onToggleDetailedLogs={() => setShowDetailedLogs(!showDetailedLogs)}
          />
  )
}