/**
 * Datadog Integration
 * Sends BlockStop threats and metrics to Datadog for monitoring and alerting
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent } from '../types';
import fetch from 'node-fetch';

interface DatadogEvent {
  title: string;
  text: string;
  priority: 'low' | 'normal';
  tags?: string[];
  alert_type: 'error' | 'warning' | 'info' | 'success';
  aggregation_key?: string;
  source_type_name: string;
}

interface DatadogMetric {
  metric: string;
  points: Array<[number, number]>;
  type: 'gauge' | 'rate' | 'count';
  tags?: string[];
  host?: string;
}

export class DatadogIntegration extends IntegrationBase {
  private apiKey: string;
  private appKey: string;
  private site: string;
  private apiUrl: string;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.apiKey = config.auth.credentials['api_key'];
    this.appKey = config.auth.credentials['app_key'];
    this.site = config.endpoints?.['site'] || 'datadoghq.com';
    this.apiUrl = `https://api.${this.site}`;
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
      throw new Error(`Datadog API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const threat = payload.data;

    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'datadog',
      category: threat.category || 'security_event',
      severity: this.mapSeverity(threat.severity),
      title: threat.title || 'Security Event',
      description: threat.description || 'Threat detected by BlockStop',
      data: threat,
      relatedEntities: threat.relatedEntities || [],
      tags: ['datadog', 'blockstop', threat.type].filter(Boolean),
    };
  }

  /**
   * Send event to Datadog
   */
  async sendEvent(event: TransformedEvent): Promise<string> {
    const datadogEvent: DatadogEvent = {
      title: event.title,
      text: event.description,
      priority: event.severity === 'critical' ? 'normal' : 'low',
      tags: [...(event.tags || []), `severity:${event.severity}`, `source:blockstop`],
      alert_type: this.mapAlertType(event.severity),
      aggregation_key: `blockstop-${event.category}`,
      source_type_name: 'blockstop',
    };

    const result = await this.makeRequest<{ event: { id: number } }>(
      'POST',
      '/api/v1/events',
      datadogEvent
    );

    return String(result.event.id);
  }

  /**
   * Send metric to Datadog
   */
  async sendMetric(metricName: string, value: number, tags?: string[]): Promise<void> {
    const metric: DatadogMetric = {
      metric: `blockstop.${metricName}`,
      points: [[Math.floor(Date.now() / 1000), value]],
      type: 'gauge',
      tags: ['service:blockstop', ...(tags || [])],
      host: 'blockstop',
    };

    await this.makeRequest('POST', '/api/v1/series', { series: [metric] });
  }

  /**
   * Create monitor (alert rule)
   */
  async createMonitor(
    name: string,
    query: string,
    alertCondition: Record<string, any>,
    notificationMessage?: string
  ): Promise<string> {
    const monitorConfig = {
      name,
      type: 'metric alert',
      query,
      message: notificationMessage || `{{#is_alert}}BlockStop Security Alert: ${name}{{/is_alert}}`,
      tags: ['service:blockstop', 'type:security'],
      options: {
        thresholds: alertCondition,
        notify_no_data: true,
        no_data_timeframe: 10,
        require_full_window: false,
        timeout_h: 24,
      },
    };

    const result = await this.makeRequest<{ id: number }>(
      'POST',
      '/api/v1/monitor',
      monitorConfig
    );

    return String(result.id);
  }

  /**
   * Get dashboards
   */
  async getDashboards(): Promise<Array<{ id: string; title: string }>> {
    const result = await this.makeRequest<{ dashboards: Array<{ id: string; title: string }> }>(
      'GET',
      '/api/v1/dashboard'
    );

    return result.dashboards || [];
  }

  /**
   * Create dashboard
   */
  async createDashboard(title: string, description: string): Promise<string> {
    const dashboard = {
      title,
      description,
      widgets: [],
      layout_type: 'ordered',
      notify_list: [],
    };

    const result = await this.makeRequest<{ id: string }>(
      'POST',
      '/api/v1/dashboard',
      dashboard
    );

    return result.id;
  }

  /**
   * Query logs
   */
  async queryLogs(query: string, from: number, to: number): Promise<any[]> {
    const params = new URLSearchParams({
      query,
      from: String(from),
      to: String(to),
    });

    const result = await this.makeRequest<{ logs: any[] }>(
      'GET',
      `/api/v2/logs/events?${params.toString()}`
    );

    return result.logs || [];
  }

  /**
   * Get host metrics
   */
  async getHostMetrics(hostname: string): Promise<Record<string, any>> {
    const result = await this.makeRequest<any>(
      'GET',
      `/api/v1/hosts/${hostname}`
    );

    return result;
  }

  /**
   * Map alert type
   */
  private mapAlertType(severity: TransformedEvent['severity']): DatadogEvent['alert_type'] {
    const alertTypeMap: Record<TransformedEvent['severity'], DatadogEvent['alert_type']> = {
      critical: 'error',
      high: 'error',
      medium: 'warning',
      low: 'info',
      info: 'info',
    };

    return alertTypeMap[severity];
  }

  /**
   * Map severity
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
      'DD-API-KEY': this.apiKey,
      'DD-APPLICATION-KEY': this.appKey,
    };
  }

  protected async checkDataFlow(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/api/v1/validate');
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'Datadog integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.apiKey = newConfig.auth.credentials['api_key'];
    this.appKey = newConfig.auth.credentials['app_key'];
    this.site = newConfig.endpoints?.['site'] || 'datadoghq.com';
    this.logEvent('config_change', { updated: true });
  }
}

export async function createDatadogIntegration(name: string, config: IntegrationConfig): Promise<DatadogIntegration> {
  const integration = new DatadogIntegration(name, config);
  await integration.initialize();
  return integration;
}
