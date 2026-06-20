import { query } from '@/lib/db';

export interface CompromiseIndicator {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  detected_at: Date;
}

export interface CompromiseAnalysis {
  deviceId: string;
  isCompromised: boolean;
  riskScore: number;
  indicators: CompromiseIndicator[];
  recommendation: string;
}

export class CompromisedDeviceDetector {
  private readonly COMPROMISE_THRESHOLD = 70;
  private readonly CRITICAL_INDICATOR_WEIGHT = 40;
  private readonly HIGH_INDICATOR_WEIGHT = 25;
  private readonly MEDIUM_INDICATOR_WEIGHT = 15;
  private readonly LOW_INDICATOR_WEIGHT = 5;

  /**
   * Detect if a device is compromised by analyzing multiple indicators
   */
  async detectCompromise(deviceId: string): Promise<CompromiseAnalysis> {
    try {
      const indicators: CompromiseIndicator[] = [];
      let riskScore = 0;

      // Check for malware signatures
      const malwareIndicators = await this.checkMalwareSignatures(deviceId);
      indicators.push(...malwareIndicators);
      riskScore += this.calculateIndicatorScore(malwareIndicators);

      // Check for suspicious network behavior
      const networkIndicators = await this.checkSuspiciousNetworkBehavior(deviceId);
      indicators.push(...networkIndicators);
      riskScore += this.calculateIndicatorScore(networkIndicators);

      // Check for unauthorized modifications
      const modificationIndicators = await this.checkUnauthorizedModifications(deviceId);
      indicators.push(...modificationIndicators);
      riskScore += this.calculateIndicatorScore(modificationIndicators);

      // Check for rootkit/kernel-level threats
      const rootkitIndicators = await this.checkRootkitPresence(deviceId);
      indicators.push(...rootkitIndicators);
      riskScore += this.calculateIndicatorScore(rootkitIndicators);

      // Check for credential theft indicators
      const credentialIndicators = await this.checkCredentialTheftSignals(deviceId);
      indicators.push(...credentialIndicators);
      riskScore += this.calculateIndicatorScore(credentialIndicators);

      // Check for data exfiltration patterns
      const exfiltrationIndicators = await this.checkDataExfiltrationPatterns(deviceId);
      indicators.push(...exfiltrationIndicators);
      riskScore += this.calculateIndicatorScore(exfiltrationIndicators);

      // Normalize risk score to 0-100 scale
      riskScore = Math.min(100, riskScore);

      const isCompromised = riskScore >= this.COMPROMISE_THRESHOLD;

      // Store analysis results
      await this.storeCompromiseAnalysis(deviceId, isCompromised, riskScore, indicators);

      const recommendation = this.getRecommendation(isCompromised, riskScore, indicators);

      return {
        deviceId,
        isCompromised,
        riskScore,
        indicators,
        recommendation,
      };
    } catch (error) {
      console.error(`Error detecting compromise on device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Check for known malware signatures
   */
  private async checkMalwareSignatures(deviceId: string): Promise<CompromiseIndicator[]> {
    try {
      const indicators: CompromiseIndicator[] = [];

      const result = await query(
        `SELECT issue_type, severity, description FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type IN ('malware_detected', 'pup_detected', 'suspicious_file')
         AND resolved = FALSE`,
        [deviceId]
      );

      for (const row of result.rows) {
        indicators.push({
          type: 'malware_signature',
          severity: row.severity,
          description: `${row.issue_type}: ${row.description}`,
          detected_at: new Date(),
        });
      }

      return indicators;
    } catch (error) {
      console.error(`Error checking malware signatures for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Check for suspicious network behavior
   */
  private async checkSuspiciousNetworkBehavior(deviceId: string): Promise<CompromiseIndicator[]> {
    try {
      const indicators: CompromiseIndicator[] = [];

      // Check for unusual outbound connections
      const connectionResult = await query(
        `SELECT COUNT(*) as suspicious_count FROM zero_trust_anomalies
         WHERE device_id = $1 AND anomaly_type = 'unusual_network_connection'
         AND resolved = FALSE`,
        [deviceId]
      );

      if (parseInt(connectionResult.rows[0].suspicious_count) > 2) {
        indicators.push({
          type: 'suspicious_network_behavior',
          severity: 'high',
          description: 'Multiple unusual network connections detected',
          detected_at: new Date(),
        });
      }

      // Check for data exfiltration attempts
      const exfilResult = await query(
        `SELECT COUNT(*) as exfil_count FROM zero_trust_anomalies
         WHERE device_id = $1 AND anomaly_type = 'data_exfiltration'
         AND resolved = FALSE`,
        [deviceId]
      );

      if (parseInt(exfilResult.rows[0].exfil_count) > 0) {
        indicators.push({
          type: 'data_exfiltration_attempt',
          severity: 'critical',
          description: 'Data exfiltration attempt detected',
          detected_at: new Date(),
        });
      }

      return indicators;
    } catch (error) {
      console.error(`Error checking network behavior for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Check for unauthorized system modifications
   */
  private async checkUnauthorizedModifications(deviceId: string): Promise<CompromiseIndicator[]> {
    try {
      const indicators: CompromiseIndicator[] = [];

      const result = await query(
        `SELECT issue_type, severity FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type IN ('system_file_modified', 'registry_modified', 'boot_sector_modified')
         AND resolved = FALSE`,
        [deviceId]
      );

      for (const row of result.rows) {
        indicators.push({
          type: 'unauthorized_modification',
          severity: row.severity,
          description: `Unauthorized system modification detected: ${row.issue_type}`,
          detected_at: new Date(),
        });
      }

      return indicators;
    } catch (error) {
      console.error(`Error checking modifications for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Check for rootkit/kernel-level threats
   */
  private async checkRootkitPresence(deviceId: string): Promise<CompromiseIndicator[]> {
    try {
      const indicators: CompromiseIndicator[] = [];

      const result = await query(
        `SELECT issue_type FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type IN ('rootkit_detected', 'kernel_module_suspicious', 'driver_suspicious')
         AND resolved = FALSE`,
        [deviceId]
      );

      if (result.rows.length > 0) {
        indicators.push({
          type: 'rootkit_presence',
          severity: 'critical',
          description: 'Potential rootkit or kernel-level threat detected',
          detected_at: new Date(),
        });
      }

      return indicators;
    } catch (error) {
      console.error(`Error checking rootkit presence for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Check for credential theft signals
   */
  private async checkCredentialTheftSignals(deviceId: string): Promise<CompromiseIndicator[]> {
    try {
      const indicators: CompromiseIndicator[] = [];

      // Check for keylogger detection
      const keyloggerResult = await query(
        `SELECT COUNT(*) as keylogger_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'keylogger_detected'
         AND resolved = FALSE`,
        [deviceId]
      );

      if (parseInt(keyloggerResult.rows[0].keylogger_count) > 0) {
        indicators.push({
          type: 'keylogger_detected',
          severity: 'critical',
          description: 'Keylogger malware detected on device',
          detected_at: new Date(),
        });
      }

      // Check for info stealer detection
      const stealerResult = await query(
        `SELECT COUNT(*) as stealer_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'info_stealer_detected'
         AND resolved = FALSE`,
        [deviceId]
      );

      if (parseInt(stealerResult.rows[0].stealer_count) > 0) {
        indicators.push({
          type: 'credential_stealer_detected',
          severity: 'critical',
          description: 'Information stealer malware detected on device',
          detected_at: new Date(),
        });
      }

      return indicators;
    } catch (error) {
      console.error(`Error checking credential theft signals for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Check for data exfiltration patterns
   */
  private async checkDataExfiltrationPatterns(deviceId: string): Promise<CompromiseIndicator[]> {
    try {
      const indicators: CompromiseIndicator[] = [];

      // Check for unusual data volume transfers
      const result = await query(
        `SELECT COUNT(*) as anomaly_count FROM zero_trust_access_requests
         WHERE device_id = $1 AND anomaly_detected = TRUE
         AND anomaly_type = 'data_exfiltration'
         AND timestamp > NOW() - INTERVAL '24 hours'`,
        [deviceId]
      );

      if (parseInt(result.rows[0].anomaly_count) > 3) {
        indicators.push({
          type: 'data_exfiltration_pattern',
          severity: 'high',
          description: 'Suspicious data transfer pattern detected in last 24 hours',
          detected_at: new Date(),
        });
      }

      return indicators;
    } catch (error) {
      console.error(`Error checking data exfiltration patterns for device ${deviceId}:`, error);
      return [];
    }
  }

  /**
   * Calculate risk score from indicators
   */
  private calculateIndicatorScore(indicators: CompromiseIndicator[]): number {
    let score = 0;

    for (const indicator of indicators) {
      switch (indicator.severity) {
        case 'critical':
          score += this.CRITICAL_INDICATOR_WEIGHT;
          break;
        case 'high':
          score += this.HIGH_INDICATOR_WEIGHT;
          break;
        case 'medium':
          score += this.MEDIUM_INDICATOR_WEIGHT;
          break;
        case 'low':
          score += this.LOW_INDICATOR_WEIGHT;
          break;
      }
    }

    return score;
  }

  /**
   * Get remediation recommendation based on analysis
   */
  private getRecommendation(isCompromised: boolean, riskScore: number, indicators: CompromiseIndicator[]): string {
    if (!isCompromised) {
      return 'Device appears to be secure. Continue monitoring.';
    }

    const criticalIndicators = indicators.filter((i) => i.severity === 'critical');

    if (criticalIndicators.length > 0) {
      return 'CRITICAL: Device is compromised and should be immediately isolated and remediated. Back up user data if needed, then perform full system scan and malware removal. Consider factory reset if necessary.';
    }

    if (riskScore >= 85) {
      return 'HIGH RISK: Device shows strong signs of compromise. Isolate from sensitive networks, perform aggressive malware scan, update all software, and change all credentials from a secure device.';
    }

    return 'MEDIUM RISK: Device shows signs of compromise. Perform full system scan, remove detected threats, update software, and monitor for additional anomalies.';
  }

  /**
   * Store compromise analysis results
   */
  private async storeCompromiseAnalysis(
    deviceId: string,
    isCompromised: boolean,
    riskScore: number,
    indicators: CompromiseIndicator[]
  ): Promise<void> {
    try {
      if (isCompromised) {
        // Update device as compromised
        await query(
          `UPDATE zero_trust_devices
           SET is_compromised = TRUE, trust_score = $1, updated_at = CURRENT_TIMESTAMP
           WHERE device_id = $2`,
          [Math.max(0, 100 - riskScore), deviceId]
        );

        // Log all indicators as anomalies
        for (const indicator of indicators) {
          await query(
            `INSERT INTO zero_trust_anomalies (device_id, anomaly_type, severity, description, anomaly_score, detected_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
            [deviceId, indicator.type, indicator.severity, indicator.description, riskScore]
          );
        }
      }
    } catch (error) {
      console.error(`Error storing compromise analysis for device ${deviceId}:`, error);
      throw error;
    }
  }
}

export const compromisedDeviceDetector = new CompromisedDeviceDetector();
