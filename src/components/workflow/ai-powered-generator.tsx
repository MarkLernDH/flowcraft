"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Search, 
  Code, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Sparkles,
  Cog
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

import { 
  AIDiscoveryResult, 
  WorkflowProject 
} from '@/types/workflow'
import { config } from '@/lib/config'

interface AIGeneratorProps {
  prompt: string
  onComplete: (project: WorkflowProject) => void
  onError: (error: string) => void
}

type GenerationPhase = 'discovery' | 'research' | 'integration' | 'generation' | 'complete'

export function AIPoweredGenerator({ prompt, onComplete, onError }: AIGeneratorProps) {
  const [currentPhase, setCurrentPhase] = useState<GenerationPhase>('discovery')
  const [progress, setProgress] = useState(0)
  const [discovery] = useState<AIDiscoveryResult | null>(null)
  const [project, setProject] = useState<WorkflowProject | null>(null)
  const [currentStep, setCurrentStep] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const phases = [
    { 
      id: 'discovery', 
      label: 'Discovery & Planning', 
      icon: Brain, 
      description: 'Understanding your requirements' 
    },
    { 
      id: 'research', 
      label: 'Service Research', 
      icon: Search, 
      description: 'Researching unknown integrations' 
    },
    { 
      id: 'integration', 
      label: 'Integration Generation', 
      icon: Code, 
      description: 'Creating custom connectors' 
    },
    { 
      id: 'generation', 
      label: 'System Generation', 
      icon: Cog, 
      description: 'Building complete workflow system' 
    },
    { 
      id: 'complete', 
      label: 'Complete', 
      icon: CheckCircle, 
      description: 'Your workflow system is ready!' 
    }
  ]

  const startGeneration = async () => {
    setIsGenerating(true)
    setProgress(0)
    setCurrentPhase('discovery')

    try {
      // Use the new fast generation method
      setCurrentStep('AI is analyzing your requirements...')
      setProgress(20)
      
      setCurrentPhase('generation')
      setCurrentStep('Building your complete workflow system...')
      setProgress(50)

      // Use the new agent system
      const { createAgent } = await import('@/lib/ai-agent')
      const agent = createAgent()
      
      const result = await agent.generateWorkflowWithPlanner(
        prompt, 
        (update) => {
          setCurrentStep(update.message)
          setProgress(update.progress)
        }
      )
      
      if (!result.success) {
        throw new Error(result.error || 'Workflow generation failed')
      }
      
      if (!result.result.project) {
        throw new Error('No project generated')
      }
      
      setProject(result.result.project)
      setProgress(100)

      // Phase 5: Complete
      setCurrentPhase('complete')
      setCurrentStep('System generation complete!')
      
      setTimeout(() => {
        onComplete(result.result.project!)
      }, 1500)

    } catch (error) {
      console.error('Generation failed:', error)
      onError(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const getCurrentPhaseIndex = () => {
    return phases.findIndex(phase => phase.id === currentPhase)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full mb-4"
          >
            <Sparkles className="w-5 h-5 text-orange-600" />
            <span className="text-orange-600 font-medium">FlowCraft AI Generator</span>
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Creating Your Intelligent Workflow
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our AI is analyzing your requirements and building a complete automation system with custom integrations, monitoring, and testing.
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Generation Progress
              </CardTitle>
              <Badge variant={isGenerating ? "default" : "secondary"}>
                {isGenerating ? 'Generating...' : 'Ready'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-4" />
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <span>0%</span>
              <span className="text-center">{currentStep}</span>
              <span>100%</span>
            </div>
            
            {/* Phase indicators */}
            <div className="flex items-center justify-between">
              {phases.map((phase, index) => {
                const Icon = phase.icon
                const isActive = index === getCurrentPhaseIndex()
                const isComplete = index < getCurrentPhaseIndex()
                
                return (
                  <div key={phase.id} className="flex flex-col items-center flex-1">
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        isComplete 
                          ? 'bg-green-100 text-green-600' 
                          : isActive 
                          ? 'bg-orange-100 text-orange-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    <span className={`text-xs text-center ${
                      isActive ? 'text-orange-600 font-medium' : 'text-gray-500'
                    }`}>
                      {phase.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Generation Results */}
        <AnimatePresence mode="wait">
          {discovery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Discovery Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-gray-600">{discovery.summary}</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Identified Triggers</h4>
                      <div className="space-y-2">
                        {discovery.identifiedTriggers.map((trigger, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                            <Zap className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{trigger.type} - {trigger.service}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Identified Actions</h4>
                      <div className="space-y-2">
                        {discovery.identifiedActions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                            <Cog className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{action.type} - {action.service}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Badge variant="outline">
                      Complexity: {discovery.complexity}
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {discovery.estimatedEffort}
                    </Badge>
                  </div>
                </CardContent>
              </Card>



              {/* Project Overview */}
              {project && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Generated Project
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-gray-600">{project.description}</p>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">
                            {project.components.length}
                          </div>
                          <div className="text-sm text-blue-600">Components</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">
                            {project.integrations.length}
                          </div>
                          <div className="text-sm text-green-600">Integrations</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded">
                          <div className="text-2xl font-bold text-purple-600">
                            {project.testSuite.length}
                          </div>
                          <div className="text-sm text-purple-600">Tests</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Generation Button */}
        {!isGenerating && !discovery && (
          <div className="text-center">
            <Button 
              onClick={startGeneration} 
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 px-8"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start AI Generation
            </Button>
            
            {config.development.useMockData && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Development Mode</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Using fallback AI responses. Add your OpenAI API key to enable full AI capabilities.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 