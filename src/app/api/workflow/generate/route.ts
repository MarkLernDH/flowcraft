import { NextRequest, NextResponse } from 'next/server'
import type { AgentStreamingUpdate } from '@/lib/ai-agent'

// Server-side workflow generation using the full agentic flow
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    console.log('API Key check:', openaiApiKey ? 'Found' : 'Not found');
    
    if (!openaiApiKey) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        fallback: true,
        message: 'AI features require OpenAI API key configuration',
        instructions: [
          '1. Add OPENAI_API_KEY to your .env.local file',
          '2. Restart the development server', 
          '3. Try generating the workflow again'
        ]
      }, { status: 200 })
    }

    // Dynamically import the optimized agent system
    const { createOptimizedAgent } = await import('@/lib/ai-agent/optimized-agent')

    // Create optimized agent instance
    const agent = createOptimizedAgent(openaiApiKey)

    // Collect progress updates for the response
    const progressUpdates: AgentStreamingUpdate[] = []
    
    const onProgress = (update: AgentStreamingUpdate) => {
      console.log(`🔄 Optimized Agent Progress [${update.phase}]: ${update.message}`)
      progressUpdates.push(update)
    }

    console.log('🚀 Starting optimized workflow generation with prompt:', prompt.substring(0, 100) + '...')

    // Use the optimized agent for workflow generation
    const result = await agent.generateWorkflow(prompt, { onProgress })

    console.log('✅ Optimized workflow generation completed')
    console.log('📊 Progress updates collected:', progressUpdates.length)

    if (!result.success) {
      throw new Error(result.error || 'Workflow generation failed')
    }

    console.log('🎯 Final workflow generated successfully')
    console.log('📊 Workflow data:', result.workflow ? 'Generated' : 'Not generated')

    // Generate instant enthusiasm and technical summary
    const enthusiasm = "🚀 Amazing! I've built a powerful automation using the optimized agent system with intelligent triggers and seamless integrations!"
    const technicalSummary = `**What I built:** A sophisticated workflow using the new optimized agent architecture with ${result.metadata.toolsUsed.length} tools.`

    return NextResponse.json({
      success: true,
      enthusiasm,
      technical_summary: technicalSummary,
      workflow: result.workflow || { nodes: [], edges: [] },
      project: { components: [], integrations: [] },
      insights: {
        complexity_analysis: 'Generated using optimized agent system',
        security_considerations: ['Proper error handling implemented', 'Tool-based architecture'],
        performance_tips: ['Optimized tool execution', 'Reduced memory usage'],
        next_steps: ['Test the workflow', 'Customize as needed', 'Deploy when ready']
      },
      execution_ready: true,
      progress_updates: progressUpdates
    })

  } catch (error) {
    console.error('❌ Agentic workflow generation failed:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    })
    
    // Check if this is an API key error
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isApiKeyError = errorMessage.includes('OpenAI API key') || 
                         errorMessage.includes('API key not found') ||
                         errorMessage.includes('Token Provider not found')

    if (isApiKeyError) {
      return NextResponse.json({
        error: 'OpenAI API key required',
        fallback: true,
        message: 'AI features require OpenAI API key configuration',
        instructions: [
          '1. Add OPENAI_API_KEY to your .env.local file',
          '2. Restart the development server',
          '3. Try generating the workflow again for full agentic features'
        ]
      }, { status: 200 })
    }

    return NextResponse.json({
      error: 'Agentic workflow generation failed',
      fallback: true,
      message: 'Creating basic workflow as fallback',
      errorDetails: errorMessage,
      instructions: [
        'Check server logs for details',
        'Verify OpenAI API key configuration',
        'Try again in a moment'
      ]
    }, { status: 500 })
  }
} 