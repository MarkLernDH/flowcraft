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