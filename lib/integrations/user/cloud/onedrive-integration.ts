import { BaseUserIntegration } from '../base-integration';
import { ServiceProvider, UserIntegration, ScanResult } from '../types';

export class OneDriveIntegration extends BaseUserIntegration {
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
      scope: 'Files.Read.All offline_access',
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
          redirect_uri: this.redirectUri,
          scope: 'Files.Read.All offline_access'
        }).toString()
      });

      if (!response.ok) {
        await this.handleApiError(new Error(`OneDrive token exchange failed: ${response.statusText}`));
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
      throw this.createError('NO_REFRESH_TOKEN', 'No refresh token available for OneDrive');
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
      await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
    } catch (error) {
      console.error('Failed to revoke OneDrive token:', error);
    }
  }

  async scanForThreats(): Promise<ScanResult> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(`${this.apiUrl}/me/drive/root/children?$top=100`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.scanForThreats();
      }

      if (!response.ok) {
        await this.handleApiError(new Error(`OneDrive API error: ${response.statusText}`), [429, 503]);
      }

      const data = await response.json();
      const files = data.value || [];

      const details = files.map((file: any) => ({
        itemId: file.id,
        itemName: file.name,
        riskLevel: 'low' as const,
        threats: [],
        metadata: { folder: file.folder, lastModified: file.lastModifiedDateTime }
      }));

      return {
        provider: ServiceProvider.ONEDRIVE,
        timestamp: new Date(),
        itemsScanned: files.length,
        threatsDetected: 0,
        details
      };
    });
  }
}
