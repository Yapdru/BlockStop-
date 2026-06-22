/**
 * BlockStop Integration Manager
 * Orchestrates all integrations
 */

import ConfigManager from '../config-manager.js';
import { AlertPayload, IntegrationError } from './base-integration.js';
import SlackIntegration, { SlackConfig } from './slack-integration.js';
import JiraIntegration, { JiraConfig } from './jira-integration.js';
import WebhookIntegration, { WebhookConfig } from './webhook-integration.js';

export interface IntegrationStatus {
  name: string;
  enabled: boolean;
  authenticated: boolean;
  ready: boolean;
  error?: string;
}

export class IntegrationManager {
  private configManager: ConfigManager;
  private slack: SlackIntegration | null = null;
  private jira: JiraIntegration | null = null;
  private webhook: WebhookIntegration | null = null;
  private initialized = false;

  constructor(homeDir?: string) {
    this.configManager = new ConfigManager(homeDir);
  }

  /**
   * Initialize all integrations from config
   */
  async initialize(): Promise<void> {
    try {
      const config = await this.configManager.loadConfig();

      // Initialize Slack
      if (config.integrations.slack?.enabled) {
        const slackConfig = config.integrations.slack as SlackConfig;
        this.slack = new SlackIntegration(slackConfig);
        try {
          await this.slack.authenticate();
        } catch (e) {
          console.error('Failed to authenticate Slack:', e instanceof Error ? e.message : String(e));
        }
      }

      // Initialize JIRA
      if (config.integrations.jira?.enabled) {
        const jiraConfig = config.integrations.jira as JiraConfig;
        this.jira = new JiraIntegration(jiraConfig);
        try {
          await this.jira.authenticate();
        } catch (e) {
          console.error('Failed to authenticate JIRA:', e instanceof Error ? e.message : String(e));
        }
      }

      // Initialize Webhook
      if (config.integrations.webhook?.enabled) {
        const webhookConfig = config.integrations.webhook as WebhookConfig;
        this.webhook = new WebhookIntegration(webhookConfig);
        try {
          await this.webhook.authenticate();
        } catch (e) {
          console.error('Failed to authenticate Webhook:', e instanceof Error ? e.message : String(e));
        }
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize integrations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all active integrations
   */
  getActiveIntegrations(): string[] {
    const active: string[] = [];

    if (this.slack?.isReady()) active.push('slack');
    if (this.jira?.isReady()) active.push('jira');
    if (this.webhook?.isReady()) active.push('webhook');

    return active;
  }

  /**
   * Dispatch alert to all enabled integrations
   */
  async dispatchAlert(alert: AlertPayload): Promise<{ success: string[]; failed: string[] }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const success: string[] = [];
    const failed: string[] = [];

    // Send to Slack
    if (this.slack?.isReady()) {
      try {
        await this.slack.sendAlert(alert);
        success.push('slack');
      } catch (e) {
        failed.push(`slack: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Send to JIRA
    if (this.jira?.isReady()) {
      try {
        await this.jira.sendAlert(alert);
        success.push('jira');
      } catch (e) {
        failed.push(`jira: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Send to Webhook
    if (this.webhook?.isReady()) {
      try {
        await this.webhook.sendAlert(alert);
        success.push('webhook');
      } catch (e) {
        failed.push(`webhook: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return { success, failed };
  }

  /**
   * Test specific integration
   */
  async testIntegration(name: string): Promise<{ valid: boolean; errors?: string[] }> {
    switch (name.toLowerCase()) {
      case 'slack':
        if (!this.slack) {
          return { valid: false, errors: ['Slack not configured'] };
        }
        return this.slack.validate();

      case 'jira':
        if (!this.jira) {
          return { valid: false, errors: ['JIRA not configured'] };
        }
        return this.jira.validate();

      case 'webhook':
        if (!this.webhook) {
          return { valid: false, errors: ['Webhook not configured'] };
        }
        return this.webhook.validate();

      default:
        return { valid: false, errors: [`Unknown integration: ${name}`] };
    }
  }

  /**
   * Get status of all integrations
   */
  async getIntegrationStatus(): Promise<IntegrationStatus[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const statuses: IntegrationStatus[] = [];

    if (this.slack) {
      const status = await this.slack.getStatus();
      statuses.push(status);
    }

    if (this.jira) {
      const status = await this.jira.getStatus();
      statuses.push(status);
    }

    if (this.webhook) {
      const status = await this.webhook.getStatus();
      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Enable integration
   */
  async enableIntegration(name: string, config?: unknown): Promise<void> {
    const integrationName = name.toLowerCase() as 'slack' | 'jira' | 'webhook';

    switch (integrationName) {
      case 'slack':
      case 'jira':
      case 'webhook':
        await this.configManager.setIntegration(integrationName, true, config);
        // Re-initialize
        this.initialized = false;
        await this.initialize();
        break;

      default:
        throw new Error(`Unknown integration: ${name}`);
    }
  }

  /**
   * Disable integration
   */
  async disableIntegration(name: string): Promise<void> {
    const integrationName = name.toLowerCase() as 'slack' | 'jira' | 'webhook';

    switch (integrationName) {
      case 'slack':
      case 'jira':
      case 'webhook':
        await this.configManager.setIntegration(integrationName, false);
        // Re-initialize
        this.initialized = false;
        await this.initialize();
        break;

      default:
        throw new Error(`Unknown integration: ${name}`);
    }
  }

  /**
   * Format status for display
   */
  static formatStatus(statuses: IntegrationStatus[]): string {
    let output = 'Integration Status\n';
    output += '='.repeat(50) + '\n\n';

    if (statuses.length === 0) {
      output += 'No integrations configured\n';
      return output;
    }

    statuses.forEach(status => {
      const statusIcon = status.ready ? '✅' : '❌';
      const authIcon = status.authenticated ? '🔐' : '🔓';

      output += `${statusIcon} ${status.name.toUpperCase()}\n`;
      output += `  Enabled:       ${status.enabled ? 'Yes' : 'No'}\n`;
      output += `  Authenticated: ${authIcon}\n`;

      if (status.error) {
        output += `  Error:         ${status.error}\n`;
      }

      output += '\n';
    });

    return output;
  }
}

export default IntegrationManager;
