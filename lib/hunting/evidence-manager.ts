/**
 * Evidence Manager - Evidence management and chain of custody tracking
 * Artifact collection, preservation, and legal compliance
 */

export interface Artifact {
  artifactId: string;
  type: "file" | "memory" | "network" | "disk" | "log" | "email" | "registry";
  source: string;
  description?: string;
  hash: {
    md5?: string;
    sha1?: string;
    sha256?: string;
  };
  size: number; // bytes
  collected: Date;
  collectedBy: string;
  metadata?: Record<string, unknown>;
}

export interface ChainOfCustodyRecord {
  recordId: string;
  artifactId: string;
  action: "collected" | "transferred" | "analyzed" | "stored" | "released";
  timestamp: Date;
  actor: string;
  location?: string;
  reason?: string;
  notes?: string;
  signature?: string;
}

export interface EvidenceCase {
  caseId: string;
  title: string;
  description?: string;
  status: "open" | "under_review" | "closed" | "archived";
  artifacts: Artifact[];
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  legalHold?: {
    requested: Date;
    requestedBy: string;
    expiresAt?: Date;
    reason: string;
  };
  tags?: string[];
}

export interface ArtifactAnnotation {
  annotationId: string;
  artifactId: string;
  type: "tag" | "comment" | "finding" | "flag";
  content: string;
  createdAt: Date;
  createdBy: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export interface EvidenceExport {
  exportId: string;
  caseId: string;
  artifacts: Artifact[];
  chainOfCustody: ChainOfCustodyRecord[];
  annotations: ArtifactAnnotation[];
  exportedAt: Date;
  exportedBy: string;
  format: "json" | "xml" | "csv" | "zip";
  verified: boolean;
}

export class EvidenceManager {
  private cases: Map<string, EvidenceCase> = new Map();
  private artifacts: Map<string, Artifact> = new Map();
  private chainOfCustody: Map<string, ChainOfCustodyRecord[]> = new Map();
  private annotations: Map<string, ArtifactAnnotation[]> = new Map();
  private exports: Map<string, EvidenceExport> = new Map();

  /**
   * Create a new evidence case
   */
  async createCase(
    title: string,
    createdBy: string,
    options: {
      description?: string;
      legalHoldReason?: string;
    } = {}
  ): Promise<EvidenceCase> {
    const caseId = `case-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const evidenceCase: EvidenceCase = {
      caseId,
      title,
      description: options.description,
      status: "open",
      artifacts: [],
      createdAt: new Date(),
      createdBy,
      updatedAt: new Date(),
      updatedBy: createdBy,
      legalHold: options.legalHoldReason
        ? {
            requested: new Date(),
            requestedBy: createdBy,
            reason: options.legalHoldReason,
          }
        : undefined,
      tags: [],
    };

    this.cases.set(caseId, evidenceCase);
    this.chainOfCustody.set(caseId, []);

    return evidenceCase;
  }

  /**
   * Add artifact to case
   */
  async addArtifact(
    caseId: string,
    artifact: Omit<Artifact, "artifactId">
  ): Promise<Artifact> {
    const evidenceCase = this.cases.get(caseId);
    if (!evidenceCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    const artifactId = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newArtifact: Artifact = {
      ...artifact,
      artifactId,
    };

    this.artifacts.set(artifactId, newArtifact);
    evidenceCase.artifacts.push(newArtifact);

    // Record initial chain of custody
    await this.recordChainOfCustody(artifactId, "collected", artifact.collectedBy, {
      location: artifact.source,
      reason: "Initial collection",
    });

    this.chainOfCustody.set(artifactId, []);
    this.annotations.set(artifactId, []);

    evidenceCase.updatedAt = new Date();
    this.cases.set(caseId, evidenceCase);

    return newArtifact;
  }

  /**
   * Get artifact
   */
  async getArtifact(artifactId: string): Promise<Artifact | null> {
    return this.artifacts.get(artifactId) || null;
  }

  /**
   * Record chain of custody event
   */
  async recordChainOfCustody(
    artifactId: string,
    action: ChainOfCustodyRecord["action"],
    actor: string,
    options: {
      location?: string;
      reason?: string;
      notes?: string;
      signature?: string;
    } = {}
  ): Promise<ChainOfCustodyRecord> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`);
    }

    const recordId = `coc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const record: ChainOfCustodyRecord = {
      recordId,
      artifactId,
      action,
      timestamp: new Date(),
      actor,
      location: options.location,
      reason: options.reason,
      notes: options.notes,
      signature: options.signature,
    };

    let records = this.chainOfCustody.get(artifactId);
    if (!records) {
      records = [];
      this.chainOfCustody.set(artifactId, records);
    }

    records.push(record);

    return record;
  }

  /**
   * Get chain of custody
   */
  async getChainOfCustody(artifactId: string): Promise<ChainOfCustodyRecord[]> {
    return this.chainOfCustody.get(artifactId) || [];
  }

  /**
   * Verify chain of custody integrity
   */
  async verifyChainOfCustody(artifactId: string): Promise<{
    valid: boolean;
    gaps?: string[];
    warnings?: string[];
  }> {
    const records = await this.getChainOfCustody(artifactId);

    if (records.length === 0) {
      return {
        valid: false,
        gaps: ["No chain of custody records found"],
      };
    }

    const gaps: string[] = [];
    const warnings: string[] = [];

    // Check for gaps in time
    for (let i = 1; i < records.length; i++) {
      const prev = records[i - 1];
      const curr = records[i];
      const timeDiff = curr.timestamp.getTime() - prev.timestamp.getTime();

      if (timeDiff > 24 * 60 * 60 * 1000) {
        gaps.push(`Gap of ${Math.floor(timeDiff / (60 * 60 * 1000))} hours between records ${i - 1} and ${i}`);
      }
    }

    // Check for missing signatures
    for (let i = 0; i < records.length; i++) {
      if (!records[i].signature && records[i].action !== "analyzed") {
        warnings.push(`Missing signature on record ${i}`);
      }
    }

    // Check for unauthorized access
    const uniqueActors = new Set(records.map(r => r.actor));
    if (uniqueActors.size > 5) {
      warnings.push(`Artifact has been handled by ${uniqueActors.size} different actors`);
    }

    return {
      valid: gaps.length === 0 && warnings.length === 0,
      gaps: gaps.length > 0 ? gaps : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Add annotation to artifact
   */
  async addAnnotation(
    artifactId: string,
    type: ArtifactAnnotation["type"],
    content: string,
    createdBy: string,
    severity?: ArtifactAnnotation["severity"]
  ): Promise<ArtifactAnnotation> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`);
    }

    const annotationId = `annot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const annotation: ArtifactAnnotation = {
      annotationId,
      artifactId,
      type,
      content,
      createdAt: new Date(),
      createdBy,
      severity,
    };

    let annotations = this.annotations.get(artifactId);
    if (!annotations) {
      annotations = [];
      this.annotations.set(artifactId, annotations);
    }

    annotations.push(annotation);

    return annotation;
  }

  /**
   * Get artifact annotations
   */
  async getAnnotations(artifactId: string): Promise<ArtifactAnnotation[]> {
    return this.annotations.get(artifactId) || [];
  }

  /**
   * Get case
   */
  async getCase(caseId: string): Promise<EvidenceCase | null> {
    return this.cases.get(caseId) || null;
  }

  /**
   * List cases
   */
  async listCases(
    filter?: {
      status?: EvidenceCase["status"];
      createdBy?: string;
    }
  ): Promise<EvidenceCase[]> {
    let cases = Array.from(this.cases.values());

    if (filter?.status) {
      cases = cases.filter(c => c.status === filter.status);
    }

    if (filter?.createdBy) {
      cases = cases.filter(c => c.createdBy === filter.createdBy);
    }

    return cases.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Close case
   */
  async closeCase(caseId: string, closedBy: string): Promise<EvidenceCase> {
    const evidenceCase = this.cases.get(caseId);
    if (!evidenceCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    evidenceCase.status = "closed";
    evidenceCase.updatedAt = new Date();
    evidenceCase.updatedBy = closedBy;

    this.cases.set(caseId, evidenceCase);

    return evidenceCase;
  }

  /**
   * Export evidence for legal/regulatory purposes
   */
  async exportEvidence(
    caseId: string,
    exportedBy: string,
    format: EvidenceExport["format"] = "json"
  ): Promise<EvidenceExport> {
    const evidenceCase = this.cases.get(caseId);
    if (!evidenceCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    const exportId = `export-${Date.now()}`;

    // Collect all data
    const allChainOfCustody: ChainOfCustodyRecord[] = [];
    const allAnnotations: ArtifactAnnotation[] = [];

    for (const artifact of evidenceCase.artifacts) {
      const records = await this.getChainOfCustody(artifact.artifactId);
      const annots = await this.getAnnotations(artifact.artifactId);
      allChainOfCustody.push(...records);
      allAnnotations.push(...annots);
    }

    const exportData: EvidenceExport = {
      exportId,
      caseId,
      artifacts: evidenceCase.artifacts,
      chainOfCustody: allChainOfCustody,
      annotations: allAnnotations,
      exportedAt: new Date(),
      exportedBy,
      format,
      verified: true,
    };

    this.exports.set(exportId, exportData);

    return exportData;
  }

  /**
   * Get export
   */
  async getExport(exportId: string): Promise<EvidenceExport | null> {
    return this.exports.get(exportId) || null;
  }

  /**
   * Generate evidence report
   */
  async generateReport(caseId: string, format: "json" | "html" | "pdf" = "json"): Promise<string> {
    const evidenceCase = this.cases.get(caseId);
    if (!evidenceCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    const reportData = {
      case: evidenceCase,
      artifacts: evidenceCase.artifacts,
      timestamp: new Date(),
    };

    switch (format) {
      case "json":
        return JSON.stringify(reportData, null, 2);

      case "html":
        return this.generateHtmlReport(reportData);

      case "pdf":
        // In production, use a library like pdfkit
        return this.generateHtmlReport(reportData);

      default:
        return JSON.stringify(reportData, null, 2);
    }
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(data: any): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Evidence Report - ${data.case.caseId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; }
        h2 { color: #374151; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f3f4f6; font-weight: bold; }
        .legal-notice { background: #fef2f2; padding: 15px; border: 2px solid #ef4444; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Evidence Report</h1>
    <div class="legal-notice">
        <strong>LEGAL NOTICE:</strong> This document contains evidence and must be handled according to legal and regulatory requirements.
    </div>

    <p><strong>Case ID:</strong> ${data.case.caseId}</p>
    <p><strong>Title:</strong> ${data.case.title}</p>
    <p><strong>Status:</strong> ${data.case.status}</p>
    <p><strong>Generated:</strong> ${new Date().toISOString()}</p>

    <h2>Artifacts</h2>
    <table>
        <tr><th>Type</th><th>Source</th><th>Hash (SHA256)</th><th>Size</th><th>Collected</th></tr>
`;

    for (const artifact of data.artifacts) {
      html += `
        <tr>
            <td>${artifact.type}</td>
            <td>${artifact.source}</td>
            <td>${artifact.hash.sha256 || "N/A"}</td>
            <td>${(artifact.size / 1024 / 1024).toFixed(2)} MB</td>
            <td>${artifact.collected.toISOString()}</td>
        </tr>
`;
    }

    html += `
    </table>
</body>
</html>
`;

    return html;
  }

  /**
   * Search artifacts
   */
  async searchArtifacts(
    query: string,
    options: {
      type?: string;
      caseId?: string;
    } = {}
  ): Promise<Artifact[]> {
    let results = Array.from(this.artifacts.values());

    // Filter by type
    if (options.type) {
      results = results.filter(a => a.type === options.type);
    }

    // Filter by case
    if (options.caseId) {
      const caseArtifacts = this.cases.get(options.caseId)?.artifacts || [];
      const caseArtifactIds = new Set(caseArtifacts.map(a => a.artifactId));
      results = results.filter(a => caseArtifactIds.has(a.artifactId));
    }

    // Filter by query (source, description)
    const lowerQuery = query.toLowerCase();
    results = results.filter(
      a =>
        a.source.toLowerCase().includes(lowerQuery) ||
        a.description?.toLowerCase().includes(lowerQuery)
    );

    return results;
  }
}

export default EvidenceManager;
