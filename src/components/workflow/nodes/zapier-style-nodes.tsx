// Enhanced Zapier-Style Workflow Nodes with Better UX
import React, { useState } from 'react'
import { Handle, Position } from 'reactflow'
import { 
  Mail, 
  Brain, 
  FileSpreadsheet, 
  Play, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  ChevronDown,
  ExternalLink,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedNodeProps {
  data: {
    label: string
    description?: string
    service?: string
    operation?: string
    config?: Record<string, unknown>
    status?: 'configured' | 'needs_setup' | 'connected' | 'error'
    estimatedTime?: string
    lastRun?: Date
  }
  selected?: boolean
}

const ServiceIcons = {
  email: Mail,
  ai: Brain,
  google_sheets: FileSpreadsheet,
  slack: MessageSquare,
  webhook: Zap,
  manual: Play
}

const StatusIndicators = {
  configured: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  needs_setup: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  connected: { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' }
}

export function EnhancedTriggerNode({ data, selected }: EnhancedNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const Icon = ServiceIcons[data.service as keyof typeof ServiceIcons] || Play
  const status = StatusIndicators[data.status || 'needs_setup']

  return (
    <div className={cn(
      "bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg group",
      "min-w-[320px] relative overflow-hidden",
      selected 
        ? "border-blue-400 shadow-lg ring-2 ring-blue-100 scale-105" 
        : "border-gray-200 hover:border-gray-300"
    )}>
      {/* Status Bar */}
      <div className="h-1 bg-gradient-to-r from-green-400 to-blue-500" />
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-green-600" />
              </div>
              <div className="absolute -top-1 -right-1">
                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", status.bg)}>
                  <status.icon className={cn("w-2.5 h-2.5", status.color)} />
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  TRIGGER
                </span>
                <span className="text-xs text-gray-500">
                  {data.service?.toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {data.label}
              </h3>
            </div>
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isExpanded && "rotate-180"
            )} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          {data.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {data.estimatedTime || '~2 min'}
            </div>
            {data.lastRun && (
              <div className="text-xs text-gray-500">
                Last: {data.lastRun.toLocaleDateString()}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Configuration */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Configuration Status
              </label>
              <div className={cn("flex items-center gap-2 p-2 rounded-lg", status.bg)}>
                <status.icon className={cn("w-4 h-4", status.color)} />
                <span className="text-sm font-medium">
                  {data.status === 'configured' ? 'Ready to use' : 
                   data.status === 'connected' ? 'Connected' : 
                   data.status === 'error' ? 'Needs attention' : 'Setup required'}
                </span>
              </div>
            </div>
            
            {data.config && Object.keys(data.config).length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Current Settings
                </label>
                <div className="text-xs bg-white p-2 rounded border">
                  {Object.entries(data.config).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500">{key}:</span>
                      <span className="font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-green-400 hover:border-green-600 transition-colors"
        style={{ bottom: -6 }}
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 pointer-events-none" />
    </div>
  )
}

export function EnhancedActionNode({ data, selected }: EnhancedNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const Icon = ServiceIcons[data.service as keyof typeof ServiceIcons] || Zap
  const status = StatusIndicators[data.status || 'needs_setup']

  return (
    <div className={cn(
      "bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg group",
      "min-w-[320px] relative overflow-hidden",
      selected 
        ? "border-blue-400 shadow-lg ring-2 ring-blue-100 scale-105" 
        : "border-gray-200 hover:border-gray-300"
    )}>
      {/* Status Bar */}
      <div className="h-1 bg-gradient-to-r from-blue-400 to-purple-500" />
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="absolute -top-1 -right-1">
                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", status.bg)}>
                  <status.icon className={cn("w-2.5 h-2.5", status.color)} />
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  ACTION
                </span>
                <span className="text-xs text-gray-500">
                  {data.service?.toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {data.label}
              </h3>
            </div>
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isExpanded && "rotate-180"
            )} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
          {data.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {data.estimatedTime || '~30 sec'}
            </div>
            {data.lastRun && (
              <div className="text-xs text-gray-500">
                Last: {data.lastRun.toLocaleDateString()}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Configuration */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Configuration Status
              </label>
              <div className={cn("flex items-center gap-2 p-2 rounded-lg", status.bg)}>
                <status.icon className={cn("w-4 h-4", status.color)} />
                <span className="text-sm font-medium">
                  {data.status === 'configured' ? 'Ready to use' : 
                   data.status === 'connected' ? 'Connected' : 
                   data.status === 'error' ? 'Needs attention' : 'Setup required'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-blue-400 transition-colors"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-blue-400 hover:border-blue-600 transition-colors"
        style={{ bottom: -6 }}
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 pointer-events-none" />
    </div>
  )
}

// Export enhanced node types
export const enhancedNodeTypes = {
  trigger: EnhancedTriggerNode,
  action: EnhancedActionNode,
}