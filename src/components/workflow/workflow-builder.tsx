import { useCallback, useState, useEffect } from 'react'
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
  ConnectionMode
} from 'reactflow'
import 'reactflow/dist/style.css'

import { WorkflowNode as WorkflowNodeType, WorkflowEdge, Workflow } from '@/types/workflow'
import { Button } from '@/components/ui/button'
import { Plus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  getLayoutedElementsHorizontal, 
  getLayoutedElementsVertical,
  getAutoLayout,
  getConditionalLayout
} from '@/lib/layout'

// Import Zapier-style components instead of the old ones
import { 
  ZapierStyleTriggerNode as TriggerNode,
  ZapierStyleActionNode as ActionNode, 
  ZapierStyleConditionNode as ConditionNode,
  ZapierStyleTransformNode as TransformNode
} from './nodes/zapier-style-nodes'

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

// Enhanced layout hook with multiple layout options
const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, setEdges, fitView } = useReactFlow()

  const onLayout = useCallback((layoutType: 'horizontal' | 'vertical' | 'auto' | 'conditional') => {
    const nodes = getNodes()
    const edges = getEdges()

    // Convert ReactFlow nodes/edges to WorkflowNode/WorkflowEdge format
    const workflowNodes: WorkflowNodeType[] = nodes.map(node => ({
      id: node.id,
      type: node.type as WorkflowNodeType['type'],
      position: node.position,
      data: node.data,
    }))

    const workflowEdges: WorkflowEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type as WorkflowEdge['type'],
      label: typeof edge.label === 'string' ? edge.label : undefined,
      data: edge.data,
    }))

    // Apply the selected layout
    let layoutedElements
    switch (layoutType) {
      case 'horizontal':
        layoutedElements = getLayoutedElementsHorizontal(workflowNodes, workflowEdges)
        break
      case 'vertical':
        layoutedElements = getLayoutedElementsVertical(workflowNodes, workflowEdges)
        break
      case 'auto':
        layoutedElements = getAutoLayout(workflowNodes, workflowEdges)
        break
      case 'conditional':
        layoutedElements = getConditionalLayout(workflowNodes, workflowEdges)
        break
      default:
        layoutedElements = getLayoutedElementsVertical(workflowNodes, workflowEdges)
    }

    // Update nodes and edges with new positions
    setNodes(layoutedElements.nodes)
    setEdges(layoutedElements.edges)
    
    // Fit view after layout with a small delay to ensure nodes are rendered
    setTimeout(() => {
      fitView({ 
        padding: 0.2, 
        maxZoom: 1.0, 
        minZoom: 0.3,
        duration: 800 
      })
    }, 100)
  }, [getNodes, setNodes, getEdges, setEdges, fitView])

  const resetLayout = useCallback(() => {
    // Reset to default positions and re-apply auto layout
    onLayout('auto')
  }, [onLayout])

  return { onLayout, resetLayout }
}

function WorkflowBuilderInner({ 
  workflow, 
  onSave, 
  className 
}: WorkflowBuilderProps) {
  // Initialize nodes and edges with proper vertical layout (Zapier style)
  const initialLayout = getLayoutedElementsVertical(workflow.nodes, workflow.edges)
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [layoutType, setLayoutType] = useState<'horizontal' | 'vertical' | 'auto'>('vertical') // Changed default
  
  const { onLayout, resetLayout } = useLayoutedElements()

  // Re-layout when workflow changes - default to vertical
  useEffect(() => {
    const newLayout = getLayoutedElementsVertical(workflow.nodes, workflow.edges)
    setNodes(newLayout.nodes)
    setEdges(newLayout.edges)
  }, [workflow.id, workflow.nodes, workflow.edges, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      // Enhanced connection with better default styling
      const newEdge = {
        ...params,
        type: 'smoothstep',
        style: {
          strokeWidth: 2,
          stroke: '#94a3b8',
        },
        labelStyle: {
          fontSize: 12,
          fontWeight: 500,
        },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleSave = useCallback(() => {
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
  }, [workflow, nodes, edges, onSave])

  const handleLayoutChange = useCallback((newLayoutType: typeof layoutType) => {
    setLayoutType(newLayoutType)
    onLayout(newLayoutType)
  }, [onLayout])

  // Node configuration handler
  const handleNodeConfigUpdate = useCallback((nodeId: string, newData: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    )
  }, [setNodes])

  const addNode = useCallback((type: WorkflowNodeType['type']) => {
    const id = `${type}-${Date.now()}`
    const newNode: Node = {
      id,
      type,
      position: { 
        x: 250, // Consistent X position as suggested in the insight
        y: 50 + (nodes.length * 200) // Start at 50, then 200px increments (improved spacing)
      },
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: `Configure this ${type}`,
        config: {},
        service: 'manual',
        operation: type === 'trigger' ? 'auto_import' : 'export'
      },
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes.length, setNodes])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
  }, [setNodes, setEdges])

  return (
    <div className={cn("w-full h-full bg-gray-50", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gray-50"
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.3}
        maxZoom={2}
        snapToGrid
        snapGrid={[20, 20]}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        
        {/* Enhanced Control Panel */}
        <Panel position="top-left">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-gray-600 mb-1">ADD NODES</div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('trigger')}
                  className="text-xs h-7 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Trigger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('action')}
                  className="text-xs h-7 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Action
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('condition')}
                  className="text-xs h-7 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Condition
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addNode('transform')}
                  className="text-xs h-7 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Transform
                </Button>
              </div>
              
              <div className="border-t border-gray-200 pt-2 mt-1">
                <div className="text-xs font-medium text-gray-600 mb-1">LAYOUT</div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={layoutType === 'vertical' ? 'default' : 'outline'}
                    onClick={() => handleLayoutChange('vertical')}
                    className="text-xs h-7 px-2 flex-1"
                  >
                    Vertical
                  </Button>
                  <Button
                    size="sm"
                    variant={layoutType === 'horizontal' ? 'default' : 'outline'}
                    onClick={() => handleLayoutChange('horizontal')}
                    className="text-xs h-7 px-2 flex-1"
                  >
                    Horizontal
                  </Button>
                  <Button
                    size="sm"
                    variant={layoutType === 'auto' ? 'default' : 'outline'}
                    onClick={() => handleLayoutChange('auto')}
                    className="text-xs h-7 px-2 flex-1"
                  >
                    Auto
                  </Button>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-2 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetLayout}
                  className="text-xs h-7 px-2 w-full"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset Layout
                </Button>
              </div>
            </div>
          </div>
        </Panel>

        {/* Save Panel */}
        <Panel position="top-right">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <Button onClick={handleSave} size="sm" className="text-xs h-7 px-3">
              Save Workflow
            </Button>
          </div>
        </Panel>

        {/* Node Configuration Panel */}
        {selectedNode && (
          <Panel position="bottom-right">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Configure Node</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteNode(selectedNode.id)}
                  className="text-xs h-7 px-2 text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.label || ''}
                    onChange={(e) => handleNodeConfigUpdate(selectedNode.id, { label: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Description
                  </label>
                  <textarea
                    value={selectedNode.data.description || ''}
                    onChange={(e) => handleNodeConfigUpdate(selectedNode.id, { description: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Service
                  </label>
                  <select
                    value={selectedNode.data.service || 'manual'}
                    onChange={(e) => handleNodeConfigUpdate(selectedNode.id, { service: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
                  >
                    <option value="manual">Manual</option>
                    <option value="google_drive">Google Drive</option>
                    <option value="google_sheets">Google Sheets</option>
                    <option value="slack">Slack</option>
                    <option value="email">Email</option>
                    <option value="ai">AI</option>
                    <option value="api">API</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    Operation
                  </label>
                  <select
                    value={selectedNode.data.operation || ''}
                    onChange={(e) => handleNodeConfigUpdate(selectedNode.id, { operation: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400"
                  >
                    <option value="">Select operation</option>
                    <option value="auto_import">Auto Import</option>
                    <option value="export">Export</option>
                    <option value="transform">Transform</option>
                    <option value="invoices_model">Invoices Model</option>
                  </select>
                </div>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}

export function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  )
}

export function WorkflowBuilderWrapper(props: WorkflowBuilderProps) {
  return <WorkflowBuilder {...props} />
}