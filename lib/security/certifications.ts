/**
 * BlockStop Phase 30.3 - Enterprise Security: Security Certifications & Compliance
 * Production-ready certification and compliance tracking
 * - SOC 2 Type II audit readiness
 * - ISO 27001:2022 compliance tracking
 * - GDPR, HIPAA, PCI-DSS support
 * - Compliance dashboard and reporting
 * - Audit trail and evidence collection
 * - Certification renewal tracking
 */

/**
 * Certification frameworks supported
 */
export type CertificationFramework =
  | 'SOC2-TypeII'
  | 'ISO27001-2022'
  | 'GDPR'
  | 'HIPAA'
  | 'PCI-DSS'
  | 'CCPA'
  | 'NIST'
  | 'CIS-CSC';

export type ComplianceStatus = 'compliant' | 'partial' | 'non-compliant' | 'in-progress';

export type ControlStatus = 'compliant' | 'non-compliant' | 'partial' | 'not-applicable' | 'not-tested';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * Individual compliance control
 */
export interface ComplianceControl {
  id: string;
  framework: CertificationFramework;
  controlId: string; // e.g., "A.5.1.1" for ISO 27001
  title: string;
  description: string;
  requirement: string;
  category: string;
  status: ControlStatus;
  riskLevel: RiskLevel;
  owner: string;
  evidenceFiles: string[];
  testResults: string[];
  lastAssessmentDate?: Date;
  nextAssessmentDate?: Date;
  remediationDueDate?: Date;
  notes?: string;
  automationPossible: boolean;
  automationStatus?: 'not-automated' | 'partially-automated' | 'fully-automated';
}

/**
 * Certification audit information
 */
export interface CertificationAudit {
  id: string;
  framework: CertificationFramework;
  auditType: 'external' | 'internal' | 'self-assessment';
  startDate: Date;
  endDate?: Date;
  auditorName?: string;
  auditorOrganization?: string;
  scope: string[];
  controls: ComplianceControl[];
  totalControls: number;
  compliantControls: number;
  partialControls: number;
  nonCompliantControls: number;
  notApplicableControls: number;
  compliancePercentage: number;
  findings: AuditFinding[];
  recommendations: string[];
  certificationDate?: Date;
  expirationDate?: Date;
  status: 'planning' | 'in-progress' | 'completed' | 'remediation' | 'certified';
  reportUrl?: string;
  notes?: string;
}

/**
 * Audit finding
 */
export interface AuditFinding {
  id: string;
  controlId: string;
  severity: 'critical' | 'major' | 'minor' | 'observation';
  description: string;
  evidenceGap: string;
  remediationSteps: string[];
  owner: string;
  dueDate: Date;
  status: 'open' | 'in-progress' | 'closed';
  closureEvidence?: string;
  verifiedBy?: string;
  verificationDate?: Date;
}

/**
 * Compliance requirement mapping
 */
export interface RequirementMapping {
  id: string;
  source: CertificationFramework;
  target: CertificationFramework;
  sourceRequirement: string;
  targetRequirement: string;
  overlaps: boolean;
  consolidationPossible: boolean;
  implementation: string;
}

/**
 * Data processing agreement
 */
export interface DataProcessingAgreement {
  id: string;
  type: 'DPA' | 'BAA' | 'Processing-Agreement';
  version: string;
  effectiveDate: Date;
  expirationDate?: Date;
  relatedParties: string[];
  scope: string;
  dataCategories: string[];
  processingActivities: string[];
  legalBasis: string[];
  technicalMeasures: string[];
  organizationalMeasures: string[];
  signedDate?: Date;
  reviewDate?: Date;
  status: 'draft' | 'approved' | 'signed' | 'active' | 'expired';
}

/**
 * Compliance dashboard metrics
 */
export interface ComplianceDashboard {
  overallComplianceScore: number; // 0-100
  frameworks: FrameworkStatus[];
  upcomingAudits: CertificationAudit[];
  openFindings: AuditFinding[];
  risingRisks: ComplianceControl[];
  autoRemediationStatus: {
    totalAutomatable: number;
    fullyAutomated: number;
    partiallyAutomated: number;
    notAutomated: number;
  };
  certificationStatus: {
    current: CertificationFramework[];
    inProgress: CertificationFramework[];
    upcoming: CertificationFramework[];
  };
  evidence: {
    totalEvidence: number;
    verifiedEvidence: number;
    expiringEvidence: string[];
  };
}

/**
 * Framework status overview
 */
export interface FrameworkStatus {
  framework: CertificationFramework;
  certificationDate?: Date;
  expirationDate?: Date;
  complianceScore: number; // 0-100
  status: ComplianceStatus;
  totalControls: number;
  compliantControls: number;
  openFindings: number;
  daysToExpiry?: number;
  riskLevel: RiskLevel;
}

/**
 * Security certifications manager
 */
export class SecurityCertificationsManager {
  private audits: Map<string, CertificationAudit> = new Map();
  private controls: Map<string, ComplianceControl> = new Map();
  private findings: Map<string, AuditFinding> = new Map();
  private dpas: Map<string, DataProcessingAgreement> = new Map();
  private requirementMappings: Map<string, RequirementMapping> = new Map();

  constructor() {
    this.initializeStandardControls();
  }

  /**
   * Initialize standard controls for all frameworks
   */
  private initializeStandardControls(): void {
    // SOC 2 Type II Controls
    this.addControl({
      framework: 'SOC2-TypeII',
      controlId: 'CC6.1',
      title: 'Logical Access Control',
      description: 'System access is limited to authorized personnel',
      category: 'Access Control',
      owner: 'Security Team',
      automationPossible: true,
    });

    this.addControl({
      framework: 'SOC2-TypeII',
      controlId: 'CC7.2',
      title: 'User Authentication',
      description: 'Multi-factor authentication is enforced',
      category: 'Authentication',
      owner: 'Security Team',
      automationPossible: true,
    });

    // ISO 27001:2022 Controls
    this.addControl({
      framework: 'ISO27001-2022',
      controlId: 'A.5.1.1',
      title: 'Policies for Information Security',
      description: 'Information security policies are documented and approved',
      category: 'Organization',
      owner: 'Management',
      automationPossible: false,
    });

    this.addControl({
      framework: 'ISO27001-2022',
      controlId: 'A.6.1.1',
      title: 'Screening',
      description: 'Personnel undergo background checks',
      category: 'People',
      owner: 'HR',
      automationPossible: true,
    });

    // GDPR Controls
    this.addControl({
      framework: 'GDPR',
      controlId: 'Article-32',
      title: 'Security of Processing',
      description: 'Implement technical and organizational measures',
      category: 'Data Protection',
      owner: 'DPO',
      automationPossible: true,
    });

    // HIPAA Controls
    this.addControl({
      framework: 'HIPAA',
      controlId: '164-308',
      title: 'Administrative Safeguards',
      description: 'Security management process',
      category: 'Administration',
      owner: 'Security Officer',
      automationPossible: false,
    });

    // PCI-DSS Controls
    this.addControl({
      framework: 'PCI-DSS',
      controlId: '1.2.3',
      title: 'Network Segmentation',
      description: 'Cardholder data must be separated from other networks',
      category: 'Network',
      owner: 'Network Team',
      automationPossible: true,
    });
  }

  /**
   * Add a compliance control
   */
  private addControl(control: Omit<ComplianceControl, 'id' | 'status' | 'evidenceFiles' | 'testResults'>): void {
    const id = this.generateId('CTL');
    const newControl: ComplianceControl = {
      ...control,
      id,
      status: 'not-tested',
      evidenceFiles: [],
      testResults: [],
    };
    this.controls.set(id, newControl);
  }

  /**
   * Start a new audit
   */
  public startAudit(params: {
    framework: CertificationFramework;
    auditType: 'external' | 'internal' | 'self-assessment';
    scope: string[];
    auditorName?: string;
    auditorOrganization?: string;
  }): CertificationAudit {
    const auditId = this.generateId('AUD');
    const now = new Date();

    const frameworkControls = Array.from(this.controls.values()).filter(
      c => c.framework === params.framework
    );

    const audit: CertificationAudit = {
      id: auditId,
      framework: params.framework,
      auditType: params.auditType,
      startDate: now,
      scope: params.scope,
      auditorName: params.auditorName,
      auditorOrganization: params.auditorOrganization,
      controls: frameworkControls,
      totalControls: frameworkControls.length,
      compliantControls: 0,
      partialControls: 0,
      nonCompliantControls: 0,
      notApplicableControls: 0,
      compliancePercentage: 0,
      findings: [],
      recommendations: [],
      status: 'in-progress',
      notes: '',
    };

    this.audits.set(auditId, audit);
    return audit;
  }

  /**
   * Update control assessment
   */
  public assessControl(
    controlId: string,
    status: ControlStatus,
    riskLevel: RiskLevel,
    evidenceFiles?: string[],
    notes?: string
  ): ComplianceControl {
    const control = this.controls.get(controlId);
    if (!control) {
      throw new Error(`Control ${controlId} not found`);
    }

    control.status = status;
    control.riskLevel = riskLevel;
    control.lastAssessmentDate = new Date();
    control.nextAssessmentDate = this.addDays(new Date(), 365); // Annual review

    if (evidenceFiles) {
      control.evidenceFiles.push(...evidenceFiles);
    }

    if (notes) {
      control.notes = notes;
    }

    this.controls.set(controlId, control);

    // Update related audit
    this.updateAuditControlStatus(controlId, status);

    return control;
  }

  /**
   * Create audit finding
   */
  public createFinding(
    auditId: string,
    controlId: string,
    severity: 'critical' | 'major' | 'minor' | 'observation',
    description: string,
    owner: string,
    daysToRemediate: number = 30
  ): AuditFinding {
    const findingId = this.generateId('FND');
    const now = new Date();

    const finding: AuditFinding = {
      id: findingId,
      controlId,
      severity,
      description,
      evidenceGap: '',
      remediationSteps: [],
      owner,
      dueDate: this.addDays(now, daysToRemediate),
      status: 'open',
    };

    this.findings.set(findingId, finding);

    // Add to audit
    const audit = this.audits.get(auditId);
    if (audit) {
      audit.findings.push(finding);
    }

    return finding;
  }

  /**
   * Close finding with evidence
   */
  public closeFinding(findingId: string, evidence: string, verifier: string): AuditFinding {
    const finding = this.findings.get(findingId);
    if (!finding) {
      throw new Error(`Finding ${findingId} not found`);
    }

    finding.status = 'closed';
    finding.closureEvidence = evidence;
    finding.verifiedBy = verifier;
    finding.verificationDate = new Date();

    this.findings.set(findingId, finding);
    return finding;
  }

  /**
   * Complete audit
   */
  public completeAudit(auditId: string, certificationDate?: Date): CertificationAudit {
    const audit = this.audits.get(auditId);
    if (!audit) {
      throw new Error(`Audit ${auditId} not found`);
    }

    audit.endDate = new Date();
    audit.status = 'completed';

    // Calculate compliance percentage
    const assessedControls =
      audit.compliantControls +
      audit.partialControls +
      audit.nonCompliantControls;

    if (assessedControls > 0) {
      audit.compliancePercentage = Math.round(
        (audit.compliantControls / assessedControls) * 100
      );
    }

    if (certificationDate) {
      audit.certificationDate = certificationDate;
      audit.expirationDate = this.addDays(certificationDate, 365); // 1-year validity
      audit.status = 'certified';
    }

    if (audit.compliancePercentage >= 90) {
      audit.status = 'certified';
    } else if (audit.compliancePercentage >= 70) {
      audit.status = 'remediation';
    }

    this.audits.set(auditId, audit);
    return audit;
  }

  /**
   * Generate remediation plan
   */
  public generateRemediationPlan(auditId: string): {
    critical: AuditFinding[];
    major: AuditFinding[];
    minor: AuditFinding[];
    timeline: { week: number; tasks: string[] }[];
  } {
    const audit = this.audits.get(auditId);
    if (!audit) {
      throw new Error(`Audit ${auditId} not found`);
    }

    const critical = audit.findings.filter(f => f.severity === 'critical');
    const major = audit.findings.filter(f => f.severity === 'major');
    const minor = audit.findings.filter(f => f.severity === 'minor');

    // Generate timeline
    const timeline: { week: number; tasks: string[] }[] = [];

    // Week 1-2: Critical findings
    if (critical.length > 0) {
      timeline.push({
        week: 1,
        tasks: critical.map(f => `Remediate: ${f.description}`),
      });
    }

    // Week 3-4: Major findings
    if (major.length > 0) {
      timeline.push({
        week: 3,
        tasks: major.map(f => `Remediate: ${f.description}`),
      });
    }

    // Week 5+: Minor findings
    if (minor.length > 0) {
      timeline.push({
        week: 5,
        tasks: minor.map(f => `Remediate: ${f.description}`),
      });
    }

    return { critical, major, minor, timeline };
  }

  /**
   * Create or update data processing agreement
   */
  public createDPA(params: {
    type: 'DPA' | 'BAA' | 'Processing-Agreement';
    version: string;
    relatedParties: string[];
    scope: string;
    dataCategories: string[];
    processingActivities: string[];
    legalBasis: string[];
    technicalMeasures: string[];
    organizationalMeasures: string[];
  }): DataProcessingAgreement {
    const id = this.generateId('DPA');

    const dpa: DataProcessingAgreement = {
      id,
      type: params.type,
      version: params.version,
      effectiveDate: new Date(),
      relatedParties: params.relatedParties,
      scope: params.scope,
      dataCategories: params.dataCategories,
      processingActivities: params.processingActivities,
      legalBasis: params.legalBasis,
      technicalMeasures: params.technicalMeasures,
      organizationalMeasures: params.organizationalMeasures,
      status: 'draft',
    };

    this.dpas.set(id, dpa);
    return dpa;
  }

  /**
   * Sign DPA
   */
  public signDPA(dpaId: string): DataProcessingAgreement {
    const dpa = this.dpas.get(dpaId);
    if (!dpa) {
      throw new Error(`DPA ${dpaId} not found`);
    }

    dpa.status = 'signed';
    dpa.signedDate = new Date();
    dpa.effectiveDate = new Date();

    this.dpas.set(dpaId, dpa);
    return dpa;
  }

  /**
   * Get compliance dashboard
   */
  public getComplianceDashboard(): ComplianceDashboard {
    const frameworks = new Set<CertificationFramework>();
    const audits = Array.from(this.audits.values());
    const controls = Array.from(this.controls.values());
    const findings = Array.from(this.findings.values()).filter(f => f.status === 'open');

    audits.forEach(a => frameworks.add(a.framework));
    controls.forEach(c => frameworks.add(c.framework));

    // Get framework status
    const frameworkStatuses: FrameworkStatus[] = [];

    for (const framework of frameworks) {
      const frameworkAudits = audits.filter(a => a.framework === framework);
      const frameworkControls = controls.filter(c => c.framework === framework);

      const latestAudit = frameworkAudits.sort(
        (a, b) => (b.startDate?.getTime() || 0) - (a.startDate?.getTime() || 0)
      )[0];

      const status: FrameworkStatus = {
        framework,
        certificationDate: latestAudit?.certificationDate,
        expirationDate: latestAudit?.expirationDate,
        complianceScore: latestAudit?.compliancePercentage || 0,
        status: this.getComplianceStatus(latestAudit?.compliancePercentage || 0),
        totalControls: frameworkControls.length,
        compliantControls: frameworkControls.filter(c => c.status === 'compliant').length,
        openFindings: findings.filter(f =>
          frameworkControls.some(c => c.id === f.controlId)
        ).length,
        daysToExpiry: latestAudit?.expirationDate
          ? Math.ceil(
              (latestAudit.expirationDate.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
            )
          : undefined,
        riskLevel: this.calculateFrameworkRisk(frameworkControls),
      };

      frameworkStatuses.push(status);
    }

    // Calculate overall compliance score
    const overallScore =
      frameworkStatuses.length > 0
        ? Math.round(
            frameworkStatuses.reduce((sum, f) => sum + f.complianceScore, 0) /
            frameworkStatuses.length
          )
        : 0;

    // Auto-remediation status
    const totalAutomatable = controls.filter(c => c.automationPossible).length;
    const fullyAutomated = controls.filter(
      c => c.automationStatus === 'fully-automated'
    ).length;
    const partiallyAutomated = controls.filter(
      c => c.automationStatus === 'partially-automated'
    ).length;

    return {
      overallComplianceScore: overallScore,
      frameworks: frameworkStatuses,
      upcomingAudits: audits.filter(a => a.status === 'in-progress').slice(0, 5),
      openFindings: findings.slice(0, 10),
      risingRisks: controls.filter(c => c.riskLevel === 'critical' || c.riskLevel === 'high'),
      autoRemediationStatus: {
        totalAutomatable,
        fullyAutomated,
        partiallyAutomated,
        notAutomated: totalAutomatable - fullyAutomated - partiallyAutomated,
      },
      certificationStatus: {
        current: frameworkStatuses
          .filter(f => f.status === 'compliant' && (!f.daysToExpiry || f.daysToExpiry > 30))
          .map(f => f.framework),
        inProgress: frameworkStatuses
          .filter(f => f.status !== 'compliant' || (f.daysToExpiry && f.daysToExpiry <= 30))
          .map(f => f.framework),
        upcoming: [],
      },
      evidence: {
        totalEvidence: controls.reduce((sum, c) => sum + c.evidenceFiles.length, 0),
        verifiedEvidence: controls.reduce(
          (sum, c) => sum + c.testResults.length,
          0
        ),
        expiringEvidence: [],
      },
    };
  }

  /**
   * Export audit report as JSON
   */
  public exportAuditJSON(auditId: string): string {
    const audit = this.audits.get(auditId);
    if (!audit) {
      throw new Error(`Audit ${auditId} not found`);
    }

    return JSON.stringify(audit, null, 2);
  }

  /**
   * Export audit report as markdown
   */
  public exportAuditMarkdown(auditId: string): string {
    const audit = this.audits.get(auditId);
    if (!audit) {
      throw new Error(`Audit ${auditId} not found`);
    }

    let md = `# ${audit.framework} Audit Report\n\n`;
    md += `**Audit ID:** ${audit.id}\n`;
    md += `**Type:** ${audit.auditType}\n`;
    md += `**Start Date:** ${audit.startDate.toLocaleDateString()}\n`;
    if (audit.endDate) {
      md += `**End Date:** ${audit.endDate.toLocaleDateString()}\n`;
    }
    md += `**Status:** ${audit.status}\n`;
    md += `**Compliance Score:** ${audit.compliancePercentage}%\n\n`;

    md += `## Control Assessment\n\n`;
    md += `| Status | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Compliant | ${audit.compliantControls} |\n`;
    md += `| Partial | ${audit.partialControls} |\n`;
    md += `| Non-Compliant | ${audit.nonCompliantControls} |\n`;
    md += `| Not Applicable | ${audit.notApplicableControls} |\n\n`;

    if (audit.findings.length > 0) {
      md += `## Findings\n\n`;
      audit.findings.forEach(finding => {
        md += `### ${finding.description}\n`;
        md += `- **Severity:** ${finding.severity}\n`;
        md += `- **Control:** ${finding.controlId}\n`;
        md += `- **Owner:** ${finding.owner}\n`;
        md += `- **Due Date:** ${finding.dueDate.toLocaleDateString()}\n\n`;
      });
    }

    if (audit.recommendations.length > 0) {
      md += `## Recommendations\n\n`;
      audit.recommendations.forEach(rec => {
        md += `- ${rec}\n`;
      });
    }

    return md;
  }

  /**
   * Get audit
   */
  public getAudit(auditId: string): CertificationAudit | undefined {
    return this.audits.get(auditId);
  }

  /**
   * Get all audits
   */
  public getAudits(framework?: CertificationFramework): CertificationAudit[] {
    const audits = Array.from(this.audits.values());
    if (framework) {
      return audits.filter(a => a.framework === framework);
    }
    return audits;
  }

  /**
   * Private helper: Update audit control status
   */
  private updateAuditControlStatus(controlId: string, status: ControlStatus): void {
    for (const audit of this.audits.values()) {
      const control = audit.controls.find(c => c.id === controlId);
      if (control) {
        control.status = status;

        // Update counts
        if (status === 'compliant') {
          audit.compliantControls++;
        } else if (status === 'partial') {
          audit.partialControls++;
        } else if (status === 'non-compliant') {
          audit.nonCompliantControls++;
        } else if (status === 'not-applicable') {
          audit.notApplicableControls++;
        }
      }
    }
  }

  /**
   * Private helper: Get compliance status
   */
  private getComplianceStatus(score: number): ComplianceStatus {
    if (score >= 90) return 'compliant';
    if (score >= 70) return 'partial';
    return 'non-compliant';
  }

  /**
   * Private helper: Calculate framework risk
   */
  private calculateFrameworkRisk(controls: ComplianceControl[]): RiskLevel {
    const criticalCount = controls.filter(c => c.riskLevel === 'critical').length;
    const highCount = controls.filter(c => c.riskLevel === 'high').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'high';
    if (highCount > 0) return 'medium';
    return 'low';
  }

  /**
   * Private helper: Generate ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private helper: Add days
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

// Singleton instance
export const certificationManager = new SecurityCertificationsManager();
