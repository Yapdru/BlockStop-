import { SecurityPostureScore } from './types';
import { calculateWeightedScore, normalizeScore, calculateTrendDirection } from './utils';

export class SecurityPostureScorer {
  private scores: Map<string, SecurityPostureScore> = new Map();
  private scoreHistory: Map<string, number[]> = new Map();

  calculatePostureScore(organizationId: string, categoryScores: Record<string, number>): SecurityPostureScore {
    const overallScore = this.calculateOverallScore(categoryScores);
    const trend = this.calculateTrend(organizationId, overallScore);

    const score: SecurityPostureScore = {
      organizationId,
      overallScore: normalizeScore(overallScore, 0, 100),
      categoryScores: this.normalizeCategories(categoryScores),
      trend,
      recommendations: this.generateRecommendations(categoryScores),
      updatedAt: new Date(),
    };

    this.scores.set(organizationId, score);
    this.recordScoreHistory(organizationId, overallScore);

    return score;
  }

  private calculateOverallScore(categoryScores: Record<string, number>): number {
    const weights: Record<string, number> = {
      'access-control': 0.2,
      'threat-detection': 0.2,
      'incident-response': 0.15,
      'vulnerability-management': 0.15,
      'data-protection': 0.15,
      'governance': 0.15,
    };

    return calculateWeightedScore(categoryScores, weights);
  }

  private normalizeCategories(categoryScores: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};

    Object.keys(categoryScores).forEach((category) => {
      normalized[category] = normalizeScore(categoryScores[category], 0, 100);
    });

    return normalized;
  }

  private calculateTrend(organizationId: string, newScore: number): number {
    const history = this.scoreHistory.get(organizationId) || [];
    history.push(newScore);

    if (history.length > 1) {
      this.scoreHistory.set(organizationId, history);
    }

    if (history.length < 2) return 0;

    const recentHistory = history.slice(-7);
    return calculateTrendDirection(recentHistory);
  }

  private recordScoreHistory(organizationId: string, score: number): void {
    const history = this.scoreHistory.get(organizationId) || [];
    history.push(score);

    if (history.length > 365) {
      history.shift();
    }

    this.scoreHistory.set(organizationId, history);
  }

  private generateRecommendations(categoryScores: Record<string, number>): string[] {
    const recommendations: string[] = [];
    const sortedCategories = Object.entries(categoryScores)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);

    sortedCategories.forEach(([category, score]) => {
      if (score < 40) {
        recommendations.push(`Critical: Strengthen ${category} - Current score: ${score}`);
      } else if (score < 60) {
        recommendations.push(`Important: Improve ${category} controls`);
      } else if (score < 80) {
        recommendations.push(`Monitor: ${category} requires attention`);
      }
    });

    return recommendations;
  }

  getPostureScore(organizationId: string): SecurityPostureScore | null {
    return this.scores.get(organizationId) || null;
  }

  getScoreTrend(organizationId: string, days: number = 30): number[] {
    const history = this.scoreHistory.get(organizationId) || [];
    return history.slice(-days);
  }

  assessCategoryWeakness(categoryScores: Record<string, number>): string[] {
    const weaknesses: string[] = [];

    Object.entries(categoryScores).forEach(([category, score]) => {
      if (score < 50) {
        weaknesses.push(`${category}: ${score}`);
      }
    });

    return weaknesses.sort((a, b) => {
      const scoreA = parseInt(a.split(': ')[1]);
      const scoreB = parseInt(b.split(': ')[1]);
      return scoreA - scoreB;
    });
  }

  getAverageScore(organizationIds: string[]): number {
    const scores = organizationIds
      .map(id => this.scores.get(id)?.overallScore || 0)
      .filter(s => s > 0);

    if (scores.length === 0) return 0;

    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  getScorePercentile(organizationId: string, allScores: SecurityPostureScore[]): number {
    const targetScore = this.scores.get(organizationId)?.overallScore || 0;

    const betterScores = allScores.filter(s => s.overallScore > targetScore).length;
    return (betterScores / Math.max(1, allScores.length)) * 100;
  }

  improvementRequired(organizationId: string, targetScore: number = 80): boolean {
    const score = this.scores.get(organizationId);
    return score ? score.overallScore < targetScore : true;
  }

  generatePostureReport(organizationId: string): object {
    const score = this.scores.get(organizationId);
    if (!score) return {};

    const trend = score.trend > 0 ? 'improving' : score.trend < 0 ? 'declining' : 'stable';

    return {
      organizationId,
      overallScore: score.overallScore,
      trend,
      trendValue: (score.trend * 100).toFixed(2),
      categories: score.categoryScores,
      recommendations: score.recommendations,
      riskLevel: score.overallScore >= 80 ? 'low' :
                 score.overallScore >= 60 ? 'medium' :
                 score.overallScore >= 40 ? 'high' : 'critical',
      updatedAt: score.updatedAt.toISOString(),
    };
  }

  compareOrganizations(orgIds: string[]): object[] {
    return orgIds
      .map(id => ({
        organizationId: id,
        score: this.scores.get(id)?.overallScore || 0,
        trend: this.scores.get(id)?.trend || 0,
        riskLevel: this.getRiskLevel(this.scores.get(id)?.overallScore || 0),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private getRiskLevel(score: number): string {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }
}
