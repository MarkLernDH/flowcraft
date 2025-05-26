// Core utilities
export { generateId } from './utils'
export { getLayoutedElementsVertical, getLayoutedElementsHorizontal } from './layout'

// Workflow execution
export { WorkflowExecutor } from './workflow-executor'

// Configuration
export * from './config'

// AI Agent system - Main interface
export { 
  FlowCraftAgent,
  createAgent,
  type AgentStreamingUpdate,
  type AgentResponse,
  type AgentConfig
} from './ai-agent'

// Backward compatibility aliases
export { FlowCraftAgent as AIService } from './ai-agent'
export { FlowCraftAgent as FlowCraftAI } from './ai-agent'

// Type definitions for enhanced services
// TODO: Re-enable these type exports after fixing webpack issues
// export type {
//   // Enhanced AI Agent types
//   ConversationContext,
//   UserPreferences,
//   AIMemory,
//   ContextualAnalysisResult,
//   WorkflowIterationResult,
//   OptimizationSuggestions
// } from './ai/enhanced_ai_agent'

// export type {
//   // API Research types
//   APIEndpoint,
//   APITestResult,
//   ServiceDocumentation,
//   IntegrationResult,
//   ValidationResult
// } from '../lib/services/api_research_tool'

// export type {
//   // Collaboration types
//   CollaborationSession,
//   Participant,
//   AIPersona,
//   ConversationEntry,
//   GoalTracker,
//   ConflictTracker,
//   FacilitationResult
// } from './collaboration/collaboration_system' 