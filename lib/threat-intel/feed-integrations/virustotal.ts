// VirusTotal Feed Integration
// File/URL/IP/Domain reputation and AV detection data

import axios from 'axios';
import { IOC } from '../types';
import { rateLimiter, retryWithBackoff } from '../rate-limiter';
import { cacheManager } from '../cache-manager';

const VT_API = 'https://www.virustotal.com/api/v3';

interface VTFileLookupResult {
  data: {
    id: string;
    attributes: {
      last_analysis_date: number;
      last_analysis_stats: {
        malicious: number;
        suspicious: number;
        undetected: number;
      };
      last_analysis_results: Record<string, {
        category: string;
        engine_name: string;
        result: string;
      }>;
    };
  };
}

interface VTURLResult {
  data: {
    id: string;
    attributes: {
      last_http_response_code: number;
      last_analysis_date: number;
      last_analysis_stats: {
        malicious: number;
        suspicious: number;
      };
      last_analysis_results: Record<string, {
        category: string;
        engine_name: string;
        result: string;
      }>;
    };
  };
}

export class VirusTotalFeedIntegration {
  private apiKey: string;

  constructor(apiKey: string = process.env.VIRUSTOTAL_API_KEY || '') {
    this.apiKey = apiKey;
  }

  async lookupFile(hash: string): Promise<IOC | null> {
    if (!this.apiKey) {
      console.warn('[VirusTotal] API key not configured');
      return null;
    }

    const cacheKey = `vt:file:${hash}`;
    const cached = cacheManager.get<IOC>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('virustotal:api', {
          maxRequests: 4,
          windowMs: 60000,
          storageKey: 'virustotal:api',
        });

        const response = await axios.get<VTFileLookupResult>(
          `${VT_API}/files/${hash}`,
          {
            headers: {
              'x-apikey': this.apiKey,
            },
          }
        );

        return response.data;
      });

      const ioc = this.parseFileResult(result, hash);
      if (ioc) {
        cacheManager.set(cacheKey, ioc, 86400000); // 24 hours cache
      }

      return ioc;
    } catch (error) {
      console.error('[VirusTotal] File lookup error:', error);
      return null;
    }
  }

  async lookupURL(url: string): Promise<IOC | null> {
    if (!this.apiKey) {
      console.warn('[VirusTotal] API key not configured');
      return null;
    }

    const cacheKey = `vt:url:${url}`;
    const cached = cacheManager.get<IOC>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('virustotal:api', {
          maxRequests: 4,
          windowMs: 60000,
          storageKey: 'virustotal:api',
        });

        const response = await axios.get<VTURLResult>(
          `${VT_API}/urls/${this.encodeURL(url)}`,
          {
            headers: {
              'x-apikey': this.apiKey,
            },
          }
        );

        return response.data;
      });

      const ioc = this.parseURLResult(result, url);
      if (ioc) {
        cacheManager.set(cacheKey, ioc, 86400000); // 24 hours cache
      }

      return ioc;
    } catch (error) {
      console.error('[VirusTotal] URL lookup error:', error);
      return null;
    }
  }

  async lookupIP(ip: string): Promise<IOC | null> {
    if (!this.apiKey) {
      console.warn('[VirusTotal] API key not configured');
      return null;
    }

    const cacheKey = `vt:ip:${ip}`;
    const cached = cacheManager.get<IOC>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await retryWithBackoff(async () => {
        await rateLimiter.waitForLimit('virustotal:api', {
          maxRequests: 4,
          windowMs: 60000,
          storageKey: 'virustotal:api',
        });

        const response = await axios.get(
          `${VT_API}/ip_addresses/${ip}`,
          {
            headers: {
              'x-apikey': this.apiKey,
            },
          }
        );

        return response.data;
      });

      const ioc = this.parseIPResult(result, ip);
      if (ioc) {
        cacheManager.set(cacheKey, ioc, 86400000); // 24 hours cache
      }

      return ioc;
    } catch (error) {
      console.error('[VirusTotal] IP lookup error:', error);
      return null;
    }
  }

  private parseFileResult(result: VTFileLookupResult, hash: string): IOC | null {
    if (!result.data) {
      return null;
    }

    const attrs = result.data.attributes;
    const maliciousCount = attrs.last_analysis_stats.malicious;
    const confidence = Math.min(100, maliciousCount * 10);

    return {
      id: `vt:file:${hash}`,
      type: 'hash' as const,
      value: hash,
      source: 'virustotal',
      confidence,
      firstSeen: new Date(),
      lastSeen: new Date(attrs.last_analysis_date * 1000),
      tags: maliciousCount > 5 ? ['malicious', 'virustotal'] : ['virustotal'],
      context: {
        maliciousDetections: maliciousCount,
        suspiciousDetections: attrs.last_analysis_stats.suspicious,
        undetected: attrs.last_analysis_stats.undetected,
        detections: attrs.last_analysis_results,
      },
    };
  }

  private parseURLResult(result: VTURLResult, url: string): IOC | null {
    if (!result.data) {
      return null;
    }

    const attrs = result.data.attributes;
    const maliciousCount = attrs.last_analysis_stats.malicious;
    const confidence = Math.min(100, maliciousCount * 10);

    return {
      id: `vt:url:${url}`,
      type: 'url' as const,
      value: url,
      source: 'virustotal',
      confidence,
      firstSeen: new Date(),
      lastSeen: new Date(attrs.last_analysis_date * 1000),
      tags: maliciousCount > 5 ? ['malicious-url', 'virustotal'] : ['virustotal'],
      context: {
        maliciousDetections: maliciousCount,
        suspiciousDetections: attrs.last_analysis_stats.suspicious,
        httpResponseCode: attrs.last_http_response_code,
      },
    };
  }

  private parseIPResult(result: Record<string, unknown>, ip: string): IOC | null {
    if (!result.data) {
      return null;
    }

    // Basic parsing - VirusTotal API structure
    return {
      id: `vt:ip:${ip}`,
      type: 'ip' as const,
      value: ip,
      source: 'virustotal',
      confidence: 70,
      firstSeen: new Date(),
      lastSeen: new Date(),
      tags: ['virustotal', 'ip-reputation'],
      context: result.data,
    };
  }

  private encodeURL(url: string): string {
    return Buffer.from(url).toString('base64').replace(/[=+/]/g, (char) => {
      const replacements: Record<string, string> = { '=': '', '+': '-', '/': '_' };
      return replacements[char] || char;
    });
  }
}

export const virusTotalFeed = new VirusTotalFeedIntegration();
