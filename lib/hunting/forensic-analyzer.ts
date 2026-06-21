/**
 * Forensic Analyzer - Advanced forensic analysis tools
 * File, network, system, and timeline analysis
 */

export interface FileAnalysis {
  fileId: string;
  path: string;
  name: string;
  size: number;
  type: string;
  hashes: {
    md5: string;
    sha1: string;
    sha256: string;
  };
  metadata: {
    created: Date;
    modified: Date;
    accessed: Date;
    owner?: string;
    permissions?: string;
  };
  signatureInfo?: {
    signed: boolean;
    signer?: string;
    valid: boolean;
  };
  contentAnalysis?: {
    entropy: number; // 0-8, higher = more likely encrypted/binary
    suspiciousStrings: string[];
    detectedLanguage?: string;
  };
}

export interface NetworkAnalysis {
  sessionId: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: string;
  packets: number;
  bytes: number;
  startTime: Date;
  endTime: Date;
  flags?: string[];
  payloadAnalysis?: {
    suspicious: boolean;
    keywords: string[];
    entropy: number;
  };
}

export interface ProcessAnalysis {
  processId: number;
  name: string;
  parentProcessId?: number;
  path?: string;
  commandLine?: string;
  startTime: Date;
  endTime?: Date;
  user?: string;
  privileges?: string[];
  injected?: boolean;
  suspiciousActivity?: string[];
  parentProcess?: ProcessAnalysis;
  childProcesses?: ProcessAnalysis[];
}

export interface SystemTimeline {
  timelineId: string;
  startTime: Date;
  endTime: Date;
  events: Array<{
    timestamp: Date;
    type: string; // file_created, file_modified, process_started, network_connection, etc.
    resource: string;
    details: Record<string, unknown>;
    severity?: "low" | "medium" | "high" | "critical";
  }>;
  correlations: Array<{
    event1Index: number;
    event2Index: number;
    relationType: string;
  }>;
}

export interface ForensicReport {
  reportId: string;
  caseId: string;
  analysisDate: Date;
  fileAnalyses: FileAnalysis[];
  networkAnalyses: NetworkAnalysis[];
  processAnalyses: ProcessAnalysis[];
  systemTimeline: SystemTimeline;
  findings: Array<{
    category: string;
    severity: string;
    description: string;
    evidence: string[];
  }>;
  recommendations: string[];
}

export class ForensicAnalyzer {
  private fileAnalyses: Map<string, FileAnalysis> = new Map();
  private networkAnalyses: Map<string, NetworkAnalysis> = new Map();
  private processAnalyses: Map<string, ProcessAnalysis> = new Map();
  private timelines: Map<string, SystemTimeline> = new Map();
  private reports: Map<string, ForensicReport> = new Map();

  /**
   * Analyze file
   */
  async analyzeFile(
    filePath: string,
    options: {
      hashContent?: boolean;
      analyzeContent?: boolean;
      checkSignature?: boolean;
    } = {}
  ): Promise<FileAnalysis> {
    const fileId = `file-${Date.now()}`;

    // Simulate file analysis
    const analysis: FileAnalysis = {
      fileId,
      path: filePath,
      name: filePath.split("/").pop() || "unknown",
      size: Math.floor(Math.random() * 10000000), // Simulated size
      type: this.getFileType(filePath),
      hashes: {
        md5: this.generateHash("md5"),
        sha1: this.generateHash("sha1"),
        sha256: this.generateHash("sha256"),
      },
      metadata: {
        created: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        modified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        accessed: new Date(),
      },
    };

    if (options.checkSignature) {
      analysis.signatureInfo = {
        signed: Math.random() > 0.5,
        signer: Math.random() > 0.5 ? "Microsoft Corporation" : undefined,
        valid: true,
      };
    }

    if (options.analyzeContent) {
      analysis.contentAnalysis = {
        entropy: Math.random() * 8,
        suspiciousStrings: this.findSuspiciousStrings(filePath),
      };
    }

    this.fileAnalyses.set(fileId, analysis);
    return analysis;
  }

  /**
   * Analyze network traffic
   */
  async analyzeNetworkTraffic(
    sourceIp: string,
    destinationIp: string,
    packets: Array<{
      sourcePort: number;
      destinationPort: number;
      protocol: string;
      payloadSize: number;
      timestamp: Date;
    }>
  ): Promise<NetworkAnalysis> {
    if (packets.length === 0) {
      throw new Error("No packets to analyze");
    }

    const sessionId = `net-${Date.now()}`;

    const analysis: NetworkAnalysis = {
      sessionId,
      sourceIp,
      destinationIp,
      sourcePort: packets[0].sourcePort,
      destinationPort: packets[0].destinationPort,
      protocol: packets[0].protocol,
      packets: packets.length,
      bytes: packets.reduce((sum, p) => sum + p.payloadSize, 0),
      startTime: packets[0].timestamp,
      endTime: packets[packets.length - 1].timestamp,
      payloadAnalysis: {
        suspicious: this.isSuspiciousTraffic(sourceIp, destinationIp),
        keywords: this.extractPayloadKeywords(packets),
        entropy: Math.random() * 8,
      },
    };

    this.networkAnalyses.set(sessionId, analysis);
    return analysis;
  }

  /**
   * Analyze process tree
   */
  async analyzeProcessTree(
    processData: Array<{
      processId: number;
      name: string;
      parentProcessId?: number;
      path?: string;
      commandLine?: string;
      startTime: Date;
      endTime?: Date;
      user?: string;
    }>
  ): Promise<ProcessAnalysis[]> {
    const analyses: ProcessAnalysis[] = [];
    const processMap = new Map<number, ProcessAnalysis>();

    // First pass: create all processes
    for (const proc of processData) {
      const analysis: ProcessAnalysis = {
        processId: proc.processId,
        name: proc.name,
        path: proc.path,
        commandLine: proc.commandLine,
        startTime: proc.startTime,
        endTime: proc.endTime,
        user: proc.user,
        injected: this.detectProcessInjection(proc),
        suspiciousActivity: this.detectSuspiciousBehavior(proc),
      };

      processMap.set(proc.processId, analysis);
      this.processAnalyses.set(`proc-${proc.processId}`, analysis);
    }

    // Second pass: build hierarchy
    for (const proc of processData) {
      const analysis = processMap.get(proc.processId);
      if (analysis && proc.parentProcessId) {
        analysis.parentProcessId = proc.parentProcessId;
        const parent = processMap.get(proc.parentProcessId);
        if (parent) {
          analysis.parentProcess = parent;
          if (!parent.childProcesses) {
            parent.childProcesses = [];
          }
          parent.childProcesses.push(analysis);
        }
      }

      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Build system timeline from events
   */
  async buildSystemTimeline(
    events: Array<{
      timestamp: Date;
      type: string;
      resource: string;
      details: Record<string, unknown>;
      severity?: string;
    }>
  ): Promise<SystemTimeline> {
    const timelineId = `timeline-${Date.now()}`;

    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const timeline: SystemTimeline = {
      timelineId,
      startTime: sortedEvents[0]?.timestamp || new Date(),
      endTime: sortedEvents[sortedEvents.length - 1]?.timestamp || new Date(),
      events: sortedEvents.map(e => ({
        timestamp: e.timestamp,
        type: e.type,
        resource: e.resource,
        details: e.details,
        severity: e.severity as any,
      })),
      correlations: [],
    };

    // Find correlations between events
    for (let i = 0; i < timeline.events.length; i++) {
      for (let j = i + 1; j < timeline.events.length; j++) {
        const event1 = timeline.events[i];
        const event2 = timeline.events[j];

        // Check if events are related
        if (this.areEventsCorrelated(event1, event2)) {
          const timeDiff = event2.timestamp.getTime() - event1.timestamp.getTime();

          // Only correlate if within reasonable time window (1 hour)
          if (timeDiff < 60 * 60 * 1000) {
            timeline.correlations.push({
              event1Index: i,
              event2Index: j,
              relationType: this.determineCorrelationType(event1, event2),
            });
          }
        }
      }
    }

    this.timelines.set(timelineId, timeline);
    return timeline;
  }

  /**
   * Generate comprehensive forensic report
   */
  async generateForensicReport(
    caseId: string,
    fileAnalyses: FileAnalysis[],
    networkAnalyses: NetworkAnalysis[],
    processAnalyses: ProcessAnalysis[],
    timeline: SystemTimeline
  ): Promise<ForensicReport> {
    const reportId = `report-${Date.now()}`;

    const findings = this.identifyFindings(
      fileAnalyses,
      networkAnalyses,
      processAnalyses,
      timeline
    );

    const report: ForensicReport = {
      reportId,
      caseId,
      analysisDate: new Date(),
      fileAnalyses,
      networkAnalyses,
      processAnalyses,
      systemTimeline: timeline,
      findings,
      recommendations: this.generateRecommendations(findings),
    };

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Get forensic report
   */
  async getReport(reportId: string): Promise<ForensicReport | null> {
    return this.reports.get(reportId) || null;
  }

  /**
   * Export forensic report
   */
  async exportReport(reportId: string, format: "json" | "html" = "json"): Promise<string> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    switch (format) {
      case "json":
        return JSON.stringify(report, null, 2);

      case "html":
        return this.generateHtmlReport(report);

      default:
        return JSON.stringify(report, null, 2);
    }
  }

  /**
   * Search artifacts in timeline
   */
  async searchTimeline(
    timelineId: string,
    query: {
      eventType?: string;
      resourcePattern?: string;
      severityLevel?: string;
      timeRange?: { start: Date; end: Date };
    }
  ): Promise<SystemTimeline["events"]> {
    const timeline = this.timelines.get(timelineId);
    if (!timeline) {
      return [];
    }

    let results = timeline.events;

    if (query.eventType) {
      results = results.filter(e => e.type.includes(query.eventType!));
    }

    if (query.resourcePattern) {
      const pattern = new RegExp(query.resourcePattern, "i");
      results = results.filter(e => pattern.test(e.resource));
    }

    if (query.severityLevel) {
      results = results.filter(e => e.severity === query.severityLevel);
    }

    if (query.timeRange) {
      results = results.filter(
        e =>
          e.timestamp >= query.timeRange!.start &&
          e.timestamp <= query.timeRange!.end
      );
    }

    return results;
  }

  /**
   * Get file type
   */
  private getFileType(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase() || "unknown";
    if (["exe", "dll", "sys", "drv"].includes(ext)) return "executable";
    if (["txt", "log", "csv", "json"].includes(ext)) return "document";
    if (["jpg", "png", "gif", "bmp"].includes(ext)) return "image";
    if (["zip", "rar", "7z", "tar"].includes(ext)) return "archive";
    return ext;
  }

  /**
   * Generate hash (simulated)
   */
  private generateHash(algorithm: string): string {
    const prefix = algorithm === "md5" ? "" : algorithm === "sha1" ? "" : "";
    return prefix + Math.random().toString(36).substr(2).padEnd(40, "0").substr(0, 40);
  }

  /**
   * Find suspicious strings in file path
   */
  private findSuspiciousStrings(filePath: string): string[] {
    const suspicious = [
      "temp",
      "appdata",
      "programdata",
      "windows\\system32",
      "malware",
      "trojan",
      "virus",
    ];

    const found: string[] = [];
    const lower = filePath.toLowerCase();

    for (const pattern of suspicious) {
      if (lower.includes(pattern)) {
        found.push(pattern);
      }
    }

    return found;
  }

  /**
   * Detect process injection
   */
  private detectProcessInjection(proc: any): boolean {
    // Heuristics for process injection detection
    if (proc.name === "svchost.exe" && proc.parentProcessId !== 1) return true;
    if (proc.commandLine && proc.commandLine.includes("-e")) return true;
    if (proc.name === "cmd.exe" && proc.parentProcessId !== 1) return true;

    return Math.random() > 0.9; // 10% chance of false positive
  }

  /**
   * Detect suspicious behavior
   */
  private detectSuspiciousBehavior(proc: any): string[] {
    const suspicious: string[] = [];

    if (proc.path && proc.path.includes("temp")) {
      suspicious.push("Executable from temp directory");
    }

    if (proc.commandLine && proc.commandLine.includes("cmd.exe")) {
      suspicious.push("Command shell spawned");
    }

    if (proc.commandLine && proc.commandLine.toLowerCase().includes("powershell")) {
      suspicious.push("PowerShell executed");
    }

    return suspicious;
  }

  /**
   * Check if traffic is suspicious
   */
  private isSuspiciousTraffic(sourceIp: string, destinationIp: string): boolean {
    // Simple heuristics
    if (destinationIp.startsWith("192.")) return true; // Private IP
    if (this.isPrivateIp(sourceIp) && !this.isPrivateIp(destinationIp)) return false; // Normal outbound

    return Math.random() > 0.85; // 15% base suspicion rate
  }

  /**
   * Check if IP is private
   */
  private isPrivateIp(ip: string): boolean {
    return ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.");
  }

  /**
   * Extract payload keywords
   */
  private extractPayloadKeywords(packets: any[]): string[] {
    const keywords = ["GET", "POST", "HTTP", "SQL", "INJECT", "SELECT"];
    const found: string[] = [];

    // Simulate keyword extraction
    for (const keyword of keywords) {
      if (Math.random() > 0.7) {
        found.push(keyword);
      }
    }

    return found;
  }

  /**
   * Check if events are correlated
   */
  private areEventsCorrelated(
    event1: SystemTimeline["events"][0],
    event2: SystemTimeline["events"][0]
  ): boolean {
    // Same resource or related types
    if (event1.resource === event2.resource) return true;

    const relatedTypes = [
      ["file_created", "file_modified"],
      ["process_started", "file_created"],
      ["network_connection", "process_started"],
    ];

    for (const [type1, type2] of relatedTypes) {
      if (
        (event1.type === type1 && event2.type === type2) ||
        (event1.type === type2 && event2.type === type1)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determine correlation type
   */
  private determineCorrelationType(event1: any, event2: any): string {
    if (event1.resource === event2.resource) return "same_resource";
    if (event1.timestamp < event2.timestamp) return "causality";
    return "temporal";
  }

  /**
   * Identify findings
   */
  private identifyFindings(
    fileAnalyses: FileAnalysis[],
    networkAnalyses: NetworkAnalysis[],
    processAnalyses: ProcessAnalysis[],
    timeline: SystemTimeline
  ): ForensicReport["findings"] {
    const findings: ForensicReport["findings"] = [];

    // Check file suspicious content
    for (const file of fileAnalyses) {
      if (file.contentAnalysis && file.contentAnalysis.entropy > 7) {
        findings.push({
          category: "File Analysis",
          severity: "high",
          description: `File ${file.name} has high entropy (${file.contentAnalysis.entropy.toFixed(2)}), may be encrypted or binary`,
          evidence: [file.fileId],
        });
      }
    }

    // Check network suspicious activity
    for (const net of networkAnalyses) {
      if (net.payloadAnalysis?.suspicious) {
        findings.push({
          category: "Network Analysis",
          severity: "high",
          description: `Suspicious network traffic from ${net.sourceIp}:${net.sourcePort} to ${net.destinationIp}:${net.destinationPort}`,
          evidence: [net.sessionId],
        });
      }
    }

    // Check process suspicious activity
    for (const proc of processAnalyses) {
      if (proc.injected) {
        findings.push({
          category: "Process Analysis",
          severity: "critical",
          description: `Process injection detected in ${proc.name} (PID: ${proc.processId})`,
          evidence: [`proc-${proc.processId}`],
        });
      }
    }

    return findings;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(findings: ForensicReport["findings"]): string[] {
    const recommendations: string[] = [];

    const hasCritical = findings.some(f => f.severity === "critical");
    const hasHigh = findings.some(f => f.severity === "high");

    if (hasCritical) {
      recommendations.push("URGENT: Isolate affected systems immediately");
      recommendations.push("Preserve all forensic evidence");
      recommendations.push("Notify incident response team");
    }

    if (hasHigh) {
      recommendations.push("Review and patch affected systems");
      recommendations.push("Monitor for lateral movement");
      recommendations.push("Update security rules based on findings");
    }

    recommendations.push("Review access logs for unauthorized access");
    recommendations.push("Implement additional monitoring");

    return recommendations;
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(report: ForensicReport): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Forensic Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1f2937; border-bottom: 3px solid #ef4444; }
        h2 { color: #374151; margin-top: 30px; }
        .finding { margin: 15px 0; padding: 15px; border-left: 4px solid #ef4444; background: #fef2f2; }
        .critical { border-left-color: #dc2626; }
        .high { border-left-color: #ea580c; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f3f4f6; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Forensic Analysis Report</h1>
    <p><strong>Case ID:</strong> ${report.caseId}</p>
    <p><strong>Analysis Date:</strong> ${report.analysisDate.toISOString()}</p>

    <h2>Findings (${report.findings.length})</h2>
`;

    for (const finding of report.findings) {
      html += `
        <div class="finding ${finding.severity}">
            <strong>${finding.category}</strong> - ${finding.severity.toUpperCase()}<br/>
            ${finding.description}
        </div>
`;
    }

    html += `
    <h2>Recommendations</h2>
    <ol>
`;

    for (const rec of report.recommendations) {
      html += `<li>${rec}</li>`;
    }

    html += `
    </ol>
</body>
</html>
`;

    return html;
  }
}

export default ForensicAnalyzer;
