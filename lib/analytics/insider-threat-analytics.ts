import { InsiderThreatIndicator, UserBehaviorProfile } from './types';
import { normalizeScore, calculatePercentChange } from './utils';
import { INSIDER_THREAT_TYPES, INSIDER_THREAT_THRESHOLDS } from './constants';

export class InsiderThreatAnalyzer {
  private indicators: Map<string, InsiderThreatIndicator[]> = new Map();
  private userRiskScores: Map<string, number> = new Map();

  detectInsiderThreat(userId: string, behaviorProfile: UserBehaviorProfile): InsiderThreatIndicator[] {
    const threats: InsiderThreatIndicator[] = [];

    const exfiltrationRisk = this.analyzeExfiltrationRisk(behaviorProfile);
    if (exfiltrationRisk.confidence > INSIDER_THREAT_THRESHOLDS.MEDIUM) {
      threats.push(exfiltrationRisk);
    }

    const privilegeAbuseRisk = this.analyzePrivilegeAbuse(behaviorProfile);
    if (privilegeAbuseRisk.confidence > INSIDER_THREAT_THRESHOLDS.MEDIUM) {
      threats.push(privilegeAbuseRisk);
    }

    const sabotageRisk = this.analyzeSabotageRisk(behaviorProfile);
    if (sabotageRisk.confidence > INSIDER_THREAT_THRESHOLDS.LOW) {
      threats.push(sabotageRisk);
    }

    this.storeIndicators(userId, threats);
    this.updateRiskScore(userId, threats);

    return threats;
  }

  private analyzeExfiltrationRisk(profile: UserBehaviorProfile): InsiderThreatIndicator {
    const baseIndicators: string[] = [];
    let riskScore = 0;

    const totalDataTransferred = profile.dataAccessPatterns.reduce((sum, p) => sum + p.dataTransferred, 0);
    if (totalDataTransferred > 1000000) {
      riskScore += 30;
      baseIndicators.push(`Large data transfer: ${totalDataTransferred} bytes`);
    }

    const uniqueAssets = profile.accessedAssets.length;
    if (uniqueAssets > 20) {
      riskScore += 25;
      baseIndicators.push(`Accessed ${uniqueAssets} unique assets`);
    }

    const bulkAccessPatterns = profile.dataAccessPatterns.filter(p => p.accessCount > 50).length;
    if (bulkAccessPatterns > 0) {
      riskScore += 20;
      baseIndicators.push(`High frequency access pattern detected`);
    }

    const anomalyCount = profile.anomalies.length;
    if (anomalyCount > 2) {
      riskScore += 15;
      baseIndicators.push(`Multiple behavioral anomalies`);
    }

    return {
      userId: profile.userId,
      type: INSIDER_THREAT_TYPES.DATA_EXFILTRATION,
      severity: normalizeScore(riskScore, 0, 100),
      confidence: Math.min(1, riskScore / 100),
      indicators: baseIndicators,
      timestamp: new Date(),
    };
  }

  private analyzePrivilegeAbuse(profile: UserBehaviorProfile): InsiderThreatIndicator {
    const baseIndicators: string[] = [];
    let riskScore = 0;

    const criticalAssets = profile.accessedAssets.filter(a =>
      a.includes('admin') || a.includes('db') || a.includes('config')
    ).length;

    if (criticalAssets > 5) {
      riskScore += 40;
      baseIndicators.push(`Accessed ${criticalAssets} critical assets`);
    }

    const failedLogins = profile.loginPatterns.filter(l => !l.success).length;
    if (failedLogins > 10) {
      riskScore += 25;
      baseIndicators.push(`Multiple failed login attempts: ${failedLogins}`);
    }

    const offHoursAccess = profile.loginPatterns.filter(l => {
      const hour = l.timestamp.getHours();
      return hour < 6 || hour > 22;
    }).length;

    if (offHoursAccess > 5) {
      riskScore += 20;
      baseIndicators.push(`Frequent off-hours access`);
    }

    return {
      userId: profile.userId,
      type: INSIDER_THREAT_TYPES.PRIVILEGE_ABUSE,
      severity: normalizeScore(riskScore, 0, 100),
      confidence: Math.min(1, riskScore / 100),
      indicators: baseIndicators,
      timestamp: new Date(),
    };
  }

  private analyzeSabotageRisk(profile: UserBehaviorProfile): InsiderThreatIndicator {
    const baseIndicators: string[] = [];
    let riskScore = 0;

    const deletionIndicators = profile.dataAccessPatterns.filter(p =>
      p.assetId.includes('backup') || p.assetId.includes('archive')
    ).length;

    if (deletionIndicators > 3) {
      riskScore += 30;
      baseIndicators.push(`Access to backup/archive systems`);
    }

    const configAccessCount = profile.dataAccessPatterns.filter(p =>
      p.assetId.includes('config') || p.assetId.includes('settings')
    ).reduce((sum, p) => sum + p.accessCount, 0);

    if (configAccessCount > 20) {
      riskScore += 25;
      baseIndicators.push(`Unusual configuration access patterns`);
    }

    const anomalyTypes = new Set(profile.anomalies.map(a => a.type));
    if (anomalyTypes.size > 2) {
      riskScore += 20;
      baseIndicators.push(`Multiple anomaly types detected`);
    }

    return {
      userId: profile.userId,
      type: INSIDER_THREAT_TYPES.SABOTAGE,
      severity: normalizeScore(riskScore, 0, 100),
      confidence: Math.min(1, riskScore / 100),
      indicators: baseIndicators,
      timestamp: new Date(),
    };
  }

  private storeIndicators(userId: string, threats: InsiderThreatIndicator[]): void {
    if (!this.indicators.has(userId)) {
      this.indicators.set(userId, []);
    }

    const userThreats = this.indicators.get(userId)!;
    userThreats.push(...threats);

    if (userThreats.length > 100) {
      userThreats.shift();
    }
  }

  private updateRiskScore(userId: string, threats: InsiderThreatIndicator[]): void {
    if (threats.length === 0) {
      this.userRiskScores.set(userId, 0);
      return;
    }

    const avgSeverity = threats.reduce((sum, t) => sum + t.severity, 0) / threats.length;
    const maxConfidence = Math.max(...threats.map(t => t.confidence));

    const riskScore = (avgSeverity * 0.6 + maxConfidence * 100 * 0.4);
    this.userRiskScores.set(userId, normalizeScore(riskScore, 0, 100));
  }

  getUserRiskScore(userId: string): number {
    return this.userRiskScores.get(userId) || 0;
  }

  getHighRiskUsers(threshold: number = 70): string[] {
    const highRiskUsers: string[] = [];

    this.userRiskScores.forEach((score, userId) => {
      if (score >= threshold) {
        highRiskUsers.push(userId);
      }
    });

    return highRiskUsers;
  }

  getThreatIndicators(userId: string): InsiderThreatIndicator[] {
    return this.indicators.get(userId) || [];
  }

  analyzeRiskTrend(userId: string): number {
    const userThreats = this.indicators.get(userId) || [];
    if (userThreats.length < 2) return 0;

    const recent = userThreats.slice(-10).map(t => t.severity);
    const older = userThreats.slice(-20, -10).map(t => t.severity);

    const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : 0;

    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  }

  generateThreatReport(userId: string): object {
    const indicators = this.getThreatIndicators(userId);
    const riskScore = this.getUserRiskScore(userId);
    const trend = this.analyzeRiskTrend(userId);

    const threatCounts: Record<string, number> = {};
    indicators.forEach((threat) => {
      threatCounts[threat.type] = (threatCounts[threat.type] || 0) + 1;
    });

    return {
      userId,
      riskScore: riskScore.toFixed(2),
      riskLevel: riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : 'medium',
      trendDirection: trend > 5 ? 'increasing' : trend < -5 ? 'decreasing' : 'stable',
      threatCounts,
      recentIndicators: indicators.slice(-3).map(ind => ({
        type: ind.type,
        severity: ind.severity,
        timestamp: ind.timestamp.toISOString(),
      })),
    };
  }

  clearUserHistory(userId: string): void {
    this.indicators.delete(userId);
    this.userRiskScores.delete(userId);
  }
}
