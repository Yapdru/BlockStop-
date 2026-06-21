/**
 * BlockStop Phase 29.2 - ISO 27001:2022 Compliance Checker
 * Production-ready ISO 27001 compliance assessment
 * - A.5: Organizational controls
 * - A.6: People controls
 * - A.7: Physical controls
 * - A.8: Technological controls
 */

import * as crypto from 'crypto';

export type ISOControlAnnex = 'A5' | 'A6' | 'A7' | 'A8';

export interface ISO27001Control {
  id: string;
  controlCode: string;
  annexName: 'Organizational' | 'People' | 'Physical' | 'Technological';
  controlNumber: string;
  name: string;
  description: string;
  implementationLevel: 0 | 1 | 2 | 3 | 4 | 5; // 0-5 maturity levels
  currentMaturityLevel: 0 | 1 | 2 | 3 | 4 | 5;
  implementationEvidence: string[];
  gapAnalysis?: string;
  remediationPriority: 'critical' | 'high' | 'medium' | 'low';
  targetDate?: Date;
  lastReviewDate?: Date;
}

export interface ISO27001Annex {
  name: 'Organizational' | 'People' | 'Physical' | 'Technological';
  code: 'A5' | 'A6' | 'A7' | 'A8';
  controls: ISO27001Control[];
  maturityScore: number; // 0-100
  implementationStatus: 'not-started' | 'in-progress' | 'implemented' | 'optimized';
}

export interface ISO27001ComplianceReport {
  id: string;
  generatedDate: Date;
  organizationName: string;
  certificationScope: string;
  annexes: ISO27001Annex[];
  overallMaturityLevel: number; // 0-5
  complianceGaps: string[];
  improvementPlan: string[];
  certificationReadiness: number; // 0-100
  estimatedCertificationDate?: Date;
}

// Maturity Level Descriptions
const MATURITY_LEVELS = {
  0: 'Incomplete - Process not established',
  1: 'Initial - Ad hoc processes',
  2: 'Repeatable - Process established with basic controls',
  3: 'Defined - Process is documented and communicated',
  4: 'Quantitatively Managed - Process is measured and controlled',
  5: 'Optimized - Process is continuously improved',
};

export class ISO27001Checker {
  private annexes: ISO27001Annex[] = [];
  private complianceTracker: Map<string, any> = new Map();

  constructor() {
    this.initializeControls();
  }

  /**
   * Initialize ISO 27001 controls
   */
  private initializeControls(): void {
    // A5 - Organizational Controls
    const a5Controls: ISO27001Control[] = [
      {
        id: crypto.randomUUID(),
        controlCode: 'A5.1.1',
        annexName: 'Organizational',
        controlNumber: 'A5.1.1',
        name: 'Policies for information security',
        description: 'Set of policies to establish a framework for ISMS',
        implementationLevel: 3,
        currentMaturityLevel: 3,
        implementationEvidence: [
          'Security policy document',
          'Board approval',
          'Annual review schedule',
        ],
        remediationPriority: 'low',
        lastReviewDate: new Date(),
      },
      {
        id: crypto.randomUUID(),
        controlCode: 'A5.1.2',
        annexName: 'Organizational',
        controlNumber: 'A5.1.2',
        name: 'Information security roles and responsibilities',
        description: 'Assign and communicate information security responsibilities',
        implementationLevel: 3,
        currentMaturityLevel: 3,
        implementationEvidence: ['RACI matrix', 'Job descriptions', 'Organization chart'],
        remediationPriority: 'low',
        lastReviewDate: new Date(),
      },
      {
        id: crypto.randomUUID(),
        controlCode: 'A5.2.1',
        annexName: 'Organizational',
        controlNumber: 'A5.2.1',
        name: 'Information security risk management process',
        description: 'Establish and maintain risk management process',
        implementationLevel: 2,
        currentMaturityLevel: 2,
        implementationEvidence: ['Risk assessment methodology', 'Risk register'],
        gapAnalysis: 'Need quarterly risk reviews',
        remediationPriority: 'medium',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    ];

    // A6 - People Controls
    const a6Controls: ISO27001Control[] = [
      {
        id: crypto.randomUUID(),
        controlCode: 'A6.1.1',
        annexName: 'People',
        controlNumber: 'A6.1.1',
        name: 'Screening',
        description: 'Background checks for all personnel',
        implementationLevel: 2,
        currentMaturityLevel: 2,
        implementationEvidence: ['Background check procedures', 'Sample verifications'],
        gapAnalysis: 'Need periodic re-screening for sensitive roles',
        remediationPriority: 'medium',
      },
      {
        id: crypto.randomUUID(),
        controlCode: 'A6.2.1',
        annexName: 'People',
        controlNumber: 'A6.2.1',
        name: 'Terms and conditions of employment',
        description: 'Include information security obligations in employment contracts',
        implementationLevel: 3,
        currentMaturityLevel: 3,
        implementationEvidence: ['Employee handbook', 'Contract templates', 'Acknowledgments'],
        remediationPriority: 'low',
        lastReviewDate: new Date(),
      },
      {
        id: crypto.randomUUID(),
        controlCode: 'A6.3.1',
        annexName: 'People',
        controlNumber: 'A6.3.1',
        name: 'Awareness, education and training',
        description: 'Information security training program',
        implementationLevel: 2,
        currentMaturityLevel: 2,
        implementationEvidence: ['Training curriculum', 'Attendance records'],
        gapAnalysis: 'Need annual refresher training',
        remediationPriority: 'high',
      },
    ];

    // A7 - Physical Controls
    const a7Controls: ISO27001Control[] = [
      {
        id: crypto.randomUUID(),
        controlCode: 'A7.1.1',
        annexName: 'Physical',
        controlNumber: 'A7.1.1',
        name: 'Physical security perimeter',
        description: 'Define and protect physical security perimeter',
        implementationLevel: 3,
        currentMaturityLevel: 3,
        implementationEvidence: [
          'Building access controls',
          'Security badges',
          'Visitor log',
          'CCTV footage',
        ],
        remediationPriority: 'low',
        lastReviewDate: new Date(),
      },
      {
        id: crypto.randomUUID(),
        controlCode: 'A7.1.2',
        annexName: 'Physical',
        controlNumber: 'A7.1.2',
        name: 'Physical entry',
        description: 'Control physical access to buildings',
        implementationLevel: 3,
        currentMaturityLevel: 3,
        implementationEvidence: ['Access badge system', 'Entry logs'],
        remediationPriority: 'low',
      },
      {
        id: crypto.randomUUID(),
        controlCode: 'A7.2.1',
        annexName: 'Physical',
        controlNumber: 'A7.2.1',
        name: 'Equipment location and protection',
        description: 'Position equipment to protect from threats',
        implementationLevel: 2,
        currentMaturityLevel: 1,
        implementationEvidence: ['Data center location'],
        gapAnalysis: 'Need environmental controls (temperature, humidity monitoring)',
        remediationPriority: 'high',
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    ];

    // A8 - Technological Controls
    const a8Controls: ISO27001Control[] = [
      {
        id: crypto.randomUUID(),
        controlCode: 'A8.1.1',
        annexName: 'Technological',
        controlNumber: 'A8.1.1',
        name: 'User endpoint devices',
        description: 'Manage security of user endpoint devices',
        implementationLevel: 2,
        currentMaturityLevel: 2,
        implementationEvidence: ['MDM solution', 'Device inventory'],
        gapAnalysis: 'Need BYOD policy and stronger endpoint protection',
        remediationPriority: 'high',
      },
      {
        id: crypto.randomUUID(),
        controlCode: 'A8.2.1',
        annexName: 'Technological',
        controlNumber: 'A8.2.1',
        name: 'Privileged access rights',
        description: 'Restrict and manage privileged access',
        implementationLevel: 2,
        currentMaturityLevel: 2,
        implementationEvidence: ['PAM tool', 'Access reviews'],
        gapAnalysis: 'Need better privilege monitoring and audit logging',
        remediationPriority: 'high',
      },
      {
        id: crypto.randomUUID(),
        controlCode: 'A8.3.1',
        annexName: 'Technological',
        controlNumber: 'A8.3.1',
        name: 'Information and other assets in the network',
        description: 'Manage network security',
        implementationLevel: 3,
        currentMaturityLevel: 3,
        implementationEvidence: ['Firewall rules', 'Network segmentation', 'IDS/IPS logs'],
        remediationPriority: 'low',
        lastReviewDate: new Date(),
      },
      {
        id: crypto.randomUUID(),
        controlCode: 'A8.4.1',
        annexName: 'Technological',
        controlNumber: 'A8.4.1',
        name: 'Access control',
        description: 'Implement access control policies',
        implementationLevel: 3,
        currentMaturityLevel: 3,
        implementationEvidence: [
          'IAM system',
          'RBAC configuration',
          'Access request process',
        ],
        remediationPriority: 'low',
        lastReviewDate: new Date(),
      },
    ];

    this.annexes = [
      {
        name: 'Organizational',
        code: 'A5',
        controls: a5Controls,
        maturityScore: this.calculateMaturityScore(a5Controls),
        implementationStatus: 'implemented',
      },
      {
        name: 'People',
        code: 'A6',
        controls: a6Controls,
        maturityScore: this.calculateMaturityScore(a6Controls),
        implementationStatus: 'in-progress',
      },
      {
        name: 'Physical',
        code: 'A7',
        controls: a7Controls,
        maturityScore: this.calculateMaturityScore(a7Controls),
        implementationStatus: 'in-progress',
      },
      {
        name: 'Technological',
        code: 'A8',
        controls: a8Controls,
        maturityScore: this.calculateMaturityScore(a8Controls),
        implementationStatus: 'in-progress',
      },
    ];
  }

  /**
   * Calculate maturity score for controls
   */
  private calculateMaturityScore(controls: ISO27001Control[]): number {
    if (controls.length === 0) return 0;
    const totalMaturity = controls.reduce((sum, c) => sum + c.currentMaturityLevel, 0);
    return Math.round((totalMaturity / (controls.length * 5)) * 100);
  }

  /**
   * Get control by code
   */
  public getControl(controlCode: string): ISO27001Control | undefined {
    for (const annex of this.annexes) {
      const control = annex.controls.find(c => c.controlCode === controlCode);
      if (control) return control;
    }
    return undefined;
  }

  /**
   * Update control maturity level
   */
  public updateControlMaturity(
    controlCode: string,
    maturityLevel: 0 | 1 | 2 | 3 | 4 | 5,
    evidence: string[],
    gapAnalysis?: string
  ): void {
    const control = this.getControl(controlCode);
    if (control) {
      control.currentMaturityLevel = maturityLevel;
      control.implementationEvidence = evidence;
      if (gapAnalysis) control.gapAnalysis = gapAnalysis;
      control.lastReviewDate = new Date();

      // Update annex status
      const annex = this.annexes.find(a => a.controls.includes(control));
      if (annex) {
        annex.maturityScore = this.calculateMaturityScore(annex.controls);
      }
    }
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(
    organizationName: string,
    scope: string
  ): ISO27001ComplianceReport {
    const overallMaturity = this.calculateOverallMaturity();
    const gaps = this.identifyComplianceGaps();
    const improvements = this.generateImprovementPlan();
    const readiness = this.calculateCertificationReadiness();

    return {
      id: crypto.randomUUID(),
      generatedDate: new Date(),
      organizationName,
      certificationScope: scope,
      annexes: this.annexes,
      overallMaturityLevel: overallMaturity,
      complianceGaps: gaps,
      improvementPlan: improvements,
      certificationReadiness: readiness,
      estimatedCertificationDate:
        readiness >= 80
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Calculate overall maturity
   */
  private calculateOverallMaturity(): number {
    const allControls = this.annexes.flatMap(a => a.controls);
    if (allControls.length === 0) return 0;

    const level0 = allControls.filter(c => c.currentMaturityLevel === 0).length;
    const level1 = allControls.filter(c => c.currentMaturityLevel === 1).length;
    const level2 = allControls.filter(c => c.currentMaturityLevel === 2).length;
    const level3 = allControls.filter(c => c.currentMaturityLevel === 3).length;
    const level4 = allControls.filter(c => c.currentMaturityLevel === 4).length;
    const level5 = allControls.filter(c => c.currentMaturityLevel === 5).length;

    const totalScore = level0 * 0 + level1 * 1 + level2 * 2 + level3 * 3 + level4 * 4 + level5 * 5;
    return Math.round((totalScore / (allControls.length * 5)) * 5);
  }

  /**
   * Identify compliance gaps
   */
  private identifyComplianceGaps(): string[] {
    const gaps: string[] = [];

    for (const annex of this.annexes) {
      for (const control of annex.controls) {
        if (control.currentMaturityLevel < control.implementationLevel) {
          gaps.push(
            `${control.controlCode}: ${control.name} - Current: Level ${control.currentMaturityLevel}, Required: Level ${control.implementationLevel}`
          );
        }
        if (control.gapAnalysis) {
          gaps.push(`${control.controlCode}: ${control.gapAnalysis}`);
        }
      }
    }

    return gaps;
  }

  /**
   * Generate improvement plan
   */
  private generateImprovementPlan(): string[] {
    const plan: string[] = [];
    const criticalControls = [];
    const highControls = [];
    const mediumControls = [];

    for (const annex of this.annexes) {
      for (const control of annex.controls) {
        if (control.remediationPriority === 'critical') {
          criticalControls.push(control);
        } else if (control.remediationPriority === 'high') {
          highControls.push(control);
        } else if (control.remediationPriority === 'medium') {
          mediumControls.push(control);
        }
      }
    }

    // Add critical remediation items
    criticalControls.forEach(c => {
      plan.push(
        `[CRITICAL] ${c.controlCode}: ${c.name} - Target: ${c.targetDate?.toISOString().split('T')[0] || 'Immediate'}`
      );
    });

    // Add high priority items
    highControls.forEach(c => {
      plan.push(
        `[HIGH] ${c.controlCode}: ${c.name} - Target: ${c.targetDate?.toISOString().split('T')[0] || 'Q2'}`
      );
    });

    // Add medium priority items
    mediumControls.forEach(c => {
      plan.push(`[MEDIUM] ${c.controlCode}: ${c.name}`);
    });

    return plan;
  }

  /**
   * Calculate certification readiness
   */
  private calculateCertificationReadiness(): number {
    const allControls = this.annexes.flatMap(a => a.controls);
    const readyControls = allControls.filter(c => c.currentMaturityLevel >= 3).length;
    return Math.round((readyControls / allControls.length) * 100);
  }

  /**
   * Get annex by code
   */
  public getAnnex(code: ISOControlAnnex): ISO27001Annex | undefined {
    return this.annexes.find(a => a.code === code);
  }

  /**
   * Get all annexes
   */
  public getAllAnnexes(): ISO27001Annex[] {
    return this.annexes;
  }

  /**
   * Export for assessment
   */
  public exportForAssessment() {
    return {
      annexes: this.annexes,
      summary: {
        totalControls: this.annexes.reduce((sum, a) => sum + a.controls.length, 0),
        compliantControls: this.annexes.reduce(
          (sum, a) => sum + a.controls.filter(c => c.currentMaturityLevel >= 3).length,
          0
        ),
        overallMaturity: this.calculateOverallMaturity(),
        certificationReadiness: this.calculateCertificationReadiness(),
      },
    };
  }
}

export default ISO27001Checker;
