// Webhook Event Type Definitions
export type WebhookEventType =
  | 'threat.detected'
  | 'scan.completed'
  | 'alert.triggered'
  | 'organization.created'
  | 'integration.connected'
  | 'api.rate_limit_exceeded'
  | 'security.breach_detected';

export interface WebhookEventPayload {
  id: string;
  eventType: WebhookEventType;
  orgId: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: EventMetadata;
}

export interface EventMetadata {
  source?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

// Threat Detected Event
export interface ThreatDetectedEvent extends WebhookEventPayload {
  eventType: 'threat.detected';
  data: {
    threatId: string;
    threatLevel: 'critical' | 'high' | 'medium' | 'low';
    threatType: string;
    description: string;
    detectedAt: Date;
    sourceIndicator: string;
    affectedResources?: string[];
    threatIntelligence?: {
      ttps?: string[];
      actors?: string[];
      malware?: string[];
    };
  };
}

// Scan Completed Event
export interface ScanCompletedEvent extends WebhookEventPayload {
  eventType: 'scan.completed';
  data: {
    scanId: string;
    scanType: 'file' | 'endpoint' | 'network' | 'cloud';
    status: 'success' | 'partial' | 'failed';
    startedAt: Date;
    completedAt: Date;
    duration: number; // milliseconds
    itemsScanned: number;
    threatsDetected: number;
    scanTarget: string;
    summary?: {
      criticalThreats: number;
      highThreats: number;
      mediumThreats: number;
      lowThreats: number;
    };
  };
}

// Alert Triggered Event
export interface AlertTriggeredEvent extends WebhookEventPayload {
  eventType: 'alert.triggered';
  data: {
    alertId: string;
    alertType: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    triggeredAt: Date;
    relatedThreats?: string[];
    actionRequired?: boolean;
    recommendedActions?: string[];
  };
}

// Organization Created Event
export interface OrganizationCreatedEvent extends WebhookEventPayload {
  eventType: 'organization.created';
  data: {
    organizationId: string;
    organizationName: string;
    createdAt: Date;
    tier: 'free' | 'starter' | 'professional' | 'enterprise';
    adminEmail: string;
    seatCount?: number;
  };
}

// Integration Connected Event
export interface IntegrationConnectedEvent extends WebhookEventPayload {
  eventType: 'integration.connected';
  data: {
    integrationId: string;
    integrationType: string;
    integrationName: string;
    connectedAt: Date;
    status: 'active' | 'testing' | 'inactive';
    configuration?: {
      endpoint?: string;
      authenticationType?: string;
    };
  };
}

// API Rate Limit Exceeded Event
export interface RateLimitExceededEvent extends WebhookEventPayload {
  eventType: 'api.rate_limit_exceeded';
  data: {
    apiKeyId: string;
    limit: number;
    window: 'minute' | 'hour' | 'day';
    exceededAt: Date;
    retryAfter: number; // seconds
    currentUsage: number;
  };
}

// Security Breach Detected Event
export interface BreachDetectedEvent extends WebhookEventPayload {
  eventType: 'security.breach_detected';
  data: {
    breachId: string;
    breachType: string;
    severity: 'critical' | 'high' | 'medium';
    discoveredAt: Date;
    affectedSystems: string[];
    impactAssessment?: string;
    containmentStatus?: 'contained' | 'in_progress' | 'not_contained';
    threatActors?: string[];
  };
}

// Union type for all webhook events
export type SpecificWebhookEvent =
  | ThreatDetectedEvent
  | ScanCompletedEvent
  | AlertTriggeredEvent
  | OrganizationCreatedEvent
  | IntegrationConnectedEvent
  | RateLimitExceededEvent
  | BreachDetectedEvent;

// Event filter interface
export interface EventFilter {
  eventTypes?: WebhookEventType[];
  threatLevels?: ('critical' | 'high' | 'medium' | 'low')[];
  sources?: string[];
  severity?: ('critical' | 'high' | 'medium' | 'low' | 'info')[];
  startDate?: Date;
  endDate?: Date;
}

// Event delivery tracking
export interface EventDeliveryRecord {
  id: string;
  eventId: string;
  webhookId: string;
  deliveryAttempt: number;
  status: 'pending' | 'delivered' | 'failed' | 'dlq';
  statusCode?: number;
  responseTime?: number; // milliseconds
  error?: string;
  deliveredAt?: Date;
  nextRetryAt?: Date;
}

// Event replay options
export interface EventReplayOptions {
  eventIds?: string[];
  webhookId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  dryRun?: boolean;
}
