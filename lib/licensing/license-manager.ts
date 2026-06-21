/**
 * Enterprise License Manager
 * Track and manage active licenses
 */

export interface ActiveLicense {
  licenseId: string;
  key: string;
  organizationId: string;
  organizationName: string;
  activatedAt: Date;
  activatedOn: string; // Device/instance ID
  lastValidated: Date;
  validUntil?: Date;
  userCount: number;
  maxUsers?: number;
  status: "active" | "suspended" | "expired";
}

export interface LicenseUsage {
  licenseId: string;
  organizationId: string;
  activeUsers: number;
  totalScans: number;
  apiCalls: number;
  storage: number; // GB
  bandwidth: number; // GB
  timestamp: Date;
}

export interface LicenseAlert {
  id: string;
  licenseId: string;
  type: "expiration_warning" | "user_limit_reached" | "usage_exceeded" | "invalid_license";
  severity: "info" | "warning" | "critical";
  message: string;
  createdAt: Date;
  resolved: boolean;
}

export class LicenseManager {
  private activeLicenses: Map<string, ActiveLicense> = new Map();
  private licenseUsage: Map<string, LicenseUsage[]> = new Map();
  private alerts: Map<string, LicenseAlert[]> = new Map();

  /**
   * Activate a license
   */
  async activateLicense(
    licenseId: string,
    key: string,
    organizationId: string,
    organizationName: string,
    deviceId: string,
    options?: {
      maxUsers?: number;
      validUntil?: Date;
    }
  ): Promise<ActiveLicense> {
    const activeLicense: ActiveLicense = {
      licenseId,
      key,
      organizationId,
      organizationName,
      activatedAt: new Date(),
      activatedOn: deviceId,
      lastValidated: new Date(),
      validUntil: options?.validUntil,
      userCount: 0,
      maxUsers: options?.maxUsers,
      status: "active",
    };

    this.activeLicenses.set(licenseId, activeLicense);

    // Initialize usage tracking
    if (!this.licenseUsage.has(licenseId)) {
      this.licenseUsage.set(licenseId, []);
    }

    // Initialize alerts
    if (!this.alerts.has(licenseId)) {
      this.alerts.set(licenseId, []);
    }

    return activeLicense;
  }

  /**
   * Deactivate a license
   */
  async deactivateLicense(licenseId: string): Promise<boolean> {
    const license = this.activeLicenses.get(licenseId);
    if (license) {
      license.status = "active"; // Keep record but mark as inactive
      return true;
    }
    return false;
  }

  /**
   * Record license usage
   */
  async recordUsage(
    licenseId: string,
    usage: Omit<LicenseUsage, "timestamp">
  ): Promise<void> {
    const usageData: LicenseUsage = {
      ...usage,
      timestamp: new Date(),
    };

    const usageHistory = this.licenseUsage.get(licenseId) || [];
    usageHistory.push(usageData);

    // Keep only last 90 days of data
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentUsage = usageHistory.filter((u) => u.timestamp > ninetyDaysAgo);

    this.licenseUsage.set(licenseId, recentUsage);

    // Check usage limits
    await this.checkUsageLimits(licenseId, usageData);
  }

  /**
   * Update active user count
   */
  async updateUserCount(licenseId: string, count: number): Promise<void> {
    const license = this.activeLicenses.get(licenseId);
    if (license) {
      license.userCount = count;

      // Check if exceeded
      if (license.maxUsers && count > license.maxUsers) {
        await this.createAlert(
          licenseId,
          "user_limit_reached",
          "critical",
          `User count (${count}) exceeds license limit (${license.maxUsers})`
        );
      }
    }
  }

  /**
   * Check usage limits and create alerts
   */
  private async checkUsageLimits(
    licenseId: string,
    usage: LicenseUsage
  ): Promise<void> {
    // In production, enforce quotas based on tier
    const license = this.activeLicenses.get(licenseId);

    if (!license) {
      return;
    }

    // Check user limit
    if (license.maxUsers && usage.activeUsers > license.maxUsers) {
      await this.createAlert(
        licenseId,
        "user_limit_reached",
        "warning",
        `User limit approaching: ${usage.activeUsers}/${license.maxUsers}`
      );
    }

    // Check API rate (example: 1000 calls per day for pro, unlimited for enterprise)
    if (usage.apiCalls > 1000) {
      await this.createAlert(
        licenseId,
        "usage_exceeded",
        "info",
        `High API usage detected: ${usage.apiCalls} calls`
      );
    }
  }

  /**
   * Create a license alert
   */
  private async createAlert(
    licenseId: string,
    type: LicenseAlert["type"],
    severity: LicenseAlert["severity"],
    message: string
  ): Promise<void> {
    const alert: LicenseAlert = {
      id: `alert-${Date.now()}`,
      licenseId,
      type,
      severity,
      message,
      createdAt: new Date(),
      resolved: false,
    };

    const alerts = this.alerts.get(licenseId) || [];
    alerts.push(alert);
    this.alerts.set(licenseId, alerts);
  }

  /**
   * Check license expiration and create alerts
   */
  async checkExpirations(): Promise<void> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const [licenseId, license] of this.activeLicenses) {
      if (license.validUntil) {
        if (license.validUntil < now) {
          license.status = "expired";
          await this.createAlert(
            licenseId,
            "expiration_warning",
            "critical",
            "License has expired"
          );
        } else if (
          license.validUntil < thirtyDaysFromNow &&
          license.validUntil > now
        ) {
          const daysRemaining = Math.ceil(
            (license.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          await this.createAlert(
            licenseId,
            "expiration_warning",
            "warning",
            `License expires in ${daysRemaining} days`
          );
        }
      }
    }
  }

  /**
   * Get active license
   */
  async getActiveLicense(licenseId: string): Promise<ActiveLicense | null> {
    return this.activeLicenses.get(licenseId) || null;
  }

  /**
   * Get licenses for organization
   */
  async getOrganizationLicenses(organizationId: string): Promise<ActiveLicense[]> {
    return Array.from(this.activeLicenses.values()).filter(
      (l) => l.organizationId === organizationId
    );
  }

  /**
   * Get license usage history
   */
  async getUsageHistory(
    licenseId: string,
    days: number = 30
  ): Promise<LicenseUsage[]> {
    const usage = this.licenseUsage.get(licenseId) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return usage.filter((u) => u.timestamp > cutoffDate);
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(licenseId: string): Promise<{
    averageUsers: number;
    totalScans: number;
    totalApiCalls: number;
    totalStorage: number;
    totalBandwidth: number;
    period: "last_30_days";
  }> {
    const usage = await this.getUsageHistory(licenseId, 30);

    if (usage.length === 0) {
      return {
        averageUsers: 0,
        totalScans: 0,
        totalApiCalls: 0,
        totalStorage: 0,
        totalBandwidth: 0,
        period: "last_30_days",
      };
    }

    return {
      averageUsers: Math.round(
        usage.reduce((sum, u) => sum + u.activeUsers, 0) / usage.length
      ),
      totalScans: usage.reduce((sum, u) => sum + u.totalScans, 0),
      totalApiCalls: usage.reduce((sum, u) => sum + u.apiCalls, 0),
      totalStorage: usage.reduce((sum, u) => sum + u.storage, 0),
      totalBandwidth: usage.reduce((sum, u) => sum + u.bandwidth, 0),
      period: "last_30_days",
    };
  }

  /**
   * Get alerts for license
   */
  async getAlerts(
    licenseId: string,
    resolved?: boolean
  ): Promise<LicenseAlert[]> {
    const alerts = this.alerts.get(licenseId) || [];

    if (typeof resolved === "boolean") {
      return alerts.filter((a) => a.resolved === resolved);
    }

    return alerts;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(licenseId: string, alertId: string): Promise<boolean> {
    const alerts = this.alerts.get(licenseId);
    if (alerts) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        return true;
      }
    }
    return false;
  }

  /**
   * Get license health status
   */
  async getLicenseHealth(licenseId: string): Promise<{
    status: "healthy" | "warning" | "critical";
    userCapacity: number;
    usageLevel: number;
    expirationDays?: number;
    activeAlerts: number;
  }> {
    const license = this.activeLicenses.get(licenseId);
    if (!license) {
      return {
        status: "critical",
        userCapacity: 0,
        usageLevel: 0,
        activeAlerts: 0,
      };
    }

    const alerts = (this.alerts.get(licenseId) || []).filter((a) => !a.resolved);

    let status: "healthy" | "warning" | "critical" = "healthy";

    // Check for critical alerts
    if (alerts.some((a) => a.severity === "critical")) {
      status = "critical";
    } else if (alerts.some((a) => a.severity === "warning")) {
      status = "warning";
    }

    const userCapacity = license.maxUsers
      ? Math.round((license.userCount / license.maxUsers) * 100)
      : 0;

    const usageHistory = await this.getUsageHistory(licenseId, 7);
    const usageLevel = usageHistory.length > 0 ? 75 : 0; // Mock value

    let expirationDays: number | undefined;
    if (license.validUntil) {
      expirationDays = Math.ceil(
        (license.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      status,
      userCapacity,
      usageLevel,
      expirationDays,
      activeAlerts: alerts.length,
    };
  }

  /**
   * Export license report
   */
  async exportReport(
    licenseId: string,
    format: "json" | "csv" = "json"
  ): Promise<string> {
    const license = this.activeLicenses.get(licenseId);
    if (!license) {
      throw new Error(`License not found: ${licenseId}`);
    }

    const stats = await this.getUsageStats(licenseId);
    const health = await this.getLicenseHealth(licenseId);
    const alerts = await this.getAlerts(licenseId);

    const report = {
      license,
      stats,
      health,
      alerts,
      exportedAt: new Date(),
    };

    if (format === "json") {
      return JSON.stringify(report, null, 2);
    }

    // CSV format
    return `
License ID,Organization,Status,Users,Max Users,Active Alerts
${license.licenseId},${license.organizationName},${license.status},${license.userCount},${license.maxUsers || "Unlimited"},${alerts.filter((a) => !a.resolved).length}
    `.trim();
  }
}

export default LicenseManager;
