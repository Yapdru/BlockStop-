/**
 * BlockStop Slack Integration
 * Send security alerts to Slack
 */

import axios from 'axios';
import BaseIntegration, { AlertPayload, IntegrationConfig, IntegrationError } from './base-integration.js';

export interface SlackConfig extends IntegrationConfig {
  webhookUrl?: string;
  botToken?: string;
  channel?: string;
}

export class SlackIntegration extends BaseIntegration {
  private webhookUrl: string | null = null;
  private botToken: string | null = null;
  private channel: string = '#security-alerts';

  constructor(config: SlackConfig) {
    super('slack', config);
    this.webhookUrl = config.webhookUrl || null;
    this.botToken = config.botToken || null;
    this.channel = config.channel || '#security-alerts';
  }

  /**
   * Authenticate with Slack
   */
  async authenticate(): Promise<void> {
    try {
      if (!this.webhookUrl && !this.botToken) {
        throw new Error('Neither webhookUrl nor botToken provided');
      }

      // Test webhook connection
      if (this.webhookUrl) {
        await axios.post(this.webhookUrl, {
          text: 'BlockStop Slack integration initialized',
          mrkdwn: true,
        });
      } else if (this.botToken) {
        // Test bot token by checking auth
        await axios.get('https://slack.com/api/auth.test', {
          headers: { Authorization: `Bearer ${this.botToken}` },
        });
      }

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

    if (!this.webhookUrl && !this.botToken) {
      errors.push('Either webhookUrl or botToken must be provided');
    }

    if (this.webhookUrl && !this.webhookUrl.startsWith('https://hooks.slack.com')) {
      errors.push('Invalid webhook URL format');
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
   * Send alert to Slack
   */
  async sendAlert(payload: AlertPayload): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new IntegrationError('slack', 'NOT_AUTHENTICATED', 'Slack integration not authenticated');
      }

      const formatted = this.formatSlackMessage(payload);

      if (this.webhookUrl) {
        await axios.post(this.webhookUrl, formatted, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        });
      } else if (this.botToken) {
        await axios.post('https://slack.com/api/chat.postMessage', formatted, {
          headers: {
            Authorization: `Bearer ${this.botToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        });
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Format payload as Slack message
   */
  private formatSlackMessage(payload: AlertPayload): Record<string, unknown> {
    const severityColor: Record<string, string> = {
      LOW: '#36a64f',
      MEDIUM: '#faa61a',
      HIGH: '#ff6b35',
      CRITICAL: '#d13438',
    };

    const severityEmoji: Record<string, string> = {
      LOW: ':information_source:',
      MEDIUM: ':warning:',
      HIGH: ':rotating_light:',
      CRITICAL: ':alert:',
    };

    return {
      channel: this.channel,
      text: `${severityEmoji[payload.severity]} ${payload.title}`,
      attachments: [
        {
          color: severityColor[payload.severity],
          title: payload.title,
          text: payload.description,
          fields: [
            {
              title: 'Severity',
              value: payload.severity,
              short: true,
            },
            {
              title: 'Timestamp',
              value: payload.timestamp || new Date().toISOString(),
              short: true,
            },
            ...(payload.source
              ? [
                  {
                    title: 'Source',
                    value: payload.source,
                    short: true,
                  },
                ]
              : []),
            ...(payload.details
              ? [
                  {
                    title: 'Details',
                    value: JSON.stringify(payload.details, null, 2),
                    short: false,
                  },
                ]
              : []),
          ],
          footer: 'BlockStop Security',
          footer_icon: 'https://blockstop.io/favicon.ico',
        },
      ],
    };
  }

  /**
   * Send structured data to Slack
   */
  async sendStructuredData(title: string, data: Record<string, unknown>): Promise<void> {
    await this.sendAlert({
      severity: 'MEDIUM',
      title,
      description: 'Structured data report',
      details: data,
    });
  }

  /**
   * Send rich formatted message
   */
  async sendRichMessage(blocks: Record<string, unknown>[]): Promise<void> {
    if (!this.isReady()) {
      throw new IntegrationError('slack', 'NOT_AUTHENTICATED', 'Slack integration not authenticated');
    }

    try {
      const message = {
        channel: this.channel,
        blocks,
      };

      if (this.webhookUrl) {
        await axios.post(this.webhookUrl, message);
      } else if (this.botToken) {
        await axios.post('https://slack.com/api/chat.postMessage', message, {
          headers: { Authorization: `Bearer ${this.botToken}` },
        });
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export default SlackIntegration;
