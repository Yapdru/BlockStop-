import { query } from '@/lib/db';

export interface AnomalyAlert {
  anomalyId: string;
  userId: string;
  deviceId: string;
  anomalyType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  anomalyScore: number;
  location: string;
  ipAddress: string;
  detectedAt: Date;
  requiresAction: boolean;
}

export class AnomalyDetector {
  private readonly REAL_TIME_DETECTION_WINDOW_MINUTES = 5;
  private readonly BATCH_DETECTION_WINDOW_MINUTES = 60;
  private readonly CRITICAL_THRESHOLD = 85;
  private readonly HIGH_THRESHOLD = 65;
  private readonly MEDIUM_THRESHOLD = 45;

  /**
   * Real-time anomaly detection on access attempt
   */
  async detectAnomalies(userId: string, deviceId: string, accessContext: any): Promise<AnomalyAlert | null> {
    try {
      const anomalyCheckResults: any = {
        failedLoginsCount: await this.checkFailedLogins(userId),
        bruteForceDetected: await this.checkBruteForce(userId, deviceId),
        velocityAnomalyScore: await this.checkVelocityAnomaly(userId),
        geoVelocityAnomaly: await this.checkGeoVelocityAnomaly(userId, accessContext.location),
        successiveFailuresCount: await this.checkSuccessiveFailures(userId),
        newIPAddress: await this.checkNewIPAddress(userId, accessContext.ipAddress),
        newBrowser: await this.checkNewBrowser(userId, accessContext.userAgent),
        suspiciousCountry: await this.checkSuspiciousCountry(accessContext.location),
        abnormalResourceAccess: await this.checkAbnormalResourceAccess(userId),
      };

      // Calculate composite anomaly score
      let anomalyScore = 0;
      const detectedAnomalies: string[] = [];

      // Failed logins (5 points per failed attempt, max 30)
      if (anomalyCheckResults.failedLoginsCount > 0) {
        anomalyScore += Math.min(30, anomalyCheckResults.failedLoginsCount * 5);
        detectedAnomalies.push(`${anomalyCheckResults.failedLoginsCount} failed logins`);
      }

      // Brute force detection (50 points)
      if (anomalyCheckResults.bruteForceDetected) {
        anomalyScore += 50;
        detectedAnomalies.push('Brute force attack detected');
      }

      // Velocity anomaly (20 points)
      if (anomalyCheckResults.velocityAnomalyScore > 0.7) {
        anomalyScore += 20;
        detectedAnomalies.push('Unusual access velocity');
      }

      // Geo-velocity anomaly (40 points)
      if (anomalyCheckResults.geoVelocityAnomaly) {
        anomalyScore += 40;
        detectedAnomalies.push('Geographically impossible velocity');
      }

      // Successive failures (15 points)
      if (anomalyCheckResults.successiveFailuresCount >= 3) {
        anomalyScore += 15;
        detectedAnomalies.push(`${anomalyCheckResults.successiveFailuresCount} successive failures`);
      }

      // New IP address (10 points)
      if (anomalyCheckResults.newIPAddress) {
        anomalyScore += 10;
        detectedAnomalies.push('Access from new IP address');
      }

      // New browser (15 points)
      if (anomalyCheckResults.newBrowser) {
        anomalyScore += 15;
        detectedAnomalies.push('Access from new browser/device');
      }

      // Suspicious country (20 points)
      if (anomalyCheckResults.suspiciousCountry) {
        anomalyScore += 20;
        detectedAnomalies.push('Access from suspicious country');
      }

      // Abnormal resource access (25 points)
      if (anomalyCheckResults.abnormalResourceAccess) {
        anomalyScore += 25;
        detectedAnomalies.push('Abnormal resource access pattern');
      }

      // Normalize score to 0-100
      anomalyScore = Math.min(100, anomalyScore);

      // Only create alert if anomalies detected
      if (anomalyScore > 0) {
        const severity = this.calculateSeverity(anomalyScore);
        const primaryAnomalyType = this.determinePrimaryAnomalyType(detectedAnomalies);

        const alert: AnomalyAlert = {
          anomalyId: this.generateAnomalyId(),
          userId,
          deviceId,
          anomalyType: primaryAnomalyType,
          severity,
          description: detectedAnomalies.join('; '),
          anomalyScore,
          location: accessContext.location || 'unknown',
          ipAddress: accessContext.ipAddress || 'unknown',
          detectedAt: new Date(),
          requiresAction: anomalyScore >= this.CRITICAL_THRESHOLD,
        };

        // Store anomaly alert
        await this.storeAnomalyAlert(alert);

        // If critical, trigger immediate action
        if (alert.severity === 'critical') {
          await this.triggerCriticalResponse(alert);
        }

        return alert;
      }

      return null;
    } catch (error) {
      console.error(`Error detecting anomalies for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check for failed login attempts
   */
  private async checkFailedLogins(userId: string): Promise<number> {
    try {
      const result = await query(
        `SELECT COUNT(*) as failed_count FROM zero_trust_access_requests
         WHERE user_id = $1 AND decision = 'denied'
         AND timestamp > NOW() - INTERVAL '${this.REAL_TIME_DETECTION_WINDOW_MINUTES} minutes'`,
        [userId]
      );

      return parseInt(result.rows[0].failed_count);
    } catch (error) {
      console.error(`Error checking failed logins for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Check for brute force attack patterns
   */
  private async checkBruteForce(userId: string, deviceId: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT COUNT(*) as denied_count FROM zero_trust_access_requests
         WHERE user_id = $1 AND device_id = $2 AND decision = 'denied'
         AND timestamp > NOW() - INTERVAL '10 minutes'`,
        [userId, deviceId]
      );

      // Brute force if 10+ denied attempts in 10 minutes
      return parseInt(result.rows[0].denied_count) >= 10;
    } catch (error) {
      console.error(`Error checking brute force for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check for unusual access velocity (too many requests in short time)
   */
  private async checkVelocityAnomaly(userId: string): Promise<number> {
    try {
      const result = await query(
        `SELECT COUNT(*) as request_count FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '1 minute'`,
        [userId]
      );

      const requestCount = parseInt(result.rows[0].request_count);

      // Anomaly score increases with request velocity
      // 1-5 requests per minute = normal, 6-10 = slight anomaly, 10+ = high anomaly
      if (requestCount > 20) {
        return 1.0; // Max anomaly
      } else if (requestCount > 10) {
        return 0.8;
      } else if (requestCount > 5) {
        return 0.4;
      }

      return 0;
    } catch (error) {
      console.error(`Error checking velocity anomaly for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Check for geographically impossible velocity
   */
  private async checkGeoVelocityAnomaly(userId: string, currentLocation: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT location, timestamp FROM zero_trust_access_requests
         WHERE user_id = $1 AND location != $2
         ORDER BY timestamp DESC
         LIMIT 1`,
        [userId, currentLocation]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const lastRequest = result.rows[0];
      const timeDifference = (new Date().getTime() - new Date(lastRequest.timestamp).getTime()) / (1000 * 60); // minutes

      // If less than 15 minutes and different location, might be impossible travel
      // In production, would calculate actual distance
      if (timeDifference < 15 && lastRequest.location !== currentLocation) {
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking geo-velocity anomaly for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check for successive failed attempts
   */
  private async checkSuccessiveFailures(userId: string): Promise<number> {
    try {
      const result = await query(
        `SELECT COUNT(*) as successive_count FROM (
          SELECT * FROM zero_trust_access_requests
          WHERE user_id = $1 AND decision = 'denied'
          ORDER BY timestamp DESC
          LIMIT 10
         ) WHERE decision = 'denied'`,
        [userId]
      );

      return parseInt(result.rows[0].successive_count);
    } catch (error) {
      console.error(`Error checking successive failures for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Check if access is from a new IP address
   */
  private async checkNewIPAddress(userId: string, currentIP: string): Promise<boolean> {
    try {
      // Check if this IP has been used by user before
      const result = await query(
        `SELECT COUNT(*) as ip_count FROM zero_trust_sessions
         WHERE user_id = $1 AND ip_address = $2::INET
         AND started_at > NOW() - INTERVAL '30 days'`,
        [userId, currentIP]
      );

      return parseInt(result.rows[0].ip_count) === 0;
    } catch (error) {
      console.error(`Error checking new IP address for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if access is from a new browser
   */
  private async checkNewBrowser(userId: string, userAgent: string): Promise<boolean> {
    try {
      // Simplified browser detection from user agent
      const result = await query(
        `SELECT COUNT(*) as browser_count FROM zero_trust_sessions
         WHERE user_id = $1 AND user_agent = $2
         AND started_at > NOW() - INTERVAL '30 days'`,
        [userId, userAgent]
      );

      return parseInt(result.rows[0].browser_count) === 0;
    } catch (error) {
      console.error(`Error checking new browser for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if access is from a suspicious country
   */
  private async checkSuspiciousCountry(location: string): Promise<boolean> {
    // List of high-risk countries (simplified - in production would use comprehensive list)
    const suspiciousCountries = ['North Korea', 'Iran', 'Syria'];

    return suspiciousCountries.some((country) => location.includes(country));
  }

  /**
   * Check for abnormal resource access patterns
   */
  private async checkAbnormalResourceAccess(userId: string): Promise<boolean> {
    try {
      // Check if user is accessing sensitive resources they normally don't access
      const result = await query(
        `SELECT COUNT(*) as sensitive_access_count FROM zero_trust_access_requests
         WHERE user_id = $1 AND resource LIKE '%sensitive%' OR resource LIKE '%admin%'
         AND timestamp > NOW() - INTERVAL '${this.REAL_TIME_DETECTION_WINDOW_MINUTES} minutes'
         AND decision = 'approved'`,
        [userId]
      );

      const sensitiveAccessCount = parseInt(result.rows[0].sensitive_access_count);

      // Anomaly if suddenly accessing multiple sensitive resources
      return sensitiveAccessCount > 5;
    } catch (error) {
      console.error(`Error checking abnormal resource access for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Calculate severity level from anomaly score
   */
  private calculateSeverity(anomalyScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (anomalyScore >= this.CRITICAL_THRESHOLD) {
      return 'critical';
    } else if (anomalyScore >= this.HIGH_THRESHOLD) {
      return 'high';
    } else if (anomalyScore >= this.MEDIUM_THRESHOLD) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Determine primary anomaly type from detected anomalies
   */
  private determinePrimaryAnomalyType(anomalies: string[]): string {
    if (anomalies.some((a) => a.includes('Brute force'))) {
      return 'brute_force_attack';
    } else if (anomalies.some((a) => a.includes('Geographically'))) {
      return 'impossible_travel';
    } else if (anomalies.some((a) => a.includes('failed logins'))) {
      return 'failed_login_attempts';
    } else if (anomalies.some((a) => a.includes('new IP'))) {
      return 'new_location_access';
    } else if (anomalies.some((a) => a.includes('Abnormal resource'))) {
      return 'abnormal_resource_access';
    } else {
      return 'general_anomaly';
    }
  }

  /**
   * Store anomaly alert in database
   */
  private async storeAnomalyAlert(alert: AnomalyAlert): Promise<void> {
    try {
      await query(
        `INSERT INTO zero_trust_anomalies (user_id, device_id, anomaly_type, severity, description, anomaly_score, location, ip_address, detected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          alert.userId,
          alert.deviceId,
          alert.anomalyType,
          alert.severity,
          alert.description,
          alert.anomalyScore,
          alert.location,
          alert.ipAddress,
        ]
      );
    } catch (error) {
      console.error(`Error storing anomaly alert:`, error);
      throw error;
    }
  }

  /**
   * Trigger critical response actions
   */
  private async triggerCriticalResponse(alert: AnomalyAlert): Promise<void> {
    try {
      // Kill all active sessions for the user
      await query(
        `UPDATE zero_trust_sessions SET is_active = FALSE, expires_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND is_active = TRUE`,
        [alert.userId]
      );

      // Log critical alert
      console.error(`CRITICAL SECURITY ALERT: ${alert.description} for user ${alert.userId}`);

      // In production, would trigger alerts to security team
      // - Send email notification
      // - Create incident ticket
      // - Trigger SMS alert
      // - Initiate investigation workflow
    } catch (error) {
      console.error(`Error triggering critical response:`, error);
      throw error;
    }
  }

  /**
   * Generate unique anomaly ID
   */
  private generateAnomalyId(): string {
    return `anom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent anomalies for a user
   */
  async getRecentAnomalies(userId: string, limitHours: number = 24): Promise<AnomalyAlert[]> {
    try {
      const result = await query(
        `SELECT id, user_id, device_id, anomaly_type, severity, description, anomaly_score, location, ip_address, detected_at
         FROM zero_trust_anomalies
         WHERE user_id = $1 AND detected_at > NOW() - INTERVAL '${limitHours} hours'
         ORDER BY detected_at DESC`,
        [userId]
      );

      return result.rows.map((row) => ({
        anomalyId: `anom_${row.id}`,
        userId: row.user_id,
        deviceId: row.device_id,
        anomalyType: row.anomaly_type,
        severity: row.severity,
        description: row.description,
        anomalyScore: parseFloat(row.anomaly_score),
        location: row.location,
        ipAddress: row.ip_address,
        detectedAt: new Date(row.detected_at),
        requiresAction: row.severity === 'critical',
      }));
    } catch (error) {
      console.error(`Error getting recent anomalies for user ${userId}:`, error);
      throw error;
    }
  }
}

export const anomalyDetector = new AnomalyDetector();
