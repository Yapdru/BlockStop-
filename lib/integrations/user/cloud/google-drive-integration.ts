import { BaseUserIntegration } from '../base-integration';
import { ServiceProvider, UserIntegration, ScanResult } from '../types';

export class GoogleDriveIntegration extends BaseUserIntegration {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private readonly oauthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';
  private readonly apiUrl = 'https://www.googleapis.com/drive/v3';

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
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      state,
      access_type: 'offline',
      prompt: 'consent'
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
        await this.handleApiError(new Error(`Google Drive token exchange failed: ${response.statusText}`));
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
      throw this.createError('NO_REFRESH_TOKEN', 'No refresh token available for Google Drive');
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
      await fetch(`https://oauth2.googleapis.com/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: this.accessToken }).toString()
      });
    } catch (error) {
      console.error('Failed to revoke Google Drive token:', error);
    }
  }

  async scanForThreats(): Promise<ScanResult> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(
        `${this.apiUrl}/files?pageSize=100&fields=files(id,name,mimeType,createdTime,modifiedTime)&q=trashed=false`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );

      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.scanForThreats();
      }

      if (!response.ok) {
        await this.handleApiError(new Error(`Google Drive API error: ${response.statusText}`), [429, 503]);
      }

      const data = await response.json();
      const files = data.files || [];

      const details = files.map((file: any) => ({
        itemId: file.id,
        itemName: file.name,
        riskLevel: 'low' as const,
        threats: [],
        metadata: { mimeType: file.mimeType, modifiedTime: file.modifiedTime }
      }));

      return {
        provider: ServiceProvider.GOOGLE_DRIVE,
        timestamp: new Date(),
        itemsScanned: files.length,
        threatsDetected: 0,
        details
      };
    });
  }
}
