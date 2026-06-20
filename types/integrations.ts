export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending';
export type WebhookEvent = 'scan_complete' | 'threat_detected' | 'file_quarantined' | 'user_action';
export type OAuthProvider = 'google' | 'github' | 'slack' | 'microsoft';

export interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  status: IntegrationStatus;
  installed: boolean;
  rating: number;
  reviews: number;
  version: string;
  author: string;
  documentation: string;
}

export interface InstalledIntegration extends Integration {
  apiKey?: string;
  secretKey?: string;
  webhooks: Webhook[];
  config: Record<string, any>;
  lastSync: Date;
  health: {
    status: 'healthy' | 'degraded' | 'error';
    lastCheck: Date;
    errorMessage?: string;
  };
}

export interface Webhook {
  id: string;
  integrationId: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  secret: string;
  createdAt: Date;
  lastTriggered?: Date;
  deliveryRate: number;
}

export interface APIKey {
  id: string;
  integrationId: string;
  name: string;
  key: string;
  secret?: string;
  prefix: string;
  createdAt: Date;
  lastUsed?: Date;
  revokedAt?: Date;
  permissions: string[];
}

export interface WebhookTestPayload {
  event: WebhookEvent;
  timestamp: Date;
  data: Record<string, any>;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: any;
  statusCode?: number;
  error?: string;
  timestamp: Date;
  duration: number;
}

export interface IntegrationConfig {
  id: string;
  integrationId: string;
  userId: string;
  config: Record<string, any>;
  validationErrors?: Record<string, string>;
}

export interface OAuthCredentials {
  id: string;
  integrationId: string;
  provider: OAuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
}

export interface IntegrationReview {
  id: string;
  integrationId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
  helpful: number;
}

export interface IntegrationActivityLog {
  id: string;
  integrationId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  userId: string;
}

export interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastError?: string;
  avgResponseTime: number;
  uptime: number;
  lastStatusCheck: Date;
}
