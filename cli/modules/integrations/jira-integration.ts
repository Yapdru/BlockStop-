/**
 * BlockStop JIRA Integration
 * Create and update security tickets
 */

import axios from 'axios';
import BaseIntegration, { AlertPayload, IntegrationConfig, IntegrationError } from './base-integration.js';

export interface JiraConfig extends IntegrationConfig {
  instanceUrl?: string;
  email?: string;
  apiToken?: string;
  projectKey?: string;
  issueType?: string;
}

export interface JiraTicket {
  key: string;
  url: string;
  summary: string;
}

export class JiraIntegration extends BaseIntegration {
  private instanceUrl: string | null = null;
  private email: string | null = null;
  private apiToken: string | null = null;
  private projectKey: string = 'SEC';
  private issueType: string = 'Security';

  constructor(config: JiraConfig) {
    super('jira', config);
    this.instanceUrl = config.instanceUrl || null;
    this.email = config.email || null;
    this.apiToken = config.apiToken || null;
    this.projectKey = config.projectKey || 'SEC';
    this.issueType = config.issueType || 'Security';
  }

  /**
   * Authenticate with JIRA
   */
  async authenticate(): Promise<void> {
    try {
      if (!this.instanceUrl || !this.email || !this.apiToken) {
        throw new Error('Missing required JIRA configuration: instanceUrl, email, or apiToken');
      }

      // Test connection
      await this.makeRequest('GET', '/rest/api/3/myself');
      this.isAuthenticated = true;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate configuration
   */
  async validate(): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!this.config.enabled) {
      return { valid: true };
    }

    if (!this.instanceUrl || !this.instanceUrl.startsWith('https://')) {
      errors.push('Invalid JIRA instance URL');
    }

    if (!this.email || !this.email.includes('@')) {
      errors.push('Invalid email format');
    }

    if (!this.apiToken) {
      errors.push('API token required');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    try {
      await this.authenticate();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Send alert to JIRA
   */
  async sendAlert(payload: AlertPayload): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new IntegrationError('jira', 'NOT_AUTHENTICATED', 'JIRA integration not authenticated');
      }

      await this.createTicket(payload);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create JIRA ticket
   */
  async createTicket(payload: AlertPayload): Promise<JiraTicket> {
    try {
      if (!this.instanceUrl) {
        throw new Error('JIRA instance URL not configured');
      }

      const severityMap: Record<string, string> = {
        CRITICAL: 'Blocker',
        HIGH: 'Critical',
        MEDIUM: 'Major',
        LOW: 'Minor',
      };

      const issueData = {
        fields: {
          project: { key: this.projectKey },
          summary: `[${payload.severity}] ${payload.title}`,
          description: {
            version: 1,
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: payload.description,
                  },
                ],
              },
              ...(payload.details
                ? [
                    {
                      type: 'heading',
                      attrs: { level: 2 },
                      content: [
                        {
                          type: 'text',
                          text: 'Details',
                        },
                      ],
                    },
                    {
                      type: 'codeBlock',
                      attrs: { language: 'json' },
                      content: [
                        {
                          type: 'text',
                          text: JSON.stringify(payload.details, null, 2),
                        },
                      ],
                    },
                  ]
                : []),
            ],
          },
          issuetype: { name: this.issueType },
          priority: { name: severityMap[payload.severity] || 'Major' },
          labels: ['blockstop', 'security', payload.severity.toLowerCase()],
        },
      };

      const response = await this.makeRequest('POST', '/rest/api/3/issues', issueData);

      return {
        key: response.key,
        url: `${this.instanceUrl}/browse/${response.key}`,
        summary: issueData.fields.summary,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketKey: string, status: string): Promise<void> {
    try {
      // Get available transitions
      const transitionsResponse = await this.makeRequest(
        'GET',
        `/rest/api/3/issues/${ticketKey}/transitions`
      );

      // Find transition for desired status
      const transition = (transitionsResponse.transitions as Array<any>).find(
        t => t.to.name.toLowerCase() === status.toLowerCase()
      );

      if (!transition) {
        throw new Error(`Transition to ${status} not available`);
      }

      // Execute transition
      await this.makeRequest('POST', `/rest/api/3/issues/${ticketKey}/transitions`, {
        transition: { id: transition.id },
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add comment to ticket
   */
  async addComment(ticketKey: string, comment: string): Promise<void> {
    try {
      await this.makeRequest('POST', `/rest/api/3/issues/${ticketKey}/comments`, {
        body: {
          version: 1,
          type: 'doc',
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
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make authenticated JIRA API request
   */
  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: unknown
  ): Promise<any> {
    if (!this.instanceUrl || !this.email || !this.apiToken) {
      throw new Error('JIRA not configured');
    }

    const credentials = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');

    try {
      const response = await axios({
        method,
        url: `${this.instanceUrl}${path}`,
        data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${credentials}`,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`JIRA API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
}

export default JiraIntegration;
