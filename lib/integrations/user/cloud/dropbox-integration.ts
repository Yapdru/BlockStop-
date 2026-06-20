import { BaseUserIntegration } from '../base-integration';
import { ServiceProvider, UserIntegration, ScanResult } from '../types';

export class DropboxIntegration extends BaseUserIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private readonly oauthUrl = 'https://www.dropbox.com/oauth2/authorize';
  private readonly tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
  private readonly apiUrl = 'https://api.dropboxapi.com/2';

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
        await this.handleApiError(new Error(`Dropbox token exchange failed: ${response.statusText}`));
      }

      const data = await response.json();
      return { accessToken: data.access_token };
    });
  }

  async refreshAccessToken() {
    throw this.createError('NO_REFRESH_TOKEN', 'Dropbox uses long-lived tokens, refresh not available');
  }

  async disconnect(): Promise<void> {
    try {
      await fetch(`${this.tokenUrl.replace('/token', '/revoke')}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
    } catch (error) {
      console.error('Failed to revoke Dropbox token:', error);
    }
  }

  async scanForThreats(): Promise<ScanResult> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(`${this.apiUrl}/files/list_folder`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: '' })
      });

      if (response.status === 401) {
        throw this.createError('AUTH_FAILED', 'Dropbox authentication failed');
      }

      if (!response.ok) {
        await this.handleApiError(new Error(`Dropbox API error: ${response.statusText}`), [429, 503]);
      }

      const data = await response.json();
      const entries = data.entries || [];

      const details = entries.slice(0, 100).map((entry: any) => ({
        itemId: entry.id,
        itemName: entry.name,
        riskLevel: 'low' as const,
        threats: [],
        metadata: { size: entry.size, modified: entry.server_modified }
      }));

      return {
        provider: ServiceProvider.DROPBOX,
        timestamp: new Date(),
        itemsScanned: entries.length,
        threatsDetected: 0,
        details
      };
    });
  }
}
