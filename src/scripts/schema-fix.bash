#!/bin/bash
# Schema Fix Script for FlowCraft Agent V2
# This script fixes the OpenAI API schema validation errors

cd /Users/marklerner/flowcraft-straight-prompt/flowcraft

echo "🔧 Fixing OpenAI API schema validation errors..."

# Create backup of current tool files
echo "📦 Creating backup of current tool files..."
mkdir -p backup-tool-files-$(date +%Y%m%d)
cp src/lib/ai-agent/tools/*.ts backup-tool-files-$(date +%Y%m%d)/

# Fix 1: classifyIntent.ts
echo "🛠️  Fixing classifyIntent.ts schema..."
cat > temp_schema_fix.ts << 'EOF'
// FIXED: Intent Classification Schema (OpenAI compatible)
export const IntentClassificationInputSchema = z.object({
  userMessage: z.string().describe('The user message to classify'),
  context: z.object({
    hasExistingWorkflow: z.boolean().default(false),
    conversationHistory: z.array(z.string()).default([]),
    userPreferences: z.record(z.string(), z.any()).default({})
  }).default({
    hasExistingWorkflow: false,
    conversationHistory: [],
    userPreferences: {}
  })
})
EOF

# Replace the schema in classifyIntent.ts
sed -i.bak '/export const IntentClassificationInputSchema/,/})/c\
export const IntentClassificationInputSchema = z.object({\
  userMessage: z.string().describe("The user message to classify"),\
  context: z.object({\
    hasExistingWorkflow: z.boolean().default(false),\
    conversationHistory: z.array(z.string()).default([]),\
    userPreferences: z.record(z.string(), z.any()).default({})\
  }).default({\
    hasExistingWorkflow: false,\
    conversationHistory: [],\
    userPreferences: {}\
  })\
})' src/lib/ai-agent/tools/classifyIntent.ts

# Fix 2: performDeepDiscovery.ts  
echo "🛠️  Fixing performDeepDiscovery.ts schema..."
sed -i.bak '/export const DeepDiscoveryInputSchema/,/})/c\
export const DeepDiscoveryInputSchema = z.object({\
  prompt: z.string().describe("The user automation request to analyze"),\
  context: z.object({\
    existing_workflows: z.array(z.string()).default([]),\
    user_preferences: z.record(z.string(), z.any()).default({}),\
    constraints: z.array(z.string()).default([])\
  }).default({\
    existing_workflows: [],\
    user_preferences: {},\
    constraints: []\
  })\
})' src/lib/ai-agent/tools/performDeepDiscovery.ts

# Fix 3: researchIntegrations.ts
echo "🛠️  Fixing researchIntegrations.ts schema..."
sed -i.bak '/export const IntegrationResearchInputSchema/,/})/c\
export const IntegrationResearchInputSchema = z.object({\
  services: z.array(z.string()).describe("List of services to research"),\
  requirements: z.object({\
    authentication_types: z.array(z.string()).default([]),\
    required_operations: z.array(z.string()).default([]),\
    data_formats: z.array(z.string()).default([])\
  }).default({\
    authentication_types: [],\
    required_operations: [],\
    data_formats: []\
  })\
})' src/lib/ai-agent/tools/researchIntegrations.ts

# Fix 4: generateWorkflow.ts
echo "🛠️  Fixing generateWorkflow.ts schema..."
sed -i.bak '/export const WorkflowGenerationInputSchema/,/})/c\
export const WorkflowGenerationInputSchema = z.object({\
  discovery: z.any().describe("Discovery results from deep analysis"),\
  integrations: z.array(z.any()).describe("Generated integrations"),\
  preferences: z.object({\
    layout: z.enum(["vertical", "horizontal", "auto"]).default("vertical"),\
    error_handling: z.enum(["basic", "advanced", "enterprise"]).default("advanced"),\
    monitoring: z.boolean().default(true),\
    testing: z.boolean().default(true)\
  }).default({\
    layout: "vertical",\
    error_handling: "advanced",\
    monitoring: true,\
    testing: true\
  })\
})' src/lib/ai-agent/tools/generateWorkflow.ts

# Clean up backup files created by sed
rm src/lib/ai-agent/tools/*.bak

echo "✅ Schema fixes applied successfully!"
echo ""
echo "🧪 Testing the fixes..."
echo "   Run: npm run dev"
echo "   Try generating a workflow to test"
echo ""
echo "📊 Expected results:"
echo "   ✅ No more 'optional() without nullable()' warnings"
echo "   ✅ No more 'array schema missing items' errors"
echo "   ✅ Workflow generation should work properly"
echo ""
echo "🔄 If you need to rollback:"
echo "   cp backup-tool-files-$(date +%Y%m%d)/*.ts src/lib/ai-agent/tools/"