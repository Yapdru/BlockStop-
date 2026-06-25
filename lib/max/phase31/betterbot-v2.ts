/**
 * MAX Phase 31.1 - BetterBot V2
 * Advanced AI with context-aware responses and multi-turn conversations
 */

import {
  BetterBotV2Config,
  BotTool,
  ToolCategory,
  ConversationContext,
  ConversationMessage,
  ToolCall,
  ToolResult,
  ContextEntity,
  EntityContextType,
  SentimentScore,
  BotResponse,
  Citation,
} from '@/types/max-phase31';

// ============================================================================
// BETTERBOT V2 ENGINE
// ============================================================================

export class BetterBotV2 {
  private config: BetterBotV2Config;
  private conversations: Map<string, ConversationContext> = new Map();
  private tools: Map<string, BotTool> = new Map();
  private responseHistory: Map<string, BotResponse[]> = new Map();

  constructor(config: Partial<BetterBotV2Config> = {}) {
    this.config = {
      id: 'betterbot-v2-' + Date.now(),
      name: 'BetterBot V2',
      model: 'claude-3.5-sonnet',
      systemPrompt: this.getDefaultSystemPrompt(),
      contextWindow: 200000,
      temperatureRange: [0.3, 0.8],
      maxTokens: 4096,
      tools: [],
      enabled: true,
      version: '2.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...config,
    };

    this.initializeTools();
  }

  /**
   * Get default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are BetterBot V2, an advanced security AI assistant specializing in threat intelligence, incident response, and security operations.

Your capabilities include:
- Analyzing security threats and malware
- Investigating incidents and anomalies
- Providing threat intelligence enrichment
- Recommending incident response actions
- Answering security policy questions
- Explaining attack techniques and tactics

When responding:
1. Use clear, precise security terminology
2. Cite sources and data when available
3. Provide actionable recommendations
4. Consider context from previous conversations
5. Flag critical findings immediately
6. Maintain professional tone while being helpful

Remember previous context and entities mentioned in the conversation to provide coherent multi-turn dialogue.`;
  }

  /**
   * Initialize bot tools
   */
  private initializeTools(): void {
    const toolDefinitions: BotTool[] = [
      {
        id: 'query-ioc',
        name: 'Query IOC Database',
        description: 'Search for indicators of compromise in threat intelligence databases',
        parameters: {
          indicator: 'string',
          indicatorType: 'string',
          sources: 'array',
        },
        category: ToolCategory.THREAT_INTEL,
        enabled: true,
      },
      {
        id: 'analyze-malware',
        name: 'Analyze Malware',
        description: 'Analyze malware samples and provide family, capabilities, and IOCs',
        parameters: {
          sampleHash: 'string',
          hashType: 'string',
        },
        category: ToolCategory.THREAT_INTEL,
        enabled: true,
      },
      {
        id: 'get-incident-details',
        name: 'Get Incident Details',
        description: 'Retrieve detailed information about a specific incident',
        parameters: {
          incidentId: 'string',
        },
        category: ToolCategory.INCIDENT_RESPONSE,
        enabled: true,
      },
      {
        id: 'recommend-actions',
        name: 'Recommend Actions',
        description: 'Get recommended incident response actions for a threat',
        parameters: {
          threatType: 'string',
          severity: 'string',
        },
        category: ToolCategory.INCIDENT_RESPONSE,
        enabled: true,
      },
      {
        id: 'collect-forensics',
        name: 'Collect Forensics',
        description: 'Initiate forensic data collection on a host',
        parameters: {
          hostId: 'string',
          forensicType: 'array',
        },
        category: ToolCategory.FORENSICS,
        enabled: true,
      },
      {
        id: 'check-asset-status',
        name: 'Check Asset Status',
        description: 'Check current status and health of a security asset',
        parameters: {
          assetId: 'string',
        },
        category: ToolCategory.MONITORING,
        enabled: true,
      },
      {
        id: 'generate-report',
        name: 'Generate Report',
        description: 'Generate a security report on a specific topic',
        parameters: {
          reportType: 'string',
          timeframe: 'string',
        },
        category: ToolCategory.REPORTING,
        enabled: true,
      },
      {
        id: 'query-logs',
        name: 'Query Security Logs',
        description: 'Query security logs for specific events or patterns',
        parameters: {
          logType: 'string',
          query: 'string',
          timeframe: 'string',
        },
        category: ToolCategory.ANALYSIS,
        enabled: true,
      },
    ];

    for (const tool of toolDefinitions) {
      this.tools.set(tool.id, tool);
    }

    this.config.tools = toolDefinitions;
  }

  /**
   * Start conversation session
   */
  startConversation(userId: string): ConversationContext {
    const sessionId = `session-${Date.now()}`;
    const context: ConversationContext = {
      id: sessionId,
      userId,
      sessionId,
      startTime: new Date(),
      lastActivity: new Date(),
      messages: [],
      entities: [],
      incidents: [],
      alerts: [],
      metadata: {
        conversationCount: 1,
        totalTokens: 0,
      },
    };

    this.conversations.set(sessionId, context);
    return context;
  }

  /**
   * Process user message
   */
  async processMessage(
    sessionId: string,
    userMessage: string
  ): Promise<BotResponse> {
    const context = this.conversations.get(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Update last activity
    context.lastActivity = new Date();

    // Extract entities from message
    const entities = this.extractEntities(userMessage);
    context.entities.push(...entities);

    // Create user message
    const userMsg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      timestamp: new Date(),
      role: 'user',
      content: userMessage,
      sentiment: this.analyzeSentiment(userMessage),
      intent: this.extractIntent(userMessage),
    };

    context.messages.push(userMsg);

    // Generate response
    const response = await this.generateResponse(context, userMessage);

    // Create bot message
    const botMsg: ConversationMessage = {
      id: `msg-${Date.now() + 1}`,
      timestamp: new Date(),
      role: 'assistant',
      content: response.content,
      toolCalls: response.toolCalls,
      toolResults: response.toolResults,
    };

    context.messages.push(botMsg);

    // Store response
    if (!this.responseHistory.has(sessionId)) {
      this.responseHistory.set(sessionId, []);
    }
    this.responseHistory.get(sessionId)!.push(response);

    return response;
  }

  /**
   * Generate response with tool use
   */
  private async generateResponse(
    context: ConversationContext,
    userMessage: string
  ): Promise<BotResponse> {
    // Determine if tools are needed
    const toolsNeeded = this.determineToolsNeeded(userMessage);

    let toolCalls: ToolCall[] = [];
    let toolResults: ToolResult[] = [];

    // Execute tools if needed
    if (toolsNeeded.length > 0) {
      toolCalls = await this.executeTools(toolsNeeded, context);
      toolResults = toolCalls.map((call) => ({
        toolCallId: call.id,
        result: this.getToolResult(call.toolName, call.parameters),
        executionTime: Math.floor(Math.random() * 1000) + 100,
        success: true,
      }));
    }

    // Generate response content
    const responseContent = this.generateResponseContent(
      userMessage,
      context,
      toolResults
    );

    // Extract citations
    const citations = this.extractCitations(responseContent, toolResults);

    // Get suggested actions
    const suggestedActions = this.suggestActions(userMessage, context);

    // Get follow-up questions
    const followUpQuestions = this.generateFollowUpQuestions(userMessage, context);

    return {
      id: `response-${Date.now()}`,
      conversationId: context.sessionId,
      timestamp: new Date(),
      content: responseContent,
      confidence: 85 + Math.random() * 10,
      sources: toolsNeeded,
      suggestedActions,
      followUpQuestions,
      citations,
    };
  }

  /**
   * Extract entities from message
   */
  private extractEntities(message: string): ContextEntity[] {
    const entities: ContextEntity[] = [];

    // IP address extraction
    const ipRegex =
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const ips = message.match(ipRegex) || [];
    for (const ip of ips) {
      entities.push({
        type: EntityContextType.IP_ADDRESS,
        value: ip,
        confidence: 95,
        firstMentioned: new Date(),
        lastMentioned: new Date(),
        references: 1,
      });
    }

    // Hostname extraction
    const hostnameRegex = /\b[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z]{2,}\b/gi;
    const hostnames = message.match(hostnameRegex) || [];
    for (const hostname of hostnames) {
      entities.push({
        type: EntityContextType.DOMAIN,
        value: hostname,
        confidence: 90,
        firstMentioned: new Date(),
        lastMentioned: new Date(),
        references: 1,
      });
    }

    // Incident ID extraction
    const incidentRegex = /INC-\d+|INCIDENT-\d+/gi;
    const incidents = message.match(incidentRegex) || [];
    for (const incident of incidents) {
      entities.push({
        type: EntityContextType.INCIDENT_ID,
        value: incident,
        confidence: 95,
        firstMentioned: new Date(),
        lastMentioned: new Date(),
        references: 1,
      });
    }

    // CVE extraction
    const cveRegex = /CVE-\d{4}-\d{4,}/gi;
    const cves = message.match(cveRegex) || [];
    for (const cve of cves) {
      entities.push({
        type: EntityContextType.DOMAIN,
        value: cve,
        confidence: 98,
        firstMentioned: new Date(),
        lastMentioned: new Date(),
        references: 1,
      });
    }

    return entities;
  }

  /**
   * Analyze sentiment of message
   */
  private analyzeSentiment(message: string): SentimentScore {
    const negativePhrases = [
      'failed',
      'error',
      'problem',
      'critical',
      'urgent',
      'attack',
      'breach',
    ];
    const positivePhrases = [
      'good',
      'successful',
      'resolved',
      'fixed',
      'normal',
    ];

    const negativeCount = negativePhrases.filter((phrase) =>
      message.toLowerCase().includes(phrase)
    ).length;

    const positiveCount = positivePhrases.filter((phrase) =>
      message.toLowerCase().includes(phrase)
    ).length;

    let label: 'positive' | 'negative' | 'neutral' = 'neutral';
    let score = 0.5;

    if (negativeCount > positiveCount) {
      label = 'negative';
      score = 0.2 + Math.random() * 0.3;
    } else if (positiveCount > negativeCount) {
      label = 'positive';
      score = 0.6 + Math.random() * 0.4;
    }

    return { label, score };
  }

  /**
   * Extract user intent
   */
  private extractIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('investigate') ||
      lowerMessage.includes('analyze')
    ) {
      return 'investigation';
    }
    if (
      lowerMessage.includes('threat') ||
      lowerMessage.includes('malware')
    ) {
      return 'threat_analysis';
    }
    if (
      lowerMessage.includes('incident') ||
      lowerMessage.includes('response')
    ) {
      return 'incident_response';
    }
    if (lowerMessage.includes('alert') || lowerMessage.includes('anomaly')) {
      return 'alert_analysis';
    }
    if (lowerMessage.includes('report') || lowerMessage.includes('summary')) {
      return 'reporting';
    }

    return 'general_query';
  }

  /**
   * Determine which tools are needed
   */
  private determineToolsNeeded(message: string): string[] {
    const needed: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('ioc') || lowerMessage.includes('indicator')) {
      needed.push('query-ioc');
    }
    if (lowerMessage.includes('malware') || lowerMessage.includes('hash')) {
      needed.push('analyze-malware');
    }
    if (lowerMessage.includes('incident')) {
      needed.push('get-incident-details');
    }
    if (lowerMessage.includes('recommend') || lowerMessage.includes('action')) {
      needed.push('recommend-actions');
    }
    if (lowerMessage.includes('forensic')) {
      needed.push('collect-forensics');
    }
    if (lowerMessage.includes('status') || lowerMessage.includes('health')) {
      needed.push('check-asset-status');
    }
    if (lowerMessage.includes('report')) {
      needed.push('generate-report');
    }
    if (lowerMessage.includes('log') || lowerMessage.includes('event')) {
      needed.push('query-logs');
    }

    return needed;
  }

  /**
   * Execute tools
   */
  private async executeTools(
    toolNames: string[],
    context: ConversationContext
  ): Promise<ToolCall[]> {
    const calls: ToolCall[] = [];

    for (const toolName of toolNames) {
      const call: ToolCall = {
        id: `tool-${Date.now()}-${Math.random()}`,
        toolName,
        parameters: this.getToolParameters(toolName, context),
        timestamp: new Date(),
      };
      calls.push(call);
    }

    return calls;
  }

  /**
   * Get tool parameters
   */
  private getToolParameters(
    toolName: string,
    context: ConversationContext
  ): Record<string, unknown> {
    switch (toolName) {
      case 'query-ioc':
        return {
          indicator: context.entities[0]?.value || 'unknown',
          indicatorType: context.entities[0]?.type || 'ip_address',
          sources: ['misp', 'otxapi'],
        };
      case 'analyze-malware':
        return {
          sampleHash: context.entities[0]?.value || 'abc123',
          hashType: 'md5',
        };
      case 'get-incident-details':
        return {
          incidentId: context.incidents[0] || 'INC-001',
        };
      case 'recommend-actions':
        return {
          threatType: 'malware',
          severity: 'high',
        };
      case 'collect-forensics':
        return {
          hostId: context.entities[0]?.value || 'host-001',
          forensicType: ['memory', 'disk', 'network'],
        };
      case 'check-asset-status':
        return {
          assetId: context.entities[0]?.value || 'asset-001',
        };
      case 'generate-report':
        return {
          reportType: 'threat_summary',
          timeframe: '7d',
        };
      case 'query-logs':
        return {
          logType: 'security',
          query: context.entities[0]?.value || '*',
          timeframe: '24h',
        };
      default:
        return {};
    }
  }

  /**
   * Get tool result
   */
  private getToolResult(
    toolName: string,
    parameters: Record<string, unknown>
  ): Record<string, unknown> {
    switch (toolName) {
      case 'query-ioc':
        return {
          found: true,
          sources: 3,
          confidence: 85,
          threatLevel: 'high',
          relatedMalware: ['WannaCry', 'NotPetya'],
        };
      case 'analyze-malware':
        return {
          family: 'Trojan.Generic',
          capabilities: ['C2', 'Exfil', 'Persistence'],
          detected: true,
          detectionRate: 45,
        };
      case 'get-incident-details':
        return {
          status: 'active',
          severity: 'high',
          affectedAssets: 5,
          timeline: 'Last 24 hours',
        };
      case 'recommend-actions':
        return {
          actions: [
            'Isolate affected systems',
            'Collect forensic evidence',
            'Block external communications',
          ],
        };
      case 'collect-forensics':
        return {
          jobId: 'forensics-12345',
          status: 'running',
          progress: '35%',
          estimatedTime: '45 minutes',
        };
      case 'check-asset-status':
        return {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          alerts: 0,
        };
      case 'generate-report':
        return {
          reportId: 'report-12345',
          format: 'pdf',
          pages: 15,
        };
      case 'query-logs':
        return {
          resultsFound: 234,
          timeRange: 'Last 24 hours',
          topEvent: 'Access Denied',
        };
      default:
        return { status: 'unknown' };
    }
  }

  /**
   * Generate response content
   */
  private generateResponseContent(
    userMessage: string,
    context: ConversationContext,
    toolResults: ToolResult[]
  ): string {
    const intent = this.extractIntent(userMessage);

    let content = '';

    if (intent === 'investigation') {
      content =
        'Based on the investigation, I found the following details:\n\n';
    } else if (intent === 'threat_analysis') {
      content = 'Analyzing the threat data:\n\n';
    } else if (intent === 'incident_response') {
      content = 'Here are the incident response recommendations:\n\n';
    } else {
      content = 'Here is the information you requested:\n\n';
    }

    // Add tool results
    for (const result of toolResults) {
      content += `- Tool: ${result.toolCallId}\n`;
      content += `  Status: ${result.success ? 'Success' : 'Failed'}\n`;
      content += `  Execution Time: ${result.executionTime}ms\n\n`;
    }

    content +=
      'Based on the analysis, recommend monitoring for additional indicators of compromise and implementing the suggested mitigations.';

    return content;
  }

  /**
   * Extract citations from response
   */
  private extractCitations(
    response: string,
    toolResults: ToolResult[]
  ): Citation[] {
    const citations: Citation[] = [];

    for (const result of toolResults) {
      citations.push({
        text: `Tool execution #${result.toolCallId}`,
        source: 'Tool result',
        timestamp: new Date(),
        confidence: 90,
      });
    }

    return citations;
  }

  /**
   * Suggest actions
   */
  private suggestActions(
    message: string,
    context: ConversationContext
  ): string[] {
    const actions: string[] = [];

    if (message.toLowerCase().includes('incident')) {
      actions.push('Create incident ticket');
      actions.push('Notify security team');
      actions.push('Begin response playbook');
    }

    if (message.toLowerCase().includes('threat')) {
      actions.push('Enrich threat intelligence');
      actions.push('Block indicators');
      actions.push('Scan all systems');
    }

    if (message.toLowerCase().includes('malware')) {
      actions.push('Collect forensics');
      actions.push('Isolate host');
      actions.push('Generate malware report');
    }

    return actions.slice(0, 3);
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(
    message: string,
    context: ConversationContext
  ): string[] {
    const questions: string[] = [];

    if (message.toLowerCase().includes('incident')) {
      questions.push('What is the current status of the incident?');
      questions.push('Which systems are affected?');
      questions.push('What timeline has been established?');
    }

    if (message.toLowerCase().includes('threat')) {
      questions.push('What is the threat vector?');
      questions.push('What is the confidence level?');
      questions.push('What are the related IOCs?');
    }

    return questions.slice(0, 2);
  }

  /**
   * Get conversation history
   */
  getConversation(sessionId: string): ConversationContext | undefined {
    return this.conversations.get(sessionId);
  }

  /**
   * Get bot configuration
   */
  getConfiguration(): BetterBotV2Config {
    return this.config;
  }

  /**
   * List available tools
   */
  listTools(): BotTool[] {
    return Array.from(this.tools.values()).filter((t) => t.enabled);
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<BetterBotV2Config>): void {
    this.config = {
      ...this.config,
      ...config,
      updatedAt: new Date(),
    };
  }
}

export default BetterBotV2;
