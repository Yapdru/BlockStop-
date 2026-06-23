/**
 * UEBA System - User & Entity Behavior Analytics
 * Behavioral analysis engine for anomaly detection and insider threat detection
 */

export interface EntityProfile {
  entityId: string;
  entityType: 'user' | 'host' | 'service_account' | 'app' | 'network_device';
  baselineMetrics: BaselineMetrics;
  behaviors: BehaviorRecord[];
  riskScore: number;
  lastUpdated: Date;
  anomalyHistory: AnomalyEvent[];
}

export interface BaselineMetrics {
  avgLoginTime: number;
  loginLocations: Set<string>;
  typicalDevices: Set<string>;
  dataAccessVolume: number;
  avgFileSize: number;
  typicalFileTypes: Set<string>;
  privilegeUsageFrequency: number;
  networkBehavior: NetworkBaseline;
}

export interface NetworkBaseline {
  typicalPorts: Set<number>;
  typicalProtocols: Set<string>;
  dataExfiltrationThreshold: number;
  bandwidthUsage: number;
  connectionPatterns: Map<string, number>;
}

export interface BehaviorRecord {
  id: string;
  entityId: string;
  timestamp: Date;
  action: string;
  details: Record<string, any>;
  riskScore: number;
  isAnomaly: boolean;
  confidenceScore: number;
}

export interface AnomalyEvent {
  id: string;
  timestamp: Date;
  anomalyType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  riskIncrease: number;
  detectionMethod: string;
  evidence: string[];
}

export interface BehaviorModel {
  name: string;
  metrics: string[];
  threshold: number;
  windowSize: number;
  alertOnDeviation: boolean;
}

export interface RiskScore {
  entityId: string;
  baseRisk: number;
  recentActivityRisk: number;
  anomalyRisk: number;
  contextualRisk: number;
  totalRisk: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
}

export interface BehaviorInsight {
  entityId: string;
  insightType: string;
  finding: string;
  severity: number;
  recommendations: string[];
  associatedEvents: string[];
}

/**
 * UEBA Engine - Behavioral Analytics
 */
export class UEBAEngine {
  private entityProfiles: Map<string, EntityProfile>;
  private behaviorModels: BehaviorModel[];
  private baselineWindow: number; // in days
  private sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
  private anomalyThreshold: number;

  constructor(
    baselineWindow: number = 30,
    sensitivityLevel: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ) {
    this.entityProfiles = new Map();
    this.behaviorModels = this.initializeModels();
    this.baselineWindow = baselineWindow;
    this.sensitivityLevel = sensitivityLevel;
    this.anomalyThreshold = this.getAnomalyThreshold();
  }

  /**
   * Initialize behavior models
   */
  private initializeModels(): BehaviorModel[] {
    return [
      {
        name: 'login_patterns',
        metrics: ['login_time', 'login_location', 'login_device', 'failed_attempts'],
        threshold: 0.7,
        windowSize: 24,
        alertOnDeviation: true,
      },
      {
        name: 'data_access',
        metrics: ['files_accessed', 'data_volume', 'access_time', 'file_sensitivity'],
        threshold: 0.8,
        windowSize: 8,
        alertOnDeviation: true,
      },
      {
        name: 'privilege_usage',
        metrics: ['sudo_commands', 'privileged_access', 'role_changes', 'permission_grants'],
        threshold: 0.6,
        windowSize: 1,
        alertOnDeviation: true,
      },
      {
        name: 'network_behavior',
        metrics: ['data_exfiltration', 'unusual_ports', 'c2_communication', 'lateral_movement'],
        threshold: 0.5,
        windowSize: 1,
        alertOnDeviation: true,
      },
      {
        name: 'after_hours_activity',
        metrics: ['off_hours_login', 'unusual_time_access', 'batch_operations'],
        threshold: 0.6,
        windowSize: 24,
        alertOnDeviation: true,
      },
    ];
  }

  /**
   * Get anomaly threshold based on sensitivity
   */
  private getAnomalyThreshold(): number {
    const thresholds: Record<string, number> = {
      low: 0.9,
      medium: 0.75,
      high: 0.6,
      critical: 0.4,
    };
    return thresholds[this.sensitivityLevel];
  }

  /**
   * Record entity behavior
   */
  recordBehavior(behavior: BehaviorRecord): void {
    let profile = this.entityProfiles.get(behavior.entityId);

    if (!profile) {
      profile = this.initializeProfile(behavior.entityId);
    }

    profile.behaviors.push(behavior);
    this.updateBaseline(profile, behavior);

    if (behavior.isAnomaly) {
      this.recordAnomalyEvent(profile, behavior);
    }

    profile.lastUpdated = new Date();
    profile.riskScore = this.calculateEntityRiskScore(profile).totalRisk;

    this.entityProfiles.set(behavior.entityId, profile);
  }

  /**
   * Initialize entity profile
   */
  private initializeProfile(entityId: string): EntityProfile {
    return {
      entityId,
      entityType: 'user',
      baselineMetrics: {
        avgLoginTime: 0,
        loginLocations: new Set(),
        typicalDevices: new Set(),
        dataAccessVolume: 0,
        avgFileSize: 0,
        typicalFileTypes: new Set(),
        privilegeUsageFrequency: 0,
        networkBehavior: {
          typicalPorts: new Set(),
          typicalProtocols: new Set(),
          dataExfiltrationThreshold: 0,
          bandwidthUsage: 0,
          connectionPatterns: new Map(),
        },
      },
      behaviors: [],
      riskScore: 0,
      lastUpdated: new Date(),
      anomalyHistory: [],
    };
  }

  /**
   * Update baseline metrics
   */
  private updateBaseline(profile: EntityProfile, behavior: BehaviorRecord): void {
    const baseline = profile.baselineMetrics;

    if (behavior.action === 'login') {
      baseline.avgLoginTime = (baseline.avgLoginTime + new Date(behavior.timestamp).getHours()) / 2;
      if (behavior.details.location) {
        baseline.loginLocations.add(behavior.details.location);
      }
      if (behavior.details.device) {
        baseline.typicalDevices.add(behavior.details.device);
      }
    }

    if (behavior.action === 'file_access') {
      baseline.dataAccessVolume += behavior.details.volume || 0;
      if (behavior.details.fileType) {
        baseline.typicalFileTypes.add(behavior.details.fileType);
      }
    }

    if (behavior.action === 'privilege_use') {
      baseline.privilegeUsageFrequency++;
    }

    if (behavior.action === 'network_activity') {
      if (behavior.details.port) {
        baseline.networkBehavior.typicalPorts.add(behavior.details.port);
      }
      if (behavior.details.protocol) {
        baseline.networkBehavior.typicalProtocols.add(behavior.details.protocol);
      }
    }
  }

  /**
   * Record anomaly event
   */
  private recordAnomalyEvent(profile: EntityProfile, behavior: BehaviorRecord): void {
    const anomalyEvent: AnomalyEvent = {
      id: `anom_${behavior.entityId}_${Date.now()}`,
      timestamp: behavior.timestamp,
      anomalyType: this.classifyAnomalyType(behavior),
      severity: this.calculateAnomalySeverity(behavior),
      description: `Anomalous ${behavior.action} detected for ${behavior.entityId}`,
      riskIncrease: behavior.riskScore,
      detectionMethod: 'statistical_deviation',
      evidence: Object.entries(behavior.details).map(
        ([key, value]) => `${key}: ${JSON.stringify(value)}`
      ),
    };

    profile.anomalyHistory.push(anomalyEvent);

    // Keep last 100 anomalies
    if (profile.anomalyHistory.length > 100) {
      profile.anomalyHistory = profile.anomalyHistory.slice(-100);
    }
  }

  /**
   * Classify anomaly type
   */
  private classifyAnomalyType(behavior: BehaviorRecord): string {
    const action = behavior.action.toLowerCase();

    if (action.includes('privilege')) return 'privilege_escalation';
    if (action.includes('data') && action.includes('access')) return 'suspicious_data_access';
    if (action.includes('login') || action.includes('auth')) return 'unusual_login';
    if (action.includes('network') || action.includes('exfil')) return 'network_anomaly';
    if (action.includes('file') && action.includes('copy')) return 'bulk_file_operation';

    return 'behavioral_anomaly';
  }

  /**
   * Calculate anomaly severity
   */
  private calculateAnomalySeverity(
    behavior: BehaviorRecord
  ): 'critical' | 'high' | 'medium' | 'low' {
    const riskScore = behavior.riskScore;

    if (riskScore > 0.8) return 'critical';
    if (riskScore > 0.6) return 'high';
    if (riskScore > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Calculate entity risk score
   */
  calculateEntityRiskScore(profile: EntityProfile): RiskScore {
    const baseRisk = 0.1; // Base risk for any entity

    // Recent activity risk (last 7 days)
    const recentBehaviors = profile.behaviors.filter(
      (b) => Date.now() - new Date(b.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );

    const recentActivityRisk =
      recentBehaviors.filter((b) => b.isAnomaly).length / Math.max(recentBehaviors.length, 1);

    // Anomaly history risk (last 30 days)
    const recentAnomalies = profile.anomalyHistory.filter(
      (a) => Date.now() - new Date(a.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
    );

    const anomalyRisk =
      recentAnomalies.reduce((sum, a) => {
        const severityMap = { critical: 1, high: 0.7, medium: 0.4, low: 0.1 };
        return sum + severityMap[a.severity];
      }, 0) / Math.max(recentAnomalies.length * 5, 1);

    // Contextual risk (peer comparison)
    const contextualRisk = this.calculateContextualRisk(profile);

    const totalRisk = (baseRisk + recentActivityRisk + anomalyRisk + contextualRisk) / 4;

    return {
      entityId: profile.entityId,
      baseRisk,
      recentActivityRisk,
      anomalyRisk,
      contextualRisk,
      totalRisk: Math.min(totalRisk, 1),
      riskLevel: this.getRiskLevel(totalRisk),
      confidence: Math.min(0.95, 0.5 + recentBehaviors.length * 0.01),
    };
  }

  /**
   * Calculate contextual risk (comparison with peers)
   */
  private calculateContextualRisk(profile: EntityProfile): number {
    // Compare with average risk of similar entities
    const similarEntities = Array.from(this.entityProfiles.values()).filter(
      (p) => p.entityType === profile.entityType && p.entityId !== profile.entityId
    );

    if (similarEntities.length === 0) return 0.1;

    const avgRisk = similarEntities.reduce((sum, p) => sum + p.riskScore, 0) / similarEntities.length;
    const profileRisk = profile.riskScore;

    return Math.min(1, Math.abs(profileRisk - avgRisk) / (avgRisk || 0.1) * 0.2);
  }

  /**
   * Get risk level string
   */
  private getRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score > 0.75) return 'critical';
    if (score > 0.5) return 'high';
    if (score > 0.25) return 'medium';
    return 'low';
  }

  /**
   * Detect anomalies for entity
   */
  detectAnomalies(entityId: string): AnomalyEvent[] {
    const profile = this.entityProfiles.get(entityId);
    if (!profile) return [];

    return profile.anomalyHistory
      .filter((a) => Date.now() - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Generate behavior insights
   */
  generateInsights(entityId: string): BehaviorInsight[] {
    const profile = this.entityProfiles.get(entityId);
    if (!profile) return [];

    const insights: BehaviorInsight[] = [];

    // Analyze recent anomalies
    const recentAnomalies = profile.anomalyHistory.slice(-10);
    if (recentAnomalies.length > 3) {
      const severityMap = { critical: 3, high: 2, medium: 1, low: 0.5 };
      const avgSeverity = recentAnomalies.reduce((sum, a) => sum + severityMap[a.severity], 0) / recentAnomalies.length;

      insights.push({
        entityId,
        insightType: 'high_anomaly_frequency',
        finding: `${recentAnomalies.length} anomalies detected in last 24 hours`,
        severity: avgSeverity,
        recommendations: [
          'Increase monitoring frequency',
          'Review access logs',
          'Consider access restriction',
        ],
        associatedEvents: recentAnomalies.map((a) => a.id),
      });
    }

    // Analyze privilege usage
    const privilegeUsage = profile.behaviors.filter((b) => b.action === 'privilege_use');
    if (privilegeUsage.length > profile.baselineMetrics.privilegeUsageFrequency * 2) {
      insights.push({
        entityId,
        insightType: 'elevated_privilege_usage',
        finding: `Privilege usage elevated by ${((privilegeUsage.length / profile.baselineMetrics.privilegeUsageFrequency - 1) * 100).toFixed(0)}%`,
        severity: 0.7,
        recommendations: ['Review privilege usage justification', 'Audit system changes'],
        associatedEvents: privilegeUsage.map((b) => b.id),
      });
    }

    // Analyze after-hours activity
    const afterHoursActivities = profile.behaviors.filter((b) => {
      const hour = new Date(b.timestamp).getHours();
      return hour < 6 || hour > 18;
    });

    if (afterHoursActivities.length > profile.behaviors.length * 0.2) {
      insights.push({
        entityId,
        insightType: 'after_hours_activity',
        finding: `${(afterHoursActivities.length / profile.behaviors.length * 100).toFixed(0)}% of activities outside business hours`,
        severity: 0.5,
        recommendations: ['Verify legitimacy', 'Check for automated processes'],
        associatedEvents: afterHoursActivities.slice(-5).map((b) => b.id),
      });
    }

    return insights;
  }

  /**
   * Detect insider threats
   */
  detectInsiderThreats(): EntityProfile[] {
    const threats: EntityProfile[] = [];

    this.entityProfiles.forEach((profile) => {
      const riskScore = this.calculateEntityRiskScore(profile);
      if (riskScore.totalRisk > 0.6) {
        // Check for insider threat indicators
        const anomalies = this.detectAnomalies(profile.entityId);
        const exfiltrationAnomalies = anomalies.filter((a) => a.anomalyType === 'network_anomaly');

        if (exfiltrationAnomalies.length > 2 || riskScore.totalRisk > 0.8) {
          threats.push(profile);
        }
      }
    });

    return threats.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Get entity risk summary
   */
  getEntityRiskSummary(entityId: string): RiskScore | null {
    const profile = this.entityProfiles.get(entityId);
    if (!profile) return null;

    return this.calculateEntityRiskScore(profile);
  }

  /**
   * Batch entity analysis
   */
  analyzeEntities(entityIds: string[]): RiskScore[] {
    return entityIds
      .map((id) => this.getEntityRiskSummary(id))
      .filter((score) => score !== null) as RiskScore[];
  }

  /**
   * Export UEBA data
   */
  exportData(entityId?: string): Record<string, any> {
    if (entityId) {
      const profile = this.entityProfiles.get(entityId);
      return {
        profile: profile || null,
        riskScore: this.getEntityRiskSummary(entityId),
        anomalies: this.detectAnomalies(entityId),
        insights: this.generateInsights(entityId),
      };
    }

    return {
      totalEntities: this.entityProfiles.size,
      entities: Array.from(this.entityProfiles.values()),
      insiderThreats: this.detectInsiderThreats(),
      overallRiskAssessment: this.analyzeEntities(
        Array.from(this.entityProfiles.keys())
      ),
    };
  }
}

export const uebaEngine = new UEBAEngine();
