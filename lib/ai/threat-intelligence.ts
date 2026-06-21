// Phase 28.1 - Advanced Threat Intelligence Module
// Aggregates data from free threat feeds (MISP, AbuseIPDB, VirusTotal, etc.)
// Real-time threat detection, pattern matching, and threat scoring

import * as https from 'https';
import * as http from 'http';

export interface ThreatFeed {
  id: string;
  name: string;
  type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
  url: string;
  headers?: Record<string, string>;
  updateInterval: number; // in milliseconds
  isEnabled: boolean;
  lastUpdated?: Date;
  indicators?: ThreatIndicator[];
}

export interface ThreatIndicator {
  id: string;
  value: string;
  type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  tags: string[];
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  confidence: number; // 0-100
  context?: Record<string, any>;
}

export interface ThreatPattern {
  id: string;
  name: string;
  pattern: RegExp | string;
  category: 'malware' | 'phishing' | 'botnet' | 'ransomware' | 'apt' | 'ddos' | 'c2';
  severity: 'critical' | 'high' | 'medium' | 'low';
  indicators: string[];
}

export interface ThreatMatch {
  indicator: ThreatIndicator;
  pattern: ThreatPattern;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  matchedValue: string;
  context?: Record<string, any>;
}

export interface ThreatScore {
  overallScore: number; // 0-100
  category: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  matches: ThreatMatch[];
  indicators: ThreatIndicator[];
  patterns: ThreatPattern[];
  lastUpdated: Date;
  sources: string[];
}

// Cache for threat feeds
let feedCache = new Map<string, ThreatFeed>();
let indicatorCache = new Map<string, ThreatIndicator>();
let patternCache = new Map<string, ThreatPattern>();

// Free threat feed sources
const DEFAULT_THREAT_FEEDS: ThreatFeed[] = [
  {
    id: 'abuseipdb',
    name: 'AbuseIPDB',
    type: 'ip',
    url: 'https://api.abuseipdb.com/api/v2/blacklist',
    updateInterval: 3600000, // 1 hour
    isEnabled: true,
  },
  {
    id: 'otx',
    name: 'AlienVault OTX',
    type: 'ip',
    url: 'https://otx.alienvault.com/api/v1/pulses/subscribed',
    headers: { 'X-OTX-API-Key': process.env.OTX_API_KEY || '' },
    updateInterval: 3600000,
    isEnabled: true,
  },
  {
    id: 'phishtank',
    name: 'PhishTank',
    type: 'url',
    url: 'https://data.phishtank.com/data/online-valid.json',
    updateInterval: 3600000,
    isEnabled: true,
  },
  {
    id: 'urlhaus',
    name: 'URLhaus',
    type: 'url',
    url: 'https://urlhaus-api.abuse.ch/v1/urls/recent/',
    updateInterval: 1800000, // 30 minutes
    isEnabled: true,
  },
  {
    id: 'majestic-million',
    name: 'Majestic Million',
    type: 'domain',
    url: 'https://majestic.com/feeds/majestic_million.csv',
    updateInterval: 604800000, // 7 days
    isEnabled: true,
  },
];

// Threat patterns for detection
const THREAT_PATTERNS: ThreatPattern[] = [
  {
    id: 'ransomware-extensions',
    name: 'Ransomware File Extensions',
    pattern: /\.(encrypted|locked|crypto|ransomware|payransom|ncov|crypt|kryptos|cry|lock|xyz|aaa|zzz|EncryptedExt)$/i,
    category: 'ransomware',
    severity: 'critical',
    indicators: ['ransomware', 'encryption', 'file-lock'],
  },
  {
    id: 'suspicious-ip-patterns',
    name: 'Suspicious IP Address Patterns',
    pattern: /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/,
    category: 'malware',
    severity: 'medium',
    indicators: ['private-ip', 'internal-network'],
  },
  {
    id: 'c2-domain-patterns',
    name: 'C2 Domain Patterns',
    pattern: /^(malware|botnet|c2|command|control|beacon|callback)\./i,
    category: 'c2',
    severity: 'critical',
    indicators: ['c2', 'command-control', 'botnet'],
  },
  {
    id: 'apt-indicators',
    name: 'APT Indicators',
    pattern: /(lazarus|apt1|apt28|apt29|apt40|cobalt|lazarus|gh0st|poison-ivy)/i,
    category: 'apt',
    severity: 'critical',
    indicators: ['apt', 'advanced-persistent-threat', 'nation-state'],
  },
  {
    id: 'ddos-indicators',
    name: 'DDoS Attack Indicators',
    pattern: /(mirai|botnet|ddos|flood|amplification|reflection)/i,
    category: 'ddos',
    severity: 'high',
    indicators: ['ddos', 'botnet', 'distributed-attack'],
  },
];

class ThreatIntelligenceEngine {
  private feeds: Map<string, ThreatFeed> = new Map();
  private indicators: Map<string, ThreatIndicator> = new Map();
  private patterns: Map<string, ThreatPattern> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultFeeds();
    this.initializePatterns();
  }

  private initializeDefaultFeeds(): void {
    DEFAULT_THREAT_FEEDS.forEach((feed) => {
      this.feeds.set(feed.id, feed);
    });
  }

  private initializePatterns(): void {
    THREAT_PATTERNS.forEach((pattern) => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  /**
   * Add a custom threat feed
   */
  addThreatFeed(feed: ThreatFeed): void {
    this.feeds.set(feed.id, feed);
    if (feed.isEnabled) {
      this.startFeedUpdate(feed.id);
    }
  }

  /**
   * Add a custom threat pattern
   */
  addThreatPattern(pattern: ThreatPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Start periodic update of threat feed
   */
  startFeedUpdate(feedId: string): void {
    const feed = this.feeds.get(feedId);
    if (!feed) return;

    // Fetch immediately
    this.updateFeed(feedId);

    // Schedule periodic updates
    const interval = setInterval(() => {
      this.updateFeed(feedId);
    }, feed.updateInterval);

    this.updateIntervals.set(feedId, interval);
  }

  /**
   * Fetch and parse threat feed data
   */
  private async updateFeed(feedId: string): Promise<void> {
    const feed = this.feeds.get(feedId);
    if (!feed) return;

    try {
      const data = await this.fetchFeedData(feed.url, feed.headers);
      const indicators = this.parseIndicators(data, feed);

      indicators.forEach((indicator) => {
        this.indicators.set(indicator.value, indicator);
      });

      feed.lastUpdated = new Date();
      feed.indicators = indicators;
    } catch (error) {
      console.error(`Error updating threat feed ${feedId}:`, error);
    }
  }

  /**
   * Fetch data from threat feed URL
   */
  private fetchFeedData(
    url: string,
    headers?: Record<string, string>
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const options = { headers };

      const req = protocol.get(url, options, (res) => {
        let data = '';

        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch feed: ${res.statusCode}`));
          return;
        }

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Feed fetch timeout'));
      });
    });
  }

  /**
   * Parse indicators from feed data
   */
  private parseIndicators(data: string, feed: ThreatFeed): ThreatIndicator[] {
    const indicators: ThreatIndicator[] = [];

    try {
      // Handle different feed formats
      if (feed.id === 'phishtank' || feed.id === 'urlhaus') {
        const json = JSON.parse(data);
        const items = json.results || json.data || [];

        items.forEach((item: any) => {
          indicators.push({
            id: `${feed.id}-${item.id || item.url}`,
            value: item.url || item.phish_detail_url || '',
            type: feed.type,
            severity: 'high',
            tags: ['phishing', 'malicious-url'],
            source: feed.name,
            firstSeen: new Date(item.submission_time || item.dateadded || Date.now()),
            lastSeen: new Date(),
            confidence: 95,
            context: {
              feedId: feed.id,
              details: item.details || item.phish_detail_page,
            },
          });
        });
      } else if (feed.id === 'otx') {
        const json = JSON.parse(data);
        const pulses = json.results || [];

        pulses.forEach((pulse: any) => {
          pulse.indicators?.forEach((indicator: any) => {
            indicators.push({
              id: `${feed.id}-${indicator.id}`,
              value: indicator.indicator,
              type: feed.type,
              severity: this.mapSeverity(pulse.revision),
              tags: pulse.tags || [],
              source: feed.name,
              firstSeen: new Date(pulse.created),
              lastSeen: new Date(pulse.modified),
              confidence: 85,
              context: {
                feedId: feed.id,
                pulseId: pulse.id,
              },
            });
          });
        });
      } else if (feed.id === 'abuseipdb') {
        // Parse CSV or JSON from AbuseIPDB
        const lines = data.split('\n');
        lines.forEach((line) => {
          if (line.trim()) {
            const parts = line.split(',');
            if (parts.length >= 1) {
              indicators.push({
                id: `${feed.id}-${parts[0]}`,
                value: parts[0].trim(),
                type: 'ip',
                severity: 'high',
                tags: ['malicious-ip', 'abuse'],
                source: feed.name,
                firstSeen: new Date(),
                lastSeen: new Date(),
                confidence: parseInt(parts[1], 10) || 80,
                context: { feedId: feed.id },
              });
            }
          }
        });
      }
    } catch (error) {
      console.error(`Error parsing feed data for ${feed.id}:`, error);
    }

    return indicators;
  }

  /**
   * Map severity based on data
   */
  private mapSeverity(
    data: any
  ): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    if (!data) return 'medium';
    if (typeof data === 'number' && data > 3) return 'critical';
    if (typeof data === 'number' && data > 2) return 'high';
    return 'medium';
  }

  /**
   * Check if an indicator matches threat intelligence
   */
  checkIndicator(value: string, type: 'ip' | 'domain' | 'hash' | 'email' | 'url'): ThreatIndicator | null {
    return this.indicators.get(value) || null;
  }

  /**
   * Analyze threat data and generate threat score
   */
  analyzeThreat(
    value: string,
    type: 'ip' | 'domain' | 'hash' | 'email' | 'url' = 'ip'
  ): ThreatScore {
    const matches: ThreatMatch[] = [];
    const foundIndicators: ThreatIndicator[] = [];
    const foundPatterns: ThreatPattern[] = [];
    const sources = new Set<string>();

    // Check against indicators
    const indicator = this.checkIndicator(value, type);
    if (indicator) {
      foundIndicators.push(indicator);
      sources.add(indicator.source);

      this.patterns.forEach((pattern) => {
        if (pattern.indicators.some((tag) => indicator.tags.includes(tag))) {
          foundPatterns.push(pattern);
          matches.push({
            indicator,
            pattern,
            confidence: indicator.confidence,
            severity: indicator.severity,
            matchedValue: value,
          });
        }
      });
    }

    // Check against patterns
    this.patterns.forEach((pattern) => {
      const regex = typeof pattern.pattern === 'string'
        ? new RegExp(pattern.pattern)
        : pattern.pattern;

      if (regex.test(value)) {
        if (!foundPatterns.includes(pattern)) {
          foundPatterns.push(pattern);
        }

        matches.push({
          indicator: {
            id: `pattern-${pattern.id}`,
            value,
            type,
            severity: pattern.severity,
            tags: pattern.indicators,
            source: 'Local Pattern',
            firstSeen: new Date(),
            lastSeen: new Date(),
            confidence: 75,
          },
          pattern,
          confidence: 75,
          severity: pattern.severity,
          matchedValue: value,
        });

        sources.add('Local Pattern');
      }
    });

    // Calculate overall score
    const scores = matches.map((m) => this.severityToScore(m.severity));
    const overallScore = scores.length > 0
      ? Math.max(...scores)
      : 0;

    const category =
      overallScore >= 80 ? 'critical'
        : overallScore >= 60 ? 'high'
          : overallScore >= 40 ? 'medium'
            : overallScore >= 20 ? 'low'
              : 'safe';

    return {
      overallScore: Math.min(overallScore, 100),
      category,
      matches,
      indicators: foundIndicators,
      patterns: foundPatterns,
      lastUpdated: new Date(),
      sources: Array.from(sources),
    };
  }

  /**
   * Convert severity to numeric score
   */
  private severityToScore(severity: 'critical' | 'high' | 'medium' | 'low' | 'info'): number {
    switch (severity) {
      case 'critical':
        return 100;
      case 'high':
        return 80;
      case 'medium':
        return 60;
      case 'low':
        return 30;
      case 'info':
        return 10;
      default:
        return 0;
    }
  }

  /**
   * Get threat statistics
   */
  getStatistics(): {
    totalIndicators: number;
    totalPatterns: number;
    totalFeeds: number;
    criticalThreats: number;
  } {
    let criticalCount = 0;
    this.indicators.forEach((indicator) => {
      if (indicator.severity === 'critical') {
        criticalCount++;
      }
    });

    return {
      totalIndicators: this.indicators.size,
      totalPatterns: this.patterns.size,
      totalFeeds: this.feeds.size,
      criticalThreats: criticalCount,
    };
  }

  /**
   * Stop all feed updates
   */
  shutdown(): void {
    this.updateIntervals.forEach((interval) => clearInterval(interval));
    this.updateIntervals.clear();
  }
}

// Export singleton instance
export const threatIntelligenceEngine = new ThreatIntelligenceEngine();

// Export types and class for testing
export { ThreatIntelligenceEngine };
