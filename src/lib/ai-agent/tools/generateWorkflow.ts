/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamicStructuredTool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
import { 
  WorkflowGenerationInputSchema, 
  WorkflowGenerationOutputSchema,
  type WorkflowGenerationInput,
  type WorkflowGenerationOutput 
} from '../types'
import { promptTemplates } from '../config'
import { generateId } from '../../utils'

function getLLM() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.')
  }
  
  return new ChatOpenAI({ 
    model: 'gpt-4o', 
    temperature: 0.3,
    maxTokens: 4000,
    apiKey: apiKey,
    // @ts-expect-error - useResponsesApi property may not be in TS interface yet
    useResponsesApi: true
  })
}

// Server-safe layout function that doesn't depend on React Flow
function getServerSafeLayout(nodes: any[], edges: any[]) {
  const VERTICAL_SPACING = 200
  const START_Y = 50
  const CENTER_X = 250

  return {
    nodes: nodes.map((node, index) => ({
      ...node,
      position: {
        x: CENTER_X,
        y: START_Y + (index * VERTICAL_SPACING)
      }
    })),
    edges: edges.map(edge => ({
      ...edge,
      type: edge.type || 'default'
    }))
  }
}

// Local schema for OpenAI compatibility
const GenerateWorkflowSchema = z.object({
  discovery: z.any().describe('Discovery results from deep analysis'),
  integrations: z.array(z.object({
    serviceName: z.string(),
    className: z.string(),
    code: z.string()
  })).describe('Generated integrations'),
  preferences: z.object({
    layout: z.enum(['vertical', 'horizontal', 'auto']).default('vertical'),
    error_handling: z.enum(['basic', 'advanced', 'enterprise']).default('advanced'),
    monitoring: z.boolean().default(true),
    testing: z.boolean().default(true)
  }).default({
    layout: 'vertical',
    error_handling: 'advanced',
    monitoring: true,
    testing: true
  })
})

export const generateWorkflow = new DynamicStructuredTool({
  name: 'generateWorkflow',
  description: 'Creates complete workflow structures with nodes, edges, and project files based on discovery results and integrations.',
  schema: GenerateWorkflowSchema,
  
  func: async (input: WorkflowGenerationInput): Promise<string> => {
    try {
      const discoveryStr = JSON.stringify(input.discovery, null, 2)
      const integrationsStr = JSON.stringify(input.integrations, null, 2)
      const preferencesStr = input.preferences ? JSON.stringify(input.preferences, null, 2) : 'Default preferences'
      
      const prompt = promptTemplates.workflowPrompt
        .replace('{discovery}', discoveryStr)
        .replace('{integrations}', integrationsStr)
        .replace('{preferences}', preferencesStr)

      const systemMessage = `${promptTemplates.systemPrompt}

You are now using the generateWorkflow tool. Create a complete, production-ready workflow system and return ONLY valid JSON matching this schema:

{
  "workflow": {
    "id": "unique_workflow_id",
    "name": "Descriptive Workflow Name",
    "description": "Clear description of what this workflow does",
    "nodes": [
      {
        "id": "node_id",
        "type": "trigger|action|condition|loop|transform",
        "position": {"x": 250, "y": 50},
        "data": {
          "label": "Human readable label",
          "description": "What this node does",
          "service": "service_name",
          "operation": "specific_operation",
          "config": {
            "key": "value"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "edge_id",
        "source": "source_node_id",
        "target": "target_node_id",
        "type": "default|conditional|smoothstep",
        "label": "optional_label",
        "data": {
          "condition": "optional_condition"
        }
      }
    ],
    "status": "draft",
    "originalPrompt": "original_user_prompt",
    "generatedCode": "complete_typescript_implementation"
  },
  "project": {
    "id": "project_id",
    "name": "Project Name",
    "description": "Project description",
    "complexity": "simple|standard|advanced|enterprise",
    "components": [
      {
        "name": "Component Name",
        "type": "engine|builder|trigger|action|monitor|test",
        "dependencies": ["dependency1", "dependency2"],
        "code": "typescript_code",
        "filepath": "src/path/to/file.ts"
      }
    ],
    "integrations": [],
    "generatedFiles": [
      {
        "path": "file_path",
        "content": "file_content",
        "type": "typescript|javascript|json|yaml|markdown",
        "description": "File description"
      }
    ],
    "testSuite": [
      {
        "id": "test_id",
        "name": "Test Name",
        "description": "Test description",
        "type": "unit|integration|e2e",
        "code": "test_code",
        "expectedOutput": {}
      }
    ],
    "monitoring": {
      "enabled": true,
      "metrics": ["execution_time", "success_rate", "error_rate"],
      "alerting": [
        {
          "name": "Alert Name",
          "condition": "condition",
          "severity": "info|warning|error|critical",
          "channels": ["email", "slack"]
        }
      ],
      "dashboardConfig": {}
    }
  },
  "deploymentInstructions": ["step1", "step2"],
  "securityChecklist": ["security_item1", "security_item2"]
}

Requirements:
- Create realistic node positions for good visual layout
- Generate complete, runnable TypeScript code
- Include proper error handling and logging
- Add comprehensive test coverage
- Include security best practices
- Create deployment-ready configuration
- Use the integrations provided in the input
- Follow the discovery analysis recommendations
- Make the workflow immediately executable

Return ONLY the JSON object, no markdown formatting.`

      const response = await getLLM().invoke([
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ])

      // Clean and parse the response
      let content = response.content as string
      content = content.trim()
      
      // Remove markdown code blocks if present
      if (content.startsWith('```json')) {
        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (content.startsWith('```')) {
        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // Parse and validate the response
      const parsed = JSON.parse(content)
      
      // Apply server-safe layout to nodes and edges if needed
      if (parsed.workflow && parsed.workflow.nodes && parsed.workflow.edges) {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getServerSafeLayout(
          parsed.workflow.nodes,
          parsed.workflow.edges
        )
        
        parsed.workflow.nodes = layoutedNodes.map((node: any) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        }))
        
        parsed.workflow.edges = layoutedEdges.map((edge: any) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'default',
          label: edge.label,
          data: edge.data
        }))
      }

      // Ensure required fields are present
      if (parsed.workflow) {
        parsed.workflow.id = parsed.workflow.id || generateId()
        parsed.workflow.status = parsed.workflow.status || 'draft'
        parsed.workflow.createdAt = new Date().toISOString()
        parsed.workflow.updatedAt = new Date().toISOString()
      }

      if (parsed.project) {
        parsed.project.id = parsed.project.id || parsed.workflow?.id || generateId()
      }

      const validated = WorkflowGenerationOutputSchema.parse(parsed)
      
      return JSON.stringify(validated, null, 2)
    } catch (error) {
      console.error('Workflow generation failed:', error)
      
      // Create a fallback workflow based on the discovery data
      const discovery = input.discovery
      const workflowId = generateId()
      
      const fallbackWorkflow: WorkflowGenerationOutput = {
        workflow: {
          id: workflowId,
          name: (discovery as any)?.summary ? `${(discovery as any).summary} Workflow` : 'Generated Workflow',
          description: (discovery as any)?.summary || 'Automated workflow generated from user requirements',
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              position: { x: 250, y: 50 },
              data: {
                label: 'Start Workflow',
                description: 'Trigger to start the automation',
                service: 'manual',
                operation: 'start',
                config: {}
              }
            },
            {
              id: 'action-1',
              type: 'action',
              position: { x: 250, y: 200 },
              data: {
                label: 'Execute Action',
                description: 'Main workflow action',
                service: 'generic',
                operation: 'execute',
                config: {}
              }
            }
          ],
          edges: [
            {
              id: 'edge-1',
              source: 'trigger-1',
              target: 'action-1',
              type: 'default'
            }
          ],
          status: 'draft',
          originalPrompt: (discovery as any)?.summary || 'Workflow generation request',
          generatedCode: `// Generated workflow implementation
export class GeneratedWorkflow {
  async execute() {
    console.log('Executing workflow...')
    // Implementation needed
  }
}`
        },
        project: {
          id: workflowId,
          name: 'Generated Project',
          description: 'Auto-generated workflow project',
          complexity: 'simple',
          components: [
            {
              name: 'Workflow Engine',
              type: 'engine',
              dependencies: [],
              code: '// Workflow engine implementation needed',
              filepath: 'src/workflow-engine.ts'
            }
          ],
          integrations: input.integrations || [],
          generatedFiles: [
            {
              path: 'package.json',
              content: JSON.stringify({
                name: 'generated-workflow',
                version: '1.0.0',
                dependencies: {}
              }, null, 2),
              type: 'json',
              description: 'Project package configuration'
            }
          ],
          testSuite: [
            {
              id: 'test-1',
              name: 'Basic Workflow Test',
              description: 'Test workflow execution',
              type: 'unit',
              code: '// Test implementation needed',
              expectedOutput: { status: 'success' }
            }
          ],
          monitoring: {
            enabled: true,
            metrics: ['execution_time', 'success_rate'],
            alerting: [],
            dashboardConfig: {}
          }
        },
        deploymentInstructions: [
          'Install dependencies with npm install',
          'Configure environment variables',
          'Run tests with npm test',
          'Deploy to your preferred platform'
        ],
        securityChecklist: [
          'Secure API keys in environment variables',
          'Validate all input data',
          'Implement proper error handling',
          'Add rate limiting for external APIs'
        ]
      }
      
      return JSON.stringify(fallbackWorkflow, null, 2)
    }
  }
}) 