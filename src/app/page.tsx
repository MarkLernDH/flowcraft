"use client"

import { useState } from 'react'
import { PromptInput } from '@/components/workflow/prompt-input'
import { LovableLayout } from '@/components/layout/lovable-layout'
import { FlowCraftAI, ProgressUpdate } from '@/lib/ai-service'
import { WorkflowExecutor } from '@/lib/workflow-executor'
import { Workflow, WorkflowProject } from '@/types/workflow'
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
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null)
  const [apiTestResult, setApiTestResult] = useState<string | null>(null)

  // Test the Responses API
  const handleTestAPI = async () => {
    setApiTestResult('Testing...')
    try {
      const result = await FlowCraftAI.testResponsesAPI()
      setApiTestResult(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
    } catch (error) {
      setApiTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handlePromptSubmit = async (prompt: string) => {
    setCurrentPrompt(prompt)
    setIsGenerating(true)
    setIsWorkflowLoading(true)
    setState('workflow')
    
    try {
      // Get immediate enthusiastic response
      const enthusiasticResponse = FlowCraftAI.generateLovableResponse(prompt)
      
      setChatHistory([
        { role: 'user', content: prompt },
        { role: 'assistant', content: enthusiasticResponse }
      ])

      // Use the fast generation method
      const { workflow: generatedWorkflow, project: generatedProject } = 
        await FlowCraftAI.generateWorkflowFast(prompt, handleProgressUpdate)
      
      setWorkflow(generatedWorkflow)
      setProject(generatedProject)
      setIsWorkflowLoading(false)
      
    } catch (error) {
      console.error('Generation failed:', error)
      const errorMessage = 'I had trouble generating your workflow. Let me try a different approach.'
      setChatHistory(prev => [...prev, { role: 'assistant', content: errorMessage }])
      setIsWorkflowLoading(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleChatMessage = async (message: string) => {
    if (!workflow) return
    
    setIsGenerating(true)
    
    // Add user message to chat
    const newUserMessage = { role: 'user' as const, content: message }
    setChatHistory(prev => [...prev, newUserMessage])
    
    // Update session history
    FlowCraftAI.updateSessionHistory(sessionId, 'user', message)
    
    try {
      // Use enhanced collaborative workflow modification
      const modifiedWorkflow = await FlowCraftAI.modifyWorkflow(workflow, message, sessionId)
      
      // Update workflow state
      setWorkflow(modifiedWorkflow)
      
      // Generate AI response about the modification
      const aiResponse = `I've updated your workflow based on your request. The changes include modifications to the workflow structure and connections.`
      
      const newAiMessage = { role: 'assistant' as const, content: aiResponse }
      setChatHistory(prev => [...prev, newAiMessage])
      
      // Update session history
      FlowCraftAI.updateSessionHistory(sessionId, 'assistant', aiResponse)
      
    } catch (error) {
      console.error('Failed to modify workflow:', error)
      const errorMessage = 'I had trouble understanding that modification. Could you please rephrase your request?'
      setChatHistory(prev => [...prev, { role: 'assistant', content: errorMessage }])
      FlowCraftAI.updateSessionHistory(sessionId, 'assistant', errorMessage)
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

  const handleProgressUpdate = (update: ProgressUpdate) => {
    setProgressUpdate(update)
    
    // Add streaming progress messages to chat
    setChatHistory(prev => {
      const lastMessage = prev[prev.length - 1]
      
      // If the last message is from assistant and is a progress message, update it
      if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content.includes('🔨')) {
        const newChatHistory = [...prev]
        newChatHistory[newChatHistory.length - 1] = {
          role: 'assistant',
          content: `🔨 ${update.message}\n\n**Progress:** ${update.progress}%${update.data ? `\n**Details:** ${Object.entries(update.data).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}`
        }
        return newChatHistory
      } else {
        // Add new progress message
        return [...prev, {
          role: 'assistant',
          content: `🔨 ${update.message}\n\n**Progress:** ${update.progress}%${update.data ? `\n**Details:** ${Object.entries(update.data).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}`
        }]
      }
    })
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
    />
  )
}