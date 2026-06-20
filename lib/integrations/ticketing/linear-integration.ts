/**
 * Linear Integration
 * Creates and manages issues in Linear for security incident tracking
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent } from '../types';
import fetch from 'node-fetch';

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string;
  priority: number;
  state: { id: string; name: string };
  assignee?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export class LinearIntegration extends IntegrationBase {
  private apiKey: string;
  private teamKey: string;
  private apiUrl: string;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.apiKey = config.auth.credentials['api_key'];
    this.teamKey = config.endpoints?.['team_key'] || 'SEC';
    this.apiUrl = 'https://api.linear.app/graphql';
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<T> {
    const headers = {
      ...this.getAuthHeaders(),
      'Content-Type': 'application/json',
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Linear API error: ${response.statusText}`);
    }

    const result: any = await response.json();
    if (result.errors) {
      throw new Error(`Linear GraphQL error: ${result.errors[0].message}`);
    }

    return result.data as T;
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const threat = payload.data;

    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'linear',
      category: threat.category || 'security_incident',
      severity: this.mapSeverity(threat.severity),
      title: threat.title || 'Security Incident',
      description: threat.description || 'Threat detected by BlockStop',
      data: threat,
      relatedEntities: threat.relatedEntities || [],
      tags: ['linear', 'security', threat.type].filter(Boolean),
    };
  }

  /**
   * Create issue from threat
   */
  async createIssue(event: TransformedEvent): Promise<string> {
    const query = `
      mutation {
        issueCreate(input: {
          teamId: "${this.teamKey}"
          title: "[${event.severity.toUpperCase()}] ${event.title}"
          description: "${this.escapeGraphQL(event.description)}"
          priority: ${this.mapPriority(event.severity)}
          labels: {
            connectOrCreate: [
              ${(event.tags || []).map((tag) => `{ name: "${tag}" }`).join(',')}
            ]
          }
        }) {
          issue {
            id
            identifier
          }
        }
      }
    `;

    const result = await this.executeRequest<any>(
      'POST',
      '',
      { query }
    );

    return result.issueCreate.issue.identifier;
  }

  /**
   * Update issue status
   */
  async updateIssueStatus(issueId: string, status: 'Backlog' | 'Todo' | 'In Progress' | 'Done' | 'Cancelled'): Promise<void> {
    const query = `
      mutation {
        issueUpdate(id: "${issueId}", input: {
          stateId: "${status}"
        }) {
          issue {
            id
          }
        }
      }
    `;

    await this.executeRequest('POST', '', { query });
  }

  /**
   * Get issue details
   */
  async getIssue(issueId: string): Promise<LinearIssue> {
    const query = `
      query {
        issue(id: "${issueId}") {
          id
          identifier
          title
          description
          priority
          state {
            id
            name
          }
          assignee {
            id
            name
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await this.executeRequest<any>(
      'POST',
      '',
      { query }
    );

    return result.issue;
  }

  /**
   * Search issues
   */
  async searchIssues(query: string, limit: number = 50): Promise<LinearIssue[]> {
    const graphqlQuery = `
      query {
        issues(first: ${limit}, filter: {
          searchableTitle: {
            contains: "${this.escapeGraphQL(query)}"
          }
        }) {
          nodes {
            id
            identifier
            title
            description
            priority
            state {
              id
              name
            }
            createdAt
            updatedAt
          }
        }
      }
    `;

    const result = await this.executeRequest<any>(
      'POST',
      '',
      { query: graphqlQuery }
    );

    return result.issues.nodes;
  }

  /**
   * Add comment to issue
   */
  async addComment(issueId: string, comment: string): Promise<void> {
    const query = `
      mutation {
        commentCreate(input: {
          issueId: "${issueId}"
          body: "${this.escapeGraphQL(comment)}"
        }) {
          comment {
            id
          }
        }
      }
    `;

    await this.executeRequest('POST', '', { query });
  }

  /**
   * Assign issue
   */
  async assignIssue(issueId: string, assigneeId: string): Promise<void> {
    const query = `
      mutation {
        issueUpdate(id: "${issueId}", input: {
          assigneeId: "${assigneeId}"
        }) {
          issue {
            id
          }
        }
      }
    `;

    await this.executeRequest('POST', '', { query });
  }

  /**
   * Link issues
   */
  async linkIssues(fromId: string, toId: string, relation: 'blocks' | 'relates_to' | 'duplicates'): Promise<void> {
    const query = `
      mutation {
        issueRelationCreate(input: {
          issueId: "${fromId}"
          relatedIssueId: "${toId}"
          type: "${relation}"
        }) {
          issueRelation {
            id
          }
        }
      }
    `;

    await this.executeRequest('POST', '', { query });
  }

  /**
   * Create project
   */
  async createProject(name: string, key: string): Promise<string> {
    const query = `
      mutation {
        projectCreate(input: {
          name: "${name}"
          key: "${key}"
        }) {
          project {
            id
          }
        }
      }
    `;

    const result = await this.executeRequest<any>(
      'POST',
      '',
      { query }
    );

    return result.projectCreate.project.id;
  }

  /**
   * Get team members
   */
  async getTeamMembers(): Promise<Array<{ id: string; name: string; email: string }>> {
    const query = `
      query {
        team(id: "${this.teamKey}") {
          members {
            nodes {
              id
              name
              email
            }
          }
        }
      }
    `;

    const result = await this.executeRequest<any>(
      'POST',
      '',
      { query }
    );

    return result.team.members.nodes;
  }

  /**
   * Map severity to priority (0-4, where 4 is urgent)
   */
  private mapPriority(severity: TransformedEvent['severity']): number {
    const priorityMap: Record<TransformedEvent['severity'], number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0,
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

  /**
   * Escape GraphQL strings
   */
  private escapeGraphQL(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  protected async checkDataFlow(): Promise<boolean> {
    try {
      const query = 'query { viewer { id } }';
      await this.executeRequest('POST', '', { query });
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'Linear integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.apiKey = newConfig.auth.credentials['api_key'];
    this.teamKey = newConfig.endpoints?.['team_key'] || 'SEC';
    this.logEvent('config_change', { updated: true });
  }
}

export async function createLinearIntegration(name: string, config: IntegrationConfig): Promise<LinearIntegration> {
  const integration = new LinearIntegration(name, config);
  await integration.initialize();
  return integration;
}
