/**
 * Threat Hunting Workspace
 * Advanced threat hunting tools with query engine and collaborative workspace
 */

import {
  ThreatHuntingWorkspace,
  HuntQuery,
  ThreatFinding,
  QueryResult,
  WorkspaceEvent,
  WorkspaceMember,
  ProRole,
} from '@/types/pro-tier';

export class ThreatHuntingEngine {
  /**
   * Create a new threat hunting workspace
   */
  static async createWorkspace(
    name: string,
    description: string,
    owner: string
  ): Promise<ThreatHuntingWorkspace> {
    const workspace: ThreatHuntingWorkspace = {
      id: this.generateWorkspaceId(),
      name,
      description,
      status: 'active',
      owner,
      members: [
        {
          userId: owner,
          role: ProRole.ADMIN,
          joinedAt: new Date(),
        },
      ],
      queries: [],
      findings: [],
      timeline: [
        {
          id: this.generateEventId(),
          type: 'workspace_created',
          actor: owner,
          description: `Threat hunting workspace created: ${name}`,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return workspace;
  }

  /**
   * Add member to workspace
   */
  static async addWorkspaceMember(
    workspace: ThreatHuntingWorkspace,
    userId: string,
    role: ProRole
  ): Promise<ThreatHuntingWorkspace> {
    const member: WorkspaceMember = {
      userId,
      role,
      joinedAt: new Date(),
    };

    const updated = {
      ...workspace,
      members: [...workspace.members, member],
      timeline: [
        ...workspace.timeline,
        {
          id: this.generateEventId(),
          type: 'member_joined',
          actor: userId,
          description: `${userId} joined workspace with role ${role}`,
          timestamp: new Date(),
        },
      ],
      updatedAt: new Date(),
    };

    return updated;
  }

  /**
   * Create a hunting query
   */
  static async createHuntingQuery(
    workspaceId: string,
    name: string,
    queryType: 'kql' | 'sql' | 'eql' | 'yara' | 'sigma',
    query: string,
    targets: string[]
  ): Promise<HuntQuery> {
    const validation = await this.validateQuery(query, queryType);

    if (!validation.valid) {
      throw new Error(`Query validation failed: ${validation.errors.join(', ')}`);
    }

    const huntQuery: HuntQuery = {
      id: this.generateQueryId(),
      name,
      queryType,
      query,
      targets,
      isTemplate: false,
      status: 'saved',
      description: `Hunt query: ${name}`,
    };

    return huntQuery;
  }

  /**
   * Execute hunting query
   */
  static async executeQuery(query: HuntQuery): Promise<QueryResult[]> {
    const startTime = Date.now();

    // Simulate query execution
    const results: QueryResult[] = [];

    // In production, this would execute actual KQL/SQL/EQL queries
    for (let i = 0; i < Math.floor(Math.random() * 100); i++) {
      results.push({
        id: this.generateEventId(),
        eventId: `evt_${Date.now()}_${i}`,
        severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as any,
        data: {
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          host: `host-${Math.floor(Math.random() * 100)}`,
          user: `user${Math.floor(Math.random() * 10)}`,
          process: ['powershell', 'cmd.exe', 'wmic.exe', 'reg.exe'][
            Math.floor(Math.random() * 4)
          ],
        },
        timestamp: new Date(),
      });
    }

    const executionTime = Date.now() - startTime;

    // Update query with results
    return results;
  }

  /**
   * Add finding from query results
   */
  static async createFinding(
    workspaceId: string,
    huntQueryId: string,
    title: string,
    description: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    affectedSystems: string[],
    evidence: string[]
  ): Promise<ThreatFinding> {
    const finding: ThreatFinding = {
      id: this.generateFindingId(),
      huntQueryId,
      title,
      description,
      severity,
      status: 'new',
      affectedSystems,
      evidence,
      recommendations: this.generateRecommendations(severity),
      discoveredAt: new Date(),
    };

    return finding;
  }

  /**
   * Update finding status
   */
  static async updateFindingStatus(
    finding: ThreatFinding,
    status: 'new' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved'
  ): Promise<ThreatFinding> {
    return {
      ...finding,
      status,
      resolvedAt: status === 'resolved' ? new Date() : undefined,
    };
  }

  /**
   * Correlate findings across workspace
   */
  static async correlateFindingsInWorkspace(
    workspace: ThreatHuntingWorkspace
  ): Promise<Array<{ finding1: ThreatFinding; finding2: ThreatFinding; correlation: number }>> {
    const correlations: Array<{
      finding1: ThreatFinding;
      finding2: ThreatFinding;
      correlation: number;
    }> = [];

    for (let i = 0; i < workspace.findings.length; i++) {
      for (let j = i + 1; j < workspace.findings.length; j++) {
        const finding1 = workspace.findings[i];
        const finding2 = workspace.findings[j];

        const correlation = this.calculateFindingCorrelation(finding1, finding2);

        if (correlation > 0.4) {
          correlations.push({ finding1, finding2, correlation });
        }
      }
    }

    return correlations.sort((a, b) => b.correlation - a.correlation);
  }

  /**
   * Calculate threat score for findings
   */
  static calculateThreatScore(findings: ThreatFinding[]): number {
    let score = 0;

    const severityWeights = {
      critical: 40,
      high: 25,
      medium: 15,
      low: 5,
    };

    const statusWeights = {
      confirmed: 1.5,
      investigating: 1.2,
      new: 1.0,
      false_positive: 0,
      resolved: 0,
    };

    findings.forEach((finding) => {
      const severityScore = severityWeights[finding.severity];
      const statusMultiplier = statusWeights[finding.status];
      score += severityScore * statusMultiplier;
    });

    return Math.min(100, Math.round(score));
  }

  /**
   * Generate hunt report
   */
  static async generateHuntReport(
    workspace: ThreatHuntingWorkspace
  ): Promise<{
    summary: {
      queriesExecuted: number;
      findingsDiscovered: number;
      confirmedThreats: number;
      falsePositives: number;
      huntDuration: string;
    };
    findings: ThreatFinding[];
    topThreats: Array<{ threat: string; count: number; severity: string }>;
    recommendations: string[];
  }> {
    const confirmedFindings = workspace.findings.filter((f) => f.status === 'confirmed');
    const falsePositives = workspace.findings.filter((f) => f.status === 'false_positive');

    // Calculate hunt duration
    const firstEvent = workspace.timeline[0];
    const lastEvent = workspace.timeline[workspace.timeline.length - 1];
    const duration = lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
    const durationHours = Math.floor(duration / (60 * 60 * 1000));

    // Top threats
    const threatMap = new Map<string, number>();
    workspace.findings.forEach((finding) => {
      const count = threatMap.get(finding.title) || 0;
      threatMap.set(finding.title, count + 1);
    });

    const topThreats = Array.from(threatMap.entries())
      .map(([threat, count]) => ({
        threat,
        count,
        severity: workspace.findings.find((f) => f.title === threat)?.severity || 'unknown',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recommendations
    const recommendations = this.generateHuntRecommendations(confirmedFindings);

    return {
      summary: {
        queriesExecuted: workspace.queries.length,
        findingsDiscovered: workspace.findings.length,
        confirmedThreats: confirmedFindings.length,
        falsePositives: falsePositives.length,
        huntDuration: `${durationHours} hours`,
      },
      findings: confirmedFindings,
      topThreats,
      recommendations,
    };
  }

  /**
   * Export workspace as report
   */
  static async exportWorkspace(
    workspace: ThreatHuntingWorkspace,
    format: 'json' | 'pdf' | 'csv'
  ): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(workspace, null, 2);
    }

    if (format === 'csv') {
      let csv = 'Finding,Severity,Status,Systems,Evidence Count,Discovered At\n';
      workspace.findings.forEach((finding) => {
        csv += `"${finding.title}","${finding.severity}","${finding.status}","${finding.affectedSystems.join(
          ';'
        )}",${finding.evidence.length},"${finding.discoveredAt.toISOString()}"\n`;
      });
      return csv;
    }

    // PDF format would be handled by a PDF library
    return 'PDF export not implemented';
  }

  /**
   * Create workspace timeline event
   */
  static addTimelineEvent(
    workspace: ThreatHuntingWorkspace,
    type: string,
    actor: string,
    description: string,
    details?: Record<string, any>
  ): WorkspaceEvent {
    const event: WorkspaceEvent = {
      id: this.generateEventId(),
      type: type as any,
      actor,
      description,
      timestamp: new Date(),
      details,
    };

    return event;
  }

  /**
   * Save hunting profile/template
   */
  static async saveHuntingProfile(
    workspace: ThreatHuntingWorkspace,
    profileName: string
  ): Promise<{
    profileId: string;
    name: string;
    queries: HuntQuery[];
    templates: Array<{ queryId: string; template: true }>;
  }> {
    const templates = workspace.queries
      .filter((q) => q.isTemplate)
      .map((q) => ({
        queryId: q.id,
        template: true as const,
      }));

    return {
      profileId: `profile_${Date.now()}`,
      name: profileName,
      queries: workspace.queries,
      templates,
    };
  }

  /**
   * Share workspace findings
   */
  static async shareWorkspaceFindings(
    workspace: ThreatHuntingWorkspace,
    recipientEmails: string[]
  ): Promise<{ shareId: string; recipients: string[]; expiresAt: Date }> {
    return {
      shareId: `share_${Date.now()}`,
      recipients: recipientEmails,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
  }

  // ============ HELPER METHODS ============

  private static async validateQuery(
    query: string,
    queryType: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!query || query.trim().length === 0) {
      errors.push('Query cannot be empty');
    }

    // Type-specific validation
    if (queryType === 'kql' && !this.isValidKQL(query)) {
      errors.push('Invalid KQL syntax');
    } else if (queryType === 'sql' && !this.isValidSQL(query)) {
      errors.push('Invalid SQL syntax');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static isValidKQL(query: string): boolean {
    // Basic KQL validation
    return query.length > 0 && !query.includes('DROP');
  }

  private static isValidSQL(query: string): boolean {
    // Basic SQL validation
    return (
      query.length > 0 &&
      /^SELECT/i.test(query) &&
      !query.toUpperCase().includes('DROP TABLE')
    );
  }

  private static calculateFindingCorrelation(finding1: ThreatFinding, finding2: ThreatFinding): number {
    let correlation = 0;

    // Same affected systems
    const commonSystems = finding1.affectedSystems.filter((s) =>
      finding2.affectedSystems.includes(s)
    );
    correlation += (commonSystems.length / Math.max(1, finding1.affectedSystems.length)) * 0.5;

    // Similar severity
    if (finding1.severity === finding2.severity) {
      correlation += 0.3;
    }

    // Same severity category
    if (
      (['critical', 'high'].includes(finding1.severity) &&
        ['critical', 'high'].includes(finding2.severity)) ||
      (['medium', 'low'].includes(finding1.severity) && ['medium', 'low'].includes(finding2.severity))
    ) {
      correlation += 0.2;
    }

    return Math.min(1, correlation);
  }

  private static generateRecommendations(severity: 'critical' | 'high' | 'medium' | 'low'): string[] {
    const recommendations: Record<string, string[]> = {
      critical: [
        'Isolate affected systems immediately',
        'Initiate incident response procedures',
        'Notify security team and leadership',
        'Begin forensic analysis',
      ],
      high: [
        'Isolate affected systems',
        'Conduct root cause analysis',
        'Implement containment measures',
        'Monitor for lateral movement',
      ],
      medium: [
        'Review access logs',
        'Patch vulnerable systems',
        'Monitor for similar indicators',
      ],
      low: [
        'Monitor for escalation',
        'Review and patch as needed',
      ],
    };

    return recommendations[severity] || [];
  }

  private static generateHuntRecommendations(findings: ThreatFinding[]): string[] {
    const recommendations: Set<string> = new Set();

    findings.forEach((finding) => {
      const baseRecs = this.generateRecommendations(finding.severity);
      baseRecs.forEach((rec) => recommendations.add(rec));
    });

    return Array.from(recommendations).slice(0, 5);
  }

  private static generateWorkspaceId(): string {
    return `hunt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateFindingId(): string {
    return `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Export threat hunting functions
 */
export const createWorkspace = ThreatHuntingEngine.createWorkspace.bind(ThreatHuntingEngine);
export const createHuntingQuery = ThreatHuntingEngine.createHuntingQuery.bind(
  ThreatHuntingEngine
);
export const executeQuery = ThreatHuntingEngine.executeQuery.bind(ThreatHuntingEngine);
export const createFinding = ThreatHuntingEngine.createFinding.bind(ThreatHuntingEngine);
export const generateHuntReport = ThreatHuntingEngine.generateHuntReport.bind(ThreatHuntingEngine);
