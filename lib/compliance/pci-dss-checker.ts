/**
 * BlockStop Phase 28.5 - PCI-DSS Compliance Checker
 * Payment Card Industry Data Security Standard validation
 */

import { v4 as uuidv4 } from 'uuid';

export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partial' | 'in_remediation';

export interface PCIDSSRequirement {
  id: string;
  number: number;
  title: string;
  description: string;
  status: 'met' | 'not_met' | 'in_progress' | 'not_applicable';
  notes?: string;
  evidenceFile?: string;
  lastAssessmentDate?: Date;
}

export interface SecurityControl {
  id: string;
  controlNumber: string;
  controlName: string;
  implemented: boolean;
  testingMethod: string;
  lastTestedDate?: Date;
  findings?: string[];
}

export interface VulnerabilityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  title: string;
  description: string;
  remediation: string;
  dueDate?: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}

export class PCIDSSChecker {
  private requirements: PCIDSSRequirement[] = [];
  private controls: Map<string, SecurityControl> = new Map();
  private findings: VulnerabilityFinding[] = [];
  private readonly ASSESSMENT_INTERVAL_DAYS = 365;

  constructor() {
    this.initializeRequirements();
  }

  /**
   * Initialize PCI-DSS requirements
   */
  private initializeRequirements(): void {
    this.requirements = [
      {
        id: 'req-1',
        number: 1,
        title: 'Install and maintain a firewall configuration',
        description: 'Establish firewall and router configuration standards',
        status: 'met',
      },
      {
        id: 'req-2',
        number: 2,
        title: 'Do not use vendor-supplied defaults',
        description: 'Change default passwords and disable unnecessary services',
        status: 'met',
      },
      {
        id: 'req-3',
        number: 3,
        title: 'Protect stored cardholder data',
        description: 'Encrypt sensitive authentication data',
        status: 'met',
      },
      {
        id: 'req-4',
        number: 4,
        title: 'Protect cardholder data in transit',
        description: 'Use strong encryption for data transmission',
        status: 'met',
      },
      {
        id: 'req-5',
        number: 5,
        title: 'Protect systems against malware',
        description: 'Use and maintain anti-malware software',
        status: 'met',
      },
      {
        id: 'req-6',
        number: 6,
        title: 'Develop and maintain secure systems',
        description: 'Implement secure development and maintenance processes',
        status: 'met',
      },
      {
        id: 'req-7',
        number: 7,
        title: 'Restrict access to cardholder data',
        description: 'Use role-based access control',
        status: 'met',
      },
      {
        id: 'req-8',
        number: 8,
        title: 'Identify and authenticate access',
        description: 'Implement strong user identification and authentication',
        status: 'met',
      },
      {
        id: 'req-9',
        number: 9,
        title: 'Restrict physical access',
        description: 'Control physical access to facilities and systems',
        status: 'met',
      },
      {
        id: 'req-10',
        number: 10,
        title: 'Track and monitor access to network',
        description: 'Log and monitor all access to cardholder data systems',
        status: 'met',
      },
      {
        id: 'req-11',
        number: 11,
        title: 'Test security systems regularly',
        description: 'Conduct regular security testing and scans',
        status: 'in_progress',
      },
      {
        id: 'req-12',
        number: 12,
        title: 'Maintain information security policy',
        description: 'Maintain comprehensive information security policy',
        status: 'met',
      },
    ];
  }

  /**
   * Check overall PCI-DSS compliance
   */
  public checkCompliance(): {
    status: ComplianceStatus;
    requirements: PCIDSSRequirement[];
    summary: {
      total: number;
      met: number;
      notMet: number;
      inProgress: number;
      notApplicable: number;
      compliance: number;
    };
  } {
    const total = this.requirements.length;
    const met = this.requirements.filter(r => r.status === 'met').length;
    const notMet = this.requirements.filter(r => r.status === 'not_met').length;
    const inProgress = this.requirements.filter(r => r.status === 'in_progress').length;
    const notApplicable = this.requirements.filter(r => r.status === 'not_applicable').length;

    const compliance = (met / (total - notApplicable)) * 100;

    let status: ComplianceStatus;
    if (compliance === 100) {
      status = 'compliant';
    } else if (compliance >= 80) {
      status = 'partial';
    } else if (inProgress > 0) {
      status = 'in_remediation';
    } else {
      status = 'non_compliant';
    }

    return {
      status,
      requirements: this.requirements,
      summary: {
        total,
        met,
        notMet,
        inProgress,
        notApplicable,
        compliance: Math.round(compliance),
      },
    };
  }

  /**
   * Add security finding
   */
  public addFinding(
    severity: VulnerabilityFinding['severity'],
    title: string,
    description: string,
    remediation: string,
    dueDate?: Date
  ): VulnerabilityFinding {
    const finding: VulnerabilityFinding = {
      id: `finding-${uuidv4()}`,
      severity,
      title,
      description,
      remediation,
      dueDate,
      status: 'open',
    };

    this.findings.push(finding);
    return finding;
  }

  /**
   * Get open findings
   */
  public getOpenFindings(): VulnerabilityFinding[] {
    return this.findings.filter(f => f.status === 'open' || f.status === 'in_progress');
  }

  /**
   * Get critical findings
   */
  public getCriticalFindings(): VulnerabilityFinding[] {
    return this.findings.filter(f => f.severity === 'critical' && f.status !== 'resolved');
  }

  /**
   * Update finding status
   */
  public updateFindingStatus(
    findingId: string,
    status: VulnerabilityFinding['status']
  ): boolean {
    const finding = this.findings.find(f => f.id === findingId);
    if (!finding) {
      return false;
    }

    finding.status = status;
    return true;
  }

  /**
   * Update requirement status
   */
  public updateRequirementStatus(
    requirementId: string,
    status: PCIDSSRequirement['status'],
    notes?: string,
    evidenceFile?: string
  ): boolean {
    const requirement = this.requirements.find(r => r.id === requirementId);
    if (!requirement) {
      return false;
    }

    requirement.status = status;
    if (notes) requirement.notes = notes;
    if (evidenceFile) requirement.evidenceFile = evidenceFile;
    requirement.lastAssessmentDate = new Date();

    return true;
  }

  /**
   * Add security control
   */
  public addSecurityControl(
    controlNumber: string,
    controlName: string,
    testingMethod: string,
    implemented: boolean = true
  ): SecurityControl {
    const control: SecurityControl = {
      id: `control-${uuidv4()}`,
      controlNumber,
      controlName,
      implemented,
      testingMethod,
      lastTestedDate: implemented ? new Date() : undefined,
      findings: [],
    };

    this.controls.set(control.id, control);
    return control;
  }

  /**
   * Test security control
   */
  public testSecurityControl(controlId: string): {
    passed: boolean;
    findings: string[];
    testedAt: Date;
  } {
    const control = this.controls.get(controlId);
    if (!control) {
      return { passed: false, findings: ['Control not found'], testedAt: new Date() };
    }

    const passed = control.implemented;
    control.lastTestedDate = new Date();

    return {
      passed,
      findings: control.findings || [],
      testedAt: control.lastTestedDate,
    };
  }

  /**
   * Generate assessment report
   */
  public generateAssessmentReport(): string {
    const compliance = this.checkCompliance();
    const criticalFindings = this.getCriticalFindings();

    let report = '# PCI-DSS Compliance Assessment Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += `## Overall Status\n`;
    report += `Status: **${compliance.status.toUpperCase()}**\n`;
    report += `Compliance: ${compliance.summary.compliance}% (${compliance.summary.met}/${compliance.summary.total - compliance.summary.notApplicable})\n\n`;

    report += `## Requirements Status\n`;
    for (const req of compliance.requirements) {
      const icon = req.status === 'met' ? '✓' : req.status === 'not_met' ? '✗' : '⊘';
      report += `${icon} Requirement ${req.number}: ${req.title} (${req.status})\n`;
    }

    report += `\n## Critical Findings (${criticalFindings.length})\n`;
    for (const finding of criticalFindings) {
      report += `- **${finding.title}**: ${finding.description}\n`;
      report += `  Remediation: ${finding.remediation}\n`;
      if (finding.dueDate) {
        report += `  Due: ${finding.dueDate.toISOString()}\n`;
      }
    }

    report += `\n## Recommendations\n`;
    report += `1. Address all critical findings immediately\n`;
    report += `2. Schedule assessment for any requirements in "in_progress" status\n`;
    report += `3. Implement compensating controls where applicable\n`;
    report += `4. Conduct quarterly assessment reviews\n`;
    report += `5. Maintain audit trail of all changes\n`;

    return report;
  }

  /**
   * Get compliance metrics
   */
  public getMetrics(): {
    overallCompliance: number;
    requirementsCompliant: number;
    totalRequirements: number;
    criticalFindings: number;
    highFindings: number;
    openFindings: number;
    nextAssessmentDue: Date;
    lastAssessmentDate?: Date;
  } {
    const compliance = this.checkCompliance();
    const lastAssessmentDates = this.requirements
      .filter(r => r.lastAssessmentDate)
      .map(r => r.lastAssessmentDate!)
      .sort((a, b) => b.getTime() - a.getTime());

    const lastAssessmentDate = lastAssessmentDates[0];
    const nextAssessmentDue = new Date(
      (lastAssessmentDate?.getTime() || Date.now()) + this.ASSESSMENT_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    );

    return {
      overallCompliance: compliance.summary.compliance,
      requirementsCompliant: compliance.summary.met,
      totalRequirements: compliance.summary.total - compliance.summary.notApplicable,
      criticalFindings: this.findings.filter(f => f.severity === 'critical' && f.status !== 'resolved').length,
      highFindings: this.findings.filter(f => f.severity === 'high' && f.status !== 'resolved').length,
      openFindings: this.getOpenFindings().length,
      nextAssessmentDue,
      lastAssessmentDate,
    };
  }

  /**
   * Export compliance evidence
   */
  public exportComplianceEvidence(): {
    requirements: PCIDSSRequirement[];
    controls: SecurityControl[];
    findings: VulnerabilityFinding[];
    generatedAt: Date;
  } {
    return {
      requirements: this.requirements,
      controls: Array.from(this.controls.values()),
      findings: this.findings,
      generatedAt: new Date(),
    };
  }

  /**
   * Get requirement by number
   */
  public getRequirementByNumber(number: number): PCIDSSRequirement | undefined {
    return this.requirements.find(r => r.number === number);
  }

  /**
   * Validate payment processing
   */
  public validatePaymentProcessing(): {
    validated: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check encryption in transit
    const req4 = this.getRequirementByNumber(4);
    if (req4?.status !== 'met') {
      issues.push('Encryption in transit not properly configured');
      recommendations.push('Implement TLS 1.2+ for all payment data transmission');
    }

    // Check encryption at rest
    const req3 = this.getRequirementByNumber(3);
    if (req3?.status !== 'met') {
      issues.push('Cardholder data encryption at rest not implemented');
      recommendations.push('Encrypt all stored payment card data');
    }

    // Check access control
    const req7 = this.getRequirementByNumber(7);
    if (req7?.status !== 'met') {
      issues.push('Access control measures insufficient');
      recommendations.push('Implement role-based access control for payment systems');
    }

    return {
      validated: issues.length === 0,
      issues,
      recommendations,
    };
  }
}

export const pciDssChecker = new PCIDSSChecker();
