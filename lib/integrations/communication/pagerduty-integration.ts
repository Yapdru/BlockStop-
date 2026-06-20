/**
 * PagerDuty Integration
 * Creates incidents and triggers on-call responders
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent } from '../types';
import fetch from 'node-fetch';

interface PDIncident {
  id: string;
  incident_number: number;
  title: string;
  status: string;
  urgency: string;
  service: { id: string; type: string };
  assigned_via: string;
  first_trigger_log_entry: any;
}

export class PagerDutyIntegration extends IntegrationBase {
  private apiToken: string;
  private serviceId: string;
  private apiUrl: string;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.apiToken = config.auth.credentials['api_token'];
    this.serviceId = config.endpoints?.['service_id'] || '';
    this.apiUrl = 'https://api.pagerduty.com';
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`PagerDuty API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const threat = payload.data;
    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'pagerduty',
      category: threat.category || 'incident',
      severity: this.mapSeverity(threat.severity),
      title: threat.title || 'Security Incident',
      description: threat.description || 'Threat detected',
      data: threat,
      relatedEntities: threat.relatedEntities || [],
      tags: ['pagerduty', 'incident', threat.type].filter(Boolean),
    };
  }

  /**
   * Create incident from threat
   */
  async createIncident(event: TransformedEvent): Promise<string> {
    const incident = {
      type: 'incident_reference',
      title: `${event.severity.toUpperCase()}: ${event.title}`,
      service: { id: this.serviceId, type: 'service_reference' },
      urgency: this.mapUrgency(event.severity),
      body: {
        type: 'incident_body',
        details: event.description,
      },
    };

    const result = await this.makeRequest<{ incident: PDIncident }>(
      'POST',
      '/incidents',
      { incidents: [incident] }
    );

    return result.incident.id;
  }

  /**
   * Get incident details
   */
  async getIncident(incidentId: string): Promise<PDIncident> {
    const result = await this.makeRequest<{ incident: PDIncident }>(
      'GET',
      `/incidents/${incidentId}`
    );

    return result.incident;
  }

  /**
   * Create alert
   */
  async createAlert(event: TransformedEvent, integrationKey: string): Promise<string> {
    const alert = {
      routing_key: integrationKey,
      event_action: 'trigger',
      dedup_key: event.id,
      payload: {
        summary: event.title,
        severity: this.mapPDSeverity(event.severity),
        source: 'BlockStop',
        custom_details: event.data,
      },
      links: [
        {
          href: `https://blockstop.ai/threats/${event.id}`,
          text: 'View Threat',
        },
      ],
    };

    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });

    if (!response.ok) {
      throw new Error(`Failed to create alert: ${response.statusText}`);
    }

    const result: any = await response.json();
    return result.dedup_key;
  }

  /**
   * Resolve incident
   */
  async resolveIncident(incidentId: string, note: string): Promise<void> {
    await this.makeRequest(
      'PUT',
      `/incidents/${incidentId}`,
      {
        incidents: [
          {
            id: incidentId,
            type: 'incident_reference',
            status: 'resolved',
          },
        ],
      }
    );

    await this.addNote(incidentId, note);
  }

  /**
   * Add note to incident
   */
  async addNote(incidentId: string, note: string): Promise<void> {
    await this.makeRequest(
      'POST',
      `/incidents/${incidentId}/notes`,
      { note: { content: note } }
    );
  }

  /**
   * Get on-call users
   */
  async getOnCallUsers(): Promise<any[]> {
    const result = await this.makeRequest<any>(
      'GET',
      `/oncalls?schedule_ids[]=${this.serviceId}`
    );

    return result.oncalls || [];
  }

  /**
   * Get incident by status
   */
  async getIncidents(status: string = 'triggered'): Promise<PDIncident[]> {
    const result = await this.makeRequest<{ incidents: PDIncident[] }>(
      'GET',
      `/incidents?statuses[]=${status}&service_ids[]=${this.serviceId}`
    );

    return result.incidents;
  }

  private mapSeverity(severity?: string): TransformedEvent['severity'] {
    const map: Record<string, TransformedEvent['severity']> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
      info: 'info',
    };
    return map[severity?.toLowerCase() || 'medium'] || 'medium';
  }

  private mapUrgency(severity: TransformedEvent['severity']): string {
    const map: Record<TransformedEvent['severity'], string> = {
      critical: 'high',
      high: 'high',
      medium: 'low',
      low: 'low',
      info: 'low',
    };
    return map[severity];
  }

  private mapPDSeverity(severity: TransformedEvent['severity']): string {
    const map: Record<TransformedEvent['severity'], string> = {
      critical: 'critical',
      high: 'error',
      medium: 'warning',
      low: 'info',
      info: 'info',
    };
    return map[severity];
  }

  protected getAuthHeaders(): Record<string, string> {
    return { Authorization: `Token token=${this.apiToken}` };
  }

  protected async checkDataFlow(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/users/me');
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'PagerDuty integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.apiToken = newConfig.auth.credentials['api_token'];
    this.serviceId = newConfig.endpoints?.['service_id'] || '';
    this.logEvent('config_change', { updated: true });
  }
}

export async function createPagerDutyIntegration(name: string, config: IntegrationConfig): Promise<PagerDutyIntegration> {
  const integration = new PagerDutyIntegration(name, config);
  await integration.initialize();
  return integration;
}
