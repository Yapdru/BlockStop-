/**
 * MAX Phase 31.1 - Behavioral Anomaly Detection
 * User and entity behavior baseline with advanced anomaly scoring
 */

import {
  BehavioralBaseline,
  EntityType,
  BaselineMetrics,
  AnomalyScore,
  AnomalyType,
  HistoricalActivityData,
  SeverityLevel,
} from '@/types/max-phase31';

// ============================================================================
// BEHAVIORAL ANOMALY DETECTOR
// ============================================================================

export class BehavioralAnomalyDetector {
  private baselines: Map<string, BehavioralBaseline> = new Map();
  private windowSize = 30; // Days for baseline calculation
  private zScoreThreshold = 2.5;
  private isolationForestSampleSize = 256;

  /**
   * Create or update baseline for entity
   */
  async createBaseline(
    entityId: string,
    entityType: EntityType,
    historicalData: HistoricalActivityData[]
  ): Promise<BehavioralBaseline> {
    const metrics = this.calculateMetrics(historicalData);
    const standardDeviation = this.calculateStandardDeviation(
      historicalData,
      metrics
    );

    const baseline: BehavioralBaseline = {
      id: `baseline-${entityId}`,
      entityId,
      entityType,
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: {
        ...metrics,
        standardDeviation,
      },
      anomalyScores: [],
      historicalData,
    };

    this.baselines.set(entityId, baseline);
    return baseline;
  }

  /**
   * Calculate baseline metrics from historical data
   */
  private calculateMetrics(
    historicalData: HistoricalActivityData[]
  ): BaselineMetrics {
    if (historicalData.length === 0) {
      return {
        avgLoginTime: 0,
        avgLoginCountDaily: 0,
        avgDataAccessPerDay: 0,
        avgAPICallsPerHour: 0,
        normalWorkHours: { start: 9, end: 17 },
        frequentLocations: [],
        frequentDevices: [],
        frequentApplications: [],
        typicalDataTypes: [],
        normalBandwidth: 0,
        normalProcessCount: 0,
        standardDeviation: {},
      };
    }

    const loginCounts = historicalData.map((d) => d.loginCount);
    const dataAccess = historicalData.map((d) => d.dataAccessed);
    const apiCalls = historicalData.map((d) => d.apiCalls);
    const bandwidths = historicalData.map((d) => d.bandwidth);
    const processCounts = historicalData.map((d) => d.processCount);

    const locations: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const apps: Record<string, number> = {};

    historicalData.forEach((d) => {
      locations[d.location] = (locations[d.location] || 0) + 1;
      devices[d.device] = (devices[d.device] || 0) + 1;
      d.applications.forEach((app) => {
        apps[app] = (apps[app] || 0) + 1;
      });
    });

    // Find active hours (most common login times)
    const activeHours: Record<number, number> = {};
    historicalData.forEach((d) => {
      const hour = d.timestamp.getHours();
      activeHours[hour] = (activeHours[hour] || 0) + 1;
    });

    const sortedHours = Object.entries(activeHours)
      .sort(([, a], [, b]) => b - a)
      .map(([hour]) => parseInt(hour));

    const startHour = sortedHours[0] || 9;
    const endHour = sortedHours[sortedHours.length - 1] || 17;

    return {
      avgLoginTime:
        loginCounts.reduce((a, b) => a + b, 0) / loginCounts.length,
      avgLoginCountDaily:
        loginCounts.reduce((a, b) => a + b, 0) / loginCounts.length,
      avgDataAccessPerDay: dataAccess.reduce((a, b) => a + b, 0) / dataAccess.length,
      avgAPICallsPerHour: apiCalls.reduce((a, b) => a + b, 0) / apiCalls.length / 24,
      normalWorkHours: { start: startHour, end: endHour },
      frequentLocations: Object.entries(locations)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([location]) => location),
      frequentDevices: Object.entries(devices)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([device]) => device),
      frequentApplications: Object.entries(apps)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([app]) => app),
      typicalDataTypes: ['documents', 'databases', 'logs'],
      normalBandwidth: bandwidths.reduce((a, b) => a + b, 0) / bandwidths.length,
      normalProcessCount:
        processCounts.reduce((a, b) => a + b, 0) / processCounts.length,
      standardDeviation: {},
    };
  }

  /**
   * Calculate standard deviation for anomaly detection
   */
  private calculateStandardDeviation(
    historicalData: HistoricalActivityData[],
    metrics: BaselineMetrics
  ): Record<string, number> {
    const loginCounts = historicalData.map((d) => d.loginCount);
    const dataAccess = historicalData.map((d) => d.dataAccessed);
    const apiCalls = historicalData.map((d) => d.apiCalls);
    const bandwidths = historicalData.map((d) => d.bandwidth);

    const stdev = (values: number[]): number => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length;
      return Math.sqrt(variance);
    };

    return {
      loginCount: stdev(loginCounts),
      dataAccess: stdev(dataAccess),
      apiCalls: stdev(apiCalls),
      bandwidth: stdev(bandwidths),
    };
  }

  /**
   * Detect anomalies in entity activity
   */
  async detectAnomalies(
    entityId: string,
    currentActivity: HistoricalActivityData
  ): Promise<AnomalyScore[]> {
    const baseline = this.baselines.get(entityId);
    if (!baseline) {
      return [];
    }

    const anomalyScores: AnomalyScore[] = [];

    // Time-based anomaly detection
    const timeAnomaly = this.detectTimeBasedAnomaly(baseline, currentActivity);
    if (timeAnomaly) {
      anomalyScores.push(timeAnomaly);
    }

    // Location-based anomaly detection
    const locationAnomaly = this.detectLocationBasedAnomaly(
      baseline,
      currentActivity
    );
    if (locationAnomaly) {
      anomalyScores.push(locationAnomaly);
    }

    // Activity volume anomaly
    const volumeAnomaly = this.detectActivityVolumeAnomaly(baseline, currentActivity);
    if (volumeAnomaly) {
      anomalyScores.push(volumeAnomaly);
    }

    // Data access pattern anomaly
    const accessAnomaly = this.detectAccessPatternAnomaly(
      baseline,
      currentActivity
    );
    if (accessAnomaly) {
      anomalyScores.push(accessAnomaly);
    }

    // Privilege change detection
    if (currentActivity.privilegeEscalations > 0) {
      const privAnomaly = this.detectPrivilegeAnomaly(baseline, currentActivity);
      if (privAnomaly) {
        anomalyScores.push(privAnomaly);
      }
    }

    // Network behavior anomaly
    const networkAnomaly = this.detectNetworkBehaviorAnomaly(
      baseline,
      currentActivity
    );
    if (networkAnomaly) {
      anomalyScores.push(networkAnomaly);
    }

    // Update baseline with new data
    baseline.historicalData.push(currentActivity);
    baseline.anomalyScores.push(...anomalyScores);
    baseline.updatedAt = new Date();

    return anomalyScores;
  }

  /**
   * Detect time-based anomalies
   */
  private detectTimeBasedAnomaly(
    baseline: BehavioralBaseline,
    activity: HistoricalActivityData
  ): AnomalyScore | null {
    const hour = activity.timestamp.getHours();
    const { start, end } = baseline.metrics.normalWorkHours;

    // Check if activity is outside normal hours
    const isOutsideHours = hour < start || hour > end;

    if (isOutsideHours && baseline.metrics.normalBandwidth > 0) {
      const deviation = ((hour - (start + end) / 2) / 12) * 100;

      return {
        timestamp: activity.timestamp,
        entityId: baseline.entityId,
        score: Math.min(100, 30 + Math.abs(deviation)),
        severity: Math.abs(deviation) > 60 ? SeverityLevel.HIGH : SeverityLevel.MEDIUM,
        anomalyType: AnomalyType.TIME_BASED,
        indicators: [`Activity at ${hour}:00, outside normal hours ${start}-${end}`],
        deviationPercentage: Math.abs(deviation),
        confidence: 75 + Math.random() * 20,
      };
    }

    return null;
  }

  /**
   * Detect location-based anomalies
   */
  private detectLocationBasedAnomaly(
    baseline: BehavioralBaseline,
    activity: HistoricalActivityData
  ): AnomalyScore | null {
    const isFrequentLocation = baseline.metrics.frequentLocations.includes(
      activity.location
    );

    if (!isFrequentLocation && baseline.metrics.frequentLocations.length > 0) {
      return {
        timestamp: activity.timestamp,
        entityId: baseline.entityId,
        score: 50 + Math.random() * 30,
        severity: SeverityLevel.MEDIUM,
        anomalyType: AnomalyType.LOCATION_BASED,
        indicators: [`New location: ${activity.location}`],
        deviationPercentage: 100,
        confidence: 70 + Math.random() * 25,
      };
    }

    return null;
  }

  /**
   * Detect activity volume anomalies using Z-score
   */
  private detectActivityVolumeAnomaly(
    baseline: BehavioralBaseline,
    activity: HistoricalActivityData
  ): AnomalyScore | null {
    const loginStdev = baseline.metrics.standardDeviation.loginCount || 1;
    const dataStdev = baseline.metrics.standardDeviation.dataAccess || 1;
    const apiStdev = baseline.metrics.standardDeviation.apiCalls || 1;

    // Z-score calculations
    const loginZScore = Math.abs(
      (activity.loginCount - baseline.metrics.avgLoginCountDaily) / loginStdev
    );
    const dataZScore = Math.abs(
      (activity.dataAccessed - baseline.metrics.avgDataAccessPerDay) / dataStdev
    );
    const apiZScore = Math.abs(
      (activity.apiCalls - baseline.metrics.avgAPICallsPerHour) / apiStdev
    );

    const maxZScore = Math.max(loginZScore, dataZScore, apiZScore);

    if (maxZScore > this.zScoreThreshold) {
      const anomalyType =
        loginZScore > dataZScore && loginZScore > apiZScore
          ? 'login_volume'
          : dataZScore > apiZScore
            ? 'data_access_volume'
            : 'api_call_volume';

      return {
        timestamp: activity.timestamp,
        entityId: baseline.entityId,
        score: Math.min(100, 40 + maxZScore * 10),
        severity:
          maxZScore > 4
            ? SeverityLevel.HIGH
            : maxZScore > 3
              ? SeverityLevel.MEDIUM
              : SeverityLevel.LOW,
        anomalyType: AnomalyType.ACTIVITY_VOLUME,
        indicators: [
          `${anomalyType}: Z-score ${maxZScore.toFixed(2)}`,
          `Expected: ${this.getExpectedValue(
            anomalyType,
            baseline.metrics
          )}, Actual: ${this.getActualValue(
            anomalyType,
            activity
          )}`,
        ],
        deviationPercentage:
          ((maxZScore - this.zScoreThreshold) /
            this.zScoreThreshold) *
          100,
        confidence: 80 + Math.random() * 15,
      };
    }

    return null;
  }

  /**
   * Get expected value for anomaly type
   */
  private getExpectedValue(
    anomalyType: string,
    metrics: BaselineMetrics
  ): number {
    switch (anomalyType) {
      case 'login_volume':
        return metrics.avgLoginCountDaily;
      case 'data_access_volume':
        return metrics.avgDataAccessPerDay;
      case 'api_call_volume':
        return metrics.avgAPICallsPerHour;
      default:
        return 0;
    }
  }

  /**
   * Get actual value for anomaly type
   */
  private getActualValue(
    anomalyType: string,
    activity: HistoricalActivityData
  ): number {
    switch (anomalyType) {
      case 'login_volume':
        return activity.loginCount;
      case 'data_access_volume':
        return activity.dataAccessed;
      case 'api_call_volume':
        return activity.apiCalls;
      default:
        return 0;
    }
  }

  /**
   * Detect access pattern anomalies
   */
  private detectAccessPatternAnomaly(
    baseline: BehavioralBaseline,
    activity: HistoricalActivityData
  ): AnomalyScore | null {
    const newApps = activity.applications.filter(
      (app) => !baseline.metrics.frequentApplications.includes(app)
    );

    if (newApps.length > 0) {
      return {
        timestamp: activity.timestamp,
        entityId: baseline.entityId,
        score: 45 + newApps.length * 5,
        severity:
          newApps.length > 3 ? SeverityLevel.HIGH : SeverityLevel.MEDIUM,
        anomalyType: AnomalyType.ACCESS_PATTERN,
        indicators: [`Accessed ${newApps.length} new applications: ${newApps.join(', ')}`],
        deviationPercentage: (newApps.length / activity.applications.length) * 100,
        confidence: 70 + Math.random() * 25,
      };
    }

    return null;
  }

  /**
   * Detect privilege escalation anomalies
   */
  private detectPrivilegeAnomaly(
    baseline: BehavioralBaseline,
    activity: HistoricalActivityData
  ): AnomalyScore | null {
    if (activity.privilegeEscalations > 0) {
      return {
        timestamp: activity.timestamp,
        entityId: baseline.entityId,
        score: 70 + activity.privilegeEscalations * 10,
        severity:
          activity.privilegeEscalations > 2
            ? SeverityLevel.CRITICAL
            : activity.privilegeEscalations > 1
              ? SeverityLevel.HIGH
              : SeverityLevel.MEDIUM,
        anomalyType: AnomalyType.PRIVILEGE_CHANGE,
        indicators: [
          `${activity.privilegeEscalations} privilege escalation(s) detected`,
        ],
        deviationPercentage: activity.privilegeEscalations * 50,
        confidence: 90 + Math.random() * 9,
      };
    }

    return null;
  }

  /**
   * Detect network behavior anomalies
   */
  private detectNetworkBehaviorAnomaly(
    baseline: BehavioralBaseline,
    activity: HistoricalActivityData
  ): AnomalyScore | null {
    const bandwidthStdev = baseline.metrics.standardDeviation.bandwidth || 1;
    const bandwidthZScore = Math.abs(
      (activity.bandwidth - baseline.metrics.normalBandwidth) / bandwidthStdev
    );

    if (bandwidthZScore > 2.5) {
      return {
        timestamp: activity.timestamp,
        entityId: baseline.entityId,
        score: Math.min(100, 40 + bandwidthZScore * 10),
        severity:
          bandwidthZScore > 4
            ? SeverityLevel.HIGH
            : SeverityLevel.MEDIUM,
        anomalyType: AnomalyType.NETWORK_ANOMALY,
        indicators: [
          `Bandwidth spike: ${activity.bandwidth.toFixed(2)} Mbps (expected: ${baseline.metrics.normalBandwidth.toFixed(2)})`,
        ],
        deviationPercentage:
          ((activity.bandwidth - baseline.metrics.normalBandwidth) /
            baseline.metrics.normalBandwidth) *
          100,
        confidence: 75 + Math.random() * 20,
      };
    }

    return null;
  }

  /**
   * Calculate composite anomaly score using ensemble method
   */
  calculateCompositeScore(scores: AnomalyScore[]): number {
    if (scores.length === 0) return 0;

    const weights: Record<AnomalyType, number> = {
      [AnomalyType.TIME_BASED]: 0.1,
      [AnomalyType.LOCATION_BASED]: 0.15,
      [AnomalyType.ACTIVITY_VOLUME]: 0.25,
      [AnomalyType.ACCESS_PATTERN]: 0.2,
      [AnomalyType.PRIVILEGE_CHANGE]: 0.3,
      [AnomalyType.DATA_EXFIL_PATTERN]: 0.35,
      [AnomalyType.PROCESS_ANOMALY]: 0.2,
      [AnomalyType.NETWORK_ANOMALY]: 0.25,
      [AnomalyType.CREDENTIAL_USAGE]: 0.25,
      [AnomalyType.RESOURCE_CONSUMPTION]: 0.15,
    };

    let totalScore = 0;
    let totalWeight = 0;

    scores.forEach((score) => {
      const weight = weights[score.anomalyType] || 0.2;
      totalScore += score.score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Get baseline for entity
   */
  getBaseline(entityId: string): BehavioralBaseline | undefined {
    return this.baselines.get(entityId);
  }

  /**
   * Get all baselines
   */
  getAllBaselines(): BehavioralBaseline[] {
    return Array.from(this.baselines.values());
  }

  /**
   * Delete baseline
   */
  deleteBaseline(entityId: string): boolean {
    return this.baselines.delete(entityId);
  }
}

export default BehavioralAnomalyDetector;
