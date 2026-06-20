import crypto from 'crypto';
import { query } from '@/lib/db';

/**
 * Credential object
 */
export interface Credential {
  credentialId: string;
  userId: string;
  type: 'password' | 'api-key' | 'oauth' | 'saml';
  createdAt: Date;
  expiresAt?: Date;
  rotatedAt?: Date;
  riskScore: number;
  status: 'active' | 'revoked' | 'compromised';
}

/**
 * Credential Manager for Zero Trust Architecture
 * Manages credential lifecycle, rotation, and health
 */
export class CredentialManager {
  private readonly API_KEY_LENGTH = 32;
  private readonly API_KEY_PREFIX = 'bst_';
  private readonly CREDENTIAL_ROTATION_DAYS = 90;
  private readonly CREDENTIAL_EXPIRY_DAYS = 365;

  /**
   * Create new credential for user
   */
  async createCredential(userId: string, type: string): Promise<Credential> {
    try {
      const credentialId = crypto.randomUUID();
      const now = new Date();
      let secret = '';
      let hashedSecret = '';

      if (type === 'api-key') {
        secret = this.generateAPIKey();
        hashedSecret = this.hashSecret(secret);
      }

      // Calculate expiry based on type
      let expiresAt = new Date(now.getTime() + this.CREDENTIAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      // Insert credential
      await query(
        `INSERT INTO credentials (id, user_id, type, secret_hash, created_at, expires_at, status, risk_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [credentialId, userId, type, hashedSecret, now, expiresAt, 'active', 0]
      );

      // Log credential creation
      await query(
        `INSERT INTO audit_logs (user_id, action, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, 'credential_created', `Type: ${type}, ID: ${credentialId}`]
      );

      return {
        credentialId,
        userId,
        type: type as 'password' | 'api-key' | 'oauth' | 'saml',
        createdAt: now,
        expiresAt,
        riskScore: 0,
        status: 'active',
      };
    } catch (error) {
      console.error('Credential creation error:', error);
      throw error;
    }
  }

  /**
   * Validate credential using secret
   */
  async validateCredential(credentialId: string, secret: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT secret_hash, status, expires_at FROM credentials WHERE id = $1`,
        [credentialId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const credential = result.rows[0];
      const now = new Date();

      // Check status
      if (credential.status !== 'active') {
        return false;
      }

      // Check expiry
      if (credential.expires_at && new Date(credential.expires_at) < now) {
        return false;
      }

      // Verify secret hash
      const hashedSecret = this.hashSecret(secret);
      return hashedSecret === credential.secret_hash;
    } catch (error) {
      console.error('Credential validation error:', error);
      return false;
    }
  }

  /**
   * Rotate credential (generate new secret, mark old as rotated)
   */
  async rotateCredential(credentialId: string): Promise<Credential> {
    try {
      // Get existing credential
      const result = await query(
        `SELECT user_id, type, created_at FROM credentials WHERE id = $1`,
        [credentialId]
      );

      if (result.rows.length === 0) {
        throw new Error('Credential not found');
      }

      const credential = result.rows[0];
      const userId = credential.user_id;
      const type = credential.type;
      const now = new Date();

      // Mark old credential as rotated
      await query(
        `UPDATE credentials SET status = 'revoked', rotated_at = NOW() WHERE id = $1`,
        [credentialId]
      );

      // Create new credential
      const newSecret = type === 'api-key' ? this.generateAPIKey() : '';
      const hashedSecret = newSecret ? this.hashSecret(newSecret) : '';
      const newCredentialId = crypto.randomUUID();

      const expiresAt = new Date(now.getTime() + this.CREDENTIAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      await query(
        `INSERT INTO credentials (id, user_id, type, secret_hash, created_at, expires_at, status, risk_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newCredentialId, userId, type, hashedSecret, now, expiresAt, 'active', 0]
      );

      // Log rotation
      await query(
        `INSERT INTO audit_logs (user_id, action, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, 'credential_rotated', `Old ID: ${credentialId}, New ID: ${newCredentialId}`]
      );

      return {
        credentialId: newCredentialId,
        userId,
        type: type as 'password' | 'api-key' | 'oauth' | 'saml',
        createdAt: now,
        expiresAt,
        rotatedAt: now,
        riskScore: 0,
        status: 'active',
      };
    } catch (error) {
      console.error('Credential rotation error:', error);
      throw error;
    }
  }

  /**
   * Revoke credential
   */
  async revokeCredential(credentialId: string): Promise<void> {
    try {
      const result = await query(
        `SELECT user_id FROM credentials WHERE id = $1`,
        [credentialId]
      );

      if (result.rows.length === 0) {
        throw new Error('Credential not found');
      }

      const userId = result.rows[0].user_id;

      // Mark as revoked
      await query(
        `UPDATE credentials SET status = 'revoked' WHERE id = $1`,
        [credentialId]
      );

      // Log revocation
      await query(
        `INSERT INTO audit_logs (user_id, action, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, 'credential_revoked', `Credential ID: ${credentialId}`]
      );
    } catch (error) {
      console.error('Credential revocation error:', error);
      throw error;
    }
  }

  /**
   * Check credential health for user
   */
  async checkCredentialHealth(userId: string): Promise<{ healthy: boolean; issues: string[] }> {
    try {
      const issues: string[] = [];

      // Get all credentials for user
      const result = await query(
        `SELECT id, type, created_at, expires_at, risk_score, status FROM credentials WHERE user_id = $1 AND status = 'active'`,
        [userId]
      );

      if (result.rows.length === 0) {
        issues.push('No active credentials found');
        return { healthy: false, issues };
      }

      const now = new Date();

      for (const cred of result.rows) {
        // Check if expired
        if (cred.expires_at && new Date(cred.expires_at) < now) {
          issues.push(`${cred.type} credential has expired`);
        }

        // Check if needs rotation
        const createdDate = new Date(cred.created_at);
        const daysOld = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld > this.CREDENTIAL_ROTATION_DAYS) {
          issues.push(`${cred.type} credential needs rotation (${Math.floor(daysOld)} days old)`);
        }

        // Check risk score
        if (cred.risk_score > 0.7) {
          issues.push(`${cred.type} credential has high risk score: ${cred.risk_score}`);
        }
      }

      return {
        healthy: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error('Credential health check error:', error);
      return {
        healthy: false,
        issues: ['Health check error'],
      };
    }
  }

  /**
   * Detect compromised credentials
   */
  async detectCompromisedCredentials(userId: string): Promise<Credential[]> {
    try {
      // Query for credentials with high risk scores or suspicious activity
      const result = await query(
        `SELECT id, user_id as "userId", type, created_at as "createdAt", expires_at as "expiresAt",
                rotated_at as "rotatedAt", risk_score as "riskScore", status
         FROM credentials
         WHERE user_id = $1 AND (risk_score > 0.8 OR status = 'compromised')
         ORDER BY risk_score DESC`,
        [userId]
      );

      return result.rows.map(row => ({
        credentialId: row.id,
        userId: row.userId,
        type: row.type as 'password' | 'api-key' | 'oauth' | 'saml',
        createdAt: new Date(row.createdAt),
        expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
        rotatedAt: row.rotatedAt ? new Date(row.rotatedAt) : undefined,
        riskScore: row.riskScore,
        status: row.status as 'active' | 'revoked' | 'compromised',
      }));
    } catch (error) {
      console.error('Detect compromised credentials error:', error);
      return [];
    }
  }

  /**
   * Mark credential as compromised
   */
  async markCompromised(credentialId: string): Promise<void> {
    try {
      const result = await query(
        `SELECT user_id FROM credentials WHERE id = $1`,
        [credentialId]
      );

      if (result.rows.length === 0) {
        throw new Error('Credential not found');
      }

      const userId = result.rows[0].user_id;

      // Mark as compromised and set high risk score
      await query(
        `UPDATE credentials SET status = 'compromised', risk_score = 1.0 WHERE id = $1`,
        [credentialId]
      );

      // Log compromise
      await query(
        `INSERT INTO audit_logs (user_id, action, details, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, 'credential_compromised', `Credential ID: ${credentialId}`]
      );

      // Optionally revoke all other credentials
      // This could be triggered by admin or security settings
    } catch (error) {
      console.error('Mark compromised error:', error);
      throw error;
    }
  }

  /**
   * Update credential risk score
   */
  async updateRiskScore(credentialId: string, riskScore: number): Promise<void> {
    try {
      // Clamp risk score between 0 and 1
      const clampedScore = Math.max(0, Math.min(1, riskScore));

      await query(
        `UPDATE credentials SET risk_score = $2 WHERE id = $1`,
        [credentialId, clampedScore]
      );
    } catch (error) {
      console.error('Update risk score error:', error);
      throw error;
    }
  }

  /**
   * Generate API key
   */
  private generateAPIKey(): string {
    const randomBytes = crypto.randomBytes(this.API_KEY_LENGTH);
    const randomString = randomBytes.toString('hex');
    return `${this.API_KEY_PREFIX}${randomString}`;
  }

  /**
   * Hash secret using SHA-256
   */
  private hashSecret(secret: string): string {
    return crypto
      .createHash('sha256')
      .update(secret)
      .digest('hex');
  }

  /**
   * Get user credentials summary
   */
  async getCredentialsSummary(userId: string): Promise<{
    total: number;
    active: number;
    revoked: number;
    compromised: number;
    needsRotation: number;
  }> {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked,
          SUM(CASE WHEN status = 'compromised' THEN 1 ELSE 0 END) as compromised,
          SUM(CASE WHEN status = 'active' AND created_at < NOW() - INTERVAL '90 days' THEN 1 ELSE 0 END) as needs_rotation
         FROM credentials WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          total: 0,
          active: 0,
          revoked: 0,
          compromised: 0,
          needsRotation: 0,
        };
      }

      const row = result.rows[0];
      return {
        total: parseInt(row.total) || 0,
        active: parseInt(row.active) || 0,
        revoked: parseInt(row.revoked) || 0,
        compromised: parseInt(row.compromised) || 0,
        needsRotation: parseInt(row.needs_rotation) || 0,
      };
    } catch (error) {
      console.error('Get credentials summary error:', error);
      return {
        total: 0,
        active: 0,
        revoked: 0,
        compromised: 0,
        needsRotation: 0,
      };
    }
  }
}

export const credentialManager = new CredentialManager();
