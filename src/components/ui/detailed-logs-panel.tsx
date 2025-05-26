"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Info, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogEntry {
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  details?: Record<string, unknown>
}

interface DetailedLogsPanelProps {
  logs: LogEntry[]
  className?: string
}

const levelIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle
}

const levelColors = {
  info: 'text-blue-500 bg-blue-50',
  success: 'text-green-500 bg-green-50',
  warning: 'text-yellow-500 bg-yellow-50',
  error: 'text-red-500 bg-red-50'
}

const levelBorderColors = {
  info: 'border-blue-200',
  success: 'border-green-200',
  warning: 'border-yellow-200',
  error: 'border-red-200'
}

export function DetailedLogsPanel({ logs, className }: DetailedLogsPanelProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())

  const toggleLogExpansion = (index: number) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedLogs(newExpanded)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const formatDetails = (details?: Record<string, unknown>) => {
    if (!details) return null
    
    try {
      return JSON.stringify(details, null, 2)
    } catch {
      return String(details)
    }
  }

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm", className)}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Detailed Process Logs</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {logs.length} entries
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Real-time logging of the GPT-4o workflow generation process
        </p>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No logs yet. Start generating a workflow to see detailed process information.
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {logs.map((log, index) => {
              const Icon = levelIcons[log.level]
              const isExpanded = expandedLogs.has(index)
              const hasDetails = log.details && Object.keys(log.details).length > 0
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "border rounded-lg p-3 transition-all duration-200",
                    levelBorderColors[log.level],
                    hasDetails ? "cursor-pointer hover:shadow-sm" : ""
                  )}
                  onClick={hasDetails ? () => toggleLogExpansion(index) : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                      levelColors[log.level]
                    )}>
                      <Icon className="w-3 h-3" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {log.message}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500 font-mono">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          {hasDetails && (
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && hasDetails && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto font-mono">
                                {formatDetails(log.details)}
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
      
      {logs.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
          <div className="flex justify-between items-center">
            <span>
              Latest: {logs.length > 0 ? formatTimestamp(logs[logs.length - 1].timestamp) : 'None'}
            </span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {logs.filter(l => l.level === 'success').length} success
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {logs.filter(l => l.level === 'info').length} info
              </span>
              {logs.filter(l => l.level === 'error').length > 0 && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {logs.filter(l => l.level === 'error').length} errors
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 