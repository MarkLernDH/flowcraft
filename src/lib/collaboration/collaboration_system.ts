import OpenAI from 'openai'
import { Workflow, WorkflowNode } from '@/types/workflow'

export interface CollaborationSession {
  id: string
  workflowId: string
  participants: Participant[]
  aiPersona: AIPersona
  conversationHistory: ConversationEntry[]
  currentFocus: WorkflowNode | null
  goalTracking: GoalTracker
  conflictResolution: ConflictTracker
}

export interface Participant {
  id: string
  name: string
  role: 'creator' | 'collaborator' | 'reviewer'
  expertiseAreas: string[]
  preferredCommunicationStyle: 'detailed' | 'concise' | 'visual'
  lastActive: Date
}

export interface AIPersona {
  name: string
  role: 'facilitator' | 'expert' | 'teacher' | 'optimizer'
  personality: 'encouraging' | 'analytical' | 'creative' | 'practical'
  adaptationLevel: number // How much the AI has learned about this team
}

export interface ConversationEntry {
  id: string
  timestamp: Date
  author: string // 'ai' or participant id
  content: string
  type: 'suggestion' | 'question' | 'modification' | 'approval' | 'concern'
  workflowReference?: {
    nodeId?: string
    edgeId?: string
    property?: string
  }
  reactions: Reaction[]
  aiConfidence?: number
}

interface Reaction {
  participantId: string
  type: 'like' | 'dislike' | 'question' | 'implementation'
  timestamp: Date
}

export interface GoalTracker {
  originalGoal: string
  currentGoals: string[]
  completedMilestones: string[]
  blockers: string[]
  successMetrics: {
    functionalityComplete: number
    userSatisfaction: number
    technicalQuality: number
  }
}

export interface ConflictTracker {
  activeConflicts: Array<{
    id: string
    type: 'technical' | 'design' | 'scope'
    description: string
    participants: string[]
    suggestedResolutions: string[]
    impact: 'low' | 'medium' | 'high'
  }>
  resolvedConflicts: Array<{
    id: string
    resolution: string
    resolvedBy: string
    resolvedAt: Date
  }>
}

export interface FacilitationResult {
  aiResponse: string
  suggestedActions: string[]
  workflowModifications?: Partial<Workflow>
  conflictAlerts?: string[]
  goalUpdates?: string[]
}

interface OnboardingResult {
  onboardingMessage: string
  contextSummary: string
  suggestedRole: string
}

interface ConflictResolutionResult {
  evaluationResult: string
  alternativeOptions: string[]
  consensusCheck: string
  implementationSteps: string[]
}

interface NextStepsResult {
  prioritizedTasks: Array<{
    task: string
    priority: 'high' | 'medium' | 'low'
    estimatedTime: string
    assignedTo?: string
    reasoning: string
  }>
  blockers: string[]
  opportunities: string[]
}

interface ConversationContext {
  recentTopics: string[]
  participantSentiment: 'positive' | 'neutral' | 'negative'
  focusAreas: string[]
  urgency: 'low' | 'medium' | 'high'
  teamDynamics: {
    collaborationHealth: number
    communicationEfficiency: number
    conflictLevel: number
  }
}

interface FacilitationResponse {
  response: string
  suggestedActions: string[]
  workflowModifications: Partial<Workflow>
  priorityLevel: 'low' | 'medium' | 'high'
  nextSteps: string[]
}

export class AICollaborationFacilitator {
  private openai: OpenAI
  private sessions: Map<string, CollaborationSession> = new Map()

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    })
  }

  async startCollaborationSession(
    workflowId: string, 
    creator: Participant,
    initialGoal: string
  ): Promise<CollaborationSession> {
    const sessionId = this.generateSessionId()
    
    // Determine optimal AI persona based on goal and creator
    const aiPersona = await this.selectOptimalAIPersona(initialGoal, creator)
    
    const session: CollaborationSession = {
      id: sessionId,
      workflowId,
      participants: [creator],
      aiPersona,
      conversationHistory: [],
      currentFocus: null,
      goalTracking: {
        originalGoal: initialGoal,
        currentGoals: [initialGoal],
        completedMilestones: [],
        blockers: [],
        successMetrics: {
          functionalityComplete: 0,
          userSatisfaction: 0,
          technicalQuality: 0
        }
      },
      conflictResolution: {
        activeConflicts: [],
        resolvedConflicts: []
      }
    }

    this.sessions.set(sessionId, session)
    
    // Generate welcoming AI introduction
    const welcomeMessage = await this.generateWelcomeMessage(session)
    this.addConversationEntry(session, 'ai', welcomeMessage, 'suggestion')
    
    return session
  }

  async facilitateConversation(
    sessionId: string,
    participantId: string,
    message: string,
    workflow: Workflow
  ): Promise<FacilitationResult> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    // Add participant message to history
    this.addConversationEntry(session, participantId, message, 'question')

    // Enhanced conversation context analysis
    const context = await this.analyzeConversationContext(session, workflow)
    
    // Generate AI response based on persona and context
    const facilitationPrompt = this.buildFacilitationPrompt(session, message, workflow, context)
    
    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: facilitationPrompt,
        instructions: this.buildSystemPrompt(session.aiPersona, context),
        temperature: 0.4,
        max_output_tokens: 2000
      })

      const aiResponse = response.output_text || 
                        this.extractContentFromResponse(response.output) || 
                        ''
      const analysis = await this.parseAIFacilitationResponse(aiResponse)
      
      // Update session with AI response
      this.addConversationEntry(session, 'ai', analysis.response, 'suggestion')
      
      // Enhanced conflict detection
      const conflictAlerts = await this.detectPotentialConflicts(session, workflow, context)
      
      // Enhanced goal tracking updates
      const goalUpdates = await this.updateGoalTracking(session, analysis, context)
      
      return {
        aiResponse: analysis.response,
        suggestedActions: analysis.suggestedActions,
        workflowModifications: analysis.workflowModifications,
        conflictAlerts,
        goalUpdates
      }
    } catch (error) {
      console.error('Facilitation failed:', error)
      return this.generateFallbackResponse(message)
    }
  }

  async addCollaborator(
    sessionId: string,
    newParticipant: Participant
  ): Promise<OnboardingResult> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    // Add participant to session
    session.participants.push(newParticipant)

    // Generate contextual onboarding
    const onboardingPrompt = `
    New team member joining workflow collaboration:
    
    Participant: ${newParticipant.name}
    Role: ${newParticipant.role}
    Expertise: ${newParticipant.expertiseAreas.join(', ')}
    Communication Style: ${newParticipant.preferredCommunicationStyle}
    
    Current project context:
    Goal: ${session.goalTracking.originalGoal}
    Current participants: ${session.participants.map(p => `${p.name} (${p.role})`).join(', ')}
    Recent conversation: ${session.conversationHistory.slice(-3).map(entry => 
      `${entry.author}: ${entry.content}`
    ).join('\n')}
    
    Generate a personalized onboarding message that:
    1. Welcomes them appropriately for their communication style
    2. Summarizes current project status
    3. Suggests how they can best contribute
    4. Identifies potential collaboration opportunities
    `

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: onboardingPrompt,
        temperature: 0.3,
        max_output_tokens: 1000
      })

      const content = response.output_text || 
                     this.extractContentFromResponse(response.output) || 
                     ''
      const result = this.parseOnboardingResponse(content)
      
      // Add onboarding message to conversation
      this.addConversationEntry(session, 'ai', result.onboardingMessage, 'suggestion')
      
      return result
    } catch (error) {
      console.error('Onboarding failed:', error)
      return {
        onboardingMessage: `Welcome ${newParticipant.name}! Your expertise in ${newParticipant.expertiseAreas.join(', ')} will be valuable for this workflow project.`,
        contextSummary: 'Working on workflow automation project with focus on integration and optimization.',
        suggestedRole: 'technical contributor'
      }
    }
  }

  async resolveConflict(
    sessionId: string,
    conflictId: string,
    proposedResolution: string,
    proposerId: string
  ): Promise<ConflictResolutionResult> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    const conflict = session.conflictResolution.activeConflicts.find(c => c.id === conflictId)
    if (!conflict) throw new Error('Conflict not found')

    const proposer = session.participants.find(p => p.id === proposerId)
    if (!proposer) throw new Error('Proposer not found')

    const resolutionPrompt = `
    Conflict Resolution Analysis:
    
    Original Conflict: ${conflict.description}
    Conflicting Parties: ${conflict.participants.map(p => 
      session.participants.find(p => p.id === p.id)?.name || 'Unknown'
    ).join(' vs ')}
    
    Proposed Resolution: "${proposedResolution}"
    Proposed by: ${proposer.name} (${proposer.role})
    
    Team Context:
    ${session.participants.map(p => 
      `- ${p.name}: ${p.role}, expertise in ${p.expertiseAreas.join(', ')}`
    ).join('\n')}
    
    Evaluate this resolution considering:
    1. Technical feasibility and implications
    2. Team dynamics and individual perspectives
    3. Project goals and constraints
    4. Potential unintended consequences
    5. Alternative approaches
    
    Provide:
    - Clear recommendation (implement/modify/reject)
    - Alternative options if needed
    - Consensus-building suggestions
    - Implementation steps
    `

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: resolutionPrompt,
        temperature: 0.2,
        max_output_tokens: 1500
      })

      const content = response.output_text || 
                     this.extractContentFromResponse(response.output) || 
                     ''
      const result = this.parseConflictResolutionResponse(content)
      
      // If resolution is strongly recommended, move conflict to resolved
      if (result.evaluationResult.toLowerCase().includes('recommend') && 
          result.evaluationResult.toLowerCase().includes('implement')) {
        this.resolveConflictInSession(session, conflictId, proposedResolution, proposerId)
      }
      
      return result
    } catch (error) {
      console.error('Conflict resolution analysis failed:', error)
      return {
        evaluationResult: 'Unable to evaluate resolution automatically. Manual review recommended.',
        alternativeOptions: ['Schedule team discussion', 'Seek additional input', 'Break down into smaller decisions'],
        consensusCheck: 'Please discuss as a team to ensure all perspectives are considered',
        implementationSteps: ['Review proposal manually', 'Gather team feedback', 'Make decision collectively']
      }
    }
  }

  async suggestNextSteps(
    sessionId: string,
    workflow: Workflow
  ): Promise<NextStepsResult> {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    // Enhanced context analysis for better suggestions
    const context = await this.analyzeConversationContext(session, workflow)

    const analysisPrompt = `
    Analyze the current workflow collaboration state and suggest prioritized next steps with enhanced intelligence:
    
    Workflow Analysis:
    ${JSON.stringify(workflow, null, 2)}
    
    Team Composition and Expertise:
    ${session.participants.map(p => 
      `${p.name} (${p.role}) - Expertise: ${p.expertiseAreas.join(', ')} - Last Active: ${p.lastActive.toISOString()}`
    ).join('\n')}
    
    Conversation Context:
    - Recent Topics: ${context.recentTopics.join(', ')}
    - Team Sentiment: ${context.participantSentiment}
    - Focus Areas: ${context.focusAreas.join(', ')}
    - Urgency Level: ${context.urgency}
    - Team Dynamics: Collaboration Health: ${context.teamDynamics.collaborationHealth}%
    
    Goal Tracking:
    - Original Goal: ${session.goalTracking.originalGoal}
    - Current Goals: ${session.goalTracking.currentGoals.join('; ')}
    - Completed Milestones: ${session.goalTracking.completedMilestones.join('; ')}
    - Active Blockers: ${session.goalTracking.blockers.join('; ')}
    - Progress Metrics: Functionality: ${session.goalTracking.successMetrics.functionalityComplete}%, Satisfaction ${session.goalTracking.successMetrics.userSatisfaction}%
    
    Recent Conversation Insights:
    ${session.conversationHistory.slice(-15).map(e => `${e.author} (${e.type}): ${e.content.substring(0, 100)}...`).join('\n')}
    
    Create prioritized next steps that:
    1. Address Current Blockers: Identify specific actions to overcome current obstacles
    2. Leverage Team Expertise: Assign tasks that match individual skills and interests
    3. Maintain Momentum: Keep the project moving forward without overwhelming the team
    4. Fill Knowledge Gaps: Identify areas where the team needs additional research or learning
    5. Optimize Workflow: Suggest improvements to processes and collaboration patterns
    6. Prevent Future Issues: Proactively address potential problems before they become blockers
    7. Enhance Team Dynamics: Suggest activities that improve collaboration and communication
    
    For each task, consider:
    - Which team member(s) are best suited based on expertise and availability
    - Estimated time commitment and complexity
    - Dependencies on other tasks or external factors
    - Success criteria and measurable outcomes
    - Risk factors and mitigation strategies
    
    Also identify new opportunities for improvement, optimization, or feature enhancement.
    `

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: analysisPrompt,
        temperature: 0.3,
        max_output_tokens: 2000
      })

      return this.parseNextStepsResponse(response.output_text || 
                                        this.extractContentFromResponse(response.output) || 
                                        '')
    } catch (error) {
      console.error('Next steps analysis failed:', error)
      return {
        prioritizedTasks: [{
          task: 'Continue workflow development based on current progress',
          priority: 'medium',
          estimatedTime: '1-2 hours',
          reasoning: 'Maintain momentum while system analyzes optimal next steps'
        }],
        blockers: ['Unable to analyze current state - manual review needed'],
        opportunities: ['Implement enhanced collaboration tools', 'Improve team communication processes']
      }
    }
  }

  // Enhanced helper methods
  private async selectOptimalAIPersona(goal: string, creator: Participant): Promise<AIPersona> {
    const personaPrompt = `
    Select optimal AI persona for workflow collaboration:
    
    Project Goal: ${goal}
    Project Creator: ${creator.name}
    Creator Role: ${creator.role}
    Creator Expertise: ${creator.expertiseAreas.join(', ')}
    Creator Communication Style: ${creator.preferredCommunicationStyle}
    
    Available personas:
    1. Facilitator - Guides discussions, manages conflicts, ensures participation
    2. Expert - Provides technical insights, validates solutions, suggests improvements
    3. Coordinator - Organizes tasks, tracks progress, manages timelines
    4. Innovator - Suggests creative solutions, challenges assumptions, explores alternatives
    
    Personality traits:
    - Analytical: Data-driven, systematic, thorough
    - Creative: Imaginative, flexible, open to new ideas
    - Practical: Results-focused, efficient, straightforward
    - Supportive: Encouraging, patient, collaborative
    
    Choose the best role and personality combination for this context.
    Consider the creator's style and project needs.
    
    Respond with: role|personality (e.g., "facilitator|supportive")
    `

    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: personaPrompt,
        temperature: 0.3,
        max_output_tokens: 500
      })

      const content = response.output_text || 
                     this.extractContentFromResponse(response.output) || 
                     ''
      return this.parsePersonaResponse(content)
    } catch {
      // Intelligent fallback based on creator profile
      const role = creator.expertiseAreas.some(area => 
        ['management', 'leadership', 'project'].some(keyword => 
          area.toLowerCase().includes(keyword)
        )
      ) ? 'facilitator' : 'expert'
      
      const personality = creator.preferredCommunicationStyle === 'detailed' ? 'analytical' : 
                         creator.preferredCommunicationStyle === 'visual' ? 'creative' : 'practical'
      
      return {
        name: 'FlowCraft Assistant',
        role,
        personality,
        adaptationLevel: 0
      }
    }
  }

  private buildSystemPrompt(persona: AIPersona, context: ConversationContext): string {
    return `
    You are ${persona.name}, an AI collaboration facilitator with a ${persona.personality} personality.
    Your role is to be a ${persona.role} for the workflow automation team.
    
    Current Team Context:
    - Sentiment: ${context.participantSentiment}
    - Collaboration Health: ${context.teamDynamics.collaborationHealth}%
    - Communication Efficiency: ${context.teamDynamics.communicationEfficiency}%
    - Conflict Level: ${context.teamDynamics.conflictLevel}%
    - Urgency: ${context.urgency}
    
    Role-Specific Guidelines:
    ${this.getRoleSpecificGuidelines(persona.role)}
    
    Personality-Specific Approach:
    ${this.getPersonalitySpecificApproach(persona.personality)}
    
    Adaptation Level: ${persona.adaptationLevel}/100 - Adjust your responses based on learned team preferences.
    
    Core Principles:
    - Stay focused on workflow goals while maintaining team harmony
    - Encourage collaboration and build consensus
    - Provide actionable, specific suggestions
    - Acknowledge different expertise levels and communication styles
    - Help resolve conflicts constructively and proactively
    - Adapt your communication style to current team dynamics
    - Focus on both immediate needs and long-term success
    `
  }

  private getRoleSpecificGuidelines(role: AIPersona['role']): string {
    switch (role) {
      case 'facilitator':
        return 'Guide discussions, ensure all voices are heard, manage conflicts, and keep the team focused on goals.'
      case 'expert':
        return 'Provide technical expertise, suggest best practices, identify potential issues, and offer solution guidance.'
      case 'teacher':
        return 'Explain concepts clearly, help team members learn and grow, provide educational resources and examples.'
      case 'optimizer':
        return 'Focus on improving efficiency, identifying optimization opportunities, and streamlining processes.'
      default:
        return 'Provide balanced support across facilitation, expertise, teaching, and optimization.'
    }
  }

  private getPersonalitySpecificApproach(personality: AIPersona['personality']): string {
    switch (personality) {
      case 'encouraging':
        return 'Be positive and supportive, celebrate progress, build confidence, and maintain team morale.'
      case 'analytical':
        return 'Use data and evidence, be systematic in approach, focus on details and accuracy.'
      case 'creative':
        return 'Encourage innovative thinking, suggest creative solutions, think outside conventional approaches.'
      case 'practical':
        return 'Focus on actionable outcomes, prioritize implementation, emphasize real-world feasibility.'
      default:
        return 'Balance encouragement, analysis, creativity, and practicality based on situational needs.'
    }
  }

  private buildFacilitationPrompt(
    session: CollaborationSession,
    message: string,
    workflow: Workflow,
    context: ConversationContext
  ): string {
    const participant = session.participants.find(p => 
      session.conversationHistory[session.conversationHistory.length - 1]?.author === p.id
    )

    return `
    Team member ${participant?.name || 'Unknown'} says: "${message}"
    
    Enhanced Context Analysis:
    - Message Type: ${this.classifyMessageType(message)}
    - Sentiment: ${this.analyzeSentiment(message)}
    - Technical Complexity: ${this.assessTechnicalComplexity(message)}
    - Urgency Indicators: ${this.extractUrgencyIndicators(message)}
    
    Current Workflow State:
    ${JSON.stringify(workflow, null, 2)}
    
    Team Context:
    ${session.participants.map(p => `${p.name}: ${p.role}, expertise in ${p.expertiseAreas.join(', ')}, prefers ${p.preferredCommunicationStyle} communication`).join('\n')}
    
    Conversation Dynamics:
    - Recent Topics: ${context.recentTopics.join(', ')}
    - Team Sentiment: ${context.participantSentiment}
    - Focus Areas: ${context.focusAreas.join(', ')}
    - Collaboration Health: ${context.teamDynamics.collaborationHealth}%
    - Current Urgency: ${context.urgency}
    
    Goal Tracking Status:
    - Current Goals: ${session.goalTracking.currentGoals.join(', ')}
    - Completed: ${session.goalTracking.completedMilestones.join(', ')}
    - Blockers: ${session.goalTracking.blockers.join(', ')}
    - Progress: Functionality ${session.goalTracking.successMetrics.functionalityComplete}%, Satisfaction ${session.goalTracking.successMetrics.userSatisfaction}%
    
    Active Conflicts: ${session.conflictResolution.activeConflicts.length} conflicts requiring attention
    
    Respond as the AI facilitator considering:
    1. What is the person trying to accomplish and why?
    2. How can you help move the conversation and workflow forward?
    3. Are there workflow modifications or improvements needed?
    4. What specific actions should team members take next?
    5. Are there potential conflicts, concerns, or opportunities to address?
    6. How can you leverage the team's collective expertise?
    7. What resources or guidance might be helpful?
    
    Provide a response that matches your persona while addressing the specific needs indicated by the message and context.
    Be specific, actionable, and considerate of the team dynamics and individual communication preferences.
    `
  }

  private async analyzeConversationContext(session: CollaborationSession, workflow: Workflow): Promise<ConversationContext> {
    const recentMessages = session.conversationHistory.slice(-10)
    const recentTopics = recentMessages.map(m => this.extractTopic(m.content))
    
    // Enhanced sentiment analysis
    const sentimentScores = recentMessages.map(m => this.analyzeSentimentScore(m.content))
    const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    
    // Team dynamics assessment
    const teamDynamics = {
      collaborationHealth: this.assessCollaborationHealth(session),
      communicationEfficiency: this.assessCommunicationEfficiency(session),
      conflictLevel: this.assessConflictLevel(session)
    }

    // Analyze workflow complexity to enhance context
    const workflowComplexity = workflow.nodes.length > 5 ? 'high' : workflow.nodes.length > 2 ? 'medium' : 'low'
    const hasApiIntegrations = workflow.nodes.some(node => node.data.service)
    
    return {
      recentTopics: [...new Set(recentTopics)], // Remove duplicates
      participantSentiment: avgSentiment > 0.3 ? 'positive' : avgSentiment < -0.3 ? 'negative' : 'neutral',
      focusAreas: this.identifyFocusAreas(recentMessages, { workflowComplexity, hasApiIntegrations }),
      urgency: this.assessUrgency(recentMessages),
      teamDynamics
    }
  }

  // Enhanced analysis methods
  private classifyMessageType(message: string): 'question' | 'suggestion' | 'concern' | 'approval' | 'request' {
    const messageLower = message.toLowerCase()
    if (messageLower.includes('?') || messageLower.startsWith('how') || messageLower.startsWith('what')) return 'question'
    if (messageLower.includes('suggest') || messageLower.includes('recommend') || messageLower.includes('should')) return 'suggestion'
    if (messageLower.includes('concern') || messageLower.includes('worry') || messageLower.includes('issue')) return 'concern'
    if (messageLower.includes('great') || messageLower.includes('good') || messageLower.includes('approve')) return 'approval'
    return 'request'
  }

  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const score = this.analyzeSentimentScore(message)
    return score > 0.3 ? 'positive' : score < -0.3 ? 'negative' : 'neutral'
  }

  private analyzeSentimentScore(message: string): number {
    const positiveWords = ['great', 'good', 'excellent', 'perfect', 'love', 'amazing', 'fantastic']
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'problem', 'issue', 'broken', 'wrong']
    
    const messageLower = message.toLowerCase()
    const positiveCount = positiveWords.filter(word => messageLower.includes(word)).length
    const negativeCount = negativeWords.filter(word => messageLower.includes(word)).length
    
    return (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount)
  }

  private assessTechnicalComplexity(message: string): 'low' | 'medium' | 'high' {
    const technicalTerms = ['api', 'authentication', 'webhook', 'oauth', 'endpoint', 'integration', 'configuration']
    const complexTerms = ['architecture', 'scalability', 'performance', 'security', 'optimization', 'microservices']
    
    const messageLower = message.toLowerCase()
    const technicalCount = technicalTerms.filter(term => messageLower.includes(term)).length
    const complexCount = complexTerms.filter(term => messageLower.includes(term)).length
    
    if (complexCount > 0 || technicalCount > 2) return 'high'
    if (technicalCount > 0) return 'medium'
    return 'low'
  }

  private extractUrgencyIndicators(message: string): string[] {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'blocking', 'emergency', 'deadline']
    const messageLower = message.toLowerCase()
    return urgentKeywords.filter(keyword => messageLower.includes(keyword))
  }

  private assessCollaborationHealth(session: CollaborationSession): number {
    const recentMessages = session.conversationHistory.slice(-20)
    const participantInteractions = new Set(recentMessages.map(m => m.author)).size
    const totalParticipants = session.participants.length
    
    // Calculate based on participation distribution and positive interactions
    const participationRate = participantInteractions / Math.max(1, totalParticipants)
    const positiveInteractions = recentMessages.filter(m => 
      this.analyzeSentimentScore(m.content) > 0
    ).length
    
    return Math.min(100, Math.round((participationRate * 50) + (positiveInteractions / recentMessages.length * 50)))
  }

  private assessCommunicationEfficiency(session: CollaborationSession): number {
    const recentMessages = session.conversationHistory.slice(-20)
    const questionsAsked = recentMessages.filter(m => m.content.includes('?')).length
    const questionsAnswered = recentMessages.filter(m => 
      m.type === 'suggestion' || m.type === 'modification'
    ).length
    
    return Math.min(100, Math.round((questionsAnswered / Math.max(1, questionsAsked)) * 100))
  }

  private assessConflictLevel(session: CollaborationSession): number {
    const activeConflicts = session.conflictResolution.activeConflicts.length
    const recentNegativeMessages = session.conversationHistory
      .slice(-10)
      .filter(m => this.analyzeSentimentScore(m.content) < -0.3).length
    
    return Math.min(100, (activeConflicts * 20) + (recentNegativeMessages * 10))
  }

  private assessGoalComplexity(goal: string): 'simple' | 'standard' | 'advanced' | 'enterprise' {
    const simpleIndicators = ['send', 'notify', 'save', 'create']
    const standardIndicators = ['integrate', 'connect', 'sync', 'automate']
    const advancedIndicators = ['transform', 'aggregate', 'orchestrate', 'pipeline']
    const enterpriseIndicators = ['scale', 'enterprise', 'governance', 'compliance']
    
    const goalLower = goal.toLowerCase()
    
    if (enterpriseIndicators.some(indicator => goalLower.includes(indicator))) return 'enterprise'
    if (advancedIndicators.some(indicator => goalLower.includes(indicator))) return 'advanced'
    if (standardIndicators.some(indicator => goalLower.includes(indicator))) return 'standard'
    if (simpleIndicators.some(indicator => goalLower.includes(indicator))) return 'simple'
    return 'simple'
  }

  private extractDomainFocus(goal: string): string[] {
    const domains = [
      'communication', 'data', 'marketing', 'sales', 'finance', 'hr', 'operations',
      'security', 'analytics', 'ecommerce', 'social media', 'email', 'crm'
    ]
    
    const goalLower = goal.toLowerCase()
    return domains.filter(domain => goalLower.includes(domain))
  }

  private assessCollaborationNeeds(goal: string): 'low' | 'medium' | 'high' {
    const highCollaborationIndicators = ['team', 'multiple', 'stakeholder', 'review', 'approval']
    const goalLower = goal.toLowerCase()
    
    if (highCollaborationIndicators.some(indicator => goalLower.includes(indicator))) return 'high'
    if (goalLower.length > 100) return 'medium' // Complex goals often need collaboration
    return 'low'
  }

  private extractTopic(content: string): string {
    // Enhanced topic extraction with better categorization
    const topicKeywords = {
      'authentication': ['auth', 'login', 'token', 'oauth', 'api key'],
      'integration': ['integrate', 'connect', 'api', 'webhook', 'sync'],
      'error handling': ['error', 'fail', 'exception', 'try', 'catch'],
      'testing': ['test', 'debug', 'validate', 'verify', 'check'],
      'deployment': ['deploy', 'production', 'live', 'release', 'publish'],
      'performance': ['speed', 'fast', 'slow', 'optimize', 'performance'],
      'security': ['secure', 'encrypt', 'permission', 'access', 'security'],
      'ui/ux': ['interface', 'user', 'design', 'layout', 'experience']
    }
    
    const contentLower = content.toLowerCase()
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        return topic
      }
    }
    
    // Fallback to first few meaningful words
    const words = content.split(' ').filter(word => word.length > 3).slice(0, 2)
    return words.join(' ') || 'general discussion'
  }

  private identifyFocusAreas(messages: ConversationEntry[], context: { workflowComplexity: string, hasApiIntegrations: boolean }): string[] {
    const focusKeywords = [
      'authentication', 'error handling', 'testing', 'deployment', 'performance', 
      'security', 'integration', 'ui/ux', 'documentation', 'monitoring'
    ]
    
    const areas: string[] = []
    
    for (const keyword of focusKeywords) {
      if (messages.some(m => m.content.toLowerCase().includes(keyword))) {
        areas.push(keyword)
      }
    }
    
    if (context.workflowComplexity === 'high' || context.hasApiIntegrations) {
      areas.push('integration')
    }
    
    return areas
  }

  private assessUrgency(messages: ConversationEntry[]): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'blocking', 'deadline']
    const recentUrgentMessages = messages.filter(m => 
      urgentKeywords.some(keyword => m.content.toLowerCase().includes(keyword))
    ).length
    
    if (recentUrgentMessages > 2) return 'high'
    if (recentUrgentMessages > 0) return 'medium'
    return 'low'
  }

  private async generateWelcomeMessage(session: CollaborationSession): Promise<string> {
    const creator = session.participants[0]
    return `Welcome to your FlowCraft collaboration session, ${creator.name}! 🚀 

I'm your AI facilitator, specialized in ${session.aiPersona.role} with a ${session.aiPersona.personality} approach. I'm here to help you and your team build "${session.goalTracking.originalGoal}" successfully.

Based on your expertise in ${creator.expertiseAreas.join(', ')}, I'll adapt my communication to your ${creator.preferredCommunicationStyle} style. Let's create something amazing together!

What would you like to focus on first?`
  }

  private addConversationEntry(
    session: CollaborationSession,
    author: string,
    content: string,
    type: ConversationEntry['type']
  ): void {
    const entry: ConversationEntry = {
      id: this.generateEntryId(),
      timestamp: new Date(),
      author,
      content,
      type,
      reactions: []
    }
    
    session.conversationHistory.push(entry)
    
    // Enhanced memory management with context preservation
    if (session.conversationHistory.length > 100) {
      // Keep important entries (milestones, decisions, conflicts)
      const importantEntries = session.conversationHistory.filter(e => 
        e.type === 'modification' || 
        e.type === 'approval' || 
        e.reactions.length > 0
      )
      
      const recentEntries = session.conversationHistory.slice(-50)
      session.conversationHistory = [...importantEntries.slice(-10), ...recentEntries]
    }
  }

  private async detectPotentialConflicts(
    session: CollaborationSession, 
    workflow: Workflow,
    context: ConversationContext
  ): Promise<string[]> {
    // Enhanced conflict detection based on sentiment, technical disagreements, and team dynamics
    const alerts: string[] = []
    
    if (context.participantSentiment === 'negative') {
      alerts.push('Negative sentiment detected in recent conversations - may indicate emerging conflicts')
    }
    
    if (context.teamDynamics.conflictLevel > 30) {
      alerts.push('Elevated conflict indicators detected - recommend proactive mediation')
    }
    
    if (context.teamDynamics.communicationEfficiency < 50) {
      alerts.push('Communication efficiency is low - questions may not be getting proper answers')
    }
    
    // Check for technical disagreements in recent messages
    const recentMessages = session.conversationHistory.slice(-10)
    const technicalDisagreements = recentMessages.filter(m => 
      m.content.toLowerCase().includes('disagree') || 
      m.content.toLowerCase().includes('wrong') ||
      m.content.toLowerCase().includes('better way')
    )
    
    if (technicalDisagreements.length > 1) {
      alerts.push('Technical disagreements detected - consider scheduling alignment discussion')
    }
    
    return alerts
  }

  private async updateGoalTracking(
    session: CollaborationSession, 
    analysis: FacilitationResponse,
    context: ConversationContext
  ): Promise<string[]> {
    const updates: string[] = []
    
    // Check for goal completion indicators
    if (analysis.response.toLowerCase().includes('complete') || 
        analysis.response.toLowerCase().includes('finished')) {
      updates.push('Potential milestone completion detected')
    }
    
    // Check for new blockers
    if (analysis.response.toLowerCase().includes('block') || 
        analysis.response.toLowerCase().includes('stuck') ||
        context.urgency === 'high') {
      updates.push('New potential blocker identified')
    }
    
    // Update success metrics based on context
    if (context.participantSentiment === 'positive') {
      session.goalTracking.successMetrics.userSatisfaction = Math.min(100, 
        session.goalTracking.successMetrics.userSatisfaction + 5)
      updates.push('User satisfaction improved')
    }
    
    return updates
  }

  private resolveConflictInSession(
    session: CollaborationSession,
    conflictId: string,
    resolution: string,
    resolvedBy: string
  ): void {
    const conflictIndex = session.conflictResolution.activeConflicts.findIndex(c => c.id === conflictId)
    if (conflictIndex !== -1) {
      session.conflictResolution.activeConflicts.splice(conflictIndex, 1)
      session.conflictResolution.resolvedConflicts.push({
        id: conflictId,
        resolution,
        resolvedBy,
        resolvedAt: new Date()
      })
    }
  }

  // Enhanced parsing methods
  private async parseAIFacilitationResponse(response: string): Promise<FacilitationResponse> {
    try {
      const parsed = JSON.parse(response)
      return {
        response: parsed.response || response,
        suggestedActions: parsed.suggestedActions || [],
        workflowModifications: parsed.workflowModifications || {},
        priorityLevel: parsed.priorityLevel || 'medium',
        nextSteps: parsed.nextSteps || []
      }
    } catch {
      return {
        response: response,
        suggestedActions: this.extractSuggestedActions(response),
        workflowModifications: {},
        priorityLevel: 'medium',
        nextSteps: []
      }
    }
  }

  private extractSuggestedActions(response: string): string[] {
    // Extract action items from natural language response
    const actionPatterns = [
      /consider\s+([^.!?]+)/gi,
      /try\s+([^.!?]+)/gi,
      /implement\s+([^.!?]+)/gi,
      /add\s+([^.!?]+)/gi,
      /create\s+([^.!?]+)/gi
    ]
    
    const actions: string[] = []
    
    for (const pattern of actionPatterns) {
      const matches = response.match(pattern)
      if (matches) {
        actions.push(...matches.map(match => match.trim()))
      }
    }
    
    return actions.slice(0, 5) // Limit to top 5 actions
  }

  private parseOnboardingResponse(content: string): OnboardingResult {
    // Enhanced parsing with structured extraction
    const lines = content.split('\n').filter(line => line.trim())
    
    return {
      onboardingMessage: lines.find(line => 
        line.toLowerCase().includes('welcome') || 
        line.toLowerCase().includes('join')
      ) || lines[0] || content,
      contextSummary: lines.find(line => 
        line.toLowerCase().includes('context') || 
        line.toLowerCase().includes('summary')
      ) || 'Project focusing on workflow automation and team collaboration',
      suggestedRole: lines.find(line => 
        line.toLowerCase().includes('role') || 
        line.toLowerCase().includes('contribute')
      )?.split(':')[1]?.trim() || 'technical contributor'
    }
  }

  private parseConflictResolutionResponse(content: string): ConflictResolutionResult {
    // Enhanced parsing with section identification
    const sections = content.split('\n\n')
    
    return {
      evaluationResult: sections.find(section => 
        section.toLowerCase().includes('evaluation') || 
        section.toLowerCase().includes('assessment')
      ) || content,
      alternativeOptions: this.extractListItems(content, ['alternative', 'option', 'approach']),
      consensusCheck: sections.find(section => 
        section.toLowerCase().includes('consensus') || 
        section.toLowerCase().includes('agreement')
      ) || 'Seek team consensus before implementing',
      implementationSteps: this.extractListItems(content, ['step', 'implement', 'action'])
    }
  }

  private extractListItems(content: string, keywords: string[]): string[] {
    const lines = content.split('\n')
    const items: string[] = []
    
    for (const line of lines) {
      if (line.match(/^\s*[-*]\s/) || line.match(/^\s*\d+\.\s/)) {
        if (keywords.some(keyword => line.toLowerCase().includes(keyword))) {
          items.push(line.replace(/^\s*[-*\d.]\s*/, '').trim())
        }
      }
    }
    
    return items.slice(0, 5)
  }

  private parseNextStepsResponse(content: string): NextStepsResult {
    // Enhanced parsing with priority and assignment extraction
    try {
      const parsed = JSON.parse(content)
      return {
        prioritizedTasks: parsed.prioritizedTasks || [],
        blockers: parsed.blockers || [],
        opportunities: parsed.opportunities || []
      }
    } catch {
      return {
        prioritizedTasks: this.extractTasks(content),
        blockers: this.extractListItems(content, ['blocker', 'obstacle', 'issue']),
        opportunities: this.extractListItems(content, ['opportunity', 'improve', 'enhance'])
      }
    }
  }

  private extractTasks(content: string): NextStepsResult['prioritizedTasks'] {
    const lines = content.split('\n')
    const tasks: NextStepsResult['prioritizedTasks'] = []
    
    for (const line of lines) {
      if (line.match(/^\s*[-*]\s/) || line.match(/^\s*\d+\.\s/)) {
        const cleanLine = line.replace(/^\s*[-*\d.]\s*/, '').trim()
        if (cleanLine.length > 10) { // Filter out short/meaningless lines
          tasks.push({
            task: cleanLine,
            priority: this.inferPriority(cleanLine),
            estimatedTime: this.inferTimeEstimate(cleanLine),
            reasoning: 'Extracted from AI analysis'
          })
        }
      }
    }
    
    return tasks.slice(0, 8) // Limit to top 8 tasks
  }

  private inferPriority(task: string): 'high' | 'medium' | 'low' {
    const taskLower = task.toLowerCase()
    if (taskLower.includes('urgent') || taskLower.includes('critical') || taskLower.includes('blocker')) {
      return 'high'
    }
    if (taskLower.includes('important') || taskLower.includes('should') || taskLower.includes('key')) {
      return 'medium'
    }
    return 'low'
  }

  private inferTimeEstimate(task: string): string {
    const taskLower = task.toLowerCase()
    if (taskLower.includes('research') || taskLower.includes('investigate') || taskLower.includes('analyze')) {
      return '2-4 hours'
    }
    if (taskLower.includes('implement') || taskLower.includes('build') || taskLower.includes('create')) {
      return '4-8 hours'
    }
    if (taskLower.includes('test') || taskLower.includes('verify') || taskLower.includes('validate')) {
      return '1-2 hours'
    }
    return '2-3 hours'
  }

  private parsePersonaResponse(content: string): AIPersona {
    // Enhanced persona parsing with reasoning extraction
    const contentLower = content.toLowerCase()
    
    let role: AIPersona['role'] = 'facilitator'
    if (contentLower.includes('expert')) role = 'expert'
    else if (contentLower.includes('teacher')) role = 'teacher'
    else if (contentLower.includes('optimizer')) role = 'optimizer'
    
    let personality: AIPersona['personality'] = 'encouraging'
    if (contentLower.includes('analytical')) personality = 'analytical'
    else if (contentLower.includes('creative')) personality = 'creative'
    else if (contentLower.includes('practical')) personality = 'practical'
    
    return {
      name: 'FlowCraft Assistant',
      role,
      personality,
      adaptationLevel: 0
    }
  }

  private generateFallbackResponse(message: string): FacilitationResult {
    return {
      aiResponse: `I understand you're working on "${message}". Let me help you move forward with that. Based on the current context, I suggest we break this down into specific, actionable steps.`,
      suggestedActions: [
        'Clarify specific requirements and goals',
        'Identify any potential blockers or dependencies',
        'Define success criteria and next steps'
      ],
      conflictAlerts: [],
      goalUpdates: []
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEntryId(): string {
    return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Helper method to extract content from response output array
  private extractContentFromResponse(output: any[]): string {
    if (!output || output.length === 0) return ''
    
    const messageOutput = output.find((item: any) => item.type === 'message')
    if (messageOutput && messageOutput.content && messageOutput.content.length > 0) {
      const textContent = messageOutput.content.find((c: any) => c.type === 'output_text')
      return textContent?.text || ''
    }
    
    return ''
  }
}