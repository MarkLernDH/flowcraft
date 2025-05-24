"use client"

import { Handle, Position } from 'reactflow'
import { RefreshCw, Filter, MapPin, Code, Calculator, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransformNodeProps {
  data: {
    label: string
    description?: string
    config: Record<string, unknown>
    service?: string
    operation?: string
  }
  selected?: boolean
}

const getIcon = (operation?: string) => {
  if (operation === 'filter') return Filter
  if (operation === 'map') return MapPin
  if (operation === 'transform') return RefreshCw
  if (operation === 'calculate') return Calculator
  if (operation === 'format') return Shuffle
  return Code
}

export function TransformNode({ data, selected }: TransformNodeProps) {
  const Icon = getIcon(data.operation)
  
  return (
    <div className={cn(
      "px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[180px]",
      "border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50",
      selected && "border-purple-400 shadow-lg"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-full bg-purple-100 text-purple-600">
          <Icon className="w-4 h-4" />
        </div>
        <div className="font-medium text-purple-800 text-sm">TRANSFORM</div>
      </div>
      
      <div className="space-y-1">
        <div className="font-semibold text-gray-900 text-sm leading-tight">
          {data.label}
        </div>
        {data.description && (
          <div className="text-xs text-gray-600 leading-tight">
            {data.description}
          </div>
        )}
        {data.operation && (
          <div className="text-xs text-purple-600 font-medium">
            {data.operation}
          </div>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </div>
  )
} 