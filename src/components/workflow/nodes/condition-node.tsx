"use client"

import { Handle, Position } from 'reactflow'
import { GitBranch, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConditionNodeProps {
  data: {
    label: string
    description?: string
    config: Record<string, unknown>
    service?: string
    operation?: string
    condition?: string
  }
  selected?: boolean
}

export function ConditionNode({ data, selected }: ConditionNodeProps) {
  return (
    <div className={cn(
      "px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[180px]",
      "border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50",
      selected && "border-yellow-400 shadow-lg"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-full bg-yellow-100 text-yellow-600">
          <GitBranch className="w-4 h-4" />
        </div>
        <div className="font-medium text-yellow-800 text-sm">CONDITION</div>
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
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
      />
      
      {/* True branch */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '60%' }}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
      
      {/* False branch */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '80%' }}
        className="w-3 h-3 bg-red-500 border-2 border-white"
      />
      
      {/* Branch labels */}
      <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 space-y-1">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-xs text-green-600">Yes</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="w-3 h-3 text-red-500" />
          <span className="text-xs text-red-600">No</span>
        </div>
      </div>
    </div>
  )
} 