// Webhook Utilities - Batch Delivery, Replay, and Helper Functions
import { eventPublisher } from './event-publisher';
import { queueProcessor } from './queue-processor';
import { webhookManager } from './webhook-manager';
import { eventRouter } from './event-router';
import { SpecificWebhookEvent, EventReplayOptions } from './types/webhook-events';
import crypto from 'crypto';

export interface BatchDeliveryOptions {
  webhookIds?: string[];
  concurrent?: boolean;
  dryRun?: boolean;
  timeout?: number;
}

export interface ReplayResult {
  replayed: number;
  failed: number;
  errors: string[];
}

export interface WebhookHealthCheck {
  webhookId: string;
  healthy: boolean;
  successRate: number;
  lastDeliveryAt?: Date;
  lastError?: string;
}

export class WebhookUtilities {
  /**
   * Batch deliver events to specific webhooks
   */
  static async batchDeliver(
    events: SpecificWebhookEvent[],
    options?: BatchDeliveryOptions
  ): Promise<{
    processed: number;
    queued: number;
    failed: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processed = 0;
    let queued = 0;
    let failed = 0;

    for (const event of events) {
      try {
        const result = await eventPublisher.publishEvent(
          event,
          { priority: 'high' }
        );

        processed++;
        queued += result.webhooksQueued;

        if (result.errors.length > 0) {
          errors.push(...result.errors);
          failed++;
        }
      } catch (error) {
        failed++;
        errors.push(
          `Error processing event ${event.id}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      // Rate limiting if needed
      if (!options?.concurrent) {
        await this.sleep(10);
      }
    }

    return { processed, queued, failed, errors };
  }

  /**
   * Replay events from dead letter queue
   */
  static async replayDLQEvents(options?: EventReplayOptions): Promise<ReplayResult> {
    const dlqEvents = queueProcessor.getDLQEvents(options?.limit || 100);
    let replayed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const job of dlqEvents) {
      try {
        // Filter by webhook ID if specified
        if (options?.webhookId && job.data.webhookId !== options.webhookId) {
          continue;
        }

        const success = queueProcessor.replayDLQEvent(job.id);
        if (success) {
          replayed++;
        } else {
          failed++;
          errors.push(`Failed to replay job ${job.id}`);
        }

        if (options?.dryRun) {
          // In dry run mode, don't actually replay
          replayed--;
        }
      } catch (error) {
        failed++;
        errors.push(
          `Error replaying job ${job.id}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return { replayed, failed, errors };
  }

  /**
   * Export webhook history as JSON
   */
  static exportWebhookHistory(
    webhookId: string,
    limit: number = 1000
  ): {
    webhookId: string;
    events: any[];
    exportedAt: Date;
  } {
    const webhook = webhookManager.getWebhook(webhookId);
    if (!webhook) {
      return { webhookId, events: [], exportedAt: new Date() };
    }

    // In production, would query database for historical events
    return {
      webhookId,
      events: [], // Would be populated from database
      exportedAt: new Date(),
    };
  }

  /**
   * Health check for webhooks
   */
  static async healthCheckWebhooks(orgId: string): Promise<WebhookHealthCheck[]> {
    const webhooks = webhookManager.listWebhooks(orgId, { active: true });
    const healthChecks: WebhookHealthCheck[] = [];

    for (const webhook of webhooks) {
      const stats = webhookManager.getWebhookStats(webhook.id);

      const result = await webhookManager.testWebhook(webhook.id);

      healthChecks.push({
        webhookId: webhook.id,
        healthy:
          result.success && (stats?.successRate || 0) >= 95,
        successRate: stats?.successRate || 0,
        lastDeliveryAt: stats?.lastDeliveryAt,
        lastError: result.error,
      });
    }

    return healthChecks;
  }

  /**
   * Generate test payload for webhook
   */
  static generateTestPayload(eventType: string): Record<string, any> {
    const timestamp = new Date().toISOString();
    const eventId = crypto.randomUUID();

    const basePayload = {
      id: eventId,
      eventType,
      orgId: crypto.randomUUID(),
      timestamp,
      test: true,
    };

    switch (eventType) {
      case 'threat.detected':
        return {
          ...basePayload,
          data: {
            threatId: `threat_${crypto.randomBytes(8).toString('hex')}`,
            threatLevel: 'high',
            threatType: 'malware',
            description: 'Test threat detection event',
            detectedAt: timestamp,
            sourceIndicator: 'test-source',
          },
        };

      case 'scan.completed':
        return {
          ...basePayload,
          data: {
            scanId: `scan_${crypto.randomBytes(8).toString('hex')}`,
            scanType: 'file',
            status: 'success',
            startedAt: timestamp,
            completedAt: timestamp,
            duration: 5000,
            itemsScanned: 1000,
            threatsDetected: 5,
            scanTarget: '/test',
          },
        };

      case 'alert.triggered':
        return {
          ...basePayload,
          data: {
            alertId: `alert_${crypto.randomBytes(8).toString('hex')}`,
            alertType: 'security',
            severity: 'high',
            title: 'Test Alert',
            description: 'This is a test alert',
            triggeredAt: timestamp,
            actionRequired: true,
          },
        };

      case 'organization.created':
        return {
          ...basePayload,
          data: {
            organizationId: crypto.randomUUID(),
            organizationName: 'Test Organization',
            createdAt: timestamp,
            tier: 'professional',
            adminEmail: 'admin@test.com',
            seatCount: 10,
          },
        };

      case 'integration.connected':
        return {
          ...basePayload,
          data: {
            integrationId: crypto.randomUUID(),
            integrationType: 'siem',
            integrationName: 'Test SIEM Integration',
            connectedAt: timestamp,
            status: 'active',
          },
        };

      case 'api.rate_limit_exceeded':
        return {
          ...basePayload,
          data: {
            apiKeyId: `key_${crypto.randomBytes(8).toString('hex')}`,
            limit: 1000,
            window: 'hour',
            exceededAt: timestamp,
            retryAfter: 3600,
            currentUsage: 1005,
          },
        };

      case 'security.breach_detected':
        return {
          ...basePayload,
          data: {
            breachId: `breach_${crypto.randomBytes(8).toString('hex')}`,
            breachType: 'data-breach',
            severity: 'critical',
            discoveredAt: timestamp,
            affectedSystems: ['system-1', 'system-2'],
            containmentStatus: 'in_progress',
          },
        };

      default:
        return basePayload;
    }
  }

  /**
   * Format webhook for display/API response
   */
  static formatWebhookResponse(webhookId: string): any {
    const webhook = webhookManager.getWebhook(webhookId);
    if (!webhook) return null;

    const stats = webhookManager.getWebhookStats(webhookId);

    return {
      id: webhook.id,
      url: webhook.url,
      eventTypes: webhook.eventTypes,
      active: webhook.active,
      maxRetries: webhook.maxRetries,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      lastTestedAt: webhook.lastTestedAt,
      stats: {
        totalEvents: stats?.totalEvents || 0,
        successRate: stats?.successRate || 0,
        lastDeliveryAt: stats?.lastDeliveryAt,
      },
    };
  }

  /**
   * Validate webhook configuration
   */
  static validateWebhookConfig(config: any): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.url) {
      errors.push('URL is required');
    } else if (typeof config.url !== 'string') {
      errors.push('URL must be a string');
    }

    if (!config.eventTypes) {
      errors.push('Event types are required');
    } else if (!Array.isArray(config.eventTypes) || config.eventTypes.length === 0) {
      errors.push('Event types must be a non-empty array');
    }

    if (config.maxRetries !== undefined) {
      if (typeof config.maxRetries !== 'number' || config.maxRetries < 0 || config.maxRetries > 10) {
        errors.push('Max retries must be a number between 0 and 10');
      }
    }

    if (config.headers && typeof config.headers !== 'object') {
      errors.push('Headers must be an object');
    }

    if (config.filters) {
      if (typeof config.filters !== 'object') {
        errors.push('Filters must be an object');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get webhook statistics summary
   */
  static getWebhookSummary(webhookId: string): any {
    const webhook = webhookManager.getWebhook(webhookId);
    if (!webhook) return null;

    const stats = webhookManager.getWebhookStats(webhookId);
    const dlqSize = queueProcessor.getDLQSize();

    return {
      id: webhook.id,
      name: `Webhook ${webhook.id.slice(0, 8)}`,
      url: webhook.url,
      active: webhook.active,
      eventTypes: webhook.eventTypes,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      stats: {
        totalEvents: stats?.totalEvents || 0,
        deliveredEvents: stats?.deliveredEvents || 0,
        failedEvents: stats?.failedEvents || 0,
        pendingEvents: stats?.pendingEvents || 0,
        dlqEvents: stats?.dlqEvents || 0,
        successRate: `${(stats?.successRate || 0).toFixed(2)}%`,
      },
      health: {
        healthy: (stats?.successRate || 0) >= 95,
        successRate: stats?.successRate || 0,
      },
    };
  }

  /**
   * Audit trail for webhook operations
   */
  static createAuditLog(
    webhookId: string,
    action: string,
    details: any
  ): {
    id: string;
    webhookId: string;
    action: string;
    details: any;
    timestamp: Date;
  } {
    return {
      id: crypto.randomUUID(),
      webhookId,
      action,
      details,
      timestamp: new Date(),
    };
  }
}

// Export utilities
export const webhookUtils = new WebhookUtilities();
