// Enhanced Progress Component with Lovable-style Immediate Feedback
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Zap, 
  Brain, 
  CheckCircle, 
  Mail, 
  FileSpreadsheet,
  ArrowRight,
  Clock,
  TrendingUp
} from 'lucide-react'

interface ProgressStep {
  id: string
  label: string
  description: string
  icon: React.ElementType
  status: 'pending' | 'active' | 'completed'
  estimatedTime: string
}

interface EnhancedProgressProps {
  prompt: string
  onComplete?: () => void
  isGenerating: boolean
}

export function EnhancedProgress({ prompt, onComplete, isGenerating }: EnhancedProgressProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<ProgressStep[]>([])
  const [progress, setProgress] = useState(0)
  const [previewData, setPreviewData] = useState<any>(null)

  // Initialize steps based on prompt analysis
  useEffect(() => {
    const detectedSteps = analyzePromptForSteps(prompt)
    setSteps(detectedSteps)
  }, [prompt])

  // Simulate faster progress with immediate feedback
  useEffect(() => {
    if (!isGenerating) return

    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          // Mark current step as completed
          setSteps(prevSteps => 
            prevSteps.map((step, index) => 
              index === prev 
                ? { ...step, status: 'completed' }
                : index === prev + 1
                ? { ...step, status: 'active' }
                : step
            )
          )
          
          // Update progress
          setProgress(((prev + 1) / steps.length) * 100)
          
          // Add preview data at certain steps
          if (prev === 0) {
            setPreviewData({
              type: 'trigger',
              data: { service: 'Gmail', operation: 'Monitor for invoices' }
            })
          } else if (prev === 1) {
            setPreviewData({
              type: 'action',
              data: { service: 'AI', operation: 'Extract invoice data' }
            })
          }
          
          return prev + 1
        } else {
          // Complete final step
          setSteps(prevSteps => 
            prevSteps.map(step => ({ ...step, status: 'completed' }))
          )
          setProgress(100)
          clearInterval(timer)
          setTimeout(() => onComplete?.(), 1000)
          return prev
        }
      })
    }, 1500) // Much faster than before

    return () => clearInterval(timer)
  }, [isGenerating, steps.length, onComplete])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with immediate excitement */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-orange-600 animate-pulse" />
            <span className="text-orange-600 font-medium">Building Your Automation</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Creating Your Intelligent Workflow
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI is building a complete automation system with integrations, monitoring, and testing
          </p>
        </motion.div>

        {/* Main Progress Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6"
        >
          {/* Progress Bar */}
          <div className="h-2 bg-gray-200 relative overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          
          <div className="p-6">
            {/* Current Step Display */}
            <div className="flex items-center gap-4 mb-6">
              {steps[currentStep] && (
                <>
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    {React.createElement(steps[currentStep].icon, { className: "w-6 h-6 text-orange-600 animate-pulse" })}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {steps[currentStep]?.label}
                    </h3>
                    <p className="text-gray-600">
                      {steps[currentStep]?.description}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Step List */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                    step.status === 'completed' 
                      ? 'bg-green-50 border border-green-200' 
                      : step.status === 'active'
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'completed' 
                      ? 'bg-green-500' 
                      : step.status === 'active'
                      ? 'bg-orange-500 animate-pulse'
                      : 'bg-gray-300'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      React.createElement(step.icon, {
                        className: `w-4 h-4 ${step.status === 'active' ? 'text-white' : 'text-gray-500'}`
                      })
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        step.status === 'completed' 
                          ? 'text-green-700' 
                          : step.status === 'active'
                          ? 'text-orange-700'
                          : 'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {step.estimatedTime}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Live Preview Panel */}
        <AnimatePresence>
          {previewData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Live Preview</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {previewData.type === 'trigger' && <Mail className="w-6 h-6 text-green-600" />}
                  {previewData.type === 'action' && <Brain className="w-6 h-6 text-blue-600" />}
                  
                  <div>
                    <div className="font-medium text-gray-900">
                      {previewData.data.service}
                    </div>
                    <div className="text-sm text-gray-600">
                      {previewData.data.operation}
                    </div>
                  </div>
                  
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Request Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">You</span>
            </div>
            <span className="font-medium text-gray-900">Your Request</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-400">
            <p className="text-gray-800">{prompt}</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Helper function to analyze prompt and create appropriate steps
function analyzePromptForSteps(prompt: string): ProgressStep[] {
  const baseSteps: ProgressStep[] = [
    {
      id: 'analyze',
      label: 'Understanding Requirements',
      description: 'AI is analyzing your automation needs',
      icon: Brain,
      status: 'pending',
      estimatedTime: '30s'
    }
  ]

  // Add steps based on prompt content
  if (prompt.toLowerCase().includes('email')) {
    baseSteps.push({
      id: 'email',
      label: 'Setting up Email Integration',
      description: 'Configuring Gmail monitoring and triggers',
      icon: Mail,
      status: 'pending',
      estimatedTime: '45s'
    })
  }

  if (prompt.toLowerCase().includes('ai') || prompt.toLowerCase().includes('extract')) {
    baseSteps.push({
      id: 'ai',
      label: 'Building AI Processing',
      description: 'Creating intelligent data extraction pipeline',
      icon: Brain,
      status: 'pending',
      estimatedTime: '60s'
    })
  }

  if (prompt.toLowerCase().includes('sheets') || prompt.toLowerCase().includes('spreadsheet')) {
    baseSteps.push({
      id: 'sheets',
      label: 'Google Sheets Integration',
      description: 'Setting up data storage and formatting',
      icon: FileSpreadsheet,
      status: 'pending',
      estimatedTime: '40s'
    })
  }

  // Always add final steps
  baseSteps.push(
    {
      id: 'connect',
      label: 'Connecting Everything',
      description: 'Linking all components together',
      icon: Zap,
      status: 'pending',
      estimatedTime: '30s'
    },
    {
      id: 'finalize',
      label: 'Finalizing Workflow',
      description: 'Adding monitoring and error handling',
      icon: CheckCircle,
      status: 'pending',
      estimatedTime: '20s'
    }
  )

  return baseSteps
}