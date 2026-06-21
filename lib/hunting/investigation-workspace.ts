/**
 * Investigation Workspace - Forensic investigation environment
 * Supports timeline reconstruction, evidence correlation, pivot analysis
 */

export interface Investigation {
  investigationId: string;
  caseId: string;
  title: string;
  description?: string;
  status: "open" | "in-progress" | "on-hold" | "closed" | "escalated";
  severity: "low" | "medium" | "high" | "critical";
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  dueDate?: Date;
  assignedTo?: string[];
  tags?: string[];
}

export interface TimelineEntry {
  entryId: string;
  timestamp: Date;
  eventType: string;
  source: string; // logs, file, memory, network, etc.
  description: string;
  severity?: "low" | "medium" | "high" | "critical";
  artifactIds?: string[];
  notes?: string;
}

export interface EvidenceCorrelation {
  correlationId: string;
  artifactIds: string[];
  correlationType: "temporal" | "spatial" | "causal" | "relational";
  strength: number; // 0-1
  description: string;
  timeline?: {
    firstEvent: Date;
    lastEvent: Date;
    duration: number;
  };
}

export interface PivotAnalysis {
  pivotId: string;
  investigationId: string;
  pivotType: "email" | "domain" | "ip" | "hash" | "user" | "file" | "process";
  pivotValue: string;
  relatedEntities: Array<{
    type: string;
    value: string;
    count: number;
    lastSeen: Date;
  }>;
  riskScore: number;
  connections: number;
}

export interface QueryBuilder {
  queryId: string;
  investigationId: string;
  name: string;
  description?: string;
  dataSource: string; // logs, events, files, etc.
  filters: Array<{
    field: string;
    operator: "equals" | "contains" | "regex" | "gt" | "lt" | "between";
    value: string | number | string[];
  }>;
  aggregations?: Array<{
    field: string;
    function: "count" | "sum" | "avg" | "min" | "max" | "distinct";
  }>;
  timeRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
}

export class InvestigationWorkspace {
  private investigations: Map<string, Investigation> = new Map();
  private timelines: Map<string, TimelineEntry[]> = new Map();
  private correlations: Map<string, EvidenceCorrelation> = new Map();
  private pivots: Map<string, PivotAnalysis> = new Map();
  private queries: Map<string, QueryBuilder> = new Map();

  /**
   * Create a new investigation
   */
  async createInvestigation(
    caseId: string,
    title: string,
    createdBy: string,
    options: {
      description?: string;
      severity?: Investigation["severity"];
      dueDate?: Date;
    } = {}
  ): Promise<Investigation> {
    const investigationId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const investigation: Investigation = {
      investigationId,
      caseId,
      title,
      description: options.description,
      status: "open",
      severity: options.severity || "medium",
      createdAt: new Date(),
      createdBy,
      updatedAt: new Date(),
      updatedBy: createdBy,
      dueDate: options.dueDate,
      assignedTo: [createdBy],
      tags: [],
    };

    this.investigations.set(investigationId, investigation);
    this.timelines.set(investigationId, []);

    return investigation;
  }

  /**
   * Get investigation
   */
  async getInvestigation(investigationId: string): Promise<Investigation | null> {
    return this.investigations.get(investigationId) || null;
  }

  /**
   * Update investigation
   */
  async updateInvestigation(
    investigationId: string,
    updates: Partial<Investigation>
  ): Promise<Investigation> {
    const investigation = this.investigations.get(investigationId);
    if (!investigation) {
      throw new Error(`Investigation ${investigationId} not found`);
    }

    const updated = {
      ...investigation,
      ...updates,
      updatedAt: new Date(),
    };

    this.investigations.set(investigationId, updated);
    return updated;
  }

  /**
   * Add event to timeline
   */
  async addTimelineEntry(
    investigationId: string,
    entry: Omit<TimelineEntry, "entryId">
  ): Promise<TimelineEntry> {
    const timeline = this.timelines.get(investigationId);
    if (!timeline) {
      throw new Error(`Investigation ${investigationId} not found`);
    }

    const entryId = `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timelineEntry: TimelineEntry = {
      ...entry,
      entryId,
    };

    timeline.push(timelineEntry);

    // Keep timeline sorted by timestamp
    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return timelineEntry;
  }

  /**
   * Get investigation timeline
   */
  async getTimeline(investigationId: string): Promise<TimelineEntry[]> {
    return this.timelines.get(investigationId) || [];
  }

  /**
   * Build timeline from logs
   */
  async buildTimelineFromLogs(
    investigationId: string,
    logs: Array<{
      timestamp: Date;
      source: string;
      message: string;
      severity?: string;
    }>
  ): Promise<TimelineEntry[]> {
    const timeline: TimelineEntry[] = [];

    for (const log of logs) {
      const entry = await this.addTimelineEntry(investigationId, {
        timestamp: log.timestamp,
        eventType: this.classifyEventType(log.message),
        source: log.source,
        description: log.message,
        severity: this.mapSeverity(log.severity),
      });

      timeline.push(entry);
    }

    return timeline;
  }

  /**
   * Create evidence correlation
   */
  async createCorrelation(
    investigationId: string,
    artifactIds: string[],
    correlationType: EvidenceCorrelation["correlationType"],
    description: string
  ): Promise<EvidenceCorrelation> {
    const correlationId = `corr-${Date.now()}`;

    const correlation: EvidenceCorrelation = {
      correlationId,
      artifactIds,
      correlationType,
      strength: 0.7, // Default confidence
      description,
    };

    this.correlations.set(correlationId, correlation);

    return correlation;
  }

  /**
   * Get correlations for investigation
   */
  async getCorrelations(investigationId: string): Promise<EvidenceCorrelation[]> {
    // In a real implementation, filter by investigation
    return Array.from(this.correlations.values());
  }

  /**
   * Analyze pivot relationships
   */
  async analyzePivot(
    investigationId: string,
    pivotType: PivotAnalysis["pivotType"],
    pivotValue: string,
    relatedData: Array<{
      type: string;
      value: string;
      count: number;
      lastSeen: Date;
    }>
  ): Promise<PivotAnalysis> {
    const pivotId = `pivot-${Date.now()}`;

    // Calculate risk score based on related entities
    const riskScore = this.calculatePivotRiskScore(relatedData);

    const pivot: PivotAnalysis = {
      pivotId,
      investigationId,
      pivotType,
      pivotValue,
      relatedEntities: relatedData,
      riskScore,
      connections: relatedData.length,
    };

    this.pivots.set(pivotId, pivot);

    return pivot;
  }

  /**
   * Email pivot analysis (email → domain → IP → user)
   */
  async pivotFromEmail(
    investigationId: string,
    emailAddress: string
  ): Promise<{
    email: PivotAnalysis;
    domain: PivotAnalysis | null;
    ips: PivotAnalysis[];
    users: PivotAnalysis[];
  }> {
    // Parse email
    const [localPart, domain] = emailAddress.split("@");

    // Email pivot
    const emailPivot = await this.analyzePivot(
      investigationId,
      "email",
      emailAddress,
      [
        {
          type: "domain",
          value: domain,
          count: 5,
          lastSeen: new Date(),
        },
      ]
    );

    // Domain pivot
    const domainPivot = domain
      ? await this.analyzePivot(investigationId, "domain", domain, [
          {
            type: "ip",
            value: "192.168.1.1",
            count: 3,
            lastSeen: new Date(),
          },
        ])
      : null;

    // IP pivots (simplified)
    const ipPivots: PivotAnalysis[] = [];

    // User pivots (simplified)
    const userPivots: PivotAnalysis[] = [];

    return {
      email: emailPivot,
      domain: domainPivot,
      ips: ipPivots,
      users: userPivots,
    };
  }

  /**
   * Create complex search query
   */
  async createQuery(
    investigationId: string,
    name: string,
    dataSource: string,
    options: {
      description?: string;
      timeRange?: { start: Date; end: Date };
      limit?: number;
    } = {}
  ): Promise<QueryBuilder> {
    const queryId = `query-${Date.now()}`;

    const query: QueryBuilder = {
      queryId,
      investigationId,
      name,
      description: options.description,
      dataSource,
      filters: [],
      timeRange: options.timeRange,
      limit: options.limit || 1000,
    };

    this.queries.set(queryId, query);

    return query;
  }

  /**
   * Add filter to query
   */
  async addFilter(
    queryId: string,
    field: string,
    operator: QueryBuilder["filters"][0]["operator"],
    value: string | number | string[]
  ): Promise<QueryBuilder> {
    const query = this.queries.get(queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    query.filters.push({ field, operator, value });

    return query;
  }

  /**
   * Add aggregation to query
   */
  async addAggregation(
    queryId: string,
    field: string,
    func: "count" | "sum" | "avg" | "min" | "max" | "distinct"
  ): Promise<QueryBuilder> {
    const query = this.queries.get(queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    if (!query.aggregations) {
      query.aggregations = [];
    }

    query.aggregations.push({ field, function: func });

    return query;
  }

  /**
   * Execute query (simulated)
   */
  async executeQuery(queryId: string): Promise<{
    queryId: string;
    rowCount: number;
    executionTime: number;
    results: unknown[];
  }> {
    const query = this.queries.get(queryId);
    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    // Simulate query execution
    const startTime = Date.now();

    // In production, execute against data source
    const results: unknown[] = [];

    const executionTime = Date.now() - startTime;

    return {
      queryId,
      rowCount: results.length,
      executionTime,
      results,
    };
  }

  /**
   * Get saved queries
   */
  async getQueries(investigationId: string): Promise<QueryBuilder[]> {
    return Array.from(this.queries.values()).filter(
      q => q.investigationId === investigationId
    );
  }

  /**
   * Export investigation findings
   */
  async exportFindings(investigationId: string, format: "json" | "html" | "csv" = "json"): Promise<string> {
    const investigation = this.investigations.get(investigationId);
    if (!investigation) {
      throw new Error(`Investigation ${investigationId} not found`);
    }

    const timeline = this.timelines.get(investigationId) || [];
    const correlations = Array.from(this.correlations.values());
    const pivots = Array.from(this.pivots.values()).filter(p => p.investigationId === investigationId);

    const data = {
      investigation,
      timeline,
      correlations,
      pivots,
      exportedAt: new Date(),
    };

    switch (format) {
      case "json":
        return JSON.stringify(data, null, 2);

      case "html":
        return this.generateHtmlReport(data);

      case "csv":
        return this.generateCsvReport(timeline);

      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Calculate pivot risk score
   */
  private calculatePivotRiskScore(relatedData: Array<{ count: number }>): number {
    const totalConnections = relatedData.reduce((sum, d) => sum + d.count, 0);

    // Risk increases with more connections
    if (totalConnections > 50) return 0.95;
    if (totalConnections > 20) return 0.75;
    if (totalConnections > 10) return 0.55;
    if (totalConnections > 5) return 0.35;
    return 0.15;
  }

  /**
   * Classify event type from log message
   */
  private classifyEventType(message: string): string {
    const msg = message.toLowerCase();

    if (msg.includes("error") || msg.includes("failed")) return "error";
    if (msg.includes("success") || msg.includes("completed")) return "success";
    if (msg.includes("login") || msg.includes("authentication")) return "auth";
    if (msg.includes("access") || msg.includes("permission")) return "access";
    if (msg.includes("file")) return "file";
    if (msg.includes("network") || msg.includes("connection")) return "network";

    return "generic";
  }

  /**
   * Map severity strings
   */
  private mapSeverity(severity: string | undefined): "low" | "medium" | "high" | "critical" | undefined {
    if (!severity) return undefined;

    const sev = severity.toLowerCase();
    if (sev === "critical" || sev === "fatal") return "critical";
    if (sev === "high" || sev === "severe") return "high";
    if (sev === "medium" || sev === "warning") return "medium";
    return "low";
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(data: any): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Investigation Report - ${data.investigation.caseId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        .timeline { margin: 20px 0; }
        .event { margin: 10px 0; padding: 10px; border-left: 3px solid #3b82f6; background: #f0f9ff; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f3f4f6; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Investigation Report</h1>
    <p><strong>Case ID:</strong> ${data.investigation.caseId}</p>
    <p><strong>Title:</strong> ${data.investigation.title}</p>
    <p><strong>Status:</strong> ${data.investigation.status}</p>
    <p><strong>Severity:</strong> ${data.investigation.severity}</p>

    <h2>Timeline</h2>
    <div class="timeline">
`;

    for (const entry of data.timeline) {
      html += `
        <div class="event">
            <strong>${entry.timestamp.toISOString()}</strong> - ${entry.eventType}<br/>
            ${entry.description}
        </div>
`;
    }

    html += `
    </div>
    <h2>Correlations</h2>
    <table>
        <tr><th>Type</th><th>Artifacts</th><th>Strength</th></tr>
`;

    for (const corr of data.correlations) {
      html += `<tr><td>${corr.correlationType}</td><td>${corr.artifactIds.join(", ")}</td><td>${(corr.strength * 100).toFixed(0)}%</td></tr>`;
    }

    html += `
    </table>
</body>
</html>
`;

    return html;
  }

  /**
   * Generate CSV report
   */
  private generateCsvReport(timeline: TimelineEntry[]): string {
    let csv = "Timestamp,Event Type,Source,Description,Severity\n";

    for (const entry of timeline) {
      const timestamp = entry.timestamp.toISOString();
      const severity = entry.severity || "N/A";
      csv += `"${timestamp}","${entry.eventType}","${entry.source}","${entry.description}","${severity}"\n`;
    }

    return csv;
  }
}

export default InvestigationWorkspace;
