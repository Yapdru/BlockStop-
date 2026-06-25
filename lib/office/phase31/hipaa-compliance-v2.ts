/**
 * HIPAA Compliance v2 - Enhanced BAA tracking and breach notification automation
 * Handles Business Associate Agreements, breach notification workflows, risk assessments
 */

import {
  HIPAACompliance,
  BAAStatus,
  BreachNotification,
  RiskAssessment,
  AuditTrailEntry,
  ComplianceFinding,
  SecurityMeasure,
  SubprocessorInfo,
  BreachStatus,
  BreachType,
  RiskLevel,
} from '@/types/office-phase31';

/**
 * HIPAA Compliance Manager
 * Manages BAA tracking, breach notifications, and compliance audits
 */
export class HIPAAComplianceManager {
  private compliance: HIPAACompliance;
  private auditLog: AuditTrailEntry[] = [];
  private notificationQueue: BreachNotification[] = [];

  constructor(organizationId: string) {
    this.compliance = {
      id: `hipaa-${organizationId}-${Date.now()}`,
      organizationId,
      baaStatus: [] as any,
      breachNotifications: [],
      auditTrail: [],
      riskAssessments: [],
      lastComplianceAudit: new Date(),
      nextAuditScheduled: this.getNextAuditDate(),
      complianceScore: 85,
      criticalFindings: [],
    };
  }

  /**
   * Create or update a Business Associate Agreement
   */
  public createBAA(vendor: string, terms: any, expirationDate: Date): BAAStatus {
    const baa: BAAStatus = {
      id: `baa-${this.compliance.organizationId}-${vendor}-${Date.now()}`,
      vendor,
      executionDate: new Date(),
      expirationDate,
      lastReviewDate: new Date(),
      dataProcessingTerms: {
        scope: `Processing of Protected Health Information for ${vendor}`,
        dataTypes: ['patient_records', 'health_plans', 'transaction_codes', 'unique_identifiers'],
        processingActivities: terms.activities || ['data_storage', 'data_processing', 'data_analysis'],
        securityMeasures: this.initializeSecurityMeasures(),
        incidentReportingTimeframe: 24,
        auditRights: true,
        subprocessorApprovalRequired: true,
        dataRetentionPolicy: terms.retention || 'Until no longer needed for treatment, payment, or operations',
        deletionMethod: terms.deletionMethod || 'Secure destruction per NIST 800-88 standards',
      },
      subprocessorManagement: [],
      status: 'active',
      automatedNotifications: true,
      reminderDaysBeforeExpiration: 90,
    };

    this.auditLog.push(this.createAuditEntry('BAA_CREATED', 'BAAStatus', baa.id, { vendor }));
    return baa;
  }

  /**
   * Register a subprocessor
   */
  public registerSubprocessor(
    vendorId: string,
    subprocessor: Omit<SubprocessorInfo, 'id' | 'approvalDate'>
  ): SubprocessorInfo {
    const registered: SubprocessorInfo = {
      id: `subproc-${vendorId}-${Date.now()}`,
      ...subprocessor,
      approvalDate: new Date(),
    };

    // Notify all BAAs about new subprocessor
    this.notifySubprocessorApprovals(subprocessor.name);
    this.auditLog.push(
      this.createAuditEntry('SUBPROCESSOR_REGISTERED', 'SubprocessorInfo', registered.id, {
        name: subprocessor.name,
      })
    );

    return registered;
  }

  /**
   * Detect and report a data breach
   */
  public reportBreach(
    incidentId: string,
    breachDetails: {
      breachDate: Date;
      discoveryDate: Date;
      affectedRecords: number;
      affectedIndividuals: number;
      breachType: BreachType;
      rootCause: string;
      remediationSteps: string[];
    }
  ): BreachNotification {
    const breach: BreachNotification = {
      id: `breach-${this.compliance.organizationId}-${Date.now()}`,
      incidentId,
      breachDate: breachDetails.breachDate,
      discoveryDate: breachDetails.discoveryDate,
      affectedRecords: breachDetails.affectedRecords,
      affectedIndividuals: breachDetails.affectedIndividuals,
      breachType: breachDetails.breachType,
      rootCause: breachDetails.rootCause,
      remediationSteps: breachDetails.remediationSteps,
      notificationsSent: [],
      regulatoryReports: [],
      status: 'reported',
      costs: {
        investigationCost: 0,
        notificationCost: 0,
        creditMonitoringCost: 0,
        legalFeesCost: 0,
        regulatorySanctionsCost: 0,
        reputationalCost: 0,
        totalCost: 0,
        currency: 'USD',
      },
    };

    // Determine notification requirements
    if (this.requiresMediaNotification(breach)) {
      breach.status = 'reported';
      this.scheduleMediaNotification(breach);
    }

    // Schedule individual notifications based on breach severity
    this.scheduleIndividualNotifications(breach);

    // File regulatory reports
    if (breachDetails.affectedRecords >= 500) {
      this.scheduleRegulatoryReport(breach);
    }

    this.notificationQueue.push(breach);
    this.compliance.breachNotifications.push(breach);

    this.auditLog.push(
      this.createAuditEntry('BREACH_REPORTED', 'BreachNotification', breach.id, {
        breachType: breachDetails.breachType,
        affectedIndividuals: breachDetails.affectedIndividuals,
      })
    );

    return breach;
  }

  /**
   * Conduct a Risk Assessment
   */
  public conductRiskAssessment(
    assessmentType: 'initial' | 'periodic' | 'post_incident' | 'change_based',
    scope?: string
  ): RiskAssessment {
    const assessment: RiskAssessment = {
      id: `risk-assess-${this.compliance.organizationId}-${Date.now()}`,
      date: new Date(),
      assessmentType,
      riskMatrix: this.buildRiskMatrix(scope),
      overallRiskLevel: this.calculateOverallRisk(),
      prioritizedThreats: this.identifyThreats(),
      remediationPriorities: [],
      approvedBy: 'Security Officer',
      nextAssessmentDate: this.getNextAssessmentDate(assessmentType),
    };

    // Generate remediation priorities
    assessment.remediationPriorities = assessment.prioritizedThreats
      .filter((threat) => threat.probability > 0.5)
      .map((threat, index) => ({
        id: `remediation-${assessment.id}-${index}`,
        threatId: threat.id,
        action: `Implement controls for ${threat.name}`,
        owner: 'Security Team',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'open' as const,
        evidence: [],
      }));

    this.compliance.riskAssessments.push(assessment);
    this.auditLog.push(
      this.createAuditEntry('RISK_ASSESSMENT_CONDUCTED', 'RiskAssessment', assessment.id, {
        type: assessmentType,
        overallRisk: assessment.overallRiskLevel,
      })
    );

    return assessment;
  }

  /**
   * Track compliance findings and remediation
   */
  public addComplianceFinding(
    finding: Omit<ComplianceFinding, 'id'>
  ): ComplianceFinding {
    const completeFind: ComplianceFinding = {
      id: `finding-${this.compliance.organizationId}-${Date.now()}`,
      ...finding,
    };

    if (finding.severity === 'critical' || finding.severity === 'high') {
      this.compliance.criticalFindings.push(completeFind);
    }

    this.auditLog.push(
      this.createAuditEntry('COMPLIANCE_FINDING_ADDED', 'ComplianceFinding', completeFind.id, {
        severity: finding.severity,
        category: finding.category,
      })
    );

    return completeFind;
  }

  /**
   * Update security measure status
   */
  public updateSecurityMeasure(
    measureId: string,
    status: 'compliant' | 'non-compliant' | 'in_remediation'
  ): SecurityMeasure | null {
    // Find measure across all data processing terms
    let measure = (this.compliance.baaStatus as any)?.dataProcessingTerms?.securityMeasures?.find(
      (m: SecurityMeasure) => m.id === measureId
    );

    if (measure) {
      measure.status = status;
      measure.lastVerifiedDate = new Date();

      if (status === 'non-compliant') {
        this.addComplianceFinding({
          severity: 'high',
          category: 'Security Control',
          description: `Security measure ${measure.name} is non-compliant`,
          foundDate: new Date(),
          remediationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'open',
          owner: 'Security Team',
        });
      }

      this.auditLog.push(
        this.createAuditEntry('SECURITY_MEASURE_UPDATED', 'SecurityMeasure', measureId, {
          newStatus: status,
        })
      );

      return measure;
    }

    return null;
  }

  /**
   * Calculate compliance score
   */
  public calculateComplianceScore(): number {
    let score = 100;

    // Deduct for critical findings
    score -= this.compliance.criticalFindings.filter((f) => f.status === 'open').length * 10;

    // Deduct for breaches
    score -= this.compliance.breachNotifications.length * 5;

    // Deduct for expired or expiring BAAs
    const now = new Date();
    const expiringBAAs = [this.compliance.baaStatus].filter(
      (baa: any) => baa && new Date(baa.expirationDate).getTime() - now.getTime() < 90 * 24 * 60 * 60 * 1000
    );
    score -= expiringBAAs.length * 5;

    // Award points for current assessments
    const recentAssessment = this.compliance.riskAssessments[this.compliance.riskAssessments.length - 1];
    if (recentAssessment && new Date().getTime() - recentAssessment.date.getTime() < 365 * 24 * 60 * 60 * 1000) {
      score += 10;
    }

    this.compliance.complianceScore = Math.max(0, Math.min(100, score));
    return this.compliance.complianceScore;
  }

  /**
   * Get audit trail for compliance
   */
  public getAuditTrail(
    filter?: {
      startDate?: Date;
      endDate?: Date;
      actionType?: string;
      resourceType?: string;
    }
  ): AuditTrailEntry[] {
    let trail = [...this.auditLog];

    if (filter?.startDate) {
      trail = trail.filter((entry) => entry.timestamp >= filter.startDate!);
    }
    if (filter?.endDate) {
      trail = trail.filter((entry) => entry.timestamp <= filter.endDate!);
    }
    if (filter?.actionType) {
      trail = trail.filter((entry) => entry.action === filter.actionType);
    }
    if (filter?.resourceType) {
      trail = trail.filter((entry) => entry.resourceType === filter.resourceType);
    }

    return trail;
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(): {
    organizationId: string;
    reportDate: Date;
    complianceScore: number;
    criticalFindings: number;
    breaches: number;
    baaStatus: string;
    overallStatus: string;
    recommendations: string[];
  } {
    const criticalOpen = this.compliance.criticalFindings.filter((f) => f.status === 'open').length;
    const overallStatus =
      this.compliance.complianceScore >= 90
        ? 'Compliant'
        : this.compliance.complianceScore >= 70
          ? 'Substantially Compliant'
          : 'Non-Compliant';

    return {
      organizationId: this.compliance.organizationId,
      reportDate: new Date(),
      complianceScore: this.calculateComplianceScore(),
      criticalFindings: criticalOpen,
      breaches: this.compliance.breachNotifications.length,
      baaStatus: (this.compliance.baaStatus as any)?.status || 'Unknown',
      overallStatus,
      recommendations: this.generateRecommendations(),
    };
  }

  // ========== Private helper methods ==========

  private initializeSecurityMeasures(): SecurityMeasure[] {
    return [
      {
        id: 'sm-001',
        name: 'Access Controls',
        category: 'technical',
        description: 'Role-based access control implementation',
        implemented: true,
        implementationDate: new Date(),
        lastVerifiedDate: new Date(),
        evidence: ['policy-001', 'config-001'],
        status: 'compliant',
      },
      {
        id: 'sm-002',
        name: 'Encryption',
        category: 'technical',
        description: 'Data encryption at rest and in transit',
        implemented: true,
        implementationDate: new Date(),
        lastVerifiedDate: new Date(),
        evidence: ['policy-002', 'audit-002'],
        status: 'compliant',
      },
      {
        id: 'sm-003',
        name: 'Audit and Accountability',
        category: 'technical',
        description: 'Comprehensive audit logging and monitoring',
        implemented: true,
        implementationDate: new Date(),
        lastVerifiedDate: new Date(),
        evidence: ['logs-001', 'report-001'],
        status: 'compliant',
      },
    ];
  }

  private requiresMediaNotification(breach: BreachNotification): boolean {
    return breach.affectedIndividuals >= 500 || breach.breachType === 'ransomware';
  }

  private scheduleMediaNotification(breach: BreachNotification): void {
    breach.notificationsSent.push({
      id: `notif-media-${breach.id}`,
      recipientType: 'media',
      recipientCount: 1,
      methodUsed: ['press_release', 'email'],
      dateSent: new Date(Date.now() + 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'pending',
      templateUsed: 'healthcare_breach_media_template',
    });
  }

  private scheduleIndividualNotifications(breach: BreachNotification): void {
    const notificationMethods =
      breach.affectedRecords > 10000 ? ['email', 'postal_mail', 'credit_monitoring'] : ['email'];

    breach.notificationsSent.push({
      id: `notif-individuals-${breach.id}`,
      recipientType: 'individual',
      recipientCount: breach.affectedIndividuals,
      methodUsed: notificationMethods,
      dateSent: new Date(Date.now() + 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'pending',
      templateUsed: 'hipaa_individual_notification_template',
    });
  }

  private scheduleRegulatoryReport(breach: BreachNotification): void {
    breach.regulatoryReports.push({
      id: `report-${breach.id}`,
      agency: 'HHS Office for Civil Rights',
      reportType: 'HIPAA Breach Notification',
      submissionDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      referenceNumber: `HHS-${Date.now()}`,
      requirementsMet: true,
      followUpRequired: false,
    });
  }

  private buildRiskMatrix(scope?: string): Array<{
    threatId: string;
    threatName: string;
    likelihood: number;
    impact: number;
    riskScore: number;
    mitigationStatus: string;
  }> {
    return [
      {
        threatId: 'threat-001',
        threatName: 'Ransomware Attack',
        likelihood: 3,
        impact: 5,
        riskScore: 15,
        mitigationStatus: 'Partially Mitigated',
      },
      {
        threatId: 'threat-002',
        threatName: 'Unauthorized Access',
        likelihood: 2,
        impact: 4,
        riskScore: 8,
        mitigationStatus: 'Mitigated',
      },
      {
        threatId: 'threat-003',
        threatName: 'Data Exfiltration',
        likelihood: 2,
        impact: 5,
        riskScore: 10,
        mitigationStatus: 'Partially Mitigated',
      },
    ];
  }

  private calculateOverallRisk(): RiskLevel {
    const matrix = this.buildRiskMatrix();
    const avgScore = matrix.reduce((sum, item) => sum + item.riskScore, 0) / matrix.length;

    if (avgScore >= 12) return 'high';
    if (avgScore >= 8) return 'medium';
    return 'low';
  }

  private identifyThreats(): Array<{
    id: string;
    name: string;
    category: string;
    probability: number;
    potentialImpact: string;
    affectedAssets: string[];
    existingControls: string[];
    gaps: string[];
    priority: number;
  }> {
    return [
      {
        id: 'threat-ransomware',
        name: 'Ransomware Attack',
        category: 'Malware',
        probability: 0.6,
        potentialImpact: 'Complete system unavailability, data loss',
        affectedAssets: ['ehr_systems', 'databases', 'file_servers'],
        existingControls: ['endpoint_protection', 'backup_systems', 'network_segmentation'],
        gaps: ['immutable_backups', 'zero_trust_architecture'],
        priority: 1,
      },
      {
        id: 'threat-unauthorized-access',
        name: 'Unauthorized Access to PHI',
        category: 'Access Control',
        probability: 0.4,
        potentialImpact: 'Privacy breach, regulatory violations',
        affectedAssets: ['patient_records', 'employee_data', 'research_data'],
        existingControls: ['rbac', 'mfa', 'audit_logging'],
        gaps: ['behavioral_analytics', 'continuous_monitoring'],
        priority: 2,
      },
    ];
  }

  private getNextAssessmentDate(assessmentType: string): Date {
    const interval = assessmentType === 'periodic' ? 365 : 180;
    return new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
  }

  private getNextAuditDate(): Date {
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }

  private notifySubprocessorApprovals(subprocessorName: string): void {
    // In production, this would notify BAA partners
    console.log(`Notifying BAA partners about new subprocessor: ${subprocessorName}`);
  }

  private createAuditEntry(
    action: string,
    resourceType: string,
    resourceId: string,
    changes: Record<string, any>
  ): AuditTrailEntry {
    return {
      id: `audit-${Date.now()}`,
      timestamp: new Date(),
      userId: 'system',
      action,
      resourceType,
      resourceId,
      changes,
      ipAddress: 'system-internal',
      userAgent: 'HIPAA-Compliance-Manager',
      status: 'success',
    };
  }

  private generateRecommendations(): string[] {
    return [
      'Implement immutable backup solutions for critical healthcare data',
      'Enhance zero-trust architecture across all access points',
      'Conduct regular phishing simulation training for all staff',
      'Establish continuous monitoring for unusual PHI access patterns',
      'Review and update data retention policies quarterly',
      'Implement encryption for all data in transit',
      'Conduct annual independent security audit',
    ];
  }

  public getComplianceData(): HIPAACompliance {
    return this.compliance;
  }
}

export default HIPAAComplianceManager;
