import { v4 as uuidv4 } from 'uuid';

export interface Integration {
  id: string;
  name: string;
  type: 'slack' | 'jira' | 'github' | 'pagerduty' | 'datadog' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  lastSyncAt?: Date;
}

export interface IntegrationEvent {
  id: string;
  integrationId: string;
  eventType: string;
  payload: Record<string, any>;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
  error?: string;
}

export class IntegrationManager {
  private integrations: Map<string, Integration> = new Map();
  private events: IntegrationEvent[] = [];
  private eventHandlers: Map<string, Function[]> = new Map();

  async createIntegration(
    name: string,
    type: string,
    config: Record<string, any>
  ): Promise<Integration> {
    const integration: Integration = {
      id: uuidv4(),
      name,
      type: type as any,
      enabled: false,
      config,
      createdAt: new Date(),
    };

    this.integrations.set(integration.id, integration);
    return integration;
  }

  async getIntegration(id: string): Promise<Integration | null> {
    return this.integrations.get(id) || null;
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
    const integration = this.integrations.get(id);
    if (!integration) throw new Error('Integration not found');

    const updated: Integration = {
      ...integration,
      ...updates,
      id: integration.id,
      createdAt: integration.createdAt,
    };

    this.integrations.set(id, updated);
    return updated;
  }

  async enableIntegration(id: string): Promise<Integration> {
    return this.updateIntegration(id, { enabled: true });
  }

  async disableIntegration(id: string): Promise<Integration> {
    return this.updateIntegration(id, { enabled: false });
  }

  async deleteIntegration(id: string): Promise<boolean> {
    return this.integrations.delete(id);
  }

  async listIntegrations(type?: string): Promise<Integration[]> {
    let integrations = Array.from(this.integrations.values());

    if (type) {
      integrations = integrations.filter(i => i.type === type);
    }

    return integrations;
  }

  async sendEvent(
    integrationId: string,
    eventType: string,
    payload: Record<string, any>
  ): Promise<IntegrationEvent> {
    const integration = this.integrations.get(integrationId);
    if (!integration) throw new Error('Integration not found');

    if (!integration.enabled) {
      throw new Error('Integration is disabled');
    }

    const event: IntegrationEvent = {
      id: uuidv4(),
      integrationId,
      eventType,
      payload,
      timestamp: new Date(),
      status: 'pending',
    };

    this.events.push(event);

    try {
      await this.processEvent(event);
      event.status = 'success';
    } catch (error) {
      event.status = 'failed';
      event.error = (error as Error).message;
    }

    return event;
  }

  private async processEvent(event: IntegrationEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.eventType) || [];

    for (const handler of handlers) {
      await handler(event);
    }

    const allHandlers = this.eventHandlers.get('*') || [];
    for (const handler of allHandlers) {
      await handler(event);
    }
  }

  registerEventHandler(eventType: string, handler: (event: IntegrationEvent) => Promise<void>): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }

  async getEventHistory(integrationId: string, limit: number = 100): Promise<IntegrationEvent[]> {
    return this.events
      .filter(e => e.integrationId === integrationId)
      .slice(-limit)
      .reverse();
  }

  async syncWithIntegration(integrationId: string): Promise<{
    synced: number;
    failed: number;
    duration: number;
  }> {
    const integration = this.integrations.get(integrationId);
    if (!integration) throw new Error('Integration not found');

    const startTime = Date.now();
    let synced = 0;
    let failed = 0;

    const events = this.events.filter(e => e.integrationId === integrationId);

    for (const event of events) {
      try {
        await this.processEvent(event);
        synced++;
      } catch {
        failed++;
      }
    }

    await this.updateIntegration(integrationId, {
      lastSyncAt: new Date(),
    });

    return {
      synced,
      failed,
      duration: Date.now() - startTime,
    };
  }

  async testIntegration(integrationId: string): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    if (!integration) throw new Error('Integration not found');

    try {
      const testEvent: IntegrationEvent = {
        id: uuidv4(),
        integrationId,
        eventType: 'test',
        payload: { test: true },
        timestamp: new Date(),
        status: 'pending',
      };

      await this.processEvent(testEvent);
      return true;
    } catch {
      return false;
    }
  }

  async getIntegrationStats(): Promise<{
    totalIntegrations: number;
    enabledIntegrations: number;
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
  }> {
    const integrations = Array.from(this.integrations.values());
    const successfulEvents = this.events.filter(e => e.status === 'success').length;
    const failedEvents = this.events.filter(e => e.status === 'failed').length;

    return {
      totalIntegrations: integrations.length,
      enabledIntegrations: integrations.filter(i => i.enabled).length,
      totalEvents: this.events.length,
      successfulEvents,
      failedEvents,
    };
  }

  async clearEventHistory(before: Date): Promise<number> {
    const initialLength = this.events.length;
    this.events = this.events.filter(e => e.timestamp >= before);
    return initialLength - this.events.length;
  }
}
