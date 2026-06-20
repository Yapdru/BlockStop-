import crypto from 'crypto';
import { query } from '@/lib/db';

/**
 * Session data structure
 */
export interface SessionData {
  sessionId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  trustScore?: number;
  mfaVerified: boolean;
}

/**
 * Session Validator for Zero Trust Architecture
 * Manages session creation, validation, and revocation
 */
export class SessionValidator {
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour

  /**
   * Validate an existing session
   */
  async validateSession(sessionId: string): Promise<{ valid: boolean; session?: SessionData }> {
    try {
      const result = await query(
        `SELECT id, user_id as "userId", created_at as "createdAt", expires_at as "expiresAt",
                last_activity as "lastActivity", ip_address as "ipAddress", user_agent as "userAgent",
                device_id as "deviceId", trust_score as "trustScore", mfa_verified as "mfaVerified"
         FROM sessions WHERE id = $1`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return { valid: false };
      }

      const session = result.rows[0];
      const now = new Date();

      // Check if session is expired
      if (new Date(session.expiresAt) < now) {
        // Delete expired session
        await this.revokeSession(sessionId);
        return { valid: false };
      }

      // Check for inactivity
      const lastActivity = new Date(session.lastActivity);
      if (now.getTime() - lastActivity.getTime() > this.INACTIVITY_TIMEOUT) {
        // Session inactive too long
        await this.revokeSession(sessionId);
        return { valid: false };
      }

      // Update last activity
      await this.updateSessionActivity(sessionId);

      const sessionData: SessionData = {
        sessionId: session.id,
        userId: session.userId,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt),
        lastActivity: new Date(session.lastActivity),
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceId: session.deviceId,
        trustScore: session.trustScore,
        mfaVerified: session.mfaVerified === true,
      };

      return { valid: true, session: sessionData };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  /**
   * Create new session for user
   */
  async createSession(userId: string, request: Request): Promise<SessionData> {
    try {
      const sessionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.SESSION_DURATION);
      const ipAddress = this.getClientIp(request);
      const userAgent = request.headers.get('user-agent') || '';
      const deviceId = this.generateDeviceId(userAgent, ipAddress);

      // Get user's current MFA status
      const userResult = await query(
        `SELECT two_factor_enabled FROM users WHERE id = $1`,
        [userId]
      );

      const mfaVerified = userResult.rows.length > 0 && userResult.rows[0].two_factor_enabled === true;

      // Calculate initial trust score
      const trustScore = this.calculateTrustScore(deviceId, ipAddress);

      // Insert session
      await query(
        `INSERT INTO sessions (id, user_id, created_at, expires_at, last_activity, ip_address, user_agent, device_id, trust_score, mfa_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [sessionId, userId, now, expiresAt, now, ipAddress, userAgent, deviceId, trustScore, mfaVerified]
      );

      // Log session creation
      await query(
        `INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, 'session_created', `Session: ${sessionId}`, ipAddress]
      );

      return {
        sessionId,
        userId,
        createdAt: now,
        expiresAt,
        lastActivity: now,
        ipAddress,
        userAgent,
        deviceId,
        trustScore,
        mfaVerified,
      };
    } catch (error) {
      console.error('Session creation error:', error);
      throw error;
    }
  }

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      const result = await query(
        `SELECT user_id FROM sessions WHERE id = $1`,
        [sessionId]
      );

      if (result.rows.length > 0) {
        const userId = result.rows[0].user_id;

        // Delete session
        await query(
          `DELETE FROM sessions WHERE id = $1`,
          [sessionId]
        );

        // Log revocation
        await query(
          `INSERT INTO audit_logs (user_id, action, details, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [userId, 'session_revoked', `Session: ${sessionId}`]
        );
      }
    } catch (error) {
      console.error('Session revocation error:', error);
      throw error;
    }
  }

  /**
   * Revoke all sessions for a user (e.g., on password change or security event)
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    try {
      const result = await query(
        `SELECT COUNT(*) as "count" FROM sessions WHERE user_id = $1`,
        [userId]
      );

      const count = result.rows[0].count;

      // Delete all user sessions
      await query(
        `DELETE FROM sessions WHERE user_id = $1`,
        [userId]
      );

      // Log mass revocation
      await query(
        `INSERT INTO audit_logs (user_id, action, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, 'all_sessions_revoked', `Revoked ${count} sessions`]
      );

      return count;
    } catch (error) {
      console.error('All sessions revocation error:', error);
      throw error;
    }
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await query(
        `UPDATE sessions SET last_activity = NOW() WHERE id = $1`,
        [sessionId]
      );
    } catch (error) {
      console.error('Session activity update error:', error);
      // Non-fatal, continue
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<SessionData[]> {
    try {
      const result = await query(
        `SELECT id, user_id as "userId", created_at as "createdAt", expires_at as "expiresAt",
                last_activity as "lastActivity", ip_address as "ipAddress", user_agent as "userAgent",
                device_id as "deviceId", trust_score as "trustScore", mfa_verified as "mfaVerified"
         FROM sessions
         WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY last_activity DESC`,
        [userId]
      );

      return result.rows.map(row => ({
        sessionId: row.id,
        userId: row.userId,
        createdAt: new Date(row.createdAt),
        expiresAt: new Date(row.expiresAt),
        lastActivity: new Date(row.lastActivity),
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        deviceId: row.deviceId,
        trustScore: row.trustScore,
        mfaVerified: row.mfaVerified === true,
      }));
    } catch (error) {
      console.error('Get active sessions error:', error);
      return [];
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.headers.get('x-real-ip') || 'unknown';
  }

  /**
   * Generate device ID based on user agent and IP
   */
  private generateDeviceId(userAgent: string, ipAddress: string): string {
    const combined = `${userAgent}:${ipAddress}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Calculate trust score for device
   */
  private calculateTrustScore(deviceId: string, ipAddress: string): number {
    // Start with base score
    let score = 0.5;

    // Deduct for private IP (typically less trustworthy)
    if (this.isPrivateIP(ipAddress)) {
      score -= 0.2;
    } else {
      score += 0.2;
    }

    // Deduct for suspicious patterns
    if (ipAddress === 'unknown') {
      score -= 0.3;
    }

    // Ensure score is within 0-1 range
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Check if IP is private
   */
  private isPrivateIP(ip: string): boolean {
    if (ip === 'unknown') return true;

    const parts = ip.split('.');
    if (parts.length !== 4) return false;

    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);

    // Private IP ranges
    if (first === 10) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    if (first === 127) return true; // Loopback

    return false;
  }

  /**
   * Cleanup expired sessions (should be run periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM sessions WHERE expires_at < NOW()`,
        []
      );

      return result.rowCount || 0;
    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
      return 0;
    }
  }
}

export const sessionValidator = new SessionValidator();
