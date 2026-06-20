import { query } from '@/lib/db';

export interface AccessPattern {
  userId: string;
  resourceType: string;
  resourceId: string;
  frequency: number;
  lastAccessed: Date;
  averageAccessCount: number;
  riskScore: number;
}

export interface AccessAnalysis {
  userId: string;
  totalPatterns: number;
  suspiciousPatterns: AccessPattern[];
  normalPatterns: AccessPattern[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  recommendations: string[];
}

export class AccessPatternAnalyzer {
  private readonly ANALYSIS_WINDOW_DAYS = 30;
  private readonly SUSPICIOUS_THRESHOLD = 0.6;
  private readonly CRITICAL_PATTERN_THRESHOLD = 5;

  /**
   * Analyze user access patterns
   */
  async analyzeAccessPatterns(userId: string): Promise<AccessAnalysis> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.ANALYSIS_WINDOW_DAYS);

      // Get all access patterns for the user
      const result = await query(
        `SELECT resource_type, resource_id, COUNT(*) as frequency, MAX(timestamp) as last_accessed
         FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > $2 AND decision = 'approved'
         GROUP BY resource_type, resource_id
         ORDER BY frequency DESC`,
        [userId, cutoffDate]
      );

      const allPatterns: AccessPattern[] = result.rows.map((row) => ({
        userId,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        frequency: parseInt(row.frequency),
        lastAccessed: new Date(row.last_accessed),
        averageAccessCount: Math.round(parseInt(row.frequency) / this.ANALYSIS_WINDOW_DAYS),
        riskScore: 0, // Will be calculated
      }));

      // Calculate risk score for each pattern
      for (const pattern of allPatterns) {
        pattern.riskScore = await this.calculatePatternRiskScore(pattern);
      }

      // Separate suspicious and normal patterns
      const suspiciousPatterns = allPatterns.filter((p) => p.riskScore >= this.SUSPICIOUS_THRESHOLD);
      const normalPatterns = allPatterns.filter((p) => p.riskScore < this.SUSPICIOUS_THRESHOLD);

      // Determine overall risk level
      const riskLevel = this.determineOverallRiskLevel(suspiciousPatterns, allPatterns);

      // Generate recommendations
      const recommendations = this.generateRecommendations(suspiciousPatterns, riskLevel);

      return {
        userId,
        totalPatterns: allPatterns.length,
        suspiciousPatterns,
        normalPatterns,
        riskLevel,
        recommendations,
      };
    } catch (error) {
      console.error(`Error analyzing access patterns for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Detect privilege escalation attempts
   */
  async detectPrivilegeEscalation(userId: string): Promise<boolean> {
    try {
      // Check for sudden access to admin-only resources
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const result = await query(
        `SELECT COUNT(*) as admin_access_count FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > $2
         AND (resource LIKE '%admin%' OR resource LIKE '%root%' OR resource LIKE '%system%')
         AND decision = 'approved'`,
        [userId, cutoffDate]
      );

      const adminAccessCount = parseInt(result.rows[0].admin_access_count);

      // Check if this is unusual
      const historicalResult = await query(
        `SELECT COUNT(*) as historical_admin_access FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '60 days'
         AND timestamp <= $2
         AND (resource LIKE '%admin%' OR resource LIKE '%root%' OR resource LIKE '%system%')`,
        [userId, cutoffDate]
      );

      const historicalAdminAccess = parseInt(historicalResult.rows[0].historical_admin_access);

      // If sudden spike in admin access, flag as privilege escalation attempt
      return adminAccessCount > 0 && historicalAdminAccess === 0;
    } catch (error) {
      console.error(`Error detecting privilege escalation for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Detect lateral movement attempts
   */
  async detectLateralMovement(userId: string): Promise<boolean> {
    try {
      // Check for access to resources belonging to other users/systems
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      const result = await query(
        `SELECT COUNT(*) as other_user_access FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > $2
         AND resource LIKE '%/user/%' AND resource NOT LIKE $3`,
        [userId, cutoffDate, `%/user/${userId}%`]
      );

      const otherUserAccessCount = parseInt(result.rows[0].other_user_access);

      // Check historical patterns
      const historicalResult = await query(
        `SELECT COUNT(*) as historical_access FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '30 days'
         AND timestamp <= $2
         AND resource LIKE '%/user/%' AND resource NOT LIKE $3`,
        [userId, cutoffDate, `%/user/${userId}%`]
      );

      const historicalAccessCount = parseInt(historicalResult.rows[0].historical_access);

      // Flag if sudden access to other user resources
      return otherUserAccessCount > 5 && historicalAccessCount === 0;
    } catch (error) {
      console.error(`Error detecting lateral movement for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Detect data exfiltration attempts
   */
  async detectDataExfiltration(userId: string): Promise<boolean> {
    try {
      // Check for unusual bulk data access
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);

      // Get large data access patterns
      const result = await query(
        `SELECT COUNT(*) as bulk_access_count,
                SUM(LENGTH(resource_id)) as total_data_volume
         FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > $2 AND action = 'read'`,
        [userId, cutoffDate]
      );

      const bulkAccessCount = parseInt(result.rows[0].bulk_access_count);
      const totalDataVolume = parseInt(result.rows[0].total_data_volume) || 0;

      // Get historical average
      const historicalResult = await query(
        `SELECT AVG(daily_access_count) as avg_daily_access,
                AVG(daily_data_volume) as avg_daily_volume
         FROM (
           SELECT DATE(timestamp) as access_date,
                  COUNT(*) as daily_access_count,
                  SUM(LENGTH(resource_id)) as daily_data_volume
           FROM zero_trust_access_requests
           WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '30 days'
           GROUP BY DATE(timestamp)
         ) AS daily_stats`,
        [userId]
      );

      const avgDailyAccess = parseFloat(historicalResult.rows[0].avg_daily_access) || 0;
      const avgDailyVolume = parseFloat(historicalResult.rows[0].avg_daily_volume) || 0;

      // Flag if current volume is significantly higher than average
      const currentDailyAvg = bulkAccessCount / 7; // 7-day window
      const isVolumeAnomaly = totalDataVolume > avgDailyVolume * 3;
      const isFrequencyAnomaly = currentDailyAvg > avgDailyAccess * 3;

      return isVolumeAnomaly || isFrequencyAnomaly;
    } catch (error) {
      console.error(`Error detecting data exfiltration for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get top accessed resources
   */
  async getTopAccessedResources(userId: string, limit: number = 10): Promise<AccessPattern[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.ANALYSIS_WINDOW_DAYS);

      const result = await query(
        `SELECT resource_type, resource_id, COUNT(*) as frequency, MAX(timestamp) as last_accessed
         FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > $2 AND decision = 'approved'
         GROUP BY resource_type, resource_id
         ORDER BY frequency DESC
         LIMIT $3`,
        [userId, cutoffDate, limit]
      );

      return result.rows.map((row) => ({
        userId,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        frequency: parseInt(row.frequency),
        lastAccessed: new Date(row.last_accessed),
        averageAccessCount: Math.round(parseInt(row.frequency) / this.ANALYSIS_WINDOW_DAYS),
        riskScore: 0,
      }));
    } catch (error) {
      console.error(`Error getting top accessed resources for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get access pattern timeline
   */
  async getAccessPatternTimeline(userId: string): Promise<any[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const result = await query(
        `SELECT DATE(timestamp) as access_date, COUNT(*) as daily_access_count
         FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > $2
         GROUP BY DATE(timestamp)
         ORDER BY access_date`,
        [userId, cutoffDate]
      );

      return result.rows.map((row) => ({
        date: row.access_date,
        accessCount: parseInt(row.daily_access_count),
      }));
    } catch (error) {
      console.error(`Error getting access pattern timeline for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate risk score for a specific access pattern
   */
  private async calculatePatternRiskScore(pattern: AccessPattern): Promise<number> {
    let riskScore = 0;

    // Factor 1: Frequency change (10 points max)
    if (pattern.frequency > pattern.averageAccessCount * 3) {
      riskScore += 10;
    } else if (pattern.frequency > pattern.averageAccessCount * 2) {
      riskScore += 5;
    }

    // Factor 2: Resource sensitivity (20 points max)
    if (
      pattern.resourceType === 'admin' ||
      pattern.resourceId.includes('admin') ||
      pattern.resourceId.includes('credentials')
    ) {
      riskScore += 20;
    } else if (
      pattern.resourceId.includes('sensitive') ||
      pattern.resourceId.includes('confidential')
    ) {
      riskScore += 15;
    }

    // Factor 3: Time-based anomaly (15 points max)
    const lastAccess = pattern.lastAccessed;
    const daysSinceAccess = (new Date().getTime() - lastAccess.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceAccess < 1) {
      riskScore += 5; // Recent activity
    }

    // Factor 4: Access velocity (15 points max)
    if (pattern.frequency > 100) {
      riskScore += 15; // Very high frequency
    } else if (pattern.frequency > 50) {
      riskScore += 10; // High frequency
    } else if (pattern.frequency > 20) {
      riskScore += 5; // Moderate frequency
    }

    // Normalize to 0-1 scale
    return Math.min(1, riskScore / 100);
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRiskLevel(
    suspiciousPatterns: AccessPattern[],
    allPatterns: AccessPattern[]
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (suspiciousPatterns.length === 0) {
      return 'low';
    }

    const suspiciousRatio = suspiciousPatterns.length / allPatterns.length;

    if (suspiciousRatio > 0.5) {
      return 'critical';
    } else if (suspiciousRatio > 0.3) {
      return 'high';
    } else if (suspiciousRatio > 0.1) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate recommendations based on access analysis
   */
  private generateRecommendations(
    suspiciousPatterns: AccessPattern[],
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('CRITICAL: Multiple suspicious access patterns detected');
      recommendations.push('Immediately review access permissions');
      recommendations.push('Consider isolating account pending investigation');
    } else if (riskLevel === 'high') {
      recommendations.push('Investigate suspicious access patterns');
      recommendations.push('Review user authorization for accessed resources');
      recommendations.push('Enable enhanced monitoring for this user');
    } else if (riskLevel === 'medium') {
      recommendations.push('Monitor access patterns for changes');
      recommendations.push('Review recently accessed sensitive resources');
    }

    // Specific recommendations for sensitive resource access
    const sensitiveAccess = suspiciousPatterns.filter(
      (p) => p.resourceId.includes('admin') || p.resourceId.includes('credentials')
    );

    if (sensitiveAccess.length > 0) {
      recommendations.push(`Unauthorized access to ${sensitiveAccess.length} sensitive resource(s) detected`);
      recommendations.push('Verify legitimate business purpose for sensitive access');
    }

    return recommendations;
  }

  /**
   * Store access pattern analysis results
   */
  async storeAnalysisResults(userId: string, analysis: AccessAnalysis): Promise<void> {
    try {
      // Store suspicious patterns as anomalies
      for (const pattern of analysis.suspiciousPatterns) {
        await query(
          `INSERT INTO zero_trust_anomalies (user_id, anomaly_type, severity, description, anomaly_score, detected_at)
           VALUES ($1, 'suspicious_access_pattern', $2, $3, $4, CURRENT_TIMESTAMP)`,
          [
            userId,
            analysis.riskLevel,
            `Suspicious access to ${pattern.resourceType}/${pattern.resourceId} (${pattern.frequency} times)`,
            pattern.riskScore * 100,
          ]
        );
      }
    } catch (error) {
      console.error(`Error storing analysis results for user ${userId}:`, error);
      throw error;
    }
  }
}

export const accessPatternAnalyzer = new AccessPatternAnalyzer();
