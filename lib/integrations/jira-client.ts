/**
 * Jira API Client
 * Handles ticket creation and management in Jira
 */

import axios, { AxiosInstance } from 'axios';

interface JiraIssue {
  project: string;
  summary: string;
  description?: string;
  issueType: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  customFields?: Record<string, any>;
}

interface JiraIssueResponse {
  key: string;
  id: string;
  self: string;
}

export class JiraClient {
  private client: AxiosInstance;
  private instanceUrl: string;

  constructor(
    instanceUrl: string,
    email: string,
    apiToken: string,
    options: { verifySsl?: boolean } = {}
  ) {
    this.instanceUrl = instanceUrl.replace(/\/$/, '');

    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

    this.client = axios.create({
      baseURL: `${this.instanceUrl}/rest/api/3`,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: !options.verifySsl ? { rejectUnauthorized: false } : undefined,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[JiraClient] Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Create an issue
   */
  async createIssue(issue: JiraIssue): Promise<JiraIssueResponse> {
    try {
      const fields: Record<string, any> = {
        project: { key: issue.project },
        summary: issue.summary,
        description: {
          version: 3,
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: issue.description || '',
                },
              ],
            },
          ],
        },
        issuetype: { name: issue.issueType },
      };

      if (issue.priority) {
        fields.priority = { name: issue.priority };
      }

      if (issue.assignee) {
        fields.assignee = { name: issue.assignee };
      }

      if (issue.labels && issue.labels.length > 0) {
        fields.labels = issue.labels;
      }

      if (issue.customFields) {
        Object.assign(fields, issue.customFields);
      }

      const response = await this.client.post('/issues', { fields });

      return {
        key: response.data.key,
        id: response.data.id,
        self: response.data.self,
      };
    } catch (error) {
      throw new Error(`Failed to create Jira issue: ${error}`);
    }
  }

  /**
   * Update an issue
   */
  async updateIssue(
    issueKey: string,
    updates: Partial<JiraIssue>
  ): Promise<{ success: boolean }> {
    try {
      const fields: Record<string, any> = {};

      if (updates.summary) fields.summary = updates.summary;

      if (updates.description) {
        fields.description = {
          version: 3,
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: updates.description,
                },
              ],
            },
          ],
        };
      }

      if (updates.priority) {
        fields.priority = { name: updates.priority };
      }

      if (updates.assignee) {
        fields.assignee = { name: updates.assignee };
      }

      if (updates.labels) {
        fields.labels = updates.labels;
      }

      if (updates.customFields) {
        Object.assign(fields, updates.customFields);
      }

      await this.client.put(`/issues/${issueKey}`, { fields });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update Jira issue: ${error}`);
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueKey: string, comment: string): Promise<{ id: string }> {
    try {
      const response = await this.client.post(`/issues/${issueKey}/comments`, {
        body: {
          version: 3,
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

      return { id: response.data.id };
    } catch (error) {
      throw new Error(`Failed to add Jira comment: ${error}`);
    }
  }

  /**
   * Get issue details
   */
  async getIssue(issueKey: string): Promise<Record<string, any>> {
    try {
      const response = await this.client.get(`/issues/${issueKey}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Jira issue: ${error}`);
    }
  }

  /**
   * Search issues using JQL
   */
  async searchIssues(jql: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await this.client.get('/search', {
        params: {
          jql,
          maxResults: limit,
        },
      });

      return response.data.issues;
    } catch (error) {
      throw new Error(`Failed to search Jira issues: ${error}`);
    }
  }

  /**
   * Transition an issue (e.g., change status)
   */
  async transitionIssue(issueKey: string, transitionId: string): Promise<boolean> {
    try {
      await this.client.post(`/issues/${issueKey}/transitions`, {
        transition: { id: transitionId },
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to transition Jira issue: ${error}`);
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueKey: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await this.client.get(`/issues/${issueKey}/transitions`);

      return response.data.transitions.map((t: any) => ({
        id: t.id,
        name: t.name,
      }));
    } catch (error) {
      throw new Error(`Failed to get Jira transitions: ${error}`);
    }
  }

  /**
   * Create an epic
   */
  async createEpic(data: { name: string; key: string }): Promise<JiraIssueResponse> {
    try {
      const response = await this.client.post('/issues', {
        fields: {
          project: { key: data.key },
          summary: data.name,
          issuetype: { name: 'Epic' },
        },
      });

      return {
        key: response.data.key,
        id: response.data.id,
        self: response.data.self,
      };
    } catch (error) {
      throw new Error(`Failed to create Jira epic: ${error}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ isValid: boolean; error?: string }> {
    try {
      const response = await this.client.get('/myself');

      if (response.status === 200) {
        return { isValid: true };
      }

      return { isValid: false, error: 'Unexpected response' };
    } catch (error) {
      return { isValid: false, error: String(error) };
    }
  }
}

export default JiraClient;
