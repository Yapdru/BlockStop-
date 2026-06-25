/**
 * BlockAdmin Phase 31.1 - Privacy Settings Manager
 * User privacy preference management with payment verification exception
 */

import {
  User,
  PrivacySettings,
  AdminException,
} from '@/types/admin';
import { UserManager } from './user-manager';

// In-memory store for privacy audit logs
const privacyAuditLogsStore: Map<string, PrivacyAuditLog> = new Map();

interface PrivacyAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: 'privacy_settings_updated' | 'privacy_settings_viewed';
  oldSettings: PrivacySettings;
  newSettings: PrivacySettings;
  changedFields: string[];
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * PrivacySettingsManager - Manages user privacy preferences
 */
export class PrivacySettingsManager {
  /**
   * Get privacy settings for user
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    // Log privacy settings access
    await this.logPrivacyAction(
      userId,
      user.email,
      'privacy_settings_viewed',
      user.privacySettings,
      user.privacySettings
    );

    return user.privacySettings;
  }

  /**
   * Update privacy settings
   * Note: Payment confirmation data cannot be hidden
   */
  static async updatePrivacySettings(
    userId: string,
    newSettings: Partial<PrivacySettings>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<PrivacySettings> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const oldSettings = user.privacySettings;

    // Validate settings (cannot hide payment confirmation data)
    if (newSettings.hideEmail && user.isPaymentVerified) {
      throw new AdminException(
        'CANNOT_HIDE_VERIFIED_EMAIL',
        400,
        {
          message: 'Cannot hide email for payment-verified users. Payment confirmation requires visible email.',
        }
      );
    }

    // Update user privacy settings
    const updatedUser = await UserManager.updatePrivacySettings(
      userId,
      newSettings
    );

    // Track changes
    const changedFields = Object.keys(newSettings).filter(
      (key) => (newSettings as any)[key] !== (oldSettings as any)[key]
    );

    // Log the change
    await this.logPrivacyAction(
      userId,
      user.email,
      'privacy_settings_updated',
      oldSettings,
      updatedUser.privacySettings,
      changedFields,
      ipAddress,
      userAgent
    );

    return updatedUser.privacySettings;
  }

  /**
   * Set all privacy toggles
   */
  static async setAllPrivacyToggles(
    userId: string,
    hideAll: boolean
  ): Promise<PrivacySettings> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    if (hideAll && user.isPaymentVerified) {
      throw new AdminException(
        'CANNOT_HIDE_VERIFIED_DATA',
        400,
        {
          message: 'Cannot hide all data for payment-verified users. Email must remain visible for payment confirmation.',
        }
      );
    }

    const newSettings: PrivacySettings = {
      hidePhone: hideAll,
      hideAddress: hideAll,
      hideLocation: hideAll,
      hideEmail: hideAll && !user.isPaymentVerified,
      allowPublicProfile: !hideAll,
    };

    return this.updatePrivacySettings(userId, newSettings);
  }

  /**
   * Get user profile visibility
   */
  static async getUserProfileVisibility(userId: string): Promise<{
    isPublic: boolean;
    visibleFields: string[];
    hiddenFields: string[];
  }> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const visibleFields: string[] = [];
    const hiddenFields: string[] = [];

    if (!user.privacySettings.hidePhone) {
      visibleFields.push('phone');
    } else {
      hiddenFields.push('phone');
    }

    if (!user.privacySettings.hideAddress) {
      visibleFields.push('address');
    } else {
      hiddenFields.push('address');
    }

    if (!user.privacySettings.hideLocation) {
      visibleFields.push('location');
    } else {
      hiddenFields.push('location');
    }

    if (!user.privacySettings.hideEmail) {
      visibleFields.push('email');
    } else {
      hiddenFields.push('email');
    }

    // Payment confirmation always visible if user is payment verified
    if (user.isPaymentVerified) {
      visibleFields.push('payment_confirmation');
      if (hiddenFields.includes('email')) {
        // Email must be visible for payment confirmed users
        visibleFields.push('email');
        hiddenFields.splice(hiddenFields.indexOf('email'), 1);
      }
    }

    return {
      isPublic: user.privacySettings.allowPublicProfile,
      visibleFields,
      hiddenFields,
    };
  }

  /**
   * Get sanitized user profile (respecting privacy settings)
   */
  static async getSanitizedUserProfile(
    userId: string,
    requestingUserId?: string
  ): Promise<Partial<User>> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    // User viewing their own profile gets full data
    if (requestingUserId === userId) {
      return user;
    }

    // Check if profile is public
    if (!user.privacySettings.allowPublicProfile && requestingUserId) {
      throw new AdminException(
        'PROFILE_NOT_PUBLIC',
        403,
        { message: 'This user profile is private' }
      );
    }

    // Build sanitized profile
    const sanitizedProfile: Partial<User> = {
      id: user.id,
      email: !user.privacySettings.hideEmail ? user.email : undefined,
      realName: user.realName, // Real name is always visible (or should be for verified users)
      phone: !user.privacySettings.hidePhone ? user.phone : undefined,
      address: !user.privacySettings.hideAddress ? user.address : undefined,
      location: !user.privacySettings.hideLocation ? user.location : undefined,
      isPaymentVerified: user.isPaymentVerified,
      createdAt: user.createdAt,
    };

    return sanitizedProfile;
  }

  /**
   * Validate user can access payment data
   */
  static async validatePaymentDataAccess(
    userId: string,
    requestingUserId: string
  ): Promise<boolean> {
    // Admin or same user can always access
    if (userId === requestingUserId) {
      return true;
    }

    const user = await UserManager.getUser(userId);
    if (!user) {
      return false;
    }

    // Payment data is always accessible to the owner
    // Admin access would be handled at the API layer
    return userId === requestingUserId;
  }

  /**
   * Get privacy audit log
   */
  static async getPrivacyAuditLog(userId: string): Promise<PrivacyAuditLog[]> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    return Array.from(privacyAuditLogsStore.values())
      .filter((log) => log.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  /**
   * Get privacy audit log for all users (admin only)
   */
  static async getAllPrivacyAuditLogs(
    dateRange?: { from: string; to: string }
  ): Promise<PrivacyAuditLog[]> {
    let logs = Array.from(privacyAuditLogsStore.values());

    if (dateRange) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);

      logs = logs.filter(
        (log) =>
          new Date(log.timestamp) >= fromDate &&
          new Date(log.timestamp) <= toDate
      );
    }

    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get privacy statistics
   */
  static async getPrivacyStats(): Promise<{
    totalUsers: number;
    usersWithPublicProfiles: number;
    usersHidingPhone: number;
    usersHidingAddress: number;
    usersHidingLocation: number;
    usersHidingEmail: number;
    averageVisibleFields: number;
  }> {
    const users = await UserManager.listUsers({}, { page: 1, pageSize: 10000 });

    let publicProfiles = 0;
    let hidingPhone = 0;
    let hidingAddress = 0;
    let hidingLocation = 0;
    let hidingEmail = 0;
    let totalVisibleFields = 0;

    users.data.forEach((user) => {
      if (user.privacySettings.allowPublicProfile) {
        publicProfiles++;
      }
      if (user.privacySettings.hidePhone) {
        hidingPhone++;
      }
      if (user.privacySettings.hideAddress) {
        hidingAddress++;
      }
      if (user.privacySettings.hideLocation) {
        hidingLocation++;
      }
      if (user.privacySettings.hideEmail) {
        hidingEmail++;
      }

      // Count visible fields
      let visibleFields = 4; // email, phone, address, location
      if (user.privacySettings.hidePhone) visibleFields--;
      if (user.privacySettings.hideAddress) visibleFields--;
      if (user.privacySettings.hideLocation) visibleFields--;
      if (user.privacySettings.hideEmail) visibleFields--;

      totalVisibleFields += visibleFields;
    });

    const totalUsers = users.pagination.totalCount;

    return {
      totalUsers,
      usersWithPublicProfiles: publicProfiles,
      usersHidingPhone: hidingPhone,
      usersHidingAddress: hidingAddress,
      usersHidingLocation: hidingLocation,
      usersHidingEmail: hidingEmail,
      averageVisibleFields:
        totalUsers > 0 ? totalVisibleFields / totalUsers : 0,
    };
  }

  /**
   * Export privacy settings for all users
   */
  static async exportPrivacySettings(
    userIds?: string[]
  ): Promise<Array<{
    userId: string;
    email: string;
    privacySettings: PrivacySettings;
    isPaymentVerified: boolean;
  }>> {
    let users = await UserManager.listUsers({}, { page: 1, pageSize: 10000 });

    let usersData = users.data;
    if (userIds) {
      usersData = usersData.filter((u) => userIds.includes(u.id));
    }

    return usersData.map((user) => ({
      userId: user.id,
      email: user.email,
      privacySettings: user.privacySettings,
      isPaymentVerified: user.isPaymentVerified,
    }));
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private static async logPrivacyAction(
    userId: string,
    userEmail: string,
    action: PrivacyAuditLog['action'],
    oldSettings: PrivacySettings,
    newSettings: PrivacySettings,
    changedFields?: string[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const logId = this.generateId();

    const log: PrivacyAuditLog = {
      id: logId,
      userId,
      userEmail,
      action,
      oldSettings,
      newSettings,
      changedFields: changedFields || [],
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
    };

    privacyAuditLogsStore.set(logId, log);

    // Keep only last 1000 logs per user to avoid memory bloat
    const userLogs = Array.from(privacyAuditLogsStore.values()).filter(
      (l) => l.userId === userId
    );

    if (userLogs.length > 1000) {
      const oldestLog = userLogs.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )[0];

      privacyAuditLogsStore.delete(oldestLog.id);
    }
  }

  private static generateId(): string {
    return `privacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export store for testing
export { privacyAuditLogsStore };
