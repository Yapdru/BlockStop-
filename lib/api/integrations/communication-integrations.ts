// Communication Platform Integration Implementations
import { IntegrationConfig } from '../types';

export class SlackIntegration {
  private webhookUrl: string;
  private channel?: string;

  constructor(config: IntegrationConfig) {
    this.webhookUrl = config.webhook!;
    this.channel = config.parameters?.channel;
  }

  async sendAlert(threat: any): Promise<boolean> {
    try {
      const color = this.getColorForSeverity(threat.severity);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: this.channel,
          text: `BlockStop: New ${threat.severity} Threat Detected`,
          attachments: [
            {
              color,
              title: `${threat.type} - ${threat.severity}`,
              fields: [
                {
                  title: 'Threat ID',
                  value: threat.id,
                  short: true,
                },
                {
                  title: 'Type',
                  value: threat.type,
                  short: true,
                },
                {
                  title: 'Severity',
                  value: threat.severity,
                  short: true,
                },
                {
                  title: 'Source',
                  value: threat.source,
                  short: true,
                },
                {
                  title: 'Indicators',
                  value: (threat.indicators || []).join('\n') || 'None',
                  short: false,
                },
              ],
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'BlockStop Test Message',
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getColorForSeverity(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#FF0000'; // Red
      case 'high':
        return '#FF6600'; // Orange
      case 'medium':
        return '#FFCC00'; // Yellow
      case 'low':
        return '#00AA00'; // Green
      default:
        return '#0099FF'; // Blue
    }
  }
}

export class MicrosoftTeamsIntegration {
  private webhookUrl: string;

  constructor(config: IntegrationConfig) {
    this.webhookUrl = config.webhook!;
  }

  async sendAlert(threat: any): Promise<boolean> {
    try {
      const themeColor = this.getColorForSeverity(threat.severity);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: `BlockStop: ${threat.type} - ${threat.severity}`,
          themeColor,
          sections: [
            {
              activityTitle: `${threat.type} Threat Detected`,
              activitySubtitle: `Severity: ${threat.severity}`,
              facts: [
                {
                  name: 'Threat ID',
                  value: threat.id,
                },
                {
                  name: 'Type',
                  value: threat.type,
                },
                {
                  name: 'Severity',
                  value: threat.severity,
                },
                {
                  name: 'Source',
                  value: threat.source,
                },
                {
                  name: 'Indicators',
                  value: (threat.indicators || []).join(', ') || 'None',
                },
              ],
              markdown: true,
            },
          ],
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'BlockStop Test Message',
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getColorForSeverity(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'FF0000'; // Red
      case 'high':
        return 'FF6600'; // Orange
      case 'medium':
        return 'FFCC00'; // Yellow
      case 'low':
        return '00AA00'; // Green
      default:
        return '0099FF'; // Blue
    }
  }
}

export class DiscordIntegration {
  private webhookUrl: string;

  constructor(config: IntegrationConfig) {
    this.webhookUrl = config.webhook!;
  }

  async sendAlert(threat: any): Promise<boolean> {
    try {
      const color = this.getColorForSeverity(threat.severity);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'BlockStop Security Alerts',
          avatar_url:
            'https://blockstop.io/logo.png',
          embeds: [
            {
              title: `${threat.type} - ${threat.severity}`,
              description: `New threat detected by BlockStop`,
              color: parseInt(color.replace('#', '0x')),
              fields: [
                {
                  name: 'Threat ID',
                  value: threat.id,
                  inline: true,
                },
                {
                  name: 'Type',
                  value: threat.type,
                  inline: true,
                },
                {
                  name: 'Severity',
                  value: threat.severity,
                  inline: true,
                },
                {
                  name: 'Source',
                  value: threat.source,
                  inline: true,
                },
                {
                  name: 'Indicators',
                  value: (threat.indicators || []).join('\n') || 'None',
                  inline: false,
                },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'BlockStop Test Message',
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private getColorForSeverity(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#FF0000'; // Red
      case 'high':
        return '#FF6600'; // Orange
      case 'medium':
        return '#FFCC00'; // Yellow
      case 'low':
        return '#00AA00'; // Green
      default:
        return '#0099FF'; // Blue
    }
  }
}

export class TelegramIntegration {
  private botToken: string;
  private chatId: string;

  constructor(config: IntegrationConfig) {
    this.botToken = config.parameters?.botToken!;
    this.chatId = config.parameters?.chatId!;
  }

  async sendAlert(threat: any): Promise<boolean> {
    try {
      const emoji = this.getEmojiForSeverity(threat.severity);
      const message = `${emoji} <b>${threat.severity.toUpperCase()}</b> - ${threat.type}\n\n` +
        `<b>Threat ID:</b> <code>${threat.id}</code>\n` +
        `<b>Type:</b> ${threat.type}\n` +
        `<b>Severity:</b> ${threat.severity}\n` +
        `<b>Source:</b> ${threat.source}\n` +
        `<b>Indicators:</b> <code>${(threat.indicators || []).join(', ') || 'None'}</code>`;

      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.chatId,
            text: message,
            parse_mode: 'HTML',
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
        `https://api.telegram.org/bot${this.botToken}/getMe`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private getEmojiForSeverity(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return '📝';
    }
  }
}
