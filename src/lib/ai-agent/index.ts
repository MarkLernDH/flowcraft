// Legacy exports (for backward compatibility)
export { FlowCraftAgent } from './agent'
export { createAgent } from './agent'

// Agent V2 exports (optimized drop-in replacement)
export { 
  FlowCraftAgentV2,
  FlowCraftPlannerAgent,
  createPlannerAgent,
  createOptimizedFlowCraftAgent
} from './agent-v2-simple'

// New optimized exports
export { 
  OptimizedFlowCraftAgent, 
  createOptimizedAgent,
  StreamingFlowCraftAgent,
  FlowCraftTool
} from './optimized-agent'

export type { 
  AgentStreamingUpdate,
  AgentResponse,
  AgentConfig 
} from './types'
export { agentConfig } from './config' 