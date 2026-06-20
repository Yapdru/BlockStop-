import { query } from '@/lib/db';
import { deviceRegistry } from './device-registry';

export interface IsolationPolicy {
  deviceId: string;
  isolationLevel: 'strict' | 'moderate' | 'minimal';
  restrictions: IsolationRestriction[];
  isolatedAt: Date;
  isolationReason: string;
}

export interface IsolationRestriction {
  type: string;
  description: string;
  enabled: boolean;
}

export class DeviceIsolation {
  private readonly ISOLATION_TIMEOUT_HOURS = 72;

  /**
   * Isolate a compromised device with strict restrictions
   */
  async isolateDevice(
    deviceId: string,
    isolationLevel: 'strict' | 'moderate' | 'minimal',
    reason: string
  ): Promise<IsolationPolicy> {
    try {
      // Quarantine the device
      await deviceRegistry.quarantineDevice(deviceId, reason);

      // Get the device to determine restrictions
      const device = await deviceRegistry.getDevice(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      // Create isolation policy based on level
      const restrictions = this.generateIsolationRestrictions(isolationLevel);

      // Store isolation policy
      await this.storeIsolationPolicy(deviceId, isolationLevel, restrictions, reason);

      // Kill all active sessions for this device
      await this.killActiveSessions(deviceId);

      // Revoke all credentials issued to this device
      await this.revokeDeviceCredentials(deviceId);

      return {
        deviceId,
        isolationLevel,
        restrictions,
        isolatedAt: new Date(),
        isolationReason: reason,
      };
    } catch (error) {
      console.error(`Error isolating device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Remove isolation from a remediated device
   */
  async removeIsolation(deviceId: string): Promise<void> {
    try {
      // Unquarantine the device
      await deviceRegistry.unquarantineDevice(deviceId);

      // Remove isolation policy
      await this.clearIsolationPolicy(deviceId);

      // Log the action
      await query(
        `INSERT INTO zero_trust_device_trust_history (device_id, new_level, reason, changed_by)
         VALUES ($1, 'active', 'Device unquarantined and isolation removed', 'system')`,
        [deviceId]
      );
    } catch (error) {
      console.error(`Error removing isolation from device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get current isolation policy for a device
   */
  async getIsolationPolicy(deviceId: string): Promise<IsolationPolicy | null> {
    try {
      const result = await query(
        `SELECT device_id, status, quarantine_reason, quarantined_at
         FROM zero_trust_devices
         WHERE device_id = $1 AND status = 'quarantined'`,
        [deviceId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const device = result.rows[0];

      // Determine isolation level from device health
      const healthResult = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND severity = 'critical' AND resolved = FALSE`,
        [deviceId]
      );

      const criticalIssueCount = parseInt(healthResult.rows[0].issue_count);
      let isolationLevel: 'strict' | 'moderate' | 'minimal' = 'moderate';

      if (criticalIssueCount > 2) {
        isolationLevel = 'strict';
      } else if (criticalIssueCount === 0) {
        isolationLevel = 'minimal';
      }

      const restrictions = this.generateIsolationRestrictions(isolationLevel);

      return {
        deviceId,
        isolationLevel,
        restrictions,
        isolatedAt: new Date(device.quarantined_at),
        isolationReason: device.quarantine_reason,
      };
    } catch (error) {
      console.error(`Error getting isolation policy for device ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Enforce isolation restrictions on access attempt
   */
  async enforceIsolationRestrictions(deviceId: string): Promise<IsolationRestriction[]> {
    try {
      const policy = await this.getIsolationPolicy(deviceId);

      if (!policy) {
        return [];
      }

      // Return active restrictions
      return policy.restrictions.filter((r) => r.enabled);
    } catch (error) {
      console.error(`Error enforcing isolation restrictions for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Check if isolation has exceeded timeout and should be auto-removed
   */
  async checkIsolationTimeout(deviceId: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT quarantined_at FROM zero_trust_devices
         WHERE device_id = $1 AND status = 'quarantined'`,
        [deviceId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const quarantinedAt = new Date(result.rows[0].quarantined_at);
      const timeoutAt = new Date(quarantinedAt.getTime() + this.ISOLATION_TIMEOUT_HOURS * 60 * 60 * 1000);

      return new Date() > timeoutAt;
    } catch (error) {
      console.error(`Error checking isolation timeout for device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Monitor isolation status and alert on suspicious activities during isolation
   */
  async monitorIsolationStatus(deviceId: string): Promise<{ isViolation: boolean; violations: string[] }> {
    try {
      const violations: string[] = [];

      // Check for attempts to access sensitive resources
      const sensitiveAccessResult = await query(
        `SELECT COUNT(*) as attempt_count FROM zero_trust_access_requests
         WHERE device_id = $1 AND decision = 'denied'
         AND timestamp > NOW() - INTERVAL '1 hour'`,
        [deviceId]
      );

      if (parseInt(sensitiveAccessResult.rows[0].attempt_count) > 5) {
        violations.push('Multiple denied access attempts detected');
      }

      // Check for attempts to disable security features
      const disableAttemptResult = await query(
        `SELECT COUNT(*) as attempt_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type IN ('firewall_disabled', 'antimalware_disabled')
         AND created_at > NOW() - INTERVAL '1 hour'`,
        [deviceId]
      );

      if (parseInt(disableAttemptResult.rows[0].attempt_count) > 0) {
        violations.push('Attempts to disable security features detected');
      }

      // Check for lateral movement attempts
      const lateralMovementResult = await query(
        `SELECT COUNT(*) as attempt_count FROM zero_trust_anomalies
         WHERE device_id = $1 AND anomaly_type = 'lateral_movement_attempt'
         AND detected_at > NOW() - INTERVAL '1 hour'`,
        [deviceId]
      );

      if (parseInt(lateralMovementResult.rows[0].attempt_count) > 0) {
        violations.push('Lateral movement attempt detected');
      }

      return {
        isViolation: violations.length > 0,
        violations,
      };
    } catch (error) {
      console.error(`Error monitoring isolation status for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Generate isolation restrictions based on isolation level
   */
  private generateIsolationRestrictions(
    isolationLevel: 'strict' | 'moderate' | 'minimal'
  ): IsolationRestriction[] {
    const baseRestrictions: IsolationRestriction[] = [
      {
        type: 'network_isolation',
        description: 'Isolated from internal network, VPN blocked',
        enabled: true,
      },
      {
        type: 'credential_revocation',
        description: 'All active credentials revoked',
        enabled: true,
      },
      {
        type: 'session_termination',
        description: 'All active sessions terminated',
        enabled: true,
      },
    ];

    const moderateRestrictions: IsolationRestriction[] = [
      ...baseRestrictions,
      {
        type: 'sensitive_resource_access',
        description: 'Cannot access sensitive data or services',
        enabled: isolationLevel !== 'minimal',
      },
      {
        type: 'export_restriction',
        description: 'Data export blocked',
        enabled: isolationLevel !== 'minimal',
      },
    ];

    const strictRestrictions: IsolationRestriction[] = [
      ...moderateRestrictions,
      {
        type: 'all_access_blocked',
        description: 'All access blocked except for remediation tools',
        enabled: isolationLevel === 'strict',
      },
      {
        type: 'read_only_mode',
        description: 'Only read-only access to non-sensitive data allowed',
        enabled: isolationLevel === 'strict',
      },
      {
        type: 'monitoring_enabled',
        description: 'All activity monitored and logged',
        enabled: isolationLevel === 'strict',
      },
    ];

    switch (isolationLevel) {
      case 'strict':
        return strictRestrictions;
      case 'moderate':
        return moderateRestrictions;
      case 'minimal':
        return baseRestrictions;
    }
  }

  /**
   * Kill all active sessions for a device
   */
  private async killActiveSessions(deviceId: string): Promise<void> {
    try {
      const result = await query(
        `SELECT id FROM zero_trust_sessions
         WHERE device_id = $1 AND is_active = TRUE`,
        [deviceId]
      );

      for (const session of result.rows) {
        await query(
          `UPDATE zero_trust_sessions
           SET is_active = FALSE, expires_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [session.id]
        );
      }
    } catch (error) {
      console.error(`Error killing sessions for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Revoke all credentials for a device
   */
  private async revokeDeviceCredentials(deviceId: string): Promise<void> {
    try {
      // Get all sessions for this device to find user
      const sessionResult = await query(
        `SELECT DISTINCT user_id FROM zero_trust_sessions
         WHERE device_id = $1`,
        [deviceId]
      );

      if (sessionResult.rows.length === 0) {
        return;
      }

      // Revoke all active credentials for the user
      const userId = sessionResult.rows[0].user_id;
      await query(
        `UPDATE zero_trust_credentials
         SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );
    } catch (error) {
      console.error(`Error revoking credentials for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Store isolation policy in database
   */
  private async storeIsolationPolicy(
    deviceId: string,
    isolationLevel: string,
    restrictions: IsolationRestriction[],
    reason: string
  ): Promise<void> {
    try {
      // Store as metadata in a special field or new table
      // For now, we track it through the device status
      await query(
        `UPDATE zero_trust_devices
         SET quarantine_reason = $1, updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $2`,
        [reason, deviceId]
      );
    } catch (error) {
      console.error(`Error storing isolation policy for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Clear isolation policy when device is unquarantined
   */
  private async clearIsolationPolicy(deviceId: string): Promise<void> {
    try {
      await query(
        `UPDATE zero_trust_devices
         SET quarantine_reason = NULL, quarantined_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $1`,
        [deviceId]
      );
    } catch (error) {
      console.error(`Error clearing isolation policy for device ${deviceId}:`, error);
      throw error;
    }
  }
}

export const deviceIsolation = new DeviceIsolation();
