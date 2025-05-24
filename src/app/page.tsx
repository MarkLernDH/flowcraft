"use client"

import { useState } from 'react'
import { PromptInput } from '@/components/workflow/prompt-input'
import { WorkflowBuilderWrapper } from '@/components/workflow/workflow-builder'
import { WorkflowLoading } from '@/components/workflow/workflow-loading'
import { AIService } from '@/lib/ai-service'
import { Workflow } from '@/types/workflow'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Settings, Zap, MessageSquare, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type AppState = 'input' | 'workflow'

export default function Home() {
  const [state, setState] = useState<AppState>('input')
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false)

  const handlePromptSubmit = async (prompt: string) => {
    setCurrentPrompt(prompt)
    setIsGenerating(true)
    setIsWorkflowLoading(true)
    setState('workflow') // Show workflow view immediately
    
    // Add user message to chat
    setChatHistory([{ role: 'user', content: prompt }])

    // Add initial AI response to chat
    setChatHistory(prev => [...prev, { 
      role: 'assistant', 
      content: `Perfect! I'm creating a workflow based on your request. Let me analyze your requirements and build the automation flow for you...`
    }])

    try {
      // Phase 1: AI Analysis (with streaming updates)
      const analysis = await AIService.analyzePrompt(prompt)
      
      // Update chat with analysis
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `I understand! I'm creating a workflow that ${analysis.blueprint}. The workflow will have ${analysis.suggestedNodes.length} steps. Building it now...`
      }])

      // Phase 2: Generate workflow
      const generatedWorkflow = await AIService.generateWorkflow(analysis, prompt)
      
      // Small delay to let loading animation complete
      setTimeout(() => {
        setWorkflow(generatedWorkflow)
        setIsWorkflowLoading(false)
        
        // Add completion message to chat
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: `🎉 Your workflow is ready! I've created ${generatedWorkflow.nodes.length} connected steps. You can click on any node to configure it, or ask me to make changes.`
        }])
      }, 2000)
      
    } catch (error) {
      console.error('Failed to generate workflow:', error)
      setIsWorkflowLoading(false)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error generating your workflow. Please try again or let me know if you need help.'
      }])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleChatMessage = async (message: string) => {
    if (!workflow && !isWorkflowLoading) return
    
    setIsGenerating(true)
    setChatHistory(prev => [...prev, { role: 'user', content: message }])

    try {
      if (workflow) {
        // Use AI to modify the workflow based on the chat message
        const updatedWorkflow = await AIService.modifyWorkflow(workflow, message)
        setWorkflow(updatedWorkflow)
        
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: 'I\'ve updated your workflow based on your request. The changes are now reflected in the canvas.'
        }])
      } else {
        // Workflow is still loading, provide helpful response
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: 'I\'m still working on your initial workflow. Once it\'s ready, I\'ll be happy to make those changes for you!'
        }])
      }
    } catch (error) {
      console.error('Failed to modify workflow:', error)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'I had trouble making that change. Could you try rephrasing your request?'
      }])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleWorkflowSave = (updatedWorkflow: Workflow) => {
    setWorkflow(updatedWorkflow)
    console.log('Workflow saved:', updatedWorkflow)
  }

  const handleWorkflowExecute = () => {
    if (!workflow) return
    console.log('Executing workflow:', workflow)
    alert('Workflow execution started! (This is a demo)')
  }

  const handleStartOver = () => {
    setState('input')
    setWorkflow(null)
    setCurrentPrompt('')
    setChatHistory([])
    setIsWorkflowLoading(false)
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
                Describe your automation needs in plain language. Get production-ready workflows in seconds.
              </p>
            </div>

            {/* Unified Prompt Input */}
            <div className="max-w-4xl mx-auto">
              <PromptInput 
                onSubmit={handlePromptSubmit}
                className="w-full"
                placeholder="Describe your workflow... e.g., 'Create a workflow that monitors my email for invoices and automatically saves them to Google Drive'"
                buttonText="Generate Workflow"
                buttonIcon={<Sparkles className="w-4 h-4" />}
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Workflow state - unified chat + canvas view with immediate display
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleStartOver}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {workflow?.name || 'Create A Workflow'}
              </h1>
              <p className="text-sm text-gray-500">
                {isWorkflowLoading ? 'Generating...' : `${workflow?.nodes.length || 0} steps`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleWorkflowExecute}
              className="bg-green-500 hover:bg-green-600 text-white"
              size="sm"
              disabled={!workflow}
            >
              <Zap className="w-4 h-4 mr-2" />
              Test Run
            </Button>
            
            <Button variant="outline" size="sm" disabled={!workflow}>
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
            
            <Button variant="outline" size="sm" disabled={!workflow}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex min-h-0">
        {/* Workflow Canvas */}
        <div className="flex-1 bg-white relative">
          {isWorkflowLoading ? (
            <WorkflowLoading 
              prompt={currentPrompt}
              onComplete={() => setIsWorkflowLoading(false)}
            />
          ) : workflow ? (
            <WorkflowBuilderWrapper
              workflow={workflow}
              onSave={handleWorkflowSave}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <p>Workflow canvas will appear here</p>
            </div>
          )}
        </div>

        {/* Chat Sidebar - Fixed positioning */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Ask me to modify your workflow or configure specific steps
            </p>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed",
                    message.role === 'user'
                      ? 'bg-orange-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg rounded-bl-sm px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                    AI is thinking...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <PromptInput
              onSubmit={handleChatMessage}
              placeholder="Ask me to modify your workflow..."
              buttonText="Send"
              buttonIcon={<MessageSquare className="w-4 h-4" />}
              disabled={isGenerating}
              size="sm"
              showExamples={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
