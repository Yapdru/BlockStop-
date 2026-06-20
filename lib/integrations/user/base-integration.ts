import { ServiceProvider, UserIntegration, IntegrationError, ScanResult } from './types';

export abstract class BaseUserIntegration {
  protected userId: string;
  protected accessToken: string;
  protected refreshToken?: string;
  protected provider: ServiceProvider;

  constructor(userId: string, integration: UserIntegration) {
    this.userId = userId;
    this.accessToken = integration.accessToken;
    this.refreshToken = integration.refreshToken;
    this.provider = integration.provider;
  }

  abstract getAuthorizationUrl(state: string): string;
  abstract exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }>;
  abstract refreshAccessToken(): Promise<{ accessToken: string; expiresIn?: number }>;
  abstract disconnect(): Promise<void>;
  abstract scanForThreats(): Promise<ScanResult>;

  protected createError(code: string, message: string, statusCode?: number, retryable = false): IntegrationError {
    const error = new Error(message) as IntegrationError;
    error.provider = this.provider;
    error.code = code;
    error.statusCode = statusCode;
    error.retryable = retryable;
    error.name = 'IntegrationError';
    return error;
  }

  protected async handleApiError(error: unknown, retryableStatusCodes: number[] = [429, 503, 504]): Promise<never> {
    if (error instanceof Error) {
      const statusCode = (error as any).statusCode || (error as any).status;
      const isRetryable = statusCode && retryableStatusCodes.includes(statusCode);
      throw this.createError('API_ERROR', error.message, statusCode, isRetryable);
    }
    throw this.createError('UNKNOWN_ERROR', 'An unknown error occurred');
  }

  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelayMs = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if ((error as any).retryable === false || attempt === maxRetries - 1) {
          throw error;
        }
        const delay = initialDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
