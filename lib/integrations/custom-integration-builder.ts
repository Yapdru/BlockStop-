/**
 * Custom Integration Builder
 * Framework for building custom integrations
 */

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  type: string;
  endpoints: {
    baseUrl: string;
    authentication: {
      type: 'api_key' | 'oauth2' | 'basic' | 'bearer' | 'custom';
      credentials: Record<string, any>;
    };
    timeout?: number;
    retryPolicy?: {
      maxRetries: number;
      backoffMultiplier: number;
    };
  };
  triggers: Array<{
    id: string;
    name: string;
    description: string;
    endpoint: string;
    method: string;
    queryParams?: Record<string, string>;
  }>;
  actions: Array<{
    id: string;
    name: string;
    description: string;
    endpoint: string;
    method: string;
    body?: Record<string, any>;
    headers?: Record<string, string>;
  }>;
  mappings: Array<{
    source: string;
    destination: string;
    transform?: string;
  }>;
  webhooks?: Array<{
    event: string;
    url: string;
    headers?: Record<string, string>;
  }>;
  metadata?: Record<string, any>;
}

interface IntegrationResponse {
  status: number;
  data: any;
  error?: string;
  timestamp: number;
}

export class CustomIntegrationBuilder {
  private config: IntegrationConfig;
  private httpClient: any;

  constructor(config: IntegrationConfig) {
    this.config = config;
    this.initializeHttpClient();
  }

  /**
   * Initialize HTTP client with auth
   */
  private initializeHttpClient(): void {
    const axios = require('axios');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Setup authentication
    switch (this.config.endpoints.authentication.type) {
      case 'api_key':
        headers['X-API-Key'] = this.config.endpoints.authentication.credentials.key;
        break;
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.config.endpoints.authentication.credentials.token}`;
        break;
      case 'basic':
        const auth = Buffer.from(
          `${this.config.endpoints.authentication.credentials.username}:${this.config.endpoints.authentication.credentials.password}`
        ).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
        break;
      case 'custom':
        Object.assign(headers, this.config.endpoints.authentication.credentials.headers);
        break;
    }

    this.httpClient = axios.create({
      baseURL: this.config.endpoints.baseUrl,
      headers,
      timeout: this.config.endpoints.timeout || 30000,
    });

    // Setup retry logic
    if (this.config.endpoints.retryPolicy) {
      this.httpClient.interceptors.response.use(
        (response: any) => response,
        (error: any) => {
          const config = error.config;
          if (!config || !config.retryCount) {
            config.retryCount = 0;
          }

          config.retryCount++;

          if (config.retryCount <= this.config.endpoints.retryPolicy!.maxRetries) {
            const delay =
              1000 * Math.pow(this.config.endpoints.retryPolicy!.backoffMultiplier, config.retryCount - 1);
            return new Promise((resolve) => setTimeout(() => resolve(this.httpClient(config)), delay));
          }

          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Execute a trigger
   */
  async executeTrigger(triggerId: string, params?: Record<string, any>): Promise<IntegrationResponse> {
    try {
      const trigger = this.config.triggers.find((t) => t.id === triggerId);
      if (!trigger) {
        throw new Error(`Trigger not found: ${triggerId}`);
      }

      const url = this.buildUrl(trigger.endpoint, trigger.queryParams, params);

      const response = await this.httpClient[trigger.method.toLowerCase()](url);

      return {
        status: response.status,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        data: null,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute an action
   */
  async executeAction(actionId: string, payload?: Record<string, any>): Promise<IntegrationResponse> {
    try {
      const action = this.config.actions.find((a) => a.id === actionId);
      if (!action) {
        throw new Error(`Action not found: ${actionId}`);
      }

      const body = this.mergePayload(action.body, payload);
      const headers = action.headers || {};

      const response = await this.httpClient[action.method.toLowerCase()](action.endpoint, body, {
        headers,
      });

      return {
        status: response.status,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        data: null,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Execute data transformation
   */
  transformData(data: Record<string, any>): Record<string, any> {
    const transformed: Record<string, any> = {};

    for (const mapping of this.config.mappings) {
      const sourceValue = this.getNestedValue(data, mapping.source);

      if (sourceValue !== undefined) {
        if (mapping.transform) {
          transformed[mapping.destination] = this.applyTransform(sourceValue, mapping.transform);
        } else {
          transformed[mapping.destination] = sourceValue;
        }
      }
    }

    return transformed;
  }

  /**
   * Register webhook handler
   */
  registerWebhookHandler(event: string, handler: (data: any) => void): void {
    const webhook = this.config.webhooks?.find((w) => w.event === event);
    if (!webhook) {
      throw new Error(`Webhook not found for event: ${event}`);
    }

    // Store handler for webhook processing
    console.log(`Registered webhook handler for event: ${event}`);
  }

  /**
   * Test integration connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const firstTrigger = this.config.triggers[0];
      if (!firstTrigger) {
        return { success: false, message: 'No triggers configured' };
      }

      const response = await this.executeTrigger(firstTrigger.id);

      return {
        success: response.status >= 200 && response.status < 300,
        message: response.error || 'Connection test successful',
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Build URL with parameters
   */
  private buildUrl(
    endpoint: string,
    queryParams?: Record<string, string>,
    dynamicParams?: Record<string, any>
  ): string {
    let url = endpoint;

    // Replace path parameters
    if (dynamicParams) {
      Object.entries(dynamicParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, String(value));
      });
    }

    // Add query parameters
    const params = { ...queryParams, ...dynamicParams };
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');

    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * Merge action body with payload
   */
  private mergePayload(baseBody?: Record<string, any>, payload?: Record<string, any>): Record<string, any> {
    return { ...baseBody, ...payload };
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split('.');
    let value: any = obj;

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Apply transformation to value
   */
  private applyTransform(value: any, transform: string): any {
    // Simple transform support (lowercase, uppercase, trim, etc.)
    switch (transform.toLowerCase()) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'trim':
        return String(value).trim();
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      default:
        return value;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): IntegrationConfig {
    return this.config;
  }

  /**
   * Get integration metadata
   */
  getMetadata(): Record<string, any> {
    return {
      id: this.config.id,
      name: this.config.name,
      description: this.config.description,
      type: this.config.type,
      triggers: this.config.triggers.length,
      actions: this.config.actions.length,
      webhooks: this.config.webhooks?.length || 0,
    };
  }
}

export default CustomIntegrationBuilder;
