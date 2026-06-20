// Event Publisher - Event Publishing System with Bull Queue Integration
import { eventRouter } from './event-router';
import { PayloadSigner } from './payload-signer';
import {
  WebhookEventType,
  SpecificWebhookEvent,
  EventDeliveryRecord,
  ThreatDetectedEvent,
  ScanCompletedEvent,
  AlertTriggeredEvent,
  OrganizationCreatedEvent,
  IntegrationConnectedEvent,
  RateLimitExceededEvent,
  BreachDetectedEvent,
} from './types/webhook-events';
import crypto from 'crypto';

export interface PublishOptions {
  priority?: 'low' | 'normal' | 'high' | 'critical';
  delayMs?: number;
  metadata?: Record<string, any>;
}

export interface PublishResult {
  eventId: string;
  webhooksQueued: number;
  deliveryRecords: EventDeliveryRecord[];
  errors: string[];
}

// Mock Bull Queue interface (can be replaced with actual Bull)
export interface QueueJob {
  id: string;
  data: {
    eventId: string;
    webhookId: string;
    payload: string;
    signature: string;
    timestamp: number;
    nonce: string;
  };
  priority?: number;
  delay?: number;
  attempts: number;
  maxAttempts: number;
}

export class EventPublisher {
  private eventStore: Map<string, SpecificWebhookEvent> = new Map();
  private deliveryRecords: Map<string, EventDeliveryRecord[]> = new Map();
  private jobQueue: QueueJob[] = [];
  private jobIdCounter = 0;

  // Priority levels for queue
  private priorityScores = {
    low: 1,
    normal: 50,
    high: 100,
    critical: 1000,
  };

  /**
   * Publish a threat detected event
   */
  publishThreatDetected(
    orgId: string,
    data: Omit<ThreatDetectedEvent['data'], ''>,
    options?: PublishOptions
  ): Promise<PublishResult> {
    const event: ThreatDetectedEvent = {
      id: crypto.randomUUID(),
      eventType: 'threat.detected',
      orgId,
      timestamp: new Date(),
      data,
    };

    return this.publishEvent(event, options);
  }

  /**
   * Publish a scan completed event
   */
  publishScanCompleted(
    orgId: string,
    data: Omit<ScanCompletedEvent['data'], ''>,
    options?: PublishOptions
  ): Promise<PublishResult> {
    const event: ScanCompletedEvent = {
      id: crypto.randomUUID(),
      eventType: 'scan.completed',
      orgId,
      timestamp: new Date(),
      data,
    };

    return this.publishEvent(event, options);
  }

  /**
   * Publish an alert triggered event
   */
  publishAlertTriggered(
    orgId: string,
    data: Omit<AlertTriggeredEvent['data'], ''>,
    options?: PublishOptions
  ): Promise<PublishResult> {
    const event: AlertTriggeredEvent = {
      id: crypto.randomUUID(),
      eventType: 'alert.triggered',
      orgId,
      timestamp: new Date(),
      data,
    };

    return this.publishEvent(event, options);
  }

  /**
   * Publish an organization created event
   */
  publishOrganizationCreated(
    orgId: string,
    data: Omit<OrganizationCreatedEvent['data'], ''>,
    options?: PublishOptions
  ): Promise<PublishResult> {
    const event: OrganizationCreatedEvent = {
      id: crypto.randomUUID(),
      eventType: 'organization.created',
      orgId,
      timestamp: new Date(),
      data,
    };

    return this.publishEvent(event, options);
  }

  /**
   * Publish an integration connected event
   */
  publishIntegrationConnected(
    orgId: string,
    data: Omit<IntegrationConnectedEvent['data'], ''>,
    options?: PublishOptions
  ): Promise<PublishResult> {
    const event: IntegrationConnectedEvent = {
      id: crypto.randomUUID(),
      eventType: 'integration.connected',
      orgId,
      timestamp: new Date(),
      data,
    };

    return this.publishEvent(event, options);
  }

  /**
   * Publish a rate limit exceeded event
   */
  publishRateLimitExceeded(
    orgId: string,
    data: Omit<RateLimitExceededEvent['data'], ''>,
    options?: PublishOptions
  ): Promise<PublishResult> {
    const event: RateLimitExceededEvent = {
      id: crypto.randomUUID(),
      eventType: 'api.rate_limit_exceeded',
      orgId,
      timestamp: new Date(),
      data,
    };

    return this.publishEvent(event, options);
  }

  /**
   * Publish a security breach detected event
   */
  publishBreachDetected(
    orgId: string,
    data: Omit<BreachDetectedEvent['data'], ''>,
    options?: PublishOptions
  ): Promise<PublishResult> {
    const event: BreachDetectedEvent = {
      id: crypto.randomUUID(),
      eventType: 'security.breach_detected',
      orgId,
      timestamp: new Date(),
      data,
    };

    return this.publishEvent(event, options);
  }

  /**
   * Core event publishing logic
   */
  async publishEvent(
    event: SpecificWebhookEvent,
    options?: PublishOptions
  ): Promise<PublishResult> {
    const errors: string[] = [];
    const deliveryRecords: EventDeliveryRecord[] = [];

    try {
      // Validate event
      const validation = eventRouter.validateEvent(event);
      if (!validation.valid) {
        return {
          eventId: event.id,
          webhooksQueued: 0,
          deliveryRecords: [],
          errors: validation.errors,
        };
      }

      // Store event
      this.eventStore.set(event.id, event);

      // Route event to matching webhooks
      const routeResult = eventRouter.routeEvent(event);

      if (routeResult.errors.length > 0) {
        errors.push(...routeResult.errors);
      }

      // Queue delivery jobs for matched webhooks
      for (const webhookId of routeResult.matched) {
        const payload = JSON.stringify(event);
        const signature = PayloadSigner.generateSignature(payload, '');

        const record: EventDeliveryRecord = {
          id: crypto.randomUUID(),
          eventId: event.id,
          webhookId,
          deliveryAttempt: 0,
          status: 'pending',
        };

        const job: QueueJob = {
          id: `job_${++this.jobIdCounter}`,
          data: {
            eventId: event.id,
            webhookId,
            payload,
            signature: signature.signature,
            timestamp: signature.timestamp,
            nonce: signature.nonce,
          },
          priority: this.priorityScores[options?.priority || 'normal'],
          delay: options?.delayMs,
          attempts: 0,
          maxAttempts: 7,
        };

        this.jobQueue.push(job);

        // Sort queue by priority (higher priority first)
        this.jobQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        deliveryRecords.push(record);

        if (!this.deliveryRecords.has(event.id)) {
          this.deliveryRecords.set(event.id, []);
        }
        this.deliveryRecords.get(event.id)!.push(record);
      }

      return {
        eventId: event.id,
        webhooksQueued: routeResult.matched.length,
        deliveryRecords,
        errors,
      };
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : String(error)
      );

      return {
        eventId: event.id,
        webhooksQueued: 0,
        deliveryRecords,
        errors,
      };
    }
  }

  /**
   * Get event from store
   */
  getEvent(eventId: string): SpecificWebhookEvent | undefined {
    return this.eventStore.get(eventId);
  }

  /**
   * Get delivery records for an event
   */
  getDeliveryRecords(eventId: string): EventDeliveryRecord[] {
    return this.deliveryRecords.get(eventId) || [];
  }

  /**
   * Get next job from queue
   */
  getNextJob(): QueueJob | undefined {
    return this.jobQueue.shift();
  }

  /**
   * Peek at queue (get jobs without removing)
   */
  peekQueue(limit: number = 10): QueueJob[] {
    return this.jobQueue.slice(0, limit);
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.jobQueue.length;
  }

  /**
   * Get event count in store
   */
  getEventCount(): number {
    return this.eventStore.size;
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats(): {
    totalEvents: number;
    totalDeliveries: number;
    pending: number;
    delivered: number;
    failed: number;
    dlq: number;
  } {
    let pending = 0;
    let delivered = 0;
    let failed = 0;
    let dlq = 0;

    this.deliveryRecords.forEach(records => {
      records.forEach(record => {
        if (record.status === 'pending') pending++;
        else if (record.status === 'delivered') delivered++;
        else if (record.status === 'failed') failed++;
        else if (record.status === 'dlq') dlq++;
      });
    });

    return {
      totalEvents: this.eventStore.size,
      totalDeliveries: pending + delivered + failed + dlq,
      pending,
      delivered,
      failed,
      dlq,
    };
  }

  /**
   * Clear old events (older than specified time)
   */
  purgeOldEvents(maxAgeMs: number): number {
    const cutoffTime = Date.now() - maxAgeMs;
    let purged = 0;

    for (const [eventId, event] of Array.from(this.eventStore.entries())) {
      if (event.timestamp.getTime() < cutoffTime) {
        this.eventStore.delete(eventId);
        this.deliveryRecords.delete(eventId);
        purged++;
      }
    }

    return purged;
  }
}

// Export singleton instance
export const eventPublisher = new EventPublisher();
