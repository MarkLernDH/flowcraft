import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { Workflow, WorkflowNode, WorkflowEdge } from '@/types/workflow'

// Input/Output schemas
export const WorkflowDeltaSchema = z.object({
  type: z.enum(['add_node', 'modify_node', 'remove_node', 'add_edge', 'modify_edge', 'remove_edge', 'update_metadata']),
  nodeId: z.string().nullable().optional(),
  edgeId: z.string().nullable().optional(),
  node: z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.record(z.any())
  }).nullable().optional(),
  edge: z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string().nullable().optional(),
    label: z.string().nullable().optional(),
    data: z.record(z.any()).nullable().optional()
  }).nullable().optional(),
  updates: z.record(z.any()).nullable().optional(),
  metadata: z.record(z.any()).nullable().optional()
})

export const ApplyDeltaInputSchema = z.object({
  workflow: z.any().describe('The current workflow to modify'),
  changes: z.array(WorkflowDeltaSchema).describe('Array of changes to apply'),
  options: z.object({
    validateConnections: z.boolean().nullable().optional().default(true),
    autoLayout: z.boolean().nullable().optional().default(false),
    preserveIds: z.boolean().nullable().optional().default(true)
  }).nullable().optional()
})

export const ApplyDeltaOutputSchema = z.object({
  workflow: z.any().describe('The updated workflow'),
  changesApplied: z.array(z.string()).describe('Description of changes that were successfully applied'),
  errors: z.array(z.string()).describe('Any errors encountered during application'),
  warnings: z.array(z.string()).describe('Warnings about potential issues'),
  summary: z.string().describe('Overall summary of the modifications')
})

export type WorkflowDelta = z.infer<typeof WorkflowDeltaSchema>
export type ApplyDeltaInput = z.infer<typeof ApplyDeltaInputSchema>
export type ApplyDeltaOutput = z.infer<typeof ApplyDeltaOutputSchema>

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function validateWorkflow(workflow: Workflow): string[] {
  const errors: string[] = []
  
  // Check for duplicate node IDs
  const nodeIds = workflow.nodes.map(n => n.id)
  const duplicateNodes = nodeIds.filter((id, index) => nodeIds.indexOf(id) !== index)
  if (duplicateNodes.length > 0) {
    errors.push(`Duplicate node IDs found: ${duplicateNodes.join(', ')}`)
  }
  
  // Check for edges referencing non-existent nodes
  for (const edge of workflow.edges) {
    if (!nodeIds.includes(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`)
    }
    if (!nodeIds.includes(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`)
    }
  }
  
  return errors
}

function autoLayoutNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  // Simple vertical layout with 200px spacing
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: 250,
      y: 50 + (index * 200)
    }
  }))
}

export const applyWorkflowDelta = new DynamicStructuredTool({
  name: 'applyWorkflowDelta',
  description: 'Applies a set of structured edits to a workflow (add node, update config, delete edge, etc.)',
  schema: ApplyDeltaInputSchema,
  
  func: async (input: ApplyDeltaInput): Promise<string> => {
    try {
      const workflow: Workflow = { ...input.workflow }
      const changesApplied: string[] = []
      const errors: string[] = []
      const warnings: string[] = []
      const options = {
        validateConnections: true,
        autoLayout: false,
        preserveIds: true,
        ...input.options
      }

      // Apply each change in sequence
      for (const change of input.changes) {
        try {
          switch (change.type) {
            case 'add_node':
              if (!change.node) {
                errors.push('add_node change missing node data')
                continue
              }
              
              // Ensure unique ID
              if (workflow.nodes.some(n => n.id === change.node!.id)) {
                if (options.preserveIds) {
                  change.node.id = `${change.node.id}-${generateId()}`
                  warnings.push(`Node ID was duplicated, renamed to ${change.node.id}`)
                } else {
                  errors.push(`Node with ID ${change.node.id} already exists`)
                  continue
                }
              }
              
              workflow.nodes.push(change.node as WorkflowNode)
              changesApplied.push(`Added node: ${change.node.data.label || change.node.id}`)
              break

            case 'modify_node':
              if (!change.nodeId || !change.updates) {
                errors.push('modify_node change missing nodeId or updates')
                continue
              }
              
              const nodeIndex = workflow.nodes.findIndex(n => n.id === change.nodeId)
              if (nodeIndex === -1) {
                errors.push(`Node with ID ${change.nodeId} not found`)
                continue
              }
              
              // Deep merge updates
              workflow.nodes[nodeIndex] = {
                ...workflow.nodes[nodeIndex],
                ...change.updates,
                data: {
                  ...workflow.nodes[nodeIndex].data,
                  ...(change.updates.data || {})
                }
              }
              changesApplied.push(`Modified node: ${change.nodeId}`)
              break

            case 'remove_node':
              if (!change.nodeId) {
                errors.push('remove_node change missing nodeId')
                continue
              }
              
              const nodeToRemove = workflow.nodes.find(n => n.id === change.nodeId)
              if (!nodeToRemove) {
                errors.push(`Node with ID ${change.nodeId} not found`)
                continue
              }
              
              // Remove node
              workflow.nodes = workflow.nodes.filter(n => n.id !== change.nodeId)
              
              // Remove connected edges
              const removedEdges = workflow.edges.filter(e => 
                e.source === change.nodeId || e.target === change.nodeId
              )
              workflow.edges = workflow.edges.filter(e => 
                e.source !== change.nodeId && e.target !== change.nodeId
              )
              
              changesApplied.push(`Removed node: ${nodeToRemove.data.label || change.nodeId}`)
              if (removedEdges.length > 0) {
                changesApplied.push(`Removed ${removedEdges.length} connected edges`)
              }
              break

            case 'add_edge':
              if (!change.edge) {
                errors.push('add_edge change missing edge data')
                continue
              }
              
              // Validate source and target nodes exist
              const sourceExists = workflow.nodes.some(n => n.id === change.edge!.source)
              const targetExists = workflow.nodes.some(n => n.id === change.edge!.target)
              
              if (!sourceExists) {
                errors.push(`Source node ${change.edge.source} does not exist`)
                continue
              }
              if (!targetExists) {
                errors.push(`Target node ${change.edge.target} does not exist`)
                continue
              }
              
              // Ensure unique edge ID
              if (workflow.edges.some(e => e.id === change.edge!.id)) {
                change.edge.id = `${change.edge.id}-${generateId()}`
                warnings.push(`Edge ID was duplicated, renamed to ${change.edge.id}`)
              }
              
              workflow.edges.push(change.edge as WorkflowEdge)
              changesApplied.push(`Added edge: ${change.edge.source} → ${change.edge.target}`)
              break

            case 'modify_edge':
              if (!change.edgeId || !change.updates) {
                errors.push('modify_edge change missing edgeId or updates')
                continue
              }
              
              const edgeIndex = workflow.edges.findIndex(e => e.id === change.edgeId)
              if (edgeIndex === -1) {
                errors.push(`Edge with ID ${change.edgeId} not found`)
                continue
              }
              
              workflow.edges[edgeIndex] = {
                ...workflow.edges[edgeIndex],
                ...change.updates
              }
              changesApplied.push(`Modified edge: ${change.edgeId}`)
              break

            case 'remove_edge':
              if (!change.edgeId) {
                errors.push('remove_edge change missing edgeId')
                continue
              }
              
              const edgeToRemove = workflow.edges.find(e => e.id === change.edgeId)
              if (!edgeToRemove) {
                errors.push(`Edge with ID ${change.edgeId} not found`)
                continue
              }
              
              workflow.edges = workflow.edges.filter(e => e.id !== change.edgeId)
              changesApplied.push(`Removed edge: ${edgeToRemove.source} → ${edgeToRemove.target}`)
              break

            case 'update_metadata':
              if (!change.metadata) {
                errors.push('update_metadata change missing metadata')
                continue
              }
              
              workflow.name = change.metadata.name || workflow.name
              workflow.description = change.metadata.description || workflow.description
              workflow.status = change.metadata.status || workflow.status
              
              changesApplied.push('Updated workflow metadata')
              break

            default:
              errors.push(`Unknown change type: ${change.type}`)
          }
        } catch (changeError) {
          errors.push(`Error applying change ${change.type}: ${changeError}`)
        }
      }

      // Auto-layout if requested
      if (options.autoLayout) {
        workflow.nodes = autoLayoutNodes(workflow.nodes)
        changesApplied.push('Applied automatic layout')
      }

      // Validate workflow if requested
      if (options.validateConnections) {
        const validationErrors = validateWorkflow(workflow)
        errors.push(...validationErrors)
      }

      // Update workflow timestamp
      workflow.updatedAt = new Date()

      const result: ApplyDeltaOutput = {
        workflow,
        changesApplied,
        errors,
        warnings,
        summary: `Applied ${changesApplied.length} changes successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}${warnings.length > 0 ? ` and ${warnings.length} warnings` : ''}`
      }

      return JSON.stringify(result, null, 2)
    } catch (error) {
      console.error('Workflow delta application failed:', error)
      
      const fallback: ApplyDeltaOutput = {
        workflow: input.workflow,
        changesApplied: [],
        errors: [`Failed to apply changes: ${error}`],
        warnings: [],
        summary: 'No changes were applied due to processing error'
      }
      
      return JSON.stringify(fallback, null, 2)
    }
  }
}) 