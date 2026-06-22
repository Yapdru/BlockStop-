/**
 * BlockStop Webhook Integration
 * Generic webhook delivery with retry logic
 */

import crypto from 'crypto';
import axios from 'axios';
import BaseIntegration, { AlertPayload, IntegrationConfig, IntegrationError } from './base-integration.js';

export interface WebhookConfig extends IntegrationConfig {
  url?: string;
  signingSecret?: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface WebhookDelivery {
  id: string;
  url: string;
  payload: unknown;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  lastError?: string;
  timestamp: string;
}

export class WebhookIntegration extends BaseIntegration {
  private url: string | null = null;
  private signingSecret: string | null = null;
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;
  private deliveryQueue: WebhookDelivery[] = [];

  constructor(config: WebhookConfig) {
    super('webhook', config);
    this.url = config.url || null;
    this.signingSecret = config.signingSecret || null;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
  }

  /**
   * Authenticate with webhook endpoint
   */
  async authenticate(): Promise<void> {
    try {
      if (!this.url) {
        throw new Error('Webhook URL not provided');
      }

      // Test webhook connection
      await this.sendWebhook({
        event: 'test',
        message: 'BlockStop webhook integration initialized',
        timestamp: new Date().toISOString(),
      });

      this.isAuthenticated = true;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate configuration
   */
  async validate(): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!this.config.enabled) {
      return { valid: true };
    }

    if (!this.url) {
      errors.push('Webhook URL required');
    } else if (!this.isValidURL(this.url)) {
      errors.push('Invalid webhook URL format');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    try {
      await this.authenticate();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Send alert as webhook
   */
  async sendAlert(payload: AlertPayload): Promise<void> {
    try {
      if (!this.isReady()) {
        throw new IntegrationError('webhook', 'NOT_AUTHENTICATED', 'Webhook not configured');
      }

      await this.sendWebhook({
        event: 'security_alert',
        ...payload,
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send webhook with retry logic
   */
  async sendWebhook(payload: unknown, retries = 0): Promise<void> {
    if (!this.url) {
      throw new IntegrationError('webhook', 'NOT_CONFIGURED', 'Webhook URL not configured');
    }

    const deliveryId = crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9);

    try {
      const headers = this.generateHeaders(payload);

      const response = await axios.post(this.url, payload, {
        headers,
        timeout: 10000,
      });

      if (response.status >= 200 && response.status < 300) {
        this.recordDelivery(deliveryId, this.url, payload, 'sent');
        return;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (retries < this.maxRetries) {
        // Exponential backoff
        const delayMs = this.retryDelayMs * Math.pow(2, retries);
        await this.delay(delayMs);
        return this.sendWebhook(payload, retries + 1);
      }

      const errorMsg = error instanceof Error ? error.message : String(error);
      this.recordDelivery(deliveryId, this.url, payload, 'failed', errorMsg);
      throw this.handleError(new Error(`Webhook delivery failed after ${this.maxRetries} retries: ${errorMsg}`));
    }
  }

  /**
   * Generate webhook headers with signature
   */
  private generateHeaders(payload: unknown): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'BlockStop/1.0',
      'X-BlockStop-Event-ID': crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      'X-BlockStop-Timestamp': new Date().toISOString(),
    };

    if (this.signingSecret) {
      const payload_str = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', this.signingSecret)
        .update(payload_str)
        .digest('hex');

      headers['X-BlockStop-Signature'] = `sha256=${signature}`;
    }

    return headers;
  }

  /**
   * Record webhook delivery
   */
  private recordDelivery(
    id: string,
    url: string,
    payload: unknown,
    status: 'pending' | 'sent' | 'failed',
    error?: string
  ): void {
    const delivery: WebhookDelivery = {
      id,
      url,
      payload,
      status,
      attempts: 1,
      lastError: error,
      timestamp: new Date().toISOString(),
    };

    this.deliveryQueue.push(delivery);

    // Keep only last 100 deliveries
    if (this.deliveryQueue.length > 100) {
      this.deliveryQueue = this.deliveryQueue.slice(-100);
    }
  }

  /**
   * Get delivery history
   */
  getDeliveryHistory(limit = 20): WebhookDelivery[] {
    return this.deliveryQueue.slice(-limit);
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return `sha256=${expected}` === signature;
  }

  /**
   * Helper: delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper: validate URL
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default WebhookIntegration;
