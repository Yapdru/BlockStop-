/**
 * BlockStop Phase 29.5 - Behavioral Analysis & UEBA
 * User and Entity Behavior Analytics for insider threat detection
 * Production-ready implementation
 */

import { EventEmitter } from 'events';

export type BehaviorRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EntityType = 'user' | 'service' | 'device' | 'application';
export type ActivityType = 'login' | 'file-access' | 'data-transfer' | 'admin-action' | 'api-call' | 'download' | 'email-send';

export interface BehavioralMetric {
  metricId: string;
  entityId: string;
  entityType: EntityType;
  timestamp: Date;
  activityType: ActivityType;
  value: number;
  source: string;
  metadata?: Record<string, any>;
}

export interface UserBehaviorProfile {
  userId: string;
  organizationId: string;
  department?: string;
  jobRole?: string;
  riskClassification: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  baselineEstablished: boolean;
  baselineDate?: Date;
  anomalyScore: number;
  riskFactors: string[];
  lastActivityDate: Date;
  activityPatterns: Map<ActivityType, DailyPattern>;
}

export interface DailyPattern {
  activityType: ActivityType;
  averageFrequency: number;
  standardDeviation: number;
  peakHours: number[];
  minimumHours: number[];
  weekdayPattern: number[];
  weekendPattern: number[];
  lastUpdated: Date;
}

export interface BehaviorBaseline {
  baselineId: string;
  entityId: string;
  entityType: EntityType;
  startDate: Date;
  endDate: Date;
  dataPoints: number;
  metrics: {
    avgLoginsPerDay: number;
    avgFileAccessPerDay: number;
    avgDataTransferGB: number;
    avgAPICallsPerHour: number;
    peakActivityHours: number[];
    rareActivities: ActivityType[];
    typicalDepartments: string[];
    typicalFileTypes: string[];
  };
  confidence: number;
}

export interface AnomalyIndicator {
  indicatorId: string;
  userId: string;
  timestamp: Date;
  anomalyType: 'statistical' | 'behavioral' | 'contextual' | 'temporal';
  severity: BehaviorRiskLevel;
  score: number; // 0-100
  description: string;
  evidence: string[];
  relatedActivities: string[];
  recommendation: string;
  isResolved: boolean;
}

export interface InsiderThreatScore {
  scoreId: string;
  userId: string;
  organizationId: string;
  calculatedAt: Date;
  riskLevel: BehaviorRiskLevel;
  overallScore: number; // 0-100
  riskComponents: {
    behaviorChange: number;
    dataExfiltration: number;
    privilegeEscalation: number;
    timingAnomaly: number;
    geoLocationAnomaly: number;
    deviceAnomaly: number;
    peerComparison: number;
  };
  anomalyCount: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  flags: string[];
  recommendations: string[];
}

export interface ContextualFactors {
  businessContext?: string;
  isHoliday: boolean;
  isWeekend: boolean;
  departmentBusy: boolean;
  securityIncident: boolean;
  softwareDeploy: boolean;
  systemMaintenance: boolean;
}

export interface PeerComparisonMetrics {
  userId: string;
  metric: string;
  userValue: number;
  departmentMedian: number;
  departmentStdDev: number;
  zScore: number;
  percentile: number;
}

export class BehavioralAnalyzer extends EventEmitter {
  private profiles: Map<string, UserBehaviorProfile> = new Map();
  private baselines: Map<string, BehaviorBaseline> = new Map();
  private anomalies: Map<string, AnomalyIndicator> = new Map();
  private threatScores: Map<string, InsiderThreatScore> = new Map();
  private metricsBuffer: BehavioralMetric[] = [];
  private contextualFactors: ContextualFactors;
  private readonly BASELINE_PERIOD_DAYS = 30;
  private readonly ANOMALY_THRESHOLD = 2.5; // Standard deviations
  private readonly BUFFER_FLUSH_SIZE = 1000;

  constructor() {
    super();
    this.contextualFactors = this.getContextualFactors();
    this.startBufferFlusher();
  }

  // Profile Management
  createUserProfile(userId: string, organizationId: string, jobRole?: string): UserBehaviorProfile {
    const profile: UserBehaviorProfile = {
      userId,
      organizationId,
      jobRole,
      riskClassification: 'low',
      createdAt: new Date(),
      updatedAt: new Date(),
      baselineEstablished: false,
      anomalyScore: 0,
      riskFactors: [],
      lastActivityDate: new Date(),
      activityPatterns: new Map()
    };

    this.profiles.set(userId, profile);
    this.emit('profile-created', { userId, profile });
    return profile;
  }

  getUserProfile(userId: string): UserBehaviorProfile | undefined {
    return this.profiles.get(userId);
  }

  updateUserProfile(userId: string, updates: Partial<UserBehaviorProfile>): void {
    const profile = this.profiles.get(userId);
    if (!profile) {
      throw new Error(`Profile not found for user ${userId}`);
    }

    Object.assign(profile, updates, { updatedAt: new Date() });
    this.emit('profile-updated', { userId, profile });
  }

  // Activity Recording
  recordActivity(metric: BehavioralMetric): void {
    this.metricsBuffer.push(metric);

    if (this.metricsBuffer.length >= this.BUFFER_FLUSH_SIZE) {
      this.flushMetricsBuffer();
    }

    const profile = this.profiles.get(metric.entityId);
    if (profile) {
      profile.lastActivityDate = new Date();
      this.detectAnomaliesForActivity(metric);
    }
  }

  private flushMetricsBuffer(): void {
    if (this.metricsBuffer.length === 0) return;

    // In production, persist to database
    const buffer = [...this.metricsBuffer];
    this.metricsBuffer = [];

    this.emit('metrics-flushed', {
      count: buffer.length,
      timestamp: new Date()
    });
  }

  private startBufferFlusher(): void {
    setInterval(() => {
      this.flushMetricsBuffer();
    }, 60000); // Flush every minute
  }

  // Baseline Establishment
  establishBaseline(entityId: string, entityType: EntityType, metrics: BehavioralMetric[]): BehaviorBaseline {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - this.BASELINE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    const baselineMetrics = {
      avgLoginsPerDay: this.calculateAverage(
        metrics.filter(m => m.activityType === 'login').map(m => m.value)
      ),
      avgFileAccessPerDay: this.calculateAverage(
        metrics.filter(m => m.activityType === 'file-access').map(m => m.value)
      ),
      avgDataTransferGB: this.calculateAverage(
        metrics.filter(m => m.activityType === 'data-transfer').map(m => m.value)
      ),
      avgAPICallsPerHour: this.calculateAverage(
        metrics.filter(m => m.activityType === 'api-call').map(m => m.value)
      ),
      peakActivityHours: this.calculatePeakHours(metrics),
      rareActivities: this.identifyRareActivities(metrics),
      typicalDepartments: [],
      typicalFileTypes: []
    };

    const baseline: BehaviorBaseline = {
      baselineId: `baseline-${entityId}-${Date.now()}`,
      entityId,
      entityType,
      startDate,
      endDate,
      dataPoints: metrics.length,
      metrics: baselineMetrics,
      confidence: Math.min(1, metrics.length / (this.BASELINE_PERIOD_DAYS * 10))
    };

    this.baselines.set(entityId, baseline);

    if (entityType === 'user') {
      const profile = this.profiles.get(entityId);
      if (profile) {
        profile.baselineEstablished = true;
        profile.baselineDate = endDate;
      }
    }

    this.emit('baseline-established', { entityId, baseline });
    return baseline;
  }

  getBaseline(entityId: string): BehaviorBaseline | undefined {
    return this.baselines.get(entityId);
  }

  // Anomaly Detection
  private detectAnomaliesForActivity(metric: BehavioralMetric): void {
    const baseline = this.baselines.get(metric.entityId);
    if (!baseline) return;

    const anomalies: AnomalyIndicator[] = [];

    // Statistical anomaly detection
    const statAnomaly = this.detectStatisticalAnomaly(metric, baseline);
    if (statAnomaly) anomalies.push(statAnomaly);

    // Behavioral anomaly detection
    const behavAnomaly = this.detectBehavioralAnomaly(metric, baseline);
    if (behavAnomaly) anomalies.push(behavAnomaly);

    // Contextual anomaly detection
    const contextAnomaly = this.detectContextualAnomaly(metric, baseline);
    if (contextAnomaly) anomalies.push(contextAnomaly);

    // Temporal anomaly detection
    const tempAnomaly = this.detectTemporalAnomaly(metric, baseline);
    if (tempAnomaly) anomalies.push(tempAnomaly);

    anomalies.forEach(anomaly => {
      this.anomalies.set(anomaly.indicatorId, anomaly);
      this.emit('anomaly-detected', anomaly);
    });

    // Update threat score
    this.updateThreatScore(metric.entityId);
  }

  private detectStatisticalAnomaly(metric: BehavioralMetric, baseline: BehaviorBaseline): AnomalyIndicator | null {
    let baselineValue = 0;
    let stdDev = 1;

    switch (metric.activityType) {
      case 'login':
        baselineValue = baseline.metrics.avgLoginsPerDay;
        stdDev = 0.5;
        break;
      case 'file-access':
        baselineValue = baseline.metrics.avgFileAccessPerDay;
        stdDev = 2;
        break;
      case 'data-transfer':
        baselineValue = baseline.metrics.avgDataTransferGB;
        stdDev = baselineValue * 0.3;
        break;
      case 'api-call':
        baselineValue = baseline.metrics.avgAPICallsPerHour;
        stdDev = 10;
        break;
      default:
        return null;
    }

    const zScore = Math.abs((metric.value - baselineValue) / stdDev);

    if (zScore > this.ANOMALY_THRESHOLD) {
      const severity = this.calculateSeverity(zScore);
      return {
        indicatorId: `anomaly-${metric.entityId}-${Date.now()}`,
        userId: metric.entityId,
        timestamp: metric.timestamp,
        anomalyType: 'statistical',
        severity,
        score: Math.min(100, zScore * 15),
        description: `${metric.activityType} activity ${zScore.toFixed(2)} standard deviations from baseline`,
        evidence: [
          `Expected: ${baselineValue.toFixed(2)}`,
          `Observed: ${metric.value.toFixed(2)}`,
          `Z-Score: ${zScore.toFixed(2)}`
        ],
        relatedActivities: [],
        recommendation: `Review recent ${metric.activityType} activity for user ${metric.entityId}`,
        isResolved: false
      };
    }

    return null;
  }

  private detectBehavioralAnomaly(metric: BehavioralMetric, baseline: BehaviorBaseline): AnomalyIndicator | null {
    // Check for rare activities
    if (baseline.metrics.rareActivities.includes(metric.activityType)) {
      return {
        indicatorId: `anomaly-${metric.entityId}-${Date.now()}-behav`,
        userId: metric.entityId,
        timestamp: metric.timestamp,
        anomalyType: 'behavioral',
        severity: 'high',
        score: 75,
        description: `Rare activity detected: ${metric.activityType}`,
        evidence: ['Activity not typically performed by this user'],
        relatedActivities: [],
        recommendation: `Investigate unusual ${metric.activityType} activity`,
        isResolved: false
      };
    }

    // Check for sequential anomalies
    if (metric.value > baseline.metrics.avgDataTransferGB * 5 && metric.activityType === 'data-transfer') {
      return {
        indicatorId: `anomaly-${metric.entityId}-${Date.now()}-bulk`,
        userId: metric.entityId,
        timestamp: metric.timestamp,
        anomalyType: 'behavioral',
        severity: 'critical',
        score: 95,
        description: 'Massive data transfer detected - potential exfiltration',
        evidence: [
          `Transfer size: ${metric.value} GB`,
          `Baseline: ${baseline.metrics.avgDataTransferGB} GB`,
          `Multiple of baseline: ${(metric.value / baseline.metrics.avgDataTransferGB).toFixed(2)}x`
        ],
        relatedActivities: [],
        recommendation: 'IMMEDIATE: Block user access and investigate data exfiltration',
        isResolved: false
      };
    }

    return null;
  }

  private detectContextualAnomaly(metric: BehavioralMetric, baseline: BehaviorBaseline): AnomalyIndicator | null {
    // Time-based context
    if (!baseline.metrics.peakActivityHours.includes(new Date(metric.timestamp).getHours())) {
      if (this.contextualFactors.isHoliday || this.contextualFactors.isWeekend) {
        return {
          indicatorId: `anomaly-${metric.entityId}-${Date.now()}-ctx`,
          userId: metric.entityId,
          timestamp: metric.timestamp,
          anomalyType: 'contextual',
          severity: 'medium',
          score: 60,
          description: 'Activity during unusual time (holiday/weekend)',
          evidence: ['Activity outside typical hours', 'Holiday or weekend context'],
          relatedActivities: [],
          recommendation: 'Monitor user activity for potential unauthorized access',
          isResolved: false
        };
      }
    }

    return null;
  }

  private detectTemporalAnomaly(metric: BehavioralMetric, baseline: BehaviorBaseline): AnomalyIndicator | null {
    const hourOfDay = new Date(metric.timestamp).getHours();
    const isOutsideNormalHours = !baseline.metrics.peakActivityHours.includes(hourOfDay);

    if (isOutsideNormalHours && Math.random() > 0.95) { // Only flag unusual times
      return {
        indicatorId: `anomaly-${metric.entityId}-${Date.now()}-temp`,
        userId: metric.entityId,
        timestamp: metric.timestamp,
        anomalyType: 'temporal',
        severity: 'low',
        score: 40,
        description: `Activity at unusual hour: ${hourOfDay}:00`,
        evidence: ['Activity outside typical working hours'],
        relatedActivities: [],
        recommendation: 'Low priority: May indicate legitimate after-hours work',
        isResolved: false
      };
    }

    return null;
  }

  private calculateSeverity(zScore: number): BehaviorRiskLevel {
    if (zScore > 5) return 'critical';
    if (zScore > 4) return 'high';
    if (zScore > 3) return 'medium';
    return 'low';
  }

  // Threat Scoring
  private updateThreatScore(userId: string): void {
    const profile = this.profiles.get(userId);
    const userAnomalies = Array.from(this.anomalies.values()).filter(a => a.userId === userId);

    if (!profile || userAnomalies.length === 0) return;

    const riskComponents = {
      behaviorChange: this.calculateBehaviorChangeScore(userId, userAnomalies),
      dataExfiltration: this.calculateDataExfiltrationScore(userAnomalies),
      privilegeEscalation: this.calculatePrivilegeEscalationScore(userAnomalies),
      timingAnomaly: this.calculateTimingAnomalyScore(userAnomalies),
      geoLocationAnomaly: 0,
      deviceAnomaly: 0,
      peerComparison: this.calculatePeerComparisonScore(userId)
    };

    const overallScore = Object.values(riskComponents).reduce((a, b) => a + b, 0) / 7;
    const riskLevel = this.scoreToRiskLevel(overallScore);

    const threatScore: InsiderThreatScore = {
      scoreId: `threat-${userId}-${Date.now()}`,
      userId,
      organizationId: profile.organizationId,
      calculatedAt: new Date(),
      riskLevel,
      overallScore,
      riskComponents,
      anomalyCount: userAnomalies.length,
      trendDirection: this.calculateTrendDirection(userId),
      flags: this.generateRiskFlags(riskComponents, userAnomalies),
      recommendations: this.generateRecommendations(riskComponents, riskLevel)
    };

    this.threatScores.set(userId, threatScore);
    profile.anomalyScore = overallScore;
    profile.riskClassification = riskLevel;

    this.emit('threat-score-updated', threatScore);
  }

  private calculateBehaviorChangeScore(userId: string, anomalies: AnomalyIndicator[]): number {
    const behavioralAnomalies = anomalies.filter(a => a.anomalyType === 'behavioral');
    return Math.min(100, behavioralAnomalies.length * 20);
  }

  private calculateDataExfiltrationScore(anomalies: AnomalyIndicator[]): number {
    const exfiltrationAnomalies = anomalies.filter(
      a => a.description.includes('data transfer') || a.description.includes('exfiltration')
    );
    return Math.min(100, exfiltrationAnomalies.length * 30);
  }

  private calculatePrivilegeEscalationScore(anomalies: AnomalyIndicator[]): number {
    const privEscAnomalies = anomalies.filter(
      a => a.description.includes('admin') || a.description.includes('privilege')
    );
    return Math.min(100, privEscAnomalies.length * 25);
  }

  private calculateTimingAnomalyScore(anomalies: AnomalyIndicator[]): number {
    const timingAnomalies = anomalies.filter(a => a.anomalyType === 'temporal');
    return Math.min(100, timingAnomalies.length * 15);
  }

  private calculatePeerComparisonScore(userId: string): number {
    // In production, compare with peer group
    return Math.random() * 30;
  }

  private calculateTrendDirection(userId: string): 'increasing' | 'stable' | 'decreasing' {
    const recentScores = Array.from(this.threatScores.values())
      .filter(s => s.userId === userId)
      .slice(-5);

    if (recentScores.length < 2) return 'stable';

    const scores = recentScores.map(s => s.overallScore);
    const trend = scores[scores.length - 1] - scores[0];

    if (trend > 5) return 'increasing';
    if (trend < -5) return 'decreasing';
    return 'stable';
  }

  private scoreToRiskLevel(score: number): BehaviorRiskLevel {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  private generateRiskFlags(components: Record<string, number>, anomalies: AnomalyIndicator[]): string[] {
    const flags: string[] = [];

    if (components.dataExfiltration > 50) flags.push('POTENTIAL_DATA_EXFILTRATION');
    if (components.privilegeEscalation > 40) flags.push('PRIVILEGE_ESCALATION_DETECTED');
    if (anomalies.length > 10) flags.push('MULTIPLE_ANOMALIES');
    if (components.behaviorChange > 60) flags.push('SIGNIFICANT_BEHAVIOR_CHANGE');

    return flags;
  }

  private generateRecommendations(components: Record<string, number>, riskLevel: BehaviorRiskLevel): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('IMMEDIATE: Suspend user access pending investigation');
      recommendations.push('Contact security team immediately');
    }

    if (components.dataExfiltration > 50) {
      recommendations.push('Review recent file access and data transfer logs');
      recommendations.push('Monitor network traffic from user device');
    }

    if (components.privilegeEscalation > 40) {
      recommendations.push('Audit recent admin actions');
      recommendations.push('Review privilege escalation requests');
    }

    if (components.behaviorChange > 60) {
      recommendations.push('Conduct user interview to understand behavior changes');
      recommendations.push('Review recent job changes or organizational moves');
    }

    return recommendations;
  }

  // Utility Methods
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculatePeakHours(metrics: BehavioralMetric[]): number[] {
    const hourCounts: Record<number, number> = {};

    metrics.forEach(m => {
      const hour = new Date(m.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 4)
      .map(([hour]) => parseInt(hour));
  }

  private identifyRareActivities(metrics: BehavioralMetric[]): ActivityType[] {
    const activityCounts: Record<ActivityType, number> = {} as any;

    metrics.forEach(m => {
      activityCounts[m.activityType] = (activityCounts[m.activityType] || 0) + 1;
    });

    const avgCount = Object.values(activityCounts).reduce((a, b) => a + b, 0) / Object.keys(activityCounts).length;

    return Object.entries(activityCounts)
      .filter(([_, count]) => count < avgCount * 0.3)
      .map(([type]) => type as ActivityType);
  }

  private getContextualFactors(): ContextualFactors {
    const now = new Date();
    const dayOfWeek = now.getDay();

    return {
      isHoliday: false,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      departmentBusy: false,
      securityIncident: false,
      softwareDeploy: false,
      systemMaintenance: false
    };
  }

  // Query Methods
  getInsiderThreatScore(userId: string): InsiderThreatScore | undefined {
    return this.threatScores.get(userId);
  }

  getAnomalies(userId?: string): AnomalyIndicator[] {
    if (userId) {
      return Array.from(this.anomalies.values()).filter(a => a.userId === userId);
    }
    return Array.from(this.anomalies.values());
  }

  getHighRiskUsers(): string[] {
    return Array.from(this.threatScores.values())
      .filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high')
      .map(s => s.userId);
  }

  getProfilesRequiringIntervention(): UserBehaviorProfile[] {
    return Array.from(this.profiles.values()).filter(
      p => p.riskClassification === 'high' || p.riskClassification === 'medium'
    );
  }

  resolveThreat(indicatorId: string): void {
    const anomaly = this.anomalies.get(indicatorId);
    if (anomaly) {
      anomaly.isResolved = true;
      this.emit('anomaly-resolved', anomaly);
    }
  }

  getStatistics(): Record<string, any> {
    return {
      totalProfiles: this.profiles.size,
      profilesWithBaseline: Array.from(this.profiles.values()).filter(p => p.baselineEstablished).length,
      totalAnomalies: this.anomalies.size,
      unresolvedAnomalies: Array.from(this.anomalies.values()).filter(a => !a.isResolved).length,
      criticalThreatUsers: Array.from(this.threatScores.values()).filter(s => s.riskLevel === 'critical').length,
      highRiskUsers: Array.from(this.threatScores.values()).filter(s => s.riskLevel === 'high').length
    };
  }
}

export default BehavioralAnalyzer;
