/**
 * BlockStop Base Integration
 * Abstract base class for all integrations
 */

export interface IntegrationConfig {
  enabled: boolean;
  [key: string]: unknown;
}

export interface AlertPayload {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  source?: string;
}

export class IntegrationError extends Error {
  constructor(
    public integrationName: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export abstract class BaseIntegration {
  protected name: string;
  protected config: IntegrationConfig;
  protected isAuthenticated: boolean = false;

  constructor(name: string, config: IntegrationConfig) {
    this.name = name;
    this.config = config;
  }

  /**
   * Authenticate with the integration
   */
  abstract authenticate(): Promise<void>;

  /**
   * Validate configuration
   */
  abstract validate(): Promise<{ valid: boolean; errors?: string[] }>;

  /**
   * Send alert through integration
   */
  abstract sendAlert(payload: AlertPayload): Promise<void>;

  /**
   * Format payload for integration
   */
  protected formatPayload(payload: AlertPayload): unknown {
    return payload;
  }

  /**
   * Handle integration errors
   */
  protected handleError(error: unknown): IntegrationError {
    if (error instanceof IntegrationError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new IntegrationError(this.name, 'INTEGRATION_ERROR', `${this.name} error: ${message}`);
  }

  /**
   * Check if integration is ready
   */
  isReady(): boolean {
    return this.config.enabled && this.isAuthenticated;
  }

  /**
   * Get integration name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get integration status
   */
  async getStatus(): Promise<{
    name: string;
    enabled: boolean;
    authenticated: boolean;
    ready: boolean;
  }> {
    return {
      name: this.name,
      enabled: this.config.enabled,
      authenticated: this.isAuthenticated,
      ready: this.isReady(),
    };
  }
}

export default BaseIntegration;
