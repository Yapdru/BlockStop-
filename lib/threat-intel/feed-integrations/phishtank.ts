// PhishTank Feed Integration
// Verified phishing URLs database

import axios from 'axios';
import { IOC } from '../types';
import { rateLimiter, retryWithBackoff } from '../rate-limiter';
import { cacheManager } from '../cache-manager';

const PHISHTANK_API = 'https://data.phishtank.com/phish_detail';

interface PhishTankEntry {
  phish_id: string;
  url: string;
  phish_detail_url: string;
  submission_time: string;
  verified: string;
  verification_time: string;
  online: string;
  target: string;
  details: Array<{
    user_agent: string;
    http_response_code: string;
  }>;
}

export class PhishTankFeedIntegration {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async fetchRecent(limit: number = 100): Promise<IOC[]> {
    const cacheKey = 'phishtank:recent';
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const iocs = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('phishtank:api', {
          maxRequests: 120,
          windowMs: 3600000,
          storageKey: 'phishtank:api',
        });

        // PhishTank provides a CSV dump or API
        const response = await axios.get(
          'https://data.phishtank.com/data/online-valid.json'
        );

        return Array.isArray(response.data) ? response.data : [];
      });

      const parsed = this.parseEntries(iocs.slice(0, limit));
      cacheManager.set(cacheKey, parsed, 1800000); // 30 minutes cache

      return parsed;
    } catch (error) {
      console.error('[PhishTank] Failed to fetch recent phishing URLs:', error);
      return [];
    }
  }

  async checkURL(url: string): Promise<IOC | null> {
    const cacheKey = `phishtank:check:${url}`;
    const cached = cacheManager.get<IOC>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('phishtank:check', {
          maxRequests: 30,
          windowMs: 60000,
          storageKey: 'phishtank:check',
        });

        const response = await axios.get(PHISHTANK_API, {
          params: {
            url: url,
            format: 'json',
            ...(this.apiKey && { app_token: this.apiKey }),
          },
        });

        return response.data;
      });

      const ioc = this.parseEntry(result);
      if (ioc) {
        cacheManager.set(cacheKey, ioc, 86400000); // 24 hours cache
      }

      return ioc;
    } catch (error) {
      console.error('[PhishTank] Check URL error:', error);
      return null;
    }
  }

  private parseEntries(entries: unknown[]): IOC[] {
    return entries
      .filter((entry): entry is PhishTankEntry => typeof entry === 'object' && entry !== null && 'url' in entry)
      .map((entry) => this.parseEntry(entry))
      .filter((ioc): ioc is IOC => ioc !== null);
  }

  private parseEntry(entry: PhishTankEntry | Record<string, unknown>): IOC | null {
    if (typeof entry !== 'object' || entry === null || !('url' in entry)) {
      return null;
    }

    const typedEntry = entry as PhishTankEntry;
    const isVerified = typedEntry.verified === 'yes';
    const isOnline = typedEntry.online === 'yes';

    let confidence = 80;
    if (isVerified && isOnline) confidence = 95;
    if (isVerified && !isOnline) confidence = 85;

    return {
      id: `phishtank:${typedEntry.phish_id}`,
      type: 'url' as const,
      value: typedEntry.url,
      source: 'phishtank',
      confidence,
      firstSeen: new Date(typedEntry.submission_time),
      lastSeen: new Date(typedEntry.verification_time || typedEntry.submission_time),
      tags: [
        'phishing-url',
        'phishtank',
        isVerified ? 'verified' : 'unverified',
        isOnline ? 'online' : 'offline',
      ],
      context: {
        phishId: typedEntry.phish_id,
        verified: isVerified,
        online: isOnline,
        target: typedEntry.target,
        detailURL: typedEntry.phish_detail_url,
      },
    };
  }
}

export const phishTankFeed = new PhishTankFeedIntegration(process.env.PHISHTANK_API_KEY);
