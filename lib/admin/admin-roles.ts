/**
 * BlockAdmin Phase 31.1 - Admin Roles Manager
 * Admin assignment, role-based access control, and permission management
 */

import {
  AdminUser,
  AdminRole,
  User,
  AdminException,
  AssignAdminRequest,
} from '@/types/admin';
import { UserManager } from './user-manager';

// In-memory store for admin users
const adminUsersStore: Map<string, AdminUser> = new Map();

// Role permissions mapping
const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    'manage_users',
    'manage_admins',
    'verify_users',
    'verify_payments',
    'view_audit_logs',
    'manage_privacy_settings',
    'manage_oauth',
    'view_reports',
    'export_data',
    'system_settings',
  ],
  admin: [
    'manage_users',
    'verify_users',
    'verify_payments',
    'view_audit_logs',
    'manage_privacy_settings',
    'view_reports',
  ],
  moderator: [
    'manage_users',
    'verify_users',
    'view_audit_logs',
    'view_reports',
  ],
  user: [],
};

/**
 * AdminRolesManager - Manages admin roles and permissions
 */
export class AdminRolesManager {
  /**
   * Assign admin role to user
   */
  static async assignAdminRole(
    request: AssignAdminRequest,
    assignedBy: string
  ): Promise<AdminUser> {
    // Verify user exists
    const user = await UserManager.getUser(request.userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    // Check if assigning user is authorized
    const assigningAdmin = await this.getAdminUser(assignedBy);
    if (!assigningAdmin) {
      throw new AdminException(
        'UNAUTHORIZED',
        403,
        { message: 'Only admins can assign admin roles' }
      );
    }

    // Super admin can assign all roles, admin can only assign moderator
    if (
      assigningAdmin.role !== 'super_admin' &&
      request.role !== 'moderator'
    ) {
      throw new AdminException(
        'PERMISSION_DENIED',
        403,
        { message: 'You do not have permission to assign this role' }
      );
    }

    // Check if user already has admin role
    const existingAdmin = adminUsersStore.get(user.id);
    if (existingAdmin && existingAdmin.isActive) {
      throw new AdminException(
        'ALREADY_ADMIN',
        409,
        { message: 'User is already an admin' }
      );
    }

    const now = new Date().toISOString();
    const adminUser: AdminUser = {
      id: existingAdmin?.id || this.generateId(),
      userId: user.id,
      role: request.role,
      permissions: ROLE_PERMISSIONS[request.role],
      assignedBy,
      assignedAt: existingAdmin?.assignedAt || now,
      expiresAt: request.expiresAt || null,
      isActive: true,
    };

    adminUsersStore.set(user.id, adminUser);

    // Update user admin status
    user.isAdmin = true;
    user.adminRole = request.role;

    return adminUser;
  }

  /**
   * Remove admin role from user
   */
  static async removeAdminRole(
    userId: string,
    removedBy: string
  ): Promise<void> {
    // Verify user exists
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    // Check if removing user is authorized
    const removingAdmin = await this.getAdminUser(removedBy);
    if (!removingAdmin) {
      throw new AdminException(
        'UNAUTHORIZED',
        403,
        { message: 'Only admins can remove admin roles' }
      );
    }

    // Can't remove self
    if (userId === removedBy) {
      throw new AdminException(
        'CANNOT_REMOVE_SELF',
        400,
        { message: 'Cannot remove your own admin role' }
      );
    }

    // Super admin can remove all, admin can only remove moderator
    const targetAdmin = adminUsersStore.get(userId);
    if (
      removingAdmin.role !== 'super_admin' &&
      targetAdmin?.role !== 'moderator'
    ) {
      throw new AdminException(
        'PERMISSION_DENIED',
        403,
        { message: 'You do not have permission to remove this admin' }
      );
    }

    if (targetAdmin) {
      targetAdmin.isActive = false;
      adminUsersStore.set(userId, targetAdmin);
    }

    // Update user admin status
    user.isAdmin = false;
    user.adminRole = 'user';
  }

  /**
   * Get admin user by ID
   */
  static async getAdminUser(userId: string): Promise<AdminUser | null> {
    const admin = adminUsersStore.get(userId);

    if (!admin || !admin.isActive) {
      return null;
    }

    // Check if role has expired
    if (admin.expiresAt && new Date(admin.expiresAt) < new Date()) {
      admin.isActive = false;
      adminUsersStore.set(userId, admin);
      return null;
    }

    return admin;
  }

  /**
   * Check if user has permission
   */
  static async hasPermission(
    userId: string,
    permission: string
  ): Promise<boolean> {
    const admin = await this.getAdminUser(userId);
    if (!admin) {
      return false;
    }

    return admin.permissions.includes(permission) ||
      admin.role === 'super_admin'
      ? true
      : false;
  }

  /**
   * Get all permissions for user
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    const admin = await this.getAdminUser(userId);
    if (!admin) {
      return [];
    }

    return admin.permissions;
  }

  /**
   * Update admin role
   */
  static async updateAdminRole(
    userId: string,
    newRole: AdminRole,
    updatedBy: string
  ): Promise<AdminUser> {
    // Check authorization
    const updatingAdmin = await this.getAdminUser(updatedBy);
    if (!updatingAdmin) {
      throw new AdminException(
        'UNAUTHORIZED',
        403,
        { message: 'Only admins can update admin roles' }
      );
    }

    if (updatingAdmin.role !== 'super_admin') {
      throw new AdminException(
        'PERMISSION_DENIED',
        403,
        { message: 'Only super admins can update admin roles' }
      );
    }

    const admin = adminUsersStore.get(userId);
    if (!admin) {
      throw new AdminException(
        'ADMIN_NOT_FOUND',
        404,
        { message: 'Admin not found' }
      );
    }

    admin.role = newRole;
    admin.permissions = ROLE_PERMISSIONS[newRole];
    adminUsersStore.set(userId, admin);

    return admin;
  }

  /**
   * Extend admin role expiration
   */
  static async extendAdminRole(
    userId: string,
    expiresAt: string,
    extendedBy: string
  ): Promise<AdminUser> {
    // Check authorization
    const extendingAdmin = await this.getAdminUser(extendedBy);
    if (!extendingAdmin) {
      throw new AdminException(
        'UNAUTHORIZED',
        403,
        { message: 'Only admins can extend admin roles' }
      );
    }

    if (extendingAdmin.role !== 'super_admin') {
      throw new AdminException(
        'PERMISSION_DENIED',
        403,
        { message: 'Only super admins can extend admin roles' }
      );
    }

    const admin = adminUsersStore.get(userId);
    if (!admin) {
      throw new AdminException(
        'ADMIN_NOT_FOUND',
        404,
        { message: 'Admin not found' }
      );
    }

    // Validate expiration date is in the future
    if (new Date(expiresAt) <= new Date()) {
      throw new AdminException(
        'INVALID_EXPIRY_DATE',
        400,
        { message: 'Expiration date must be in the future' }
      );
    }

    admin.expiresAt = expiresAt;
    adminUsersStore.set(userId, admin);

    return admin;
  }

  /**
   * List all admin users
   */
  static async listAdmins(): Promise<AdminUser[]> {
    const admins = Array.from(adminUsersStore.values()).filter(
      (a) => a.isActive
    );

    // Filter out expired roles
    const now = new Date();
    return admins.filter(
      (a) => !a.expiresAt || new Date(a.expiresAt) > now
    );
  }

  /**
   * List admin users by role
   */
  static async listAdminsByRole(role: AdminRole): Promise<AdminUser[]> {
    return (await this.listAdmins()).filter((a) => a.role === role);
  }

  /**
   * Get admin statistics
   */
  static async getAdminStats(): Promise<{
    totalAdmins: number;
    superAdmins: number;
    admins: number;
    moderators: number;
    expiredRoles: number;
    expiringSoon: number;
  }> {
    const all = Array.from(adminUsersStore.values());
    const active = all.filter((a) => a.isActive);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const superAdmins = active.filter((a) => a.role === 'super_admin').length;
    const admins = active.filter((a) => a.role === 'admin').length;
    const moderators = active.filter((a) => a.role === 'moderator').length;

    const expired = all.filter(
      (a) => a.expiresAt && new Date(a.expiresAt) < now
    ).length;

    const expiringSoon = active.filter(
      (a) =>
        a.expiresAt &&
        new Date(a.expiresAt) > now &&
        new Date(a.expiresAt) <= weekFromNow
    ).length;

    return {
      totalAdmins: active.filter((a) => a.isActive).length,
      superAdmins,
      admins,
      moderators,
      expiredRoles: expired,
      expiringSoon,
    };
  }

  /**
   * Check role hierarchy
   */
  static getRoleHierarchy(role: AdminRole): number {
    const hierarchy: Record<AdminRole, number> = {
      super_admin: 4,
      admin: 3,
      moderator: 2,
      user: 1,
    };

    return hierarchy[role];
  }

  /**
   * Can user manage other admin
   */
  static canManageAdmin(
    adminRole: AdminRole,
    targetRole: AdminRole
  ): boolean {
    const adminHierarchy = this.getRoleHierarchy(adminRole);
    const targetHierarchy = this.getRoleHierarchy(targetRole);

    return adminHierarchy > targetHierarchy;
  }

  /**
   * Export admin data
   */
  static async exportAdminData(): Promise<AdminUser[]> {
    return await this.listAdmins();
  }

  /**
   * Cleanup expired admin roles
   */
  static async cleanupExpiredRoles(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    for (const [userId, admin] of adminUsersStore.entries()) {
      if (admin.expiresAt && new Date(admin.expiresAt) < now) {
        admin.isActive = false;
        adminUsersStore.set(userId, admin);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Validate admin password/authentication
   * (This is a placeholder - actual implementation depends on auth system)
   */
  static async validateAdminAuthentication(
    userId: string,
    credentials: Record<string, any>
  ): Promise<boolean> {
    const admin = await this.getAdminUser(userId);
    if (!admin) {
      return false;
    }

    // TODO: Implement actual credential validation
    return true;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private static generateId(): string {
    return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export store for testing
export { adminUsersStore, ROLE_PERMISSIONS };
