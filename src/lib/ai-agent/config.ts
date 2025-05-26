import { AgentConfig } from './types'

export const agentConfig: AgentConfig = {
  model: {
    provider: 'openai',
    modelName: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 4000
  },
  tools: [
    'classifyIntent',
    'performDeepDiscovery',
    'researchIntegrations', 
    'generateWorkflow',
    'applyWorkflowDelta',
    'optimizeWorkflow',
    'generateTests',
    'analyzeComplexity'
  ],
  verbose: process.env.NODE_ENV === 'development',
  maxIterations: 10
}

export const toolConfigs = {
  classifyIntent: {
    description: 'Classifies user intent to route to the appropriate workflow tools and processes.',
    maxRetries: 2,
    timeout: 15000
  },
  performDeepDiscovery: {
    description: 'Analyzes automation prompts and extracts structured workflow requirements including triggers, actions, and integrations.',
    maxRetries: 3,
    timeout: 30000
  },
  researchIntegrations: {
    description: 'Researches and generates TypeScript integration code for specified services with proper authentication and error handling.',
    maxRetries: 2,
    timeout: 45000
  },
  generateWorkflow: {
    description: 'Creates complete workflow structures with nodes, edges, and project files based on discovery results and integrations.',
    maxRetries: 2,
    timeout: 60000
  },
  applyWorkflowDelta: {
    description: 'Applies a set of structured edits to a workflow (add node, update config, delete edge, etc.)',
    maxRetries: 2,
    timeout: 30000
  },
  optimizeWorkflow: {
    description: 'Analyzes workflows for performance, security, and reliability improvements.',
    maxRetries: 1,
    timeout: 20000
  },
  generateTests: {
    description: 'Creates comprehensive test suites for workflows including unit, integration, and end-to-end tests.',
    maxRetries: 2,
    timeout: 30000
  },
  analyzeComplexity: {
    description: 'Evaluates workflow complexity and provides recommendations for simplification or enhancement.',
    maxRetries: 1,
    timeout: 15000
  }
}

export const promptTemplates = {
  systemPrompt: `You are FlowCraft AI — a multi-agent, automation-building intelligence.

You help users build production-ready automation workflows. You use tools and plans to:
- Understand user intent
- Discover triggers and actions
- Research and write integrations
- Generate full workflows with nodes, edges, tests, and monitoring
- Modify workflows intelligently when asked

Your principles:
1. Always reason step-by-step
2. Use tools to verify your assumptions
3. Never guess if a tool is available
4. Provide confident, executable output
5. Be delightful and clear like Lovable, but technically sharp like Zapier

Your goal is to build complete automation systems — visual, validated, and deployable.

You operate in a ReAct format:
Thought:
Tool:
Tool Input:
Observation:
...
Final Answer:`,

  discoveryPrompt: `Analyze this automation request and extract detailed requirements:

Request: "{prompt}"

Context: {context}

Provide comprehensive analysis including:
- Clear summary of the automation goal
- Identified triggers with confidence scores
- Required actions with implementation details
- Integration requirements and dependencies
- Complexity assessment and risk factors
- Alternative approaches if applicable

Focus on popular, well-supported services and realistic implementations.`,

  integrationPrompt: `Research and generate TypeScript integration code for these services:

Services: {services}
Requirements: {requirements}

For each service, provide:
- Complete TypeScript class with proper typing
- Authentication handling (API keys, OAuth, etc.)
- Error handling and retry logic
- Rate limiting considerations
- Configuration schema for UI
- Key methods with documentation
- Testing strategies

Generate production-ready code with proper error handling and TypeScript types.`,

  workflowPrompt: `Generate a complete workflow system from this analysis:

Discovery: {discovery}
Integrations: {integrations}
Preferences: {preferences}

Create:
- Workflow nodes and edges with proper layout
- Project structure with all necessary files
- Test suite covering key scenarios
- Monitoring and alerting configuration
- Deployment instructions
- Security checklist

Ensure the workflow is immediately executable and well-documented.`
} 