// API Key Management Service
import crypto from 'crypto';
import { APIKey } from './types';

interface APIKeyCreateOptions {
  name: string;
  orgId: string;
  userId: string;
  scopes: string[];
  expiresIn?: number; // in days
  metadata?: Record<string, any>;
}

class APIKeyManager {
  private keys: Map<string, APIKey> = new Map();
  private keyLookup: Map<string, string> = new Map(); // hash -> id

  generateKey(): string {
    // Generate a URL-safe key: bs_[random]
    const random = crypto.randomBytes(32).toString('hex');
    return `bs_${random}`;
  }

  hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  createKey(options: APIKeyCreateOptions): { key: string; apiKey: APIKey } {
    const id = crypto.randomUUID();
    const keyValue = this.generateKey();
    const keyHash = this.hashKey(keyValue);
    const now = new Date();

    const apiKey: APIKey = {
      id,
      name: options.name,
      key: keyHash,
      orgId: options.orgId,
      userId: options.userId,
      scopes: options.scopes,
      active: true,
      createdAt: now,
      metadata: options.metadata,
    };

    if (options.expiresIn) {
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + options.expiresIn);
      apiKey.expiresAt = expiresAt;
    }

    this.keys.set(id, apiKey);
    this.keyLookup.set(keyHash, id);

    return {
      key: keyValue,
      apiKey: { ...apiKey, key: keyValue }, // Return unhashed for display
    };
  }

  validateKey(keyValue: string): { valid: boolean; apiKey?: APIKey } {
    const keyHash = this.hashKey(keyValue);
    const id = this.keyLookup.get(keyHash);

    if (!id) {
      return { valid: false };
    }

    const apiKey = this.keys.get(id);
    if (!apiKey) {
      return { valid: false };
    }

    // Check if active
    if (!apiKey.active) {
      return { valid: false };
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false };
    }

    // Update lastUsedAt
    apiKey.lastUsedAt = new Date();

    return { valid: true, apiKey };
  }

  getKey(keyId: string): APIKey | null {
    return this.keys.get(keyId) || null;
  }

  listKeys(orgId: string): APIKey[] {
    return Array.from(this.keys.values()).filter(k => k.orgId === orgId);
  }

  revokeKey(keyId: string): boolean {
    const key = this.keys.get(keyId);
    if (key) {
      key.active = false;
      return true;
    }
    return false;
  }

  updateKeyScopes(keyId: string, scopes: string[]): boolean {
    const key = this.keys.get(keyId);
    if (key) {
      key.scopes = scopes;
      return true;
    }
    return false;
  }

  deleteKey(keyId: string): boolean {
    const key = this.keys.get(keyId);
    if (key) {
      this.keyLookup.delete(key.key);
      this.keys.delete(keyId);
      return true;
    }
    return false;
  }

  hasScope(apiKey: APIKey, requiredScope: string): boolean {
    // Support wildcard scopes
    return (
      apiKey.scopes.includes(requiredScope) ||
      apiKey.scopes.includes('*') ||
      apiKey.scopes.some(
        scope =>
          scope.endsWith('.*') &&
          requiredScope.startsWith(scope.slice(0, -2))
      )
    );
  }

  checkScopes(apiKey: APIKey, requiredScopes: string[]): boolean {
    return requiredScopes.every(scope => this.hasScope(apiKey, scope));
  }
}

export const apiKeyManager = new APIKeyManager();

// OAuth Token Manager
interface OAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}

class OAuthTokenManager {
  private tokens: Map<string, OAuthToken> = new Map();

  generateAccessToken(userId: string, orgId: string): string {
    const payload = {
      userId,
      orgId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };
    // In production, use JWT signing
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  storeToken(userId: string, token: OAuthToken): void {
    this.tokens.set(userId, token);
  }

  getToken(userId: string): OAuthToken | null {
    return this.tokens.get(userId) || null;
  }

  isTokenValid(token: OAuthToken): boolean {
    return token.expiresAt > new Date();
  }

  revokeToken(userId: string): boolean {
    return this.tokens.delete(userId);
  }
}

export const oauthTokenManager = new OAuthTokenManager();
