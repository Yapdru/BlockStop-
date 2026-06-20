import { BaseUserIntegration } from '../base-integration';
import { ServiceProvider, UserIntegration, ScanResult } from '../types';

export class TelegramIntegration extends BaseUserIntegration {
  private botToken: string;
  private readonly apiUrl = 'https://api.telegram.org';

  constructor(userId: string, integration: UserIntegration, botToken: string) {
    super(userId, integration);
    this.botToken = botToken;
  }

  getAuthorizationUrl(_state: string): string {
    return `https://t.me/`;
  }

  async exchangeCodeForToken(code: string) {
    return {
      accessToken: code,
      expiresIn: undefined
    };
  }

  async refreshAccessToken() {
    throw this.createError('NO_REFRESH', 'Telegram Bot tokens do not expire');
  }

  async disconnect(): Promise<void> {
    try {
      await fetch(`${this.apiUrl}/bot${this.botToken}/logOut`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to disconnect Telegram:', error);
    }
  }

  async scanForThreats(): Promise<ScanResult> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(`${this.apiUrl}/bot${this.botToken}/getMe`);

      if (!response.ok) {
        await this.handleApiError(new Error(`Telegram API error: ${response.statusText}`), [429, 503]);
      }

      const data = await response.json();
      if (!data.ok) {
        throw this.createError('TELEGRAM_ERROR', data.description || 'Telegram error');
      }

      const botInfo = data.result;

      const details = [{
        itemId: botInfo.id.toString(),
        itemName: botInfo.first_name,
        riskLevel: 'low' as const,
        threats: [],
        metadata: { username: botInfo.username, isBot: botInfo.is_bot }
      }];

      return {
        provider: ServiceProvider.TELEGRAM,
        timestamp: new Date(),
        itemsScanned: 1,
        threatsDetected: 0,
        details
      };
    });
  }
}
