// Webhook Framework
import { WebhookConfig, WebhookEvent, RetryPolicy } from './types';
import crypto from 'crypto';
import { WebhookSigner } from './middleware';

class WebhookManager {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private events: Map<string, WebhookEvent> = new Map();
  private dlq: Map<string, WebhookEvent> = new Map(); // Dead Letter Queue
  private eventQueues: Map<string, WebhookEvent[]> = new Map();

  registerWebhook(
    orgId: string,
    url: string,
    eventTypes: string[],
    secret?: string
  ): WebhookConfig {
    const id = crypto.randomUUID();
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    const webhook: WebhookConfig = {
      id,
      orgId,
      url,
      eventTypes,
      active: true,
      secret: webhookSecret,
      retryPolicy: {
        maxRetries: 5,
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.webhooks.set(id, webhook);
    return webhook;
  }

  getWebhook(webhookId: string): WebhookConfig | null {
    return this.webhooks.get(webhookId) || null;
  }

  listWebhooks(orgId: string): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(w => w.orgId === orgId);
  }

  updateWebhook(
    webhookId: string,
    updates: Partial<WebhookConfig>
  ): WebhookConfig | null {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;

    Object.assign(webhook, updates, { updatedAt: new Date() });
    return webhook;
  }

  disableWebhook(webhookId: string): boolean {
    const webhook = this.webhooks.get(webhookId);
    if (webhook) {
      webhook.active = false;
      webhook.updatedAt = new Date();
      return true;
    }
    return false;
  }

  deleteWebhook(webhookId: string): boolean {
    return this.webhooks.delete(webhookId);
  }

  async triggerEvent(
    eventType: string,
    payload: any,
    orgId: string
  ): Promise<void> {
    const webhooks = this.listWebhooks(orgId).filter(
      w => w.active && w.eventTypes.includes(eventType)
    );

    for (const webhook of webhooks) {
      const event: WebhookEvent = {
        id: crypto.randomUUID(),
        webhookId: webhook.id,
        eventType,
        payload,
        timestamp: new Date(),
        deliveryAttempts: 0,
        status: 'pending',
      };

      this.events.set(event.id, event);
      this.queueEvent(webhook.id, event);
    }
  }

  private queueEvent(webhookId: string, event: WebhookEvent): void {
    if (!this.eventQueues.has(webhookId)) {
      this.eventQueues.set(webhookId, []);
    }
    this.eventQueues.get(webhookId)!.push(event);
  }

  async processEventQueue(webhookId: string): Promise<void> {
    const queue = this.eventQueues.get(webhookId);
    if (!queue || queue.length === 0) return;

    const event = queue.shift()!;
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return;

    await this.deliverEvent(webhook, event);
  }

  private async deliverEvent(
    webhook: WebhookConfig,
    event: WebhookEvent
  ): Promise<void> {
    const maxRetries = webhook.retryPolicy.maxRetries;
    let delayMs = webhook.retryPolicy.initialDelayMs;

    while (event.deliveryAttempts < maxRetries) {
      try {
        event.deliveryAttempts++;

        const payload = JSON.stringify(event.payload);
        const signature = WebhookSigner.sign(payload, webhook.secret);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BlockStop-Event-ID': event.id,
            'X-BlockStop-Event-Type': event.eventType,
            'X-BlockStop-Signature': signature,
            'X-BlockStop-Delivery-Attempt': event.deliveryAttempts.toString(),
            ...(webhook.headers || {}),
          },
          body: payload,
          timeout: 30000,
        });

        if (response.ok) {
          event.status = 'delivered';
          return;
        }

        // Retry on 5xx or specific 4xx errors
        if (
          response.status >= 500 ||
          [408, 429].includes(response.status)
        ) {
          if (event.deliveryAttempts < maxRetries) {
            event.status = 'pending';
            event.nextRetryAt = new Date(Date.now() + delayMs);
            delayMs = Math.min(
              delayMs * webhook.retryPolicy.backoffMultiplier,
              webhook.retryPolicy.maxDelayMs
            );
            return;
          }
        }

        event.status = 'failed';
        event.lastError = `HTTP ${response.status}`;
        return;
      } catch (error) {
        event.lastError = error instanceof Error ? error.message : String(error);

        if (event.deliveryAttempts < maxRetries) {
          event.status = 'pending';
          event.nextRetryAt = new Date(Date.now() + delayMs);
          delayMs = Math.min(
            delayMs * webhook.retryPolicy.backoffMultiplier,
            webhook.retryPolicy.maxDelayMs
          );
          return;
        }
      }
    }

    // Move to DLQ if all retries exhausted
    event.status = 'dlq';
    this.dlq.set(event.id, event);
  }

  getEvent(eventId: string): WebhookEvent | null {
    return this.events.get(eventId) || null;
  }

  listEvents(webhookId: string, limit: number = 100): WebhookEvent[] {
    return Array.from(this.events.values())
      .filter(e => e.webhookId === webhookId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getDLQEvents(limit: number = 100): WebhookEvent[] {
    return Array.from(this.dlq.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  replayEvent(eventId: string): boolean {
    const dlqEvent = this.dlq.get(eventId);
    if (!dlqEvent) return false;

    const webhook = this.webhooks.get(dlqEvent.webhookId);
    if (!webhook) return false;

    // Reset event for retry
    dlqEvent.status = 'pending';
    dlqEvent.deliveryAttempts = 0;
    dlqEvent.lastError = undefined;
    dlqEvent.nextRetryAt = undefined;

    this.dlq.delete(eventId);
    this.queueEvent(webhook.id, dlqEvent);
    return true;
  }

  testWebhook(webhookId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const webhook = this.webhooks.get(webhookId);
      if (!webhook) {
        resolve(false);
        return;
      }

      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        eventType: 'test',
      };

      const payload = JSON.stringify(testPayload);
      const signature = WebhookSigner.sign(payload, webhook.secret);

      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BlockStop-Test': 'true',
          'X-BlockStop-Signature': signature,
        },
        body: payload,
        timeout: 10000,
      })
        .then(response => resolve(response.ok))
        .catch(() => resolve(false));
    });
  }

  getWebhookStats(webhookId: string): {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    dlq: number;
  } {
    const events = Array.from(this.events.values()).filter(
      e => e.webhookId === webhookId
    );

    return {
      total: events.length,
      delivered: events.filter(e => e.status === 'delivered').length,
      failed: events.filter(e => e.status === 'failed').length,
      pending: events.filter(e => e.status === 'pending').length,
      dlq: this.dlq.size,
    };
  }
}

export const webhookManager = new WebhookManager();
