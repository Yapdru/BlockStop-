import { Threat, BehaviorPattern } from './types';
import { generateThreatId, calculateConfidence, detectAnomalies } from './utils';

interface ProcessActivity {
  processId: number;
  timestamp: number;
  eventType: string;
  details: Record<string, any>;
}

interface BehaviorBaseline {
  processId: number;
  patterns: BehaviorPattern[];
  lastUpdated: number;
}

export class BehaviorBlocker {
  private baselines: Map<number, BehaviorBaseline> = new Map();
  private activityLogs: Map<number, ProcessActivity[]> = new Map();
  private anomalyThreshold = 0.75;

  async detectBehaviorAnomaly(
    processId: number,
    activities: ProcessActivity[]
  ): Promise<Threat | null> {
    if (activities.length === 0) return null;

    const baseline = this.baselines.get(processId);
    if (!baseline) {
      this.learnBaseline(processId, activities);
      return null;
    }

    const anomalies = this.analyzeAnomalies(activities, baseline);

    if (anomalies.length === 0) return null;

    const confidence = calculateConfidence(
      anomalies.length,
      baseline.patterns.length
    );

    if (confidence < this.anomalyThreshold) return null;

    const threat: Threat = {
      id: generateThreatId(),
      type: 'BEHAVIOR_ANOMALY',
      severity: 'MEDIUM',
      timestamp: Date.now(),
      source: 'BehaviorBlocker',
      description: `Behavior anomaly detected: ${anomalies.join(', ')}`,
      processId,
      behaviorIndicators: anomalies,
      metadata: {
        baselineCount: baseline.patterns.length,
        anomalyCount: anomalies.length,
        activitiesCount: activities.length,
      },
    };

    this.recordActivities(processId, activities);
    return threat;
  }

  private learnBaseline(
    processId: number,
    activities: ProcessActivity[]
  ): void {
    const patterns: BehaviorPattern[] = [];
    const eventFrequency: Record<string, number> = {};

    for (const activity of activities) {
      eventFrequency[activity.eventType] =
        (eventFrequency[activity.eventType] || 0) + 1;
    }

    for (const [eventType, count] of Object.entries(eventFrequency)) {
      patterns.push({
        processId,
        pattern: eventType,
        confidence: count / activities.length,
        timestamp: Date.now(),
        indicators: [eventType],
      });
    }

    this.baselines.set(processId, {
      processId,
      patterns,
      lastUpdated: Date.now(),
    });

    this.recordActivities(processId, activities);
  }

  private analyzeAnomalies(
    activities: ProcessActivity[],
    baseline: BehaviorBaseline
  ): string[] {
    const anomalies: string[] = [];
    const currentEventFreq: Record<string, number> = {};

    for (const activity of activities) {
      currentEventFreq[activity.eventType] =
        (currentEventFreq[activity.eventType] || 0) + 1;
    }

    // Check for new event types not in baseline
    for (const eventType of Object.keys(currentEventFreq)) {
      const baselinePattern = baseline.patterns.find(
        (p) => p.pattern === eventType
      );

      if (!baselinePattern) {
        anomalies.push(`new_event_type_${eventType}`);
      } else {
        // Check for significant frequency deviation
        const currentFreq = currentEventFreq[eventType] / activities.length;
        const expectedFreq = baselinePattern.confidence;

        if (Math.abs(currentFreq - expectedFreq) > 0.3) {
          anomalies.push(`frequency_anomaly_${eventType}`);
        }
      }
    }

    // Check for missing baseline patterns
    for (const pattern of baseline.patterns) {
      if (!currentEventFreq[pattern.pattern]) {
        anomalies.push(`missing_pattern_${pattern.pattern}`);
      }
    }

    // Detect timing anomalies
    if (activities.length > 1) {
      const intervals = [];
      for (let i = 1; i < activities.length; i++) {
        intervals.push(activities[i].timestamp - activities[i - 1].timestamp);
      }

      const baselineIntervals = intervals.slice(0, 10);
      const currentIntervals = intervals.slice(-10);

      for (const interval of currentIntervals) {
        if (detectAnomalies(baselineIntervals, interval, 2.0)) {
          anomalies.push('timing_anomaly');
          break;
        }
      }
    }

    return [...new Set(anomalies)]; // Remove duplicates
  }

  private recordActivities(
    processId: number,
    activities: ProcessActivity[]
  ): void {
    if (!this.activityLogs.has(processId)) {
      this.activityLogs.set(processId, []);
    }
    this.activityLogs.get(processId)!.push(...activities);

    // Keep last 1000 activities
    const log = this.activityLogs.get(processId)!;
    if (log.length > 1000) {
      log.splice(0, log.length - 1000);
    }
  }

  updateBaseline(processId: number, activities: ProcessActivity[]): void {
    this.learnBaseline(processId, activities);
  }

  getBaseline(processId: number): BehaviorBaseline | undefined {
    return this.baselines.get(processId);
  }

  getActivityLog(processId: number): ProcessActivity[] {
    return this.activityLogs.get(processId) || [];
  }

  clearBaseline(processId?: number): void {
    if (processId) {
      this.baselines.delete(processId);
    } else {
      this.baselines.clear();
    }
  }

  setAnomalyThreshold(threshold: number): void {
    this.anomalyThreshold = Math.max(0, Math.min(1, threshold));
  }
}

export default BehaviorBlocker;
