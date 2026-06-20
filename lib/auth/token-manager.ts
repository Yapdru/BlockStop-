import { query } from '@/lib/db';
import crypto from 'crypto';
import { jwtHandler } from './jwt-handler';
import { auditLogger } from './audit-logger';
import { PermissionScope } from './scope-validator';

export interface Token {
  id: string;
  userId: number;
  accessToken: string;
  refreshToken: string;
  scopes: PermissionScope[];
  clientId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export interface TokenMetadata {
  ipAddress?: string;
  userAgent?: string;
  clientId?: string;
}

export class TokenManager {
  private accessTokenExpiry = 3600; // 1 hour
  private refreshTokenExpiry = 86400 * 7; // 7 days

  /**
   * Create new tokens for a user
   */
  async createTokens(
    userId: number,
    email: string,
    scopes: PermissionScope[],
    metadata?: TokenMetadata
  ): Promise<Token> {
    const tokenId = crypto.randomBytes(16).toString('hex');
    const accessToken = jwtHandler.createAccessToken(userId, email, scopes, metadata?.clientId);
    const refreshToken = jwtHandler.createRefreshToken(userId, email);

    const expiresAt = new Date(Date.now() + this.accessTokenExpiry * 1000);
    const refreshExpiresAt = new Date(Date.now() + this.refreshTokenExpiry * 1000);

    try {
      await query(
        `INSERT INTO tokens (
          id, user_id, access_token, refresh_token, scopes, client_id,
          ip_address, user_agent, expires_at, refresh_expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          tokenId,
          userId,
          this.hashToken(accessToken),
          this.hashToken(refreshToken),
          JSON.stringify(scopes),
          metadata?.clientId || null,
          metadata?.ipAddress || null,
          metadata?.userAgent || null,
          expiresAt,
          refreshExpiresAt,
        ]
      );

      await auditLogger.logAuthEvent(
        'auth.token_issued',
        userId,
        'Token issued',
        'success',
        { clientId: metadata?.clientId, scopes },
        metadata?.ipAddress,
        metadata?.userAgent
      );

      return {
        id: tokenId,
        userId,
        accessToken,
        refreshToken,
        scopes,
        clientId: metadata?.clientId,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        expiresAt,
        refreshExpiresAt,
        createdAt: new Date(),
      };
    } catch (error) {
      await auditLogger.logAuthEvent(
        'auth.token_issued',
        userId,
        'Token issuance failed',
        'failure',
        { error: String(error) },
        metadata?.ipAddress,
        metadata?.userAgent
      );
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(accessToken: string): Promise<{ valid: boolean; userId?: number; scopes?: PermissionScope[] }> {
    const decoded = jwtHandler.verifyAccessToken(accessToken);

    if (!decoded) {
      return { valid: false };
    }

    // Check if token is revoked in database
    const tokenHash = this.hashToken(accessToken);
    const result = await query(
      `SELECT revoked_at as "revokedAt" FROM tokens WHERE access_token = $1`,
      [tokenHash]
    );

    if (result.rows.length > 0 && result.rows[0].revokedAt) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: decoded.userId,
      scopes: decoded.scopes,
    };
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(refreshToken: string): Promise<{ valid: boolean; userId?: number }> {
    const decoded = jwtHandler.verifyRefreshToken(refreshToken);

    if (!decoded) {
      return { valid: false };
    }

    // Check if token is revoked in database
    const tokenHash = this.hashToken(refreshToken);
    const result = await query(
      `SELECT revoked_at as "revokedAt" FROM tokens WHERE refresh_token = $1`,
      [tokenHash]
    );

    if (result.rows.length > 0 && result.rows[0].revokedAt) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: decoded.userId,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    refreshToken: string,
    email: string,
    metadata?: TokenMetadata
  ): Promise<{ accessToken: string; expiresAt: Date } | null> {
    // Validate refresh token
    const decoded = jwtHandler.verifyRefreshToken(refreshToken);

    if (!decoded) {
      return null;
    }

    // Check token in database
    const tokenHash = this.hashToken(refreshToken);
    const result = await query(
      `SELECT user_id as "userId", scopes, revoked_at as "revokedAt" FROM tokens
       WHERE refresh_token = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0 || result.rows[0].revokedAt) {
      return null;
    }

    const scopes = JSON.parse(result.rows[0].scopes);
    const newAccessToken = jwtHandler.createAccessToken(
      decoded.userId,
      email,
      scopes,
      metadata?.clientId
    );

    const expiresAt = new Date(Date.now() + this.accessTokenExpiry * 1000);

    // Update token record
    try {
      await query(
        `UPDATE tokens SET updated_at = NOW() WHERE refresh_token = $1`,
        [tokenHash]
      );

      await auditLogger.logAuthEvent(
        'auth.token_refreshed',
        decoded.userId,
        'Token refreshed',
        'success',
        {},
        metadata?.ipAddress,
        metadata?.userAgent
      );
    } catch (error) {
      console.error('Error updating token:', error);
    }

    return {
      accessToken: newAccessToken,
      expiresAt,
    };
  }

  /**
   * Revoke a token
   */
  async revokeToken(accessToken: string, userId: number): Promise<boolean> {
    const tokenHash = this.hashToken(accessToken);

    try {
      const result = await query(
        `UPDATE tokens
         SET revoked_at = NOW(), updated_at = NOW()
         WHERE access_token = $1 AND user_id = $2`,
        [tokenHash, userId]
      );

      if (result.rowCount === 0) {
        return false;
      }

      await auditLogger.logAuthEvent(
        'auth.token_revoked',
        userId,
        'Token revoked',
        'success'
      );

      return true;
    } catch (error) {
      await auditLogger.logAuthEvent(
        'auth.token_revoked',
        userId,
        'Token revocation failed',
        'failure',
        { error: String(error) }
      );
      return false;
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: number): Promise<number> {
    try {
      const result = await query(
        `UPDATE tokens SET revoked_at = NOW(), updated_at = NOW()
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId]
      );

      await auditLogger.logAuthEvent(
        'auth.token_revoked',
        userId,
        'All user tokens revoked',
        'success'
      );

      return result.rowCount || 0;
    } catch (error) {
      console.error('Error revoking all user tokens:', error);
      return 0;
    }
  }

  /**
   * Get active tokens for a user
   */
  async getUserTokens(userId: number): Promise<Omit<Token, 'accessToken' | 'refreshToken'>[]> {
    try {
      const result = await query(
        `SELECT
          id, user_id as "userId", scopes, client_id as "clientId",
          ip_address as "ipAddress", user_agent as "userAgent",
          expires_at as "expiresAt", refresh_expires_at as "refreshExpiresAt",
          revoked_at as "revokedAt", created_at as "createdAt"
         FROM tokens
         WHERE user_id = $1 AND revoked_at IS NULL
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map((row) => ({
        ...row,
        scopes: JSON.parse(row.scopes),
      }));
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      return [];
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM tokens
         WHERE refresh_expires_at < NOW() OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '30 days')`
      );

      return result.rowCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  /**
   * Hash a token for storage
   */
  private hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Get token statistics
   */
  async getTokenStats(userId: number): Promise<{
    activeTokens: number;
    revokedTokens: number;
    expiredTokens: number;
  }> {
    try {
      const result = await query(
        `SELECT
          SUM(CASE WHEN revoked_at IS NULL AND expires_at > NOW() THEN 1 ELSE 0 END) as "activeTokens",
          SUM(CASE WHEN revoked_at IS NOT NULL THEN 1 ELSE 0 END) as "revokedTokens",
          SUM(CASE WHEN revoked_at IS NULL AND expires_at <= NOW() THEN 1 ELSE 0 END) as "expiredTokens"
         FROM tokens
         WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { activeTokens: 0, revokedTokens: 0, expiredTokens: 0 };
      }

      return {
        activeTokens: result.rows[0].activeTokens || 0,
        revokedTokens: result.rows[0].revokedTokens || 0,
        expiredTokens: result.rows[0].expiredTokens || 0,
      };
    } catch (error) {
      console.error('Error fetching token stats:', error);
      return { activeTokens: 0, revokedTokens: 0, expiredTokens: 0 };
    }
  }
}

export const tokenManager = new TokenManager();
