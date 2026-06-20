// Webhook Manager - CRUD Operations and Registration
import crypto from 'crypto';
import { WebhookEventType, EventFilter } from './types/webhook-events';
import { eventRouter } from './event-router';
import { PayloadSigner } from './payload-signer';

export interface WebhookConfig {
  id: string;
  orgId: string;
  url: string;
  eventTypes: WebhookEventType[];
  filters?: EventFilter;
  active: boolean;
  secret: string;
  headers?: Record<string, string>;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  lastTestedAt?: Date;
  testResult?: {
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  };
  metadata?: Record<string, any>;
}

export interface WebhookStats {
  id: string;
  totalEvents: number;
  deliveredEvents: number;
  failedEvents: number;
  pendingEvents: number;
  dlqEvents: number;
  lastDeliveryAt?: Date;
  successRate: number;
}

export class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private eventIndex: Map<string, Set<string>> = new Map(); // eventType -> webhookIds
  private stats: Map<string, WebhookStats> = new Map();

  /**
   * Validate webhook URL
   */
  private validateURL(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);

      // Only allow HTTPS in production
      if (
        process.env.NODE_ENV === 'production' &&
        urlObj.protocol !== 'https:'
      ) {
        return {
          valid: false,
          error: 'Only HTTPS URLs are allowed in production',
        };
      }

      // Prevent localhost/private IPs in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = urlObj.hostname;
        if (
          ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')
        ) {
          return {
            valid: false,
            error: 'Private IPs are not allowed in production',
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format',
      };
    }
  }

  /**
   * Register a new webhook
   */
  registerWebhook(
    orgId: string,
    url: string,
    eventTypes: WebhookEventType[],
    options?: {
      secret?: string;
      headers?: Record<string, string>;
      maxRetries?: number;
      filters?: EventFilter;
      metadata?: Record<string, any>;
    }
  ): { webhook: WebhookConfig | null; error?: string } {
    // Validate URL
    const urlValidation = this.validateURL(url);
    if (!urlValidation.valid) {
      return { webhook: null, error: urlValidation.error };
    }

    // Validate event types
    if (!eventTypes || eventTypes.length === 0) {
      return {
        webhook: null,
        error: 'At least one event type must be specified',
      };
    }

    const id = `wh_${crypto.randomBytes(12).toString('hex')}`;
    const secret = options?.secret || crypto.randomBytes(32).toString('hex');

    const webhook: WebhookConfig = {
      id,
      orgId,
      url,
      eventTypes,
      filters: options?.filters,
      active: true,
      secret,
      headers: options?.headers,
      maxRetries: options?.maxRetries || 7,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: options?.metadata,
    };

    this.webhooks.set(id, webhook);

    // Index by event type
    eventTypes.forEach(eventType => {
      if (!this.eventIndex.has(eventType)) {
        this.eventIndex.set(eventType, new Set());
      }
      this.eventIndex.get(eventType)!.add(id);
    });

    // Register with router
    eventRouter.registerSubscription(id, eventTypes, options?.filters);

    // Initialize stats
    this.stats.set(id, {
      id,
      totalEvents: 0,
      deliveredEvents: 0,
      failedEvents: 0,
      pendingEvents: 0,
      dlqEvents: 0,
      successRate: 0,
    });

    return { webhook };
  }

  /**
   * Get webhook by ID
   */
  getWebhook(webhookId: string): WebhookConfig | null {
    return this.webhooks.get(webhookId) || null;
  }

  /**
   * List all webhooks for an organization
   */
  listWebhooks(
    orgId: string,
    filters?: {
      active?: boolean;
      eventType?: WebhookEventType;
    }
  ): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(w => {
      if (w.orgId !== orgId) return false;
      if (filters?.active !== undefined && w.active !== filters.active)
        return false;
      if (
        filters?.eventType &&
        !w.eventTypes.includes(filters.eventType)
      )
        return false;
      return true;
    });
  }

  /**
   * Update webhook configuration
   */
  updateWebhook(
    webhookId: string,
    updates: Partial<Omit<WebhookConfig, 'id' | 'orgId' | 'createdAt'>>
  ): { webhook: WebhookConfig | null; error?: string } {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { webhook: null, error: 'Webhook not found' };
    }

    // Validate URL if being updated
    if (updates.url && updates.url !== webhook.url) {
      const urlValidation = this.validateURL(updates.url);
      if (!urlValidation.valid) {
        return { webhook: null, error: urlValidation.error };
      }
    }

    // Update event types index if needed
    if (updates.eventTypes && updates.eventTypes !== webhook.eventTypes) {
      // Remove from old index
      webhook.eventTypes.forEach(eventType => {
        const webhooks = this.eventIndex.get(eventType);
        if (webhooks) {
          webhooks.delete(webhookId);
        }
      });

      // Add to new index
      updates.eventTypes.forEach(eventType => {
        if (!this.eventIndex.has(eventType)) {
          this.eventIndex.set(eventType, new Set());
        }
        this.eventIndex.get(eventType)!.add(webhookId);
      });

      // Update router
      eventRouter.updateFilter(webhookId, { eventTypes: updates.eventTypes });
    }

    // Apply updates
    Object.assign(webhook, updates, { updatedAt: new Date() });

    return { webhook };
  }

  /**
   * Delete webhook
   */
  deleteWebhook(webhookId: string): { success: boolean; error?: string } {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    // Remove from event type index
    webhook.eventTypes.forEach(eventType => {
      const webhooks = this.eventIndex.get(eventType);
      if (webhooks) {
        webhooks.delete(webhookId);
        if (webhooks.size === 0) {
          this.eventIndex.delete(eventType);
        }
      }
    });

    this.webhooks.delete(webhookId);
    this.stats.delete(webhookId);

    return { success: true };
  }

  /**
   * Enable webhook
   */
  enableWebhook(webhookId: string): { success: boolean; error?: string } {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    webhook.active = true;
    webhook.updatedAt = new Date();

    return { success: true };
  }

  /**
   * Disable webhook
   */
  disableWebhook(webhookId: string): { success: boolean; error?: string } {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    webhook.active = false;
    webhook.updatedAt = new Date();

    return { success: true };
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(webhookId: string): Promise<{
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  }> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      eventType: 'test',
      eventId: crypto.randomUUID(),
    };

    const payloadString = JSON.stringify(testPayload);
    const signatureHeaders = PayloadSigner.generateSignatureHeaders(
      payloadString,
      webhook.secret
    );

    const startTime = Date.now();

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...signatureHeaders,
          ...webhook.headers,
        },
        body: payloadString,
        timeout: 10000,
      });

      const responseTime = Date.now() - startTime;
      const success = response.ok;

      const testResult = {
        success,
        statusCode: response.status,
        responseTime,
        error: !success ? `HTTP ${response.status}` : undefined,
      };

      webhook.lastTestedAt = new Date();
      webhook.testResult = testResult;
      webhook.updatedAt = new Date();

      return testResult;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const testResult = {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
      };

      webhook.lastTestedAt = new Date();
      webhook.testResult = testResult;
      webhook.updatedAt = new Date();

      return testResult;
    }
  }

  /**
   * Rotate webhook secret
   */
  rotateSecret(webhookId: string): { secret: string | null; error?: string } {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return { secret: null, error: 'Webhook not found' };
    }

    const newSecret = crypto.randomBytes(32).toString('hex');
    webhook.secret = newSecret;
    webhook.updatedAt = new Date();

    return { secret: newSecret };
  }

  /**
   * Get webhook statistics
   */
  getWebhookStats(webhookId: string): WebhookStats | null {
    return this.stats.get(webhookId) || null;
  }

  /**
   * Update webhook statistics
   */
  updateStats(
    webhookId: string,
    updates: Partial<Omit<WebhookStats, 'id' | 'successRate'>>
  ): void {
    const stats = this.stats.get(webhookId);
    if (!stats) return;

    Object.assign(stats, updates);

    // Calculate success rate
    const total = stats.deliveredEvents + stats.failedEvents;
    stats.successRate = total > 0 ? (stats.deliveredEvents / total) * 100 : 0;
  }

  /**
   * Get organization webhook statistics
   */
  getOrgStats(orgId: string): {
    webhookCount: number;
    activeWebhooks: number;
    totalEvents: number;
    successRate: number;
  } {
    const webhooks = this.listWebhooks(orgId);
    const stats = webhooks.map(w => this.stats.get(w.id)!).filter(Boolean);

    const totalEvents = stats.reduce((sum, s) => sum + s.totalEvents, 0);
    const deliveredEvents = stats.reduce((sum, s) => sum + s.deliveredEvents, 0);
    const successRate =
      totalEvents > 0 ? (deliveredEvents / totalEvents) * 100 : 0;

    return {
      webhookCount: webhooks.length,
      activeWebhooks: webhooks.filter(w => w.active).length,
      totalEvents,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Export webhook configuration (excluding secret)
   */
  exportConfig(webhookId: string): any {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;

    const { secret, ...config } = webhook;
    return config;
  }

  /**
   * Get webhooks by event type
   */
  getWebhooksByEventType(
    orgId: string,
    eventType: WebhookEventType
  ): WebhookConfig[] {
    const webhookIds = this.eventIndex.get(eventType) || new Set();
    return Array.from(webhookIds)
      .map(id => this.webhooks.get(id))
      .filter((w): w is WebhookConfig => w !== undefined && w.orgId === orgId);
  }

  /**
   * Batch operations
   */
  batchEnable(webhookIds: string[]): { succeeded: number; failed: number } {
    let succeeded = 0;
    let failed = 0;

    webhookIds.forEach(id => {
      const result = this.enableWebhook(id);
      if (result.success) succeeded++;
      else failed++;
    });

    return { succeeded, failed };
  }

  batchDisable(webhookIds: string[]): { succeeded: number; failed: number } {
    let succeeded = 0;
    let failed = 0;

    webhookIds.forEach(id => {
      const result = this.disableWebhook(id);
      if (result.success) succeeded++;
      else failed++;
    });

    return { succeeded, failed };
  }

  /**
   * Get metrics
   */
  getMetrics(): {
    totalWebhooks: number;
    totalOrganizations: number;
    eventTypesTracked: number;
    totalEvents: number;
    overallSuccessRate: number;
  } {
    const orgs = new Set(Array.from(this.webhooks.values()).map(w => w.orgId));
    const stats = Array.from(this.stats.values());

    const totalEvents = stats.reduce((sum, s) => sum + s.totalEvents, 0);
    const deliveredEvents = stats.reduce((sum, s) => sum + s.deliveredEvents, 0);
    const overallSuccessRate =
      totalEvents > 0 ? (deliveredEvents / totalEvents) * 100 : 0;

    return {
      totalWebhooks: this.webhooks.size,
      totalOrganizations: orgs.size,
      eventTypesTracked: this.eventIndex.size,
      totalEvents,
      overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
    };
  }
}

// Export singleton instance
export const webhookManager = new WebhookManager();
