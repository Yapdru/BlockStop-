import crypto from 'crypto';
import { query } from '@/lib/db';
import { tokenManager, Token } from './token-manager';
import { auditLogger } from './audit-logger';
import { scopeValidator, PermissionScope } from './scope-validator';

export interface OAuth2Client {
  id: string;
  secret?: string; // Only returned on creation
  secretHash: string;
  name: string;
  redirectUris: string[];
  scopes: PermissionScope[];
  rateLimit?: number;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: number;
  scopes: PermissionScope[];
  redirectUri: string;
  expiresAt: Date;
  used: boolean;
}

export interface OAuth2TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scopes: string;
}

export class OAuth2Server {
  private authCodeExpiry = 600; // 10 minutes
  private accessTokenExpiry = 3600; // 1 hour
  private refreshTokenExpiry = 86400 * 7; // 7 days

  /**
   * Register OAuth2 client
   */
  async registerClient(
    name: string,
    redirectUris: string[],
    scopes: PermissionScope[],
    isPublic: boolean = false,
    rateLimit?: number
  ): Promise<OAuth2Client> {
    const clientId = `oauth_${crypto.randomBytes(16).toString('hex')}`;
    const secret = crypto.randomBytes(32).toString('hex');
    const secretHash = this.hashSecret(secret);

    const sanitizedScopes = scopeValidator.sanitizeScopes(scopes);

    try {
      await query(
        `INSERT INTO oauth2_clients (
          client_id, secret_hash, name, redirect_uris, scopes,
          is_public, rate_limit, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())`,
        [
          clientId,
          secretHash,
          name,
          JSON.stringify(redirectUris),
          JSON.stringify(sanitizedScopes),
          isPublic,
          rateLimit || null,
        ]
      );

      return {
        id: clientId,
        secret, // Only returned on creation
        secretHash,
        name,
        redirectUris,
        scopes: sanitizedScopes,
        rateLimit,
        isPublic,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error registering OAuth2 client:', error);
      throw error;
    }
  }

  /**
   * Get OAuth2 client
   */
  async getClient(clientId: string): Promise<Omit<OAuth2Client, 'secret'> | null> {
    try {
      const result = await query(
        `SELECT
          client_id as "id", secret_hash as "secretHash", name,
          redirect_uris as "redirectUris", scopes, is_public as "isPublic",
          rate_limit as "rateLimit", is_active as "isActive",
          created_at as "createdAt", updated_at as "updatedAt"
         FROM oauth2_clients WHERE client_id = $1`,
        [clientId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        secretHash: row.secretHash,
        name: row.name,
        redirectUris: JSON.parse(row.redirectUris),
        scopes: JSON.parse(row.scopes),
        rateLimit: row.rateLimit,
        isPublic: row.isPublic,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    } catch (error) {
      console.error('Error fetching OAuth2 client:', error);
      return null;
    }
  }

  /**
   * Validate client credentials
   */
  async validateClientCredentials(clientId: string, secret: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT secret_hash as "secretHash" FROM oauth2_clients
         WHERE client_id = $1 AND is_active = true`,
        [clientId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const storedHash = result.rows[0].secretHash;
      return this.verifySecret(secret, storedHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Create authorization code (for authorization code flow)
   */
  async createAuthorizationCode(
    clientId: string,
    userId: number,
    redirectUri: string,
    scopes: PermissionScope[],
    ipAddress?: string
  ): Promise<string> {
    // Validate client and redirect URI
    const client = await this.getClient(clientId);
    if (!client || !client.redirectUris.includes(redirectUri)) {
      throw new Error('Invalid client or redirect URI');
    }

    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.authCodeExpiry * 1000);

    // Validate scopes against client scopes
    const validScopes = scopes.filter((scope) =>
      client.scopes.includes(scope)
    );

    if (validScopes.length === 0) {
      throw new Error('No valid scopes requested');
    }

    try {
      await query(
        `INSERT INTO oauth2_auth_codes (
          code, client_id, user_id, scopes, redirect_uri, expires_at, used, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
        [
          code,
          clientId,
          userId,
          JSON.stringify(validScopes),
          redirectUri,
          expiresAt,
        ]
      );

      await auditLogger.logOAuthEvent(
        'oauth.authorization_granted',
        userId,
        clientId,
        'Authorization code created',
        'success',
        { scopes: validScopes, redirectUri },
        ipAddress
      );

      return code;
    } catch (error) {
      await auditLogger.logOAuthEvent(
        'oauth.authorization_granted',
        userId,
        clientId,
        'Authorization code creation failed',
        'failure',
        { error: String(error) },
        ipAddress
      );
      throw error;
    }
  }

  /**
   * Exchange authorization code for tokens (authorization code flow)
   */
  async exchangeAuthorizationCode(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
    ipAddress?: string
  ): Promise<OAuth2TokenResponse | null> {
    // Validate client credentials
    const isValid = await this.validateClientCredentials(clientId, clientSecret);
    if (!isValid) {
      await auditLogger.logSecurityEvent(
        'security.suspicious_activity',
        'Invalid OAuth2 client credentials',
        'high',
        { clientId },
        undefined,
        ipAddress
      );
      return null;
    }

    try {
      // Get authorization code
      const result = await query(
        `SELECT
          user_id as "userId", scopes, redirect_uri as "redirectUri",
          expires_at as "expiresAt", used
         FROM oauth2_auth_codes
         WHERE code = $1 AND client_id = $2`,
        [code, clientId]
      );

      if (result.rows.length === 0) {
        await auditLogger.logOAuthEvent(
          'oauth.client_authenticated',
          0,
          clientId,
          'Authorization code not found',
          'failure',
          {},
          ipAddress
        );
        return null;
      }

      const authCode = result.rows[0];

      // Validate code expiry
      if (new Date() > new Date(authCode.expiresAt)) {
        return null;
      }

      // Check if code was already used
      if (authCode.used) {
        await auditLogger.logSecurityEvent(
          'security.suspicious_activity',
          'Authorization code reuse attempt',
          'critical',
          { clientId, userId: authCode.userId },
          authCode.userId,
          ipAddress
        );
        return null;
      }

      // Validate redirect URI
      if (authCode.redirectUri !== redirectUri) {
        return null;
      }

      const scopes: PermissionScope[] = JSON.parse(authCode.scopes);

      // Get user email for token creation
      const userResult = await query(
        'SELECT email FROM users WHERE id = $1',
        [authCode.userId]
      );

      if (userResult.rows.length === 0) {
        return null;
      }

      // Create tokens
      const tokens = await tokenManager.createTokens(
        authCode.userId,
        userResult.rows[0].email,
        scopes,
        { clientId }
      );

      // Mark code as used
      await query(
        'UPDATE oauth2_auth_codes SET used = true, updated_at = NOW() WHERE code = $1',
        [code]
      );

      await auditLogger.logOAuthEvent(
        'oauth.client_authenticated',
        authCode.userId,
        clientId,
        'Authorization code exchanged for tokens',
        'success',
        { scopes },
        ipAddress
      );

      return this.formatTokenResponse(tokens);
    } catch (error) {
      console.error('Error exchanging authorization code:', error);
      return null;
    }
  }

  /**
   * Client credentials flow (service account authentication)
   */
  async issueClientCredentialsToken(
    clientId: string,
    clientSecret: string,
    scopes: PermissionScope[],
    ipAddress?: string
  ): Promise<OAuth2TokenResponse | null> {
    // Validate client credentials
    const isValid = await this.validateClientCredentials(clientId, clientSecret);
    if (!isValid) {
      await auditLogger.logSecurityEvent(
        'security.suspicious_activity',
        'Invalid OAuth2 client credentials in CC flow',
        'high',
        { clientId },
        undefined,
        ipAddress
      );
      return null;
    }

    try {
      const client = await this.getClient(clientId);
      if (!client || !client.isActive) {
        return null;
      }

      // Validate scopes against client scopes
      const validScopes = scopes.filter((scope) =>
        client.scopes.includes(scope)
      );

      if (validScopes.length === 0) {
        return null;
      }

      // For service accounts, we create a token without a user
      // Use client ID as identifier
      const accessToken = `cc_${crypto.randomBytes(32).toString('hex')}`;
      const refreshToken = `ref_${crypto.randomBytes(32).toString('hex')}`;

      // Store client credentials token
      await query(
        `INSERT INTO oauth2_tokens (
          access_token, client_id, scopes, token_type, expires_at, created_at
        ) VALUES ($1, $2, $3, 'Bearer', NOW() + INTERVAL '1 hour', NOW())`,
        [
          this.hashToken(accessToken),
          clientId,
          JSON.stringify(validScopes),
        ]
      );

      await auditLogger.logOAuthEvent(
        'oauth.client_authenticated',
        0,
        clientId,
        'Client credentials token issued',
        'success',
        { scopes: validScopes },
        ipAddress
      );

      return {
        accessToken,
        refreshToken: '',
        tokenType: 'Bearer',
        expiresIn: this.accessTokenExpiry,
        scopes: validScopes.join(' '),
      };
    } catch (error) {
      console.error('Error issuing client credentials token:', error);
      return null;
    }
  }

  /**
   * Validate OAuth2 token
   */
  async validateOAuth2Token(token: string): Promise<{ valid: boolean; clientId?: string; scopes?: string[] }> {
    try {
      const tokenHash = this.hashToken(token);
      const result = await query(
        `SELECT client_id as "clientId", scopes FROM oauth2_tokens
         WHERE access_token = $1 AND expires_at > NOW()`,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        return { valid: false };
      }

      return {
        valid: true,
        clientId: result.rows[0].clientId,
        scopes: JSON.parse(result.rows[0].scopes),
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Revoke authorization
   */
  async revokeAuthorization(
    clientId: string,
    userId: number,
    ipAddress?: string
  ): Promise<boolean> {
    try {
      // Revoke all tokens for this client-user combination
      const result = await query(
        `DELETE FROM oauth2_tokens
         WHERE client_id = $1 AND user_id = $2`,
        [clientId, userId]
      );

      // Delete unused authorization codes
      await query(
        `DELETE FROM oauth2_auth_codes
         WHERE client_id = $1 AND user_id = $2 AND used = false`,
        [clientId, userId]
      );

      await auditLogger.logOAuthEvent(
        'oauth.authorization_revoked',
        userId,
        clientId,
        'Authorization revoked',
        'success',
        {},
        ipAddress
      );

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error revoking authorization:', error);
      return false;
    }
  }

  /**
   * Get authorized clients for a user
   */
  async getUserAuthorizedClients(userId: number): Promise<OAuth2Client[]> {
    try {
      const result = await query(
        `SELECT DISTINCT
          c.client_id as "id", c.secret_hash as "secretHash", c.name,
          c.redirect_uris as "redirectUris", c.scopes, c.is_public as "isPublic",
          c.rate_limit as "rateLimit", c.is_active as "isActive",
          c.created_at as "createdAt", c.updated_at as "updatedAt"
         FROM oauth2_clients c
         JOIN oauth2_tokens t ON c.client_id = t.client_id
         WHERE t.user_id = $1`,
        [userId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        secretHash: row.secretHash,
        name: row.name,
        redirectUris: JSON.parse(row.redirectUris),
        scopes: JSON.parse(row.scopes),
        rateLimit: row.rateLimit,
        isPublic: row.isPublic,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching user authorized clients:', error);
      return [];
    }
  }

  /**
   * Hash client secret for storage
   */
  private hashSecret(secret: string): string {
    return crypto
      .createHash('sha256')
      .update(secret)
      .digest('hex');
  }

  /**
   * Verify client secret
   */
  private verifySecret(secret: string, hash: string): boolean {
    const secretHash = this.hashSecret(secret);
    return secretHash === hash;
  }

  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  /**
   * Format token response
   */
  private formatTokenResponse(tokens: Token): OAuth2TokenResponse {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenExpiry,
      scopes: tokens.scopes.join(' '),
    };
  }
}

export const oauth2Server = new OAuth2Server();
