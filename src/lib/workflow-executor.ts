import { Workflow, WorkflowNode, WorkflowProject } from '@/types/workflow'

export interface WorkflowExecutionResult {
  success: boolean
  results: ExecutionStepResult[]
  errors: string[]
  startTime: Date
  endTime?: Date
  totalDuration?: number
}

export interface ExecutionStepResult {
  nodeId: string
  nodeName: string
  status: 'completed' | 'failed' | 'skipped'
  startTime: Date
  endTime: Date
  duration: number
  input?: unknown
  output?: unknown
  error?: string
}

export class WorkflowExecutor {
  /**
   * Execute a workflow with real-time progress updates
   */
  static async executeWorkflow(
    workflow: Workflow, 
    project?: WorkflowProject,
    onProgress?: (step: ExecutionStepResult) => void
  ): Promise<WorkflowExecutionResult> {
    const startTime = new Date()
    console.log('🚀 Starting workflow execution:', workflow.name)
    
    try {
      const results: ExecutionStepResult[] = []
      const errors: string[] = []
      
      // Sort nodes by position (top to bottom execution)
      const sortedNodes = [...workflow.nodes].sort((a, b) => a.position.y - b.position.y)
      
      // Execute each node in sequence
      for (const node of sortedNodes) {
        try {
          const stepResult = await this.executeNode(node, results, project)
          results.push(stepResult)
          
          // Call progress callback if provided
          if (onProgress) {
            onProgress(stepResult)
          }
          
          console.log(`✅ Node ${node.id} (${node.data.label}) completed in ${stepResult.duration}ms`)
          
          // Add delay between steps for demonstration
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          const stepResult: ExecutionStepResult = {
            nodeId: node.id,
            nodeName: node.data.label,
            status: 'failed',
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            error: error instanceof Error ? error.message : String(error)
          }
          
          results.push(stepResult)
          errors.push(`Node ${node.id} (${node.data.label}) failed: ${stepResult.error}`)
          
          if (onProgress) {
            onProgress(stepResult)
          }
          
          console.error(`❌ Node ${node.id} failed:`, error)
          
          // Continue execution for demo purposes (in production, you might want to stop)
        }
      }
      
      const endTime = new Date()
      const totalDuration = endTime.getTime() - startTime.getTime()
      
      const result: WorkflowExecutionResult = {
        success: errors.length === 0,
        results,
        errors,
        startTime,
        endTime,
        totalDuration
      }
      
      console.log(`🎯 Workflow execution completed in ${totalDuration}ms. Success: ${result.success}`)
      
      return result
    } catch (error) {
      const endTime = new Date()
      return {
        success: false,
        results: [],
        errors: [`Workflow execution failed: ${error instanceof Error ? error.message : String(error)}`],
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime()
      }
    }
  }

  /**
   * Execute a single workflow node
   */
  private static async executeNode(
    node: WorkflowNode, 
    previousResults: ExecutionStepResult[],
    project?: WorkflowProject
  ): Promise<ExecutionStepResult> {
    const stepStartTime = new Date()
    
    console.log(`🔄 Executing node: ${node.data.label} (${node.type})`)
    
    try {
      let output: unknown
      
      switch (node.type) {
        case 'trigger':
          output = await this.executeTrigger(node, project)
          break
        case 'action':
          output = await this.executeAction(node, previousResults, project)
          break
        case 'condition':
          output = await this.executeCondition(node, previousResults, project)
          break
        case 'transform':
          output = await this.executeTransform(node, previousResults, project)
          break
        case 'loop':
          output = await this.executeLoop(node, previousResults, project)
          break
        default:
          output = await this.executeGenericStep(node, previousResults, project)
      }
      
      const stepEndTime = new Date()
      const duration = stepEndTime.getTime() - stepStartTime.getTime()
      
      return {
        nodeId: node.id,
        nodeName: node.data.label,
        status: 'completed',
        startTime: stepStartTime,
        endTime: stepEndTime,
        duration,
        input: this.getNodeInput(node, previousResults),
        output
      }
    } catch (error) {
      // const stepEndTime = new Date()
      // const duration = stepEndTime.getTime() - stepStartTime.getTime()
      
      throw error // Re-throw to be handled by caller
    }
  }

  private static async executeTrigger(node: WorkflowNode, _project?: WorkflowProject): Promise<unknown> {
    // Simulate trigger execution
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      nodeType: 'trigger',
      service: node.data.service || 'manual',
      operation: node.data.operation || 'start',
      timestamp: new Date().toISOString(),
      data: {
        triggerSource: node.data.service || 'manual',
        triggeredBy: 'user',
        payload: { message: 'Workflow triggered successfully' }
      }
    }
  }

  private static async executeAction(
    node: WorkflowNode, 
    previousResults: ExecutionStepResult[],
    project?: WorkflowProject
  ): Promise<unknown> {
    // Get input from previous steps
    const input = this.getNodeInput(node, previousResults)
    
    // Simulate action execution with the configured service
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const service = node.data.service || 'generic'
    const operation = node.data.operation || 'execute'
    
    // Try to use actual integration if available
    if (project && project.integrations.length > 0) {
      const integration = project.integrations.find(int => 
        int.serviceName.toLowerCase() === service.toLowerCase()
      )
      
      if (integration) {
        console.log(`📡 Using ${integration.serviceName} integration`)
        return {
          nodeType: 'action',
          service: integration.serviceName,
          operation,
          result: `Successfully executed ${operation} on ${integration.serviceName}`,
          integration: integration.className,
          timestamp: new Date().toISOString(),
          input,
          output: {
            status: 'success',
            data: { processed: true, records: Math.floor(Math.random() * 100) + 1 }
          }
        }
      }
    }
    
    // Fallback to mock execution
    return {
      nodeType: 'action',
      service,
      operation,
      result: `Mock execution of ${operation} on ${service}`,
      timestamp: new Date().toISOString(),
      input,
      output: {
        status: 'success',
        data: { message: `${service} action completed`, recordsProcessed: Math.floor(Math.random() * 50) + 1 }
      }
    }
  }

  private static async executeCondition(
    node: WorkflowNode, 
    previousResults: ExecutionStepResult[],
    _project?: WorkflowProject
  ): Promise<unknown> {
    const input = this.getNodeInput(node, previousResults)
    
    // Simulate condition evaluation
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock condition logic - randomly pass/fail for demo
    const conditionMet = Math.random() > 0.3 // 70% success rate
    
    return {
      nodeType: 'condition',
      condition: node.data.operation || 'evaluate',
      result: conditionMet,
      message: conditionMet ? 'Condition passed' : 'Condition failed',
      timestamp: new Date().toISOString(),
      input,
      evaluation: {
        expression: node.data.config?.condition || 'default condition',
        result: conditionMet
      }
    }
  }

  private static async executeTransform(
    node: WorkflowNode, 
    previousResults: ExecutionStepResult[],
    _project?: WorkflowProject
  ): Promise<unknown> {
    const input = this.getNodeInput(node, previousResults)
    
    // Simulate data transformation
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    const transformType = node.data.operation || 'transform'
    
    return {
      nodeType: 'transform',
      transformation: transformType,
      result: 'Data transformed successfully',
      timestamp: new Date().toISOString(),
      input,
      output: {
        originalData: input,
        transformedData: {
          ...(typeof input === 'object' && input !== null ? input as Record<string, unknown> : {}),
          processed: true,
          transformedAt: new Date().toISOString(),
          transformationType: transformType
        }
      }
    }
  }

  private static async executeLoop(
    node: WorkflowNode, 
    _previousResults: ExecutionStepResult[],
    _project?: WorkflowProject
  ): Promise<unknown> {
    // Simulate loop execution
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const iterations = Math.floor(Math.random() * 5) + 1
    
    return {
      nodeType: 'loop',
      loopType: node.data.operation || 'forEach',
      iterations,
      result: `Loop completed ${iterations} iterations`,
      timestamp: new Date().toISOString(),
      details: {
        totalIterations: iterations,
        successful: iterations,
        failed: 0
      }
    }
  }

  private static async executeGenericStep(
    node: WorkflowNode, 
    _previousResults: ExecutionStepResult[],
    _project?: WorkflowProject
  ): Promise<unknown> {
    // Generic step execution
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      nodeType: node.type,
      service: node.data.service || 'generic',
      operation: node.data.operation || 'execute',
      result: `Generic step executed: ${node.data.label}`,
      timestamp: new Date().toISOString(),
      status: 'completed'
    }
  }

  private static getNodeInput(node: WorkflowNode, previousResults: ExecutionStepResult[]): unknown {
    // Get output from the most recent successful step as input
    const lastSuccessfulResult = previousResults
      .filter(result => result.status === 'completed')
      .pop()
    
    return lastSuccessfulResult?.output || { 
      source: 'workflow_start',
      nodeId: node.id,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Get execution summary for display
   */
  static getExecutionSummary(result: WorkflowExecutionResult): string {
    const { success, results, totalDuration } = result
    const completedSteps = results.filter(r => r.status === 'completed').length
    const failedSteps = results.filter(r => r.status === 'failed').length
    
    if (success) {
      return `✅ Workflow completed successfully! Executed ${completedSteps} steps in ${totalDuration}ms.`
    } else {
      return `⚠️ Workflow completed with errors. ${completedSteps} steps succeeded, ${failedSteps} failed. Total time: ${totalDuration}ms.`
    }
  }
} 