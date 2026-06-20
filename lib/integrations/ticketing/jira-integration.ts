/**
 * Jira Integration
 * Creates and manages security incidents as Jira tickets
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent, TicketData } from '../types';
import fetch from 'node-fetch';

interface JiraIssue {
  key: string;
  id: string;
  fields: {
    summary: string;
    description: string;
    priority: { id: string; name: string };
    assignee?: { displayName: string };
    status: { name: string };
    created: string;
    updated: string;
  };
}

interface CreateIssueRequest {
  fields: {
    project: { key: string };
    summary: string;
    description: string;
    issuetype: { name: string };
    priority: { name: string };
    labels: string[];
    customfield_blockstop_threat_id?: string;
    customfield_blockstop_severity?: string;
  };
}

export class JiraIntegration extends IntegrationBase {
  private jiraUrl: string;
  private projectKey: string;
  private issueType: string;
  private username: string;
  private apiToken: string;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.jiraUrl = config.endpoints?.['url'] || 'https://your-jira.atlassian.net';
    this.projectKey = config.endpoints?.['project'] || 'SEC';
    this.issueType = config.endpoints?.['issue_type'] || 'Bug';
    this.username = config.auth.credentials['username'];
    this.apiToken = config.auth.credentials['api_token'];
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<T> {
    const url = `${this.jiraUrl}/rest/api/3${endpoint}`;
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
      throw new Error(`Jira API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const threat = payload.data;

    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'jira',
      category: threat.category || 'security_incident',
      severity: this.mapSeverity(threat.severity),
      title: threat.title || 'Security Incident',
      description: threat.description || 'Threat detected by BlockStop',
      data: threat,
      relatedEntities: threat.relatedEntities || [],
      tags: ['jira', 'ticket', threat.type].filter(Boolean),
    };
  }

  /**
   * Create ticket from threat
   */
  async createTicket(event: TransformedEvent): Promise<string> {
    const issueRequest: CreateIssueRequest = {
      fields: {
        project: { key: this.projectKey },
        summary: `[${event.severity.toUpperCase()}] ${event.title}`,
        description: this.formatDescription(event),
        issuetype: { name: this.issueType },
        priority: { name: this.mapPriority(event.severity) },
        labels: event.tags || [],
        customfield_blockstop_threat_id: event.id,
        customfield_blockstop_severity: event.severity,
      },
    };

    const result = await this.makeRequest<JiraIssue>(
      'POST',
      '/issues',
      issueRequest
    );

    return result.key;
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketKey: string, status: 'In Progress' | 'Done' | 'In Review'): Promise<void> {
    const transitions = await this.getTransitions(ticketKey);
    const transition = transitions.find((t) => t.to.name === status);

    if (!transition) {
      throw new Error(`Status '${status}' not available`);
    }

    await this.makeRequest(
      'POST',
      `/issues/${ticketKey}/transitions`,
      { transition: { id: transition.id } }
    );
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketKey: string, comment: string): Promise<void> {
    await this.makeRequest(
      'POST',
      `/issues/${ticketKey}/comments`,
      {
        body: {
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment,
                },
              ],
            },
          ],
        },
      }
    );
  }

  /**
   * Get issue details
   */
  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.makeRequest<JiraIssue>('GET', `/issues/${issueKey}`);
  }

  /**
   * Search issues
   */
  async searchIssues(jql: string): Promise<JiraIssue[]> {
    const result = await this.makeRequest<{ issues: JiraIssue[] }>(
      'GET',
      `/search?jql=${encodeURIComponent(jql)}`
    );

    return result.issues;
  }

  /**
   * Get transitions
   */
  private async getTransitions(issueKey: string): Promise<any[]> {
    const result = await this.makeRequest<{ transitions: any[] }>(
      'GET',
      `/issues/${issueKey}/transitions`
    );

    return result.transitions;
  }

  /**
   * Link issue to another issue
   */
  async linkIssue(fromKey: string, toKey: string, linkType: string = 'relates to'): Promise<void> {
    await this.makeRequest(
      'POST',
      '/issueLink',
      {
        type: { name: linkType },
        inwardIssue: { key: fromKey },
        outwardIssue: { key: toKey },
      }
    );
  }

  /**
   * Assign ticket
   */
  async assignTicket(ticketKey: string, assignee: string): Promise<void> {
    await this.makeRequest(
      'PUT',
      `/issues/${ticketKey}/assignee`,
      { accountId: assignee }
    );
  }

  /**
   * Format description
   */
  private formatDescription(event: TransformedEvent): string {
    const lines = [
      `*Threat ID:* ${event.id}`,
      `*Severity:* ${event.severity.toUpperCase()}`,
      `*Category:* ${event.category}`,
      `*Detected:* ${event.timestamp.toISOString()}`,
      '',
      `${event.description}`,
      '',
      '*Related Data:*',
      `{code:json}${JSON.stringify(event.data, null, 2)}{code}`,
    ];

    return lines.join('\n');
  }

  /**
   * Map severity to priority
   */
  private mapPriority(severity: TransformedEvent['severity']): string {
    const priorityMap: Record<TransformedEvent['severity'], string> = {
      critical: 'Highest',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      info: 'Lowest',
    };

    return priorityMap[severity];
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
    const credentials = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
    return {
      Authorization: `Basic ${credentials}`,
    };
  }

  protected async checkDataFlow(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/myself');
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'Jira integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.jiraUrl = newConfig.endpoints?.['url'] || 'https://your-jira.atlassian.net';
    this.projectKey = newConfig.endpoints?.['project'] || 'SEC';
    this.issueType = newConfig.endpoints?.['issue_type'] || 'Bug';
    this.username = newConfig.auth.credentials['username'];
    this.apiToken = newConfig.auth.credentials['api_token'];
    this.logEvent('config_change', { updated: true });
  }
}

export async function createJiraIntegration(name: string, config: IntegrationConfig): Promise<JiraIntegration> {
  const integration = new JiraIntegration(name, config);
  await integration.initialize();
  return integration;
}
