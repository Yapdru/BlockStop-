import { query } from '@/lib/db';

export interface TrustScore {
  deviceId: string;
  trustScore: number;
  level: 'high' | 'medium' | 'low';
  details: {
    osVulnerable: boolean;
    antimalwareStatus: { enabled: boolean };
    diskEncrypted: boolean;
    firewallEnabled: boolean;
    screenLocked: boolean;
    isJailbroken: boolean;
  };
}

export interface AccessDecision {
  allowed: boolean;
  level?: 'full-access' | 'restricted-access' | 'read-only';
  restrictions?: string[];
  reason?: string;
}

export class DeviceTrustEngine {
  private readonly MIN_TRUST_SCORE_FOR_ACCESS = 30;
  private readonly FULL_ACCESS_THRESHOLD = 70;
  private readonly RESTRICTED_ACCESS_THRESHOLD = 40;

  /**
   * Calculate device trust score based on multiple factors
   */
  async calculateDeviceTrustScore(deviceId: string): Promise<TrustScore> {
    try {
      const osVulnerable = await this.checkOSVulnerabilities(deviceId);
      const antimalwareStatus = await this.checkAntimalwareStatus(deviceId);
      const diskEncrypted = await this.checkDiskEncryption(deviceId);
      const firewallEnabled = await this.checkFirewallStatus(deviceId);
      const screenLocked = await this.checkScreenLock(deviceId);
      const isJailbroken = await this.checkJailbreakStatus(deviceId);

      // Calculate trust score based on security posture
      let trustScore = 100;

      // OS vulnerability check (10 points)
      if (osVulnerable) {
        trustScore -= 10;
      }

      // Antimalware status (20 points)
      if (!antimalwareStatus.enabled) {
        trustScore -= 20;
      }

      // Disk encryption (15 points)
      if (!diskEncrypted) {
        trustScore -= 15;
      }

      // Firewall status (15 points)
      if (!firewallEnabled) {
        trustScore -= 15;
      }

      // Screen lock (10 points)
      if (!screenLocked) {
        trustScore -= 10;
      }

      // Jailbreak/root detection (15 points)
      if (isJailbroken) {
        trustScore -= 15;
      }

      // Ensure score is between 0 and 100
      trustScore = Math.max(0, Math.min(100, trustScore));

      const level = this.getTrustLevel(trustScore);

      // Update device trust score in database
      await this.updateDeviceTrustScore(deviceId, trustScore, level);

      return {
        deviceId,
        trustScore,
        level,
        details: {
          osVulnerable,
          antimalwareStatus,
          diskEncrypted,
          firewallEnabled,
          screenLocked,
          isJailbroken,
        },
      };
    } catch (error) {
      console.error(`Error calculating trust score for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Enforce device trust and determine access level
   */
  async enforceDeviceTrust(userId: string, deviceId: string): Promise<AccessDecision> {
    try {
      // Get device trust score
      const trustScore = await this.calculateDeviceTrustScore(deviceId);

      // Check if device is compromised
      const deviceResult = await query(
        'SELECT is_compromised, status FROM zero_trust_devices WHERE device_id = $1 AND user_id = $2',
        [deviceId, userId]
      );

      if (deviceResult.rows.length === 0) {
        return {
          allowed: false,
          reason: 'Device not found in registry',
        };
      }

      const device = deviceResult.rows[0];

      // If device is compromised, deny access
      if (device.is_compromised) {
        return {
          allowed: false,
          reason: 'Device is compromised and isolated',
        };
      }

      // If device is quarantined, deny access
      if (device.status === 'quarantined') {
        return {
          allowed: false,
          reason: 'Device is in quarantine',
        };
      }

      // If device is revoked, deny access
      if (device.status === 'revoked') {
        return {
          allowed: false,
          reason: 'Device has been revoked',
        };
      }

      // Determine access level based on trust score
      if (trustScore.trustScore >= this.FULL_ACCESS_THRESHOLD) {
        return {
          allowed: true,
          level: 'full-access',
          reason: 'Device trust is high',
        };
      } else if (trustScore.trustScore >= this.RESTRICTED_ACCESS_THRESHOLD) {
        return {
          allowed: true,
          level: 'restricted-access',
          restrictions: ['no_sensitive_data_access', 'no_credential_export', 'session_timeout_5min'],
          reason: 'Device trust is moderate',
        };
      } else if (trustScore.trustScore >= this.MIN_TRUST_SCORE_FOR_ACCESS) {
        return {
          allowed: true,
          level: 'read-only',
          restrictions: [
            'read_only_access',
            'no_data_export',
            'no_sensitive_operations',
            'session_timeout_2min',
          ],
          reason: 'Device trust is low - read-only access',
        };
      } else {
        return {
          allowed: false,
          reason: `Device trust score (${trustScore.trustScore}) is below minimum threshold (${this.MIN_TRUST_SCORE_FOR_ACCESS})`,
        };
      }
    } catch (error) {
      console.error(`Error enforcing device trust for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Check for OS vulnerabilities
   */
  private async checkOSVulnerabilities(deviceId: string): Promise<boolean> {
    try {
      // Check device health issues for critical OS vulnerabilities
      const result = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'os_vulnerability' AND severity IN ('critical', 'high')`,
        [deviceId]
      );

      return parseInt(result.rows[0].issue_count) > 0;
    } catch (error) {
      console.error(`Error checking OS vulnerabilities for device ${deviceId}:`, error);
      return true; // Default to vulnerable for safety
    }
  }

  /**
   * Check antimalware status
   */
  private async checkAntimalwareStatus(deviceId: string): Promise<{ enabled: boolean }> {
    try {
      // Query device health issues to check if antimalware is disabled
      const result = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'antimalware_disabled'`,
        [deviceId]
      );

      const isDisabled = parseInt(result.rows[0].issue_count) > 0;
      return { enabled: !isDisabled };
    } catch (error) {
      console.error(`Error checking antimalware status for device ${deviceId}:`, error);
      return { enabled: false }; // Default to disabled for safety
    }
  }

  /**
   * Check disk encryption status
   */
  private async checkDiskEncryption(deviceId: string): Promise<boolean> {
    try {
      // Query device health issues to check if disk is encrypted
      const result = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'disk_not_encrypted'`,
        [deviceId]
      );

      return parseInt(result.rows[0].issue_count) === 0;
    } catch (error) {
      console.error(`Error checking disk encryption for device ${deviceId}:`, error);
      return false; // Default to not encrypted for safety
    }
  }

  /**
   * Check firewall status
   */
  private async checkFirewallStatus(deviceId: string): Promise<boolean> {
    try {
      // Query device health issues to check if firewall is enabled
      const result = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'firewall_disabled'`,
        [deviceId]
      );

      return parseInt(result.rows[0].issue_count) === 0;
    } catch (error) {
      console.error(`Error checking firewall status for device ${deviceId}:`, error);
      return false; // Default to disabled for safety
    }
  }

  /**
   * Check screen lock status
   */
  private async checkScreenLock(deviceId: string): Promise<boolean> {
    try {
      // Query device health issues to check if screen lock is enabled
      const result = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'screen_lock_disabled'`,
        [deviceId]
      );

      return parseInt(result.rows[0].issue_count) === 0;
    } catch (error) {
      console.error(`Error checking screen lock for device ${deviceId}:`, error);
      return false; // Default to not locked for safety
    }
  }

  /**
   * Check for jailbreak/root status
   */
  private async checkJailbreakStatus(deviceId: string): Promise<boolean> {
    try {
      // Query device health issues to check for jailbreak
      const result = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'device_jailbroken'`,
        [deviceId]
      );

      return parseInt(result.rows[0].issue_count) > 0;
    } catch (error) {
      console.error(`Error checking jailbreak status for device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Update device trust score in database
   */
  private async updateDeviceTrustScore(
    deviceId: string,
    trustScore: number,
    trustLevel: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE zero_trust_devices
         SET trust_score = $1, trust_level = $2, updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $3`,
        [trustScore, trustLevel, deviceId]
      );
    } catch (error) {
      console.error(`Error updating trust score for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Determine trust level from trust score
   */
  private getTrustLevel(trustScore: number): 'high' | 'medium' | 'low' {
    if (trustScore >= 70) {
      return 'high';
    } else if (trustScore >= 40) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

export const deviceTrustEngine = new DeviceTrustEngine();
