import OpenAI from 'openai'
import { 
  AIAnalysis, 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge,
  AIDiscoveryResult,
  ServiceResearch,
  GeneratedIntegration,
  WorkflowProject,
  ProjectComponent,
  GeneratedFile,
  TestCase,
  MonitoringConfig,
  ComponentSpec
} from '@/types/workflow'
import { generateId } from './utils'
import { getLayoutedElementsHorizontal } from './layout'

// Initialize OpenAI (you'll need to set OPENAI_API_KEY environment variable)
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your-api-key-here',
  dangerouslyAllowBrowser: true // Note: In production, use server-side API routes
})

export class FlowCraftAI {
  
  /**
   * Phase 1: Discovery & Planning
   * Analyzes user request and creates intelligent plan
   */
  static async discoverAndPlan(prompt: string): Promise<AIDiscoveryResult> {
    const discoveryPrompt = `
You are FlowCraft AI, an intelligent workflow automation generator. Analyze this user request and provide a comprehensive discovery plan.

User Request: "${prompt}"

Analyze and respond with a JSON object containing:
{
  "summary": "Brief summary of what the user wants to build",
  "keyComponents": ["list", "of", "main", "components"],
  "identifiedTriggers": [{"type": "trigger_type", "service": "service_name", "operation": "operation", "description": "what it does", "configRequirements": ["req1", "req2"], "dependencies": ["dep1"]}],
  "identifiedActions": [{"type": "action_type", "service": "service_name", "operation": "operation", "description": "what it does", "configRequirements": ["req1"], "dependencies": ["dep1"]}],
  "requiredIntegrations": ["service1", "service2"],
  "unknownServices": ["services", "that", "need", "research"],
  "complexity": "simple|standard|advanced|enterprise",
  "recommendedApproach": "Detailed explanation of implementation approach",
  "estimatedEffort": "Time and complexity estimate"
}

Focus on identifying:
1. What triggers the workflow
2. What actions need to be performed
3. What services/APIs are involved
4. Data transformations needed
5. Error handling requirements
6. Scale and complexity level
`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: discoveryPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from AI')

      return JSON.parse(content) as AIDiscoveryResult
    } catch (error) {
      console.error('Discovery failed:', error)
      // Fallback to basic analysis
      return this.fallbackDiscovery(prompt)
    }
  }

  /**
   * Phase 2: Service Research for Unknown Integrations
   * Uses web search to research APIs and generate integration code
   */
  static async researchUnknownServices(services: string[]): Promise<ServiceResearch[]> {
    const researched: ServiceResearch[] = []

    for (const service of services) {
      try {
        // In a real implementation, you would use a web search API like Tavily, Serper, or similar
        // For now, we'll simulate the research with OpenAI's knowledge
        const researchPrompt = `
Research the ${service} API and provide comprehensive integration details in JSON format:

{
  "serviceName": "${service}",
  "apiDocumentation": "Brief overview of the API",
  "baseUrl": "https://api.example.com",
  "authentication": "api_key|oauth2|bearer|basic",
  "endpoints": [
    {
      "path": "/endpoint",
      "method": "GET|POST|PUT|DELETE",
      "description": "What this endpoint does",
      "parameters": [
        {
          "name": "param_name",
          "type": "string|number|boolean",
          "required": true,
          "description": "Parameter description",
          "location": "query|body|header|path"
        }
      ],
      "responseSchema": {"example": "response"}
    }
  ],
  "dataStructures": {"CommonTypes": "here"},
  "rateLimits": {"requests": 1000, "period": "hour"}
}

Provide real, accurate information for ${service} API if you know it, or reasonable assumptions based on common API patterns.
`

        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "system", content: researchPrompt }],
          temperature: 0.1,
          max_tokens: 1500
        })

        const content = response.choices[0]?.message?.content
        if (content) {
          const serviceData = JSON.parse(content) as ServiceResearch
          researched.push(serviceData)
        }
      } catch (error) {
        console.error(`Failed to research ${service}:`, error)
        // Add basic fallback research
        researched.push(this.fallbackServiceResearch(service))
      }
    }

    return researched
  }

  /**
   * Phase 3: Dynamic Integration Generation
   * Creates complete integration classes with error handling
   */
  static async generateIntegrations(researchedServices: ServiceResearch[]): Promise<GeneratedIntegration[]> {
    const integrations: GeneratedIntegration[] = []

    for (const service of researchedServices) {
      try {
        const generationPrompt = `
Generate a complete TypeScript integration class for ${service.serviceName} based on this research:

${JSON.stringify(service, null, 2)}

Create a comprehensive integration class with:
1. Proper TypeScript types
2. Error handling with circuit breakers
3. Retry logic with exponential backoff
4. Rate limiting respect
5. Complete method implementations
6. Configuration validation

Return JSON with:
{
  "serviceName": "${service.serviceName}",
  "className": "ServiceNameIntegration",
  "code": "complete TypeScript class code",
  "dependencies": ["required", "npm", "packages"],
  "configSchema": [{"name": "apiKey", "label": "API Key", "type": "text", "required": true}],
  "methods": [{"name": "methodName", "description": "what it does", "parameters": [], "returnType": "Promise<Type>", "errorHandling": ["error types handled"]}]
}
`

        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "system", content: generationPrompt }],
          temperature: 0.2,
          max_tokens: 3000
        })

        const content = response.choices[0]?.message?.content
        if (content) {
          const integration = JSON.parse(content) as GeneratedIntegration
          integrations.push(integration)
        }
      } catch (error) {
        console.error(`Failed to generate integration for ${service.serviceName}:`, error)
        integrations.push(this.fallbackIntegration(service))
      }
    }

    return integrations
  }

  /**
   * Phase 4: Complete Workflow Project Generation
   * Creates the entire workflow system with all components
   */
  static async generateWorkflowProject(
    discovery: AIDiscoveryResult,
    integrations: GeneratedIntegration[],
    originalPrompt: string
  ): Promise<WorkflowProject> {
    
    const complexity = discovery.complexity
    
    // Generate core components based on complexity
    const components = await this.generateCoreComponents(discovery, integrations, complexity)
    const testSuite = await this.generateTestSuite()
    const monitoring = this.generateMonitoringConfig(complexity)
    const generatedFiles = this.generateProjectFiles()

    const project: WorkflowProject = {
      id: generateId(),
      name: this.extractProjectName(originalPrompt),
      description: discovery.summary,
      complexity,
      components,
      integrations,
      generatedFiles,
      testSuite,
      monitoring
    }

    return project
  }

  /**
   * Generate core workflow components based on complexity and requirements
   */
  private static async generateCoreComponents(
    discovery: AIDiscoveryResult,
    integrations: GeneratedIntegration[],
    complexity: string
  ): Promise<ProjectComponent[]> {
    
    const components: ProjectComponent[] = []

    // 1. Always generate workflow engine
    const engineCode = await this.generateWorkflowEngine(discovery, complexity)
    components.push({
      name: 'WorkflowEngine',
      type: 'engine',
      dependencies: ['uuid', 'eventemitter3'],
      code: engineCode,
      filepath: 'src/engine/workflow-engine.ts'
    })

    // 2. Always generate visual builder
    const builderCode = await this.generateVisualBuilder(discovery, complexity)
    components.push({
      name: 'WorkflowBuilder',
      type: 'builder', 
      dependencies: ['reactflow', 'react', '@types/react'],
      code: builderCode,
      filepath: 'src/components/workflow-builder.tsx'
    })

    // 3. Generate trigger components
    for (const trigger of discovery.identifiedTriggers) {
      const triggerCode = await this.generateTriggerComponent(trigger)
      components.push({
        name: `${trigger.type}Trigger`,
        type: 'trigger',
        dependencies: trigger.dependencies,
        code: triggerCode,
        filepath: `src/triggers/${trigger.type.toLowerCase()}-trigger.ts`
      })
    }

    // 4. Generate action components
    for (const action of discovery.identifiedActions) {
      const actionCode = await this.generateActionComponent(action)
      components.push({
        name: `${action.type}Action`,
        type: 'action',
        dependencies: action.dependencies,
        code: actionCode,
        filepath: `src/actions/${action.type.toLowerCase()}-action.ts`
      })
    }

    // 5. Generate monitoring for complex workflows
    if (complexity === 'advanced' || complexity === 'enterprise') {
      const monitorCode = await this.generateMonitoringDashboard()
      components.push({
        name: 'MonitoringDashboard',
        type: 'monitor',
        dependencies: ['recharts', 'react'],
        code: monitorCode,
        filepath: 'src/components/monitoring-dashboard.tsx'
      })
    }

    return components
  }

  /**
   * Generate workflow engine with appropriate complexity
   */
  private static async generateWorkflowEngine(discovery: AIDiscoveryResult, complexity: string): Promise<string> {
    const enginePrompt = `
Generate a TypeScript workflow engine class for ${complexity} complexity workflows.

Requirements from analysis:
${JSON.stringify(discovery, null, 2)}

The engine should include:
${complexity === 'simple' ? '- Basic execution queue\n- Status tracking\n- Simple error handling' : ''}
${complexity === 'standard' ? '- Parallel execution support\n- State management\n- Retry mechanisms\n- Basic monitoring' : ''}
${complexity === 'advanced' ? '- Advanced orchestration\n- Complex state management\n- Circuit breakers\n- Performance monitoring\n- Error recovery' : ''}
${complexity === 'enterprise' ? '- Full enterprise features\n- Audit trails\n- Rollback capabilities\n- Advanced monitoring\n- High availability\n- Security controls' : ''}

Generate complete, production-ready TypeScript code with proper types and error handling.
`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: enginePrompt }],
        temperature: 0.1,
        max_tokens: 3000
      })

      return response.choices[0]?.message?.content || this.fallbackEngineCode(complexity)
    } catch (error) {
      console.error('Failed to generate engine:', error)
      return this.fallbackEngineCode(complexity)
    }
  }

  /**
   * Generate visual builder component
   */
  private static async generateVisualBuilder(discovery: AIDiscoveryResult, complexity: string): Promise<string> {
    const builderPrompt = `
Generate a React TypeScript visual workflow builder component using ReactFlow.

Target user level: ${complexity}
Workflow requirements: ${JSON.stringify(discovery, null, 2)}

Include:
${complexity === 'simple' ? '- Simplified drag-and-drop\n- Guided setup\n- Minimal UI' : ''}
${complexity === 'standard' ? '- Standard drag-and-drop\n- Node configuration\n- Connection management' : ''}
${complexity === 'advanced' ? '- Full canvas controls\n- Custom node types\n- Complex connections\n- Debug tools' : ''}
${complexity === 'enterprise' ? '- Enterprise-grade UI\n- Advanced customization\n- Collaboration features\n- Performance optimization' : ''}

Generate complete React component with proper TypeScript types.
`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: builderPrompt }],
        temperature: 0.2,
        max_tokens: 3000
      })

      return response.choices[0]?.message?.content || this.fallbackBuilderCode()
    } catch (error) {
      console.error('Failed to generate builder:', error)
      return this.fallbackBuilderCode()
    }
  }

  // ... Continue with more generation methods

  /**
   * Legacy support - maintain compatibility with existing interface
   */
  static async analyzePrompt(prompt: string): Promise<AIAnalysis> {
         try {
       const discovery = await this.discoverAndPlan(prompt)
       const unknownServices = discovery.unknownServices
       await this.researchUnknownServices(unknownServices)
       
       // Convert to legacy format
       return {
         blueprint: discovery.summary,
         assumptions: [`Complexity: ${discovery.complexity}`, `Estimated effort: ${discovery.estimatedEffort}`],
         suggestedNodes: await this.convertToLegacyNodes(discovery),
         suggestedEdges: await this.convertToLegacyEdges(discovery),
         generatedCode: await this.generateLegacyCode(discovery),
         recommendations: [discovery.recommendedApproach]
       }
     } catch (error) {
       console.error('AI analysis failed:', error)
       return this.fallbackAnalysis(prompt)
     }
  }

  static async generateWorkflow(analysis: AIAnalysis, prompt: string): Promise<Workflow> {
    // Generate the basic workflow structure
    const baseWorkflow: Workflow = {
      id: generateId(),
      name: this.extractProjectName(prompt),
      description: analysis.blueprint,
      nodes: analysis.suggestedNodes,
      edges: analysis.suggestedEdges,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      originalPrompt: prompt,
      generatedCode: analysis.generatedCode
    }

    // Apply Dagre layout for proper node positioning
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElementsHorizontal(
      baseWorkflow.nodes,
      baseWorkflow.edges
    )

    return {
      ...baseWorkflow,
      nodes: layoutedNodes,
      edges: layoutedEdges
    }
  }

  /**
   * Modify an existing workflow based on user chat input
   */
  static async modifyWorkflow(workflow: Workflow, modification: string): Promise<Workflow> {
    try {
      const modificationPrompt = `
You are FlowCraft AI. The user wants to modify their existing workflow based on this request: "${modification}"

Current workflow:
Name: ${workflow.name}
Description: ${workflow.description}
Nodes: ${JSON.stringify(workflow.nodes, null, 2)}

Analyze the modification request and return a JSON object with the updated workflow:
{
  "name": "Updated workflow name if changed",
  "description": "Updated description",
  "nodes": [/* updated nodes array with same structure */],
  "edges": [/* updated edges array */],
  "explanation": "Brief explanation of what was changed"
}

Possible modifications:
- Add new steps/nodes
- Remove existing steps
- Modify node configurations
- Change the order of steps
- Update descriptions or labels
- Add conditional logic

Keep the same node structure and IDs where possible. Only change what's necessary based on the user's request.
`

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: modificationPrompt },
          { role: "user", content: modification }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('No response from AI')

      const result = JSON.parse(content)
      
      // Update the workflow with the modifications
      const updatedWorkflow: Workflow = {
        ...workflow,
        name: result.name || workflow.name,
        description: result.description || workflow.description,
        nodes: result.nodes || workflow.nodes,
        edges: result.edges || workflow.edges,
        updatedAt: new Date()
      }

      return updatedWorkflow
    } catch (error) {
      console.error('Failed to modify workflow:', error)
      // Return original workflow if modification fails
      return workflow
    }
  }

  // Fallback methods for when AI calls fail
  private static fallbackDiscovery(prompt: string): AIDiscoveryResult {
    return {
      summary: `Basic workflow automation for: ${prompt}`,
      keyComponents: ['trigger', 'action'],
      identifiedTriggers: [{
        type: 'manual',
        service: 'manual',
        description: 'Manual trigger',
        configRequirements: [],
        dependencies: []
      }],
      identifiedActions: [{
        type: 'log',
        service: 'console',
        description: 'Log output',
        configRequirements: [],
        dependencies: []
      }],
      requiredIntegrations: [],
      unknownServices: [],
      complexity: 'simple',
      recommendedApproach: 'Create a simple workflow with manual trigger and basic actions',
      estimatedEffort: '1-2 hours'
    }
  }

  private static fallbackServiceResearch(service: string): ServiceResearch {
    return {
      serviceName: service,
      apiDocumentation: `Basic ${service} API integration`,
      baseUrl: `https://api.${service.toLowerCase()}.com`,
      authentication: 'api_key',
      endpoints: [],
      dataStructures: {},
      rateLimits: { requests: 1000, period: 'hour' }
    }
  }

  private static fallbackIntegration(service: ServiceResearch): GeneratedIntegration {
    return {
      serviceName: service.serviceName,
      className: `${service.serviceName}Integration`,
      code: `export class ${service.serviceName}Integration {\n  // Basic integration placeholder\n}`,
      dependencies: [],
      configSchema: [],
      methods: []
    }
  }

  private static fallbackEngineCode(complexity: string): string {
    return `
export class WorkflowEngine {
  private workflows = new Map()
  
  async execute(workflowId: string) {
    console.log('Executing workflow:', workflowId)
    // ${complexity} implementation
  }
}
`
  }

  private static fallbackBuilderCode(): string {
    return `
import React from 'react'
import ReactFlow from 'reactflow'

export const WorkflowBuilder: React.FC = () => {
  return <ReactFlow />
}
`
  }

  private static extractProjectName(prompt: string): string {
    const words = prompt.split(' ').slice(0, 3)
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Workflow'
  }

     // Additional helper methods would continue here...
   private static async convertToLegacyNodes(discovery: AIDiscoveryResult): Promise<WorkflowNode[]> {
     const nodes: WorkflowNode[] = []

     // Add trigger nodes (starting at origin for layout calculation)
     discovery.identifiedTriggers.forEach((trigger, index) => {
       nodes.push({
         id: `trigger-${index + 1}`,
         type: 'trigger',
         position: { x: 0, y: 0 }, // Will be repositioned by layout
         data: {
           label: trigger.type,
           description: trigger.description,
           config: {},
           service: trigger.service,
           operation: trigger.operation
         }
       })
     })

     // Add action nodes (starting at origin for layout calculation)
     discovery.identifiedActions.forEach((action, index) => {
       nodes.push({
         id: `action-${index + 1}`,
         type: 'action',
         position: { x: 0, y: 0 }, // Will be repositioned by layout
         data: {
           label: action.type,
           description: action.description,
           config: {},
           service: action.service,
           operation: action.operation
         }
       })
     })

     return nodes
   }

   private static async convertToLegacyEdges(discovery: AIDiscoveryResult): Promise<WorkflowEdge[]> {
     const edges: WorkflowEdge[] = []
     
     // Simple linear connections for now
     for (let i = 0; i < discovery.identifiedActions.length; i++) {
       const sourceId = i === 0 ? 'trigger-1' : `action-${i}`
       const targetId = `action-${i + 1}`
       
       edges.push({
         id: `${sourceId}-${targetId}`,
         source: sourceId,
         target: targetId,
         type: 'default'
       })
     }

     return edges
   }

   private static async generateLegacyCode(discovery: AIDiscoveryResult): Promise<string> {
     return `
// Generated Workflow Code - ${discovery.summary}
// Complexity: ${discovery.complexity}

const workflow = {
  name: "AI Generated Workflow",
  triggers: ${JSON.stringify(discovery.identifiedTriggers, null, 2)},
  actions: ${JSON.stringify(discovery.identifiedActions, null, 2)},
  complexity: "${discovery.complexity}"
};

// Workflow execution logic
async function executeWorkflow(triggerData: unknown) {
  try {
    console.log('Workflow started:', triggerData);
    
    // Process each action
    for (const action of workflow.actions) {
      await executeAction(action, triggerData);
    }
    
    console.log('Workflow completed successfully');
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}

async function executeAction(action: unknown, data: unknown) {
  console.log('Executing action:', action);
  // Implementation would depend on specific integrations
}
     `.trim()
   }

   private static fallbackAnalysis(prompt: string): AIAnalysis {
     return {
       blueprint: `Workflow for: ${prompt}`,
       assumptions: ['Basic implementation'],
       suggestedNodes: [],
       suggestedEdges: [],
       generatedCode: '// Fallback code',
       recommendations: ['Review and customize']
     }
   }

   private static async generateTriggerComponent(trigger: ComponentSpec): Promise<string> {
     return `// ${trigger.type} trigger component for ${trigger.service}`
   }

   private static async generateActionComponent(action: ComponentSpec): Promise<string> {
     return `// ${action.type} action component for ${action.service}`
   }

   private static async generateMonitoringDashboard(): Promise<string> {
     return `// Monitoring dashboard component`
   }

   private static async generateTestSuite(): Promise<TestCase[]> {
     return []
   }

   private static generateMonitoringConfig(complexity: string): MonitoringConfig {
     return {
       enabled: complexity !== 'simple',
       metrics: ['execution_time', 'success_rate'],
       alerting: [],
       dashboardConfig: {}
     }
   }

   private static generateProjectFiles(): GeneratedFile[] {
     return []
   }
}

// Maintain backward compatibility
export const AIService = FlowCraftAI 