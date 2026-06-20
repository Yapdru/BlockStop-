// Rate Limiting Service
import { RateLimitInfo } from './types';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  'free': { limit: 100, windowMs: 60 * 1000 }, // 100 req/min
  'pro': { limit: 10000, windowMs: 60 * 1000 }, // 10k req/min
  'enterprise': { limit: 100000, windowMs: 60 * 1000 }, // 100k req/min
};

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  checkLimit(apiKeyId: string, tier: string = 'free'): RateLimitInfo {
    const config = rateLimitConfigs[tier] || rateLimitConfigs['free'];
    const key = `ratelimit:${apiKeyId}`;
    const now = Date.now();

    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetAt: now + config.windowMs,
      };
    }

    const entry = this.store[key];

    // Reset if window expired
    if (now >= entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + config.windowMs;
    }

    const isLimited = entry.count >= config.limit;
    const remaining = Math.max(0, config.limit - entry.count);
    const reset = entry.resetAt;

    const info: RateLimitInfo = {
      limit: config.limit,
      remaining,
      reset,
    };

    if (isLimited) {
      info.retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    }

    // Increment counter
    entry.count++;

    return info;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetAt < now) {
        delete this.store[key];
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const rateLimiter = new RateLimiter();

// Quota Management
interface QuotaConfig {
  daily: number;
  monthly: number;
  concurrent: number;
}

interface QuotaUsage {
  date: string;
  month: string;
  dailyCount: number;
  monthlyCount: number;
  concurrentCount: number;
}

class QuotaManager {
  private usage: Map<string, QuotaUsage> = new Map();
  private quotas: Record<string, QuotaConfig> = {
    'free': { daily: 1000, monthly: 10000, concurrent: 5 },
    'pro': { daily: 50000, monthly: 1000000, concurrent: 50 },
    'enterprise': { daily: 500000, monthly: 10000000, concurrent: 500 },
  };

  setQuota(tier: string, config: QuotaConfig): void {
    this.quotas[tier] = config;
  }

  checkQuota(apiKeyId: string, tier: string = 'free'): {
    allowed: boolean;
    remaining: { daily: number; monthly: number };
    resetAt?: { daily: string; monthly: string };
  } {
    const config = this.quotas[tier] || this.quotas['free'];
    const today = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().slice(0, 7);

    const key = `quota:${apiKeyId}`;
    let usage = this.usage.get(key);

    if (!usage || usage.date !== today) {
      usage = {
        date: today,
        month,
        dailyCount: 0,
        monthlyCount: 0,
        concurrentCount: 0,
      };
      this.usage.set(key, usage);
    }

    const dailyRemaining = config.daily - usage.dailyCount;
    const monthlyRemaining = config.monthly - usage.monthlyCount;
    const allowed = dailyRemaining > 0 && monthlyRemaining > 0;

    return {
      allowed,
      remaining: {
        daily: Math.max(0, dailyRemaining),
        monthly: Math.max(0, monthlyRemaining),
      },
      ...(allowed
        ? {}
        : {
            resetAt: {
              daily: `${today}T23:59:59Z`,
              monthly: `${month}-31T23:59:59Z`,
            },
          }),
    };
  }

  incrementUsage(
    apiKeyId: string,
    amount: number = 1,
    type: 'daily' | 'monthly' | 'concurrent' = 'daily'
  ): void {
    const key = `quota:${apiKeyId}`;
    const usage = this.usage.get(key);
    if (usage) {
      if (type === 'daily') usage.dailyCount += amount;
      if (type === 'monthly') usage.monthlyCount += amount;
      if (type === 'concurrent') usage.concurrentCount += amount;
    }
  }

  decrementConcurrent(apiKeyId: string): void {
    const key = `quota:${apiKeyId}`;
    const usage = this.usage.get(key);
    if (usage) {
      usage.concurrentCount = Math.max(0, usage.concurrentCount - 1);
    }
  }
}

export const quotaManager = new QuotaManager();
