"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface PromptInputProps {
  onSubmit: (prompt: string) => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
  placeholder?: string
  buttonText?: string
  buttonIcon?: React.ReactNode
  showExamples?: boolean
  size?: 'default' | 'sm'
}

export function PromptInput({ 
  onSubmit, 
  isLoading = false,
  disabled = false,
  className,
  placeholder = "Eg. Build a workflow that runs every Monday at 8am...",
  buttonText = "Generate Workflow",
  buttonIcon = <ArrowRight className="w-4 h-4 ml-2" />,
  showExamples = true,
  size = 'default'
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("")

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading && !disabled) {
      onSubmit(prompt.trim())
      if (size === 'sm') {
        setPrompt("") // Clear input for chat mode
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const examplePrompts = [
    "Daily Data Pipeline",
    "Multi-vendor Order Processing", 
    "Weekly Report Generator",
    "CRM to Data Warehouse Sync"
  ]

  const isSmall = size === 'sm'

  return (
    <div className={cn("w-full", className)}>
      {/* Input Section */}
      <div className={cn("mb-4", isSmall && "mb-0")}>
        <div className={cn(
          "relative bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:shadow-lg focus-within:border-orange-300 transition-all duration-200",
          isSmall && "rounded-lg shadow-none focus-within:shadow-sm"
        )}>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
              isSmall ? "min-h-[40px] text-sm p-3" : "min-h-[120px] text-lg p-6"
            )}
            disabled={isLoading || disabled}
          />
          
          <div className={cn(
            "flex items-center justify-between pt-0",
            isSmall ? "p-3" : "p-6"
          )}>
            {!isSmall && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">📎 Attach</span>
                <span className="text-sm text-gray-500">🌐 Public</span>
              </div>
            )}
            
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading || disabled}
              className={cn(
                "bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors",
                isSmall ? "px-4 py-1 text-sm" : "px-6 py-2"
              )}
              size={isSmall ? "sm" : "default"}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  {isSmall ? "..." : "Creating..."}
                </>
              ) : (
                <>
                  {buttonText}
                  {buttonIcon}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Example Tags */}
      {showExamples && !isSmall && (
        <div className="flex flex-wrap justify-center gap-3">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(`Create a workflow for ${example.toLowerCase()}`)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
              disabled={isLoading || disabled}
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 