import { query } from '@/lib/db';

export interface AccessRequest {
  userId: string;
  deviceId: string;
  location: string;
  timestamp: Date;
  resource: string;
  action: string;
}

export interface UserBaseline {
  userId: string;
  usualLocations: { location: string; frequency: number }[];
  usualHours: { hour: number; frequency: number }[];
  knownDevices: string[];
  usualAccess: { resource: string; frequency: number }[];
  avgDataVolume: number;
  lastUpdated: Date;
}

export interface Anomaly {
  type: string;
  severity: number;
  description: string;
}

export interface AnomalyScore {
  userId: string;
  anomalyScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  anomalies: Anomaly[];
  recommendation: string;
}

export class BehaviorAnalyzer {
  private readonly ANOMALY_THRESHOLD = 0.6;
  private readonly MIN_BASELINE_DAYS = 7;
  private readonly LOCATION_DEVIATION_WEIGHT = 20;
  private readonly TIME_DEVIATION_WEIGHT = 15;
  private readonly DEVICE_ANOMALY_WEIGHT = 25;
  private readonly ACCESS_PATTERN_WEIGHT = 20;
  private readonly DATA_VOLUME_WEIGHT = 20;

  /**
   * Detect anomalies in user behavior
   */
  async detectAnomalies(userId: string, request: AccessRequest): Promise<AnomalyScore> {
    try {
      // Get or create user baseline
      let baseline = await this.getUserBaseline(userId);
      if (!baseline) {
        baseline = await this.buildUserBaseline(userId);
      }

      const anomalies: Anomaly[] = [];
      let anomalyScore = 0;

      // Check location anomaly
      const locationAnomaly = this.checkLocationAnomaly(request.location, baseline.usualLocations);
      if (locationAnomaly) {
        anomalies.push(locationAnomaly);
        anomalyScore += this.LOCATION_DEVIATION_WEIGHT;
      }

      // Check time anomaly
      const timeAnomaly = this.checkTimeAnomaly(request.timestamp, baseline.usualHours);
      if (timeAnomaly) {
        anomalies.push(timeAnomaly);
        anomalyScore += this.TIME_DEVIATION_WEIGHT;
      }

      // Check device anomaly
      const deviceAnomaly = this.checkDeviceAnomaly(request.deviceId, baseline.knownDevices);
      if (deviceAnomaly) {
        anomalies.push(deviceAnomaly);
        anomalyScore += this.DEVICE_ANOMALY_WEIGHT;
      }

      // Check access pattern anomaly
      const accessPatternAnomaly = this.checkAccessPattern(request, baseline.usualAccess);
      if (accessPatternAnomaly) {
        anomalies.push(accessPatternAnomaly);
        anomalyScore += this.ACCESS_PATTERN_WEIGHT;
      }

      // Check data volume anomaly
      const dataVolumeAnomaly = this.checkDataVolume(request, baseline.avgDataVolume);
      if (dataVolumeAnomaly) {
        anomalies.push(dataVolumeAnomaly);
        anomalyScore += this.DATA_VOLUME_WEIGHT;
      }

      // Check for impossible travel
      const impossibleTravelAnomaly = await this.checkImpossibleTravel(userId, request.location);
      if (impossibleTravelAnomaly) {
        anomalies.push(impossibleTravelAnomaly);
        anomalyScore += 40; // High weight for impossible travel
      }

      // Normalize score to 0-100 scale
      anomalyScore = Math.min(100, anomalyScore);

      const severity = this.getSeverityLevel(anomalyScore);
      const recommendation = this.getRecommendation(anomalyScore, anomalies);

      // Store anomaly detection result
      await this.storeAnomalyResult(userId, request, anomalyScore, anomalies);

      return {
        userId,
        anomalyScore,
        severity,
        anomalies,
        recommendation,
      };
    } catch (error) {
      console.error(`Error detecting anomalies for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Build baseline behavior for a user from historical data
   */
  async buildUserBaseline(userId: string): Promise<UserBaseline> {
    try {
      const lookbackDays = 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

      // Get location history
      const locationResult = await query(
        `SELECT location, COUNT(*) as frequency FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > $2
         GROUP BY location
         ORDER BY frequency DESC
         LIMIT 10`,
        [userId, cutoffDate]
      );

      const usualLocations = locationResult.rows.map((row) => ({
        location: row.location,
        frequency: parseInt(row.frequency),
      }));

      // Get time of day patterns
      const hourResult = await query(
        `SELECT EXTRACT(HOUR FROM timestamp)::int as hour, COUNT(*) as frequency
         FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > $2
         GROUP BY hour
         ORDER BY frequency DESC`,
        [userId, cutoffDate]
      );

      const usualHours = hourResult.rows.map((row) => ({
        hour: row.hour,
        frequency: parseInt(row.frequency),
      }));

      // Get known devices
      const deviceResult = await query(
        `SELECT DISTINCT device_id FROM zero_trust_devices
         WHERE user_id = $1 AND status = 'active'
         ORDER BY last_seen DESC
         LIMIT 20`,
        [userId]
      );

      const knownDevices = deviceResult.rows.map((row) => row.device_id);

      // Get access patterns
      const accessResult = await query(
        `SELECT resource, COUNT(*) as frequency FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > $2
         GROUP BY resource
         ORDER BY frequency DESC
         LIMIT 15`,
        [userId, cutoffDate]
      );

      const usualAccess = accessResult.rows.map((row) => ({
        resource: row.resource,
        frequency: parseInt(row.frequency),
      }));

      // Calculate average data volume
      const dataVolumeResult = await query(
        `SELECT COALESCE(AVG(CAST(COALESCE(
          (SELECT SUM(LENGTH(resource_id)) FROM zero_trust_access_requests
           WHERE user_id = $1 AND timestamp > $2), 0) AS NUMERIC)), 0) as avg_volume
         FROM zero_trust_access_requests
         WHERE user_id = $1 AND timestamp > $2`,
        [userId, cutoffDate]
      );

      const avgDataVolume = parseFloat(dataVolumeResult.rows[0].avg_volume) || 0;

      const baseline: UserBaseline = {
        userId,
        usualLocations,
        usualHours,
        knownDevices,
        usualAccess,
        avgDataVolume,
        lastUpdated: new Date(),
      };

      // Store baseline
      await this.storeUserBaseline(baseline);

      return baseline;
    } catch (error) {
      console.error(`Error building baseline for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user baseline with new data
   */
  async updateBaseline(userId: string): Promise<void> {
    try {
      const baseline = await this.buildUserBaseline(userId);
      await this.storeUserBaseline(baseline);
    } catch (error) {
      console.error(`Error updating baseline for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check for location anomalies
   */
  checkLocationAnomaly(location: string, usualLocations: { location: string; frequency: number }[]): Anomaly | null {
    if (!usualLocations || usualLocations.length === 0) {
      return null;
    }

    const totalFrequency = usualLocations.reduce((sum, loc) => sum + loc.frequency, 0);
    const topLocations = usualLocations.slice(0, 5);

    const isUsualLocation = topLocations.some((loc) => loc.location === location);

    if (!isUsualLocation) {
      const newLocationFrequency = (100 / topLocations[0]?.frequency) * 0.1; // Very low frequency for new location
      return {
        type: 'unusual_location',
        severity: 50,
        description: `Access from unusual location: ${location}`,
      };
    }

    return null;
  }

  /**
   * Check for time-based anomalies
   */
  checkTimeAnomaly(timestamp: Date, usualHours: { hour: number; frequency: number }[]): Anomaly | null {
    if (!usualHours || usualHours.length === 0) {
      return null;
    }

    const hour = timestamp.getHours();
    const isUsualHour = usualHours.some((h) => h.hour === hour);

    if (!isUsualHour) {
      // Check if it's outside normal working hours
      if (hour < 6 || hour > 22) {
        return {
          type: 'unusual_access_time',
          severity: 35,
          description: `Access at unusual time: ${hour}:00 (outside normal working hours)`,
        };
      }
    }

    return null;
  }

  /**
   * Check for device anomalies
   */
  checkDeviceAnomaly(deviceId: string, knownDevices: string[]): Anomaly | null {
    if (!knownDevices || knownDevices.length === 0) {
      return null;
    }

    const isKnownDevice = knownDevices.includes(deviceId);

    if (!isKnownDevice) {
      return {
        type: 'unknown_device',
        severity: 60,
        description: `Access from unknown or newly registered device: ${deviceId}`,
      };
    }

    return null;
  }

  /**
   * Check for access pattern anomalies
   */
  checkAccessPattern(request: AccessRequest, usualAccess: { resource: string; frequency: number }[]): Anomaly | null {
    if (!usualAccess || usualAccess.length === 0) {
      return null;
    }

    const isUsualResource = usualAccess.some((access) => access.resource === request.resource);

    if (!isUsualResource) {
      return {
        type: 'unusual_resource_access',
        severity: 40,
        description: `Access to unusual resource: ${request.resource}`,
      };
    }

    return null;
  }

  /**
   * Check for data volume anomalies
   */
  checkDataVolume(request: AccessRequest, avgVolume: number): Anomaly | null {
    // This is simplified - in production, this would calculate actual data volume
    const estimatedVolume = request.resource.length * 2; // Rough estimate

    if (estimatedVolume > avgVolume * 3) {
      return {
        type: 'unusual_data_volume',
        severity: 45,
        description: `Unusual data volume: ${estimatedVolume} bytes (3x average)`,
      };
    }

    return null;
  }

  /**
   * Check for impossible travel (geographically impossible access pattern)
   */
  private async checkImpossibleTravel(userId: string, location: string): Promise<Anomaly | null> {
    try {
      // Get last access location and time
      const lastAccessResult = await query(
        `SELECT location, timestamp FROM zero_trust_access_requests
         WHERE user_id = $1
         ORDER BY timestamp DESC
         LIMIT 1`,
        [userId]
      );

      if (lastAccessResult.rows.length === 0) {
        return null;
      }

      const lastAccess = lastAccessResult.rows[0];
      const timeDifference = (new Date().getTime() - new Date(lastAccess.timestamp).getTime()) / (1000 * 60); // minutes

      // If same location, no impossible travel
      if (lastAccess.location === location) {
        return null;
      }

      // If time difference is very small (e.g., < 15 minutes) but location is different
      if (timeDifference < 15) {
        // In production, would calculate distance and check if travel is possible
        return {
          type: 'impossible_travel',
          severity: 85,
          description: `Geographically impossible travel detected: ${lastAccess.location} to ${location} in ${timeDifference} minutes`,
        };
      }

      return null;
    } catch (error) {
      console.error(`Error checking impossible travel for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get user baseline from database
   */
  private async getUserBaseline(userId: string): Promise<UserBaseline | null> {
    try {
      const result = await query(
        `SELECT user_id, usual_hours, usual_locations, known_devices, usual_access_patterns, avg_data_volume_mb, last_updated
         FROM zero_trust_behaviors
         WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        userId: row.user_id,
        usualHours: JSON.parse(row.usual_hours || '[]'),
        usualLocations: JSON.parse(row.usual_locations || '[]'),
        knownDevices: JSON.parse(row.known_devices || '[]'),
        usualAccess: JSON.parse(row.usual_access_patterns || '[]'),
        avgDataVolume: parseFloat(row.avg_data_volume_mb) || 0,
        lastUpdated: new Date(row.last_updated),
      };
    } catch (error) {
      console.error(`Error retrieving baseline for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Store user baseline in database
   */
  private async storeUserBaseline(baseline: UserBaseline): Promise<void> {
    try {
      await query(
        `INSERT INTO zero_trust_behaviors (user_id, usual_hours, usual_locations, known_devices, usual_access_patterns, avg_data_volume_mb, last_updated)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE
         SET usual_hours = $2, usual_locations = $3, known_devices = $4, usual_access_patterns = $5, avg_data_volume_mb = $6, last_updated = CURRENT_TIMESTAMP`,
        [
          baseline.userId,
          JSON.stringify(baseline.usualHours),
          JSON.stringify(baseline.usualLocations),
          JSON.stringify(baseline.knownDevices),
          JSON.stringify(baseline.usualAccess),
          baseline.avgDataVolume,
        ]
      );
    } catch (error) {
      console.error(`Error storing baseline for user ${baseline.userId}:`, error);
      throw error;
    }
  }

  /**
   * Store anomaly detection result
   */
  private async storeAnomalyResult(
    userId: string,
    request: AccessRequest,
    anomalyScore: number,
    anomalies: Anomaly[]
  ): Promise<void> {
    try {
      const anomalyTypes = anomalies.map((a) => a.type).join(',');
      const maxSeverity = anomalies.length > 0 ? Math.max(...anomalies.map((a) => a.severity)) : 0;

      await query(
        `INSERT INTO zero_trust_access_requests (user_id, device_id, location, timestamp, resource, action, anomaly_detected, anomaly_score, anomaly_type, decision)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          request.deviceId,
          request.location,
          request.timestamp,
          request.resource,
          request.action,
          anomalies.length > 0,
          anomalyScore,
          anomalyTypes,
          anomalyScore > 70 ? 'pending' : 'approved',
        ]
      );
    } catch (error) {
      console.error(`Error storing anomaly result for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Determine severity level from anomaly score
   */
  private getSeverityLevel(anomalyScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (anomalyScore >= 80) {
      return 'critical';
    } else if (anomalyScore >= 60) {
      return 'high';
    } else if (anomalyScore >= 40) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get recommendation based on anomaly score
   */
  private getRecommendation(anomalyScore: number, anomalies: Anomaly[]): string {
    if (anomalyScore >= 80) {
      return 'CRITICAL: Multiple severe anomalies detected. Require multi-factor authentication and additional verification before granting access.';
    } else if (anomalyScore >= 60) {
      return 'HIGH: Significant anomalies detected. Request additional authentication or manual review.';
    } else if (anomalyScore >= 40) {
      return 'MEDIUM: Some unusual activity detected. Monitor closely and log all actions.';
    } else {
      return 'LOW: Minimal anomalies. Proceed with standard access controls.';
    }
  }
}

export const behaviorAnalyzer = new BehaviorAnalyzer();
