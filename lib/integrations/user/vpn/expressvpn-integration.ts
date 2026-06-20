import { BaseUserIntegration } from '../base-integration';
import { ServiceProvider, UserIntegration, ScanResult } from '../types';

export class ExpressVPNIntegration extends BaseUserIntegration {
  private apiKey: string;
  private readonly apiUrl = 'https://api.expressvpn.com/v1';

  constructor(userId: string, integration: UserIntegration, apiKey: string) {
    super(userId, integration);
    this.apiKey = apiKey;
  }

  getAuthorizationUrl(_state: string): string {
    return 'https://www.expressvpn.com/account';
  }

  async exchangeCodeForToken(code: string) {
    return { accessToken: code };
  }

  async refreshAccessToken() {
    throw this.createError('NO_REFRESH', 'ExpressVPN API keys do not expire');
  }

  async disconnect(): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/auth/revoke`, {
        method: 'POST',
        headers: { 'X-API-Key': this.apiKey }
      });
    } catch (error) {
      console.error('Failed to revoke ExpressVPN access:', error);
    }
  }

  async scanForThreats(): Promise<ScanResult> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(`${this.apiUrl}/servers`, {
        headers: { 'X-API-Key': this.apiKey }
      });

      if (response.status === 401) {
        throw this.createError('AUTH_FAILED', 'ExpressVPN authentication failed');
      }

      if (!response.ok) {
        await this.handleApiError(new Error(`ExpressVPN API error: ${response.statusText}`), [429, 503]);
      }

      const data = await response.json();
      const servers = data.servers || [];

      const details = servers.slice(0, 50).map((server: any) => ({
        itemId: server.id,
        itemName: server.name,
        riskLevel: 'low' as const,
        threats: [],
        metadata: { region: server.region, location: server.location, status: server.status }
      }));

      return {
        provider: ServiceProvider.EXPRESSVPN,
        timestamp: new Date(),
        itemsScanned: servers.length,
        threatsDetected: 0,
        details
      };
    });
  }
}
