/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code, 
  Play, 
  Settings, 
  GitBranch, 
  Database, 
  Zap, 
  FileText,
  ChevronRight,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkflowBuilderWrapper } from '@/components/workflow/workflow-builder'
import { WorkflowLoading } from '@/components/workflow/workflow-loading'
import { CodeViewer } from '@/components/workflow/code-viewer'
import { PromptInput } from '@/components/workflow/prompt-input'
import { AIDebugPanel } from '@/components/ui/ai-debug-panel'
import { Workflow, WorkflowProject } from '@/types/workflow'
import { cn } from '@/lib/utils'

interface LovableLayoutProps {
  workflow: Workflow | null
  project: WorkflowProject | null
  aiMessages: Array<{role: 'user' | 'assistant', content: string}>
  isGenerating: boolean
  isWorkflowLoading: boolean
  currentPrompt: string
  onChatMessage: (message: string) => void
  onExecuteWorkflow: () => void
  onStartOver: () => void
  onWorkflowSave: (workflow: Workflow) => void
}

interface ChatContentPart {
  type: 'text' | 'code'
  content: string
  language?: string
}

function formatChatContent(content: string): ChatContentPart[] {
  // Simple markdown formatting for chat
  let formattedContent = content
  
  // Handle code blocks first
  const codeBlocks: Array<{type: 'code', language: string, content: string}> = []
  const codeRegex = /```(\w+)?\s*([\s\S]*?)\s*```/g
  let match
  
  while ((match = codeRegex.exec(content)) !== null) {
    codeBlocks.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim()
    })
  }
  
  // Remove code blocks from content for text processing
  formattedContent = formattedContent.replace(/```(\w+)?\s*([\s\S]*?)\s*```/g, '___CODE_BLOCK___')
  
  // Split by paragraphs and process markdown
  const paragraphs = formattedContent.split('\n\n').filter(p => p.trim())
  const processedParagraphs = paragraphs.map(paragraph => {
    let processed = paragraph.trim()
    
    // Bold text **text**
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Italic text *text*
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Inline code `code`
    processed = processed.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
    
    // Lists (bullet points)
    const lines = processed.split('\n')
    const listItems = lines.map(line => {
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return `<li class="ml-4">${line.trim().substring(2)}</li>`
      }
      return line
    })
    
    if (listItems.some(line => line.includes('<li'))) {
      return `<ul class="list-disc list-inside space-y-1">${listItems.join('')}</ul>`
    }
    
    return processed
  })
  
  // Reconstruct content with code blocks
  let finalContent = processedParagraphs.join('\n\n')
  codeBlocks.forEach((block) => {
    finalContent = finalContent.replace('___CODE_BLOCK___', `CODE_BLOCK:${JSON.stringify(block)}`)
  })
  
  // Parse final content
  const parts: ChatContentPart[] = []
  const segments = finalContent.split(/(CODE_BLOCK:\{.*?\})/g)
  
  segments.forEach(segment => {
    if (segment.startsWith('CODE_BLOCK:')) {
      try {
        const codeBlock = JSON.parse(segment.substring(11))
        parts.push(codeBlock)
      } catch (e) {
        parts.push({ type: 'text', content: segment })
      }
    } else if (segment.trim()) {
      parts.push({ type: 'text', content: segment.trim() })
    }
  })

  return parts.length > 0 ? parts : [{ type: 'text', content: content }]
}

export function LovableLayout({ 
  workflow,
  project,
  aiMessages, 
  isGenerating,
  isWorkflowLoading,
  currentPrompt,
  onChatMessage,
  onExecuteWorkflow, 
  onStartOver,
  onWorkflowSave
}: LovableLayoutProps) {
  const [codeViewerOpen, setCodeViewerOpen] = useState(false)
  const [debugPanelOpen, setDebugPanelOpen] = useState(false)

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Sidebar - AI Chat (Lovable Style) - Independent Scrolling */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* AI Header - Fixed */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">FlowCraft</span>
          </div>
          <Button
            variant="ghost"
            onClick={onStartOver}
            className="text-gray-600 hover:text-gray-900 p-0 h-auto"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>

        {/* AI Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {aiMessages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={message.role === 'user' ? 'text-right' : ''}
            >
              {message.role === 'user' ? (
                <div className="bg-blue-500 text-white p-3 rounded-lg inline-block max-w-xs text-sm">
                  {message.content}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="prose prose-sm max-w-none">
                    {formatChatContent(message.content).map((part, i) => {
                      if (part.type === 'code') {
                        return (
                          <pre key={i} className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                            <code>{part.content}</code>
                          </pre>
                        )
                      } else {
                        return (
                          <div 
                            key={i} 
                            className="text-gray-700 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: part.content }}
                          />
                        )
                      }
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                  AI is thinking...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Always visible when workflow is ready */}
        {workflow && !isWorkflowLoading && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                onClick={onExecuteWorkflow}
                className="bg-green-500 hover:bg-green-600 text-white"
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Test
              </Button>
              <Button 
                variant="outline" 
                size="sm"
              >
                <Database className="w-4 h-4 mr-1" />
                APIs
              </Button>
              <Button 
                onClick={() => setCodeViewerOpen(!codeViewerOpen)}
                variant="outline" 
                size="sm"
              >
                <Code className="w-4 h-4 mr-1" />
                Code
              </Button>
            </div>
          </div>
        )}

        {/* Chat Input - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <PromptInput
            onSubmit={onChatMessage}
            placeholder="Ask me to modify your workflow..."
            buttonText="Send"
            buttonIcon={<MessageSquare className="w-4 h-4" />}
            disabled={isGenerating}
            size="sm"
            showExamples={false}
          />
        </div>
      </div>

      {/* Main Content Area - Independent Scrolling */}
      <div className="flex-1 flex flex-col h-full">
        {/* Top Bar (like Lovable) - Fixed */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">
              {workflow?.name || 'Workflow Automation'}
            </h1>
            {workflow && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Ready
              </span>
            )}
            {isWorkflowLoading && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Building...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setCodeViewerOpen(!codeViewerOpen)}
              variant={codeViewerOpen ? "default" : "outline"}
              size="sm"
            >
              <Code className="w-4 h-4 mr-2" />
              Code viewer
            </Button>
          </div>
        </div>

        {/* Workflow Canvas + Code Viewer - Scrollable */}
        <div className="flex-1 flex overflow-hidden">
          {/* Workflow Canvas - Independent Scrolling */}
          <div className={`transition-all duration-300 ${codeViewerOpen ? 'w-1/2' : 'w-full'} overflow-hidden`}>
            {isWorkflowLoading ? (
              <WorkflowLoading 
                prompt={currentPrompt}
                onComplete={() => {}}
              />
            ) : workflow ? (
              <div className="h-full overflow-auto">
                <WorkflowBuilderWrapper
                  workflow={workflow}
                  onSave={onWorkflowSave}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 bg-white">
                <div className="text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Your workflow will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Code Viewer (slides in like Lovable) - Independent Scrolling */}
          <AnimatePresence>
            {codeViewerOpen && project && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '50%' }}
                exit={{ width: 0 }}
                transition={{ duration: 0.3 }}
                className="border-l border-gray-200 overflow-hidden"
              >
                <CodeViewer project={project} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Debug Panel - Development Only */}
        <div className="absolute bottom-4 right-4">
          <AnimatePresence>
            {debugPanelOpen ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <AIDebugPanel className="bg-white/95 backdrop-blur shadow-lg border border-gray-200 rounded-lg" />
                <Button
                  onClick={() => setDebugPanelOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 h-auto"
                >
                  ✕
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => setDebugPanelOpen(true)}
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur shadow-lg border border-gray-200 hover:bg-white/95 text-gray-600 hover:text-gray-900"
                  title="AI Debug Panel"
                >
                  🧠 AI
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 