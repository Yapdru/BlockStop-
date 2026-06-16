/**
 * Slack Notifier Plugin
 * Sends threat notifications to Slack
 */

import { Plugin, HookType } from '@blockstop/plugin-sdk';

export class SlackNotifierPlugin extends Plugin {
  private webhookUrl: string = '';

  async initialize() {
    super.initialize();

    // Get webhook URL from config
    this.webhookUrl =
      (this.context.config.slackWebhookUrl as string) || '';

    if (!this.webhookUrl) {
      this.context.logger.warn('Slack webhook URL not configured');
      return;
    }

    // Register hook for threat detected
    this.context.hooks.registerHook(
      HookType.ON_THREAT_DETECTED,
      async (threat) => {
        await this.sendSlackNotification(threat);
      }
    );

    this.context.logger.info('Slack notifier initialized');
  }

  private async sendSlackNotification(threat: any): Promise<void> {
    try {
      const message = {
        text: '🚨 New Threat Detected',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${threat.type} - ${threat.severity.toUpperCase()}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*ID:*\n${threat.id}`,
              },
              {
                type: 'mrkdwn',
                text: `*Severity:*\n${threat.severity}`,
              },
              {
                type: 'mrkdwn',
                text: `*Type:*\n${threat.type}`,
              },
              {
                type: 'mrkdwn',
                text: `*Source:*\n${threat.source}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Description:*\n${threat.description}`,
            },
          },
        ],
      };

      await this.context.api.post(this.webhookUrl, message);
      this.context.logger.info('Slack notification sent for threat:', threat.id);
    } catch (error) {
      this.context.logger.error('Failed to send Slack notification:', error);
    }
  }

  async execute(action: string, params?: Record<string, unknown>): Promise<any> {
    switch (action) {
      case 'testConnection':
        return await this.testSlackConnection();

      case 'sendNotification':
        if (!params?.threat) {
          throw new Error('Threat parameter required');
        }
        await this.sendSlackNotification(params.threat);
        return { success: true };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async testSlackConnection(): Promise<any> {
    try {
      if (!this.webhookUrl) {
        throw new Error('Slack webhook URL not configured');
      }

      await this.context.api.post(this.webhookUrl, {
        text: '✓ BlockStop Slack integration is working!',
      });

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export default SlackNotifierPlugin;
