"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Circle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkflowGeneratorProps {
  prompt: string
  onComplete: () => void
}

interface Step {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete'
}

export function WorkflowGenerator({ prompt, onComplete }: WorkflowGeneratorProps) {
  const [steps, setSteps] = useState<Step[]>([
    { id: 'analyze', label: 'Analyzing requirements', status: 'active' },
    { id: 'design', label: 'Designing workflow structure', status: 'pending' },
    { id: 'generate', label: 'Generating components', status: 'pending' },
    { id: 'optimize', label: 'Optimizing performance', status: 'pending' },
    { id: 'finalize', label: 'Finalizing workflow', status: 'pending' },
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      setSteps(prevSteps => {
        const currentActiveIndex = prevSteps.findIndex(step => step.status === 'active')
        
        if (currentActiveIndex === -1) return prevSteps
        
        const newSteps = [...prevSteps]
        newSteps[currentActiveIndex].status = 'complete'
        
        if (currentActiveIndex + 1 < newSteps.length) {
          newSteps[currentActiveIndex + 1].status = 'active'
        } else {
          // All steps complete
          clearInterval(timer)
          setTimeout(onComplete, 1000)
        }
        
        return newSteps
      })
    }, 2000)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="relative inline-block">
          <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-6 mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-12 h-12 text-white animate-spin" />
            </div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-8 w-2 h-2 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-6 left-6 w-1 h-1 bg-orange-200 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-4 right-8 w-2.5 h-2.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Brewing the magical Potion...
        </h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Analyzing your workflow and crafting the perfect automation
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-4">
              <div className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500",
                step.status === 'complete' && "bg-green-500",
                step.status === 'active' && "bg-orange-500 animate-pulse",
                step.status === 'pending' && "bg-gray-200"
              )}>
                {step.status === 'complete' ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : step.status === 'active' ? (
                  <Circle className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              
              <span className={cn(
                "text-lg transition-colors duration-300",
                step.status === 'complete' && "text-green-600 font-medium",
                step.status === 'active' && "text-orange-600 font-medium",
                step.status === 'pending' && "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Current prompt display */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border-l-4 border-orange-400">
          <p className="text-sm text-gray-600 font-medium mb-1">Your Request:</p>
          <p className="text-gray-800">{prompt}</p>
        </div>
      </div>
    </div>
  )
} 