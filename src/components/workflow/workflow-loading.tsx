"use client"

import { useState, useEffect } from 'react'
import { Sparkles, Zap, Brain, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowLoadingProps {
  prompt: string
  onComplete?: () => void
}

const generationSteps = [
  { id: 'analyzing', label: 'Analyzing your requirements', icon: Brain },
  { id: 'planning', label: 'Planning workflow structure', icon: Zap },
  { id: 'generating', label: 'Generating workflow nodes', icon: Sparkles },
  { id: 'connecting', label: 'Connecting workflow steps', icon: CheckCircle },
]

export function WorkflowLoading({ prompt, onComplete }: WorkflowLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = prev + 1
        if (nextStep < generationSteps.length) {
          setCompletedSteps(prevCompleted => [...prevCompleted, generationSteps[prev].id])
          return nextStep
        } else {
          setCompletedSteps(prevCompleted => [...prevCompleted, generationSteps[prev].id])
          clearInterval(timer)
          if (onComplete) {
            setTimeout(onComplete, 500)
          }
          return prev
        }
      })
    }, 1500)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-200 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Main loading icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Sparkles className="w-16 h-16 text-white animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          
          {/* Floating elements around the main icon */}
          <div className="absolute inset-0">
            <div className="absolute top-4 left-8 w-3 h-3 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="absolute top-8 right-6 w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-6 left-6 w-2.5 h-2.5 bg-orange-200 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-4 right-8 w-3.5 h-3.5 bg-orange-300 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>

        {/* Title and description */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Crafting Your Workflow
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
          AI is analyzing your request and building the perfect automation flow
        </p>

        {/* Progress steps */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="space-y-4">
            {generationSteps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = index === currentStep
              const isPending = index > currentStep

              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                    isCompleted && "bg-green-500 scale-110",
                    isCurrent && "bg-orange-500 animate-pulse",
                    isPending && "bg-gray-200"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-colors duration-300",
                      isCompleted && "text-white",
                      isCurrent && "text-white animate-spin",
                      isPending && "text-gray-400"
                    )} />
                  </div>
                  
                  <span className={cn(
                    "text-left transition-colors duration-300",
                    isCompleted && "text-green-600 font-medium",
                    isCurrent && "text-orange-600 font-medium",
                    isPending && "text-gray-400"
                  )}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* User prompt display */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 border-l-4 border-l-orange-400">
          <p className="text-sm text-gray-600 font-medium mb-2">Your Request:</p>
          <p className="text-gray-800 text-left">{prompt}</p>
        </div>
      </div>
    </div>
  )
} 