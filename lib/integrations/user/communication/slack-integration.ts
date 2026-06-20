import { BaseUserIntegration } from '../base-integration';
import { ServiceProvider, UserIntegration, ScanResult } from '../types';

export class SlackIntegration extends BaseUserIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private readonly oauthUrl = 'https://slack.com/oauth_authorize';
  private readonly tokenUrl = 'https://slack.com/api/oauth.v2.access';
  private readonly apiUrl = 'https://slack.com/api';

  constructor(userId: string, integration: UserIntegration, clientId: string, clientSecret: string, redirectUri: string) {
    super(userId, integration);
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'channels:read messages:read',
      state
    });
    return `${this.oauthUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string) {
    return this.retryWithBackoff(async () => {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri
        }).toString()
      });

      if (!response.ok) {
        await this.handleApiError(new Error(`Slack token exchange failed: ${response.statusText}`));
      }

      const data = await response.json();
      if (!data.ok) {
        throw this.createError('SLACK_ERROR', data.error || 'Unknown Slack error');
      }
      return { accessToken: data.access_token };
    });
  }

  async refreshAccessToken() {
    throw this.createError('NO_REFRESH', 'Slack does not support token refresh');
  }

  async disconnect(): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/auth.revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
    } catch (error) {
      console.error('Failed to revoke Slack token:', error);
    }
  }

  async scanForThreats(): Promise<ScanResult> {
    return this.retryWithBackoff(async () => {
      const channelsResponse = await fetch(`${this.apiUrl}/conversations.list?limit=100`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (channelsResponse.status === 401) {
        throw this.createError('AUTH_FAILED', 'Slack authentication failed');
      }

      if (!channelsResponse.ok) {
        await this.handleApiError(new Error(`Slack API error: ${channelsResponse.statusText}`), [429, 503]);
      }

      const channelsData = await channelsResponse.json();
      if (!channelsData.ok) {
        throw this.createError('SLACK_ERROR', channelsData.error);
      }

      const channels = channelsData.channels || [];
      const details = channels.slice(0, 50).map((channel: any) => ({
        itemId: channel.id,
        itemName: `#${channel.name}`,
        riskLevel: 'low' as const,
        threats: [],
        metadata: { members: channel.num_members, topic: channel.topic?.value }
      }));

      return {
        provider: ServiceProvider.SLACK,
        timestamp: new Date(),
        itemsScanned: channels.length,
        threatsDetected: 0,
        details
      };
    });
  }
}
