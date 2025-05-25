"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FlowCraftAI } from '@/lib/ai-service'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Clock, Zap, Brain } from 'lucide-react'

interface AIDebugPanelProps {
  className?: string
}

interface AILog {
  callId: string
  input: string
  model: string
  error?: { message: string }
  response?: { 
    outputText?: string
    usage?: { totalTokens: number }
  }
  performance: { duration: number }
}

export function AIDebugPanel({ className }: AIDebugPanelProps) {
  const [logs, setLogs] = useState<AILog[]>([])
  const [stats, setStats] = useState({ totalCalls: 0, successRate: 0, avgDuration: 0, totalTokens: 0 })
  const [isExpanded, setIsExpanded] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const refreshLogs = () => {
    try {
      const aiLogs = FlowCraftAI.getAILogs()
      const aiStats = FlowCraftAI.getAIStats()
      setLogs(aiLogs as AILog[])
      setStats(aiStats)
    } catch (error) {
      console.error('Failed to fetch AI logs:', error)
    }
  }

  const clearLogs = () => {
    FlowCraftAI.clearAILogs()
    refreshLogs()
  }

  useEffect(() => {
    refreshLogs()
    
    if (autoRefresh) {
      const interval = setInterval(refreshLogs, 2000) // Refresh every 2 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <Card className={`${className} border-blue-200 bg-blue-50/50`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" />
            AI Debug Panel
            <Badge variant="outline" className="text-xs">
              {stats.totalCalls} calls
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-xs"
            >
              {autoRefresh ? '⏸️' : '▶️'}
            </Button>
            <Button variant="ghost" size="sm" onClick={refreshLogs} className="text-xs">
              🔄
            </Button>
            <Button variant="ghost" size="sm" onClick={clearLogs} className="text-xs">
              🗑️
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">Success</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.avgDuration}ms</div>
            <div className="text-xs text-gray-500">Avg Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{stats.totalTokens}</div>
            <div className="text-xs text-gray-500">Tokens</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{stats.totalCalls}</div>
            <div className="text-xs text-gray-500">Calls</div>
          </div>
        </div>

        {/* Recent Calls */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-blue-600">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Recent Calls ({logs.length})
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-2 space-y-2 max-h-96 overflow-y-auto">
            {logs.slice(-10).reverse().map((log) => (
              <div
                key={log.callId}
                className="border rounded-lg p-3 bg-white text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={log.error ? '❌' : '✅'} />
                    <code className="bg-gray-100 px-1 rounded">{log.callId}</code>
                    <Badge variant="secondary" className="text-xs">
                      {log.model}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-3 h-3" />
                    {log.performance.duration}ms
                    {log.response?.usage?.totalTokens && (
                      <>
                        <Zap className="w-3 h-3 ml-1" />
                        {log.response.usage.totalTokens}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div>
                    <span className="font-medium text-gray-600">Input:</span>
                    <div className="bg-gray-50 p-1 rounded text-gray-700 mt-1">
                      {log.input.slice(0, 100)}{log.input.length > 100 ? '...' : ''}
                    </div>
                  </div>
                  
                  {log.error ? (
                    <div>
                      <span className="font-medium text-red-600">Error:</span>
                      <div className="bg-red-50 p-1 rounded text-red-700 mt-1">
                        {log.error.message}
                      </div>
                    </div>
                  ) : log.response?.outputText ? (
                    <div>
                      <span className="font-medium text-green-600">Output:</span>
                      <div className="bg-green-50 p-1 rounded text-green-700 mt-1">
                        {log.response.outputText.slice(0, 100)}
                        {log.response.outputText.length > 100 ? '...' : ''}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No AI calls logged yet. Try using the AI features to see logs here.
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
} 