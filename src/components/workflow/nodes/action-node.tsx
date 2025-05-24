"use client"

import { Handle, Position } from 'reactflow'
import { 
  Zap, 
  Send, 
  Database, 
  FileText, 
  MessageSquare, 
  Upload,
  Download,
  Mail,
  Globe,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionNodeProps {
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
  if (service === 'slack') return MessageSquare
  if (service === 'email') return Mail
  if (service === 'database') return Database
  if (service === 'file') return FileText
  if (service === 'api' || service === 'http') return Globe
  if (operation === 'upload') return Upload
  if (operation === 'download') return Download
  if (operation === 'send') return Send
  return Zap
}

const getServiceInfo = (service?: string) => {
  switch (service) {
    case 'slack':
      return { name: 'Slack', color: 'bg-purple-500' }
    case 'email':
      return { name: 'Email', color: 'bg-red-500' }
    case 'google_drive':
      return { name: 'Google Drive', color: 'bg-blue-500' }
    case 'database':
      return { name: 'Database', color: 'bg-green-500' }
    case 'notion':
      return { name: 'Notion', color: 'bg-gray-800' }
    case 'security':
      return { name: 'Security', color: 'bg-orange-500' }
    case 'api':
    case 'http':
      return { name: 'API', color: 'bg-indigo-500' }
    default:
      return { name: 'Action', color: 'bg-blue-500' }
  }
}

export function ActionNode({ data, selected }: ActionNodeProps) {
  const Icon = getIcon(data.service, data.operation)
  const serviceInfo = getServiceInfo(data.service)
  
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-md border-2 border-gray-200 min-w-[280px] transition-all duration-200 cursor-pointer hover:shadow-lg hover:border-gray-300",
      selected && "border-blue-400 shadow-lg ring-2 ring-blue-100"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", serviceInfo.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              ACTION
            </span>
            {selected && (
              <Settings className="w-3 h-3 text-gray-400" />
            )}
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
          <p className="text-sm text-gray-600 leading-relaxed mb-2">
            {data.description}
          </p>
        )}

        {data.operation && (
          <div className="mt-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {data.operation.replace('_', ' ')}
            </span>
          </div>
        )}

        {/* Configuration Status */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              Object.keys(data.config).length > 0 ? "bg-green-400" : "bg-yellow-400"
            )} />
            <span className="text-xs text-gray-500">
              {Object.keys(data.config).length > 0 ? "Configured" : "Needs setup"}
            </span>
          </div>
          {selected && (
            <span className="text-xs text-blue-600 font-medium">
              Click to configure
            </span>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-white border-2 border-gray-300 hover:border-blue-400 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-white border-2 border-gray-300 hover:border-blue-400 transition-colors"
      />
    </div>
  )
} 