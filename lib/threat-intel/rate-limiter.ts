// Rate Limiter for Threat Intelligence Feeds

import { RateLimitConfig } from './types';

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

class RateLimiter {
  private buckets: Map<string, RateLimitEntry> = new Map();

  async checkLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    const now = Date.now();
    let entry = this.buckets.get(key);

    if (!entry) {
      entry = {
        tokens: config.maxRequests,
        lastRefill: now,
      };
      this.buckets.set(key, entry);
    }

    // Refill tokens based on elapsed time
    const timePassed = now - entry.lastRefill;
    const refillRate = config.maxRequests / config.windowMs;
    const tokensToAdd = refillRate * timePassed;

    entry.tokens = Math.min(config.maxRequests, entry.tokens + tokensToAdd);
    entry.lastRefill = now;

    // Check if we have tokens available
    if (entry.tokens >= 1) {
      entry.tokens -= 1;
      return true;
    }

    return false;
  }

  async waitForLimit(key: string, config: RateLimitConfig): Promise<void> {
    while (!this.checkLimit(key, config)) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  getRemainingTokens(key: string): number {
    const entry = this.buckets.get(key);
    return entry ? entry.tokens : 0;
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  resetAll(): void {
    this.buckets.clear();
  }

  getStats(key: string): RateLimitEntry | null {
    return this.buckets.get(key) || null;
  }
}

export const rateLimiter = new RateLimiter();

// Exponential backoff retry helper
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(
        `[RetryWithBackoff] Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
