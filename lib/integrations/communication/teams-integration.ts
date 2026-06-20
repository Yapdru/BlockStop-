/**
 * Microsoft Teams Integration
 * Sends BlockStop security alerts to Microsoft Teams
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent } from '../types';
import fetch from 'node-fetch';

export class TeamsIntegration extends IntegrationBase {
  private webhookUrl: string;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.webhookUrl = config.auth.credentials['webhook_url'];
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<T> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Teams API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const threat = payload.data;
    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'teams',
      category: threat.category || 'security_alert',
      severity: this.mapSeverity(threat.severity),
      title: threat.title || 'Security Alert',
      description: threat.description || 'Threat detected by BlockStop',
      data: threat,
      relatedEntities: threat.relatedEntities || [],
      tags: ['teams', 'alert', threat.type].filter(Boolean),
    };
  }

  /**
   * Send threat alert to Teams
   */
  async sendThreatAlert(event: TransformedEvent): Promise<void> {
    const color = this.getSeverityColor(event.severity);
    const card = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: event.title,
      themeColor: color,
      sections: [
        {
          activityTitle: `${event.severity.toUpperCase()}: ${event.title}`,
          activitySubtitle: event.timestamp.toISOString(),
          text: event.description,
          facts: [
            { name: 'Threat ID', value: event.id },
            { name: 'Category', value: event.category },
            { name: 'Severity', value: event.severity },
          ],
        },
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Details',
          targets: [{ os: 'default', uri: `https://blockstop.ai/threats/${event.id}` }],
        },
      ],
    };

    await this.executeRequest('POST', '', card);
  }

  private getSeverityColor(severity: TransformedEvent['severity']): string {
    const colors: Record<TransformedEvent['severity'], string> = {
      critical: 'FF0000',
      high: 'FF6600',
      medium: 'FFBB33',
      low: '00AA00',
      info: '0099CC',
    };
    return colors[severity];
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

  protected async checkDataFlow(): Promise<boolean> {
    try {
      await this.executeRequest('POST', '', { text: 'Health check' });
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'Teams integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.webhookUrl = newConfig.auth.credentials['webhook_url'];
    this.logEvent('config_change', { updated: true });
  }
}

export async function createTeamsIntegration(name: string, config: IntegrationConfig): Promise<TeamsIntegration> {
  const integration = new TeamsIntegration(name, config);
  await integration.initialize();
  return integration;
}
