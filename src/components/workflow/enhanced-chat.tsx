// Enhanced Chat Interface with Lovable-style Interactions
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Sparkles, 
  Lightbulb, 
  Play, 
  Settings, 
  Copy,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Brain,
  Code,
  Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'normal' | 'suggestion' | 'action' | 'code'
  actions?: ChatAction[]
}

interface ChatAction {
  id: string
  label: string
  icon: React.ElementType
  action: () => void
  variant?: 'primary' | 'secondary'
}

interface SmartSuggestion {
  id: string
  text: string
  icon: React.ElementType
  category: 'modify' | 'test' | 'deploy' | 'optimize'
}

interface EnhancedChatProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  onExecuteWorkflow?: () => void
  isGenerating: boolean
  workflowReady: boolean
}

export function EnhancedChat({ 
  messages, 
  onSendMessage, 
  onExecuteWorkflow,
  isGenerating,
  workflowReady 
}: EnhancedChatProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update suggestions based on workflow state
  useEffect(() => {
    if (workflowReady) {
      setSuggestions([
        {
          id: 'test',
          text: 'Test this workflow',
          icon: Play,
          category: 'test'
        },
        {
          id: 'optimize',
          text: 'Add error handling',
          icon: Zap,
          category: 'optimize'
        },
        {
          id: 'modify',
          text: 'Add a notification step',
          icon: Sparkles,
          category: 'modify'
        },
        {
          id: 'deploy',
          text: 'How do I deploy this?',
          icon: Rocket,
          category: 'deploy'
        }
      ])
    } else {
      setSuggestions([
        {
          id: 'example1',
          text: 'Make it send Slack notifications',
          icon: Sparkles,
          category: 'modify'
        },
        {
          id: 'example2',
          text: 'Add data validation',
          icon: Brain,
          category: 'optimize'
        }
      ])
    }
  }, [workflowReady])

  const handleSend = () => {
    if (input.trim() && !isGenerating) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    onSendMessage(suggestion.text)
  }

  const formatMessage = (content: string) => {
    // Enhanced message formatting with better markdown support
    let formatted = content

    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    
    // Code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, 
      '<pre class="bg-gray-900 text-green-400 p-3 rounded-lg my-2 overflow-x-auto"><code>$1</code></pre>')
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, 
      '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Bullet points
    formatted = formatted.replace(/^• (.+)$/gm, 
      '<div class="flex items-start gap-2 my-1"><span class="text-blue-500 mt-1">•</span><span>$1</span></div>')

    return formatted
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-purple-500 rounded-full flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">FlowCraft AI</h3>
            <p className="text-xs text-gray-600">
              {isGenerating ? 'Building your workflow...' : 
               workflowReady ? 'Workflow ready! Ask me anything.' : 
               'Ready to build automations'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-lg px-4 py-2'
                  : 'bg-gray-50 rounded-lg p-4 border border-gray-200'
              }`}>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-medium text-gray-600">FlowCraft AI</span>
                  </div>
                )}
                
                <div 
                  className={`prose prose-sm max-w-none ${
                    message.role === 'user' ? 'text-white' : 'text-gray-700'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />

                {/* Message Actions */}
                {message.actions && message.actions.length > 0 && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                    {message.actions.map((action) => (
                      <Button
                        key={action.id}
                        onClick={action.action}
                        variant={action.variant === 'primary' ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs"
                      >
                        <action.icon className="w-3 h-3 mr-1" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Quick Actions for AI messages */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                    <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                      <ThumbsUp className="w-3 h-3 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                      <ThumbsDown className="w-3 h-3 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && !isGenerating && (
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-600">Quick suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-full text-sm transition-colors"
              >
                <suggestion.icon className="w-3 h-3 text-gray-500" />
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        {workflowReady && onExecuteWorkflow && (
          <div className="mb-3">
            <Button
              onClick={onExecuteWorkflow}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              disabled={isGenerating}
            >
              <Play className="w-4 h-4 mr-2" />
              Test Workflow
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                workflowReady 
                  ? "Ask me to modify your workflow, or test it..." 
                  : "Describe the automation you want to build..."
              }
              disabled={isGenerating}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            {isGenerating ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Press Enter to send</span>
            {workflowReady && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Workflow ready
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Code className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}