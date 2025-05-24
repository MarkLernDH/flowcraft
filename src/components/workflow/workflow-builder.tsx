"use client"

import { useCallback, useState } from 'react'
import ReactFlow, {
  Node,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  ReactFlowProvider,
  Background,
  Controls,
  Panel,
  BackgroundVariant,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { WorkflowNode as WorkflowNodeType, WorkflowEdge, Workflow } from '@/types/workflow'
import { Button } from '@/components/ui/button'
import { Settings, Plus, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLayoutedElementsHorizontal, getLayoutedElementsVertical } from '@/lib/layout'

// Custom Node Components
import { TriggerNode } from './nodes/trigger-node'
import { ActionNode } from './nodes/action-node'
import { ConditionNode } from './nodes/condition-node'
import { TransformNode } from './nodes/transform-node'

interface WorkflowBuilderProps {
  workflow: Workflow
  onSave: (workflow: Workflow) => void
  className?: string
}

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  transform: TransformNode,
  loop: ActionNode,
}

// Layout hook following ReactFlow documentation pattern
const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow()

  const onLayout = useCallback((direction: 'horizontal' | 'vertical') => {
    const nodes = getNodes()
    const edges = getEdges()

    const layoutFunction = direction === 'horizontal' 
      ? getLayoutedElementsHorizontal 
      : getLayoutedElementsVertical

    const { nodes: layoutedNodes } = layoutFunction(
      nodes.map(node => ({
        id: node.id,
        type: node.type as WorkflowNodeType['type'],
        position: node.position,
        data: node.data,
      })),
      edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type as WorkflowEdge['type'],
        label: typeof edge.label === 'string' ? edge.label : undefined,
        data: edge.data,
      }))
    )

    setNodes(layoutedNodes.map(node => ({
      ...node,
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    })))
    
    // Fit view after layout
    setTimeout(() => fitView(), 0)
  }, [getNodes, setNodes, getEdges, fitView])

  return { onLayout }
}

export function WorkflowBuilder({ 
  workflow, 
  onSave, 
  className 
}: WorkflowBuilderProps) {
  const [nodes, , onNodesChange] = useNodesState(
    workflow.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    }))
  )
  
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    workflow.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
      label: edge.label,
      data: edge.data,
    }))
  )

  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const { onLayout } = useLayoutedElements()

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const handleSave = () => {
    const updatedWorkflow: Workflow = {
      ...workflow,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type as WorkflowNodeType['type'],
        position: node.position,
        data: node.data,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type as WorkflowEdge['type'],
        label: typeof edge.label === 'string' ? edge.label : undefined,
        data: edge.data,
      })),
      updatedAt: new Date(),
    }
    onSave(updatedWorkflow)
  }

  return (
    <div className={cn("w-full h-full relative bg-gray-50", className)}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1.0, minZoom: 0.3 }}
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: '#e5e7eb' },
            type: 'smoothstep',
            animated: false,
          }}
          attributionPosition="bottom-left"
          className="bg-gradient-to-br from-gray-50 to-gray-100"
          minZoom={0.3}
          maxZoom={1.5}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <Background 
            color="#f3f4f6" 
            gap={24} 
            size={1}
            variant={BackgroundVariant.Dots}
            className="opacity-60"
          />
          <Controls 
            className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg"
            showInteractive={false}
            showZoom={true}
            showFitView={true}
          />
          
          {/* Floating Action Panel */}
          <Panel position="top-right" className="m-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg p-2 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLayout('horizontal')}
                className="text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300"
              >
                <LayoutGrid className="w-4 h-4 mr-1" />
                Layout
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Add node functionality */}}
                className="text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Step
              </Button>
              
              {selectedNode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Configure node */}}
                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Configure
                </Button>
              )}
            </div>
          </Panel>

          {/* Node Configuration Panel */}
          {selectedNode && (
            <Panel position="bottom-right" className="m-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-xl p-4 w-80">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Configure: {selectedNode.data.label}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.label}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Step name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={selectedNode.data.description || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={2}
                      placeholder="What does this step do?"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedNode(null)}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  )
}

export function WorkflowBuilderWrapper(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder {...props} />
    </ReactFlowProvider>
  )
} 