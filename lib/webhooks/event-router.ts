// Event Router - Event Routing Logic for Filtering and Dispatching
import {
  WebhookEventType,
  SpecificWebhookEvent,
  EventFilter,
} from './types/webhook-events';

export interface WebhookSubscription {
  id: string;
  webhookId: string;
  filters: EventFilter;
  active: boolean;
}

export interface RouteResult {
  matched: string[]; // webhook IDs that matched
  filtered: string[]; // webhook IDs that were filtered out
  errors: string[];
}

export class EventRouter {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private webhooksByType: Map<WebhookEventType, Set<string>> = new Map();
  private webhookFilters: Map<string, EventFilter> = new Map();

  /**
   * Register a webhook subscription with optional filters
   */
  registerSubscription(
    webhookId: string,
    eventTypes: WebhookEventType[],
    filters?: EventFilter
  ): WebhookSubscription {
    const subscriptionId = `sub_${webhookId}_${Date.now()}`;

    const subscription: WebhookSubscription = {
      id: subscriptionId,
      webhookId,
      filters: {
        eventTypes,
        ...filters,
      },
      active: true,
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Index by event type for faster lookups
    eventTypes.forEach(eventType => {
      if (!this.webhooksByType.has(eventType)) {
        this.webhooksByType.set(eventType, new Set());
      }
      this.webhooksByType.get(eventType)!.add(webhookId);
    });

    // Store filters for this webhook
    this.webhookFilters.set(webhookId, subscription.filters);

    return subscription;
  }

  /**
   * Unregister a webhook subscription
   */
  unregisterSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    // Remove from event type index
    subscription.filters.eventTypes?.forEach(eventType => {
      const webhooks = this.webhooksByType.get(eventType);
      if (webhooks) {
        webhooks.delete(subscription.webhookId);
        if (webhooks.size === 0) {
          this.webhooksByType.delete(eventType);
        }
      }
    });

    this.subscriptions.delete(subscriptionId);
    this.webhookFilters.delete(subscription.webhookId);

    return true;
  }

  /**
   * Route an event to matching webhooks
   */
  routeEvent(event: SpecificWebhookEvent): RouteResult {
    const matched: string[] = [];
    const filtered: string[] = [];
    const errors: string[] = [];

    // Fast path: get webhooks subscribed to this event type
    const potentialWebhooks = this.webhooksByType.get(event.eventType);
    if (!potentialWebhooks || potentialWebhooks.size === 0) {
      return { matched, filtered, errors };
    }

    // Apply filters for each webhook
    for (const webhookId of potentialWebhooks) {
      const filter = this.webhookFilters.get(webhookId);
      if (!filter) {
        continue;
      }

      try {
        if (this.matchesFilter(event, filter)) {
          matched.push(webhookId);
        } else {
          filtered.push(webhookId);
        }
      } catch (error) {
        errors.push(
          `Error routing to webhook ${webhookId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return { matched, filtered, errors };
  }

  /**
   * Check if event matches filter criteria
   */
  private matchesFilter(event: SpecificWebhookEvent, filter: EventFilter): boolean {
    // Event type filter
    if (
      filter.eventTypes &&
      filter.eventTypes.length > 0 &&
      !filter.eventTypes.includes(event.eventType)
    ) {
      return false;
    }

    // Threat level filter
    if (filter.threatLevels && filter.threatLevels.length > 0) {
      const threatLevel = this.extractThreatLevel(event);
      if (!threatLevel || !filter.threatLevels.includes(threatLevel)) {
        return false;
      }
    }

    // Severity filter
    if (filter.severity && filter.severity.length > 0) {
      const severity = this.extractSeverity(event);
      if (!severity || !filter.severity.includes(severity)) {
        return false;
      }
    }

    // Source filter
    if (filter.sources && filter.sources.length > 0) {
      const source = this.extractSource(event);
      if (!source || !filter.sources.includes(source)) {
        return false;
      }
    }

    // Date range filter
    if (filter.startDate && event.timestamp < filter.startDate) {
      return false;
    }

    if (filter.endDate && event.timestamp > filter.endDate) {
      return false;
    }

    return true;
  }

  /**
   * Extract threat level from event
   */
  private extractThreatLevel(
    event: SpecificWebhookEvent
  ): 'critical' | 'high' | 'medium' | 'low' | null {
    switch (event.eventType) {
      case 'threat.detected':
        return event.data.threatLevel;
      case 'security.breach_detected':
        return event.data.severity;
      default:
        return null;
    }
  }

  /**
   * Extract severity from event
   */
  private extractSeverity(
    event: SpecificWebhookEvent
  ): 'critical' | 'high' | 'medium' | 'low' | 'info' | null {
    switch (event.eventType) {
      case 'alert.triggered':
        return event.data.severity;
      case 'security.breach_detected':
        return event.data.severity;
      default:
        return null;
    }
  }

  /**
   * Extract source from event
   */
  private extractSource(event: SpecificWebhookEvent): string | null {
    if (event.metadata?.source) {
      return event.metadata.source;
    }

    switch (event.eventType) {
      case 'threat.detected':
        return event.data.sourceIndicator;
      case 'scan.completed':
        return event.data.scanType;
      default:
        return null;
    }
  }

  /**
   * Get all subscriptions for a webhook
   */
  getWebhookSubscriptions(webhookId: string): WebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.webhookId === webhookId
    );
  }

  /**
   * Update filters for a webhook
   */
  updateFilter(webhookId: string, filter: EventFilter): boolean {
    const currentFilter = this.webhookFilters.get(webhookId);
    if (!currentFilter) {
      return false;
    }

    // Update the filter
    Object.assign(currentFilter, filter);
    return true;
  }

  /**
   * Get statistics about routing
   */
  getRoutingStats(): {
    totalSubscriptions: number;
    eventTypesTracked: number;
    webhooksRegistered: Set<string>;
  } {
    const webhooksRegistered = new Set<string>();
    this.subscriptions.forEach(sub => webhooksRegistered.add(sub.webhookId));

    return {
      totalSubscriptions: this.subscriptions.size,
      eventTypesTracked: this.webhooksByType.size,
      webhooksRegistered,
    };
  }

  /**
   * Clear all subscriptions (use with caution)
   */
  clearAll(): void {
    this.subscriptions.clear();
    this.webhooksByType.clear();
    this.webhookFilters.clear();
  }

  /**
   * Validate event structure
   */
  validateEvent(event: SpecificWebhookEvent): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!event.id) {
      errors.push('Event missing id');
    }

    if (!event.eventType) {
      errors.push('Event missing eventType');
    }

    if (!event.orgId) {
      errors.push('Event missing orgId');
    }

    if (!event.timestamp) {
      errors.push('Event missing timestamp');
    }

    if (!event.data) {
      errors.push('Event missing data');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const eventRouter = new EventRouter();
