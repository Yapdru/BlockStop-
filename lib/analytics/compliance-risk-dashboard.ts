import { ComplianceControl } from './types';
import { calculateCompliance, normalizeScore } from './utils';
import { COMPLIANCE_FRAMEWORKS, COMPLIANCE_STATUS } from './constants';

export class ComplianceRiskDashboard {
  private controls: Map<string, ComplianceControl> = new Map();
  private frameworkControls: Map<string, Set<string>> = new Map();

  registerControl(control: ComplianceControl): void {
    this.controls.set(control.id, control);

    if (!this.frameworkControls.has(control.framework)) {
      this.frameworkControls.set(control.framework, new Set());
    }
    this.frameworkControls.get(control.framework)!.add(control.id);
  }

  updateControlStatus(controlId: string, status: string, riskScore: number): void {
    const control = this.controls.get(controlId);
    if (control) {
      control.status = status as any;
      control.riskScore = normalizeScore(riskScore, 0, 100);
      control.lastAudited = new Date();
    }
  }

  getFrameworkCompliance(framework: string): number {
    const controlIds = this.frameworkControls.get(framework) || new Set();
    if (controlIds.size === 0) return 0;

    const controls = Array.from(controlIds).map(id => this.controls.get(id)).filter(Boolean) as ComplianceControl[];
    const compliantControls = controls.filter(c => c.status === COMPLIANCE_STATUS.COMPLIANT).length;

    return calculateCompliance(compliantControls, controls.length);
  }

  getDashboardMetrics(): object {
    const metrics: Record<string, any> = {};

    this.frameworkControls.forEach((_, framework) => {
      metrics[framework] = {
        compliance: this.getFrameworkCompliance(framework),
        riskScore: this.calculateFrameworkRisk(framework),
        controlCount: this.frameworkControls.get(framework)?.size || 0,
      };
    });

    return metrics;
  }

  private calculateFrameworkRisk(framework: string): number {
    const controlIds = this.frameworkControls.get(framework) || new Set();
    if (controlIds.size === 0) return 0;

    const controls = Array.from(controlIds).map(id => this.controls.get(id)).filter(Boolean) as ComplianceControl[];
    const totalRisk = controls.reduce((sum, c) => sum + c.riskScore, 0);

    return totalRisk / controls.length;
  }

  getNonCompliantControls(): ComplianceControl[] {
    return Array.from(this.controls.values())
      .filter(c => c.status !== COMPLIANCE_STATUS.COMPLIANT)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  getHighRiskControls(threshold: number = 70): ComplianceControl[] {
    return Array.from(this.controls.values())
      .filter(c => c.riskScore >= threshold)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  generateAuditSchedule(): Record<string, Date> {
    const schedule: Record<string, Date> = {};
    const now = new Date();

    Array.from(this.controls.values()).forEach((control) => {
      const daysSinceAudit = (now.getTime() - control.lastAudited.getTime()) / (1000 * 60 * 60 * 24);

      const auditInterval = control.riskScore > 70 ? 30 : control.riskScore > 50 ? 60 : 90;
      const nextAuditDays = Math.max(0, auditInterval - daysSinceAudit);

      schedule[control.id] = new Date(now.getTime() + nextAuditDays * 24 * 60 * 60 * 1000);
    });

    return schedule;
  }

  getComplianceTrend(framework: string, days: number = 30): number[] {
    const trend: number[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const compliance = this.getFrameworkCompliance(framework);
      trend.push(compliance - (Math.random() * 5 - 2.5));
    }

    return trend.map(v => normalizeScore(v, 0, 100));
  }

  generateComplianceReport(framework: string): object {
    const controls = Array.from(this.frameworkControls.get(framework) || new Set())
      .map(id => this.controls.get(id))
      .filter(Boolean) as ComplianceControl[];

    const statusCounts = {
      compliant: controls.filter(c => c.status === COMPLIANCE_STATUS.COMPLIANT).length,
      nonCompliant: controls.filter(c => c.status === COMPLIANCE_STATUS.NON_COMPLIANT).length,
      inProgress: controls.filter(c => c.status === COMPLIANCE_STATUS.IN_PROGRESS).length,
    };

    const highRiskControls = controls.filter(c => c.riskScore >= 70);

    return {
      framework,
      totalControls: controls.length,
      status: statusCounts,
      overallCompliance: this.getFrameworkCompliance(framework),
      riskScore: this.calculateFrameworkRisk(framework),
      highRiskControlCount: highRiskControls.length,
      recommendedActions: this.generateRecommendations(controls),
    };
  }

  private generateRecommendations(controls: ComplianceControl[]): string[] {
    const recommendations: string[] = [];

    const nonCompliant = controls.filter(c => c.status === COMPLIANCE_STATUS.NON_COMPLIANT);
    if (nonCompliant.length > 0) {
      recommendations.push(`Remediate ${nonCompliant.length} non-compliant controls`);
    }

    const highRisk = controls.filter(c => c.riskScore >= 80);
    if (highRisk.length > 0) {
      recommendations.push(`Address critical compliance gaps in ${highRisk.length} controls`);
    }

    const overdue = controls.filter(c => {
      const daysSinceAudit = (Date.now() - c.lastAudited.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceAudit > 90;
    });
    if (overdue.length > 0) {
      recommendations.push(`Schedule audits for ${overdue.length} overdue controls`);
    }

    return recommendations.slice(0, 5);
  }

  getControlDetails(controlId: string): ComplianceControl | null {
    return this.controls.get(controlId) || null;
  }

  calculateOverallCompliance(): number {
    if (this.controls.size === 0) return 0;

    const compliant = Array.from(this.controls.values())
      .filter(c => c.status === COMPLIANCE_STATUS.COMPLIANT).length;

    return calculateCompliance(compliant, this.controls.size);
  }
}
