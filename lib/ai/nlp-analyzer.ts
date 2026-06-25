// Phase 28.1 - Natural Language Processing Threat Analysis Module
// Users can ask questions in plain English
// NLP parsing, threat intelligence retrieval, context-aware responses

import { threatIntelligenceEngine, ThreatIndicator } from './threat-intelligence';
import { threatPredictor } from './threat-predictor';

export interface NLPQuery {
  id: string;
  userId: string;
  organizationId: string;
  text: string;
  timestamp: Date;
  language?: string;
  confidence: number; // 0-100
}

export interface ParsedQuery {
  intent: QueryIntent;
  entities: ExtractedEntity[];
  context: 'threat-analysis' | 'threat-prediction' | 'threat-intelligence' | 'recommendations' | 'general-security';
  confidence: number; // 0-100
  originalQuery: string;
}

export enum QueryIntent {
  THREAT_ANALYSIS = 'threat_analysis',
  THREAT_PREDICTION = 'threat_prediction',
  THREAT_INTELLIGENCE = 'threat_intelligence',
  RISK_ASSESSMENT = 'risk_assessment',
  INCIDENT_RESPONSE = 'incident_response',
  SECURITY_BEST_PRACTICES = 'security_best_practices',
  POLICY_CONSULTATION = 'policy_consultation',
  UNKNOWN = 'unknown',
}

export interface ExtractedEntity {
  type: 'ip' | 'domain' | 'email' | 'hash' | 'url' | 'threat-type' | 'timeframe' | 'severity' | 'organization';
  value: string;
  confidence: number; // 0-100
}

export interface NLPResponse {
  id: string;
  queryId: string;
  intent: QueryIntent;
  response: string;
  responseType: 'threat-analysis' | 'threat-prediction' | 'recommendation' | 'information' | 'clarification';
  threatData?: ThreatIndicator[];
  predictions?: any[];
  recommendations?: string[];
  followUpQuestions?: string[];
  confidence: number; // 0-100
  sources: string[];
  timestamp: Date;
}

export interface DialogContext {
  userId: string;
  organizationId: string;
  conversationHistory: NLPQuery[];
  responses: NLPResponse[];
  lastQueryTime: Date;
  sessionDuration: number; // milliseconds
}

class NLPAnalyzer {
  private dialogContexts = new Map<string, DialogContext>();
  private queryHistory = new Map<string, NLPQuery[]>();
  private responseCache = new Map<string, NLPResponse>();

  // Intent detection keywords
  private intentKeywords = {
    [QueryIntent.THREAT_ANALYSIS]: [
      'analyze', 'check', 'scan', 'detect', 'threat', 'malware', 'phishing',
      'infected', 'suspicious', 'risky', 'danger', 'risk',
    ],
    [QueryIntent.THREAT_PREDICTION]: [
      'predict', 'forecast', 'likelihood', 'probability', 'expect', 'next',
      'upcoming', 'future', 'will', 'likely', 'trend',
    ],
    [QueryIntent.THREAT_INTELLIGENCE]: [
      'tell', 'information', 'feed', 'intelligence', 'about', 'know',
      'details', 'facts', 'research', 'source',
    ],
    [QueryIntent.RISK_ASSESSMENT]: [
      'risk', 'assess', 'evaluate', 'rate', 'score', 'severity', 'impact',
      'exposure', 'vulnerable', 'safe',
    ],
    [QueryIntent.INCIDENT_RESPONSE]: [
      'incident', 'response', 'breach', 'attack', 'remediate', 'contain',
      'mitigate', 'recover', 'restore', 'emergency',
    ],
    [QueryIntent.SECURITY_BEST_PRACTICES]: [
      'best practice', 'recommendation', 'policy', 'standard', 'guideline',
      'secure', 'hardening', 'improve', 'protect',
    ],
  };

  /**
   * Process natural language query
   */
  async processQuery(
    userId: string,
    organizationId: string,
    query: string
  ): Promise<NLPResponse> {
    const queryId = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const nlpQuery: NLPQuery = {
      id: queryId,
      userId,
      organizationId,
      text: query,
      timestamp: new Date(),
      language: 'en',
      confidence: 95,
    };

    // Parse the query
    const parsed = this.parseQuery(query);

    // Get or create dialog context
    const contextKey = `${userId}-${organizationId}`;
    let context = this.dialogContexts.get(contextKey);
    if (!context) {
      context = {
        userId,
        organizationId,
        conversationHistory: [],
        responses: [],
        lastQueryTime: new Date(),
        sessionDuration: 0,
      };
      this.dialogContexts.set(contextKey, context);
    }

    context.conversationHistory.push(nlpQuery);
    context.lastQueryTime = new Date();

    // Store query history
    if (!this.queryHistory.has(userId)) {
      this.queryHistory.set(userId, []);
    }
    this.queryHistory.get(userId)!.push(nlpQuery);

    // Generate response based on intent
    const response = await this.generateResponse(
      nlpQuery,
      parsed,
      context
    );

    context.responses.push(response);
    this.responseCache.set(queryId, response);

    return response;
  }

  /**
   * Parse natural language query to extract intent and entities
   */
  private parseQuery(query: string): ParsedQuery {
    const lowerQuery = query.toLowerCase();

    // Detect intent
    let intent = QueryIntent.UNKNOWN;
    let maxMatches = 0;

    Object.entries(this.intentKeywords).forEach(([intentStr, keywords]) => {
      const matches = keywords.filter((keyword) =>
        lowerQuery.includes(keyword)
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        intent = intentStr as QueryIntent;
      }
    });

    // Extract entities
    const entities = this.extractEntities(query);

    // Determine context
    let context: ParsedQuery['context'] = 'general-security';
    if (intent === QueryIntent.THREAT_ANALYSIS) {
      context = 'threat-analysis';
    } else if (intent === QueryIntent.THREAT_PREDICTION) {
      context = 'threat-prediction';
    } else if (intent === QueryIntent.THREAT_INTELLIGENCE) {
      context = 'threat-intelligence';
    } else if (intent === QueryIntent.RISK_ASSESSMENT) {
      context = 'threat-analysis';
    } else if (
      intent === QueryIntent.INCIDENT_RESPONSE ||
      intent === QueryIntent.SECURITY_BEST_PRACTICES
    ) {
      context = 'recommendations';
    }

    return {
      intent,
      entities,
      context,
      confidence: Math.min(100, maxMatches * 15),
      originalQuery: query,
    };
  }

  /**
   * Extract entities from query text
   */
  private extractEntities(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // IP address pattern
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const ips = query.match(ipPattern);
    if (ips) {
      ips.forEach((ip) => {
        entities.push({
          type: 'ip',
          value: ip,
          confidence: 95,
        });
      });
    }

    // Domain pattern
    const domainPattern = /\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}\b/gi;
    const domains = query.match(domainPattern);
    if (domains) {
      domains.forEach((domain) => {
        entities.push({
          type: 'domain',
          value: domain.toLowerCase(),
          confidence: 90,
        });
      });
    }

    // Email pattern
    const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    const emails = query.match(emailPattern);
    if (emails) {
      emails.forEach((email) => {
        entities.push({
          type: 'email',
          value: email.toLowerCase(),
          confidence: 95,
        });
      });
    }

    // URL pattern
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = query.match(urlPattern);
    if (urls) {
      urls.forEach((url) => {
        entities.push({
          type: 'url',
          value: url,
          confidence: 95,
        });
      });
    }

    // Hash pattern (MD5, SHA1, SHA256)
    const hashPattern = /\b(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})\b/gi;
    const hashes = query.match(hashPattern);
    if (hashes) {
      hashes.forEach((hash) => {
        entities.push({
          type: 'hash',
          value: hash.toUpperCase(),
          confidence: 90,
        });
      });
    }

    // Threat type keywords
    const threatTypes = [
      'malware', 'phishing', 'ransomware', 'trojan', 'worm',
      'botnet', 'ddos', 'intrusion', 'breach', 'exploit',
    ];
    const lowerQuery = query.toLowerCase();
    threatTypes.forEach((threatType) => {
      if (lowerQuery.includes(threatType)) {
        entities.push({
          type: 'threat-type',
          value: threatType,
          confidence: 85,
        });
      }
    });

    // Timeframe keywords
    const timeframes = [
      'today', 'yesterday', 'week', 'month', 'quarter', 'year',
      'last 24 hours', 'last 7 days', 'last 30 days',
    ];
    timeframes.forEach((timeframe) => {
      if (lowerQuery.includes(timeframe)) {
        entities.push({
          type: 'timeframe',
          value: timeframe,
          confidence: 85,
        });
      }
    });

    // Severity keywords
    const severities = ['critical', 'high', 'medium', 'low', 'info'];
    severities.forEach((severity) => {
      if (lowerQuery.includes(severity)) {
        entities.push({
          type: 'severity',
          value: severity,
          confidence: 80,
        });
      }
    });

    return entities;
  }

  /**
   * Generate response based on parsed query
   */
  private async generateResponse(
    query: NLPQuery,
    parsed: ParsedQuery,
    context: DialogContext
  ): Promise<NLPResponse> {
    let response = '';
    let responseType: NLPResponse['responseType'] = 'information';
    let threatData: ThreatIndicator[] = [];
    const sources = ['BlockStop AI', 'Threat Intelligence Engine'];

    switch (parsed.intent) {
      case QueryIntent.THREAT_ANALYSIS:
        ({ response, threatData, responseType } = await this.analyzeThreat(
          parsed,
          query.organizationId
        ));
        break;

      case QueryIntent.THREAT_PREDICTION:
        response = this.predictThreats(parsed, query.userId, query.organizationId);
        responseType = 'threat-prediction';
        break;

      case QueryIntent.THREAT_INTELLIGENCE:
        response = this.lookupThreatIntelligence(parsed);
        responseType = 'information';
        break;

      case QueryIntent.RISK_ASSESSMENT:
        response = this.assessRisk(parsed, query.organizationId);
        responseType = 'recommendation';
        break;

      case QueryIntent.INCIDENT_RESPONSE:
        response = this.suggestIncidentResponse(parsed);
        responseType = 'recommendation';
        break;

      case QueryIntent.SECURITY_BEST_PRACTICES:
        response = this.suggestBestPractices(parsed);
        responseType = 'recommendation';
        break;

      default:
        response = this.handleUnknownIntent(query.text);
        responseType = 'clarification';
    }

    const followUpQuestions = this.generateFollowUpQuestions(
      parsed,
      context.conversationHistory
    );

    return {
      id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      queryId: query.id,
      intent: parsed.intent,
      response,
      responseType,
      threatData: threatData.length > 0 ? threatData : undefined,
      followUpQuestions,
      confidence: parsed.confidence,
      sources,
      timestamp: new Date(),
    };
  }

  /**
   * Analyze threat from parsed query
   */
  private async analyzeThreat(
    parsed: ParsedQuery,
    organizationId: string
  ): Promise<{
    response: string;
    threatData: ThreatIndicator[];
    responseType: NLPResponse['responseType'];
  }> {
    const threatData: ThreatIndicator[] = [];
    let response = '';

    if (parsed.entities.length === 0) {
      return {
        response: 'Please provide an IP address, domain, URL, or file hash to analyze.',
        threatData,
        responseType: 'clarification',
      };
    }

    // Analyze each entity
    const analyses = parsed.entities.map((entity) => {
      const threatInfo = threatIntelligenceEngine.checkIndicator(entity.value, entity.type as any);
      return { entity, threatInfo };
    });

    const threats = analyses.filter((a) => a.threatInfo);

    if (threats.length > 0) {
      response = `Found ${threats.length} potential threat(s):\n\n`;
      threats.forEach((threat) => {
        if (threat.threatInfo) {
          threatData.push(threat.threatInfo);
          response += `- **${threat.entity.value}**\n`;
          response += `  - Severity: ${threat.threatInfo.severity.toUpperCase()}\n`;
          response += `  - Source: ${threat.threatInfo.source}\n`;
          response += `  - Confidence: ${threat.threatInfo.confidence}%\n`;
          response += `  - Tags: ${threat.threatInfo.tags.join(', ')}\n\n`;
        }
      });
    } else {
      response = `No known threats found for:\n`;
      parsed.entities.forEach((entity) => {
        response += `- ${entity.value}\n`;
      });
      response += '\nNo threats detected in current threat intelligence feeds.';
    }

    return {
      response,
      threatData,
      responseType: threatData.length > 0 ? 'threat-analysis' : 'information',
    };
  }

  /**
   * Predict threats from parsed query
   */
  private predictThreats(
    parsed: ParsedQuery,
    userId: string,
    organizationId: string
  ): string {
    const predictions = threatPredictor.predictThreats(userId);

    if (predictions.length === 0) {
      return 'No historical threat data available for prediction. Once you accumulate threat history, we can make predictions.';
    }

    let response = `Based on your threat history, here are the predicted threats for the next 7 days:\n\n`;

    predictions.slice(0, 3).forEach((pred) => {
      response += `- **${pred.predictedType}**\n`;
      response += `  - Probability: ${Math.round(pred.probability)}%\n`;
      response += `  - Severity: ${pred.severity.toUpperCase()}\n`;
      response += `  - Confidence: ${Math.round(pred.confidence)}%\n\n`;
    });

    return response;
  }

  /**
   * Lookup threat intelligence
   */
  private lookupThreatIntelligence(parsed: ParsedQuery): string {
    const stats = threatIntelligenceEngine.getStatistics();

    let response = `**Threat Intelligence Summary**\n\n`;
    response += `- Total Indicators: ${stats.totalIndicators.toLocaleString()}\n`;
    response += `- Active Threat Feeds: ${stats.totalFeeds}\n`;
    response += `- Critical Threats: ${stats.criticalThreats.toLocaleString()}\n`;
    response += `- Threat Patterns Tracked: ${stats.totalPatterns}\n`;

    if (parsed.entities.length > 0) {
      response += '\n**Analysis Results**\n\n';
      parsed.entities.forEach((entity) => {
        const threat = threatIntelligenceEngine.checkIndicator(entity.value, entity.type as any);
        if (threat) {
          response += `- ${entity.value}: MALICIOUS (${threat.confidence}% confidence)\n`;
        } else {
          response += `- ${entity.value}: Not found in threat feeds\n`;
        }
      });
    }

    return response;
  }

  /**
   * Assess risk
   */
  private assessRisk(
    parsed: ParsedQuery,
    organizationId: string
  ): string {
    let response = '**Risk Assessment**\n\n';

    const threatCount = parsed.entities.filter((e) =>
      threatIntelligenceEngine.checkIndicator(e.value, e.type as any)
    ).length;

    if (threatCount > 0) {
      response += `⚠️ **HIGH RISK** - ${threatCount} malicious indicator(s) detected\n\n`;
      response += 'Recommended Actions:\n';
      response += '1. Immediately isolate affected systems\n';
      response += '2. Initiate incident response procedures\n';
      response += '3. Notify security team and management\n';
      response += '4. Document all findings and evidence\n';
    } else {
      response += '✅ **LOW RISK** - No known threats detected\n\n';
      response += 'Recommendations:\n';
      response += '1. Continue regular monitoring\n';
      response += '2. Update threat intelligence feeds\n';
      response += '3. Maintain security awareness training\n';
    }

    return response;
  }

  /**
   * Suggest incident response
   */
  private suggestIncidentResponse(parsed: ParsedQuery): string {
    let response = '**Incident Response Guidance**\n\n';

    // Determine threat type
    const threatTypeEntity = parsed.entities.find((e) => e.type === 'threat-type');

    if (threatTypeEntity) {
      response += `**Response Plan for ${threatTypeEntity.value.toUpperCase()}**\n\n`;
    }

    response += '1. **Containment**\n';
    response += '   - Isolate affected systems\n';
    response += '   - Disable compromised accounts\n';
    response += '   - Block malicious IPs/domains\n\n';

    response += '2. **Investigation**\n';
    response += '   - Collect forensic evidence\n';
    response += '   - Review logs and alerts\n';
    response += '   - Determine scope and impact\n\n';

    response += '3. **Eradication**\n';
    response += '   - Remove malware/malicious code\n';
    response += '   - Patch vulnerabilities\n';
    response += '   - Reset compromised credentials\n\n';

    response += '4. **Recovery**\n';
    response += '   - Restore systems from clean backups\n';
    response += '   - Verify system functionality\n';
    response += '   - Monitor for signs of re-infection\n';

    return response;
  }

  /**
   * Suggest security best practices
   */
  private suggestBestPractices(parsed: ParsedQuery): string {
    let response = '**Security Best Practices**\n\n';

    response += '1. **Email Security**\n';
    response += '   - Enable multi-factor authentication\n';
    response += '   - Use email filtering and anti-phishing tools\n';
    response += '   - Train users on phishing awareness\n\n';

    response += '2. **Network Security**\n';
    response += '   - Implement network segmentation\n';
    response += '   - Use firewalls and intrusion detection\n';
    response += '   - Monitor for suspicious activities\n\n';

    response += '3. **Data Protection**\n';
    response += '   - Encrypt sensitive data at rest and in transit\n';
    response += '   - Implement access controls\n';
    response += '   - Regular data backups\n\n';

    response += '4. **Threat Intelligence**\n';
    response += '   - Subscribe to threat feeds\n';
    response += '   - Participate in information sharing\n';
    response += '   - Regular security assessments\n';

    return response;
  }

  /**
   * Handle unknown intent
   */
  private handleUnknownIntent(query: string): string {
    return `I understand you're asking: "${query}"\n\nI can help with:\n- Threat analysis (analyze IPs, domains, files)\n- Threat predictions (forecast upcoming threats)\n- Threat intelligence (lookup threat feeds)\n- Risk assessment (evaluate security risks)\n- Incident response (guidance on handling breaches)\n- Security best practices (recommendations)\n\nPlease rephrase your question with more details.`;
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(
    parsed: ParsedQuery,
    history: NLPQuery[]
  ): string[] {
    const questions: string[] = [];

    if (parsed.intent === QueryIntent.THREAT_ANALYSIS) {
      questions.push('Would you like to see the full threat analysis details?');
      questions.push('Should I check for related threats?');
    } else if (parsed.intent === QueryIntent.THREAT_PREDICTION) {
      questions.push('What actions would you like to take based on these predictions?');
      questions.push('Do you want to see historical threat patterns?');
    } else if (parsed.intent === QueryIntent.INCIDENT_RESPONSE) {
      questions.push('Do you need help with containment steps?');
      questions.push('Would you like to create an incident report?');
    }

    if (history.length === 0) {
      questions.push('Can I help with any other security concerns?');
    }

    return questions.slice(0, 3);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(userId: string): NLPQuery[] {
    return this.queryHistory.get(userId) || [];
  }

  /**
   * Clear conversation context
   */
  clearContext(userId: string, organizationId: string): void {
    const contextKey = `${userId}-${organizationId}`;
    this.dialogContexts.delete(contextKey);
  }
}

// Export singleton instance
export const nlpAnalyzer = new NLPAnalyzer();

// Export types and class for testing
export { NLPAnalyzer };
