// SIEM Integration Implementations
import { Integration, IntegrationConfig } from '../types';

export class SplunkIntegration {
  private endpoint: string;
  private apiKey: string;
  private index: string;

  constructor(config: IntegrationConfig) {
    this.endpoint = config.apiEndpoint!;
    this.apiKey = config.parameters?.apiKey || config.apiKey!;
    this.index = config.parameters?.index || 'blockstop_threats';
  }

  async sendEvent(event: any): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.endpoint}/services/collector/event`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Splunk ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event,
            sourcetype: '_json',
            index: this.index,
          }),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/services/server/info`, {
        headers: {
          'Authorization': `Splunk ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class ElasticsearchIntegration {
  private endpoint: string;
  private username: string;
  private password: string;
  private index: string;

  constructor(config: IntegrationConfig) {
    this.endpoint = config.apiEndpoint!;
    this.username = config.parameters?.username!;
    this.password = config.parameters?.password!;
    this.index = config.parameters?.index || 'blockstop-threats';
  }

  async sendEvent(event: any): Promise<boolean> {
    try {
      const auth = Buffer.from(
        `${this.username}:${this.password}`
      ).toString('base64');

      const response = await fetch(
        `${this.endpoint}/${this.index}/_doc`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const auth = Buffer.from(
        `${this.username}:${this.password}`
      ).toString('base64');

      const response = await fetch(`${this.endpoint}/_cluster/health`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async createMapping(): Promise<void> {
    const auth = Buffer.from(
      `${this.username}:${this.password}`
    ).toString('base64');

    const mapping = {
      mappings: {
        properties: {
          threatId: { type: 'keyword' },
          threatType: { type: 'keyword' },
          severity: { type: 'keyword' },
          status: { type: 'keyword' },
          source: { type: 'keyword' },
          timestamp: { type: 'date' },
          indicators: { type: 'keyword' },
          analysis: { type: 'object' },
        },
      },
    };

    await fetch(`${this.endpoint}/${this.index}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mapping),
    });
  }
}

export class DatadogIntegration {
  private apiKey: string;
  private appKey: string;
  private site: string;

  constructor(config: IntegrationConfig) {
    this.apiKey = config.parameters?.apiKey || config.apiKey!;
    this.appKey = config.parameters?.appKey!;
    this.site = config.parameters?.site || 'datadoghq.com';
  }

  async sendEvent(event: any): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.${this.site}/api/v1/events`,
        {
          method: 'POST',
          headers: {
            'DD-API-KEY': this.apiKey,
            'DD-APPLICATION-KEY': this.appKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `BlockStop Threat: ${event.type}`,
            text: JSON.stringify(event),
            priority: this.getPriority(event.severity),
            tags: [
              `threat:${event.type}`,
              `severity:${event.severity}`,
              `source:${event.source}`,
            ],
            alert_type: 'error',
          }),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.${this.site}/api/v1/validate`,
        {
          headers: {
            'DD-API-KEY': this.apiKey,
            'DD-APPLICATION-KEY': this.appKey,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private getPriority(
    severity: string
  ): 'low' | 'normal' | 'high' | 'urgent' {
    switch (severity) {
      case 'critical':
        return 'urgent';
      case 'high':
        return 'high';
      case 'medium':
        return 'normal';
      default:
        return 'low';
    }
  }
}

export class NewRelicIntegration {
  private apiKey: string;
  private accountId: string;

  constructor(config: IntegrationConfig) {
    this.apiKey = config.parameters?.apiKey || config.apiKey!;
    this.accountId = config.parameters?.accountId!;
  }

  async sendEvent(event: any): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.newrelic.com/v1/accounts/${this.accountId}/events`,
        {
          method: 'POST',
          headers: {
            'X-Insert-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            {
              eventType: 'BlockStopThreat',
              threatType: event.type,
              severity: event.severity,
              status: event.status,
              timestamp: Date.now(),
              ...event,
            },
          ]),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.newrelic.com/graphql`,
        {
          method: 'POST',
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: '{ actor { account(id: ' + this.accountId + ') { name } } }',
          }),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
