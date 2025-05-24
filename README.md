# FlowCraft 🚀

**Build Any Workflow With Just a Prompt**

FlowCraft is an intelligent workflow automation platform that transforms natural language descriptions into production-ready workflows. Using advanced AI and professional layouting algorithms, create complex automation flows in seconds.

![FlowCraft Demo](https://img.shields.io/badge/Status-Active%20Development-green)
![Next.js](https://img.shields.io/badge/Next.js-15.1.8-black)
![React Flow](https://img.shields.io/badge/React%20Flow-11.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## ✨ Features

### 🤖 AI-Powered Workflow Generation
- **Natural Language Processing**: Describe workflows in plain English
- **Intelligent Analysis**: AI understands complex automation requirements
- **Smart Node Creation**: Automatically generates triggers, actions, and conditions
- **Real-time Streaming**: See your workflow build as AI processes your request

### 🎨 Professional Visual Editor
- **Drag-and-Drop Interface**: Built with React Flow for smooth interactions
- **Automatic Layout**: Uses Dagre algorithm for perfect node positioning
- **Custom Node Types**: Specialized components for triggers, actions, conditions
- **Real-time Chat**: Modify workflows through conversational AI interface

### 🔧 Advanced Workflow Features
- **Multi-Trigger Support**: Webhooks, schedules, emails, file changes
- **Complex Actions**: Data processing, notifications, API calls, storage
- **Conditional Logic**: Smart branching and decision trees
- **Error Handling**: Built-in retry mechanisms and failure paths

### 💼 Enterprise Ready
- **TypeScript First**: Full type safety and IntelliSense support
- **Modular Architecture**: Clean separation of concerns
- **Performance Optimized**: Efficient rendering and state management
- **Extensible Design**: Easy to add new integrations and node types

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flowcraft.git
cd flowcraft

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenAI API key to .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

## 🎯 Usage

### Creating Your First Workflow

1. **Describe Your Automation**: 
   ```
   "Create a workflow that monitors my email for invoices and automatically saves them to Google Drive"
   ```

2. **Watch AI Generate**: FlowCraft analyzes your request and builds the workflow in real-time

3. **Customize & Configure**: Click on nodes to configure settings, or chat with AI to make changes

4. **Test & Deploy**: Use the Test Run button to validate your workflow

### Example Prompts

```
"Create a daily data pipeline that collects data from our API, processes it, and stores results in a database"

"Build a customer onboarding workflow that sends welcome emails and creates accounts"

"Set up monitoring that checks server health and alerts the team if issues are detected"
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Workflow Engine**: React Flow with Dagre layouting
- **AI Integration**: OpenAI GPT-4 API
- **Styling**: Tailwind CSS with custom components
- **State Management**: React hooks and context

### Project Structure
```
flowcraft/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components
│   │   └── workflow/       # Workflow-specific components
│   ├── lib/                # Utilities and services
│   │   ├── ai-service.ts   # AI integration logic
│   │   ├── layout.ts       # Dagre layouting utilities
│   │   └── utils.ts        # Helper functions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🔧 Development

### Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Adding New Node Types

1. Create a new component in `src/components/workflow/nodes/`
2. Add the node type to `src/types/workflow.ts`
3. Register it in `src/components/workflow/workflow-builder.tsx`
4. Update the AI service to generate the new node type

### Extending AI Capabilities

The AI service is modular and extensible. Key areas for enhancement:

- **Discovery & Planning** (`discoverAndPlan`): Improve requirement analysis
- **Service Research** (`researchUnknownServices`): Add new integrations
- **Code Generation** (`generateIntegrations`): Create custom components

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📋 Roadmap

### Phase 1: Core Platform ✅
- [x] AI-powered workflow generation
- [x] Visual workflow editor
- [x] Real-time chat interface
- [x] Professional layouting with Dagre

### Phase 2: Integrations 🚧
- [ ] Pre-built integration library
- [ ] Custom integration builder
- [ ] API authentication management
- [ ] Webhook management

### Phase 3: Enterprise Features 📅
- [ ] Team collaboration
- [ ] Version control for workflows
- [ ] Advanced monitoring & analytics
- [ ] Workflow templates marketplace

## 🐛 Known Issues

- Edge routing for complex workflows needs optimization
- Some integrations require additional configuration
- Performance with large workflows (100+ nodes) needs improvement

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Flow** - Excellent workflow visualization library
- **Dagre** - Professional graph layouting algorithm
- **OpenAI** - Powerful AI capabilities
- **Next.js Team** - Amazing React framework
- **Tailwind CSS** - Beautiful utility-first styling

## 📞 Support

- 📧 Email: support@flowcraft.dev
- 💬 Discord: [Join our community](https://discord.gg/flowcraft)
- 📖 Documentation: [docs.flowcraft.dev](https://docs.flowcraft.dev)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/flowcraft/issues)

---

**Built with ❤️ by the FlowCraft team**

*Transform your ideas into automated workflows - one prompt at a time.*
