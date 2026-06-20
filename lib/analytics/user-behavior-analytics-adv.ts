import { UserBehaviorProfile, LoginEvent, BehaviorAnomaly } from './types';
import { calculateMean, calculateStandardDeviation, detectOutliers, normalizeScore } from './utils';
import { BEHAVIOR_ANOMALY_TYPES } from './constants';

export class UserBehaviorAnalyzer {
  private profiles: Map<string, UserBehaviorProfile> = new Map();
  private baselineData: Map<string, number[]> = new Map();

  createUserProfile(userId: string): UserBehaviorProfile {
    const profile: UserBehaviorProfile = {
      userId,
      loginPatterns: [],
      accessedAssets: [],
      dataAccessPatterns: [],
      riskScore: 0,
      lastAnalyzed: new Date(),
      anomalies: [],
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  recordLoginEvent(userId: string, event: LoginEvent): void {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = this.createUserProfile(userId);
    }

    profile.loginPatterns.push(event);
    profile.lastAnalyzed = new Date();
    this.updateProfileRisk(userId);
  }

  recordAssetAccess(userId: string, assetId: string, dataSize: number = 0): void {
    let profile = this.profiles.get(userId);
    if (!profile) {
      profile = this.createUserProfile(userId);
    }

    if (!profile.accessedAssets.includes(assetId)) {
      profile.accessedAssets.push(assetId);
    }

    const accessPattern = profile.dataAccessPatterns.find(p => p.assetId === assetId);
    if (accessPattern) {
      accessPattern.accessCount++;
      accessPattern.lastAccessed = new Date();
      accessPattern.accessTimes.push(new Date());
      accessPattern.dataTransferred += dataSize;
    } else {
      profile.dataAccessPatterns.push({
        assetId,
        accessCount: 1,
        lastAccessed: new Date(),
        accessTimes: [new Date()],
        dataTransferred: dataSize,
      });
    }
  }

  analyzeUserBehavior(userId: string): UserBehaviorProfile {
    const profile = this.profiles.get(userId);
    if (!profile) return this.createUserProfile(userId);

    profile.anomalies = this.detectAnomalies(userId);
    profile.riskScore = this.calculateUserRiskScore(profile);
    profile.lastAnalyzed = new Date();

    return profile;
  }

  private detectAnomalies(userId: string): BehaviorAnomaly[] {
    const profile = this.profiles.get(userId);
    if (!profile || profile.loginPatterns.length === 0) return [];

    const anomalies: BehaviorAnomaly[] = [];

    const timeAnomalies = this.detectUnusualTimes(profile);
    const locationAnomalies = this.detectUnusualLocations(profile);
    const volumeAnomalies = this.detectUnusualVolume(profile);

    anomalies.push(...timeAnomalies);
    anomalies.push(...locationAnomalies);
    anomalies.push(...volumeAnomalies);

    return anomalies;
  }

  private detectUnusualTimes(profile: UserBehaviorProfile): BehaviorAnomaly[] {
    const anomalies: BehaviorAnomaly[] = [];
    const timestamps = profile.loginPatterns.map(l => l.timestamp.getHours());

    const mean = calculateMean(timestamps);
    const stdDev = calculateStandardDeviation(timestamps);

    profile.loginPatterns.forEach((login, idx) => {
      const hour = login.timestamp.getHours();
      const zScore = Math.abs((hour - mean) / (stdDev || 1));

      if (zScore > 2) {
        anomalies.push({
          id: `anomaly-time-${idx}-${Date.now()}`,
          type: BEHAVIOR_ANOMALY_TYPES.UNUSUAL_TIME,
          severity: Math.min(100, zScore * 30),
          confidence: Math.min(1, zScore / 3),
          timestamp: login.timestamp,
        });
      }
    });

    return anomalies;
  }

  private detectUnusualLocations(profile: UserBehaviorProfile): BehaviorAnomaly[] {
    const anomalies: BehaviorAnomaly[] = [];
    const locations = profile.loginPatterns.map(l => l.location);
    const uniqueLocations = new Set(locations);

    if (uniqueLocations.size > 5) {
      const recentLogins = profile.loginPatterns.slice(-10);
      const uniqueRecentLocations = new Set(recentLogins.map(l => l.location));

      if (uniqueRecentLocations.size > 3) {
        anomalies.push({
          id: `anomaly-location-${Date.now()}`,
          type: BEHAVIOR_ANOMALY_TYPES.UNUSUAL_LOCATION,
          severity: 60,
          confidence: 0.8,
          timestamp: new Date(),
        });
      }
    }

    return anomalies;
  }

  private detectUnusualVolume(profile: UserBehaviorProfile): BehaviorAnomaly[] {
    const anomalies: BehaviorAnomaly[] = [];
    const volumes = profile.dataAccessPatterns.map(p => p.dataTransferred);

    if (volumes.length < 2) return anomalies;

    const mean = calculateMean(volumes);
    const stdDev = calculateStandardDeviation(volumes);

    profile.dataAccessPatterns.forEach((pattern, idx) => {
      const zScore = Math.abs((pattern.dataTransferred - mean) / (stdDev || 1));

      if (zScore > 2) {
        anomalies.push({
          id: `anomaly-volume-${idx}-${Date.now()}`,
          type: BEHAVIOR_ANOMALY_TYPES.UNUSUAL_VOLUME,
          severity: Math.min(100, zScore * 25),
          confidence: Math.min(1, zScore / 3),
          timestamp: new Date(),
        });
      }
    });

    return anomalies;
  }

  private calculateUserRiskScore(profile: UserBehaviorProfile): number {
    let riskScore = 0;

    const loginRisk = this.calculateLoginRisk(profile);
    const accessRisk = this.calculateAccessRisk(profile);
    const anomalyRisk = profile.anomalies.reduce((sum, a) => sum + a.severity, 0) / Math.max(1, profile.anomalies.length);

    riskScore = (loginRisk * 0.3 + accessRisk * 0.4 + anomalyRisk * 0.3);

    return normalizeScore(riskScore, 0, 100);
  }

  private calculateLoginRisk(profile: UserBehaviorProfile): number {
    if (profile.loginPatterns.length === 0) return 20;

    const failedLogins = profile.loginPatterns.filter(l => !l.success).length;
    const failureRate = (failedLogins / profile.loginPatterns.length) * 100;

    return Math.min(100, failureRate * 2);
  }

  private calculateAccessRisk(profile: UserBehaviorProfile): number {
    if (profile.dataAccessPatterns.length === 0) return 10;

    const assetCount = profile.accessedAssets.length;
    const accessFrequency = profile.dataAccessPatterns.reduce((sum, p) => sum + p.accessCount, 0);
    const dataVolume = profile.dataAccessPatterns.reduce((sum, p) => sum + p.dataTransferred, 0);

    const frequencyRisk = Math.min(100, (accessFrequency / 100) * 40);
    const volumeRisk = Math.min(100, (dataVolume / 1000000) * 40);
    const diversityRisk = Math.min(100, (assetCount / 50) * 20);

    return (frequencyRisk * 0.4 + volumeRisk * 0.4 + diversityRisk * 0.2);
  }

  private updateProfileRisk(userId: string): void {
    const profile = this.profiles.get(userId);
    if (profile) {
      profile.riskScore = this.calculateUserRiskScore(profile);
    }
  }

  getUserProfile(userId: string): UserBehaviorProfile | null {
    return this.profiles.get(userId) || null;
  }

  getHighRiskUsers(threshold: number = 70): string[] {
    const highRiskUsers: string[] = [];

    this.profiles.forEach((profile) => {
      if (profile.riskScore >= threshold) {
        highRiskUsers.push(profile.userId);
      }
    });

    return highRiskUsers;
  }

  getBehaviorBaseline(userId: string): Record<string, number> {
    const profile = this.profiles.get(userId);
    if (!profile) return {};

    return {
      avgLoginTime: calculateMean(profile.loginPatterns.map(l => l.timestamp.getHours())),
      avgAssetAccess: profile.dataAccessPatterns.length > 0 ?
        profile.dataAccessPatterns.reduce((sum, p) => sum + p.accessCount, 0) / profile.dataAccessPatterns.length : 0,
      avgDataTransfer: profile.dataAccessPatterns.length > 0 ?
        profile.dataAccessPatterns.reduce((sum, p) => sum + p.dataTransferred, 0) / profile.dataAccessPatterns.length : 0,
    };
  }

  compareUserBehaviors(userId1: string, userId2: string): number {
    const profile1 = this.profiles.get(userId1);
    const profile2 = this.profiles.get(userId2);

    if (!profile1 || !profile2) return 0;

    const assetSimilarity = new Set([...profile1.accessedAssets, ...profile2.accessedAssets]).size /
      Math.max(profile1.accessedAssets.length, profile2.accessedAssets.length);

    return normalizeScore(assetSimilarity * 100, 0, 100);
  }
}
