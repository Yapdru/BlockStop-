import { query } from '@/lib/db';

export interface HealthIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

export interface DeviceHealth {
  deviceId: string;
  healthy: boolean;
  lastCheck: Date;
  issues: HealthIssue[];
  score: number;
}

export class DeviceHealthCheck {
  private readonly CRITICAL_THRESHOLD = 3;
  private readonly HIGH_THRESHOLD = 5;

  /**
   * Perform comprehensive health check on device
   */
  async performHealthCheck(deviceId: string): Promise<DeviceHealth> {
    try {
      const issues: HealthIssue[] = [];
      let score = 100;

      // Run all health checks
      const osVersionIssue = await this.checkOSVersion(deviceId);
      if (osVersionIssue) {
        issues.push(osVersionIssue);
        score -= this.getSeverityPoints(osVersionIssue.severity);
      }

      const updatesIssue = await this.checkInstalledUpdates(deviceId);
      if (updatesIssue) {
        issues.push(updatesIssue);
        score -= this.getSeverityPoints(updatesIssue.severity);
      }

      const securitySoftwareIssue = await this.checkSecuritySoftware(deviceId);
      if (securitySoftwareIssue) {
        issues.push(securitySoftwareIssue);
        score -= this.getSeverityPoints(securitySoftwareIssue.severity);
      }

      const diskSpaceIssue = await this.checkDiskSpace(deviceId);
      if (diskSpaceIssue) {
        issues.push(diskSpaceIssue);
        score -= this.getSeverityPoints(diskSpaceIssue.severity);
      }

      const memoryHealthIssue = await this.checkMemoryHealth(deviceId);
      if (memoryHealthIssue) {
        issues.push(memoryHealthIssue);
        score -= this.getSeverityPoints(memoryHealthIssue.severity);
      }

      // Ensure score is between 0 and 100
      score = Math.max(0, Math.min(100, score));

      // Determine if device is healthy
      const healthy = issues.filter((i) => i.severity === 'critical').length === 0;

      // Store health check results in database
      await this.storeHealthCheckResults(deviceId, issues, score);

      return {
        deviceId,
        healthy,
        lastCheck: new Date(),
        issues,
        score,
      };
    } catch (error) {
      console.error(`Error performing health check for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Check OS version for known vulnerabilities
   */
  async checkOSVersion(deviceId: string): Promise<HealthIssue | null> {
    try {
      const result = await query(
        `SELECT os_version FROM zero_trust_devices WHERE device_id = $1`,
        [deviceId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const osVersion = result.rows[0].os_version;

      // Check for known vulnerable OS versions
      if (this.isVulnerableOSVersion(osVersion)) {
        return {
          type: 'os_version',
          severity: 'high',
          description: `Operating System version ${osVersion} has known security vulnerabilities`,
          recommendation: 'Update to the latest stable OS version',
        };
      }

      return null;
    } catch (error) {
      console.error(`Error checking OS version for device ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Check for missing security updates
   */
  async checkInstalledUpdates(deviceId: string): Promise<HealthIssue | null> {
    try {
      // Check for pending critical security updates
      const result = await query(
        `SELECT COUNT(*) as pending_updates FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'pending_security_updates' AND resolved = FALSE`,
        [deviceId]
      );

      if (parseInt(result.rows[0].pending_updates) > 0) {
        return {
          type: 'pending_updates',
          severity: 'high',
          description: 'Device has pending critical security updates',
          recommendation: 'Install pending security updates immediately',
        };
      }

      return null;
    } catch (error) {
      console.error(`Error checking updates for device ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Check security software status
   */
  async checkSecuritySoftware(deviceId: string): Promise<HealthIssue | null> {
    try {
      // Check if antivirus is enabled
      const antivirusResult = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'antimalware_disabled' AND resolved = FALSE`,
        [deviceId]
      );

      if (parseInt(antivirusResult.rows[0].issue_count) > 0) {
        return {
          type: 'antimalware_disabled',
          severity: 'critical',
          description: 'Antimalware/Antivirus is disabled on the device',
          recommendation: 'Enable antimalware software immediately',
        };
      }

      // Check firewall status
      const firewallResult = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'firewall_disabled' AND resolved = FALSE`,
        [deviceId]
      );

      if (parseInt(firewallResult.rows[0].issue_count) > 0) {
        return {
          type: 'firewall_disabled',
          severity: 'high',
          description: 'Firewall is disabled on the device',
          recommendation: 'Enable firewall protection immediately',
        };
      }

      return null;
    } catch (error) {
      console.error(`Error checking security software for device ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Check disk space availability
   */
  async checkDiskSpace(deviceId: string): Promise<HealthIssue | null> {
    try {
      // Check for low disk space issues
      const result = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'low_disk_space' AND resolved = FALSE`,
        [deviceId]
      );

      if (parseInt(result.rows[0].issue_count) > 0) {
        return {
          type: 'low_disk_space',
          severity: 'medium',
          description: 'Device has critically low disk space available',
          recommendation: 'Free up disk space by deleting unnecessary files or upgrading storage',
        };
      }

      return null;
    } catch (error) {
      console.error(`Error checking disk space for device ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Check system memory health
   */
  async checkMemoryHealth(deviceId: string): Promise<HealthIssue | null> {
    try {
      // Check for memory issues
      const result = await query(
        `SELECT COUNT(*) as issue_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type = 'memory_error' AND resolved = FALSE`,
        [deviceId]
      );

      if (parseInt(result.rows[0].issue_count) > 0) {
        return {
          type: 'memory_error',
          severity: 'medium',
          description: 'Device has detected memory errors or corruption',
          recommendation: 'Run memory diagnostics and replace RAM if errors are confirmed',
        };
      }

      return null;
    } catch (error) {
      console.error(`Error checking memory health for device ${deviceId}:`, error);
      return null;
    }
  }

  /**
   * Store health check results in database
   */
  private async storeHealthCheckResults(
    deviceId: string,
    issues: HealthIssue[],
    score: number
  ): Promise<void> {
    try {
      // Update device health score
      await query(
        `UPDATE zero_trust_devices
         SET health_score = $1, last_health_check = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $2`,
        [score, deviceId]
      );

      // Store any critical issues in the health issues table
      for (const issue of issues) {
        await query(
          `INSERT INTO zero_trust_device_health_issues (device_id, issue_type, severity, description, recommendation, created_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
          [deviceId, issue.type, issue.severity, issue.description, issue.recommendation]
        );
      }
    } catch (error) {
      console.error(`Error storing health check results for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Check if OS version is known to be vulnerable
   */
  private isVulnerableOSVersion(osVersion: string): boolean {
    // This is a simplified check. In production, this should query a vulnerability database
    const vulnerableVersions = [
      /Windows 7/i,
      /Windows Vista/i,
      /Windows XP/i,
      /macOS 10\.[0-9]$/i,
      /Ubuntu 1[0-2]\.04/i,
    ];

    return vulnerableVersions.some((pattern) => pattern.test(osVersion));
  }

  /**
   * Get points to deduct from score based on severity
   */
  private getSeverityPoints(severity: 'critical' | 'high' | 'medium' | 'low'): number {
    switch (severity) {
      case 'critical':
        return 25;
      case 'high':
        return 15;
      case 'medium':
        return 10;
      case 'low':
        return 5;
      default:
        return 0;
    }
  }
}

export const deviceHealthCheck = new DeviceHealthCheck();
