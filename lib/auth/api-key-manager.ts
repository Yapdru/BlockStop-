import { query } from '@/lib/db';
import crypto from 'crypto';
import { auditLogger } from './audit-logger';
import { PermissionScope, scopeValidator } from './scope-validator';

export interface APIKey {
  id: string;
  key: string; // Only returned on creation
  keyHash: string; // Stored in DB
  name: string;
  userId: number;
  scopes: PermissionScope[];
  ipWhitelist?: string[];
  rateLimit?: number; // requests per hour
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface APIKeyCreateRequest {
  name: string;
  scopes: PermissionScope[];
  ipWhitelist?: string[];
  rateLimit?: number;
  expiresIn?: number; // seconds, optional (default: no expiry)
}

export class APIKeyManager {
  /**
   * Generate a new API key
   */
  generateKey(): string {
    return `sk_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Hash an API key
   */
  private hashKey(key: string): string {
    return crypto
      .createHash('sha256')
      .update(key)
      .digest('hex');
  }

  /**
   * Create a new API key
   */
  async createAPIKey(
    userId: number,
    request: APIKeyCreateRequest,
    ipAddress?: string
  ): Promise<APIKey> {
    const key = this.generateKey();
    const keyHash = this.hashKey(key);
    const id = crypto.randomBytes(16).toString('hex');

    // Sanitize scopes
    const sanitizedScopes = scopeValidator.sanitizeScopes(request.scopes);

    const expiresAt = request.expiresIn
      ? new Date(Date.now() + request.expiresIn * 1000)
      : null;

    try {
      await query(
        `INSERT INTO api_keys (
          id, user_id, key_hash, name, scopes, ip_whitelist,
          rate_limit, expires_at, created_at, updated_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), true)`,
        [
          id,
          userId,
          keyHash,
          request.name,
          JSON.stringify(sanitizedScopes),
          request.ipWhitelist ? JSON.stringify(request.ipWhitelist) : null,
          request.rateLimit || null,
          expiresAt,
        ]
      );

      // Log the event
      await auditLogger.logApiKeyEvent(
        'apikey.created',
        userId,
        id,
        'API key created',
        'success',
        {
          name: request.name,
          scopes: sanitizedScopes,
          hasRateLimit: !!request.rateLimit,
        },
        ipAddress
      );

      return {
        id,
        key, // Only returned on creation
        keyHash,
        name: request.name,
        userId,
        scopes: sanitizedScopes,
        ipWhitelist: request.ipWhitelist,
        rateLimit: request.rateLimit,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };
    } catch (error) {
      await auditLogger.logApiKeyEvent(
        'apikey.created',
        userId,
        id,
        'API key creation failed',
        'failure',
        { error: String(error) },
        ipAddress
      );
      throw error;
    }
  }

  /**
   * Validate an API key
   */
  async validateAPIKey(key: string, ipAddress?: string): Promise<APIKey | null> {
    const keyHash = this.hashKey(key);

    try {
      const result = await query(
        `SELECT
          id, user_id as "userId", key_hash as "keyHash", name, scopes,
          ip_whitelist as "ipWhitelist", rate_limit as "rateLimit",
          last_used as "lastUsed", expires_at as "expiresAt",
          created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"
         FROM api_keys
         WHERE key_hash = $1 AND is_active = true`,
        [keyHash]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const apiKey = result.rows[0];

      // Check expiry
      if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
        return null;
      }

      // Check IP whitelist
      if (apiKey.ipWhitelist && ipAddress) {
        const whitelist = JSON.parse(apiKey.ipWhitelist);
        if (!whitelist.includes(ipAddress)) {
          await auditLogger.logSecurityEvent(
            'security.suspicious_activity',
            'API key used from unauthorized IP',
            'high',
            { apiKeyId: apiKey.id, attemptedIp: ipAddress },
            apiKey.userId,
            ipAddress
          );
          return null;
        }
      }

      return {
        ...apiKey,
        key: '', // Don't return the actual key
        scopes: JSON.parse(apiKey.scopes),
        ipWhitelist: apiKey.ipWhitelist ? JSON.parse(apiKey.ipWhitelist) : undefined,
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  /**
   * Record API key usage
   */
  async recordKeyUsage(keyId: string, ipAddress?: string): Promise<void> {
    try {
      await query(
        `UPDATE api_keys
         SET last_used = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [keyId]
      );

      // Log minimal usage event
      await auditLogger.logApiKeyEvent(
        'apikey.used',
        0, // We don't know the user at this point
        keyId,
        'API key used',
        'success',
        {},
        ipAddress
      );
    } catch (error) {
      console.error('Error recording key usage:', error);
    }
  }

  /**
   * Revoke an API key
   */
  async revokeAPIKey(
    keyId: string,
    userId: number,
    ipAddress?: string
  ): Promise<void> {
    try {
      await query(
        `UPDATE api_keys
         SET is_active = false, updated_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [keyId, userId]
      );

      await auditLogger.logApiKeyEvent(
        'apikey.revoked',
        userId,
        keyId,
        'API key revoked',
        'success',
        {},
        ipAddress
      );
    } catch (error) {
      await auditLogger.logApiKeyEvent(
        'apikey.revoked',
        userId,
        keyId,
        'API key revocation failed',
        'failure',
        { error: String(error) },
        ipAddress
      );
      throw error;
    }
  }

  /**
   * Get all API keys for a user
   */
  async getUserAPIKeys(userId: number): Promise<Omit<APIKey, 'key'>[]> {
    try {
      const result = await query(
        `SELECT
          id, user_id as "userId", key_hash as "keyHash", name, scopes,
          ip_whitelist as "ipWhitelist", rate_limit as "rateLimit",
          last_used as "lastUsed", expires_at as "expiresAt",
          created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"
         FROM api_keys
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map((row) => ({
        ...row,
        key: '', // Never return the actual key
        scopes: JSON.parse(row.scopes),
        ipWhitelist: row.ipWhitelist ? JSON.parse(row.ipWhitelist) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching user API keys:', error);
      return [];
    }
  }

  /**
   * Rotate an API key (create new, revoke old)
   */
  async rotateAPIKey(
    oldKeyId: string,
    userId: number,
    ipAddress?: string
  ): Promise<APIKey> {
    try {
      // Get old key details
      const oldKeyResult = await query(
        `SELECT
          name, scopes, ip_whitelist as "ipWhitelist",
          rate_limit as "rateLimit", expires_at as "expiresAt"
         FROM api_keys
         WHERE id = $1 AND user_id = $2`,
        [oldKeyId, userId]
      );

      if (oldKeyResult.rows.length === 0) {
        throw new Error('API key not found');
      }

      const oldKey = oldKeyResult.rows[0];

      // Create new key with same settings
      const newKey = await this.createAPIKey(
        userId,
        {
          name: `${oldKey.name} (rotated)`,
          scopes: JSON.parse(oldKey.scopes),
          ipWhitelist: oldKey.ipWhitelist ? JSON.parse(oldKey.ipWhitelist) : undefined,
          rateLimit: oldKey.rateLimit,
        },
        ipAddress
      );

      // Revoke old key
      await this.revokeAPIKey(oldKeyId, userId, ipAddress);

      await auditLogger.logApiKeyEvent(
        'apikey.rotated',
        userId,
        oldKeyId,
        'API key rotated',
        'success',
        { newKeyId: newKey.id },
        ipAddress
      );

      return newKey;
    } catch (error) {
      await auditLogger.logApiKeyEvent(
        'apikey.rotated',
        userId,
        oldKeyId,
        'API key rotation failed',
        'failure',
        { error: String(error) },
        ipAddress
      );
      throw error;
    }
  }

  /**
   * Get API key by ID
   */
  async getAPIKeyById(keyId: string, userId: number): Promise<Omit<APIKey, 'key'> | null> {
    try {
      const result = await query(
        `SELECT
          id, user_id as "userId", key_hash as "keyHash", name, scopes,
          ip_whitelist as "ipWhitelist", rate_limit as "rateLimit",
          last_used as "lastUsed", expires_at as "expiresAt",
          created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"
         FROM api_keys
         WHERE id = $1 AND user_id = $2`,
        [keyId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        key: '',
        scopes: JSON.parse(row.scopes),
        ipWhitelist: row.ipWhitelist ? JSON.parse(row.ipWhitelist) : undefined,
      };
    } catch (error) {
      console.error('Error fetching API key:', error);
      return null;
    }
  }

  /**
   * Update API key
   */
  async updateAPIKey(
    keyId: string,
    userId: number,
    updates: Partial<APIKeyCreateRequest>,
    ipAddress?: string
  ): Promise<Omit<APIKey, 'key'> | null> {
    try {
      let updateQuery = 'UPDATE api_keys SET updated_at = NOW()';
      const params: unknown[] = [];
      let paramIdx = 1;

      if (updates.name) {
        updateQuery += `, name = $${paramIdx}`;
        params.push(updates.name);
        paramIdx++;
      }

      if (updates.scopes) {
        const sanitizedScopes = scopeValidator.sanitizeScopes(updates.scopes);
        updateQuery += `, scopes = $${paramIdx}`;
        params.push(JSON.stringify(sanitizedScopes));
        paramIdx++;
      }

      if (updates.ipWhitelist) {
        updateQuery += `, ip_whitelist = $${paramIdx}`;
        params.push(JSON.stringify(updates.ipWhitelist));
        paramIdx++;
      }

      if (updates.rateLimit !== undefined) {
        updateQuery += `, rate_limit = $${paramIdx}`;
        params.push(updates.rateLimit);
        paramIdx++;
      }

      updateQuery += ` WHERE id = $${paramIdx} AND user_id = $${paramIdx + 1}`;
      params.push(keyId, userId);

      const result = await query(updateQuery, params);

      if (result.rowCount === 0) {
        return null;
      }

      return this.getAPIKeyById(keyId, userId);
    } catch (error) {
      console.error('Error updating API key:', error);
      return null;
    }
  }
}

export const apiKeyManager = new APIKeyManager();
