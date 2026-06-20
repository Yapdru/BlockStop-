/**
 * Authentication System Types
 * Extension to /types/auth.ts with OAuth2 and advanced auth types
 */

import { PermissionScope } from './scope-validator';

// ============================================================================
// OAuth2 Types
// ============================================================================

export type OAuth2GrantType = 'authorization_code' | 'client_credentials' | 'refresh_token';

export type OAuth2FlowType = 'authorization_code' | 'implicit' | 'client_credentials' | 'device_code';

export interface OAuth2Config {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revokeEndpoint: string;
  introspectEndpoint: string;
  userInfoEndpoint?: string;
  scopeDelimiter: string;
  accessTokenExpiry: number; // seconds
  refreshTokenExpiry: number; // seconds
}

export interface OAuth2AuthorizationRequest {
  clientId: string;
  responseType: 'code' | 'token';
  redirectUri: string;
  scopes: PermissionScope[];
  state?: string;
  nonce?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}

export interface OAuth2TokenRequest {
  grantType: OAuth2GrantType;
  clientId: string;
  clientSecret?: string;
  code?: string;
  redirectUri?: string;
  refreshToken?: string;
  scope?: string;
  codeVerifier?: string;
}

export interface OAuth2TokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  scope?: string;
  idToken?: string;
}

export interface OAuth2ErrorResponse {
  error: 'invalid_request' | 'invalid_client' | 'invalid_grant' | 'unauthorized_client' |
          'unsupported_grant_type' | 'unsupported_response_type' | 'invalid_scope' |
          'server_error' | 'temporarily_unavailable';
  errorDescription?: string;
  errorUri?: string;
  state?: string;
}

// ============================================================================
// API Key Types
// ============================================================================

export interface APIKeyCreationOptions {
  name: string;
  description?: string;
  scopes: PermissionScope[];
  expiresIn?: number; // seconds
  rateLimit?: number; // requests per hour
  ipWhitelist?: string[];
  metadata?: Record<string, unknown>;
}

export interface APIKeyValidationResult {
  valid: boolean;
  keyId?: string;
  userId?: number;
  scopes?: PermissionScope[];
  isExpired?: boolean;
  isRevoked?: boolean;
  ipAllowed?: boolean;
  rateLimitExceeded?: boolean;
}

export interface APIKeyUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastUsed?: Date;
  averageRequestsPerHour: number;
}

// ============================================================================
// JWT Types
// ============================================================================

export interface JWTClaimsSet {
  iss?: string; // Issuer
  sub?: string; // Subject
  aud?: string | string[]; // Audience
  exp?: number; // Expiration time
  nbf?: number; // Not before
  iat?: number; // Issued at
  jti?: string; // JWT ID
  scope?: string;
  clientId?: string;
  [key: string]: unknown;
}

export interface JWTSigningOptions {
  algorithm: 'HS256' | 'RS256' | 'ES256';
  expiresIn: number;
  issuer?: string;
  audience?: string | string[];
  subject?: string;
  jwtId?: string;
  header?: Record<string, unknown>;
}

export interface JWTVerificationOptions {
  algorithms: string[];
  issuer?: string;
  audience?: string | string[];
  subject?: string;
  clockTolerance: number; // seconds
}

// ============================================================================
// Token Types
// ============================================================================

export interface TokenCreationOptions {
  userId: number;
  email: string;
  scopes: PermissionScope[];
  clientId?: string;
  expiresIn?: number;
  refreshTokenExpiresIn?: number;
  metadata?: Record<string, unknown>;
}

export interface TokenMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  fingerprint?: string;
  sessionId?: string;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: JWTClaimsSet;
  isExpired?: boolean;
  isRevoked?: boolean;
  errors?: string[];
}

// ============================================================================
// Session Types
// ============================================================================

export interface SessionConfig {
  sessionId: string;
  userId: number;
  tokenId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: DeviceInfo;
  expiresAt: Date;
  createdAt: Date;
  lastActivity: Date;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  osName: string;
  osVersion: string;
  browserName?: string;
  browserVersion?: string;
  isTrusted?: boolean;
}

// ============================================================================
// Scope Types
// ============================================================================

export interface ScopePermission {
  scope: PermissionScope;
  description: string;
  category: 'read' | 'write' | 'admin' | 'management';
  requiresMFA?: boolean;
  requiresApproval?: boolean;
}

export interface ScopePolicy {
  scopes: PermissionScope[];
  allowWildcards: boolean;
  requireApproval: boolean;
  requireMFA: boolean;
}

// ============================================================================
// Audit Types
// ============================================================================

export type AuditEventCategory = 'auth' | 'apikey' | 'oauth' | 'scope' | 'session' | 'mfa' |
                                 'ipwhitelist' | 'ratelimit' | 'security' | 'admin';

export interface AuditEventMetadata {
  requestId?: string;
  correlationId?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  deviceId?: string;
  sessionId?: string;
  tokenId?: string;
  additionalInfo?: Record<string, unknown>;
}

export interface AuditSearchOptions {
  userId?: number;
  eventType?: string;
  category?: AuditEventCategory;
  status?: 'success' | 'failure';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'severity' | 'eventType';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
  windowSize: number; // seconds
}

export interface RateLimitStatus {
  remaining: number;
  limit: number;
  reset: Date;
  exceeded: boolean;
}

// ============================================================================
// Multi-Factor Authentication Types
// ============================================================================

export type MFAMethod = 'totp' | 'sms' | 'email' | 'webauthn' | 'backup_codes';

export interface MFAConfig {
  method: MFAMethod;
  enabled: boolean;
  verified: boolean;
  backupCodesCount?: number;
  failedAttempts?: number;
  lockedUntil?: Date;
}

export interface MFAChallengeRequest {
  userId: number;
  method: MFAMethod;
  challenge: string;
  expiresAt: Date;
}

export interface MFAVerificationRequest {
  userId: number;
  method: MFAMethod;
  code: string;
  rememberDevice?: boolean;
}

// ============================================================================
// IP Whitelist Types
// ============================================================================

export interface IPWhitelistEntry {
  id: string;
  ipAddress: string;
  description?: string;
  expiresAt?: Date;
  isActive: boolean;
}

export interface IPValidationResult {
  allowed: boolean;
  entry?: IPWhitelistEntry;
  reason?: string;
}

// ============================================================================
// HMAC Signature Types
// ============================================================================

export interface HMACSignatureConfig {
  algorithm: 'SHA256' | 'SHA512' | 'SHA1';
  secret: string;
  encoding: 'hex' | 'base64' | 'utf8';
}

export interface HMACSignatureValidation {
  valid: boolean;
  timestamp: number;
  algorithm: string;
  errors?: string[];
}

// ============================================================================
// Authentication Context
// ============================================================================

export interface AuthContext {
  userId?: number;
  email?: string;
  scopes: PermissionScope[];
  authMethod: 'api-key' | 'jwt' | 'oauth2' | 'session' | 'mfa';
  clientId?: string;
  sessionId?: string;
  tokenId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  issuedAt: Date;
  expiresAt: Date;
  permissions?: PermissionScope[];
}

export interface AuthzContext extends AuthContext {
  resourceId?: string;
  resourceType?: string;
  action: string;
  environment?: Record<string, unknown>;
}

// ============================================================================
// Error Types
// ============================================================================

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403,
    public requiredScopes?: PermissionScope[]
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class TokenError extends Error {
  constructor(
    message: string,
    public code: 'INVALID' | 'EXPIRED' | 'REVOKED' | 'MALFORMED',
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'TokenError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public statusCode: number = 429
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AuthSystemConfig {
  // JWT Configuration
  jwt: {
    accessTokenExpiry: number; // seconds
    refreshTokenExpiry: number; // seconds
    algorithm: 'HS256' | 'RS256' | 'ES256';
    issuer: string;
    audience?: string;
  };

  // OAuth2 Configuration
  oauth2: {
    authorizationCodeExpiry: number;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    enablePKCE: boolean;
  };

  // API Key Configuration
  apiKey: {
    defaultExpiry?: number;
    defaultRateLimit: number;
    enableIPWhitelist: boolean;
  };

  // Security Configuration
  security: {
    enableMFA: boolean;
    requireMFAForAdmins: boolean;
    sessionTimeout: number;
    enableAuditLogging: boolean;
    enableRateLimiting: boolean;
  };

  // Database Configuration
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}
