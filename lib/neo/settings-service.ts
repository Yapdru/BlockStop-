import { getDb } from '@/lib/db';
import { getTierByLevel } from './tier-definitions';

const ADMIN_PASSCODE = 'D7972@';

export interface UserSettings {
  userId: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  threatAlertLevel: 'all' | 'high' | 'critical';
  autoScanEnabled: boolean;
  autoScanInterval: 'hourly' | 'daily' | 'weekly';
  theme: 'light' | 'dark';
  language: 'en' | 'es' | 'fr' | 'hi';
}

export class SettingsService {
  async getUserSettings(userId: string): Promise<UserSettings> {
    const db = getDb();

    const result = await db.query(
      `SELECT * FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return this.getDefaultSettings(userId);
    }

    const row = result.rows[0];
    return {
      userId: row.user_id,
      notificationsEnabled: row.notifications_enabled,
      emailNotifications: row.email_notifications,
      threatAlertLevel: row.threat_alert_level,
      autoScanEnabled: row.auto_scan_enabled,
      autoScanInterval: row.auto_scan_interval,
      theme: row.theme,
      language: row.language
    };
  }

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const db = getDb();

    await db.query(
      `INSERT INTO user_settings (
        user_id, notifications_enabled, email_notifications, threat_alert_level,
        auto_scan_enabled, auto_scan_interval, theme, language, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        notifications_enabled = COALESCE($2, notifications_enabled),
        email_notifications = COALESCE($3, email_notifications),
        threat_alert_level = COALESCE($4, threat_alert_level),
        auto_scan_enabled = COALESCE($5, auto_scan_enabled),
        auto_scan_interval = COALESCE($6, auto_scan_interval),
        theme = COALESCE($7, theme),
        language = COALESCE($8, language),
        updated_at = NOW()`,
      [
        userId,
        updates.notificationsEnabled !== undefined ? updates.notificationsEnabled : null,
        updates.emailNotifications !== undefined ? updates.emailNotifications : null,
        updates.threatAlertLevel || null,
        updates.autoScanEnabled !== undefined ? updates.autoScanEnabled : null,
        updates.autoScanInterval || null,
        updates.theme || null,
        updates.language || null
      ]
    );

    return this.getUserSettings(userId);
  }

  async verifyAdminPasscode(passcode: string): Promise<boolean> {
    return passcode === ADMIN_PASSCODE;
  }

  async upgradeUserToPro(userId: string): Promise<boolean> {
    const db = getDb();

    // Get PRO plan
    const planResult = await db.query(
      `SELECT id FROM plans WHERE name = 'pro'`
    );

    if (planResult.rows.length === 0) {
      throw new Error('PRO plan not found');
    }

    const proPlanId = planResult.rows[0].id;

    // Update user tier to PRO
    await db.query(
      `UPDATE users_neo SET plan_id = $1, updated_at = NOW() WHERE id = $2`,
      [proPlanId, userId]
    );

    // Create/update subscription
    const subscriptionId = `sub_${Date.now()}`;
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1); // 1 year free

    await db.query(
      `INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_end, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         plan_id = $3,
         status = 'active',
         current_period_end = $5,
         updated_at = NOW()`,
      [subscriptionId, userId, proPlanId, 'active', currentPeriodEnd]
    );

    return true;
  }

  async logAdminAccess(userId: string): Promise<void> {
    const db = getDb();

    await db.query(
      `INSERT INTO admin_access_logs (id, user_id, accessed_at)
       VALUES ($1, $2, NOW())`,
      [`log_${Date.now()}`, userId]
    );
  }

  private getDefaultSettings(userId: string): UserSettings {
    return {
      userId,
      notificationsEnabled: true,
      emailNotifications: false,
      threatAlertLevel: 'high',
      autoScanEnabled: true,
      autoScanInterval: 'daily',
      theme: 'dark',
      language: 'en'
    };
  }
}

export const createSettingsService = (): SettingsService => {
  return new SettingsService();
};
