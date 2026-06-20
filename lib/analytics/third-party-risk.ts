import { ThirdPartyRisk } from './types';
import { calculateWeightedScore, normalizeScore } from './utils';

export class ThirdPartyRiskAnalyzer {
  private vendorProfiles: Map<string, ThirdPartyRisk> = new Map();
  private riskAssessmentHistory: Map<string, number[]> = new Map();

  registerVendor(vendorId: string, vendorName: string): ThirdPartyRisk {
    const vendor: ThirdPartyRisk = {
      vendorId,
      vendorName,
      riskScore: 0,
      criticality: 'medium',
      lastRiskAssessment: new Date(),
      complianceStatus: 'unknown',
      incidentHistory: 0,
    };

    this.vendorProfiles.set(vendorId, vendor);
    this.riskAssessmentHistory.set(vendorId, []);

    return vendor;
  }

  assessVendorRisk(vendorId: string, factors: Record<string, number>): ThirdPartyRisk {
    let vendor = this.vendorProfiles.get(vendorId);
    if (!vendor) {
      vendor = this.registerVendor(vendorId, 'Unknown Vendor');
    }

    const riskScore = this.calculateRiskScore(factors);
    vendor.riskScore = normalizeScore(riskScore, 0, 100);
    vendor.criticality = this.determineCriticality(riskScore);
    vendor.lastRiskAssessment = new Date();

    this.recordRiskHistory(vendorId, riskScore);

    return vendor;
  }

  private calculateRiskScore(factors: Record<string, number>): number {
    const weights: Record<string, number> = {
      'security-posture': 0.3,
      'compliance-status': 0.25,
      'incident-history': 0.2,
      'data-exposure': 0.15,
      'access-level': 0.1,
    };

    return calculateWeightedScore(factors, weights);
  }

  private determineCriticality(riskScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (riskScore >= 85) return 'critical';
    if (riskScore >= 65) return 'high';
    if (riskScore >= 45) return 'medium';
    return 'low';
  }

  private recordRiskHistory(vendorId: string, score: number): void {
    const history = this.riskAssessmentHistory.get(vendorId) || [];
    history.push(score);

    if (history.length > 52) {
      history.shift();
    }

    this.riskAssessmentHistory.set(vendorId, history);
  }

  recordIncident(vendorId: string): void {
    const vendor = this.vendorProfiles.get(vendorId);
    if (vendor) {
      vendor.incidentHistory++;
    }
  }

  updateComplianceStatus(vendorId: string, status: string): void {
    const vendor = this.vendorProfiles.get(vendorId);
    if (vendor) {
      vendor.complianceStatus = status;
    }
  }

  getVendorProfile(vendorId: string): ThirdPartyRisk | null {
    return this.vendorProfiles.get(vendorId) || null;
  }

  getHighRiskVendors(threshold: number = 70): ThirdPartyRisk[] {
    return Array.from(this.vendorProfiles.values())
      .filter(v => v.riskScore >= threshold)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  getCriticalVendors(): ThirdPartyRisk[] {
    return Array.from(this.vendorProfiles.values())
      .filter(v => v.criticality === 'critical')
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  getRiskTrend(vendorId: string): number {
    const history = this.riskAssessmentHistory.get(vendorId) || [];
    if (history.length < 2) return 0;

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  }

  evaluateDataExposure(vendorId: string, dataTypes: string[], dataVolume: number): number {
    const vendor = this.vendorProfiles.get(vendorId);
    if (!vendor) return 0;

    const sensitiveDataTypes = ['pii', 'phi', 'financial', 'intellectual-property'];
    const exposedSensitiveData = dataTypes.filter(dt => sensitiveDataTypes.includes(dt)).length;

    const dataExposureScore = (exposedSensitiveData / dataTypes.length) * 50 + (dataVolume / 1000000) * 50;

    return normalizeScore(dataExposureScore, 0, 100);
  }

  calculateAggregateVendorRisk(): number {
    if (this.vendorProfiles.size === 0) return 0;

    const totalRisk = Array.from(this.vendorProfiles.values())
      .reduce((sum, v) => sum + v.riskScore, 0);

    return totalRisk / this.vendorProfiles.size;
  }

  getVendorRiskDistribution(): Record<string, number> {
    const distribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    this.vendorProfiles.forEach((vendor) => {
      distribution[vendor.criticality]++;
    });

    return distribution;
  }

  generateVendorAssessmentReport(vendorId: string): object {
    const vendor = this.vendorProfiles.get(vendorId);
    if (!vendor) return {};

    const trend = this.getRiskTrend(vendorId);
    const trendDirection = trend > 5 ? 'increasing' : trend < -5 ? 'decreasing' : 'stable';

    return {
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      riskScore: vendor.riskScore.toFixed(2),
      criticality: vendor.criticality,
      complianceStatus: vendor.complianceStatus,
      incidentHistory: vendor.incidentHistory,
      trendDirection,
      trendValue: trend.toFixed(2),
      lastAssessment: vendor.lastRiskAssessment.toISOString(),
      recommendations: this.generateRecommendations(vendor),
    };
  }

  private generateRecommendations(vendor: ThirdPartyRisk): string[] {
    const recommendations: string[] = [];

    if (vendor.riskScore >= 80) {
      recommendations.push('Conduct comprehensive security audit');
      recommendations.push('Review contract and SLAs');
      recommendations.push('Implement enhanced monitoring');
    } else if (vendor.riskScore >= 60) {
      recommendations.push('Schedule compliance review');
      recommendations.push('Request recent SOC2 report');
    }

    if (vendor.incidentHistory > 2) {
      recommendations.push('Investigate previous incidents');
    }

    if (vendor.complianceStatus === 'non-compliant') {
      recommendations.push('Develop remediation plan');
    }

    return recommendations.slice(0, 3);
  }

  compareVendors(vendorId1: string, vendorId2: string): object {
    const vendor1 = this.vendorProfiles.get(vendorId1);
    const vendor2 = this.vendorProfiles.get(vendorId2);

    if (!vendor1 || !vendor2) return {};

    return {
      vendor1: {
        name: vendor1.vendorName,
        riskScore: vendor1.riskScore,
        criticality: vendor1.criticality,
      },
      vendor2: {
        name: vendor2.vendorName,
        riskScore: vendor2.riskScore,
        criticality: vendor2.criticality,
      },
      scoreDifference: (vendor2.riskScore - vendor1.riskScore).toFixed(2),
    };
  }
}
