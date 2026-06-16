/**
 * Webhook Signature Validator
 * Validates webhook signatures and payloads
 */

import crypto from 'crypto';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  timestamp?: number;
}

export class WebhookValidator {
  /**
   * Validate webhook signature (HMAC-SHA256)
   */
  static validateSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): ValidationResult {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature)
      );

      return { isValid, timestamp: Date.now() };
    } catch (error) {
      return {
        isValid: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Validate webhook payload structure
   */
  static validatePayload(
    payload: any,
    schema?: Record<string, any>
  ): ValidationResult {
    try {
      if (!payload || typeof payload !== 'object') {
        return {
          isValid: false,
          error: 'Payload must be a JSON object',
          timestamp: Date.now(),
        };
      }

      // Check required fields
      const requiredFields = ['type', 'timestamp', 'data'];
      for (const field of requiredFields) {
        if (!(field in payload)) {
          return {
            isValid: false,
            error: `Missing required field: ${field}`,
            timestamp: Date.now(),
          };
        }
      }

      // Validate timestamp is recent (within 5 minutes)
      const payloadTime = typeof payload.timestamp === 'number' ? payload.timestamp : parseInt(payload.timestamp);
      const currentTime = Date.now();
      const timeDiff = Math.abs(currentTime - payloadTime);
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (timeDiff > maxAge) {
        return {
          isValid: false,
          error: `Payload timestamp is too old: ${timeDiff}ms`,
          timestamp: Date.now(),
        };
      }

      // Validate against schema if provided
      if (schema) {
        const schemaValidation = this.validateAgainstSchema(payload, schema);
        if (!schemaValidation.isValid) {
          return schemaValidation;
        }
      }

      return { isValid: true, timestamp: Date.now() };
    } catch (error) {
      return {
        isValid: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Validate payload against JSON schema
   */
  private static validateAgainstSchema(
    payload: any,
    schema: Record<string, any>
  ): ValidationResult {
    try {
      // Simple schema validation (non-recursive for simplicity)
      if (schema.type && payload.type !== schema.type) {
        return {
          isValid: false,
          error: `Expected type '${schema.type}', got '${payload.type}'`,
          timestamp: Date.now(),
        };
      }

      if (schema.required && Array.isArray(schema.required)) {
        for (const field of schema.required) {
          if (!(field in payload)) {
            return {
              isValid: false,
              error: `Missing required field: ${field}`,
              timestamp: Date.now(),
            };
          }
        }
      }

      return { isValid: true, timestamp: Date.now() };
    } catch (error) {
      return {
        isValid: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Validate webhook headers
   */
  static validateHeaders(
    headers: Record<string, any>,
    requiredHeaders: string[] = []
  ): ValidationResult {
    try {
      const normalizedHeaders: Record<string, string> = {};

      for (const [key, value] of Object.entries(headers)) {
        normalizedHeaders[key.toLowerCase()] = String(value);
      }

      for (const required of requiredHeaders) {
        if (!normalizedHeaders[required.toLowerCase()]) {
          return {
            isValid: false,
            error: `Missing required header: ${required}`,
            timestamp: Date.now(),
          };
        }
      }

      // Check for BlockStop-specific headers
      if (!normalizedHeaders['x-blockstop-event-type']) {
        return {
          isValid: false,
          error: 'Missing X-BlockStop-Event-Type header',
          timestamp: Date.now(),
        };
      }

      if (!normalizedHeaders['x-blockstop-event-id']) {
        return {
          isValid: false,
          error: 'Missing X-BlockStop-Event-ID header',
          timestamp: Date.now(),
        };
      }

      if (!normalizedHeaders['x-blockstop-timestamp']) {
        return {
          isValid: false,
          error: 'Missing X-BlockStop-Timestamp header',
          timestamp: Date.now(),
        };
      }

      return { isValid: true, timestamp: Date.now() };
    } catch (error) {
      return {
        isValid: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Rate limit validation
   */
  static validateRateLimit(
    webhookId: string,
    maxRequestsPerMinute: number = 100,
    requestHistory: Map<string, number[]> = new Map()
  ): ValidationResult {
    try {
      const now = Date.now();
      const oneMinuteAgo = now - 60 * 1000;

      let history = requestHistory.get(webhookId) || [];
      history = history.filter((timestamp) => timestamp > oneMinuteAgo);

      if (history.length >= maxRequestsPerMinute) {
        return {
          isValid: false,
          error: `Rate limit exceeded: ${history.length} requests in last minute`,
          timestamp: Date.now(),
        };
      }

      history.push(now);
      requestHistory.set(webhookId, history);

      return { isValid: true, timestamp: Date.now() };
    } catch (error) {
      return {
        isValid: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Validate IP whitelist
   */
  static validateIP(
    clientIP: string,
    whitelist: string[] = []
  ): ValidationResult {
    try {
      if (!whitelist || whitelist.length === 0) {
        return { isValid: true, timestamp: Date.now() };
      }

      const isAllowed = whitelist.some((ip) => {
        if (ip === '*') return true;
        if (ip === clientIP) return true;

        // Simple CIDR check (for /24 networks)
        if (ip.includes('/')) {
          const [network, mask] = ip.split('/');
          if (mask === '24') {
            const clientNetwork = clientIP.split('.').slice(0, 3).join('.');
            const allowedNetwork = network.split('.').slice(0, 3).join('.');
            return clientNetwork === allowedNetwork;
          }
        }

        return false;
      });

      return {
        isValid: isAllowed,
        error: isAllowed ? undefined : `IP ${clientIP} not in whitelist`,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        isValid: false,
        error: String(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Full webhook validation
   */
  static validateWebhook(
    payload: string | Buffer,
    signature: string,
    secret: string,
    headers?: Record<string, any>,
    options?: {
      validatePayloadSchema?: boolean;
      maxAge?: number;
      requiredHeaders?: string[];
      ipWhitelist?: string[];
      clientIP?: string;
    }
  ): ValidationResult {
    // Validate signature
    const sigValidation = this.validateSignature(payload, signature, secret);
    if (!sigValidation.isValid) {
      return sigValidation;
    }

    // Parse payload
    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(typeof payload === 'string' ? payload : payload.toString());
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid JSON payload',
        timestamp: Date.now(),
      };
    }

    // Validate headers
    if (headers) {
      const headerValidation = this.validateHeaders(headers, options?.requiredHeaders);
      if (!headerValidation.isValid) {
        return headerValidation;
      }
    }

    // Validate payload structure
    const payloadValidation = this.validatePayload(parsedPayload);
    if (!payloadValidation.isValid) {
      return payloadValidation;
    }

    // Validate IP
    if (options?.ipWhitelist && options?.clientIP) {
      const ipValidation = this.validateIP(options.clientIP, options.ipWhitelist);
      if (!ipValidation.isValid) {
        return ipValidation;
      }
    }

    return { isValid: true, timestamp: Date.now() };
  }
}

export default WebhookValidator;
