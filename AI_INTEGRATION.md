# FlowCraft AI Integration Guide

## 🧠 AI-Powered Workflow Generation

FlowCraft now includes a comprehensive AI system that can generate complete workflow automation systems from natural language descriptions. This guide explains how to set up and use the AI features.

## 🚀 Quick Setup

### 1. Get an OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key

### 2. Configure Environment
Create a `.env.local` file in the project root:
```bash
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Start the Application
```bash
npm run dev
```

## 🎯 AI Features

### Unified Interface with Two Generation Modes

FlowCraft now features a streamlined interface with an intelligent mode toggle:

#### Quick Builder (Standard)
- Fast workflow creation with immediate results
- Uses pattern matching and templates
- Good for common automation scenarios
- Works without API keys (fallback mode)
- Template-based component generation

#### AI Generator (Enhanced)
- Complete system generation with AI
- Dynamic component creation based on requirements
- Custom integration generation for unknown services
- Real-time service research and API analysis
- Advanced complexity assessment and optimization
- Requires OpenAI API key for full functionality

### Interface Features
- **Mode Toggle**: Seamlessly switch between Quick Builder and AI Generator
- **Adaptive UI**: Button text and placeholders change based on selected mode
- **Unified Experience**: Single prompt input adapts to the selected generation mode
- **Smart Defaults**: Automatically handles mode-specific generation workflows

## 🔧 AI System Architecture

### Phase 1: Discovery & Planning
```typescript
const discovery = await FlowCraftAI.discoverAndPlan(prompt)
```
- Analyzes user requirements
- Identifies triggers, actions, and services
- Determines complexity level
- Creates implementation plan

### Phase 2: Service Research
```typescript
const research = await FlowCraftAI.researchUnknownServices(unknownServices)
```
- Researches unknown APIs and services
- Extracts authentication methods
- Documents endpoints and data structures
- Analyzes rate limits and constraints

### Phase 3: Integration Generation
```typescript
const integrations = await FlowCraftAI.generateIntegrations(researchedServices)
```
- Creates TypeScript integration classes
- Implements error handling and retry logic
- Adds circuit breakers and rate limiting
- Generates proper type definitions

### Phase 4: Complete System Generation
```typescript
const project = await FlowCraftAI.generateWorkflowProject(discovery, integrations, prompt)
```
- Builds workflow engine
- Creates visual builder components
- Generates monitoring dashboards
- Includes comprehensive testing suite

## 📊 Complexity Levels

The AI automatically determines the appropriate complexity level:

### Simple
- Basic execution queue
- Status tracking
- Simple error handling
- Minimal UI components

### Standard
- Parallel execution support
- State management
- Retry mechanisms
- Standard drag-and-drop interface

### Advanced
- Complex orchestration
- Circuit breakers
- Performance monitoring
- Full canvas controls with debug tools

### Enterprise
- Audit trails and rollback capabilities
- High availability features
- Advanced monitoring and alerting
- Collaboration features

## 🛠 Generated Components

### Core Engine
```typescript
// Generated workflow engine with appropriate complexity
export class WorkflowEngine {
  async execute(workflowId: string) {
    // Implementation varies by complexity level
  }
}
```

### Visual Builder
```typescript
// React component for workflow visualization
export const WorkflowBuilder: React.FC = () => {
  // ReactFlow-based interface
}
```

### Custom Integrations
```typescript
// Service-specific integration classes
export class ServiceNameIntegration {
  async performAction(data: ActionData): Promise<Result> {
    // Generated with proper error handling
  }
}
```

## 🔍 AI Prompting Best Practices

### Effective Prompts
✅ **Good**: "Create a workflow that monitors our GitHub repository for new issues, analyzes them with sentiment analysis, and creates Slack notifications for urgent issues while logging everything to our database."

✅ **Good**: "Build an e-commerce order processing system that validates payments with Stripe, updates inventory in our PostgreSQL database, sends confirmation emails via SendGrid, and creates shipping labels through ShipStation."

### Less Effective Prompts
❌ **Avoid**: "Make a workflow"
❌ **Avoid**: "Automate stuff"
❌ **Avoid**: "Connect APIs"

### Prompt Structure Tips
1. **Start with the trigger**: "When X happens..."
2. **Describe the process**: "Then do Y and Z..."
3. **Specify services**: "Using Slack, GitHub, PostgreSQL..."
4. **Include constraints**: "Only during business hours..."
5. **Mention error handling**: "If it fails, notify admin..."

## 🔧 Configuration Options

### AI Service Configuration
```typescript
// src/lib/config.ts
export const config = {
  openai: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'your-openai-api-key-here',
    model: 'gpt-4',
    maxTokens: 3000,
    temperature: 0.2
  },
  
  features: {
    webSearch: false, // Set to true when web search API is configured
    realTimeCollaboration: false, // Future feature
    advancedMonitoring: true
  },
  
  ui: {
    showAIInsights: true,
    enableCodeGeneration: true,
    complexityLevels: ['simple', 'standard', 'advanced', 'enterprise'] as const
  },
  
  development: {
    useMockData: process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    enableDebugLogs: process.env.NODE_ENV === 'development'
  }
}

export type ComplexityLevel = typeof config.ui.complexityLevels[number]
```

### Development Mode
When no API key is provided, FlowCraft automatically falls back to:
- Pattern-based analysis
- Template-driven generation
- Mock service research
- Simplified component creation

## 🚀 Advanced Features

### Web Search Integration (Future)
```typescript
// When enabled, AI can research unknown services
const research = await FlowCraftAI.researchWithWebSearch(unknownServices)
```

### Real-time Collaboration (Planned)
- Live workflow editing
- Conflict resolution
- Version history
- Team permissions

### Monitoring & Analytics
- Execution tracking
- Performance metrics
- Error analysis
- Usage patterns

## 🔒 Security Considerations

### API Key Safety
- Never commit API keys to version control
- Use environment variables
- Consider server-side API routes for production
- Implement rate limiting

### Generated Code Review
- Always review AI-generated code
- Test integrations thoroughly
- Validate security practices
- Monitor for sensitive data exposure

## 🐛 Troubleshooting

### Common Issues

#### "No API Key" Warning
- Add `NEXT_PUBLIC_OPENAI_API_KEY` to `.env.local`
- Restart the development server
- Check API key validity on OpenAI platform

#### Generation Failures
- Check internet connectivity
- Verify API key permissions
- Review OpenAI usage limits
- Check browser console for errors

#### Fallback Mode
- Application works without API keys
- Uses pattern matching instead of AI
- Limited to common workflow patterns
- No custom integration generation

### Debug Mode
Enable debug logging:
```typescript
// src/lib/config.ts
development: {
  enableDebugLogs: true
}
```

## 📈 Performance Optimization

### API Usage
- Implement caching for repeated requests
- Use appropriate temperature settings
- Optimize prompt length
- Consider batch processing

### Generated Code
- Review for efficiency
- Implement proper error boundaries
- Add performance monitoring
- Use lazy loading where appropriate

## 📊 Current Implementation Status

### ✅ Completed Features
- **Unified interface** with intelligent mode switching
- **AI-powered discovery** and planning system
- **Service research** capabilities for unknown APIs
- **Integration generation** with TypeScript support
- **Complete project generation** with all components
- **Fallback mode** for operation without API keys
- **Adaptive complexity** assessment and optimization
- **Visual workflow builder** with ReactFlow integration
- **Error handling** and retry mechanisms built-in

### 🚧 In Development
- Enhanced service research with better API discovery
- Improved integration code generation templates
- Advanced monitoring and analytics features
- Performance optimization for large workflows

## 🔮 Future Enhancements

### Planned Features
- Web search integration for real-time API research
- Multi-model AI support (Claude, Gemini)
- Workflow optimization suggestions
- Automated testing generation
- Performance benchmarking
- Custom model fine-tuning
- Real-time collaboration features
- Advanced debugging and profiling tools

### Community Contributions
- Custom integration templates
- Workflow pattern library
- AI prompt optimization
- Performance improvements
- Documentation and examples

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [React Flow Documentation](https://reactflow.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Best Practices](https://typescript-eslint.io/)

## 🤝 Contributing

To contribute to the AI features:
1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

---

**Note**: The AI features are designed to be a starting point. Always review and customize generated workflows for your specific needs. 