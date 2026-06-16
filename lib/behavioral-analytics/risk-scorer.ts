/**
 * Risk Scorer - Calculates risk scores for entities
 */

export interface RiskScoreInput {
  anomalies: Array<{
    score: number;
    severity: "low" | "medium" | "high" | "critical";
    timestamp: Date;
  }>;
  behaviors: Array<{
    category: string;
    score: number;
    classification: string;
  }>;
  timeline: Array<{
    timestamp: Date;
    event: string;
    riskLevel: string;
  }>;
  relationships: Array<{
    relatedEntityId: string;
    relationshipType: string;
    riskFactor: number;
  }>;
  profile: {
    riskProfile: {
      baselineRiskScore: number;
      historicalAnomalies: number;
      suspiciousBehaviors: number;
    };
  };
}

export interface RiskScore {
  entityId: string;
  overallScore: number;
  componentScores: {
    anomalyScore: number;
    behaviorScore: number;
    timelineScore: number;
    relationshipScore: number;
  };
  trend: number; // -1 to 1, positive means increasing risk
  lastUpdated: Date;
}

export class RiskScorer {
  private scores: Map<string, RiskScore> = new Map();
  private scoreHistory: Map<string, RiskScore[]> = new Map();
  private readonly WEIGHTS = {
    anomaly: 0.4,
    behavior: 0.25,
    timeline: 0.2,
    relationship: 0.15,
  };

  /**
   * Calculate overall risk score
   */
  async calculateScore(entityId: string, input: RiskScoreInput): Promise<number> {
    try {
      // Calculate component scores
      const anomalyScore = this.calculateAnomalyScore(input.anomalies);
      const behaviorScore = this.calculateBehaviorScore(input.behaviors);
      const timelineScore = this.calculateTimelineScore(input.timeline);
      const relationshipScore = this.calculateRelationshipScore(input.relationships);

      // Weighted combination
      const overallScore =
        anomalyScore * this.WEIGHTS.anomaly +
        behaviorScore * this.WEIGHTS.behavior +
        timelineScore * this.WEIGHTS.timeline +
        relationshipScore * this.WEIGHTS.relationship;

      // Calculate trend
      const previousScores = this.scoreHistory.get(entityId) || [];
      let trend = 0;
      if (previousScores.length > 0) {
        const previousScore = previousScores[previousScores.length - 1].overallScore;
        trend = (overallScore - previousScore) / Math.max(previousScore, 0.1);
      }

      const score: RiskScore = {
        entityId,
        overallScore,
        componentScores: {
          anomalyScore,
          behaviorScore,
          timelineScore,
          relationshipScore,
        },
        trend: Math.max(-1, Math.min(1, trend)),
        lastUpdated: new Date(),
      };

      // Store score
      this.scores.set(entityId, score);

      // Keep history (last 90 days)
      const history = this.scoreHistory.get(entityId) || [];
      history.push(score);
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const filtered = history.filter((s) => s.lastUpdated.getTime() > ninetyDaysAgo);
      this.scoreHistory.set(entityId, filtered);

      return overallScore;
    } catch (error) {
      console.error("[RiskScorer] Calculation error:", error);
      throw error;
    }
  }

  /**
   * Get top risks
   */
  async getTopRisks(limit: number = 10): Promise<Array<{ entityId: string; score: number }>> {
    return Array.from(this.scores.values())
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit)
      .map((s) => ({
        entityId: s.entityId,
        score: s.overallScore,
      }));
  }

  /**
   * Get risk trend for an entity
   */
  async getRiskTrend(
    entityId: string,
    days: number = 30
  ): Promise<Array<{ date: Date; score: number }>> {
    const history = this.scoreHistory.get(entityId) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return history
      .filter((s) => s.lastUpdated >= cutoffDate)
      .map((s) => ({
        date: s.lastUpdated,
        score: s.overallScore,
      }));
  }

  /**
   * Get risk distribution across all entities
   */
  async getRiskDistribution(): Promise<{
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const score of this.scores.values()) {
      if (score.overallScore >= 0.8) {
        critical++;
      } else if (score.overallScore >= 0.6) {
        high++;
      } else if (score.overallScore >= 0.4) {
        medium++;
      } else {
        low++;
      }
    }

    return { critical, high, medium, low };
  }

  /**
   * Calculate anomaly component score
   */
  private calculateAnomalyScore(
    anomalies: Array<{
      score: number;
      severity: "low" | "medium" | "high" | "critical";
      timestamp: Date;
    }>
  ): number {
    if (anomalies.length === 0) return 0;

    // Weight recent anomalies higher
    const now = Date.now();
    let weighted = 0;
    let totalWeight = 0;

    for (const anomaly of anomalies) {
      const ageHours = (now - anomaly.timestamp.getTime()) / (1000 * 60 * 60);
      const decayFactor = Math.exp(-ageHours / 168); // Decay over 1 week

      const severityWeight = this.getSeverityWeight(anomaly.severity);
      const weight = decayFactor * severityWeight;

      weighted += anomaly.score * weight;
      totalWeight += weight;
    }

    return Math.min(1, weighted / Math.max(totalWeight, 1));
  }

  /**
   * Calculate behavior component score
   */
  private calculateBehaviorScore(
    behaviors: Array<{
      category: string;
      score: number;
      classification: string;
    }>
  ): number {
    if (behaviors.length === 0) return 0;

    const avgScore = behaviors.reduce((sum, b) => sum + b.score, 0) / behaviors.length;
    return Math.min(1, avgScore);
  }

  /**
   * Calculate timeline component score
   */
  private calculateTimelineScore(
    timeline: Array<{
      timestamp: Date;
      event: string;
      riskLevel: string;
    }>
  ): number {
    if (timeline.length === 0) return 0;

    // Look for clustering of high-risk events
    const highRiskCount = timeline.filter((t) => t.riskLevel === "high").length;
    const criticalCount = timeline.filter((t) => t.riskLevel === "critical").length;

    const score = (highRiskCount * 0.3 + criticalCount * 0.7) / Math.max(timeline.length, 1);
    return Math.min(1, score);
  }

  /**
   * Calculate relationship component score
   */
  private calculateRelationshipScore(
    relationships: Array<{
      relatedEntityId: string;
      relationshipType: string;
      riskFactor: number;
    }>
  ): number {
    if (relationships.length === 0) return 0;

    const avgRiskFactor = relationships.reduce((sum, r) => sum + r.riskFactor, 0) / relationships.length;
    return Math.min(1, avgRiskFactor);
  }

  /**
   * Get severity weight
   */
  private getSeverityWeight(severity: "low" | "medium" | "high" | "critical"): number {
    switch (severity) {
      case "critical":
        return 1.0;
      case "high":
        return 0.7;
      case "medium":
        return 0.4;
      case "low":
        return 0.2;
    }
  }

  /**
   * Get entity risk score
   */
  async getEntityScore(entityId: string): Promise<RiskScore | null> {
    return this.scores.get(entityId) || null;
  }

  /**
   * Compare risk scores
   */
  async compareScores(entityId1: string, entityId2: string): Promise<{
    entity1: RiskScore | null;
    entity2: RiskScore | null;
    difference: number;
  }> {
    const score1 = this.scores.get(entityId1);
    const score2 = this.scores.get(entityId2);

    return {
      entity1: score1 || null,
      entity2: score2 || null,
      difference: (score1?.overallScore || 0) - (score2?.overallScore || 0),
    };
  }

  /**
   * Get all scores
   */
  async getAllScores(): Promise<RiskScore[]> {
    return Array.from(this.scores.values());
  }

  /**
   * Clear old scores from history
   */
  async clearOldScores(olderThanDays: number): Promise<void> {
    const cutoffDate = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    for (const [entityId, history] of this.scoreHistory) {
      const filtered = history.filter((s) => s.lastUpdated.getTime() > cutoffDate);
      if (filtered.length === 0) {
        this.scoreHistory.delete(entityId);
      } else {
        this.scoreHistory.set(entityId, filtered);
      }
    }
  }
}

export default RiskScorer;
