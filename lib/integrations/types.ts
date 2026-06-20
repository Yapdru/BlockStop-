/**
 * Integration Framework Types
 * Core type definitions for all integrations in BlockStop
 */

export enum IntegrationCategory {
  SIEM = 'siem',
  EDR = 'edr',
  SOAR = 'soar',
  TICKETING = 'ticketing',
  COMMUNICATION = 'communication',
  CLOUD = 'cloud',
  EMAIL_SECURITY = 'email-security',
  THREAT_INTEL = 'threat-intel',
  CUSTOM = 'custom',
}

export enum AuthType {
  OAUTH2 = 'oauth2',
  API_KEY = 'api-key',
  BASIC = 'basic',
  TOKEN = 'token',
  CERTIFICATE = 'certificate',
  CUSTOM = 'custom',
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

export interface AuthConfig {
  type: AuthType;
  credentials: Record<string, string>;
  expiresAt?: Date;
  refreshToken?: string;
  scopes?: string[];
}

export interface IntegrationConfig {
  name: string;
  category: IntegrationCategory;
  auth: AuthConfig;
  endpoints?: Record<string, string>;
  webhookUrl?: string;
  retryPolicy?: RetryPolicy;
  timeout?: number;
  metadata?: Record<string, any>;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface WebhookPayload {
  id: string;
  timestamp: Date;
  source: string;
  type: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TransformedEvent {
  id: string;
  timestamp: Date;
  source: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  data: Record<string, any>;
  relatedEntities?: string[];
  tags?: string[];
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: Date;
  responseTime: number;
  details: {
    connectivity: boolean;
    authentication: boolean;
    dataFlow: boolean;
    errorCount: number;
    lastError?: string;
  };
  metrics?: HealthMetrics;
}

export interface HealthMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  lastSuccessfulSync: Date;
  lastFailedSync?: Date;
}

export interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: 'health_check' | 'data_received' | 'error' | 'auth_refresh' | 'config_change';
  timestamp: Date;
  data: Record<string, any>;
  severity?: 'info' | 'warning' | 'error';
}

export interface TicketData {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
  assignee?: string;
  labels?: string[];
  externalId?: string;
  sourceLink?: string;
}

export interface EnrichmentMapping {
  source: string;
  target: string;
  transformer?: (value: any) => any;
  required?: boolean;
}

export interface MarketplaceIntegration {
  id: string;
  name: string;
  category: IntegrationCategory;
  version: string;
  description: string;
  author: string;
  vendor?: string;
  logo?: string;
  rating: number;
  reviewCount: number;
  downloads: number;
  published: Date;
  lastUpdated: Date;
  documentation?: string;
  supportUrl?: string;
  priceModel: 'free' | 'paid' | 'freemium';
  tags: string[];
  requiredScopes: string[];
  compatibleVersions: string[];
}

export interface IntegrationValidator {
  validate(config: IntegrationConfig): ValidationResult;
  validateAuth(auth: AuthConfig): ValidationResult;
  validateWebhook(payload: WebhookPayload): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface IntegrationTestResult {
  integrationId: string;
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  message?: string;
  assertion?: string;
}

export interface DataEnrichmentResult {
  original: Record<string, any>;
  enriched: Record<string, any>;
  addedFields: string[];
  sources: string[];
}

export interface IntegrationUsageAnalytics {
  integrationId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  dataTransferred: number;
  webhooksReceived: number;
  ticketsCreated: number;
  topEventTypes: Array<{ type: string; count: number }>;
}

export interface IntegrationVersion {
  id: string;
  integrationId: string;
  version: string;
  releaseDate: Date;
  changelog: string;
  schema?: Record<string, any>;
  deprecated?: boolean;
  deprecationDate?: Date;
}
