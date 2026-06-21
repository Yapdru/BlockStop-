/**
 * Pattern Analyzer - Advanced threat pattern recognition
 * Identifies recurring threat patterns, seasonal trends, and attack progressions
 */

export interface ThreatMetrics {
  threatId: string;
  timestamp: Date;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  source?: string;
  target?: string;
  duration?: number; // milliseconds
  metadata?: Record<string, unknown>;
}

export interface PatternMatch {
  patternId: string;
  name: string;
  type: "recurring" | "seasonal" | "progression" | "correlation";
  matchedEvents: string[]; // Event IDs
  confidence: number;
  firstObserved: Date;
  lastObserved: Date;
  frequency: number;
  metrics: {
    averageTimeBetweenOccurrences?: number;
    seasonalFactor?: number;
    progressionStages?: number;
  };
}

export interface SeasonalTrend {
  trendId: string;
  threatType: string;
  season: "spring" | "summer" | "fall" | "winter" | "quarterly" | "monthly";
  peakMonth?: number; // 0-11
  peakDay?: number; // 0-6 (day of week)
  peakHour?: number; // 0-23
  baselineCount: number;
  peakCount: number;
  trend: "increasing" | "stable" | "decreasing";
  confidence: number;
}

export interface CorrelationAnalysis {
  correlationId: string;
  threatType1: string;
  threatType2: string;
  correlation: number; // -1 to 1
  cooccurrenceCount: number;
  averageTimeDifference?: number; // milliseconds
  confidence: number;
  direction: "before" | "after" | "concurrent";
}

export interface AttackProgression {
  progressionId: string;
  name: string;
  stages: Array<{
    stageNumber: number;
    threatType: string;
    expectedDuration?: number;
    successIndicators: string[];
    failurePoints: string[];
  }>;
  totalObserved: number;
  completionRate: number; // % that reach final stage
  averageDuration: number;
  lastObserved: Date;
}

export class PatternAnalyzer {
  private threats: Map<string, ThreatMetrics> = new Map();
  private patterns: Map<string, PatternMatch> = new Map();
  private seasonalTrends: Map<string, SeasonalTrend> = new Map();
  private correlations: Map<string, CorrelationAnalysis> = new Map();
  private attackProgressions: Map<string, AttackProgression> = new Map();

  /**
   * Analyze threat patterns
   */
  async analyzeThreatPatterns(threats: ThreatMetrics[]): Promise<PatternMatch[]> {
    // Store threats
    for (const threat of threats) {
      this.threats.set(threat.threatId, threat);
    }

    const patterns: PatternMatch[] = [];

    // Identify recurring patterns
    patterns.push(...await this.findRecurringPatterns());

    // Identify seasonal trends
    patterns.push(...await this.findSeasonalPatterns());

    // Identify attack progressions
    patterns.push(...await this.findAttackProgressions());

    // Identify correlations
    patterns.push(...await this.findThreatCorrelations());

    return patterns;
  }

  /**
   * Find recurring threat patterns
   */
  private async findRecurringPatterns(): Promise<PatternMatch[]> {
    const patterns: PatternMatch[] = [];
    const threatsByType = this.groupThreatsByType();

    for (const [threatType, threats] of Object.entries(threatsByType)) {
      if (threats.length < 3) continue; // Need at least 3 occurrences

      // Check for temporal patterns
      const intervals = this.calculateIntervals(threats);
      const regularInterval = this.findRegularInterval(intervals);

      if (regularInterval) {
        const patternId = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        patterns.push({
          patternId,
          name: `Recurring ${threatType} Pattern`,
          type: "recurring",
          matchedEvents: threats.map(t => t.threatId),
          confidence: this.calculateConfidence(intervals, regularInterval),
          firstObserved: threats[0].timestamp,
          lastObserved: threats[threats.length - 1].timestamp,
          frequency: threats.length,
          metrics: {
            averageTimeBetweenOccurrences: regularInterval,
          },
        });

        this.patterns.set(patternId, patterns[patterns.length - 1]);
      }
    }

    return patterns;
  }

  /**
   * Find seasonal threat patterns
   */
  private async findSeasonalPatterns(): Promise<PatternMatch[]> {
    const patterns: PatternMatch[] = [];
    const threatsByType = this.groupThreatsByType();

    for (const [threatType, threats] of Object.entries(threatsByType)) {
      if (threats.length < 10) continue; // Need more data for seasonal analysis

      // Group by month
      const byMonth: Record<number, number[]> = {};
      for (const threat of threats) {
        const month = threat.timestamp.getMonth();
        if (!byMonth[month]) byMonth[month] = [];
        byMonth[month].push(threat.timestamp.getTime());
      }

      // Identify peak months
      const monthCounts = Object.entries(byMonth).map(([month, counts]) => ({
        month: parseInt(month),
        count: counts.length,
      }));

      const avgCount = monthCounts.reduce((sum, m) => sum + m.count, 0) / monthCounts.length;
      const peakMonth = monthCounts.reduce((max, m) => m.count > max.count ? m : max);

      if (peakMonth.count > avgCount * 1.5) {
        const seasonalTrendId = `trend-${Date.now()}`;
        const trend: SeasonalTrend = {
          trendId: seasonalTrendId,
          threatType,
          season: this.getSeasonFromMonth(peakMonth.month),
          peakMonth: peakMonth.month,
          baselineCount: Math.round(avgCount),
          peakCount: peakMonth.count,
          trend: this.calculateTrendDirection(monthCounts),
          confidence: 0.7 + (peakMonth.count / (avgCount * 10)),
        };

        this.seasonalTrends.set(seasonalTrendId, trend);

        const patternId = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        patterns.push({
          patternId,
          name: `Seasonal ${threatType} - ${trend.season}`,
          type: "seasonal",
          matchedEvents: threats.map(t => t.threatId),
          confidence: trend.confidence,
          firstObserved: threats[0].timestamp,
          lastObserved: threats[threats.length - 1].timestamp,
          frequency: threats.length,
          metrics: {
            seasonalFactor: peakMonth.count / avgCount,
          },
        });

        this.patterns.set(patternId, patterns[patterns.length - 1]);
      }
    }

    return patterns;
  }

  /**
   * Find attack progression patterns
   */
  private async findAttackProgressions(): Promise<PatternMatch[]> {
    const patterns: PatternMatch[] = [];

    // Analyze threat sequences for attack progressions
    const sequences = this.extractThreatSequences();

    for (const sequence of sequences) {
      if (sequence.threats.length < 2) continue;

      const progressionId = `progression-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const progressionKey = sequence.threats.map(t => t.type).join("→");

      let progression = Array.from(this.attackProgressions.values()).find(
        p => p.name === progressionKey
      );

      if (!progression) {
        progression = {
          progressionId,
          name: progressionKey,
          stages: sequence.threats.map((t, idx) => ({
            stageNumber: idx + 1,
            threatType: t.type,
            expectedDuration: idx < sequence.threats.length - 1
              ? sequence.threats[idx + 1].timestamp.getTime() - t.timestamp.getTime()
              : undefined,
            successIndicators: [],
            failurePoints: [],
          })),
          totalObserved: 1,
          completionRate: 1,
          averageDuration: sequence.duration,
          lastObserved: sequence.threats[sequence.threats.length - 1].timestamp,
        };

        this.attackProgressions.set(progressionId, progression);
      } else {
        progression.totalObserved++;
      }

      const patternId = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      patterns.push({
        patternId,
        name: `Attack Progression: ${progressionKey}`,
        type: "progression",
        matchedEvents: sequence.threats.map(t => t.threatId),
        confidence: 0.5 + (progression.totalObserved / 10),
        firstObserved: sequence.threats[0].timestamp,
        lastObserved: sequence.threats[sequence.threats.length - 1].timestamp,
        frequency: progression.totalObserved,
        metrics: {
          progressionStages: progression.stages.length,
        },
      });

      this.patterns.set(patternId, patterns[patterns.length - 1]);
    }

    return patterns;
  }

  /**
   * Find threat correlations
   */
  private async findThreatCorrelations(): Promise<PatternMatch[]> {
    const patterns: PatternMatch[] = [];
    const threatsByType = this.groupThreatsByType();
    const threatTypes = Object.keys(threatsByType);

    for (let i = 0; i < threatTypes.length; i++) {
      for (let j = i + 1; j < threatTypes.length; j++) {
        const type1 = threatTypes[i];
        const type2 = threatTypes[j];

        const threats1 = threatsByType[type1];
        const threats2 = threatsByType[type2];

        // Calculate correlation
        const correlation = this.calculateThreatCorrelation(threats1, threats2);

        if (Math.abs(correlation.coefficient) > 0.5) {
          const correlationId = `corr-${Date.now()}`;
          this.correlations.set(correlationId, {
            correlationId,
            threatType1: type1,
            threatType2: type2,
            correlation: correlation.coefficient,
            cooccurrenceCount: correlation.cooccurrences,
            averageTimeDifference: correlation.avgTimeDifference,
            confidence: 0.6 + Math.abs(correlation.coefficient) * 0.3,
            direction: correlation.direction,
          });

          const patternId = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          patterns.push({
            patternId,
            name: `Correlation: ${type1} → ${type2}`,
            type: "correlation",
            matchedEvents: [...threats1.slice(0, 5), ...threats2.slice(0, 5)].map(t => t.threatId),
            confidence: Math.abs(correlation.coefficient),
            firstObserved: new Date(Math.min(
              threats1[0].timestamp.getTime(),
              threats2[0].timestamp.getTime()
            )),
            lastObserved: new Date(Math.max(
              threats1[threats1.length - 1].timestamp.getTime(),
              threats2[threats2.length - 1].timestamp.getTime()
            )),
            frequency: correlation.cooccurrences,
            metrics: {},
          });

          this.patterns.set(patternId, patterns[patterns.length - 1]);
        }
      }
    }

    return patterns;
  }

  /**
   * Get all identified patterns
   */
  async getPatterns(): Promise<PatternMatch[]> {
    return Array.from(this.patterns.values()).sort(
      (a, b) => b.confidence - a.confidence
    );
  }

  /**
   * Get seasonal trends
   */
  async getSeasonalTrends(): Promise<SeasonalTrend[]> {
    return Array.from(this.seasonalTrends.values());
  }

  /**
   * Get threat correlations
   */
  async getCorrelations(): Promise<CorrelationAnalysis[]> {
    return Array.from(this.correlations.values()).filter(
      c => Math.abs(c.correlation) > 0.5
    );
  }

  /**
   * Get attack progressions
   */
  async getAttackProgressions(): Promise<AttackProgression[]> {
    return Array.from(this.attackProgressions.values()).sort(
      (a, b) => b.totalObserved - a.totalObserved
    );
  }

  /**
   * Group threats by type
   */
  private groupThreatsByType(): Record<string, ThreatMetrics[]> {
    const grouped: Record<string, ThreatMetrics[]> = {};

    for (const threat of this.threats.values()) {
      if (!grouped[threat.type]) grouped[threat.type] = [];
      grouped[threat.type].push(threat);
    }

    // Sort by timestamp
    for (const key in grouped) {
      grouped[key].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    return grouped;
  }

  /**
   * Calculate intervals between threats
   */
  private calculateIntervals(threats: ThreatMetrics[]): number[] {
    const intervals: number[] = [];

    for (let i = 1; i < threats.length; i++) {
      intervals.push(threats[i].timestamp.getTime() - threats[i - 1].timestamp.getTime());
    }

    return intervals;
  }

  /**
   * Find regular interval in data
   */
  private findRegularInterval(intervals: number[]): number | null {
    if (intervals.length < 2) return null;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length
    );

    // If variation is low, interval is regular
    if (stdDev < avgInterval * 0.3) {
      return avgInterval;
    }

    return null;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(intervals: number[], regularInterval: number): number {
    if (intervals.length === 0) return 0;

    let matchCount = 0;
    for (const interval of intervals) {
      if (Math.abs(interval - regularInterval) < regularInterval * 0.2) {
        matchCount++;
      }
    }

    return Math.min(1, matchCount / intervals.length);
  }

  /**
   * Get season from month
   */
  private getSeasonFromMonth(month: number): "spring" | "summer" | "fall" | "winter" | "quarterly" | "monthly" {
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  }

  /**
   * Calculate trend direction
   */
  private calculateTrendDirection(data: Array<{ count: number }>): "increasing" | "stable" | "decreasing" {
    if (data.length < 2) return "stable";

    const firstHalf = data.slice(0, Math.floor(data.length / 2)).reduce((sum, d) => sum + d.count, 0);
    const secondHalf = data.slice(Math.floor(data.length / 2)).reduce((sum, d) => sum + d.count, 0);

    if (secondHalf > firstHalf * 1.2) return "increasing";
    if (secondHalf < firstHalf * 0.8) return "decreasing";
    return "stable";
  }

  /**
   * Extract threat sequences
   */
  private extractThreatSequences(): Array<{
    threats: ThreatMetrics[];
    duration: number;
  }> {
    const sortedThreats = Array.from(this.threats.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const sequences: Array<{ threats: ThreatMetrics[]; duration: number }> = [];
    let currentSequence: ThreatMetrics[] = [];

    for (const threat of sortedThreats) {
      if (currentSequence.length > 0) {
        const timeSinceLastThreat = threat.timestamp.getTime() - currentSequence[currentSequence.length - 1].timestamp.getTime();

        // Break sequence if gap > 1 hour
        if (timeSinceLastThreat > 60 * 60 * 1000) {
          if (currentSequence.length > 1) {
            sequences.push({
              threats: [...currentSequence],
              duration: currentSequence[currentSequence.length - 1].timestamp.getTime() - currentSequence[0].timestamp.getTime(),
            });
          }
          currentSequence = [];
        }
      }

      currentSequence.push(threat);
    }

    if (currentSequence.length > 1) {
      sequences.push({
        threats: currentSequence,
        duration: currentSequence[currentSequence.length - 1].timestamp.getTime() - currentSequence[0].timestamp.getTime(),
      });
    }

    return sequences;
  }

  /**
   * Calculate correlation between two threat types
   */
  private calculateThreatCorrelation(
    threats1: ThreatMetrics[],
    threats2: ThreatMetrics[]
  ): {
    coefficient: number;
    cooccurrences: number;
    avgTimeDifference?: number;
    direction: "before" | "after" | "concurrent";
  } {
    let cooccurrences = 0;
    let timeDifferences: number[] = [];

    for (const t1 of threats1) {
      for (const t2 of threats2) {
        const timeDiff = Math.abs(t2.timestamp.getTime() - t1.timestamp.getTime());

        // Consider as cooccurrence if within 1 hour
        if (timeDiff < 60 * 60 * 1000) {
          cooccurrences++;
          timeDifferences.push(timeDiff);
        }
      }
    }

    const minThreats = Math.min(threats1.length, threats2.length);
    const coefficient = minThreats > 0 ? cooccurrences / minThreats : 0;

    const avgTimeDifference = timeDifferences.length > 0
      ? timeDifferences.reduce((a, b) => a + b, 0) / timeDifferences.length
      : undefined;

    // Determine direction
    let direction: "before" | "after" | "concurrent" = "concurrent";
    if (timeDifferences.length > 0) {
      const avgDiff = timeDifferences.reduce((a, b) => a + b, 0) / timeDifferences.length;
      let before = 0, after = 0;

      for (const t1 of threats1) {
        for (const t2 of threats2) {
          if (t1.timestamp < t2.timestamp) before++;
          else after++;
        }
      }

      if (before > after * 1.5) direction = "before";
      else if (after > before * 1.5) direction = "after";
    }

    return {
      coefficient: Math.min(1, coefficient),
      cooccurrences,
      avgTimeDifference,
      direction,
    };
  }
}

export default PatternAnalyzer;
