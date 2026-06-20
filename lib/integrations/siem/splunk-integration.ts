/**
 * Splunk Integration
 * Connects BlockStop threats to Splunk for centralized logging and alerting
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent, TicketData } from '../types';
import fetch from 'node-fetch';

interface SplunkEvent {
  source: string;
  sourcetype: string;
  event: any;
  time?: number;
}

interface SplunkSearchResult {
  sid: string;
  count: number;
  fields: string[];
}

export class SplunkIntegration extends IntegrationBase {
  private splunkHost: string;
  private splunkPort: string;
  private authToken: string;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.splunkHost = config.endpoints?.['host'] || 'localhost';
    this.splunkPort = config.endpoints?.['port'] || '8089';
    this.authToken = config.auth.credentials['auth_token'];
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<T> {
    const url = `https://${this.splunkHost}:${this.splunkPort}${endpoint}`;
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
      throw new Error(`Splunk API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const threat = payload.data;

    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'splunk',
      category: threat.category || 'security_event',
      severity: this.mapSeverity(threat.severity),
      title: threat.title || 'Security Event',
      description: threat.description || 'Threat detected by BlockStop',
      data: threat,
      relatedEntities: threat.relatedEntities || [],
      tags: ['splunk', 'security', threat.type].filter(Boolean),
    };
  }

  /**
   * Send event to Splunk HEC (HTTP Event Collector)
   */
  async sendEvent(event: TransformedEvent): Promise<string> {
    const splunkEvent: SplunkEvent = {
      source: 'blockstop',
      sourcetype: '_json',
      event: {
        threat_id: event.id,
        title: event.title,
        severity: event.severity,
        category: event.category,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
      },
      time: event.timestamp.getTime() / 1000,
    };

    const result = await this.makeRequest<{ text: string; code: number }>(
      'POST',
      '/services/collector',
      splunkEvent
    );

    if (result.code !== 0) {
      throw new Error(`Failed to send event to Splunk: ${result.text}`);
    }

    return event.id;
  }

  /**
   * Create Splunk alert from threat
   */
  async createAlert(event: TransformedEvent): Promise<string> {
    const alertConfig = {
      name: `blockstop_alert_${event.id}`,
      search: `source=blockstop threat_id="${event.id}"`,
      alert_type: 'always',
      alert_condition: 'search',
      dispatch: {
        earliest_time: '-30m',
        latest_time: 'now',
      },
    };

    const result = await this.makeRequest<{ id: string }>(
      'POST',
      '/services/saved/searches',
      alertConfig
    );

    return result.id;
  }

  /**
   * Execute SPL query
   */
  async executeQuery(query: string, timeRange: string = '-24h'): Promise<SplunkSearchResult> {
    const searchParams = {
      search: query,
      earliest_time: timeRange,
      latest_time: 'now',
      output_mode: 'json',
    };

    const result = await this.makeRequest<any>(
      'POST',
      '/services/search/jobs',
      searchParams
    );

    return {
      sid: result.sid,
      count: result.resultCount || 0,
      fields: result.fields || [],
    };
  }

  /**
   * Get search results
   */
  async getSearchResults(searchId: string): Promise<any[]> {
    const result = await this.makeRequest<{ results: any[] }>(
      'GET',
      `/services/search/jobs/${searchId}/results`
    );

    return result.results || [];
  }

  /**
   * Map event severity
   */
  private mapSeverity(severity?: string): TransformedEvent['severity'] {
    const severityMap: Record<string, TransformedEvent['severity']> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
      info: 'info',
    };

    return severityMap[severity?.toLowerCase() || 'medium'] || 'medium';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Splunk ${this.authToken}`,
    };
  }

  protected async checkDataFlow(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/services/server/info');
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'Splunk integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.splunkHost = newConfig.endpoints?.['host'] || 'localhost';
    this.splunkPort = newConfig.endpoints?.['port'] || '8089';
    this.authToken = newConfig.auth.credentials['auth_token'];
    this.logEvent('config_change', { updated: true });
  }
}

export async function createSplunkIntegration(name: string, config: IntegrationConfig): Promise<SplunkIntegration> {
  const integration = new SplunkIntegration(name, config);
  await integration.initialize();
  return integration;
}
