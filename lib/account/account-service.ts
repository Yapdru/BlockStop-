import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { User } from '@/types/auth';
import { AccountProfile, PasswordChangeRequest, EmailChangeRequest, PrivacySettings } from '@/types/settings';

export class AccountService {
  /**
   * Get user's account profile
   */
  async getAccountProfile(userId: number): Promise<AccountProfile> {
    const result = await query(
      `SELECT id, email, name, created_at as "createdAt", last_login as "lastLogin"
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      createdAt: result.rows[0].createdAt,
      lastLogin: result.rows[0].lastLogin,
    };
  }

  /**
   * Update user's password
   */
  async updatePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Get current password hash
    const userResult = await query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, userId]
    );

    return true;
  }

  /**
   * Update user's email address
   */
  async updateEmail(userId: number, newEmail: string): Promise<boolean> {
    // Validate email format
    if (!this.isValidEmail(newEmail)) {
      throw new Error('Invalid email format');
    }

    // Check if email is already in use
    const existingUser = await query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [newEmail, userId]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already in use');
    }

    // Update email
    await query(
      `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`,
      [newEmail, userId]
    );

    return true;
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings(userId: number): Promise<PrivacySettings> {
    const result = await query(
      `SELECT
        COALESCE(privacy_data_retention_days, 90) as "dataRetentionDays",
        COALESCE(privacy_analytics_enabled, true) as "analyticsEnabled",
        COALESCE(privacy_email_notifications_enabled, true) as "emailNotificationsEnabled"
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return {
      dataRetentionDays: result.rows[0].dataRetentionDays,
      analyticsEnabled: result.rows[0].analyticsEnabled,
      emailNotificationsEnabled: result.rows[0].emailNotificationsEnabled,
    };
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: number,
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    // Validate data retention days
    if (settings.dataRetentionDays !== undefined) {
      if (settings.dataRetentionDays < 1 || settings.dataRetentionDays > 365) {
        throw new Error('Data retention days must be between 1 and 365');
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [userId];
    let paramIndex = 2;

    if (settings.dataRetentionDays !== undefined) {
      updates.push(`privacy_data_retention_days = $${paramIndex}`);
      values.push(settings.dataRetentionDays);
      paramIndex++;
    }

    if (settings.analyticsEnabled !== undefined) {
      updates.push(`privacy_analytics_enabled = $${paramIndex}`);
      values.push(settings.analyticsEnabled);
      paramIndex++;
    }

    if (settings.emailNotificationsEnabled !== undefined) {
      updates.push(`privacy_email_notifications_enabled = $${paramIndex}`);
      values.push(settings.emailNotificationsEnabled);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.getPrivacySettings(userId);
    }

    updates.push(`updated_at = NOW()`);

    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $1`;
    await query(updateQuery, values);

    return this.getPrivacySettings(userId);
  }

  /**
   * Request account deletion (soft delete - mark for deletion)
   */
  async requestAccountDeletion(userId: number): Promise<boolean> {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30); // 30-day grace period

    await query(
      `UPDATE users SET
        deletion_requested_at = NOW(),
        scheduled_deletion_date = $1,
        updated_at = NOW()
       WHERE id = $2`,
      [deletionDate, userId]
    );

    return true;
  }

  /**
   * Cancel account deletion request
   */
  async cancelAccountDeletion(userId: number): Promise<boolean> {
    await query(
      `UPDATE users SET
        deletion_requested_at = NULL,
        scheduled_deletion_date = NULL,
        updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    return true;
  }

  /**
   * Check if account is scheduled for deletion
   */
  async isScheduledForDeletion(userId: number): Promise<boolean> {
    const result = await query(
      `SELECT scheduled_deletion_date FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].scheduled_deletion_date !== null;
  }

  /**
   * Get deletion schedule details
   */
  async getDeletionSchedule(userId: number): Promise<{ requestedAt: Date; scheduledAt: Date } | null> {
    const result = await query(
      `SELECT deletion_requested_at as "requestedAt", scheduled_deletion_date as "scheduledAt"
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].scheduledAt) {
      return null;
    }

    return {
      requestedAt: result.rows[0].requestedAt,
      scheduledAt: result.rows[0].scheduledAt,
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const accountService = new AccountService();
