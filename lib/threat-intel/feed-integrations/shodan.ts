// Shodan Feed Integration
// Internet-wide scanning and host discovery data

import axios from 'axios';
import { IOC } from '../types';
import { rateLimiter, retryWithBackoff } from '../rate-limiter';
import { cacheManager } from '../cache-manager';

const SHODAN_API = 'https://api.shodan.io';

interface ShodanHost {
  ip_str: string;
  country_name: string;
  city: string;
  org: string;
  isp: string;
  ports: number[];
  hostnames: string[];
  vulns?: string[];
  data: Array<{
    port: number;
    banner: string;
  }>;
  last_update: string;
}

export class ShodanFeedIntegration {
  private apiKey: string;

  constructor(apiKey: string = process.env.SHODAN_API_KEY || '') {
    this.apiKey = apiKey;
  }

  async searchExploits(query: string, limit: number = 10): Promise<IOC[]> {
    if (!this.apiKey) {
      console.warn('[Shodan] API key not configured');
      return [];
    }

    const cacheKey = `shodan:exploits:${query}`;
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const results = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('shodan:api', {
          maxRequests: 1,
          windowMs: 1000,
          storageKey: 'shodan:api',
        });

        const response = await axios.get(`${SHODAN_API}/search/exploits`, {
          params: {
            query,
            key: this.apiKey,
            limit,
          },
        });

        return response.data;
      });

      const iocs = this.parseExploits(results);
      cacheManager.set(cacheKey, iocs, 3600000); // 1 hour cache

      return iocs;
    } catch (error) {
      console.error('[Shodan] Exploit search error:', error);
      return [];
    }
  }

  async lookupIP(ip: string): Promise<IOC | null> {
    if (!this.apiKey) {
      console.warn('[Shodan] API key not configured');
      return null;
    }

    const cacheKey = `shodan:ip:${ip}`;
    const cached = cacheManager.get<IOC>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('shodan:api', {
          maxRequests: 1,
          windowMs: 1000,
          storageKey: 'shodan:api',
        });

        const response = await axios.get(`${SHODAN_API}/host/${ip}`, {
          params: {
            key: this.apiKey,
          },
        });

        return response.data;
      });

      const ioc = this.parseHost(result);
      if (ioc) {
        cacheManager.set(cacheKey, ioc, 86400000); // 24 hours cache
      }

      return ioc;
    } catch (error) {
      console.error('[Shodan] IP lookup error:', error);
      return null;
    }
  }

  private parseExploits(results: Record<string, unknown>): IOC[] {
    if (!results.matches || !Array.isArray(results.matches)) {
      return [];
    }

    const iocs: IOC[] = [];

    for (const exploit of results.matches as Array<Record<string, unknown>>) {
      if (!exploit.id || !exploit.source) continue;

      // Extract potential IOCs from exploit details
      const value = String(exploit.id);
      const source = String(exploit.source);

      iocs.push({
        id: `shodan:exploit:${exploit.id}`,
        type: 'domain' as const, // Could be CVE or exploit name
        value,
        source: 'shodan',
        confidence: 80,
        firstSeen: new Date(),
        lastSeen: new Date(),
        tags: ['exploit', 'shodan', source],
        context: {
          source,
          description: exploit.description,
          published: exploit.published,
        },
      });
    }

    return iocs;
  }

  private parseHost(host: ShodanHost | Record<string, unknown>): IOC | null {
    if (typeof host !== 'object' || host === null || !('ip_str' in host)) {
      return null;
    }

    const typedHost = host as ShodanHost;
    const vulnCount = typedHost.vulns ? typedHost.vulns.length : 0;
    let confidence = 70;

    // Higher confidence if vulnerabilities are detected
    if (vulnCount > 0) {
      confidence = Math.min(95, 70 + vulnCount * 5);
    }

    return {
      id: `shodan:ip:${typedHost.ip_str}`,
      type: 'ip' as const,
      value: typedHost.ip_str,
      source: 'shodan',
      confidence,
      firstSeen: new Date(),
      lastSeen: new Date(typedHost.last_update),
      tags: [
        'shodan',
        'exposed-service',
        ...(vulnCount > 0 ? ['vulnerable'] : []),
      ],
      context: {
        country: typedHost.country_name,
        city: typedHost.city,
        org: typedHost.org,
        isp: typedHost.isp,
        ports: typedHost.ports,
        hostnames: typedHost.hostnames,
        vulnerabilities: typedHost.vulns || [],
        services: typedHost.data.map((d) => ({
          port: d.port,
          banner: d.banner.substring(0, 200),
        })),
      },
    };
  }
}

export const shodanFeed = new ShodanFeedIntegration();
