// Ticketing System Integration Implementations
import { IntegrationConfig } from '../types';

export class JiraIntegration {
  private endpoint: string;
  private apiKey: string;
  private projectKey: string;

  constructor(config: IntegrationConfig) {
    this.endpoint = config.apiEndpoint!;
    this.apiKey = config.parameters?.apiKey || config.apiKey!;
    this.projectKey = config.parameters?.projectKey!;
  }

  async createIssue(threat: any): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.endpoint}/rest/api/3/issue`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              project: { key: this.projectKey },
              issuetype: { name: 'Security Issue' },
              summary: `BlockStop: ${threat.type} - ${threat.severity}`,
              description: {
                version: 3,
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: `Threat ID: ${threat.id}\nType: ${threat.type}\nSeverity: ${threat.severity}\nSource: ${threat.source}\nIndicators: ${threat.indicators?.join(', ') || 'N/A'}`,
                      },
                    ],
                  },
                ],
              },
              priority: { name: this.mapSeverityToJiraPriority(threat.severity) },
              labels: [
                'blockstop',
                threat.type,
                threat.severity,
              ],
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.key;
      }
      return null;
    } catch {
      return null;
    }
  }

  async updateIssue(issueKey: string, updates: any): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.endpoint}/rest/api/3/issue/${issueKey}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: updates,
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
        `${this.endpoint}/rest/api/3/myself`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private mapSeverityToJiraPriority(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'Highest';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Lowest';
    }
  }
}

export class ServiceNowIntegration {
  private endpoint: string;
  private apiKey: string;

  constructor(config: IntegrationConfig) {
    this.endpoint = config.apiEndpoint!;
    this.apiKey = config.parameters?.apiKey || config.apiKey!;
  }

  async createIncident(threat: any): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.endpoint}/api/now/table/incident`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            short_description: `BlockStop: ${threat.type} - ${threat.severity}`,
            description: `Threat ID: ${threat.id}\nType: ${threat.type}\nSeverity: ${threat.severity}\nSource: ${threat.source}`,
            urgency: this.mapSeverityToUrgency(threat.severity),
            impact: this.mapSeverityToImpact(threat.severity),
            assignment_group: 'Security Team',
            category: 'Security',
            subcategory: 'Threat Detection',
            cmdb_ci: threat.source,
            correlation_id: threat.id,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.result.number;
      }
      return null;
    } catch {
      return null;
    }
  }

  async updateIncident(incidentId: string, updates: any): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.endpoint}/api/now/table/incident/${incidentId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
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
        `${this.endpoint}/api/now/table/sys_user/me`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private mapSeverityToUrgency(severity: string): string {
    switch (severity) {
      case 'critical':
        return '1'; // Highest
      case 'high':
        return '2'; // High
      case 'medium':
        return '3'; // Medium
      case 'low':
        return '4'; // Low
      default:
        return '5'; // Lowest
    }
  }

  private mapSeverityToImpact(severity: string): string {
    switch (severity) {
      case 'critical':
        return '1'; // High
      case 'high':
        return '2'; // Medium
      case 'medium':
        return '2'; // Medium
      case 'low':
        return '3'; // Low
      default:
        return '3'; // Low
    }
  }
}

export class PagerDutyIntegration {
  private apiKey: string;
  private serviceId: string;

  constructor(config: IntegrationConfig) {
    this.apiKey = config.parameters?.apiKey || config.apiKey!;
    this.serviceId = config.parameters?.serviceId!;
  }

  async createIncident(threat: any): Promise<string | null> {
    try {
      const response = await fetch(
        'https://events.pagerduty.com/v2/enqueue',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            routing_key: this.apiKey,
            event_action: 'trigger',
            payload: {
              summary: `BlockStop: ${threat.type} - ${threat.severity}`,
              severity: this.mapSeverityToPagerDutySeverity(
                threat.severity
              ),
              source: 'BlockStop',
              custom_details: {
                threatId: threat.id,
                threatType: threat.type,
                source: threat.source,
                indicators: threat.indicators,
              },
            },
            dedup_key: threat.id,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.dedup_key;
      }
      return null;
    } catch {
      return null;
    }
  }

  async resolveIncident(dedupeKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        'https://events.pagerduty.com/v2/enqueue',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            routing_key: this.apiKey,
            event_action: 'resolve',
            dedup_key: dedupeKey,
          }),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private mapSeverityToPagerDutySeverity(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  }
}
