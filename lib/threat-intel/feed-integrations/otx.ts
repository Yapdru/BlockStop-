// AlienVault OTX Feed Integration
// Open Threat Exchange - Community-driven threat intelligence

import axios from 'axios';
import { IOC } from '../types';
import { rateLimiter, retryWithBackoff } from '../rate-limiter';
import { cacheManager } from '../cache-manager';

const OTX_API = 'https://otx.alienvault.com/api/v1';

interface OTXPulse {
  id: string;
  name: string;
  description: string;
  created: string;
  modified: string;
  indicators: Array<{
    id: string;
    indicator: string;
    type: string;
    title: string;
    created: string;
    content: string;
    cvss: {
      score: number;
    };
  }>;
}

interface OTXPulseList {
  results: OTXPulse[];
}

export class OTXFeedIntegration {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async fetchLatestPulses(limit: number = 50): Promise<IOC[]> {
    const cacheKey = 'otx:latest-pulses';
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const pulses = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('otx:api', {
          maxRequests: 120,
          windowMs: 3600000,
          storageKey: 'otx:api',
        });

        const headers: Record<string, string> = {
          'User-Agent': 'BlockStop-ThreatIntel/1.0',
        };

        if (this.apiKey) {
          headers['X-OTX-API-KEY'] = this.apiKey;
        }

        const response = await axios.get<OTXPulseList>(
          `${OTX_API}/pulses/subscribed`,
          { headers }
        );

        return response.data.results;
      });

      const iocs = this.parsePulses(pulses);
      cacheManager.set(cacheKey, iocs, 3600000); // 1 hour cache

      return iocs;
    } catch (error) {
      console.error('[OTX] Failed to fetch pulses:', error);
      return [];
    }
  }

  async searchIndicator(indicator: string): Promise<IOC[]> {
    const cacheKey = `otx:search:${indicator}`;
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('otx:search', {
          maxRequests: 60,
          windowMs: 60000,
          storageKey: 'otx:search',
        });

        const headers: Record<string, string> = {
          'User-Agent': 'BlockStop-ThreatIntel/1.0',
        };

        if (this.apiKey) {
          headers['X-OTX-API-KEY'] = this.apiKey;
        }

        const response = await axios.get(
          `${OTX_API}/indicators/${this.getIndicatorType(indicator)}/search?q=${encodeURIComponent(indicator)}`,
          { headers }
        );

        return response.data;
      });

      const iocs = this.parseSearchResult(result, indicator);
      cacheManager.set(cacheKey, iocs, 600000); // 10 minutes cache

      return iocs;
    } catch (error) {
      console.error('[OTX] Search error:', error);
      return [];
    }
  }

  private parsePulses(pulses: OTXPulse[]): IOC[] {
    const iocs: IOC[] = [];

    for (const pulse of pulses) {
      for (const indicator of pulse.indicators) {
        iocs.push({
          id: `otx:${indicator.id}`,
          type: this.mapOTXType(indicator.type),
          value: indicator.indicator,
          source: 'otx',
          confidence: Math.min(100, (indicator.cvss?.score || 7) * 15),
          firstSeen: new Date(pulse.created),
          lastSeen: new Date(pulse.modified),
          tags: ['otx', pulse.name.replace(/\s+/g, '-').toLowerCase()],
          context: {
            pulseId: pulse.id,
            pulseName: pulse.name,
            title: indicator.title,
            cvssScore: indicator.cvss?.score,
          },
        });
      }
    }

    return iocs;
  }

  private parseSearchResult(result: Record<string, unknown>, indicator: string): IOC[] {
    if (!result.results || !Array.isArray(result.results)) {
      return [];
    }

    return (result.results as Array<{ id: string; created: string; }>).map((item, index) => ({
      id: `otx:search:${indicator}:${index}`,
      type: this.getIndicatorType(indicator),
      value: indicator,
      source: 'otx-search',
      confidence: 85,
      firstSeen: new Date(item.created),
      lastSeen: new Date(),
      tags: ['otx', 'search-result'],
      context: {
        searchId: item.id,
      },
    }));
  }

  private getIndicatorType(indicator: string): 'ip' | 'domain' | 'url' | 'hash' | 'email' {
    if (this.isIP(indicator)) return 'ip';
    if (this.isHash(indicator)) return 'hash';
    if (this.isURL(indicator)) return 'url';
    if (this.isDomain(indicator)) return 'domain';
    if (this.isEmail(indicator)) return 'email';
    return 'domain';
  }

  private mapOTXType(otxType: string): 'ip' | 'domain' | 'url' | 'hash' | 'email' {
    const typeMap: Record<string, 'ip' | 'domain' | 'url' | 'hash' | 'email'> = {
      'IPv4': 'ip',
      'IPv6': 'ip',
      'domain': 'domain',
      'hostname': 'domain',
      'url': 'url',
      'uri': 'url',
      'email': 'email',
      'md5': 'hash',
      'sha1': 'hash',
      'sha256': 'hash',
      'FileHash-MD5': 'hash',
      'FileHash-SHA1': 'hash',
      'FileHash-SHA256': 'hash',
    };

    return typeMap[otxType] || 'domain';
  }

  private isIP(value: string): boolean {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
  }

  private isHash(value: string): boolean {
    return /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(value);
  }

  private isURL(value: string): boolean {
    return /^https?:\/\//.test(value);
  }

  private isDomain(value: string): boolean {
    return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}

export const otxFeed = new OTXFeedIntegration(process.env.OTX_API_KEY);
