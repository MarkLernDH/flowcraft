"use client"

import { Handle, Position } from 'reactflow'
import { Play, Clock, Mail, Webhook, Database, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TriggerNodeProps {
  data: {
    label: string
    description?: string
    config: Record<string, unknown>
    service?: string
    operation?: string
  }
  selected?: boolean
}

const getIcon = (service?: string, operation?: string) => {
  if (service === 'webhook') return Webhook
  if (service === 'cron' || operation === 'schedule') return Clock
  if (service === 'email') return Mail
  if (service === 'database') return Database
  if (service === 'file') return FileText
  return Play
}

const getServiceInfo = (service?: string) => {
  switch (service) {
    case 'webhook':
      return { name: 'Webhook', color: 'bg-blue-500' }
    case 'email':
      return { name: 'Email', color: 'bg-red-500' }
    case 'cron':
      return { name: 'Schedule', color: 'bg-purple-500' }
    case 'file':
      return { name: 'File', color: 'bg-yellow-500' }
    case 'database':
      return { name: 'Database', color: 'bg-green-500' }
    default:
      return { name: 'Trigger', color: 'bg-gray-500' }
  }
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
  const Icon = getIcon(data.service, data.operation)
  const serviceInfo = getServiceInfo(data.service)
  
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-md border-2 border-gray-200 min-w-[280px] transition-all duration-200",
      selected && "border-blue-400 shadow-lg scale-105"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", serviceInfo.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
              TRIGGER
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm truncate">
            {data.label}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">{serviceInfo.name}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        
        {data.description && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {data.description}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-white border-2 border-gray-300 hover:border-blue-400 transition-colors"
      />
    </div>
  )
} 