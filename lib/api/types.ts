// Enterprise API Types and Interfaces
export interface APIContext {
  userId: string;
  orgId: string;
  teamId?: string;
  apiKeyId: string;
  scopes: string[];
  rateLimit: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: ResponseMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
  timestamp: string;
  requestId: string;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  duration: number;
  version: string;
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  cursor: string;
  hasMore: boolean;
  total?: number;
  pageSize: number;
}

export interface APIKey {
  id: string;
  name: string;
  key: string; // hashed
  orgId: string;
  userId: string;
  scopes: string[];
  active: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface WebhookConfig {
  id: string;
  orgId: string;
  url: string;
  eventTypes: string[];
  active: boolean;
  secret: string;
  headers?: Record<string, string>;
  retryPolicy: RetryPolicy;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  eventType: string;
  payload: any;
  timestamp: Date;
  deliveryAttempts: number;
  status: 'pending' | 'delivered' | 'failed' | 'dlq';
  lastError?: string;
  nextRetryAt?: Date;
}

export interface Integration {
  id: string;
  name: string;
  type: 'siem' | 'edr' | 'soar' | 'ticketing' | 'communication' | 'email' | 'cloud' | 'threat_intel' | 'custom';
  category: string;
  description: string;
  icon?: string;
  version: string;
  enabled: boolean;
  config: IntegrationConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  apiEndpoint?: string;
  apiKey?: string;
  webhook?: string;
  parameters?: Record<string, any>;
  authentication?: 'api_key' | 'oauth' | 'basic' | 'bearer' | 'custom';
  testable: boolean;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  requiredFields: TemplateField[];
  optionalFields?: TemplateField[];
  documentation: string;
  examplePayload?: any;
  webhookEvents?: string[];
}

export interface TemplateField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  helpText?: string;
}

export enum APIErrorCode {
  // Auth errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_API_KEY = 'INVALID_API_KEY',
  API_KEY_EXPIRED = 'API_KEY_EXPIRED',
  INSUFFICIENT_SCOPES = 'INSUFFICIENT_SCOPES',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',

  // Integration errors
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
  WEBHOOK_DELIVERY_FAILED = 'WEBHOOK_DELIVERY_FAILED',
  INTEGRATION_CONFIG_INVALID = 'INTEGRATION_CONFIG_INVALID',
}

export interface BatchRequest {
  requests: BatchItem[];
  sequential?: boolean;
  stopOnError?: boolean;
}

export interface BatchItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: any;
  headers?: Record<string, string>;
}

export interface BatchResponse {
  results: BatchResult[];
  errors?: BatchError[];
}

export interface BatchResult {
  requestId: string;
  status: number;
  body: any;
  headers: Record<string, string>;
}

export interface BatchError {
  requestId: string;
  error: APIError;
}

export interface APIUsageMetrics {
  apiKeyId: string;
  orgId: string;
  periodStart: Date;
  periodEnd: Date;
  requestCount: number;
  successCount: number;
  errorCount: number;
  totalLatencyMs: number;
  byEndpoint: Record<string, EndpointMetrics>;
}

export interface EndpointMetrics {
  path: string;
  method: string;
  count: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
}
