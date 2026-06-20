import { OrganizationRiskAssessment, RiskFactor } from './types';
import { calculateWeightedScore, normalizeScore, aggregateRiskFactors } from './utils';
import { SCORING_WEIGHTS, RISK_THRESHOLDS } from './constants';

export class OrganizationRiskAssessor {
  private assessments: Map<string, OrganizationRiskAssessment> = new Map();
  private riskFactorHistory: Map<string, RiskFactor[][]> = new Map();

  createAssessment(organizationId: string): OrganizationRiskAssessment {
    const assessment: OrganizationRiskAssessment = {
      organizationId,
      riskScore: 0,
      riskFactors: [],
      complianceStatus: 'unknown',
      lastAssessment: new Date(),
      recommendations: [],
    };

    this.assessments.set(organizationId, assessment);
    this.riskFactorHistory.set(organizationId, []);

    return assessment;
  }

  assessRisk(organizationId: string, factors: Record<string, number>): OrganizationRiskAssessment {
    let assessment = this.assessments.get(organizationId);
    if (!assessment) {
      assessment = this.createAssessment(organizationId);
    }

    assessment.riskFactors = this.buildRiskFactors(factors);
    assessment.riskScore = this.calculateRiskScore(assessment.riskFactors);
    assessment.complianceStatus = this.evaluateComplianceStatus(assessment.riskFactors);
    assessment.recommendations = this.generateRecommendations(assessment.riskFactors);
    assessment.lastAssessment = new Date();

    this.recordRiskHistory(organizationId, assessment.riskFactors);

    return assessment;
  }

  private buildRiskFactors(factors: Record<string, number>): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    const categoryMap: Record<string, string[]> = {
      vulnerability: ['critical', 'high', 'medium'],
      exposure: ['external', 'internal'],
      threat: ['active-campaign', 'known-exploit'],
      compliance: ['hipaa', 'gdpr', 'pci-dss'],
    };

    Object.keys(factors).forEach((key) => {
      const impact = Math.min(100, factors[key] * 1.5);
      const category = this.categorizeRiskFactor(key);

      riskFactors.push({
        category,
        value: normalizeScore(factors[key], 0, 100),
        impact: normalizeScore(impact, 0, 100),
        mitigation: this.suggestMitigation(category, factors[key]),
      });
    });

    return riskFactors;
  }

  private categorizeRiskFactor(key: string): string {
    if (key.includes('vulnerab')) return 'vulnerability';
    if (key.includes('expos')) return 'exposure';
    if (key.includes('threat')) return 'threat';
    if (key.includes('compli')) return 'compliance';
    return 'other';
  }

  private suggestMitigation(category: string, value: number): string {
    const mitigations: Record<string, string[]> = {
      vulnerability: [
        'Apply security patches immediately',
        'Conduct vulnerability assessment',
        'Implement WAF rules',
      ],
      exposure: [
        'Restrict network access',
        'Enable MFA',
        'Deploy network segmentation',
      ],
      threat: [
        'Update threat intelligence',
        'Enhance monitoring',
        'Conduct incident drills',
      ],
      compliance: [
        'Review control implementation',
        'Schedule compliance audit',
        'Update policies',
      ],
    };

    const categoryMitigations = mitigations[category] || [];
    return value > 70 ? categoryMitigations[0] || 'No mitigation available' :
           value > 50 ? categoryMitigations[1] || 'No mitigation available' :
           categoryMitigations[2] || 'Maintain current controls';
  }

  private calculateRiskScore(riskFactors: RiskFactor[]): number {
    if (riskFactors.length === 0) return 0;

    const scores: Record<string, number> = {};
    const weights: Record<string, number> = {};

    riskFactors.forEach((factor) => {
      const key = factor.category;
      scores[key] = (scores[key] || 0) + factor.impact;
      weights[key] = (weights[key] || 0) + 1;
    });

    Object.keys(scores).forEach((key) => {
      scores[key] = scores[key] / weights[key];
    });

    return calculateWeightedScore(scores, SCORING_WEIGHTS as any);
  }

  private evaluateComplianceStatus(riskFactors: RiskFactor[]): string {
    const complianceFactors = riskFactors.filter(f => f.category === 'compliance');
    if (complianceFactors.length === 0) return 'unknown';

    const avgCompliance = complianceFactors.reduce((sum, f) => sum + (100 - f.value), 0) / complianceFactors.length;

    if (avgCompliance >= 90) return 'compliant';
    if (avgCompliance >= 70) return 'partially-compliant';
    if (avgCompliance >= 40) return 'non-compliant';
    return 'critical-non-compliance';
  }

  private generateRecommendations(riskFactors: RiskFactor[]): string[] {
    const recommendations: string[] = [];

    const criticalFactors = riskFactors.filter(f => f.value >= 80).slice(0, 3);
    criticalFactors.forEach((factor) => {
      recommendations.push(`Address critical ${factor.category} risk: ${factor.mitigation}`);
    });

    const highFactors = riskFactors.filter(f => f.value >= 60 && f.value < 80).slice(0, 2);
    highFactors.forEach((factor) => {
      recommendations.push(`Improve ${factor.category} controls`);
    });

    return recommendations;
  }

  private recordRiskHistory(organizationId: string, factors: RiskFactor[]): void {
    const history = this.riskFactorHistory.get(organizationId) || [];
    history.push([...factors]);

    if (history.length > 100) {
      history.shift();
    }

    this.riskFactorHistory.set(organizationId, history);
  }

  getAssessment(organizationId: string): OrganizationRiskAssessment | null {
    return this.assessments.get(organizationId) || null;
  }

  getRiskTrend(organizationId: string): number {
    const history = this.riskFactorHistory.get(organizationId) || [];
    if (history.length < 2) return 0;

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const recentAvg = this.calculateHistoryAverage(recent);
    const olderAvg = this.calculateHistoryAverage(older);

    return recentAvg - olderAvg;
  }

  private calculateHistoryAverage(history: RiskFactor[][]): number {
    if (history.length === 0) return 0;

    const total = history.reduce((sum, factors) => {
      return sum + factors.reduce((fSum, f) => fSum + f.value, 0) / factors.length;
    }, 0);

    return total / history.length;
  }

  getTopRisks(organizationId: string, limit: number = 5): RiskFactor[] {
    const assessment = this.assessments.get(organizationId);
    if (!assessment) return [];

    return assessment.riskFactors
      .sort((a, b) => (b.impact * b.value) - (a.impact * a.value))
      .slice(0, limit);
  }

  compareOrganizations(orgId1: string, orgId2: string): Record<string, number> {
    const assessment1 = this.assessments.get(orgId1);
    const assessment2 = this.assessments.get(orgId2);

    if (!assessment1 || !assessment2) return {};

    return {
      score_difference: assessment2.riskScore - assessment1.riskScore,
      risk_ratio: assessment1.riskScore > 0 ? assessment2.riskScore / assessment1.riskScore : 1,
    };
  }
}
