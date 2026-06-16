// Abuse.ch Feed Integration
// Provides malware hashes, URLs, and indicator data

import axios from 'axios';
import { IOC } from '../types';
import { rateLimiter, retryWithBackoff } from '../rate-limiter';
import { cacheManager } from '../cache-manager';

const URLHAUS_API = 'https://urlhaus-api.abuse.ch/v1';
const MALWARE_BAZAAR_API = 'https://mb-api.abuse.ch/api/v1';

interface UrlhausResult {
  query_status: string;
  results: Array<{
    id: string;
    url: string;
    url_status: string;
    host: string;
    date_added: string;
    threat: string;
    tags: string[];
  }>;
}

interface MalwareBazaarResult {
  query_status: string;
  data: Array<{
    sha256_hash: string;
    file_name: string;
    file_type: string;
    mime_type: string;
    file_size: number;
    first_submission: string;
    last_submission: string;
    tags: string[];
    intelligence: {
      clamav: string;
      tlsh: string;
    };
  }>;
}

export class AbuseCHFeedIntegration {
  async fetchURLhaus(query: string): Promise<IOC[]> {
    const cacheKey = `abuse-ch:urlhaus:${query}`;
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('abuse-ch:urlhaus', {
          maxRequests: 60,
          windowMs: 60000,
          storageKey: 'abuse-ch:urlhaus',
        });

        const response = await axios.post<UrlhausResult>(URLHAUS_API + '/urls/query_recent', {
          limit: 100,
        });

        return response.data;
      });

      const iocs = this.parseUrlhausResults(result);
      cacheManager.set(cacheKey, iocs, 3600000); // 1 hour cache

      return iocs;
    } catch (error) {
      console.error('[AbuseCH] URLhaus fetch error:', error);
      return [];
    }
  }

  async fetchMalwareBazaar(hash: string, hashType: 'sha256' | 'md5' | 'sha1' = 'sha256'): Promise<IOC[]> {
    const cacheKey = `abuse-ch:malware-bazaar:${hash}`;
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('abuse-ch:malware-bazaar', {
          maxRequests: 60,
          windowMs: 60000,
          storageKey: 'abuse-ch:malware-bazaar',
        });

        const response = await axios.post<MalwareBazaarResult>(MALWARE_BAZAAR_API, {
          query: 'get_recent',
          limit: 100,
        });

        return response.data;
      });

      const iocs = this.parseMalwareBazaarResults(result);
      cacheManager.set(cacheKey, iocs, 3600000); // 1 hour cache

      return iocs;
    } catch (error) {
      console.error('[AbuseCH] MalwareBazaar fetch error:', error);
      return [];
    }
  }

  async fetchLatestIndicators(): Promise<IOC[]> {
    const cacheKey = 'abuse-ch:latest-indicators';
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const [urlhausIOCs, bazaarIOCs] = await Promise.all([
        this.fetchURLhaus(''),
        this.fetchMalwareBazaar(''),
      ]);

      const iocs = [...urlhausIOCs, ...bazaarIOCs];
      cacheManager.set(cacheKey, iocs, 600000); // 10 minutes cache

      return iocs;
    } catch (error) {
      console.error('[AbuseCH] Failed to fetch latest indicators:', error);
      return [];
    }
  }

  private parseUrlhausResults(result: UrlhausResult): IOC[] {
    if (result.query_status !== 'ok' || !result.results) {
      return [];
    }

    return result.results.map((item) => ({
      id: `abuse-ch:urlhaus:${item.id}`,
      type: 'url' as const,
      value: item.url,
      source: 'abuse-ch-urlhaus',
      confidence: 90,
      firstSeen: new Date(item.date_added),
      lastSeen: new Date(),
      tags: ['malicious-url', 'abuse-ch', ...item.tags],
      context: {
        host: item.host,
        threat: item.threat,
        status: item.url_status,
      },
    }));
  }

  private parseMalwareBazaarResults(result: MalwareBazaarResult): IOC[] {
    if (result.query_status !== 'ok' || !result.data) {
      return [];
    }

    return result.data.map((item) => ({
      id: `abuse-ch:malware-bazaar:${item.sha256_hash}`,
      type: 'hash' as const,
      value: item.sha256_hash,
      source: 'abuse-ch-malware-bazaar',
      confidence: 95,
      firstSeen: new Date(item.first_submission),
      lastSeen: new Date(item.last_submission),
      tags: ['malware-sample', 'abuse-ch', ...item.tags],
      context: {
        fileName: item.file_name,
        fileType: item.file_type,
        fileSize: item.file_size,
        mimeType: item.mime_type,
        intelligence: item.intelligence,
      },
    }));
  }
}

export const abuseCHFeed = new AbuseCHFeedIntegration();
