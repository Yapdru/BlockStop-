/**
 * Slack Integration
 * Sends BlockStop security alerts to Slack
 */

import { IntegrationBase } from '../framework/integration-base';
import { IntegrationConfig, WebhookPayload, TransformedEvent } from '../types';
import fetch from 'node-fetch';

interface SlackMessage {
  channel?: string;
  text?: string;
  blocks?: any[];
  thread_ts?: string;
  metadata?: any;
}

export class SlackIntegration extends IntegrationBase {
  private botToken: string;
  private defaultChannel: string;
  private workspaceUrl: string;

  constructor(name: string, config: IntegrationConfig) {
    super(name, config);
    this.botToken = config.auth.credentials['bot_token'];
    this.defaultChannel = config.endpoints?.['channel'] || '#security-alerts';
    this.workspaceUrl = 'https://slack.com/api';
  }

  protected async executeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<T> {
    const url = `${this.workspaceUrl}${endpoint}`;
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
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    const result: any = await response.json();
    if (!result.ok) {
      throw new Error(`Slack error: ${result.error}`);
    }

    return result as T;
  }

  async transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent> {
    const threat = payload.data;

    return {
      id: payload.id,
      timestamp: payload.timestamp,
      source: 'slack',
      category: threat.category || 'security_alert',
      severity: this.mapSeverity(threat.severity),
      title: threat.title || 'Security Alert',
      description: threat.description || 'Threat detected by BlockStop',
      data: threat,
      relatedEntities: threat.relatedEntities || [],
      tags: ['slack', 'alert', threat.type].filter(Boolean),
    };
  }

  /**
   * Send threat alert to Slack
   */
  async sendThreatAlert(event: TransformedEvent, channel?: string): Promise<string> {
    const color = this.getSeverityColor(event.severity);
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${event.severity.toUpperCase()}: ${event.title}*\n${event.description}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Threat ID:*\n${event.id}`,
          },
          {
            type: 'mrkdwn',
            text: `*Category:*\n${event.category}`,
          },
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${event.severity}`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${event.timestamp.toISOString()}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Details' },
            url: `https://blockstop.ai/threats/${event.id}`,
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Create Ticket' },
            action_id: `create_ticket_${event.id}`,
          },
        ],
      },
    ];

    const result = await this.makeRequest<{ ts: string; channel: string }>(
      'POST',
      '/chat.postMessage',
      {
        channel: channel || this.defaultChannel,
        blocks,
        metadata: {
          event_type: 'threat_alert',
          event_payload: { threat_id: event.id },
        },
      }
    );

    return result.ts;
  }

  /**
   * Send message to channel
   */
  async sendMessage(text: string, channel?: string): Promise<string> {
    const result = await this.makeRequest<{ ts: string }>(
      'POST',
      '/chat.postMessage',
      {
        channel: channel || this.defaultChannel,
        text,
      }
    );

    return result.ts;
  }

  /**
   * Update message
   */
  async updateMessage(channel: string, timestamp: string, text: string): Promise<void> {
    await this.makeRequest(
      'POST',
      '/chat.update',
      {
        channel,
        ts: timestamp,
        text,
      }
    );
  }

  /**
   * Add reaction to message
   */
  async addReaction(channel: string, timestamp: string, emoji: string): Promise<void> {
    await this.makeRequest(
      'POST',
      '/reactions.add',
      {
        channel,
        timestamp,
        name: emoji,
      }
    );
  }

  /**
   * Create thread reply
   */
  async replyInThread(channel: string, threadTs: string, text: string): Promise<void> {
    await this.makeRequest(
      'POST',
      '/chat.postMessage',
      {
        channel,
        thread_ts: threadTs,
        text,
      }
    );
  }

  /**
   * Get channel list
   */
  async getChannels(): Promise<Array<{ id: string; name: string }>> {
    const result = await this.makeRequest<any>(
      'GET',
      '/conversations.list?types=public_channel,private_channel'
    );

    return result.channels || [];
  }

  /**
   * Create channel
   */
  async createChannel(name: string, isPrivate: boolean = true): Promise<string> {
    const result = await this.makeRequest<{ channel: { id: string } }>(
      'POST',
      '/conversations.create',
      {
        name,
        is_private: isPrivate,
      }
    );

    return result.channel.id;
  }

  /**
   * Invite user to channel
   */
  async inviteToChannel(channel: string, userId: string): Promise<void> {
    await this.makeRequest(
      'POST',
      '/conversations.invite',
      {
        channel,
        users: userId,
      }
    );
  }

  /**
   * Get user info
   */
  async getUserInfo(userId: string): Promise<any> {
    const result = await this.makeRequest<any>(
      'GET',
      `/users.info?user=${userId}`
    );

    return result.user;
  }

  /**
   * Get severity color for Slack
   */
  private getSeverityColor(severity: TransformedEvent['severity']): string {
    const colorMap: Record<TransformedEvent['severity'], string> = {
      critical: '#FF0000',
      high: '#FF6600',
      medium: '#FFBB33',
      low: '#00AA00',
      info: '#0099CC',
    };

    return colorMap[severity];
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
    return {
      Authorization: `Bearer ${this.botToken}`,
    };
  }

  protected async checkDataFlow(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/auth.test');
      return true;
    } catch {
      return false;
    }
  }

  async onTeardown(): Promise<void> {
    this.logEvent('teardown', { message: 'Slack integration shutting down' });
  }

  async onConfigUpdate(newConfig: IntegrationConfig): Promise<void> {
    this.config = newConfig;
    this.botToken = newConfig.auth.credentials['bot_token'];
    this.defaultChannel = newConfig.endpoints?.['channel'] || '#security-alerts';
    this.logEvent('config_change', { updated: true });
  }
}

export async function createSlackIntegration(name: string, config: IntegrationConfig): Promise<SlackIntegration> {
  const integration = new SlackIntegration(name, config);
  await integration.initialize();
  return integration;
}
