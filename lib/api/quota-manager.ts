/**
 * API Quota Manager
 * Track and manage API quota usage per user and tier
 */

export interface QuotaLimit {
  tier: "free" | "pro" | "enterprise";
  apiCallsPerMonth: number;
  storageGB: number;
  bandwidthGB: number;
  customDashboards: number;
  webhooks: number;
  apiKeys: number;
  concurrentSessions: number;
}

export interface UserQuota {
  userId: string;
  tier: "free" | "pro" | "enterprise";
  billingCycleStart: Date;
  billingCycleEnd: Date;
  apiCallsUsed: number;
  storageUsed: number; // GB
  bandwidthUsed: number; // GB
  customDashboardsUsed: number;
  webhooksActive: number;
  apiKeysActive: number;
  concurrentSessionsActive: number;
}

export interface QuotaAlert {
  id: string;
  userId: string;
  type: "approaching_limit" | "limit_exceeded" | "quota_reset";
  resource: "api_calls" | "storage" | "bandwidth" | "dashboards" | "webhooks";
  percentageUsed: number;
  createdAt: Date;
  resolved: boolean;
}

export class QuotaManager {
  private quotaLimits: Map<string, QuotaLimit> = new Map([
    [
      "free",
      {
        tier: "free",
        apiCallsPerMonth: 1000,
        storageGB: 1,
        bandwidthGB: 1,
        customDashboards: 0,
        webhooks: 1,
        apiKeys: 1,
        concurrentSessions: 1,
      },
    ],
    [
      "pro",
      {
        tier: "pro",
        apiCallsPerMonth: 100000,
        storageGB: 100,
        bandwidthGB: 100,
        customDashboards: 5,
        webhooks: 10,
        apiKeys: 10,
        concurrentSessions: 5,
      },
    ],
    [
      "enterprise",
      {
        tier: "enterprise",
        apiCallsPerMonth: 1000000,
        storageGB: 1000,
        bandwidthGB: 1000,
        customDashboards: 100,
        webhooks: 100,
        apiKeys: 100,
        concurrentSessions: 50,
      },
    ],
  ]);

  private userQuotas: Map<string, UserQuota> = new Map();
  private alerts: Map<string, QuotaAlert[]> = new Map();

  /**
   * Initialize quota for user
   */
  async initializeQuota(userId: string, tier: "free" | "pro" | "enterprise"): Promise<UserQuota> {
    const now = new Date();
    const billingCycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const billingCycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const quota: UserQuota = {
      userId,
      tier,
      billingCycleStart,
      billingCycleEnd,
      apiCallsUsed: 0,
      storageUsed: 0,
      bandwidthUsed: 0,
      customDashboardsUsed: 0,
      webhooksActive: 0,
      apiKeysActive: 0,
      concurrentSessionsActive: 0,
    };

    this.userQuotas.set(userId, quota);

    if (!this.alerts.has(userId)) {
      this.alerts.set(userId, []);
    }

    return quota;
  }

  /**
   * Check and add API call usage
   */
  async recordApiCall(userId: string): Promise<boolean> {
    let quota = this.userQuotas.get(userId);

    if (!quota) {
      // Auto-initialize as free tier
      quota = await this.initializeQuota(userId, "free");
    }

    // Check if billing cycle needs reset
    await this.checkBillingCycleReset(userId);

    quota = this.userQuotas.get(userId)!;
    const limit = this.quotaLimits.get(quota.tier)!;

    if (quota.apiCallsUsed >= limit.apiCallsPerMonth) {
      await this.createAlert(
        userId,
        "limit_exceeded",
        "api_calls",
        100
      );
      return false; // Quota exceeded
    }

    // Check if approaching 80% limit
    if (
      (quota.apiCallsUsed + 1) / limit.apiCallsPerMonth >= 0.8 &&
      quota.apiCallsUsed / limit.apiCallsPerMonth < 0.8
    ) {
      await this.createAlert(
        userId,
        "approaching_limit",
        "api_calls",
        80
      );
    }

    quota.apiCallsUsed++;
    return true;
  }

  /**
   * Record storage usage
   */
  async recordStorage(userId: string, sizeGB: number): Promise<boolean> {
    let quota = this.userQuotas.get(userId);
    if (!quota) {
      quota = await this.initializeQuota(userId, "free");
    }

    const limit = this.quotaLimits.get(quota.tier)!;
    const newUsage = quota.storageUsed + sizeGB;

    if (newUsage > limit.storageGB) {
      await this.createAlert(
        userId,
        "limit_exceeded",
        "storage",
        100
      );
      return false;
    }

    if (newUsage / limit.storageGB >= 0.8) {
      await this.createAlert(
        userId,
        "approaching_limit",
        "storage",
        Math.round((newUsage / limit.storageGB) * 100)
      );
    }

    quota.storageUsed = newUsage;
    return true;
  }

  /**
   * Record bandwidth usage
   */
  async recordBandwidth(userId: string, sizeGB: number): Promise<boolean> {
    let quota = this.userQuotas.get(userId);
    if (!quota) {
      quota = await this.initializeQuota(userId, "free");
    }

    const limit = this.quotaLimits.get(quota.tier)!;
    const newUsage = quota.bandwidthUsed + sizeGB;

    if (newUsage > limit.bandwidthGB) {
      await this.createAlert(
        userId,
        "limit_exceeded",
        "bandwidth",
        100
      );
      return false;
    }

    if (newUsage / limit.bandwidthGB >= 0.8) {
      await this.createAlert(
        userId,
        "approaching_limit",
        "bandwidth",
        Math.round((newUsage / limit.bandwidthGB) * 100)
      );
    }

    quota.bandwidthUsed = newUsage;
    return true;
  }

  /**
   * Check quota for resource
   */
  async canAddResource(
    userId: string,
    resource:
      | "dashboard"
      | "webhook"
      | "apiKey"
      | "concurrentSession"
  ): Promise<boolean> {
    let quota = this.userQuotas.get(userId);
    if (!quota) {
      quota = await this.initializeQuota(userId, "free");
    }

    const limit = this.quotaLimits.get(quota.tier)!;

    switch (resource) {
      case "dashboard":
        return quota.customDashboardsUsed < limit.customDashboards;
      case "webhook":
        return quota.webhooksActive < limit.webhooks;
      case "apiKey":
        return quota.apiKeysActive < limit.apiKeys;
      case "concurrentSession":
        return quota.concurrentSessionsActive < limit.concurrentSessions;
      default:
        return false;
    }
  }

  /**
   * Add resource
   */
  async addResource(
    userId: string,
    resource: "dashboard" | "webhook" | "apiKey" | "concurrentSession"
  ): Promise<boolean> {
    if (!(await this.canAddResource(userId, resource))) {
      return false;
    }

    const quota = this.userQuotas.get(userId);
    if (!quota) {
      return false;
    }

    const resourceMap: Record<string, keyof UserQuota> = {
      dashboard: "customDashboardsUsed",
      webhook: "webhooksActive",
      apiKey: "apiKeysActive",
      concurrentSession: "concurrentSessionsActive",
    };

    const key = resourceMap[resource] as keyof UserQuota;
    (quota[key] as number)++;

    return true;
  }

  /**
   * Remove resource
   */
  async removeResource(
    userId: string,
    resource: "dashboard" | "webhook" | "apiKey" | "concurrentSession"
  ): Promise<void> {
    const quota = this.userQuotas.get(userId);
    if (!quota) {
      return;
    }

    const resourceMap: Record<string, keyof UserQuota> = {
      dashboard: "customDashboardsUsed",
      webhook: "webhooksActive",
      apiKey: "apiKeysActive",
      concurrentSession: "concurrentSessionsActive",
    };

    const key = resourceMap[resource] as keyof UserQuota;
    const current = (quota[key] as number) - 1;
    (quota[key] as number) = Math.max(0, current);
  }

  /**
   * Get quota usage
   */
  async getQuotaUsage(userId: string): Promise<{
    tier: string;
    apiCalls: { used: number; limit: number; percentage: number };
    storage: { used: number; limit: number; percentage: number };
    bandwidth: { used: number; limit: number; percentage: number };
    resources: {
      dashboards: { used: number; limit: number };
      webhooks: { used: number; limit: number };
      apiKeys: { used: number; limit: number };
      sessions: { used: number; limit: number };
    };
    billingCycleEnd: Date;
  }> {
    let quota = this.userQuotas.get(userId);
    if (!quota) {
      quota = await this.initializeQuota(userId, "free");
    }

    const limit = this.quotaLimits.get(quota.tier)!;

    return {
      tier: quota.tier,
      apiCalls: {
        used: quota.apiCallsUsed,
        limit: limit.apiCallsPerMonth,
        percentage: Math.round((quota.apiCallsUsed / limit.apiCallsPerMonth) * 100),
      },
      storage: {
        used: quota.storageUsed,
        limit: limit.storageGB,
        percentage: Math.round((quota.storageUsed / limit.storageGB) * 100),
      },
      bandwidth: {
        used: quota.bandwidthUsed,
        limit: limit.bandwidthGB,
        percentage: Math.round((quota.bandwidthUsed / limit.bandwidthGB) * 100),
      },
      resources: {
        dashboards: {
          used: quota.customDashboardsUsed,
          limit: limit.customDashboards,
        },
        webhooks: {
          used: quota.webhooksActive,
          limit: limit.webhooks,
        },
        apiKeys: {
          used: quota.apiKeysActive,
          limit: limit.apiKeys,
        },
        sessions: {
          used: quota.concurrentSessionsActive,
          limit: limit.concurrentSessions,
        },
      },
      billingCycleEnd: quota.billingCycleEnd,
    };
  }

  /**
   * Check and reset billing cycle if needed
   */
  private async checkBillingCycleReset(userId: string): Promise<void> {
    const quota = this.userQuotas.get(userId);
    if (!quota) {
      return;
    }

    const now = new Date();
    if (now >= quota.billingCycleEnd) {
      // Reset billing cycle
      const billingCycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const billingCycleEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );

      quota.billingCycleStart = billingCycleStart;
      quota.billingCycleEnd = billingCycleEnd;
      quota.apiCallsUsed = 0;

      await this.createAlert(userId, "quota_reset", "api_calls", 0);
    }
  }

  /**
   * Create quota alert
   */
  private async createAlert(
    userId: string,
    type: QuotaAlert["type"],
    resource: QuotaAlert["resource"],
    percentageUsed: number
  ): Promise<void> {
    const alert: QuotaAlert = {
      id: `alert-${Date.now()}`,
      userId,
      type,
      resource,
      percentageUsed,
      createdAt: new Date(),
      resolved: false,
    };

    const userAlerts = this.alerts.get(userId) || [];
    userAlerts.push(alert);
    this.alerts.set(userId, userAlerts);
  }

  /**
   * Get quotas alerts
   */
  async getAlerts(userId: string, unresolved: boolean = true): Promise<QuotaAlert[]> {
    const alerts = this.alerts.get(userId) || [];
    if (unresolved) {
      return alerts.filter((a) => !a.resolved);
    }
    return alerts;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(userId: string, alertId: string): Promise<boolean> {
    const alerts = this.alerts.get(userId);
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
   * Upgrade tier
   */
  async upgradeTier(
    userId: string,
    newTier: "free" | "pro" | "enterprise"
  ): Promise<UserQuota> {
    let quota = this.userQuotas.get(userId);
    if (!quota) {
      quota = await this.initializeQuota(userId, newTier);
      return quota;
    }

    quota.tier = newTier;
    return quota;
  }

  /**
   * Export quota report
   */
  async exportReport(userId: string, format: "json" | "csv" = "json"): Promise<string> {
    const usage = await this.getQuotaUsage(userId);
    const alerts = await this.getAlerts(userId, false);

    const report = {
      user: userId,
      usage,
      alerts: alerts.slice(-10), // Last 10 alerts
      exportedAt: new Date(),
    };

    if (format === "json") {
      return JSON.stringify(report, null, 2);
    }

    // CSV format
    return `
Quota Usage Report - ${userId}
Generated: ${new Date().toISOString()}

API Calls: ${usage.apiCalls.used}/${usage.apiCalls.limit} (${usage.apiCalls.percentage}%)
Storage: ${usage.storage.used}/${usage.storage.limit} GB (${usage.storage.percentage}%)
Bandwidth: ${usage.bandwidth.used}/${usage.bandwidth.limit} GB (${usage.bandwidth.percentage}%)
    `.trim();
  }
}

export default QuotaManager;
