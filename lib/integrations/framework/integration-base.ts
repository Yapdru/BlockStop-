/**
 * Integration Base Class
 * Provides core functionality for all integrations
 */

import {
  IntegrationConfig,
  AuthConfig,
  AuthType,
  WebhookPayload,
  TransformedEvent,
  HealthCheckResult,
  HealthStatus,
  IntegrationEvent,
  RetryPolicy,
} from '../types';
import crypto from 'crypto';

export abstract class IntegrationBase {
  protected id: string;
  protected name: string;
  protected config: IntegrationConfig;
  protected authConfig: AuthConfig;
  protected enabled: boolean = true;
  protected lastHealthCheck?: Date;
  protected eventLog: IntegrationEvent[] = [];
  protected retryPolicy: RetryPolicy;
  protected requestCache: Map<string, any> = new Map();
  protected cacheExpiry: Map<string, number> = new Map();

  constructor(name: string, config: IntegrationConfig) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.config = config;
    this.authConfig = config.auth;
    this.retryPolicy = config.retryPolicy || this.getDefaultRetryPolicy();
  }

  /**
   * Initialize the integration
   */
  async initialize(): Promise<void> {
    try {
      await this.validateConfig();
      await this.setupAuthHandlers();
      await this.onInitialize();
    } catch (error) {
      this.logEvent('error', {
        message: 'Initialization failed',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validate configuration
   */
  protected async validateConfig(): Promise<void> {
    if (!this.authConfig) {
      throw new Error('Authentication config is required');
    }

    if (!this.authConfig.credentials || Object.keys(this.authConfig.credentials).length === 0) {
      throw new Error('Credentials are required');
    }
  }

  /**
   * Setup authentication handlers
   */
  protected async setupAuthHandlers(): Promise<void> {
    if (this.authConfig.type === AuthType.OAUTH2) {
      if (this.shouldRefreshToken()) {
        await this.refreshOAuth2Token();
      }
    }
  }

  /**
   * Check if OAuth2 token needs refresh
   */
  protected shouldRefreshToken(): boolean {
    if (!this.authConfig.expiresAt) return false;
    const now = new Date();
    const expiresIn = this.authConfig.expiresAt.getTime() - now.getTime();
    return expiresIn < 5 * 60 * 1000; // Refresh 5 minutes before expiry
  }

  /**
   * Refresh OAuth2 token
   */
  protected async refreshOAuth2Token(): Promise<void> {
    if (!this.authConfig.refreshToken) {
      throw new Error('Refresh token not available');
    }

    try {
      const newToken = await this.getRefreshTokenHandler()(this.authConfig.refreshToken);
      this.authConfig.credentials['access_token'] = newToken.accessToken;
      if (newToken.expiresIn) {
        this.authConfig.expiresAt = new Date(Date.now() + newToken.expiresIn * 1000);
      }
      this.logEvent('auth_refresh', { success: true });
    } catch (error) {
      this.logEvent('error', {
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get refresh token handler (override in subclasses)
   */
  protected getRefreshTokenHandler() {
    return async (refreshToken: string) => ({
      accessToken: '',
      expiresIn: 3600,
    });
  }

  /**
   * Transform webhook payload to internal event format
   */
  abstract transformWebhookPayload(payload: WebhookPayload): Promise<TransformedEvent>;

  /**
   * Handle incoming webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<TransformedEvent> {
    try {
      await this.validateWebhookSignature(payload);
      const event = await this.transformWebhookPayload(payload);
      this.logEvent('data_received', { eventId: event.id });
      return event;
    } catch (error) {
      this.logEvent('error', {
        message: 'Webhook handling failed',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validate webhook signature (override in subclasses for actual validation)
   */
  protected async validateWebhookSignature(payload: WebhookPayload): Promise<void> {
    // Base implementation - override in subclasses
  }

  /**
   * Make authenticated HTTP request with retry logic
   */
  protected async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>,
    options?: { useCache?: boolean; cacheTtl?: number }
  ): Promise<T> {
    const cacheKey = `${method}:${endpoint}`;

    // Check cache
    if (options?.useCache && this.requestCache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey);
      if (expiry && expiry > Date.now()) {
        return this.requestCache.get(cacheKey);
      }
      this.requestCache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryPolicy.maxAttempts; attempt++) {
      try {
        const response = await this.executeRequest<T>(method, endpoint, data);

        // Cache the result
        if (options?.useCache) {
          this.requestCache.set(cacheKey, response);
          this.cacheExpiry.set(cacheKey, Date.now() + (options.cacheTtl || 5 * 60 * 1000));
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.retryPolicy.maxAttempts - 1) {
          const delay = Math.min(
            this.retryPolicy.initialDelayMs * Math.pow(this.retryPolicy.backoffMultiplier, attempt),
            this.retryPolicy.maxDelayMs
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Execute the actual HTTP request (override in subclasses)
   */
  protected abstract executeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, any>
  ): Promise<T>;

  /**
   * Perform health check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const connectivity = await this.checkConnectivity();
      const authentication = await this.checkAuthentication();
      const dataFlow = await this.checkDataFlow();

      const result: HealthCheckResult = {
        status: connectivity && authentication ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          connectivity,
          authentication,
          dataFlow,
          errorCount: this.eventLog.filter((e) => e.type === 'error').length,
        },
      };

      this.lastHealthCheck = new Date();
      this.logEvent('health_check', { status: result.status });

      return result;
    } catch (error) {
      return {
        status: HealthStatus.UNHEALTHY,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          connectivity: false,
          authentication: false,
          dataFlow: false,
          errorCount: this.eventLog.filter((e) => e.type === 'error').length,
          lastError: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Check connectivity to integration endpoint
   */
  protected async checkConnectivity(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check authentication
   */
  protected async checkAuthentication(): Promise<boolean> {
    return this.isAuthenticationValid();
  }

  /**
   * Check data flow
   */
  protected async checkDataFlow(): Promise<boolean> {
    return true; // Override in subclasses
  }

  /**
   * Check if authentication is valid
   */
  protected isAuthenticationValid(): boolean {
    if (this.authConfig.type === AuthType.OAUTH2 && this.authConfig.expiresAt) {
      return this.authConfig.expiresAt.getTime() > Date.now();
    }
    return true;
  }

  /**
   * Get authentication headers
   */
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this.authConfig.type) {
      case AuthType.OAUTH2:
      case AuthType.TOKEN:
        headers['Authorization'] = `Bearer ${this.authConfig.credentials['access_token']}`;
        break;

      case AuthType.API_KEY:
        headers['X-API-Key'] = this.authConfig.credentials['api_key'];
        break;

      case AuthType.BASIC:
        const credentials = Buffer.from(
          `${this.authConfig.credentials['username']}:${this.authConfig.credentials['password']}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        break;

      case AuthType.CERTIFICATE:
        // Certificate handling is done at the transport level
        break;
    }

    return headers;
  }

  /**
   * Log event
   */
  protected logEvent(
    type: IntegrationEvent['type'],
    data: Record<string, any>,
    severity: 'info' | 'warning' | 'error' = 'info'
  ): void {
    const event: IntegrationEvent = {
      id: crypto.randomUUID(),
      integrationId: this.id,
      type,
      timestamp: new Date(),
      data,
      severity,
    };

    this.eventLog.push(event);

    // Keep only last 1000 events
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-1000);
    }
  }

  /**
   * Get event log
   */
  getEventLog(limit?: number): IntegrationEvent[] {
    if (limit) {
      return this.eventLog.slice(-limit);
    }
    return [...this.eventLog];
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get default retry policy
   */
  private getDefaultRetryPolicy(): RetryPolicy {
    return {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    };
  }

  /**
   * Lifecycle hooks (override in subclasses)
   */
  protected async onInitialize(): Promise<void> {}
  abstract onTeardown(): Promise<void>;
  abstract onConfigUpdate(newConfig: IntegrationConfig): Promise<void>;

  /**
   * Getters
   */
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getConfig(): IntegrationConfig {
    return this.config;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.logEvent('config_change', { enabled });
  }
}
