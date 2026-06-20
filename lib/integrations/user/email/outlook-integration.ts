import { BaseUserIntegration } from '../base-integration';
import { ServiceProvider, UserIntegration, ScanResult } from '../types';

export class OutlookIntegration extends BaseUserIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private readonly oauthUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
  private readonly tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  private readonly apiUrl = 'https://graph.microsoft.com/v1.0';

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
      response_type: 'code',
      scope: 'Mail.Read offline_access',
      state,
      prompt: 'select_account'
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
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
          scope: 'Mail.Read offline_access'
        }).toString()
      });

      if (!response.ok) {
        await this.handleApiError(new Error(`OAuth token exchange failed: ${response.statusText}`));
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in
      };
    });
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw this.createError('NO_REFRESH_TOKEN', 'No refresh token available for Outlook');
    }

    return this.retryWithBackoff(async () => {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken!,
          grant_type: 'refresh_token'
        }).toString()
      });

      if (!response.ok) {
        await this.handleApiError(new Error(`Token refresh failed: ${response.statusText}`));
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      return { accessToken: data.access_token, expiresIn: data.expires_in };
    });
  }

  async disconnect(): Promise<void> {
    try {
      await fetch(`${this.tokenUrl.replace('/token', '/revoke')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: this.accessToken }).toString()
      });
    } catch (error) {
      console.error('Failed to revoke Outlook token:', error);
    }
  }

  async scanForThreats(): Promise<ScanResult> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(`${this.apiUrl}/me/mailFolders/inbox/messages?$top=100&$select=id,subject,from,receivedDateTime`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.scanForThreats();
      }

      if (!response.ok) {
        await this.handleApiError(new Error(`Outlook API error: ${response.statusText}`), [429, 503]);
      }

      const data = await response.json();
      const messages = data.value || [];

      const details = messages.map((msg: any) => ({
        itemId: msg.id,
        itemName: msg.subject || `Email from ${msg.from?.emailAddress?.name}`,
        riskLevel: 'low' as const,
        threats: [],
        metadata: { from: msg.from, receivedDateTime: msg.receivedDateTime }
      }));

      return {
        provider: ServiceProvider.OUTLOOK,
        timestamp: new Date(),
        itemsScanned: messages.length,
        threatsDetected: 0,
        details
      };
    });
  }
}
