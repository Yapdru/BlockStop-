import { AssetRiskProfile, VulnerabilityInfo } from './types';
import { normalizeScore, calculateWeightedScore } from './utils';

export class AssetRiskAnalyzer {
  private assetProfiles: Map<string, AssetRiskProfile> = new Map();
  private assetsByType: Map<string, Set<string>> = new Map();
  private riskHistory: Map<string, number[]> = new Map();

  registerAsset(assetId: string, assetType: string, owner: string): AssetRiskProfile {
    const profile: AssetRiskProfile = {
      assetId,
      assetType,
      riskScore: 0,
      vulnerabilities: [],
      exposureLevel: 'low',
      lastAssessed: new Date(),
      owner,
    };

    this.assetProfiles.set(assetId, profile);

    if (!this.assetsByType.has(assetType)) {
      this.assetsByType.set(assetType, new Set());
    }
    this.assetsByType.get(assetType)!.add(assetId);
    this.riskHistory.set(assetId, []);

    return profile;
  }

  assessAssetRisk(assetId: string, vulnCount: Record<string, number>, exposureFactors: Record<string, number>): AssetRiskProfile {
    let profile = this.assetProfiles.get(assetId);
    if (!profile) {
      profile = this.registerAsset(assetId, 'unknown', 'unassigned');
    }

    const vulnScore = this.calculateVulnerabilityScore(vulnCount);
    const exposureScore = calculateWeightedScore(exposureFactors, {
      'internet-facing': 0.3,
      'public-access': 0.25,
      'data-sensitivity': 0.25,
      'criticality': 0.2,
    });

    const riskScore = (vulnScore * 0.6 + exposureScore * 0.4);
    profile.riskScore = normalizeScore(riskScore, 0, 100);
    profile.exposureLevel = this.determineExposureLevel(profile.riskScore);
    profile.lastAssessed = new Date();

    this.recordRiskHistory(assetId, profile.riskScore);

    return profile;
  }

  private calculateVulnerabilityScore(vulnCount: Record<string, number>): number {
    const weights = {
      critical: 0.4,
      high: 0.3,
      medium: 0.2,
      low: 0.1,
    };

    let score = 0;
    Object.keys(weights).forEach((severity) => {
      const count = vulnCount[severity] || 0;
      score += (count * weights[severity as keyof typeof weights]) * 10;
    });

    return normalizeScore(score, 0, 100);
  }

  private determineExposureLevel(riskScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (riskScore >= 85) return 'critical';
    if (riskScore >= 65) return 'high';
    if (riskScore >= 45) return 'medium';
    return 'low';
  }

  private recordRiskHistory(assetId: string, score: number): void {
    const history = this.riskHistory.get(assetId) || [];
    history.push(score);

    if (history.length > 52) {
      history.shift();
    }

    this.riskHistory.set(assetId, history);
  }

  addVulnerability(assetId: string, vuln: VulnerabilityInfo): void {
    const profile = this.assetProfiles.get(assetId);
    if (profile) {
      profile.vulnerabilities.push(vuln);
    }
  }

  getAssetProfile(assetId: string): AssetRiskProfile | null {
    return this.assetProfiles.get(assetId) || null;
  }

  getAssetsByRiskLevel(riskLevel: string): string[] {
    const assets: string[] = [];

    this.assetProfiles.forEach((profile, assetId) => {
      if (profile.exposureLevel === riskLevel) {
        assets.push(assetId);
      }
    });

    return assets;
  }

  getAssetsByType(assetType: string): AssetRiskProfile[] {
    const assetIds = this.assetsByType.get(assetType) || new Set();
    return Array.from(assetIds)
      .map(id => this.assetProfiles.get(id))
      .filter(Boolean) as AssetRiskProfile[];
  }

  calculateTypeRiskAverage(assetType: string): number {
    const assets = this.getAssetsByType(assetType);
    if (assets.length === 0) return 0;

    const totalRisk = assets.reduce((sum, a) => sum + a.riskScore, 0);
    return totalRisk / assets.length;
  }

  getRiskTrend(assetId: string): number {
    const history = this.riskHistory.get(assetId) || [];
    if (history.length < 2) return 0;

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  }

  getCriticalAssets(threshold: number = 80): AssetRiskProfile[] {
    return Array.from(this.assetProfiles.values())
      .filter(p => p.riskScore >= threshold)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  generateAssetRiskReport(assetId: string): object {
    const profile = this.assetProfiles.get(assetId);
    if (!profile) return {};

    const exploitableVulns = profile.vulnerabilities.filter(v => v.exploitable).length;
    const avgCVSS = profile.vulnerabilities.length > 0 ?
      profile.vulnerabilities.reduce((sum, v) => sum + v.cvss, 0) / profile.vulnerabilities.length : 0;

    const trend = this.getRiskTrend(assetId);
    const trendDirection = trend > 5 ? 'increasing' : trend < -5 ? 'decreasing' : 'stable';

    return {
      assetId: profile.assetId,
      assetType: profile.assetType,
      owner: profile.owner,
      riskScore: profile.riskScore.toFixed(2),
      exposureLevel: profile.exposureLevel,
      vulnerabilities: {
        total: profile.vulnerabilities.length,
        exploitable: exploitableVulns,
        averageCVSS: avgCVSS.toFixed(2),
      },
      trendDirection,
      lastAssessed: profile.lastAssessed.toISOString(),
      recommendations: this.generateAssetRecommendations(profile),
    };
  }

  private generateAssetRecommendations(profile: AssetRiskProfile): string[] {
    const recommendations: string[] = [];

    if (profile.riskScore >= 80) {
      recommendations.push('Critical: Immediate remediation required');
      recommendations.push('Consider isolation or decommissioning');
    } else if (profile.riskScore >= 60) {
      recommendations.push('High: Prioritize vulnerability patching');
    }

    const exploitableVulns = profile.vulnerabilities.filter(v => v.exploitable).length;
    if (exploitableVulns > 0) {
      recommendations.push(`Address ${exploitableVulns} exploitable vulnerabilities`);
    }

    return recommendations.slice(0, 3);
  }

  compareAssets(assetId1: string, assetId2: string): object {
    const profile1 = this.assetProfiles.get(assetId1);
    const profile2 = this.assetProfiles.get(assetId2);

    if (!profile1 || !profile2) return {};

    return {
      asset1: {
        id: profile1.assetId,
        riskScore: profile1.riskScore,
        exposureLevel: profile1.exposureLevel,
      },
      asset2: {
        id: profile2.assetId,
        riskScore: profile2.riskScore,
        exposureLevel: profile2.exposureLevel,
      },
      riskDifference: (profile2.riskScore - profile1.riskScore).toFixed(2),
    };
  }

  getAssetRiskDistribution(): Record<string, number> {
    const distribution = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    this.assetProfiles.forEach((profile) => {
      const level = profile.exposureLevel;
      distribution[level]++;
    });

    return distribution;
  }

  getAverageRiskByType(): Record<string, number> {
    const averages: Record<string, number> = {};

    this.assetsByType.forEach((assetIds, assetType) => {
      averages[assetType] = this.calculateTypeRiskAverage(assetType);
    });

    return averages;
  }
}
