// Webhook API Examples - Integration with REST API
// These examples show how to integrate the webhook framework with Next.js API routes

import { webhookManager } from './webhook-manager';
import { eventPublisher } from './event-publisher';
import { queueProcessor } from './queue-processor';
import { webhookUtils } from './webhook-utilities';
import { PayloadSigner } from './payload-signer';
import { WebhookEventType } from './types/webhook-events';

/**
 * Example: GET /api/v1/webhooks
 * List all webhooks for an organization
 */
export async function listWebhooks(orgId: string) {
  const webhooks = webhookManager.listWebhooks(orgId);

  return webhooks.map(webhook => ({
    id: webhook.id,
    url: webhook.url,
    eventTypes: webhook.eventTypes,
    active: webhook.active,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt,
    stats: webhookManager.getWebhookStats(webhook.id),
  }));
}

/**
 * Example: POST /api/v1/webhooks
 * Create a new webhook
 */
export async function createWebhook(
  orgId: string,
  data: {
    url: string;
    eventTypes: WebhookEventType[];
    filters?: any;
    headers?: Record<string, string>;
    maxRetries?: number;
  }
) {
  const validation = webhookUtils.validateWebhookConfig(data);
  if (!validation.valid) {
    return {
      error: 'Invalid webhook configuration',
      details: validation.errors,
    };
  }

  const result = webhookManager.registerWebhook(orgId, data.url, data.eventTypes, {
    headers: data.headers,
    maxRetries: data.maxRetries,
    filters: data.filters,
  });

  if (result.error) {
    return { error: result.error };
  }

  return {
    id: result.webhook!.id,
    url: result.webhook!.url,
    eventTypes: result.webhook!.eventTypes,
    active: result.webhook!.active,
    secret: result.webhook!.secret, // Only return secret on creation
    createdAt: result.webhook!.createdAt,
  };
}

/**
 * Example: PUT /api/v1/webhooks/:id
 * Update a webhook
 */
export async function updateWebhook(
  webhookId: string,
  data: {
    url?: string;
    eventTypes?: WebhookEventType[];
    active?: boolean;
    headers?: Record<string, string>;
    filters?: any;
  }
) {
  const result = webhookManager.updateWebhook(webhookId, data);

  if (result.error) {
    return { error: result.error };
  }

  return {
    id: result.webhook!.id,
    url: result.webhook!.url,
    eventTypes: result.webhook!.eventTypes,
    active: result.webhook!.active,
    updatedAt: result.webhook!.updatedAt,
  };
}

/**
 * Example: DELETE /api/v1/webhooks/:id
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string) {
  const result = webhookManager.deleteWebhook(webhookId);

  if (!result.success) {
    return { error: result.error };
  }

  return { success: true };
}

/**
 * Example: POST /api/v1/webhooks/:id/test
 * Test webhook delivery
 */
export async function testWebhook(webhookId: string) {
  const result = await webhookManager.testWebhook(webhookId);

  return {
    success: result.success,
    statusCode: result.statusCode,
    responseTime: result.responseTime,
    error: result.error,
  };
}

/**
 * Example: POST /api/v1/webhooks/:id/rotate-secret
 * Rotate webhook secret
 */
export async function rotateWebhookSecret(webhookId: string) {
  const result = webhookManager.rotateSecret(webhookId);

  if (result.error) {
    return { error: result.error };
  }

  return {
    secret: result.secret,
    message: 'Secret rotated successfully',
  };
}

/**
 * Example: GET /api/v1/webhooks/:id/deliveries
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(webhookId: string, limit: number = 100) {
  const webhook = webhookManager.getWebhook(webhookId);
  if (!webhook) {
    return { error: 'Webhook not found' };
  }

  const stats = webhookManager.getWebhookStats(webhookId);

  return {
    webhookId,
    stats: {
      totalEvents: stats?.totalEvents || 0,
      deliveredEvents: stats?.deliveredEvents || 0,
      failedEvents: stats?.failedEvents || 0,
      pendingEvents: stats?.pendingEvents || 0,
      dlqEvents: stats?.dlqEvents || 0,
      successRate: stats?.successRate || 0,
    },
  };
}

/**
 * Example: POST /api/v1/webhooks/test-delivery
 * Test event delivery (fire a test event)
 */
export async function sendTestEvent(
  orgId: string,
  webhookId: string,
  eventType: WebhookEventType
) {
  const testPayload = webhookUtils.generateTestPayload(eventType);
  const result = await eventPublisher.publishEvent(testPayload as any);

  return {
    eventId: result.eventId,
    webhooksQueued: result.webhooksQueued,
    queued: result.webhooksQueued > 0,
    errors: result.errors,
  };
}

/**
 * Example: GET /api/v1/webhooks/health
 * Health check for all webhooks
 */
export async function getWebhookHealth(orgId: string) {
  const healthChecks = await webhookUtils.healthCheckWebhooks(orgId);
  const stats = webhookManager.getOrgStats(orgId);

  return {
    organization: {
      webhookCount: stats.webhookCount,
      activeWebhooks: stats.activeWebhooks,
      overallSuccessRate: stats.successRate,
    },
    webhooks: healthChecks,
    queueHealth: queueProcessor.getHealth(),
  };
}

/**
 * Example: POST /api/v1/webhooks/replay-dlq
 * Replay failed deliveries from dead letter queue
 */
export async function replayFailedDeliveries(webhookId?: string, limit?: number) {
  const result = await webhookUtils.replayDLQEvents({
    webhookId,
    limit,
  });

  return {
    replayed: result.replayed,
    failed: result.failed,
    errors: result.errors,
  };
}

/**
 * Example: GET /api/v1/webhooks/statistics
 * Get overall webhook statistics
 */
export async function getWebhookStatistics(orgId: string) {
  const orgStats = webhookManager.getOrgStats(orgId);
  const processorStats = queueProcessor.getStats();

  return {
    organization: orgStats,
    processing: {
      processed: processorStats.processed,
      succeeded: processorStats.succeeded,
      failed: processorStats.failed,
      retried: processorStats.retried,
      dlqed: processorStats.dlqd,
      dlqSize: processorStats.dlqSize,
      isRunning: processorStats.isRunning,
    },
  };
}

/**
 * Example: Webhook signature verification middleware
 */
export function verifyWebhookSignature(
  payload: string,
  headers: Record<string, string>,
  webhookSecret: string
): { valid: boolean; error?: string } {
  return PayloadSigner.verifyDelivery(payload, headers, webhookSecret);
}

/**
 * Example: Batch webhook operations
 */
export async function batchUpdateWebhooks(
  webhookIds: string[],
  updates: { active?: boolean; eventTypes?: WebhookEventType[] }
) {
  const results = [];

  for (const id of webhookIds) {
    const result = webhookManager.updateWebhook(id, updates);
    results.push({
      webhookId: id,
      success: result.error === undefined,
      error: result.error,
    });
  }

  return results;
}

/**
 * Example: Export webhook configuration
 */
export function exportWebhookConfig(orgId: string) {
  const webhooks = webhookManager.listWebhooks(orgId);

  return {
    organization: orgId,
    exportedAt: new Date().toISOString(),
    webhooks: webhooks.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      eventTypes: webhook.eventTypes,
      active: webhook.active,
      maxRetries: webhook.maxRetries,
      filters: webhook.filters,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    })),
  };
}

/**
 * Example: Import webhook configuration
 */
export async function importWebhookConfig(
  orgId: string,
  config: {
    webhooks: Array<{
      url: string;
      eventTypes: WebhookEventType[];
      active?: boolean;
      maxRetries?: number;
      filters?: any;
      headers?: Record<string, string>;
    }>;
  }
) {
  const results = [];

  for (const webhook of config.webhooks) {
    const result = webhookManager.registerWebhook(
      orgId,
      webhook.url,
      webhook.eventTypes,
      {
        headers: webhook.headers,
        maxRetries: webhook.maxRetries,
        filters: webhook.filters,
      }
    );

    if (result.error) {
      results.push({
        url: webhook.url,
        success: false,
        error: result.error,
      });
    } else {
      results.push({
        id: result.webhook!.id,
        url: webhook.url,
        success: true,
      });
    }
  }

  return { imported: results };
}
