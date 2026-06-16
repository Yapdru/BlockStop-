/**
 * Webhook Management System
 * Handles webhook registration, delivery, and retry logic
 */

interface WebhookEndpoint {
  id: string;
  name: string;
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
  createdAt: string;
  updatedAt: string;
}

interface WebhookEvent {
  id: string;
  type: string;
  timestamp: number;
  data: Record<string, any>;
  webhookId: string;
  status: 'pending' | 'delivered' | 'failed';
  retryCount: number;
  lastAttempt?: string;
  nextRetry?: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  attempt: number;
  statusCode?: number;
  responseTime: number;
  error?: string;
  timestamp: string;
  headers?: Record<string, string>;
  body?: string;
}

export class WebhookManager {
  private webhooks: Map<string, WebhookEndpoint> = new Map();
  private events: Map<string, WebhookEvent> = new Map();
  private deliveries: Map<string, WebhookDelivery[]> = new Map();

  /**
   * Register a webhook endpoint
   */
  registerWebhook(webhook: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt'>): WebhookEndpoint {
    const id = this.generateId();
    const now = new Date().toISOString();

    const endpoint: WebhookEndpoint = {
      ...webhook,
      id,
      createdAt: now,
      updatedAt: now,
      retryPolicy: webhook.retryPolicy || {
        maxRetries: 5,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
      },
    };

    this.webhooks.set(id, endpoint);
    this.deliveries.set(id, []);

    return endpoint;
  }

  /**
   * Update a webhook endpoint
   */
  updateWebhook(
    webhookId: string,
    updates: Partial<Omit<WebhookEndpoint, 'id' | 'createdAt'>>
  ): WebhookEndpoint | null {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;

    const updated: WebhookEndpoint = {
      ...webhook,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.webhooks.set(webhookId, updated);
    return updated;
  }

  /**
   * Delete a webhook endpoint
   */
  deleteWebhook(webhookId: string): boolean {
    this.webhooks.delete(webhookId);
    this.deliveries.delete(webhookId);
    return true;
  }

  /**
   * Get a webhook endpoint
   */
  getWebhook(webhookId: string): WebhookEndpoint | null {
    return this.webhooks.get(webhookId) || null;
  }

  /**
   * List all webhooks for an event type
   */
  getWebhooksByEvent(eventType: string): WebhookEndpoint[] {
    return Array.from(this.webhooks.values()).filter(
      (webhook) => webhook.isActive && webhook.events.includes(eventType)
    );
  }

  /**
   * Trigger a webhook event
   */
  async triggerEvent(type: string, data: Record<string, any>): Promise<string[]> {
    const webhooks = this.getWebhooksByEvent(type);
    const eventId = this.generateId();

    const event: WebhookEvent = {
      id: eventId,
      type,
      timestamp: Date.now(),
      data,
      webhookId: '',
      status: 'pending',
      retryCount: 0,
    };

    const deliveredWebhooks: string[] = [];

    for (const webhook of webhooks) {
      event.webhookId = webhook.id;
      this.events.set(`${webhook.id}:${eventId}`, event);

      try {
        await this.deliverWebhook(webhook, event);
        deliveredWebhooks.push(webhook.id);
      } catch (error) {
        console.error(`Failed to deliver webhook ${webhook.id}:`, error);
        this.scheduleRetry(webhook, event);
      }
    }

    return deliveredWebhooks;
  }

  /**
   * Deliver a webhook event
   */
  private async deliverWebhook(webhook: WebhookEndpoint, event: WebhookEvent): Promise<void> {
    const startTime = Date.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-BlockStop-Event-Type': event.type,
      'X-BlockStop-Event-ID': event.id,
      'X-BlockStop-Timestamp': event.timestamp.toString(),
    };

    if (webhook.secret) {
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(event.data))
        .digest('hex');
      headers['X-BlockStop-Signature'] = `sha256=${signature}`;
    }

    if (webhook.headers) {
      Object.assign(headers, webhook.headers);
    }

    const delivery: WebhookDelivery = {
      id: this.generateId(),
      webhookId: webhook.id,
      eventId: event.id,
      attempt: event.retryCount + 1,
      responseTime: 0,
      timestamp: new Date().toISOString(),
      headers,
    };

    try {
      const axios = require('axios');
      const response = await axios.post(webhook.url, event.data, {
        headers,
        timeout: 30000,
      });

      delivery.statusCode = response.status;
      delivery.responseTime = Date.now() - startTime;

      const eventKey = `${webhook.id}:${event.id}`;
      const storedEvent = this.events.get(eventKey);
      if (storedEvent) {
        storedEvent.status = 'delivered';
        storedEvent.lastAttempt = new Date().toISOString();
      }

      if (!this.deliveries.has(webhook.id)) {
        this.deliveries.set(webhook.id, []);
      }
      this.deliveries.get(webhook.id)!.push(delivery);
    } catch (error: any) {
      delivery.statusCode = error.response?.status || 0;
      delivery.error = error.message;
      delivery.responseTime = Date.now() - startTime;

      if (!this.deliveries.has(webhook.id)) {
        this.deliveries.set(webhook.id, []);
      }
      this.deliveries.get(webhook.id)!.push(delivery);

      throw error;
    }
  }

  /**
   * Schedule retry for failed webhook delivery
   */
  private scheduleRetry(webhook: WebhookEndpoint, event: WebhookEvent): void {
    const policy = webhook.retryPolicy!;
    const nextRetryDelay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, event.retryCount);

    event.retryCount++;
    event.status = 'pending';
    event.nextRetry = new Date(Date.now() + nextRetryDelay).toISOString();

    // In production, this would be scheduled with a task queue
    if (event.retryCount < policy.maxRetries) {
      setTimeout(() => {
        this.deliverWebhook(webhook, event).catch(() => {
          this.scheduleRetry(webhook, event);
        });
      }, nextRetryDelay);
    } else {
      event.status = 'failed';
    }
  }

  /**
   * Get delivery history for a webhook
   */
  getDeliveryHistory(webhookId: string, limit: number = 50): WebhookDelivery[] {
    const deliveries = this.deliveries.get(webhookId) || [];
    return deliveries.slice(-limit);
  }

  /**
   * Get event status
   */
  getEventStatus(webhookId: string, eventId: string): WebhookEvent | null {
    return this.events.get(`${webhookId}:${eventId}`) || null;
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(webhookId: string): Promise<{
    success: boolean;
    statusCode?: number;
    responseTime: number;
    error?: string;
  }> {
    const webhook = this.getWebhook(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testEvent: WebhookEvent = {
      id: 'test-event-' + this.generateId(),
      type: 'test.webhook',
      timestamp: Date.now(),
      data: { message: 'BlockStop webhook test', timestamp: new Date().toISOString() },
      webhookId,
      status: 'pending',
      retryCount: 0,
    };

    const startTime = Date.now();

    try {
      await this.deliverWebhook(webhook, testEvent);
      return {
        success: true,
        statusCode: 200,
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        statusCode: error.response?.status,
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * List all webhooks
   */
  listWebhooks(): WebhookEndpoint[] {
    return Array.from(this.webhooks.values());
  }
}

export default WebhookManager;
