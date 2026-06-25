/**
 * BlockAdmin Phase 31.1 - User Manager
 * CRUD operations, user verification workflow, and user lifecycle management
 */

import {
  User,
  VerificationStatus,
  AdminRole,
  LoginMethod,
  PrivacySettings,
  CreateUserRequest,
  UpdateUserRequest,
  PaginatedResponse,
  PaginationParams,
  UserManagementFilters,
  AdminException,
  VerificationEmail,
} from '@/types/admin';

// In-memory store for demo (replace with database)
const usersStore: Map<string, User> = new Map();
const verificationEmailsStore: Map<string, VerificationEmail> = new Map();

// Default privacy settings
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  hidePhone: false,
  hideAddress: false,
  hideLocation: false,
  hideEmail: false,
  allowPublicProfile: true,
};

/**
 * UserManager - Handles all user CRUD operations and verification workflows
 */
export class UserManager {
  /**
   * Create a new user with initial verification setup
   */
  static async createUser(request: CreateUserRequest): Promise<User> {
    // Validate input
    if (!request.email || !request.realName) {
      throw new AdminException(
        'VALIDATION_ERROR',
        400,
        { message: 'Email and real name are required' }
      );
    }

    // Check for duplicate email
    const existingUser = Array.from(usersStore.values()).find(
      (u) => u.email === request.email
    );
    if (existingUser) {
      throw new AdminException(
        'USER_EXISTS',
        409,
        { message: 'User with this email already exists' }
      );
    }

    // Generate verification code
    const verificationCode = this.generateVerificationCode();

    const now = new Date().toISOString();
    const user: User = {
      id: this.generateUserId(),
      email: request.email,
      realName: request.realName,
      phone: request.phone || null,
      address: request.address || null,
      location: request.location || null,
      dateOfBirth: null,
      loginMethods: [request.loginMethod],
      primaryLoginMethod: request.loginMethod,
      verificationStatus: 'pending',
      verificationDate: null,
      verificationCode,
      verificationCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isAdmin: false,
      adminRole: 'user',
      isActive: true,
      isPaymentVerified: false,
      paymentVerificationDate: null,
      privacySettings: { ...DEFAULT_PRIVACY_SETTINGS },
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      flagReason: null,
    };

    usersStore.set(user.id, user);

    // Create verification email record
    const emailRecord: VerificationEmail = {
      id: this.generateId(),
      userId: user.id,
      email: request.email,
      code: verificationCode,
      codeExpiry: user.verificationCodeExpiry,
      attempts: 0,
      maxAttempts: 5,
      sentAt: now,
      verifiedAt: null,
      status: 'pending',
    };

    verificationEmailsStore.set(emailRecord.id, emailRecord);

    return user;
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: string): Promise<User | null> {
    return usersStore.get(userId) || null;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    return (
      Array.from(usersStore.values()).find((u) => u.email === email) || null
    );
  }

  /**
   * Update user information
   */
  static async updateUser(
    userId: string,
    request: UpdateUserRequest
  ): Promise<User> {
    const user = usersStore.get(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const updates: Partial<User> = {
      updatedAt: new Date().toISOString(),
    };

    if (request.realName !== undefined) {
      updates.realName = request.realName;
    }
    if (request.phone !== undefined) {
      updates.phone = request.phone;
    }
    if (request.address !== undefined) {
      updates.address = request.address;
    }
    if (request.location !== undefined) {
      updates.location = request.location;
    }
    if (request.verificationStatus !== undefined) {
      updates.verificationStatus = request.verificationStatus;
      if (request.verificationStatus === 'verified') {
        updates.verificationDate = new Date().toISOString();
      }
    }
    if (request.privacySettings !== undefined) {
      updates.privacySettings = {
        ...user.privacySettings,
        ...request.privacySettings,
      };
    }

    const updatedUser = { ...user, ...updates };
    usersStore.set(userId, updatedUser);

    return updatedUser;
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId: string, reason?: string): Promise<User> {
    const user = usersStore.get(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const updatedUser: User = {
      ...user,
      isActive: false,
      flagReason: reason || null,
      updatedAt: new Date().toISOString(),
    };

    usersStore.set(userId, updatedUser);
    return updatedUser;
  }

  /**
   * Activate user account
   */
  static async activateUser(userId: string): Promise<User> {
    const user = usersStore.get(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const updatedUser: User = {
      ...user,
      isActive: true,
      flagReason: null,
      updatedAt: new Date().toISOString(),
    };

    usersStore.set(userId, updatedUser);
    return updatedUser;
  }

  /**
   * Flag user account for review
   */
  static async flagUser(userId: string, reason: string): Promise<User> {
    const user = usersStore.get(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const updatedUser: User = {
      ...user,
      verificationStatus: 'flagged',
      flagReason: reason,
      updatedAt: new Date().toISOString(),
    };

    usersStore.set(userId, updatedUser);
    return updatedUser;
  }

  /**
   * Unflag user account
   */
  static async unflagUser(userId: string): Promise<User> {
    const user = usersStore.get(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const updatedUser: User = {
      ...user,
      verificationStatus: 'pending',
      flagReason: null,
      updatedAt: new Date().toISOString(),
    };

    usersStore.set(userId, updatedUser);
    return updatedUser;
  }

  /**
   * List users with filtering and pagination
   */
  static async listUsers(
    filters: UserManagementFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<User>> {
    let users = Array.from(usersStore.values());

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(searchLower) ||
          (u.realName && u.realName.toLowerCase().includes(searchLower))
      );
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'all') {
      users = users.filter((u) => u.verificationStatus === filters.verificationStatus);
    }

    if (filters.adminRole && filters.adminRole !== 'all') {
      users = users.filter((u) => u.adminRole === filters.adminRole);
    }

    if (filters.isActive !== 'all' && filters.isActive !== undefined) {
      users = users.filter((u) => u.isActive === filters.isActive);
    }

    if (filters.paymentVerified !== 'all' && filters.paymentVerified !== undefined) {
      users = users.filter((u) => u.isPaymentVerified === filters.paymentVerified);
    }

    if (filters.loginMethod && filters.loginMethod !== 'all') {
      users = users.filter((u) => u.loginMethods.includes(filters.loginMethod!));
    }

    if (filters.dateRange) {
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);
      users = users.filter(
        (u) =>
          new Date(u.createdAt) >= fromDate &&
          new Date(u.createdAt) <= toDate
      );
    }

    // Apply sorting
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';
    users.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Apply pagination
    const totalCount = users.length;
    const pageSize = pagination.pageSize || 20;
    const page = Math.max(1, pagination.page || 1);
    const start = (page - 1) * pageSize;
    const paginatedUsers = users.slice(start, start + pageSize);
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: paginatedUsers,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Verify user with code
   */
  static async verifyUserWithCode(
    userId: string,
    code: string
  ): Promise<{ success: boolean; user: User | null }> {
    const user = usersStore.get(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    if (!user.verificationCode) {
      return { success: false, user: null };
    }

    if (new Date(user.verificationCodeExpiry!) < new Date()) {
      return { success: false, user: null };
    }

    if (user.verificationCode !== code) {
      return { success: false, user: null };
    }

    const updatedUser: User = {
      ...user,
      verificationStatus: 'verified',
      verificationDate: new Date().toISOString(),
      verificationCode: null,
      verificationCodeExpiry: null,
      updatedAt: new Date().toISOString(),
    };

    usersStore.set(userId, updatedUser);

    // Update verification email record
    const emailRecord = Array.from(verificationEmailsStore.values()).find(
      (e) => e.userId === userId && e.status === 'pending'
    );
    if (emailRecord) {
      emailRecord.status = 'verified';
      emailRecord.verifiedAt = new Date().toISOString();
      verificationEmailsStore.set(emailRecord.id, emailRecord);
    }

    return { success: true, user: updatedUser };
  }

  /**
   * Resend verification code
   */
  static async resendVerificationCode(userId: string): Promise<string> {
    const user = usersStore.get(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const verificationCode = this.generateVerificationCode();
    const codeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const updatedUser: User = {
      ...user,
      verificationCode,
      verificationCodeExpiry: codeExpiry,
      updatedAt: new Date().toISOString(),
    };

    usersStore.set(userId, updatedUser);

    // Create new verification email record
    const emailRecord: VerificationEmail = {
      id: this.generateId(),
      userId: user.id,
      email: user.email,
      code: verificationCode,
      codeExpiry,
      attempts: 0,
      maxAttempts: 5,
      sentAt: new Date().toISOString(),
      verifiedAt: null,
      status: 'pending',
    };

    verificationEmailsStore.set(emailRecord.id, emailRecord);

    return verificationCode;
  }

  /**
   * Get dashboard stats
   */
  static async getDashboardStats() {
    const users = Array.from(usersStore.values());
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      verifiedUsers: users.filter((u) => u.verificationStatus === 'verified').length,
      pendingVerifications: users.filter(
        (u) => u.verificationStatus === 'pending'
      ).length,
      flaggedUsers: users.filter((u) => u.verificationStatus === 'flagged').length,
      paymentVerifiedUsers: users.filter((u) => u.isPaymentVerified).length,
      adminUsers: users.filter((u) => u.isAdmin).length,
      recentSignups: users.filter(
        (u) => new Date(u.createdAt) >= oneDayAgo
      ).length,
    };
  }

  /**
   * Update privacy settings for user
   */
  static async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<User> {
    const user = usersStore.get(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const updatedUser: User = {
      ...user,
      privacySettings: {
        ...user.privacySettings,
        ...settings,
      },
      updatedAt: new Date().toISOString(),
    };

    usersStore.set(userId, updatedUser);
    return updatedUser;
  }

  /**
   * Mark payment as verified
   */
  static async markPaymentVerified(userId: string): Promise<User> {
    const user = usersStore.get(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const updatedUser: User = {
      ...user,
      isPaymentVerified: true,
      paymentVerificationDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    usersStore.set(userId, updatedUser);
    return updatedUser;
  }

  /**
   * Record last login
   */
  static async recordLastLogin(userId: string): Promise<void> {
    const user = usersStore.get(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    const updatedUser: User = {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };

    usersStore.set(userId, updatedUser);
  }

  /**
   * Get all users for export
   */
  static async exportUsers(
    filters?: UserManagementFilters
  ): Promise<User[]> {
    let users = Array.from(usersStore.values());

    if (filters) {
      if (filters.verificationStatus && filters.verificationStatus !== 'all') {
        users = users.filter((u) => u.verificationStatus === filters.verificationStatus);
      }
      if (filters.isActive !== 'all' && filters.isActive !== undefined) {
        users = users.filter((u) => u.isActive === filters.isActive);
      }
      if (filters.adminRole && filters.adminRole !== 'all') {
        users = users.filter((u) => u.adminRole === filters.adminRole);
      }
    }

    return users;
  }

  /**
   * Delete user (hard delete - use with caution)
   */
  static async deleteUser(userId: string): Promise<void> {
    usersStore.delete(userId);

    // Also delete related verification emails
    for (const [id, email] of verificationEmailsStore.entries()) {
      if (email.userId === userId) {
        verificationEmailsStore.delete(id);
      }
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateVerificationCode(): string {
    return Math.random().toString().substring(2, 8);
  }
}

// Export store for testing/debugging
export { usersStore, verificationEmailsStore };
