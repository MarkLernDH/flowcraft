/* eslint-disable @typescript-eslint/no-unused-vars */
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
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ZapierNodeProps {
  data: {
    label: string
    description?: string
    config: Record<string, unknown>
    service?: string
    operation?: string
  }
  selected?: boolean
}

const getServiceIcon = (service?: string) => {
  if (service === 'google_drive') {
    const GoogleDriveIcon = () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path fill="#4285f4" d="M6 2l3 5.2L12 2z"/>
        <path fill="#ea4335" d="M6 2L3 7.2 9 19l3-5.2z"/>
        <path fill="#34a853" d="M15 2l3 5.2L21 2z"/>
        <path fill="#fbbc05" d="M15 2L12 7.2 18 19l3-5.2z"/>
      </svg>
    )
    GoogleDriveIcon.displayName = 'GoogleDriveIcon'
    return GoogleDriveIcon
  }
  
  if (service === 'google_sheets') {
    const GoogleSheetsIcon = () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path fill="#0f9d58" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H8v-2h4v2zm0-4H8v-2h4v2zm0-4H8V7h4v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
      </svg>
    )
    GoogleSheetsIcon.displayName = 'GoogleSheetsIcon'
    return GoogleSheetsIcon
  }

  if (service === 'ai' || service === 'data_extraction') {
    const AIIcon = () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <path fill="#4f46e5" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    )
    AIIcon.displayName = 'AIIcon'
    return AIIcon
  }

  if (service === 'slack') return MessageSquare
  if (service === 'email') return Mail
  if (service === 'database') return Database
  if (service === 'file') return FileText
  if (service === 'api' || service === 'http') return Globe
  return Zap
}

const getServiceInfo = (service?: string) => {
  switch (service) {
    case 'google_drive':
      return { name: 'Google Drive', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' }
    case 'google_sheets':
      return { name: 'Google Sheets', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' }
    case 'ai':
    case 'data_extraction':
      return { name: 'AI Data Extraction', color: 'bg-indigo-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' }
    case 'slack':
      return { name: 'Slack', color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' }
    case 'email':
      return { name: 'Email', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' }
    case 'notion':
      return { name: 'Notion', color: 'bg-gray-800', bgColor: 'bg-gray-50', textColor: 'text-gray-700' }
    case 'security':
      return { name: 'Security', color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-700' }
    case 'api':
    case 'http':
      return { name: 'API', color: 'bg-indigo-500', bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' }
    default:
      return { name: service || 'Service', color: 'bg-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' }
  }
}

const getOperationLabel = (operation?: string) => {
  switch (operation) {
    case 'auto_import':
      return 'AUTO-IMPORT'
    case 'invoices_model':
      return 'INVOICES MODEL'
    case 'export':
      return 'EXPORT'
    default:
      return operation?.toUpperCase().replace('_', '-') || ''
  }
}

export function ZapierStyleTriggerNode({ data, selected }: ZapierNodeProps) {
  const Icon = getServiceIcon(data.service)
  const serviceInfo = getServiceInfo(data.service)
  const operationLabel = getOperationLabel(data.operation)
  
  return (
    <div className={cn(
      "bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
      "min-w-[400px] h-[80px] relative",
      selected 
        ? "border-orange-400 shadow-lg ring-2 ring-orange-100" 
        : "border-gray-200 hover:border-gray-300"
    )}>
      {/* Main content container */}
      <div className="flex items-center h-full px-4">
        {/* Service icon */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
          serviceInfo.bgColor
        )}>
          <Icon className={cn("w-6 h-6", serviceInfo.textColor)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 ml-4 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base truncate">
              {data.label}
            </h3>
            {operationLabel && (
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded",
                serviceInfo.bgColor,
                serviceInfo.textColor
              )}>
                {operationLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">
            {data.description || serviceInfo.name}
          </p>
        </div>

        {/* Options menu */}
        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-orange-400 transition-colors"
        style={{ bottom: -6 }}
      />
    </div>
  )
}

ZapierStyleTriggerNode.displayName = 'ZapierStyleTriggerNode'

export function ZapierStyleActionNode({ data, selected }: ZapierNodeProps) {
  const Icon = getServiceIcon(data.service)
  const serviceInfo = getServiceInfo(data.service)
  const operationLabel = getOperationLabel(data.operation)
  
  return (
    <div className={cn(
      "bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
      "min-w-[400px] h-[80px] relative",
      selected 
        ? "border-orange-400 shadow-lg ring-2 ring-orange-100" 
        : "border-gray-200 hover:border-gray-300"
    )}>
      {/* Main content container */}
      <div className="flex items-center h-full px-4">
        {/* Service icon */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
          serviceInfo.bgColor
        )}>
          <Icon className={cn("w-6 h-6", serviceInfo.textColor)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 ml-4 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base truncate">
              {data.label}
            </h3>
            {operationLabel && (
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded",
                serviceInfo.bgColor,
                serviceInfo.textColor
              )}>
                {operationLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">
            {data.description || serviceInfo.name}
          </p>
        </div>

        {/* Options menu */}
        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-orange-400 transition-colors"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-orange-400 transition-colors"
        style={{ bottom: -6 }}
      />
    </div>
  )
}

ZapierStyleActionNode.displayName = 'ZapierStyleActionNode'

export function ZapierStyleConditionNode({ data, selected }: ZapierNodeProps) {
  const Icon = getServiceIcon(data.service)
  const serviceInfo = getServiceInfo(data.service)
  const operationLabel = getOperationLabel(data.operation)
  
  return (
    <div className={cn(
      "bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
      "min-w-[400px] h-[100px] relative",
      selected 
        ? "border-orange-400 shadow-lg ring-2 ring-orange-100" 
        : "border-gray-200 hover:border-gray-300"
    )}>
      {/* Main content container */}
      <div className="flex items-center h-full px-4">
        {/* Service icon */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
          serviceInfo.bgColor
        )}>
          <Icon className={cn("w-6 h-6", serviceInfo.textColor)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 ml-4 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base truncate">
              {data.label}
            </h3>
            {operationLabel && (
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded",
                serviceInfo.bgColor,
                serviceInfo.textColor
              )}>
                {operationLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">
            {data.description || serviceInfo.name}
          </p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">YES</span>
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">NO</span>
          </div>
        </div>

        {/* Options menu */}
        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-orange-400 transition-colors"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="w-3 h-3 bg-white border-2 border-green-400 hover:border-green-600 transition-colors"
        style={{ bottom: -6, left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="w-3 h-3 bg-white border-2 border-red-400 hover:border-red-600 transition-colors"
        style={{ bottom: -6, right: '30%' }}
      />
    </div>
  )
}

ZapierStyleConditionNode.displayName = 'ZapierStyleConditionNode'

export function ZapierStyleTransformNode({ data, selected }: ZapierNodeProps) {
  const Icon = getServiceIcon(data.service)
  const serviceInfo = getServiceInfo(data.service)
  const operationLabel = getOperationLabel(data.operation)
  
  return (
    <div className={cn(
      "bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md",
      "min-w-[400px] h-[80px] relative",
      selected 
        ? "border-orange-400 shadow-lg ring-2 ring-orange-100" 
        : "border-gray-200 hover:border-gray-300"
    )}>
      {/* Main content container */}
      <div className="flex items-center h-full px-4">
        {/* Service icon */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
          serviceInfo.bgColor
        )}>
          <Icon className={cn("w-6 h-6", serviceInfo.textColor)} />
        </div>
        
        {/* Content */}
        <div className="flex-1 ml-4 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base truncate">
              {data.label}
            </h3>
            {operationLabel && (
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded",
                serviceInfo.bgColor,
                serviceInfo.textColor
              )}>
                {operationLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">
            {data.description || serviceInfo.name}
          </p>
        </div>

        {/* Options menu */}
        <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-orange-400 transition-colors"
        style={{ top: -6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-gray-300 hover:border-orange-400 transition-colors"
        style={{ bottom: -6 }}
      />
    </div>
  )
}

ZapierStyleTransformNode.displayName = 'ZapierStyleTransformNode'