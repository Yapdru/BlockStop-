/**
 * Webhook Type Definitions
 */

export interface WebhookEndpoint {
  id: string;
  name: string;
  description?: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
  headers?: Record<string, string>;
  ipWhitelist?: string[];
  rateLimit?: {
    maxRequestsPerMinute: number;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastUsed?: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: number;
  source: string;
  data: Record<string, any>;
  webhookId: string;
  status: 'pending' | 'delivered' | 'failed';
  retryCount: number;
  lastAttempt?: string;
  nextRetry?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  attempt: number;
  statusCode?: number;
  responseTime: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  error?: string;
  timestamp: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
}

export interface WebhookEventPayload {
  type: string;
  timestamp: number;
  id: string;
  source: string;
  data: {
    scanId?: string;
    fileName?: string;
    fileSize?: number;
    filePath?: string;
    malwareDetected?: boolean;
    riskScore?: number;
    threats?: Array<{
      type: string;
      severity: string;
      description: string;
    }>;
    metadata?: Record<string, any>;
  };
}

export interface WebhookSignature {
  algorithm: string;
  signature: string;
  timestamp: string;
}

export interface WebhookValidationOptions {
  validateSignature?: boolean;
  validateTimestamp?: boolean;
  maxAge?: number;
  requiredHeaders?: string[];
  ipWhitelist?: string[];
  clientIP?: string;
}

export interface WebhookTestResult {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  responseTime: number;
  error?: string;
  message?: string;
  timestamp: string;
  deliveryId: string;
}

export interface WebhookStats {
  webhookId: string;
  totalEvents: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
  lastEvent?: string;
  lastSuccess?: string;
  lastFailure?: string;
}

export interface WebhookRegistration {
  name: string;
  url: string;
  events: string[];
  isActive?: boolean;
  secret?: string;
  retryPolicy?: {
    maxRetries?: number;
    backoffMultiplier?: number;
    initialDelayMs?: number;
  };
  headers?: Record<string, string>;
  ipWhitelist?: string[];
  rateLimit?: {
    maxRequestsPerMinute?: number;
  };
}

export interface WebhookUpdate extends Partial<WebhookRegistration> {
  id: string;
}

export interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export type WebhookEventType =
  | 'scan.started'
  | 'scan.completed'
  | 'threat.detected'
  | 'file.quarantined'
  | 'file.deleted'
  | 'ticket.created'
  | 'ticket.updated'
  | 'alert.triggered'
  | 'integration.connected'
  | 'integration.disconnected';
