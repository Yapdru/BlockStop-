/**
 * BlockAdmin Phase 31.1 - OAuth Tracker
 * Login method tracking (Google, Apple, Facebook, Yahoo)
 */

import {
  OAuthMethod,
  LoginSession,
  LoginMethod,
  AdminException,
} from '@/types/admin';
import { UserManager } from './user-manager';

// In-memory stores
const oauthMethodsStore: Map<string, OAuthMethod> = new Map();
const loginSessionsStore: Map<string, LoginSession> = new Map();

/**
 * OAuthTracker - Manages OAuth login methods and sessions
 */
export class OAuthTracker {
  /**
   * Register OAuth method for user
   */
  static async registerOAuthMethod(
    userId: string,
    method: Exclude<LoginMethod, 'email'>,
    oauthId: string,
    email: string,
    displayName?: string
  ): Promise<OAuthMethod> {
    // Validate user exists
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    // Check if method already linked
    const existing = Array.from(oauthMethodsStore.values()).find(
      (m) => m.userId === userId && m.method === method
    );

    if (existing) {
      throw new AdminException(
        'OAUTH_ALREADY_LINKED',
        409,
        { message: `${method} is already linked to this account` }
      );
    }

    // Check if OAuth ID is already used by another user
    const alreadyUsed = Array.from(oauthMethodsStore.values()).find(
      (m) => m.oauthId === oauthId && m.method === method && m.userId !== userId
    );

    if (alreadyUsed) {
      throw new AdminException(
        'OAUTH_ID_ALREADY_USED',
        409,
        {
          message: `This ${method} account is already linked to another BlockAdmin user`,
        }
      );
    }

    const now = new Date().toISOString();
    const oauthMethod: OAuthMethod = {
      id: this.generateId(),
      userId,
      method,
      oauthId,
      email,
      verifiedAt: now,
      linkedAt: now,
      lastUsedAt: now,
      displayName: displayName || null,
    };

    oauthMethodsStore.set(oauthMethod.id, oauthMethod);

    // Update user's login methods if not already present
    if (!user.loginMethods.includes(method)) {
      user.loginMethods.push(method);
      await UserManager.updateUser(userId, {});
    }

    return oauthMethod;
  }

  /**
   * Get OAuth methods for user
   */
  static async getUserOAuthMethods(userId: string): Promise<OAuthMethod[]> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    return Array.from(oauthMethodsStore.values()).filter(
      (m) => m.userId === userId
    );
  }

  /**
   * Verify OAuth method exists
   */
  static async verifyOAuthMethod(
    userId: string,
    method: Exclude<LoginMethod, 'email'>
  ): Promise<OAuthMethod | null> {
    return (
      Array.from(oauthMethodsStore.values()).find(
        (m) => m.userId === userId && m.method === method
      ) || null
    );
  }

  /**
   * Unlink OAuth method
   */
  static async unlinkOAuthMethod(
    userId: string,
    method: Exclude<LoginMethod, 'email'>
  ): Promise<void> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    // Find and remove the OAuth method
    let found = false;
    for (const [id, oauthMethod] of oauthMethodsStore.entries()) {
      if (oauthMethod.userId === userId && oauthMethod.method === method) {
        oauthMethodsStore.delete(id);
        found = true;
        break;
      }
    }

    if (!found) {
      throw new AdminException(
        'OAUTH_NOT_FOUND',
        404,
        { message: `${method} is not linked to this account` }
      );
    }

    // Update user's login methods
    user.loginMethods = user.loginMethods.filter((m) => m !== method);

    // If user removes their only login method, they should have email as fallback
    if (user.loginMethods.length === 0) {
      user.loginMethods = ['email'];
      user.primaryLoginMethod = 'email';
    }
  }

  /**
   * Create login session
   */
  static async createLoginSession(
    userId: string,
    method: LoginMethod,
    ipAddress: string,
    userAgent: string,
    oauthMethodId?: string
  ): Promise<LoginSession> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    // Get OAuth method if provided
    let oauthMethod: OAuthMethod | null = null;
    if (oauthMethodId) {
      oauthMethod =
        oauthMethodsStore.get(oauthMethodId) || null;
    }

    const now = new Date().toISOString();
    const session: LoginSession = {
      id: this.generateId(),
      userId,
      method,
      oauthMethod,
      ipAddress,
      userAgent,
      loginAt: now,
      logoutAt: null,
      isActive: true,
    };

    loginSessionsStore.set(session.id, session);

    // Update last login
    await UserManager.recordLastLogin(userId);

    // Update OAuth method's last used time
    if (oauthMethod) {
      oauthMethod.lastUsedAt = now;
      oauthMethodsStore.set(oauthMethodId!, oauthMethod);
    }

    return session;
  }

  /**
   * End login session
   */
  static async endLoginSession(sessionId: string): Promise<void> {
    const session = loginSessionsStore.get(sessionId);
    if (!session) {
      throw new AdminException(
        'SESSION_NOT_FOUND',
        404,
        { message: 'Login session not found' }
      );
    }

    session.isActive = false;
    session.logoutAt = new Date().toISOString();
    loginSessionsStore.set(sessionId, session);
  }

  /**
   * Get user's active sessions
   */
  static async getUserActiveSessions(userId: string): Promise<LoginSession[]> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    return Array.from(loginSessionsStore.values()).filter(
      (s) => s.userId === userId && s.isActive
    );
  }

  /**
   * Get user's login history
   */
  static async getUserLoginHistory(
    userId: string,
    limit: number = 50
  ): Promise<LoginSession[]> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    return Array.from(loginSessionsStore.values())
      .filter((s) => s.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime()
      )
      .slice(0, limit);
  }

  /**
   * Revoke all user sessions
   */
  static async revokeAllUserSessions(userId: string): Promise<number> {
    const user = await UserManager.getUser(userId);
    if (!user) {
      throw new AdminException(
        'USER_NOT_FOUND',
        404,
        { message: 'User not found' }
      );
    }

    let count = 0;
    const now = new Date().toISOString();

    for (const [id, session] of loginSessionsStore.entries()) {
      if (session.userId === userId && session.isActive) {
        session.isActive = false;
        session.logoutAt = now;
        loginSessionsStore.set(id, session);
        count++;
      }
    }

    return count;
  }

  /**
   * Get login method statistics
   */
  static async getLoginMethodStats(): Promise<Record<LoginMethod, number>> {
    const stats: Record<LoginMethod, number> = {
      google: 0,
      apple: 0,
      facebook: 0,
      yahoo: 0,
      email: 0,
    };

    const sessions = Array.from(loginSessionsStore.values());
    sessions.forEach((session) => {
      stats[session.method]++;
    });

    return stats;
  }

  /**
   * Get OAuth adoption stats
   */
  static async getOAuthAdoptionStats(): Promise<{
    totalOAuthMethods: number;
    googleUsers: number;
    appleUsers: number;
    facebookUsers: number;
    yahooUsers: number;
    averageMethodsPerUser: number;
  }> {
    const methods = Array.from(oauthMethodsStore.values());
    const uniqueUsers = new Set(methods.map((m) => m.userId));

    const googleCount = methods.filter((m) => m.method === 'google').length;
    const appleCount = methods.filter((m) => m.method === 'apple').length;
    const facebookCount = methods.filter((m) => m.method === 'facebook').length;
    const yahooCount = methods.filter((m) => m.method === 'yahoo').length;

    return {
      totalOAuthMethods: methods.length,
      googleUsers: new Set(methods.filter((m) => m.method === 'google').map((m) => m.userId)).size,
      appleUsers: new Set(methods.filter((m) => m.method === 'apple').map((m) => m.userId)).size,
      facebookUsers: new Set(methods.filter((m) => m.method === 'facebook').map((m) => m.userId)).size,
      yahooUsers: new Set(methods.filter((m) => m.method === 'yahoo').map((m) => m.userId)).size,
      averageMethodsPerUser: uniqueUsers.size > 0 ? methods.length / uniqueUsers.size : 0,
    };
  }

  /**
   * Get specific OAuth ID's user
   */
  static async getUserByOAuthId(
    method: Exclude<LoginMethod, 'email'>,
    oauthId: string
  ): Promise<{ userId: string; user: any } | null> {
    const oauthMethod = Array.from(oauthMethodsStore.values()).find(
      (m) => m.method === method && m.oauthId === oauthId
    );

    if (!oauthMethod) {
      return null;
    }

    const user = await UserManager.getUser(oauthMethod.userId);
    if (!user) {
      return null;
    }

    return { userId: oauthMethod.userId, user };
  }

  /**
   * Export login data
   */
  static async exportLoginData(
    userId?: string,
    dateRange?: { from: string; to: string }
  ): Promise<{
    oauthMethods: OAuthMethod[];
    loginSessions: LoginSession[];
  }> {
    let methods = Array.from(oauthMethodsStore.values());
    let sessions = Array.from(loginSessionsStore.values());

    if (userId) {
      methods = methods.filter((m) => m.userId === userId);
      sessions = sessions.filter((s) => s.userId === userId);
    }

    if (dateRange) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);

      sessions = sessions.filter(
        (s) =>
          new Date(s.loginAt) >= fromDate &&
          new Date(s.loginAt) <= toDate
      );
    }

    return { oauthMethods: methods, loginSessions: sessions };
  }

  /**
   * Cleanup old sessions
   */
  static async cleanupOldSessions(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let removed = 0;

    for (const [id, session] of loginSessionsStore.entries()) {
      if (new Date(session.logoutAt || session.loginAt) < cutoffDate) {
        loginSessionsStore.delete(id);
        removed++;
      }
    }

    return removed;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private static generateId(): string {
    return `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export stores for testing
export { oauthMethodsStore, loginSessionsStore };
