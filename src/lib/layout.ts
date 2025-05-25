import dagre from 'dagre'
import { WorkflowNode, WorkflowEdge } from '@/types/workflow'
import { Node, Edge, Position } from 'reactflow'

// Define node dimensions based on Zapier-style layout
const NODE_DIMENSIONS = {
  trigger: { width: 400, height: 80 },
  action: { width: 400, height: 80 },
  condition: { width: 350, height: 80 },
  transform: { width: 350, height: 80 },
  loop: { width: 400, height: 80 }
} as const

// Layout configuration optimized for vertical flow like Zapier
const LAYOUT_CONFIG = {
  horizontal: {
    rankdir: 'LR',
    nodesep: 80,  // Horizontal spacing between nodes in same rank
    ranksep: 150, // Vertical spacing between ranks
    marginx: 60,
    marginy: 60
  },
  vertical: {
    rankdir: 'TB', 
    nodesep: 60,  // Horizontal spacing between nodes in same rank  
    ranksep: 300, // Increased vertical spacing between ranks (was 200, now 300)
    marginx: 60,
    marginy: 80,   // Increased margin for better spacing
    edgesep: 20,   // Add edge separation
    align: 'UL'    // Align nodes to upper-left for consistent positioning
  }
} as const

export interface LayoutedElements {
  nodes: Node[]
  edges: Edge[]
}

/**
 * Main layout function with proper error handling and validation
 * Defaults to vertical (TB) layout to match Zapier style
 */
export const getLayoutedElements = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  direction: 'LR' | 'TB' = 'TB' // Changed default to vertical
): LayoutedElements => {
  // Validation
  if (!nodes.length) {
    return { nodes: [], edges: [] }
  }

  try {
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    
    // Get layout configuration
    const config = direction === 'LR' ? LAYOUT_CONFIG.horizontal : LAYOUT_CONFIG.vertical
    dagreGraph.setGraph(config)

    // Add nodes with correct dimensions
    nodes.forEach((node) => {
      const dimensions = NODE_DIMENSIONS[node.type] || NODE_DIMENSIONS.action
      dagreGraph.setNode(node.id, dimensions)
      console.log(`📦 Added node ${node.id} (${node.type}) with dimensions:`, dimensions)
    })

    // Add edges with proper validation
    console.log(`🔗 Processing ${edges.length} edges...`)
    edges.forEach((edge) => {
      // Only add edge if both source and target nodes exist
      if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
        dagreGraph.setEdge(edge.source, edge.target)
        console.log(`✅ Added edge: ${edge.source} -> ${edge.target}`)
      } else {
        console.warn(`❌ Invalid edge: ${edge.source} -> ${edge.target} (missing nodes)`)
      }
    })

    console.log(`🎯 Graph structure before layout:`)
    console.log(`  - Nodes: ${dagreGraph.nodes()}`)
    console.log(`  - Edges: ${dagreGraph.edges().map(e => `${e.v} -> ${e.w}`)}`)

    // Calculate layout
    dagre.layout(dagreGraph)

    // Convert to ReactFlow format with proper positioning
    const layoutedNodes: Node[] = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)
      const dimensions = NODE_DIMENSIONS[node.type] || NODE_DIMENSIONS.action
      
      const finalPosition = {
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      }
      
      // Debug logging to see what's happening
      if (process.env.NODE_ENV === 'development') {
        console.log(`Node ${node.id}: dagre position (${nodeWithPosition.x}, ${nodeWithPosition.y}) -> final position (${finalPosition.x}, ${finalPosition.y})`)
      }
      
      return {
        id: node.id,
        type: node.type,
        position: finalPosition,
        data: {
          ...node.data,
          // Ensure all required data is present
          label: node.data.label || 'Untitled',
          config: node.data.config || {}
        },
        // Add proper handle positions for better connections (vertical layout optimized)
        sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
        targetPosition: direction === 'TB' ? Position.Top : Position.Left,
      }
    })

    // FALLBACK: If nodes are stacking (same Y position), manually space them out
    if (direction === 'TB') {
      const yPositions = layoutedNodes.map(n => n.position.y)
      const uniqueYPositions = [...new Set(yPositions)]
      
      if (uniqueYPositions.length < layoutedNodes.length) {
        console.warn(`⚠️  Detected node stacking! Applying manual spacing...`)
        
        // Sort nodes by their intended order (trigger first, then actions)
        const sortedNodes = [...layoutedNodes].sort((a, b) => {
          if (a.id.startsWith('trigger')) return -1
          if (b.id.startsWith('trigger')) return 1
          
          const aNum = parseInt(a.id.split('-')[1]) || 0
          const bNum = parseInt(b.id.split('-')[1]) || 0
          return aNum - bNum
        })
        
        // Apply manual vertical spacing
        sortedNodes.forEach((node, index) => {
          const manualY = 80 + (index * 320) // Start at 80, then 400px spacing between each
          node.position.y = manualY
          console.log(`🔧 Manual positioning: ${node.id} -> y=${manualY}`)
        })
      }
    }

    // Convert edges to ReactFlow format
    const layoutedEdges: Edge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'smoothstep',
      label: edge.label,
      data: edge.data,
      // Better edge styling
      style: {
        strokeWidth: 2,
        stroke: '#94a3b8', // Tailwind slate-400
      },
      labelStyle: {
        fontSize: 12,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: 'white',
        fillOpacity: 0.9,
      },
    }))

    return { nodes: layoutedNodes, edges: layoutedEdges }
  } catch (error) {
    console.error('Layout calculation failed:', error)
    // Fallback to simple grid layout
    return getGridLayout(nodes, edges)
  }
}

/**
 * Vertical layout - top to bottom flow (Zapier style - now the primary layout)
 */
export const getLayoutedElementsVertical = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): LayoutedElements => {
  return getLayoutedElements(nodes, edges, 'TB')
}

/**
 * Horizontal layout - left to right flow  
 */
export const getLayoutedElementsHorizontal = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): LayoutedElements => {
  return getLayoutedElements(nodes, edges, 'LR')
}

/**
 * Auto layout - chooses best direction based on workflow structure
 * Now defaults to vertical (Zapier style) unless specifically better horizontal
 */
export const getAutoLayout = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): LayoutedElements => {
  // Analyze workflow structure to determine best layout
  const maxDepth = calculateMaxDepth(nodes, edges)
  const maxWidth = calculateMaxWidth(nodes, edges)
  
  // Prefer vertical layout (Zapier style) unless workflow is much wider than deep
  const useHorizontal = maxWidth > maxDepth * 2
  
  return getLayoutedElements(nodes, edges, useHorizontal ? 'LR' : 'TB')
}

/**
 * Specialized layout for conditional workflows with branching
 */
export const getConditionalLayout = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): LayoutedElements => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  // Use more spacing for conditional flows
  dagreGraph.setGraph({
    rankdir: 'LR',
    nodesep: 120,
    ranksep: 200, // Extra space for branching
    marginx: 60,
    marginy: 60
  })

  // Add nodes
  nodes.forEach((node) => {
    const dimensions = NODE_DIMENSIONS[node.type] || NODE_DIMENSIONS.action
    dagreGraph.setNode(node.id, dimensions)
  })

  // Add edges with special handling for conditional branches
  edges.forEach((edge) => {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      // Add weight for conditional edges to influence layout
      const weight = edge.data?.condition ? 1 : 2
      dagreGraph.setEdge(edge.source, edge.target, { weight })
    }
  })

  dagre.layout(dagreGraph)

  // Convert with conditional edge styling
  const layoutedNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const dimensions = NODE_DIMENSIONS[node.type] || NODE_DIMENSIONS.action
    
    return {
      id: node.id,
      type: node.type,
      position: {
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      },
      data: node.data,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }
  })

  const layoutedEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    label: edge.label,
    data: edge.data,
    style: {
      strokeWidth: edge.data?.condition ? 3 : 2,
      stroke: edge.data?.condition ? '#f59e0b' : '#94a3b8', // Orange for conditions
    },
    labelStyle: {
      fontSize: 12,
      fontWeight: edge.data?.condition ? 600 : 500,
    },
  }))

  return { nodes: layoutedNodes, edges: layoutedEdges }
}

/**
 * Fallback grid layout when Dagre fails
 */
const getGridLayout = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): LayoutedElements => {
  const GRID_SPACING = 300
  const GRID_COLS = Math.ceil(Math.sqrt(nodes.length))
  
  const layoutedNodes: Node[] = nodes.map((node, index) => {
    const row = Math.floor(index / GRID_COLS)
    const col = index % GRID_COLS
    
    return {
      id: node.id,
      type: node.type,
      position: {
        x: col * GRID_SPACING,
        y: row * GRID_SPACING,
      },
      data: node.data,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }
  })

  const layoutedEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'straight',
    label: edge.label,
    data: edge.data,
  }))

  return { nodes: layoutedNodes, edges: layoutedEdges }
}

/**
 * Helper function to calculate workflow depth (longest path)
 */
const calculateMaxDepth = (nodes: WorkflowNode[], edges: WorkflowEdge[]): number => {
  // Build adjacency list
  const graph = new Map<string, string[]>()
  nodes.forEach(node => graph.set(node.id, []))
  edges.forEach(edge => {
    const connections = graph.get(edge.source) || []
    connections.push(edge.target)
    graph.set(edge.source, connections)
  })

  // Find start nodes (no incoming edges)
  const incomingCount = new Map<string, number>()
  nodes.forEach(node => incomingCount.set(node.id, 0))
  edges.forEach(edge => {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1)
  })

  const startNodes = nodes.filter(node => incomingCount.get(node.id) === 0)
  
  // DFS to find max depth
  const findMaxDepth = (nodeId: string, visited: Set<string>): number => {
    if (visited.has(nodeId)) return 0
    visited.add(nodeId)
    
    const connections = graph.get(nodeId) || []
    if (connections.length === 0) return 1
    
    let maxChildDepth = 0
    for (const childId of connections) {
      maxChildDepth = Math.max(maxChildDepth, findMaxDepth(childId, new Set(visited)))
    }
    
    return 1 + maxChildDepth
  }

  return Math.max(...startNodes.map(node => findMaxDepth(node.id, new Set())))
}

/**
 * Helper function to calculate workflow width (max parallel branches)
 */
const calculateMaxWidth = (nodes: WorkflowNode[], edges: WorkflowEdge[]): number => {
  // Group nodes by their level in the workflow
  const levels = new Map<number, string[]>()
  
  // Simple level assignment based on distance from start
  const visited = new Set<string>()
  const queue: Array<{nodeId: string, level: number}> = []
  
  // Find start nodes
  const incomingCount = new Map<string, number>()
  nodes.forEach(node => incomingCount.set(node.id, 0))
  edges.forEach(edge => {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1)
  })
  
  nodes.filter(node => incomingCount.get(node.id) === 0)
    .forEach(node => queue.push({nodeId: node.id, level: 0}))
  
  // BFS to assign levels
  while (queue.length > 0) {
    const {nodeId, level} = queue.shift()!
    
    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    
    if (!levels.has(level)) levels.set(level, [])
    levels.get(level)!.push(nodeId)
    
    // Add connected nodes to queue
    edges.filter(edge => edge.source === nodeId)
      .forEach(edge => queue.push({nodeId: edge.target, level: level + 1}))
  }
  
  // Return max width across all levels
  return Math.max(...Array.from(levels.values()).map(levelNodes => levelNodes.length), 1)
}

/**
 * Utility to re-layout existing ReactFlow elements
 */
export const relayoutElements = (
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): LayoutedElements => {
  // Convert ReactFlow nodes back to WorkflowNode format
  const workflowNodes: WorkflowNode[] = nodes.map(node => ({
    id: node.id,
    type: node.type as WorkflowNode['type'],
    position: node.position,
    data: node.data
  }))

  // Convert ReactFlow edges back to WorkflowEdge format
  const workflowEdges: WorkflowEdge[] = edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type as WorkflowEdge['type'],
    label: typeof edge.label === 'string' ? edge.label : undefined,
    data: edge.data
  }))

  return getLayoutedElements(workflowNodes, workflowEdges, direction)
}