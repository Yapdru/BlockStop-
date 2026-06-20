import { BaseUserIntegration } from '../base-integration';
import { ServiceProvider, UserIntegration, ScanResult } from '../types';

export class ProtonmailIntegration extends BaseUserIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private readonly oauthUrl = 'https://mail.proton.me/api/auth/oauth/authorize';
  private readonly tokenUrl = 'https://mail.proton.me/api/auth/oauth/token';
  private readonly apiUrl = 'https://mail.proton.me/api';

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
      scope: 'mail:read',
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
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri
        }).toString()
      });

      if (!response.ok) {
        await this.handleApiError(new Error(`ProtonMail token exchange failed: ${response.statusText}`));
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
      throw this.createError('NO_REFRESH_TOKEN', 'No refresh token available for ProtonMail');
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
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
    } catch (error) {
      console.error('Failed to revoke ProtonMail token:', error);
    }
  }

  async scanForThreats(): Promise<ScanResult> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(`${this.apiUrl}/mail/v4/messages`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.scanForThreats();
      }

      if (!response.ok) {
        await this.handleApiError(new Error(`ProtonMail API error: ${response.statusText}`), [429, 503]);
      }

      const data = await response.json();
      const messages = data.Messages || [];

      const details = messages.slice(0, 100).map((msg: any) => ({
        itemId: msg.ID,
        itemName: msg.Subject || `ProtonMail Message ${msg.ID.slice(0, 8)}`,
        riskLevel: 'low' as const,
        threats: [],
        metadata: { sender: msg.Sender, time: msg.Time }
      }));

      return {
        provider: ServiceProvider.PROTONMAIL,
        timestamp: new Date(),
        itemsScanned: messages.length,
        threatsDetected: 0,
        details
      };
    });
  }
}
