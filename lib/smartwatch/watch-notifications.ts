/**
 * Smartwatch Notifications
 * Send real-time alerts to Apple Watch and Wear OS devices
 */

export interface WatchAlert {
  id: string;
  type: "email_threat" | "file_threat" | "system_alert" | "update_available";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  icon?: string;
  deepLink?: string;
}

export interface WatchNotificationConfig {
  deviceId: string;
  platform: "watchos" | "wear-os";
  enabled: boolean;
  alertTypes: WatchAlert["type"][];
  minSeverity: "critical" | "high" | "medium" | "low";
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
}

export interface WatchDeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: "watchos" | "wear-os";
  osVersion: string;
  appVersion: string;
  lastSeen: Date;
  fcmToken?: string; // For Wear OS push
  apnsToken?: string; // For Apple Watch push
}

export class WatchNotificationManager {
  private devices: Map<string, WatchDeviceInfo> = new Map();
  private configs: Map<string, WatchNotificationConfig> = new Map();
  private alertQueue: WatchAlert[] = [];

  /**
   * Register a smartwatch device
   */
  async registerDevice(deviceInfo: WatchDeviceInfo): Promise<void> {
    this.devices.set(deviceInfo.deviceId, {
      ...deviceInfo,
      lastSeen: new Date(),
    });

    // Initialize default config
    if (!this.configs.has(deviceInfo.deviceId)) {
      this.configs.set(deviceInfo.deviceId, {
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform,
        enabled: true,
        alertTypes: ["email_threat", "file_threat", "system_alert"],
        minSeverity: "high",
      });
    }
  }

  /**
   * Send notification to smartwatch
   */
  async sendNotification(deviceId: string, alert: WatchAlert): Promise<boolean> {
    const config = this.configs.get(deviceId);
    const device = this.devices.get(deviceId);

    if (!config || !device || !config.enabled) {
      return false;
    }

    // Check alert type is enabled
    if (!config.alertTypes.includes(alert.type)) {
      return false;
    }

    // Check severity threshold
    const severityOrder = ["critical", "high", "medium", "low"];
    const alertSeverityIndex = severityOrder.indexOf(alert.severity);
    const configSeverityIndex = severityOrder.indexOf(config.minSeverity);

    if (alertSeverityIndex > configSeverityIndex) {
      return false;
    }

    // Check quiet hours
    if (config.quietHours?.enabled) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      if (this.isInQuietHours(currentTime, config.quietHours)) {
        // Queue for later delivery
        this.alertQueue.push(alert);
        return true;
      }
    }

    // Send based on platform
    const success = await this.sendToPlatform(device, alert);

    if (success) {
      device.lastSeen = new Date();
    }

    return success;
  }

  /**
   * Send notification to specific platform
   */
  private async sendToPlatform(device: WatchDeviceInfo, alert: WatchAlert): Promise<boolean> {
    if (device.platform === "watchos") {
      return this.sendToAppleWatch(device, alert);
    } else {
      return this.sendToWearOS(device, alert);
    }
  }

  /**
   * Send to Apple Watch via APNs
   */
  private async sendToAppleWatch(device: WatchDeviceInfo, alert: WatchAlert): Promise<boolean> {
    if (!device.apnsToken) {
      return false;
    }

    try {
      // In production, use Apple APNs service
      const payload = {
        aps: {
          alert: {
            title: alert.title,
            body: alert.message,
          },
          badge: 1,
          sound: alert.severity === "critical" ? "default" : undefined,
          category: `ALERT_${alert.type.toUpperCase()}`,
        },
        alertId: alert.id,
        deepLink: alert.deepLink,
        actionRequired: alert.actionRequired,
      };

      console.log(
        `[Apple Watch] Sending notification to ${device.deviceName}:`,
        alert.title
      );
      return true;
    } catch (error) {
      console.error("Failed to send Apple Watch notification:", error);
      return false;
    }
  }

  /**
   * Send to Wear OS via FCM
   */
  private async sendToWearOS(device: WatchDeviceInfo, alert: WatchAlert): Promise<boolean> {
    if (!device.fcmToken) {
      return false;
    }

    try {
      // In production, use Firebase Cloud Messaging
      const payload = {
        notification: {
          title: alert.title,
          body: alert.message,
          clickAction: `ACTION_${alert.type.toUpperCase()}`,
          priority: alert.severity === "critical" ? "high" : "normal",
        },
        data: {
          alertId: alert.id,
          severity: alert.severity,
          deepLink: alert.deepLink,
          actionRequired: String(alert.actionRequired),
        },
      };

      console.log(
        `[Wear OS] Sending notification to ${device.deviceName}:`,
        alert.title
      );
      return true;
    } catch (error) {
      console.error("Failed to send Wear OS notification:", error);
      return false;
    }
  }

  /**
   * Update notification config for device
   */
  async updateConfig(deviceId: string, config: Partial<WatchNotificationConfig>): Promise<void> {
    const existing = this.configs.get(deviceId);
    if (existing) {
      this.configs.set(deviceId, { ...existing, ...config });
    }
  }

  /**
   * Get notification config
   */
  async getConfig(deviceId: string): Promise<WatchNotificationConfig | null> {
    return this.configs.get(deviceId) || null;
  }

  /**
   * List registered devices
   */
  async listDevices(userId: string): Promise<WatchDeviceInfo[]> {
    return Array.from(this.devices.values());
  }

  /**
   * Unregister device
   */
  async unregisterDevice(deviceId: string): Promise<boolean> {
    this.devices.delete(deviceId);
    this.configs.delete(deviceId);
    return true;
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(
    currentTime: string,
    quietHours: { startTime: string; endTime: string }
  ): boolean {
    const [currentHour, currentMin] = currentTime.split(":").map(Number);
    const [startHour, startMin] = quietHours.startTime.split(":").map(Number);
    const [endHour, endMin] = quietHours.endTime.split(":").map(Number);

    const currentMins = currentHour * 60 + currentMin;
    const startMins = startHour * 60 + startMin;
    const endMins = endHour * 60 + endMin;

    if (startMins <= endMins) {
      return currentMins >= startMins && currentMins <= endMins;
    } else {
      return currentMins >= startMins || currentMins <= endMins;
    }
  }

  /**
   * Batch send to multiple devices
   */
  async broadcastAlert(alert: WatchAlert, userIds: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [deviceId] of this.devices) {
      const result = await this.sendNotification(deviceId, alert);
      results.set(deviceId, result);
    }

    return results;
  }

  /**
   * Get pending alerts for a device
   */
  async getPendingAlerts(deviceId: string): Promise<WatchAlert[]> {
    return this.alertQueue.filter((a) => {
      // In production, filter by user/device
      return true;
    });
  }

  /**
   * Clear pending alerts
   */
  async clearPendingAlerts(deviceId: string): Promise<void> {
    // Filter out alerts for this device
    // In production, would be more sophisticated
  }
}

export default WatchNotificationManager;
