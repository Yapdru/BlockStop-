/**
 * Entity Baseline - Establishes normal behavior baselines for entities
 */

export interface Baseline {
  entityId: string;
  entityType: string;
  calculatedAt: Date;
  eventCount: number;
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    avgEventsPerDay: number;
    avgEventsPerHour: number;
    peakHours: number[];
    lowActivityHours: number[];
    stdDeviation: number;
    variance: number;
  };
  resources: {
    frequentTargets: Map<string, number>;
    newResourceAccess: Set<string>;
    abandonedResources: Set<string>;
  };
  actions: {
    frequentActions: Map<string, number>;
    rareBehaviors: Set<string>;
  };
  locations: {
    frequentLocations: Map<string, number>;
    newLocations: Set<string>;
  };
  thresholds: {
    anomalyThreshold: number;
    riskThreshold: number;
    sensitivityLevel: "low" | "medium" | "high";
  };
}

export class EntityBaseline {
  private baselines: Map<string, Baseline> = new Map();
  private baselineCache: Map<string, { data: Baseline; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private readonly MIN_EVENTS = 100; // Minimum events to establish baseline

  /**
   * Calculate baseline from historical events
   */
  async calculateBaseline(
    entityId: string,
    events: Array<{
      timestamp: Date;
      action: string;
      target: string;
      sourceLocation?: string;
    }>
  ): Promise<Baseline> {
    if (events.length < this.MIN_EVENTS) {
      console.warn(
        `[Baseline] Insufficient events (${events.length}) for entity ${entityId}, using default baseline`
      );
    }

    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const startTime = sortedEvents[0]?.timestamp || new Date();
    const endTime = sortedEvents[sortedEvents.length - 1]?.timestamp || new Date();

    // Calculate metrics
    const dayDiff = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));
    const hourDiff = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));

    const avgEventsPerDay = events.length / Math.max(dayDiff, 1);
    const avgEventsPerHour = events.length / Math.max(hourDiff, 1);

    // Calculate hourly distribution
    const hourlyEvents = new Map<number, number>();
    for (const event of events) {
      const hour = event.timestamp.getHours();
      hourlyEvents.set(hour, (hourlyEvents.get(hour) || 0) + 1);
    }

    const sortedHours = Array.from(hourlyEvents.entries()).sort((a, b) => b[1] - a[1]);
    const peakHours = sortedHours.slice(0, 5).map(([h]) => h);
    const lowActivityHours = sortedHours
      .slice(Math.max(0, sortedHours.length - 5))
      .map(([h]) => h);

    // Calculate statistics
    const eventCounts = Array.from(hourlyEvents.values());
    const mean = eventCounts.reduce((a, b) => a + b, 0) / eventCounts.length;
    const variance =
      eventCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
      eventCounts.length;
    const stdDeviation = Math.sqrt(variance);

    // Resource analysis
    const frequentTargets = new Map<string, number>();
    for (const event of events) {
      frequentTargets.set(event.target, (frequentTargets.get(event.target) || 0) + 1);
    }

    // Action analysis
    const frequentActions = new Map<string, number>();
    for (const event of events) {
      frequentActions.set(event.action, (frequentActions.get(event.action) || 0) + 1);
    }

    // Location analysis
    const frequentLocations = new Map<string, number>();
    for (const event of events) {
      if (event.sourceLocation) {
        frequentLocations.set(
          event.sourceLocation,
          (frequentLocations.get(event.sourceLocation) || 0) + 1
        );
      }
    }

    const baseline: Baseline = {
      entityId,
      entityType: "user",
      calculatedAt: new Date(),
      eventCount: events.length,
      timeRange: { start: startTime, end: endTime },
      metrics: {
        avgEventsPerDay,
        avgEventsPerHour,
        peakHours,
        lowActivityHours,
        stdDeviation,
        variance,
      },
      resources: {
        frequentTargets,
        newResourceAccess: new Set(),
        abandonedResources: new Set(),
      },
      actions: {
        frequentActions,
        rareBehaviors: new Set(),
      },
      locations: {
        frequentLocations,
        newLocations: new Set(),
      },
      thresholds: {
        anomalyThreshold: mean + 2 * stdDeviation,
        riskThreshold: 0.7,
        sensitivityLevel: "medium",
      },
    };

    this.baselines.set(entityId, baseline);
    this.invalidateCache(entityId);

    return baseline;
  }

  /**
   * Get baseline for an entity
   */
  async getBaseline(entityId: string): Promise<Baseline | null> {
    // Check cache first
    const cached = this.baselineCache.get(entityId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const baseline = this.baselines.get(entityId);
    if (baseline) {
      this.baselineCache.set(entityId, { data: baseline, timestamp: Date.now() });
    }

    return baseline || null;
  }

  /**
   * Update baseline with new events
   */
  async updateBaseline(
    entityId: string,
    newEvents: Array<{
      timestamp: Date;
      action: string;
      target: string;
      sourceLocation?: string;
    }>
  ): Promise<void> {
    const baseline = this.baselines.get(entityId);
    if (!baseline) {
      await this.calculateBaseline(entityId, newEvents);
      return;
    }

    // Merge events (simple approach - could be optimized with sliding window)
    const allEvents = [
      ...Array.from(baseline.resources.frequentTargets.entries()).map(([target]) => ({
        timestamp: baseline.timeRange.start,
        action: "historical",
        target,
      })),
      ...newEvents,
    ];

    await this.calculateBaseline(entityId, allEvents);
  }

  /**
   * Check if an event is anomalous compared to baseline
   */
  async isAnomalous(
    entityId: string,
    event: {
      timestamp: Date;
      action: string;
      target: string;
      sourceLocation?: string;
    }
  ): Promise<{
    isAnomalous: boolean;
    score: number;
    reasons: string[];
  }> {
    const baseline = await this.getBaseline(entityId);
    if (!baseline) {
      return { isAnomalous: false, score: 0, reasons: [] };
    }

    const reasons: string[] = [];
    let score = 0;

    // Check time pattern
    const hour = event.timestamp.getHours();
    if (!baseline.metrics.peakHours.includes(hour)) {
      if (baseline.metrics.lowActivityHours.includes(hour)) {
        reasons.push(`Activity during low-activity hour: ${hour}`);
        score += 20;
      } else {
        reasons.push(`Activity outside peak hours`);
        score += 10;
      }
    }

    // Check action frequency
    const actionFreq = baseline.actions.frequentActions.get(event.action) || 0;
    if (actionFreq === 0) {
      reasons.push(`Rare action type: ${event.action}`);
      score += 15;
    }

    // Check resource access
    const resourceFreq = baseline.resources.frequentTargets.get(event.target) || 0;
    if (resourceFreq === 0) {
      reasons.push(`New resource access: ${event.target}`);
      score += 25;
    } else if (resourceFreq < baseline.metrics.avgEventsPerDay / 10) {
      reasons.push(`Infrequent resource access: ${event.target}`);
      score += 10;
    }

    // Check location
    if (event.sourceLocation) {
      const locationFreq = baseline.locations.frequentLocations.get(event.sourceLocation) || 0;
      if (locationFreq === 0) {
        reasons.push(`New location access: ${event.sourceLocation}`);
        score += 20;
      }
    }

    const isAnomalous = score >= baseline.thresholds.anomalyThreshold;

    return { isAnomalous, score, reasons };
  }

  /**
   * Set sensitivity level for anomaly detection
   */
  async setSensitivityLevel(
    entityId: string,
    level: "low" | "medium" | "high"
  ): Promise<void> {
    const baseline = this.baselines.get(entityId);
    if (!baseline) return;

    baseline.thresholds.sensitivityLevel = level;

    // Adjust anomaly threshold based on sensitivity
    const baseThreshold = baseline.metrics.stdDeviation;
    switch (level) {
      case "high":
        baseline.thresholds.anomalyThreshold = baseThreshold + baseline.metrics.stdDeviation;
        break;
      case "medium":
        baseline.thresholds.anomalyThreshold = baseThreshold + 2 * baseline.metrics.stdDeviation;
        break;
      case "low":
        baseline.thresholds.anomalyThreshold = baseThreshold + 3 * baseline.metrics.stdDeviation;
        break;
    }

    this.invalidateCache(entityId);
  }

  /**
   * Get all baselines
   */
  async getAllBaselines(): Promise<Baseline[]> {
    return Array.from(this.baselines.values());
  }

  /**
   * Delete baseline
   */
  async deleteBaseline(entityId: string): Promise<void> {
    this.baselines.delete(entityId);
    this.invalidateCache(entityId);
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(entityId: string): void {
    this.baselineCache.delete(entityId);
  }
}

export default EntityBaseline;
