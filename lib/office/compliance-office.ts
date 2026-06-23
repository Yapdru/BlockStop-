/**
 * BlockStop OFFICE Tier - Professional Compliance Management
 * Handles HIPAA, SOC2, ISO27001, GDPR compliance dashboards and reporting
 */

import { v4 as uuidv4 } from 'uuid';
import {
  OfficeComplianceDashboard,
  ComplianceFrameworkStatus,
  ComplianceAlert,
  ComplianceEvidence,
  ScheduledAudit,
  ComplianceFramework,
  AuditLogEntry,
  AuditAction,
} from '@/types/office-tier';

export class OfficeComplianceManager {
  private dashboards: Map<string, OfficeComplianceDashboard> = new Map();
  private frameworks: Map<string, ComplianceFrameworkStatus> = new Map();
  private alerts: Map<string, ComplianceAlert> = new Map();
  private auditLogs: AuditLogEntry[] = [];

  /**
   * Create compliance dashboard for organization
   */
  public createComplianceDashboard(
    organizationId: string,
    frameworks: ComplianceFramework[]
  ): OfficeComplianceDashboard {
    const dashboard: OfficeComplianceDashboard = {
      id: `comp-${uuidv4()}`,
      organizationId,
      frameworks: frameworks.map((f) => this.initializeFramework(f)),
      overallScore: 0,
      auditTrail: [],
      criticalAlerts: [],
      upcomingAudits: [],
      lastUpdated: new Date(),
    };

    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  /**
   * Initialize compliance framework with default controls
   */
  private initializeFramework(framework: ComplianceFramework): ComplianceFrameworkStatus {
    const controlMap: Record<ComplianceFramework, number> = {
      HIPAA: 18,
      SOC2: 22,
      ISO27001: 114,
      GDPR: 12,
    };

    return {
      framework,
      status: 'in_progress',
      score: 0,
      controlsPassed: 0,
      controlsFailed: controlMap[framework] || 10,
      controlsPending: controlMap[framework] || 10,
      lastAssessmentDate: new Date(),
      nextAssessmentDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      evidence: [],
    };
  }

  /**
   * Update framework assessment status
   */
  public updateFrameworkStatus(
    dashboardId: string,
    framework: ComplianceFramework,
    status: ComplianceFrameworkStatus['status'],
    score: number,
    controlsPassed: number
  ): void {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const frameworkIndex = dashboard.frameworks.findIndex((f) => f.framework === framework);
    if (frameworkIndex > -1) {
      dashboard.frameworks[frameworkIndex] = {
        ...dashboard.frameworks[frameworkIndex],
        status,
        score,
        controlsPassed,
        controlsFailed: dashboard.frameworks[frameworkIndex].controlsFailed - controlsPassed,
        controlsPending: 0,
        lastAssessmentDate: new Date(),
      };

      // Update overall score
      dashboard.overallScore = this.calculateOverallScore(dashboard.frameworks);
      dashboard.lastUpdated = new Date();
    }
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallScore(frameworks: ComplianceFrameworkStatus[]): number {
    if (frameworks.length === 0) return 0;
    const totalScore = frameworks.reduce((sum, f) => sum + f.score, 0);
    return Math.round(totalScore / frameworks.length);
  }

  /**
   * Upload compliance evidence
   */
  public uploadEvidence(
    dashboardId: string,
    framework: ComplianceFramework,
    evidence: Omit<ComplianceEvidence, 'id'>
  ): ComplianceEvidence {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const frameworkStatus = dashboard.frameworks.find((f) => f.framework === framework);
    if (!frameworkStatus) {
      throw new Error(`Framework ${framework} not found`);
    }

    const newEvidence: ComplianceEvidence = {
      ...evidence,
      id: `ev-${uuidv4()}`,
    };

    frameworkStatus.evidence.push(newEvidence);
    dashboard.lastUpdated = new Date();

    return newEvidence;
  }

  /**
   * Create compliance alert
   */
  public createAlert(
    dashboardId: string,
    alert: Omit<ComplianceAlert, 'id' | 'createdAt'>
  ): ComplianceAlert {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const newAlert: ComplianceAlert = {
      ...alert,
      id: `alert-${uuidv4()}`,
      createdAt: new Date(),
    };

    if (alert.severity === 'critical' || alert.severity === 'high') {
      dashboard.criticalAlerts.push(newAlert);
    }

    this.alerts.set(newAlert.id, newAlert);
    dashboard.lastUpdated = new Date();

    return newAlert;
  }

  /**
   * Resolve compliance alert
   */
  public resolveAlert(dashboardId: string, alertId: string, resolvedBy: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    const dashboard = this.dashboards.get(dashboardId);
    if (dashboard) {
      dashboard.criticalAlerts = dashboard.criticalAlerts.filter((a) => a.id !== alertId);
      dashboard.lastUpdated = new Date();
    }
  }

  /**
   * Schedule compliance audit
   */
  public scheduleAudit(
    dashboardId: string,
    audit: Omit<ScheduledAudit, 'id'>
  ): ScheduledAudit {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const newAudit: ScheduledAudit = {
      ...audit,
      id: `audit-${uuidv4()}`,
    };

    dashboard.upcomingAudits.push(newAudit);
    dashboard.lastUpdated = new Date();

    return newAudit;
  }

  /**
   * Update audit status
   */
  public updateAuditStatus(
    dashboardId: string,
    auditId: string,
    status: ScheduledAudit['status'],
    completionNotes?: string
  ): void {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const audit = dashboard.upcomingAudits.find((a) => a.id === auditId);
    if (!audit) {
      throw new Error(`Audit ${auditId} not found`);
    }

    audit.status = status;
    if (status === 'completed' && completionNotes) {
      audit.scope = [...audit.scope, `Completed: ${completionNotes}`];
    }
    dashboard.lastUpdated = new Date();
  }

  /**
   * Get dashboard by ID
   */
  public getDashboard(dashboardId: string): OfficeComplianceDashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * Get all dashboards for organization
   */
  public getOrganizationDashboards(organizationId: string): OfficeComplianceDashboard[] {
    return Array.from(this.dashboards.values()).filter(
      (d) => d.organizationId === organizationId
    );
  }

  /**
   * Get framework status
   */
  public getFrameworkStatus(
    dashboardId: string,
    framework: ComplianceFramework
  ): ComplianceFrameworkStatus | null {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;

    return dashboard.frameworks.find((f) => f.framework === framework) || null;
  }

  /**
   * Generate compliance audit trail
   */
  public logComplianceAction(
    dashboardId: string,
    userId: string,
    action: AuditAction,
    details: Record<string, any>,
    ipAddress?: string
  ): AuditLogEntry {
    const auditEntry: AuditLogEntry = {
      id: `audit-${uuidv4()}`,
      organizationId: this.dashboards.get(dashboardId)?.organizationId || '',
      timestamp: new Date(),
      userId,
      action,
      resource: 'compliance',
      resourceId: dashboardId,
      details,
      ipAddress,
      status: 'success',
    };

    this.auditLogs.push(auditEntry);

    const dashboard = this.dashboards.get(dashboardId);
    if (dashboard) {
      dashboard.auditTrail.push(auditEntry);
      dashboard.lastUpdated = new Date();
    }

    return auditEntry;
  }

  /**
   * Get audit trail for dashboard
   */
  public getAuditTrail(dashboardId: string, limit: number = 100): AuditLogEntry[] {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return [];

    return dashboard.auditTrail.slice(-limit);
  }

  /**
   * Validate framework compliance
   */
  public validateComplianceStatus(
    dashboardId: string,
    framework: ComplianceFramework
  ): { compliant: boolean; passRate: number; gaps: string[] } {
    const frameworkStatus = this.getFrameworkStatus(dashboardId, framework);
    if (!frameworkStatus) {
      return { compliant: false, passRate: 0, gaps: ['Framework not found'] };
    }

    const totalControls =
      frameworkStatus.controlsPassed + frameworkStatus.controlsFailed + frameworkStatus.controlsPending;
    const passRate =
      totalControls > 0 ? Math.round((frameworkStatus.controlsPassed / totalControls) * 100) : 0;

    const gaps: string[] = [];

    if (frameworkStatus.controlsFailed > 0) {
      gaps.push(`${frameworkStatus.controlsFailed} failed controls`);
    }
    if (frameworkStatus.controlsPending > 0) {
      gaps.push(`${frameworkStatus.controlsPending} pending controls`);
    }

    return {
      compliant: passRate >= 95,
      passRate,
      gaps,
    };
  }

  /**
   * Get compliance metrics
   */
  public getComplianceMetrics(dashboardId: string): Record<string, any> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      return {};
    }

    const metrics: Record<string, any> = {
      overallScore: dashboard.overallScore,
      totalFrameworks: dashboard.frameworks.length,
      compliantFrameworks: dashboard.frameworks.filter((f) => f.status === 'compliant').length,
      totalControls: dashboard.frameworks.reduce(
        (sum, f) => sum + f.controlsPassed + f.controlsFailed + f.controlsPending,
        0
      ),
      passedControls: dashboard.frameworks.reduce((sum, f) => sum + f.controlsPassed, 0),
      criticalAlerts: dashboard.criticalAlerts.length,
      upcomingAudits: dashboard.upcomingAudits.filter((a) => a.status === 'scheduled').length,
      lastUpdated: dashboard.lastUpdated,
    };

    return metrics;
  }

  /**
   * Export compliance data
   */
  public exportComplianceData(
    dashboardId: string,
    format: 'json' | 'csv' | 'pdf'
  ): string {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const data = {
      dashboardId: dashboard.id,
      organizationId: dashboard.organizationId,
      exportedAt: new Date().toISOString(),
      overallScore: dashboard.overallScore,
      frameworks: dashboard.frameworks.map((f) => ({
        name: f.framework,
        status: f.status,
        score: f.score,
        controlsPassed: f.controlsPassed,
        controlsFailed: f.controlsFailed,
        evidence: f.evidence.length,
      })),
      alerts: dashboard.criticalAlerts.map((a) => ({
        id: a.id,
        severity: a.severity,
        title: a.title,
        framework: a.framework,
        status: a.resolved ? 'resolved' : 'open',
      })),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(data);
    } else {
      return JSON.stringify(data); // Placeholder for PDF
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    const headers = ['Framework', 'Status', 'Score', 'Passed', 'Failed'];
    const rows = data.frameworks.map((f: any) => [
      f.name,
      f.status,
      f.score,
      f.controlsPassed,
      f.controlsFailed,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return csvContent;
  }

  /**
   * Get compliance recommendations
   */
  public getRecommendations(dashboardId: string): string[] {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return [];

    const recommendations: string[] = [];

    // Check each framework
    for (const framework of dashboard.frameworks) {
      if (framework.status === 'non_compliant') {
        recommendations.push(
          `Immediate action required: ${framework.framework} compliance is non-compliant`
        );
      }

      if (framework.controlsPending > 0) {
        recommendations.push(
          `Complete ${framework.controlsPending} pending controls for ${framework.framework}`
        );
      }

      if (framework.controlsFailed > 0) {
        recommendations.push(
          `Remediate ${framework.controlsFailed} failed controls for ${framework.framework}`
        );
      }
    }

    // Check alerts
    const unresolvedAlerts = dashboard.criticalAlerts.filter((a) => !a.resolved);
    if (unresolvedAlerts.length > 0) {
      recommendations.push(
        `Address ${unresolvedAlerts.length} unresolved critical/high alerts`
      );
    }

    // Check audit schedule
    const overdueAudits = dashboard.upcomingAudits.filter(
      (a) => a.scheduledDate < new Date() && a.status === 'scheduled'
    );
    if (overdueAudits.length > 0) {
      recommendations.push(`${overdueAudits.length} audits are overdue`);
    }

    return recommendations;
  }
}

/**
 * HIPAA Compliance Specific Implementation
 */
export class HIPAAComplianceManager extends OfficeComplianceManager {
  private breachNotifications: Map<string, any> = new Map();

  /**
   * Check HIPAA-specific requirements
   */
  public validateHIPAARequirements(dashboardId: string): {
    secure_storage: boolean;
    access_controls: boolean;
    audit_logging: boolean;
    encryption: boolean;
    data_integrity: boolean;
    transmission_security: boolean;
  } {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) {
      return {
        secure_storage: false,
        access_controls: false,
        audit_logging: false,
        encryption: false,
        data_integrity: false,
        transmission_security: false,
      };
    }

    const hipaaFramework = dashboard.frameworks.find((f) => f.framework === 'HIPAA');

    return {
      secure_storage: hipaaFramework?.controlsPassed ? hipaaFramework.controlsPassed >= 3 : false,
      access_controls: hipaaFramework?.controlsPassed ? hipaaFramework.controlsPassed >= 2 : false,
      audit_logging: hipaaFramework?.controlsPassed ? hipaaFramework.controlsPassed >= 2 : false,
      encryption: hipaaFramework?.controlsPassed ? hipaaFramework.controlsPassed >= 2 : false,
      data_integrity: hipaaFramework?.controlsPassed ? hipaaFramework.controlsPassed >= 1 : false,
      transmission_security: hipaaFramework?.controlsPassed ? hipaaFramework.controlsPassed >= 1 : false,
    };
  }

  /**
   * Register HIPAA breach notification
   */
  public registerBreachNotification(
    organizationId: string,
    affectedIndividuals: number,
    breachDate: Date,
    details: string
  ): string {
    const notificationId = `breach-${uuidv4()}`;

    this.breachNotifications.set(notificationId, {
      id: notificationId,
      organizationId,
      affectedIndividuals,
      breachDate,
      details,
      discoveredAt: new Date(),
      notifiedAt: null,
      status: 'pending_notification',
    });

    return notificationId;
  }
}

/**
 * SOC2 Compliance Specific Implementation
 */
export class SOC2ComplianceManager extends OfficeComplianceManager {
  /**
   * Validate SOC2 trust service criteria
   */
  public validateSOC2Criteria(dashboardId: string): {
    security: number;
    availability: number;
    processing_integrity: number;
    confidentiality: number;
    privacy: number;
  } {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) {
      return {
        security: 0,
        availability: 0,
        processing_integrity: 0,
        confidentiality: 0,
        privacy: 0,
      };
    }

    const soc2Framework = dashboard.frameworks.find((f) => f.framework === 'SOC2');
    const passRate = soc2Framework?.score || 0;

    return {
      security: (passRate * 0.2).toFixed(1) as any,
      availability: (passRate * 0.2).toFixed(1) as any,
      processing_integrity: (passRate * 0.2).toFixed(1) as any,
      confidentiality: (passRate * 0.2).toFixed(1) as any,
      privacy: (passRate * 0.2).toFixed(1) as any,
    };
  }
}

/**
 * ISO 27001 Compliance Specific Implementation
 */
export class ISO27001ComplianceManager extends OfficeComplianceManager {
  /**
   * Validate ISO 27001 information security controls
   */
  public validateISO27001Controls(dashboardId: string): {
    governance: number;
    people: number;
    assets: number;
    access: number;
    operations: number;
    communications: number;
  } {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) {
      return {
        governance: 0,
        people: 0,
        assets: 0,
        access: 0,
        operations: 0,
        communications: 0,
      };
    }

    const isoFramework = dashboard.frameworks.find((f) => f.framework === 'ISO27001');
    const passRate = isoFramework?.score || 0;

    return {
      governance: (passRate * 0.15).toFixed(1) as any,
      people: (passRate * 0.15).toFixed(1) as any,
      assets: (passRate * 0.2).toFixed(1) as any,
      access: (passRate * 0.2).toFixed(1) as any,
      operations: (passRate * 0.2).toFixed(1) as any,
      communications: (passRate * 0.1).toFixed(1) as any,
    };
  }
}

/**
 * GDPR Compliance Specific Implementation
 */
export class GDPRComplianceManager extends OfficeComplianceManager {
  /**
   * Validate GDPR data processing requirements
   */
  public validateGDPRRequirements(dashboardId: string): {
    consent: boolean;
    data_subject_rights: boolean;
    data_protection: boolean;
    breach_notification: boolean;
    dpia: boolean;
    dpo_role: boolean;
  } {
    const dashboard = this.getDashboard(dashboardId);
    if (!dashboard) {
      return {
        consent: false,
        data_subject_rights: false,
        data_protection: false,
        breach_notification: false,
        dpia: false,
        dpo_role: false,
      };
    }

    const gdprFramework = dashboard.frameworks.find((f) => f.framework === 'GDPR');

    return {
      consent: gdprFramework?.controlsPassed ? gdprFramework.controlsPassed >= 2 : false,
      data_subject_rights: gdprFramework?.controlsPassed ? gdprFramework.controlsPassed >= 2 : false,
      data_protection: gdprFramework?.controlsPassed ? gdprFramework.controlsPassed >= 2 : false,
      breach_notification: gdprFramework?.controlsPassed ? gdprFramework.controlsPassed >= 1 : false,
      dpia: gdprFramework?.controlsPassed ? gdprFramework.controlsPassed >= 1 : false,
      dpo_role: gdprFramework?.controlsPassed ? gdprFramework.controlsPassed >= 1 : false,
    };
  }
}
