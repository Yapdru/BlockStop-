// URLhaus Feed Integration
// Malicious URLs database from abuse.ch

import axios from 'axios';
import { IOC } from '../types';
import { rateLimiter, retryWithBackoff } from '../rate-limiter';
import { cacheManager } from '../cache-manager';

const URLHAUS_API = 'https://urlhaus-api.abuse.ch/v1';

interface URLhausURL {
  id: string;
  url: string;
  url_status: string;
  host: string;
  date_added: string;
  threat: string;
  threat_status: string;
  tags: string[];
  urlhaus_reference: string;
  submission_count: number;
}

interface URLhausResponse {
  query_status: string;
  urls: URLhausURL[];
  url_count?: number;
}

export class URLhausFeedIntegration {
  async fetchRecent(limit: number = 100): Promise<IOC[]> {
    const cacheKey = 'urlhaus:recent';
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('urlhaus:api', {
          maxRequests: 60,
          windowMs: 60000,
          storageKey: 'urlhaus:api',
        });

        const response = await axios.post<URLhausResponse>(
          `${URLHAUS_API}/urls/query_recent`,
          {
            limit,
          }
        );

        return response.data;
      });

      const iocs = this.parseResponse(result);
      cacheManager.set(cacheKey, iocs, 600000); // 10 minutes cache

      return iocs;
    } catch (error) {
      console.error('[URLhaus] Failed to fetch recent URLs:', error);
      return [];
    }
  }

  async searchByHost(host: string): Promise<IOC[]> {
    const cacheKey = `urlhaus:host:${host}`;
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('urlhaus:search', {
          maxRequests: 60,
          windowMs: 60000,
          storageKey: 'urlhaus:search',
        });

        const response = await axios.post<URLhausResponse>(
          `${URLHAUS_API}/urls/query_host`,
          {
            host,
          }
        );

        return response.data;
      });

      const iocs = this.parseResponse(result);
      cacheManager.set(cacheKey, iocs, 3600000); // 1 hour cache

      return iocs;
    } catch (error) {
      console.error('[URLhaus] Host search error:', error);
      return [];
    }
  }

  async searchByTag(tag: string): Promise<IOC[]> {
    const cacheKey = `urlhaus:tag:${tag}`;
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('urlhaus:search', {
          maxRequests: 60,
          windowMs: 60000,
          storageKey: 'urlhaus:search',
        });

        const response = await axios.post<URLhausResponse>(
          `${URLHAUS_API}/urls/query_tag`,
          {
            tag,
          }
        );

        return response.data;
      });

      const iocs = this.parseResponse(result);
      cacheManager.set(cacheKey, iocs, 3600000); // 1 hour cache

      return iocs;
    } catch (error) {
      console.error('[URLhaus] Tag search error:', error);
      return [];
    }
  }

  private parseResponse(response: URLhausResponse): IOC[] {
    if (response.query_status !== 'ok' || !response.urls) {
      return [];
    }

    return response.urls.map((url) => {
      const confidence = this.calculateConfidence(url);

      return {
        id: `urlhaus:${url.id}`,
        type: 'url' as const,
        value: url.url,
        source: 'urlhaus',
        confidence,
        firstSeen: new Date(url.date_added),
        lastSeen: new Date(),
        tags: ['malicious-url', 'urlhaus', ...url.tags],
        context: {
          host: url.host,
          threat: url.threat,
          threatStatus: url.threat_status,
          status: url.url_status,
          submissionCount: url.submission_count,
          reference: url.urlhaus_reference,
        },
      };
    });
  }

  private calculateConfidence(url: URLhausURL): number {
    let confidence = 70;

    // Boost confidence for confirmed threats
    if (url.threat_status === 'confirmed') {
      confidence += 20;
    }

    // Boost for online URLs
    if (url.url_status === 'online') {
      confidence += 10;
    }

    // Boost based on submission count
    if (url.submission_count > 5) {
      confidence += 10;
    }

    return Math.min(100, confidence);
  }
}

export const urlhausFeed = new URLhausFeedIntegration();
