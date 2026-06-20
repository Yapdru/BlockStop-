// Retry Handler - Exponential Backoff Retry Logic (Max 7 Attempts)
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number; // 0-1, adds randomness to prevent thundering herd
}

export interface RetryAttempt {
  attemptNumber: number;
  nextRetryAt: Date;
  delayMs: number;
  shouldRetry: boolean;
}

export interface RetryContext {
  statusCode?: number;
  error?: string;
  isRetryable: boolean;
  reason?: string;
}

export class RetryHandler {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 7,
    initialDelayMs: 1000, // 1 second
    maxDelayMs: 300000, // 5 minutes
    backoffMultiplier: 2,
    jitterFactor: 0.1, // 10% jitter
  };

  // Retryable HTTP status codes
  private static readonly RETRYABLE_STATUS_CODES = [
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ];

  /**
   * Determine if an error is retryable based on status code and error type
   */
  static isRetryable(context: RetryContext): boolean {
    if (context.isRetryable !== undefined) {
      return context.isRetryable;
    }

    // Check status code
    if (context.statusCode !== undefined) {
      return this.RETRYABLE_STATUS_CODES.includes(context.statusCode);
    }

    // Check error type
    if (context.error) {
      const retryableErrors = [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'EHOSTUNREACH',
        'ENETUNREACH',
        'ERR_HTTP_INVALID_HEADER_VALUE',
      ];

      return retryableErrors.some(err => context.error?.includes(err));
    }

    return false;
  }

  /**
   * Calculate next retry delay with exponential backoff and jitter
   */
  static calculateDelay(
    attemptNumber: number,
    config: Partial<RetryConfig> = {}
  ): number {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Calculate exponential backoff: initialDelay * (multiplier ^ attemptNumber)
    const exponentialDelay = Math.min(
      finalConfig.initialDelayMs *
        Math.pow(finalConfig.backoffMultiplier, attemptNumber - 1),
      finalConfig.maxDelayMs
    );

    // Add jitter: delay * (1 - jitterFactor + random(0, jitterFactor))
    const jitter =
      exponentialDelay *
      (1 -
        finalConfig.jitterFactor +
        Math.random() * finalConfig.jitterFactor);

    return Math.round(jitter);
  }

  /**
   * Get retry attempt information
   */
  static getRetryAttempt(
    attemptNumber: number,
    config: Partial<RetryConfig> = {}
  ): RetryAttempt {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    const shouldRetry = attemptNumber < finalConfig.maxRetries;
    const delayMs = this.calculateDelay(attemptNumber, finalConfig);

    return {
      attemptNumber,
      nextRetryAt: new Date(Date.now() + delayMs),
      delayMs,
      shouldRetry,
    };
  }

  /**
   * Generate retry schedule for all attempts
   */
  static generateRetrySchedule(
    config: Partial<RetryConfig> = {}
  ): Array<{ attempt: number; delayMs: number; nextRetryAt: Date }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const schedule = [];

    for (let i = 1; i < finalConfig.maxRetries; i++) {
      const delay = this.calculateDelay(i, finalConfig);
      schedule.push({
        attempt: i,
        delayMs: delay,
        nextRetryAt: new Date(Date.now() + delay),
      });
    }

    return schedule;
  }

  /**
   * Determine if should give up after max retries
   */
  static shouldGiveUp(
    attemptNumber: number,
    config: Partial<RetryConfig> = {}
  ): boolean {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    return attemptNumber >= finalConfig.maxRetries;
  }

  /**
   * Get retry statistics for logging/monitoring
   */
  static getRetryStats(
    totalAttempts: number,
    config: Partial<RetryConfig> = {}
  ): {
    totalAttempts: number;
    successfulAttempt?: number;
    totalDelayMs: number;
    averageDelayMs: number;
  } {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const delays: number[] = [];

    for (let i = 1; i < totalAttempts && i < finalConfig.maxRetries; i++) {
      delays.push(this.calculateDelay(i, finalConfig));
    }

    const totalDelayMs = delays.reduce((sum, d) => sum + d, 0);

    return {
      totalAttempts,
      totalDelayMs,
      averageDelayMs: delays.length > 0 ? totalDelayMs / delays.length : 0,
    };
  }

  /**
   * Validate retry configuration
   */
  static validateConfig(config: Partial<RetryConfig>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (config.maxRetries !== undefined) {
      if (config.maxRetries < 1 || config.maxRetries > 10) {
        errors.push('maxRetries must be between 1 and 10');
      }
    }

    if (config.initialDelayMs !== undefined) {
      if (config.initialDelayMs < 100) {
        errors.push('initialDelayMs must be at least 100ms');
      }
    }

    if (config.maxDelayMs !== undefined) {
      if (config.maxDelayMs < 1000) {
        errors.push('maxDelayMs must be at least 1000ms');
      }
    }

    if (
      config.initialDelayMs &&
      config.maxDelayMs &&
      config.initialDelayMs > config.maxDelayMs
    ) {
      errors.push('initialDelayMs must be less than maxDelayMs');
    }

    if (config.backoffMultiplier !== undefined) {
      if (config.backoffMultiplier < 1 || config.backoffMultiplier > 5) {
        errors.push('backoffMultiplier must be between 1 and 5');
      }
    }

    if (config.jitterFactor !== undefined) {
      if (config.jitterFactor < 0 || config.jitterFactor > 1) {
        errors.push('jitterFactor must be between 0 and 1');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
