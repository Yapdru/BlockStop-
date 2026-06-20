/**
 * BlockStop Phase 16: Enterprise API & Integrations
 * Type definitions for API, webhooks, and integrations
 */

// ===== API Key Types =====
export interface APIKey {
  id: number;
  org_id: number;
  name: string;
  key: string;
  secret?: string;
  scopes: string[];
  rate_limit: number;
  ip_whitelist?: string[];
  last_used?: Date;
  created_at: Date;
  expires_at?: Date;
  is_active: boolean;
  created_by: number;
}

export interface APIKeyRequest {
  name: string;
  scopes?: string[];
  rate_limit?: number;
  ip_whitelist?: string[];
  expires_in_days?: number;
}

export interface APIKeyResponse {
  id: number;
  name: string;
  key: string;
  secret: string;
  scopes: string[];
  created_at: Date;
  expires_at?: Date;
}

// ===== OAuth2 Types =====
export interface OAuth2Client {
  id: number;
  client_id: string;
  client_secret?: string;
  name: string;
  redirect_uris: string[];
  allowed_scopes: string[];
  is_confidential: boolean;
  is_active: boolean;
  created_at: Date;
}

export interface OAuth2Token {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface AuthorizationCodeRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state?: string;
}

export interface TokenRequest {
  grant_type: 'authorization_code' | 'refresh_token' | 'client_credentials';
  code?: string;
  refresh_token?: string;
  client_id: string;
  client_secret?: string;
  redirect_uri?: string;
  scope?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// ===== Webhook Types =====
export interface Webhook {
  id: number;
  org_id: number;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_delivery_at?: Date;
  delivery_status: 'pending' | 'success' | 'failed';
  retry_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookRequest {
  url: string;
  events: string[];
}

export interface WebhookUpdateRequest {
  url?: string;
  events?: string[];
  is_active?: boolean;
}

export interface WebhookEvent {
  id: bigint;
  webhook_id: number;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed';
  delivery_attempts: number;
  last_attempt_at?: Date;
  created_at: Date;
}

export interface WebhookPayload {
  id: string;
  timestamp: Date;
  event_type: string;
  org_id: number;
  data: Record<string, any>;
  signature: string;
}

// ===== Integration Types =====
export interface Integration {
  id: number;
  org_id: number;
  integration_type: string;
  integration_name: string;
  config: Record<string, any>;
  is_active: boolean;
  last_sync_at?: Date;
  health_status: 'healthy' | 'degraded' | 'unhealthy';
  created_at: Date;
}

export interface IntegrationConnection {
  id: number;
  org_id: number;
  integration_type: string;
  integration_name: string;
  config: Record<string, any>;
  auth_token?: string;
  is_active: boolean;
  last_sync_at?: Date;
  health_status: 'healthy' | 'degraded' | 'unhealthy';
  last_error?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IntegrationConnectRequest {
  config: Record<string, any>;
  auth_token?: string;
  auth_refresh_token?: string;
}

export interface IntegrationHealthMetrics {
  id: number;
  integration_connection_id: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  error_count: number;
  success_count: number;
  checked_at: Date;
}

// ===== Event Types =====
export type EventType =
  | 'threat.detected'
  | 'scan.completed'
  | 'alert.triggered'
  | 'organization.created'
  | 'integration.connected'
  | 'api.rate_limit_exceeded'
  | 'security.breach_detected'
  | 'policy.updated'
  | 'team.created'
  | 'user.invited';

export interface Event {
  id: string;
  type: EventType;
  timestamp: Date;
  org_id: number;
  resource_type: string;
  resource_id: string | number;
  data: Record<string, any>;
  user_id?: number;
}

export interface ThreatDetectedEvent extends Event {
  type: 'threat.detected';
  data: {
    threat_id: number;
    threat_type: string;
    risk_score: number;
    source: string;
    details: Record<string, any>;
  };
}

export interface ScanCompletedEvent extends Event {
  type: 'scan.completed';
  data: {
    scan_id: number;
    status: string;
    threats_detected: number;
    results: Record<string, any>;
  };
}

// ===== API Response Types =====
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  pagination?: PaginationMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  request_id: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  cursor?: string;
  next_cursor?: string;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  cursor?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ===== Authentication Context =====
export interface AuthContext {
  user_id?: number;
  org_id: number;
  scopes: string[];
  api_key_id?: number;
  client_id?: string;
  auth_method: 'api_key' | 'oauth2' | 'jwt';
  ip_address: string;
  timestamp: Date;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
  requestId: string;
}

// ===== Rate Limiting =====
export interface RateLimitConfig {
  tier: 'free' | 'pro' | 'enterprise';
  requests_per_minute: number;
  requests_per_hour: number;
  burst_allowance: number;
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  reset_timestamp: number;
  retry_after?: number;
}

// ===== API Scopes =====
export const API_SCOPES = {
  // Threat endpoints
  'read:threats': 'Read threat data',
  'write:threats': 'Create and update threats',
  'delete:threats': 'Delete threats',

  // Scan endpoints
  'read:scans': 'Read scan data and results',
  'write:scans': 'Create and update scans',
  'delete:scans': 'Delete scans',

  // Organization endpoints
  'read:organizations': 'Read organization data',
  'write:organizations': 'Update organization settings',
  'admin:organizations': 'Manage organizations',

  // Team endpoints
  'read:teams': 'Read team data',
  'write:teams': 'Create and manage teams',
  'admin:teams': 'Manage team settings',

  // Webhook endpoints
  'read:webhooks': 'Read webhook configurations',
  'write:webhooks': 'Create and update webhooks',
  'delete:webhooks': 'Delete webhooks',

  // Integration endpoints
  'read:integrations': 'Read integration data',
  'write:integrations': 'Connect and configure integrations',
  'delete:integrations': 'Disconnect integrations',

  // Admin scopes
  'admin:api_keys': 'Manage API keys',
  'admin:audit_logs': 'Read audit logs',
} as const;

// ===== GraphQL Types =====
export interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
  extensions?: Record<string, any>;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: Record<string, any>;
}

// ===== Error Codes =====
export enum APIErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',

  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation errors (400)
  BAD_REQUEST = 'BAD_REQUEST',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Rate limit errors (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Integration errors
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
  INTEGRATION_UNREACHABLE = 'INTEGRATION_UNREACHABLE',
  INTEGRATION_AUTH_FAILED = 'INTEGRATION_AUTH_FAILED',

  // Webhook errors
  WEBHOOK_ERROR = 'WEBHOOK_ERROR',
  WEBHOOK_DELIVERY_FAILED = 'WEBHOOK_DELIVERY_FAILED',
}

// ===== Audit Log Types =====
export interface APIAuditLog {
  id: bigint;
  api_key_id?: number;
  org_id: number;
  method: string;
  endpoint: string;
  status_code: number;
  response_time_ms: number;
  user_agent: string;
  ip_address: string;
  created_at: Date;
}

// ===== Configuration Types =====
export interface APIConfig {
  enabled: boolean;
  version: string;
  base_url: string;
  rate_limits: {
    free: RateLimitConfig;
    pro: RateLimitConfig;
    enterprise: RateLimitConfig;
  };
  auth: {
    jwt_secret: string;
    oauth2_enabled: boolean;
    api_key_enabled: boolean;
  };
  webhooks: {
    enabled: boolean;
    max_retries: number;
    retry_delay_ms: number;
  };
  cors: {
    enabled: boolean;
    allowed_origins: string[];
  };
}
