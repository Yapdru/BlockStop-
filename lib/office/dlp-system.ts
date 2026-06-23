/**
 * BlockStop OFFICE Tier - Data Loss Prevention (DLP) System
 * Enterprise-grade DLP policies, detection, and remediation
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DLPPolicy,
  DLPCondition,
  DLPAction,
  DLPScope,
  DLPViolation,
  DataClassification,
} from '@/types/office-tier';

export class DLPSystem {
  private policies: Map<string, DLPPolicy> = new Map();
  private violations: Map<string, DLPViolation> = new Map();
  private violationHistory: DLPViolation[] = [];

  /**
   * Create DLP policy
   */
  public createPolicy(
    organizationId: string,
    policy: Omit<DLPPolicy, 'id' | 'createdAt' | 'lastModified'>
  ): DLPPolicy {
    const newPolicy: DLPPolicy = {
      ...policy,
      id: `dlp-${uuidv4()}`,
      createdAt: new Date(),
      lastModified: new Date(),
    };

    this.policies.set(newPolicy.id, newPolicy);
    return newPolicy;
  }

  /**
   * Get policy by ID
   */
  public getPolicy(policyId: string): DLPPolicy | null {
    return this.policies.get(policyId) || null;
  }

  /**
   * Get all policies for organization
   */
  public getOrganizationPolicies(organizationId: string): DLPPolicy[] {
    return Array.from(this.policies.values()).filter((p) => p.organizationId === organizationId);
  }

  /**
   * Update policy
   */
  public updatePolicy(policyId: string, updates: Partial<DLPPolicy>): DLPPolicy {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const updated: DLPPolicy = {
      ...policy,
      ...updates,
      id: policy.id,
      createdAt: policy.createdAt,
      lastModified: new Date(),
    };

    this.policies.set(policyId, updated);
    return updated;
  }

  /**
   * Delete policy
   */
  public deletePolicy(policyId: string): void {
    this.policies.delete(policyId);
  }

  /**
   * Enable/disable policy
   */
  public setPolicyStatus(policyId: string, enabled: boolean): void {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    policy.enabled = enabled;
    policy.lastModified = new Date();
  }

  /**
   * Analyze content for DLP violations
   */
  public analyzeContent(
    organizationId: string,
    content: string,
    contentType: string,
    actor: string,
    targetRecipient?: string
  ): DLPViolation[] {
    const policies = this.getOrganizationPolicies(organizationId).filter((p) => p.enabled);
    const violations: DLPViolation[] = [];

    for (const policy of policies) {
      // Check if content matches policy conditions
      const matches = this.evaluateConditions(content, policy.conditions);

      if (matches) {
        // Check scope
        const inScope = this.evaluateScope(actor, contentType, policy.scope);

        if (inScope) {
          const violation: DLPViolation = {
            id: `vio-${uuidv4()}`,
            policyId: policy.id,
            triggeredAt: new Date(),
            violationType: 'detected',
            actor,
            targetRecipient,
            contentSummary: content.substring(0, 100),
            action: policy.actions[0],
            status: 'open',
          };

          this.violations.set(violation.id, violation);
          this.violationHistory.push(violation);
          violations.push(violation);
        }
      }
    }

    return violations;
  }

  /**
   * Evaluate conditions against content
   */
  private evaluateConditions(content: string, conditions: DLPCondition[]): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(content, condition)) {
        return false;
      }
    }
    return conditions.length > 0;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(content: string, condition: DLPCondition): boolean {
    const value = Array.isArray(condition.value) ? condition.value : [condition.value];

    switch (condition.operator) {
      case 'contains':
        return value.some((v) => content.includes(v));
      case 'equals':
        return value.includes(content);
      case 'matches_pattern':
        return value.some((v) => new RegExp(v).test(content));
      case 'is_greater_than':
        return content.length > parseInt(value[0]);
      default:
        return false;
    }
  }

  /**
   * Evaluate if content is in policy scope
   */
  private evaluateScope(actor: string, contentType: string, scope: DLPScope): boolean {
    const inChannelScope = scope.channels.includes(contentType as any);
    return inChannelScope;
  }

  /**
   * Get violation by ID
   */
  public getViolation(violationId: string): DLPViolation | null {
    return this.violations.get(violationId) || null;
  }

  /**
   * Get all violations for organization
   */
  public getOrganizationViolations(
    organizationId: string,
    filters?: {
      status?: string;
      severity?: string;
      policyId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): DLPViolation[] {
    let violations = Array.from(this.violations.values());

    // Filter by policy organization
    const policies = this.getOrganizationPolicies(organizationId);
    const policyIds = policies.map((p) => p.id);
    violations = violations.filter((v) => policyIds.includes(v.policyId));

    // Apply filters
    if (filters?.status) {
      violations = violations.filter((v) => v.status === filters.status);
    }
    if (filters?.policyId) {
      violations = violations.filter((v) => v.policyId === filters.policyId);
    }
    if (filters?.startDate) {
      violations = violations.filter((v) => v.triggeredAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      violations = violations.filter((v) => v.triggeredAt <= filters.endDate!);
    }

    return violations;
  }

  /**
   * Update violation status
   */
  public updateViolationStatus(
    violationId: string,
    status: DLPViolation['status'],
    notes?: string
  ): void {
    const violation = this.violations.get(violationId);
    if (!violation) {
      throw new Error(`Violation ${violationId} not found`);
    }

    violation.status = status;
  }

  /**
   * Approve violation (allow exception)
   */
  public approveViolation(violationId: string, approvedBy: string, reason: string): void {
    const violation = this.violations.get(violationId);
    if (!violation) {
      throw new Error(`Violation ${violationId} not found`);
    }

    violation.status = 'approved';
  }

  /**
   * Get DLP statistics
   */
  public getDLPStatistics(
    organizationId: string,
    period: 'day' | 'week' | 'month'
  ): {
    totalViolations: number;
    preventedViolations: number;
    alertedViolations: number;
    auditedViolations: number;
    topPolicies: Array<{ policyId: string; policyName: string; violations: number }>;
    topActors: Array<{ actor: string; violations: number }>;
    violationTrend: Array<{ date: string; count: number }>;
  } {
    const now = new Date();
    const daysBack = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const violations = this.getOrganizationViolations(organizationId, {
      startDate,
      endDate: now,
    });

    // Calculate statistics
    const preventedViolations = violations.filter(
      (v) => v.action.type === 'block'
    ).length;
    const alertedViolations = violations.filter((v) => v.action.type === 'alert').length;
    const auditedViolations = violations.filter((v) => v.action.type === 'audit').length;

    // Get top policies
    const policyMap = new Map<string, number>();
    violations.forEach((v) => {
      policyMap.set(v.policyId, (policyMap.get(v.policyId) || 0) + 1);
    });

    const topPolicies = Array.from(policyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([policyId, count]) => ({
        policyId,
        policyName: this.getPolicy(policyId)?.name || 'Unknown',
        violations: count,
      }));

    // Get top actors
    const actorMap = new Map<string, number>();
    violations.forEach((v) => {
      actorMap.set(v.actor, (actorMap.get(v.actor) || 0) + 1);
    });

    const topActors = Array.from(actorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([actor, count]) => ({
        actor,
        violations: count,
      }));

    // Calculate trend
    const violationTrend = this.calculateTrend(violations, daysBack);

    return {
      totalViolations: violations.length,
      preventedViolations,
      alertedViolations,
      auditedViolations,
      topPolicies,
      topActors,
      violationTrend,
    };
  }

  /**
   * Calculate violation trend
   */
  private calculateTrend(
    violations: DLPViolation[],
    daysBack: number
  ): Array<{ date: string; count: number }> {
    const trend: Map<string, number> = new Map();

    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trend.set(dateStr, 0);
    }

    violations.forEach((v) => {
      const dateStr = v.triggeredAt.toISOString().split('T')[0];
      trend.set(dateStr, (trend.get(dateStr) || 0) + 1);
    });

    return Array.from(trend.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Create classification-based DLP policy template
   */
  public createClassificationPolicy(
    organizationId: string,
    classification: DataClassification
  ): DLPPolicy {
    const classificationConfigs: Record<DataClassification, { name: string; severity: string }> = {
      [DataClassification.PII]: {
        name: 'PII Protection Policy',
        severity: 'high',
      },
      [DataClassification.PHI]: {
        name: 'PHI Protection Policy',
        severity: 'critical',
      },
      [DataClassification.PSI]: {
        name: 'Payment System Protection Policy',
        severity: 'critical',
      },
      [DataClassification.GENETIC]: {
        name: 'Genetic Information Protection Policy',
        severity: 'critical',
      },
      [DataClassification.BIOMETRIC]: {
        name: 'Biometric Data Protection Policy',
        severity: 'high',
      },
    };

    const config = classificationConfigs[classification];

    return this.createPolicy(organizationId, {
      name: config.name,
      description: `Automatic policy for ${classification} data protection`,
      enabled: true,
      priority: classification === DataClassification.PHI ? 1 : 2,
      conditions: [
        {
          type: 'content',
          operator: 'matches_pattern',
          value: this.getClassificationPatterns(classification),
        },
      ],
      actions: [
        {
          type: 'block',
          severity: config.severity as 'low' | 'medium' | 'high' | 'critical',
          blockMessage: `${classification} data cannot be sent outside secure channels`,
        },
      ],
      scope: {
        channels: ['email', 'teams', 'cloud_storage'],
        dataClassifications: [classification],
      },
    });
  }

  /**
   * Get regex patterns for data classification
   */
  private getClassificationPatterns(classification: DataClassification): string[] {
    const patterns: Record<DataClassification, string[]> = {
      [DataClassification.PII]: [
        '\\b\\d{3}-\\d{2}-\\d{4}\\b', // SSN
        '\\b\\d{3}-\\d{3}-\\d{4}\\b', // Phone
        '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b', // Email
      ],
      [DataClassification.PHI]: [
        '\\bMRN[:\\s]+\\d+\\b', // Medical Record Number
        '\\bDOB[:\\s]+\\d{1,2}/\\d{1,2}/\\d{4}\\b', // Date of Birth
        '\\bDiagnosis[:\\s]+', // Diagnosis
      ],
      [DataClassification.PSI]: [
        '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b', // Card number
        '\\bPAN[:\\s]+[A-Z]{5}\\d{4}[A-Z]{1}\\b', // PAN
      ],
      [DataClassification.GENETIC]: [
        '\\bgenetic[:\\s]+', // Genetic markers
        '\\bDNA[:\\s]+', // DNA data
      ],
      [DataClassification.BIOMETRIC]: [
        '\\bfingerprint[:\\s]+', // Fingerprint
        '\\biris[:\\s]+', // Iris data
      ],
    };

    return patterns[classification] || [];
  }

  /**
   * Export DLP report
   */
  public exportDLPReport(
    organizationId: string,
    format: 'json' | 'csv' | 'pdf'
  ): string {
    const policies = this.getOrganizationPolicies(organizationId);
    const violations = this.getOrganizationViolations(organizationId);
    const stats = this.getDLPStatistics(organizationId, 'month');

    const report = {
      organizationId,
      exportedAt: new Date().toISOString(),
      policies: policies.length,
      enabledPolicies: policies.filter((p) => p.enabled).length,
      totalViolations: violations.length,
      statistics: stats,
    };

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'csv') {
      return this.convertReportToCSV(report);
    }

    return JSON.stringify(report);
  }

  /**
   * Convert report to CSV
   */
  private convertReportToCSV(report: any): string {
    const headers = [
      'Metric',
      'Value',
    ];
    const rows = [
      ['Total Policies', report.policies],
      ['Enabled Policies', report.enabledPolicies],
      ['Total Violations', report.totalViolations],
      ['Prevented Violations', report.statistics.preventedViolations],
      ['Alerted Violations', report.statistics.alertedViolations],
    ];

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }
}

/**
 * DLP Template Manager
 */
export class DLPTemplateManager {
  private templates: Map<string, any> = new Map();

  /**
   * Get predefined templates
   */
  public getPredefinedTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }> {
    return [
      {
        id: 'template-credit-cards',
        name: 'Credit Card Protection',
        description: 'Prevent credit card numbers from being transmitted',
        category: 'Payment',
      },
      {
        id: 'template-ssn',
        name: 'SSN Protection',
        description: 'Prevent social security numbers from being transmitted',
        category: 'PII',
      },
      {
        id: 'template-medical-records',
        name: 'Medical Records Protection',
        description: 'Prevent protected health information from being transmitted',
        category: 'Healthcare',
      },
      {
        id: 'template-confidential',
        name: 'Confidential Documents',
        description: 'Prevent files marked as confidential from being shared',
        category: 'Documents',
      },
      {
        id: 'template-password',
        name: 'Password Protection',
        description: 'Detect and block password transmission',
        category: 'Security',
      },
    ];
  }

  /**
   * Apply template to organization
   */
  public applyTemplate(organizationId: string, templateId: string): DLPPolicy | null {
    // In production, would create a DLP policy based on template
    return null;
  }
}
