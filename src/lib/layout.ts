import dagre from 'dagre'
import { WorkflowNode, WorkflowEdge } from '@/types/workflow'

const nodeWidth = 280
const nodeHeight = 120

export const getLayoutedElements = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  direction = 'LR'
) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  // Set graph direction and spacing
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 50, // Horizontal spacing between nodes
    ranksep: 100, // Vertical spacing between ranks
    marginx: 50,
    marginy: 50,
  })

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: nodeWidth, 
      height: nodeHeight 
    })
  })

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    
    return {
      ...node,
      position: {
        // Center the node on the calculated position
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export const getLayoutedElementsVertical = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
) => {
  return getLayoutedElements(nodes, edges, 'TB')
}

export const getLayoutedElementsHorizontal = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
) => {
  return getLayoutedElements(nodes, edges, 'LR')
} 