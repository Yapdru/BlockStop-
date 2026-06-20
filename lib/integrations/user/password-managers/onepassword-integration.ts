import { BaseUserIntegration } from '../base-integration';
import { ServiceProvider, UserIntegration, ScanResult } from '../types';

export class OnePasswordIntegration extends BaseUserIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private readonly oauthUrl = 'https://start.1password.com/oauth2/authorize';
  private readonly tokenUrl = 'https://start.1password.com/oauth2/token';
  private readonly apiUrl = 'https://api.1password.com/v1';

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
        await this.handleApiError(new Error(`1Password token exchange failed: ${response.statusText}`));
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
      throw this.createError('NO_REFRESH_TOKEN', 'No refresh token available for 1Password');
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
      await fetch(`${this.apiUrl}/auth/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
    } catch (error) {
      console.error('Failed to revoke 1Password token:', error);
    }
  }

  async scanForThreats(): Promise<ScanResult> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(`${this.apiUrl}/vaults`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.scanForThreats();
      }

      if (!response.ok) {
        await this.handleApiError(new Error(`1Password API error: ${response.statusText}`), [429, 503]);
      }

      const data = await response.json();
      const vaults = data.vaults || [];

      const details = vaults.slice(0, 50).map((vault: any) => ({
        itemId: vault.id,
        itemName: vault.name,
        riskLevel: 'low' as const,
        threats: [],
        metadata: { type: vault.type, itemCount: vault.item_count }
      }));

      return {
        provider: ServiceProvider.ONEPASSWORD,
        timestamp: new Date(),
        itemsScanned: vaults.length,
        threatsDetected: 0,
        details
      };
    });
  }
}
