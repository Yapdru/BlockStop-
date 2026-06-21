// Phase 28.1 - Predictive Threat Analytics Module
// ML model for predicting next threats based on user history and patterns
// Time-series forecasting and recommendations engine

export interface UserThreatProfile {
  userId: string;
  organizationId: string;
  threatHistory: ThreatEvent[];
  patterns: ThreatPattern[];
  riskScore: number;
  lastUpdated: Date;
}

export interface ThreatEvent {
  id: string;
  timestamp: Date;
  type: 'malware' | 'phishing' | 'intrusion' | 'data-breach' | 'ransomware' | 'ddos' | 'credential-theft';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  target: string;
  blocked: boolean;
  context?: Record<string, any>;
}

export interface ThreatPattern {
  name: string;
  type: 'time-based' | 'frequency-based' | 'behavioral' | 'seasonal';
  frequency: number; // events per time period
  timePeriod: 'hour' | 'day' | 'week' | 'month';
  lastOccurrence: Date;
  nextExpectedOccurrence?: Date;
  confidence: number; // 0-100
}

export interface ThreatPrediction {
  predictedType: 'malware' | 'phishing' | 'intrusion' | 'data-breach' | 'ransomware' | 'ddos' | 'credential-theft';
  probability: number; // 0-100
  timeWindow: {
    start: Date;
    end: Date;
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  reasoning: string[];
  similarHistoricalEvents: ThreatEvent[];
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'prevention' | 'detection' | 'response' | 'remediation';
  affectedThreats: string[];
  estimatedImpact: number; // 0-100
  implementationEffort: 'low' | 'medium' | 'high';
  resources: string[];
}

export interface TimeSeriesForecast {
  threatType: string;
  historicalData: Array<{
    timestamp: Date;
    count: number;
  }>;
  forecast: Array<{
    timestamp: Date;
    predictedCount: number;
    upperBound: number;
    lowerBound: number;
    confidence: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality?: string;
  anomalies: Array<{
    timestamp: Date;
    value: number;
    anomalyScore: number;
  }>;
}

class ThreatPredictor {
  private userProfiles = new Map<string, UserThreatProfile>();
  private predictions = new Map<string, ThreatPrediction[]>();
  private recommendations = new Map<string, SecurityRecommendation[]>();

  /**
   * Load user threat profile
   */
  loadUserProfile(
    userId: string,
    events: ThreatEvent[]
  ): UserThreatProfile {
    const patterns = this.extractPatterns(events);
    const riskScore = this.calculateRiskScore(events);

    const profile: UserThreatProfile = {
      userId,
      organizationId: '', // Set by caller
      threatHistory: events,
      patterns,
      riskScore,
      lastUpdated: new Date(),
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Extract patterns from threat history
   */
  private extractPatterns(events: ThreatEvent[]): ThreatPattern[] {
    const patterns: ThreatPattern[] = [];

    if (events.length === 0) return patterns;

    // Sort events chronologically
    const sortedEvents = [...events].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Extract time-based patterns
    const timeDifferences: number[] = [];
    for (let i = 1; i < sortedEvents.length; i++) {
      const diff =
        sortedEvents[i].timestamp.getTime() -
        sortedEvents[i - 1].timestamp.getTime();
      timeDifferences.push(diff);
    }

    if (timeDifferences.length > 0) {
      const avgTimeDiff = timeDifferences.reduce((a, b) => a + b) / timeDifferences.length;
      const variance =
        timeDifferences.reduce(
          (sum, diff) => sum + Math.pow(diff - avgTimeDiff, 2),
          0
        ) / timeDifferences.length;

      if (variance < avgTimeDiff * 0.5) {
        patterns.push({
          name: 'Regular Event Timing',
          type: 'time-based',
          frequency: 1,
          timePeriod: this.estimateTimePeriod(avgTimeDiff),
          lastOccurrence: sortedEvents[sortedEvents.length - 1].timestamp,
          confidence: Math.min(100, 85 - variance / avgTimeDiff),
        });
      }
    }

    // Extract frequency-based patterns
    const eventCounts = new Map<string, number>();
    sortedEvents.forEach((event) => {
      eventCounts.set(
        event.type,
        (eventCounts.get(event.type) || 0) + 1
      );
    });

    eventCounts.forEach((count, type) => {
      if (count >= 3) {
        patterns.push({
          name: `Frequent ${type} Events`,
          type: 'frequency-based',
          frequency: count,
          timePeriod: 'month',
          lastOccurrence: sortedEvents[sortedEvents.length - 1].timestamp,
          confidence: Math.min(100, count * 15),
        });
      }
    });

    // Extract behavioral patterns
    const blockedRatio = sortedEvents.filter((e) => e.blocked).length / sortedEvents.length;
    if (blockedRatio > 0.5) {
      patterns.push({
        name: 'High Block Rate',
        type: 'behavioral',
        frequency: Math.round(blockedRatio * 100),
        timePeriod: 'month',
        lastOccurrence: sortedEvents[sortedEvents.length - 1].timestamp,
        confidence: 80,
      });
    }

    return patterns;
  }

  /**
   * Estimate time period from milliseconds
   */
  private estimateTimePeriod(
    ms: number
  ): 'hour' | 'day' | 'week' | 'month' {
    const hours = ms / (1000 * 60 * 60);
    if (hours < 3) return 'hour';
    if (hours < 48) return 'day';
    if (hours < 336) return 'week';
    return 'month';
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(events: ThreatEvent[]): number {
    if (events.length === 0) return 0;

    const severityScore = events.reduce((sum, event) => {
      const weight = event.severity === 'critical' ? 100
        : event.severity === 'high' ? 75
          : event.severity === 'medium' ? 50
            : 25;
      return sum + weight;
    }, 0);

    const blockRate = events.filter((e) => e.blocked).length / events.length;
    const blockPenalty = (1 - blockRate) * 25;

    const recentEvents = events.filter(
      (e) => Date.now() - e.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000
    );

    const recentWeight = recentEvents.length > 0 ? 1.2 : 1;

    return Math.min(
      100,
      ((severityScore + blockPenalty) / events.length + recentWeight * 10) / 2
    );
  }

  /**
   * Predict next threats for a user
   */
  predictThreats(userId: string, daysAhead: number = 7): ThreatPrediction[] {
    const profile = this.userProfiles.get(userId);
    if (!profile || profile.threatHistory.length === 0) {
      return [];
    }

    const predictions: ThreatPrediction[] = [];

    // For each threat type in history, make predictions
    const threatTypeMap = new Map<string, ThreatEvent[]>();
    profile.threatHistory.forEach((event) => {
      if (!threatTypeMap.has(event.type)) {
        threatTypeMap.set(event.type, []);
      }
      threatTypeMap.get(event.type)!.push(event);
    });

    threatTypeMap.forEach((events, threatType) => {
      const pattern = profile.patterns.find(
        (p) => p.name.includes(threatType)
      );

      if (pattern) {
        const now = new Date();
        const prediction: ThreatPrediction = {
          predictedType: threatType as any,
          probability: Math.min(
            100,
            pattern.confidence + (events.length * 5)
          ),
          timeWindow: {
            start: now,
            end: new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000),
          },
          severity: this.predictSeverity(events),
          confidence: pattern.confidence,
          reasoning: [
            `${events.length} historical events of type ${threatType}`,
            `Average frequency: ${pattern.frequency} per ${pattern.timePeriod}`,
            `Last occurrence: ${pattern.lastOccurrence.toISOString()}`,
          ],
          similarHistoricalEvents: events.slice(-3),
        };

        predictions.push(prediction);
      }
    });

    // Sort by probability
    predictions.sort((a, b) => b.probability - a.probability);
    this.predictions.set(userId, predictions);

    return predictions;
  }

  /**
   * Predict severity based on historical events
   */
  private predictSeverity(
    events: ThreatEvent[]
  ): 'critical' | 'high' | 'medium' | 'low' {
    const criticalCount = events.filter((e) => e.severity === 'critical').length;
    const highCount = events.filter((e) => e.severity === 'high').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > events.length * 0.5) return 'high';
    return 'medium';
  }

  /**
   * Generate security recommendations
   */
  generateRecommendations(userId: string): SecurityRecommendation[] {
    const profile = this.userProfiles.get(userId);
    const predictions = this.predictions.get(userId);

    if (!profile || !predictions) {
      return [];
    }

    const recommendations: SecurityRecommendation[] = [];
    const recommendationIds = new Set<string>();

    predictions.forEach((prediction, index) => {
      const baseId = `rec-${userId}-${prediction.predictedType}`;
      if (recommendationIds.has(baseId)) return;
      recommendationIds.add(baseId);

      if (prediction.probability > 70) {
        recommendations.push({
          id: baseId,
          title: `Strengthen ${prediction.predictedType} Detection`,
          description: `Based on historical patterns, ${prediction.predictedType} attacks are likely within ${prediction.timeWindow.start.toLocaleDateString()}-${prediction.timeWindow.end.toLocaleDateString()}. Recommend increasing monitoring and alert sensitivity.`,
          priority:
            prediction.severity === 'critical' ? 'critical'
              : prediction.severity === 'high' ? 'high'
                : 'medium',
          category: 'detection',
          affectedThreats: [prediction.predictedType],
          estimatedImpact: prediction.probability,
          implementationEffort: 'low',
          resources: [
            'Email filtering rules',
            'Network IDS signatures',
            'Endpoint detection agent',
          ],
        });

        recommendations.push({
          id: `${baseId}-response`,
          title: `Develop ${prediction.predictedType} Response Plan`,
          description: `Create or review incident response playbook for ${prediction.predictedType} with focus on rapid containment and recovery.`,
          priority: 'high',
          category: 'response',
          affectedThreats: [prediction.predictedType],
          estimatedImpact: 85,
          implementationEffort: 'medium',
          resources: [
            'Incident response team',
            'Communication templates',
            'Recovery procedures',
          ],
        });
      }
    });

    // General security recommendations
    if (profile.riskScore > 70) {
      recommendations.push({
        id: `rec-${userId}-risk-reduction`,
        title: 'Implement Risk Reduction Program',
        description: `Current risk score is ${Math.round(profile.riskScore)}/100. Implement comprehensive security hardening including employee training, network segmentation, and threat intelligence integration.`,
        priority: 'high',
        category: 'prevention',
        affectedThreats: ['all'],
        estimatedImpact: 40,
        implementationEffort: 'high',
        resources: [
          'Security training',
          'Network redesign',
          'Threat intel feeds',
        ],
      });
    }

    // Block rate improvement
    const blockRate = profile.threatHistory.filter((e) => e.blocked).length / profile.threatHistory.length;
    if (blockRate < 0.8) {
      recommendations.push({
        id: `rec-${userId}-block-rate`,
        title: 'Improve Threat Block Rate',
        description: `Current block rate is ${Math.round(blockRate * 100)}%. Target is 95%+. Review detection rules and ensure real-time threat intelligence feeds are enabled.`,
        priority: 'high',
        category: 'detection',
        affectedThreats: ['all'],
        estimatedImpact: 50,
        implementationEffort: 'medium',
        resources: [
          'Threat intel feeds',
          'Detection rules',
          'Rule optimization',
        ],
      });
    }

    this.recommendations.set(userId, recommendations);
    return recommendations;
  }

  /**
   * Generate time series forecast for a threat type
   */
  generateForecast(
    userId: string,
    threatType: string,
    forecastDays: number = 30
  ): TimeSeriesForecast {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return {
        threatType,
        historicalData: [],
        forecast: [],
        trend: 'stable',
        anomalies: [],
      };
    }

    const relevantEvents = profile.threatHistory.filter(
      (e) => e.type === threatType
    );

    // Build daily counts
    const dailyCounts = new Map<string, number>();
    const now = new Date();

    for (let i = 90; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyCounts.set(dateKey, 0);
    }

    relevantEvents.forEach((event) => {
      const dateKey = event.timestamp.toISOString().split('T')[0];
      if (dailyCounts.has(dateKey)) {
        dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
      }
    });

    const historicalData = Array.from(dailyCounts.entries()).map(
      ([date, count]) => ({
        timestamp: new Date(date),
        count,
      })
    );

    // Simple forecast using moving average
    const recentValues = historicalData.slice(-7).map((d) => d.count);
    const movingAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

    const forecast = [];
    for (let i = 0; i < forecastDays; i++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(forecastDate.getDate() + i + 1);

      const variance = Math.sqrt(
        recentValues.reduce(
          (sum, val) => sum + Math.pow(val - movingAvg, 2),
          0
        ) / recentValues.length
      );

      forecast.push({
        timestamp: forecastDate,
        predictedCount: Math.round(movingAvg),
        upperBound: Math.round(movingAvg + variance),
        lowerBound: Math.max(0, Math.round(movingAvg - variance)),
        confidence: 75,
      });
    }

    // Detect trend
    const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2));
    const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondAvg > firstAvg * 1.2) {
      trend = 'increasing';
    } else if (secondAvg < firstAvg * 0.8) {
      trend = 'decreasing';
    }

    return {
      threatType,
      historicalData,
      forecast,
      trend,
      anomalies: [],
    };
  }

  /**
   * Get prediction summary
   */
  getSummary(userId: string): {
    topThreats: ThreatPrediction[];
    riskLevel: string;
    recommendations: SecurityRecommendation[];
  } {
    const predictions = this.predictions.get(userId) || [];
    const recommendations = this.recommendations.get(userId) || [];
    const profile = this.userProfiles.get(userId);

    const riskLevel =
      profile && profile.riskScore > 80 ? 'Critical'
        : profile && profile.riskScore > 60 ? 'High'
          : profile && profile.riskScore > 40 ? 'Medium'
            : 'Low';

    return {
      topThreats: predictions.slice(0, 3),
      riskLevel,
      recommendations: recommendations.slice(0, 5),
    };
  }
}

// Export singleton instance
export const threatPredictor = new ThreatPredictor();

// Export types and class for testing
export { ThreatPredictor };
