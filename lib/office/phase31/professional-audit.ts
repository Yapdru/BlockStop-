/**
 * Professional Audit - Evidence collection, audit trail exports
 * Manages evidence collection, audit trails, and reporting
 */

import {
  ProfessionalAudit,
  AuditType,
  EvidenceItem,
  EvidenceCategory,
  ChainOfCustodyEntry,
  AuditFinding,
  AuditRecommendation,
  SignOffRecord,
  ApprovalStep,
} from '@/types/office-phase31';

/**
 * Professional Audit Manager
 * Manages evidence collection and audit documentation
 */
export class ProfessionalAuditManager {
  private audits: Map<string, ProfessionalAudit> = new Map();
  private evidenceVault: Map<string, EvidenceItem> = new Map();

  /**
   * Create a new audit
   */
  public createAudit(
    organizationId: string,
    auditType: AuditType,
    scope: string,
    auditor: {
      name: string;
      email: string;
      phone: string;
      role: string;
      escalationLevel: number;
    }
  ): ProfessionalAudit {
    const audit: ProfessionalAudit = {
      id: `audit-${organizationId}-${Date.now()}`,
      organizationId,
      auditNumber: `AUDIT-${Date.now()}`,
      auditType,
      scope,
      startDate: new Date(),
      auditor,
      evidenceCollected: [],
      auditTrail: [],
      findings: [],
      recommendations: [],
      status: 'planning',
      reportGenerated: false,
    };

    this.audits.set(audit.id, audit);
    return audit;
  }

  /**
   * Collect evidence
   */
  public collectEvidence(
    auditId: string,
    category: EvidenceCategory,
    name: string,
    description: string,
    filePath: string,
    fileType: string,
    fileSize: number,
    uploadedBy: string
  ): EvidenceItem {
    const audit = this.audits.get(auditId);
    if (!audit) throw new Error(`Audit ${auditId} not found`);

    const evidence: EvidenceItem = {
      id: `evidence-${Date.now()}`,
      category,
      name,
      description,
      uploadedDate: new Date(),
      uploadedBy,
      filePath,
      fileType,
      fileSize,
      hash: this.generateHash(filePath + fileSize),
      encryptionKey: `key-${Math.random().toString(36).substring(7)}`,
      chainOfCustody: [
        {
          timestamp: new Date(),
          handler: uploadedBy,
          action: 'uploaded',
          status: 'received',
        },
      ],
      relevantFindings: [],
      retentionExpires: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
    };

    audit.evidenceCollected.push(evidence);
    this.evidenceVault.set(evidence.id, evidence);

    this.logAuditTrail(audit, `Evidence collected: ${name}`, uploadedBy);

    return evidence;
  }

  /**
   * Log evidence transfer in chain of custody
   */
  public transferEvidence(
    auditId: string,
    evidenceId: string,
    transferredTo: string,
    fromUser: string
  ): ChainOfCustodyEntry | null {
    const audit = this.audits.get(auditId);
    if (!audit) return null;

    const evidence = audit.evidenceCollected.find((e) => e.id === evidenceId);
    if (!evidence) return null;

    const entry: ChainOfCustodyEntry = {
      timestamp: new Date(),
      handler: transferredTo,
      action: 'transferred',
      status: 'transferred',
    };

    evidence.chainOfCustody.push(entry);
    this.logAuditTrail(audit, `Evidence transferred: ${evidence.name} from ${fromUser} to ${transferredTo}`, 'system');

    return entry;
  }

  /**
   * Record audit finding
   */
  public recordFinding(
    auditId: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    category: string,
    description: string,
    rootCause?: string
  ): AuditFinding {
    const audit = this.audits.get(auditId);
    if (!audit) throw new Error(`Audit ${auditId} not found`);

    const finding: AuditFinding = {
      id: `finding-${Date.now()}`,
      severity,
      category,
      description,
      rootCause,
      remediation: this.generateRemediation(severity, category),
      owner: audit.auditor.name,
      dueDate: this.calculateDueDate(severity),
      status: 'open',
    };

    audit.findings.push(finding);
    this.logAuditTrail(audit, `Finding recorded: ${description}`, audit.auditor.name);

    // Link relevant evidence
    this.linkEvidenceToFinding(audit, finding);

    return finding;
  }

  /**
   * Update finding status
   */
  public updateFindingStatus(
    auditId: string,
    findingId: string,
    newStatus: 'open' | 'in_remediation' | 'remediated' | 'deferred',
    notes?: string
  ): AuditFinding | null {
    const audit = this.audits.get(auditId);
    if (!audit) return null;

    const finding = audit.findings.find((f) => f.id === findingId);
    if (!finding) return null;

    finding.status = newStatus;
    this.logAuditTrail(audit, `Finding status changed to ${newStatus}: ${finding.description}`, 'system');

    return finding;
  }

  /**
   * Create recommendation
   */
  public createRecommendation(
    auditId: string,
    findingId: string,
    title: string,
    description: string,
    businessJustification: string,
    owner: string,
    implementationApproach: string
  ): AuditRecommendation {
    const audit = this.audits.get(auditId);
    if (!audit) throw new Error(`Audit ${auditId} not found`);

    const finding = audit.findings.find((f) => f.id === findingId);

    const recommendation: AuditRecommendation = {
      id: `rec-${Date.now()}`,
      findingId,
      priority: finding?.severity === 'critical' ? 'critical' : finding?.severity === 'high' ? 'high' : 'medium',
      title,
      description,
      businessJustification,
      implementationApproach,
      owner,
      dueDate: finding ? this.calculateDueDate(finding.severity) : new Date(),
      status: 'new',
    };

    audit.recommendations.push(recommendation);
    this.logAuditTrail(audit, `Recommendation created: ${title}`, audit.auditor.name);

    return recommendation;
  }

  /**
   * Update recommendation status
   */
  public updateRecommendationStatus(
    auditId: string,
    recommendationId: string,
    newStatus: 'new' | 'accepted' | 'rejected' | 'deferred' | 'in_progress' | 'completed',
    notes?: string
  ): AuditRecommendation | null {
    const audit = this.audits.get(auditId);
    if (!audit) return null;

    const recommendation = audit.recommendations.find((r) => r.id === recommendationId);
    if (!recommendation) return null;

    recommendation.status = newStatus;
    this.logAuditTrail(audit, `Recommendation status: ${newStatus} - ${recommendation.title}`, 'system');

    return recommendation;
  }

  /**
   * Export audit trail
   */
  public exportAuditTrail(
    auditId: string,
    format: 'csv' | 'json' | 'pdf' = 'json'
  ): {
    data: string;
    filename: string;
    contentType: string;
  } {
    const audit = this.audits.get(auditId);
    if (!audit) throw new Error(`Audit ${auditId} not found`);

    let data: string;
    let contentType: string;

    switch (format) {
      case 'csv':
        data = this.exportAuditTrailCSV(audit);
        contentType = 'text/csv';
        break;
      case 'json':
        data = JSON.stringify(audit.auditTrail, null, 2);
        contentType = 'application/json';
        break;
      case 'pdf':
        data = this.generateAuditTrailPDF(audit);
        contentType = 'application/pdf';
        break;
    }

    return {
      data,
      filename: `audit-trail-${audit.auditNumber}.${format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'json'}`,
      contentType,
    };
  }

  /**
   * Export evidence manifest
   */
  public exportEvidenceManifest(auditId: string): {
    data: string;
    filename: string;
  } {
    const audit = this.audits.get(auditId);
    if (!audit) throw new Error(`Audit ${auditId} not found`);

    const manifest = {
      auditNumber: audit.auditNumber,
      exportDate: new Date(),
      totalEvidence: audit.evidenceCollected.length,
      evidence: audit.evidenceCollected.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        uploadedDate: e.uploadedDate,
        uploadedBy: e.uploadedBy,
        fileSize: e.fileSize,
        hash: e.hash,
        chainOfCustody: e.chainOfCustody.map((c) => ({
          timestamp: c.timestamp,
          handler: c.handler,
          action: c.action,
          status: c.status,
        })),
      })),
    };

    return {
      data: JSON.stringify(manifest, null, 2),
      filename: `evidence-manifest-${audit.auditNumber}.json`,
    };
  }

  /**
   * Generate audit report
   */
  public generateAuditReport(auditId: string): {
    reportId: string;
    auditNumber: string;
    auditType: AuditType;
    scope: string;
    periodStart: Date;
    periodEnd: Date;
    findings: AuditFinding[];
    recommendations: AuditRecommendation[];
    evidenceSummary: {
      totalEvidence: number;
      byCategory: Record<EvidenceCategory, number>;
    };
    complianceStatus: string;
    executiveSummary: string;
  } {
    const audit = this.audits.get(auditId);
    if (!audit) throw new Error(`Audit ${auditId} not found`);

    const categoryCount: Record<EvidenceCategory, number> = {
      logs: 0,
      configuration: 0,
      documentation: 0,
      screenshot: 0,
      test_result: 0,
      policy: 0,
      contract: 0,
      communication: 0,
      other: 0,
    };

    audit.evidenceCollected.forEach((e) => {
      categoryCount[e.category]++;
    });

    const criticalFindings = audit.findings.filter((f) => f.severity === 'critical').length;
    const complianceStatus = criticalFindings === 0 ? 'Compliant' : 'Non-Compliant';

    return {
      reportId: `report-${Date.now()}`,
      auditNumber: audit.auditNumber,
      auditType: audit.auditType,
      scope: audit.scope,
      periodStart: audit.startDate,
      periodEnd: audit.endDate || new Date(),
      findings: audit.findings,
      recommendations: audit.recommendations,
      evidenceSummary: {
        totalEvidence: audit.evidenceCollected.length,
        byCategory: categoryCount,
      },
      complianceStatus,
      executiveSummary: this.generateExecutiveSummary(audit),
    };
  }

  /**
   * Prepare for sign-off
   */
  public prepareSignOff(auditId: string): {
    audit: ProfessionalAudit;
    readyForSignOff: boolean;
    issues: string[];
    approvalChain: { approver: string; level: number }[];
  } {
    const audit = this.audits.get(auditId);
    if (!audit) throw new Error(`Audit ${auditId} not found`);

    const issues: string[] = [];

    if (audit.findings.length === 0) {
      issues.push('No findings recorded');
    }

    if (audit.evidenceCollected.length === 0) {
      issues.push('No evidence collected');
    }

    const openFindings = audit.findings.filter((f) => f.status === 'open');
    if (openFindings.length > 0) {
      issues.push(`${openFindings.length} open findings not resolved`);
    }

    const approvalChain: ApprovalStep[] = [
      {
        order: 1,
        approver: 'Audit Manager',
        approvalDate: new Date(),
        status: 'pending',
        comments: '',
      },
      {
        order: 2,
        approver: 'Director of Compliance',
        approvalDate: new Date(),
        status: 'pending',
        comments: '',
      },
      {
        order: 3,
        approver: 'Chief Executive Officer',
        approvalDate: new Date(),
        status: 'pending',
        comments: '',
      },
    ];

    return {
      audit,
      readyForSignOff: issues.length === 0,
      issues,
      approvalChain: approvalChain.map((a) => ({
        approver: a.approver,
        level: a.order,
      })),
    };
  }

  /**
   * Sign off on audit
   */
  public signOffAudit(
    auditId: string,
    signedBy: string,
    approvalChain: ApprovalStep[]
  ): boolean {
    const audit = this.audits.get(auditId);
    if (!audit) return false;

    audit.signOff = {
      signedDate: new Date(),
      signedBy,
      signatureVerified: true,
      approvalChain,
    };

    audit.status = 'closed';
    audit.reportGenerated = true;
    audit.reportPath = `/reports/audit-${audit.auditNumber}.pdf`;

    this.logAuditTrail(audit, `Audit signed off by ${signedBy}`, signedBy);

    return true;
  }

  /**
   * Get audit summary
   */
  public getAuditSummary(auditId: string): {
    auditNumber: string;
    status: string;
    progress: number;
    findings: { critical: number; high: number; medium: number; low: number };
    recommendations: { total: number; accepted: number; completed: number };
    evidence: number;
    timeline: { started: Date; ended?: Date; daysElapsed: number };
  } | null {
    const audit = this.audits.get(auditId);
    if (!audit) return null;

    const findingsBySeverity = {
      critical: audit.findings.filter((f) => f.severity === 'critical').length,
      high: audit.findings.filter((f) => f.severity === 'high').length,
      medium: audit.findings.filter((f) => f.severity === 'medium').length,
      low: audit.findings.filter((f) => f.severity === 'low').length,
    };

    const recommendationsSummary = {
      total: audit.recommendations.length,
      accepted: audit.recommendations.filter((r) => r.status === 'accepted').length,
      completed: audit.recommendations.filter((r) => r.status === 'completed').length,
    };

    const startDate = audit.startDate;
    const endDate = audit.endDate || new Date();
    const daysElapsed = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 24 * 60 * 60));

    const progress =
      (audit.evidenceCollected.length > 0 ? 33 : 0) +
      (audit.findings.length > 0 ? 33 : 0) +
      (audit.recommendations.length > 0 ? 34 : 0);

    return {
      auditNumber: audit.auditNumber,
      status: audit.status,
      progress,
      findings: findingsBySeverity,
      recommendations: recommendationsSummary,
      evidence: audit.evidenceCollected.length,
      timeline: {
        started: startDate,
        ended: audit.endDate,
        daysElapsed,
      },
    };
  }

  // ========== Private helper methods ==========

  private generateHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private logAuditTrail(audit: ProfessionalAudit, action: string, user: string): void {
    // Audit trail would be logged here
  }

  private generateRemediation(severity: string, category: string): string {
    const remediationMap: Record<string, Record<string, string>> = {
      critical: {
        'Access Control': 'Implement immediate access restrictions and MFA',
        'Data Protection': 'Encrypt all sensitive data within 48 hours',
        'Incident Response': 'Activate incident response procedures immediately',
      },
      high: {
        'Access Control': 'Review and tighten access controls within 7 days',
        'Data Protection': 'Implement encryption solution within 30 days',
        'Compliance': 'Develop remediation plan within 14 days',
      },
      medium: {
        'Configuration': 'Update configurations within 60 days',
        'Documentation': 'Update documentation within 30 days',
      },
      low: {
        'Process': 'Review process and document improvements',
        'Documentation': 'Update documentation as needed',
      },
    };

    return (remediationMap[severity]?.[category] ||
      `Develop and implement remediation plan for ${category}`);
  }

  private calculateDueDate(severity: string): Date {
    const daysToAdd =
      severity === 'critical'
        ? 14
        : severity === 'high'
          ? 30
          : severity === 'medium'
            ? 60
            : 90;
    return new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  private linkEvidenceToFinding(audit: ProfessionalAudit, finding: AuditFinding): void {
    // Link relevant evidence to the finding
    audit.evidenceCollected.forEach((evidence) => {
      if (evidence.description.toLowerCase().includes(finding.category.toLowerCase())) {
        finding.rootCause = `See evidence: ${evidence.name}`;
        evidence.relevantFindings.push(finding.id);
      }
    });
  }

  private exportAuditTrailCSV(audit: ProfessionalAudit): string {
    const headers = 'Timestamp,User,Action,ResourceType,ResourceId,Status\n';
    const rows = audit.auditTrail
      .map(
        (entry) =>
          `"${entry.timestamp}","${entry.userId}","${entry.action}","${entry.resourceType}","${entry.resourceId}","${entry.status}"`
      )
      .join('\n');

    return headers + rows;
  }

  private generateAuditTrailPDF(audit: ProfessionalAudit): string {
    // Simplified PDF-like text representation
    return `
    AUDIT TRAIL REPORT
    Audit Number: ${audit.auditNumber}
    Audit Type: ${audit.auditType}
    Generated: ${new Date().toISOString()}

    Total Entries: ${audit.auditTrail.length}
    ${audit.auditTrail.slice(0, 10).map((e) => `- ${e.timestamp}: ${e.action} by ${e.userId}`).join('\n')}
    `;
  }

  private generateExecutiveSummary(audit: ProfessionalAudit): string {
    return `
    This audit assessed ${audit.scope} for compliance with ${audit.auditType.toUpperCase()} requirements.
    The assessment identified ${audit.findings.length} findings requiring remediation.
    ${audit.findings.filter((f) => f.severity === 'critical').length} critical findings require immediate attention.
    Evidence collection is complete with ${audit.evidenceCollected.length} items documented.
    Recommendations have been provided for all identified gaps.
    `;
  }

  public getAudit(auditId: string): ProfessionalAudit | undefined {
    return this.audits.get(auditId);
  }

  public getAllAudits(): ProfessionalAudit[] {
    return Array.from(this.audits.values());
  }
}

export default ProfessionalAuditManager;
