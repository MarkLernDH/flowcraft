const { createOptimizedAgent } = require('./src/lib/ai-agent/optimized-agent.ts');

async function testAgent() {
  try {
    console.log('🧪 Testing optimized agent...');
    
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    console.log('API Key:', apiKey ? 'Found' : 'Not found');
    
    if (!apiKey) {
      console.error('❌ No API key found');
      return;
    }
    
    const agent = createOptimizedAgent(apiKey);
    console.log('✅ Agent created');
    
    const stats = agent.getStats();
    console.log('📊 Agent stats:', stats);
    
    console.log('🚀 Testing workflow generation...');
    const result = await agent.generateWorkflow('Create a simple test workflow', {
      onProgress: (update) => {
        console.log(`Progress: ${update.phase} - ${update.message}`);
      }
    });
    
    console.log('✅ Result:', result);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAgent(); 