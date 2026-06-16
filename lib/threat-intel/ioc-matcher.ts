// IOC Matcher - Pattern matching and indicator detection

import { IOC } from './types';
import { cacheManager } from './cache-manager';

export class IOCMatcher {
  private patterns: Map<string, RegExp> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // IP address patterns (IPv4 and IPv6)
    this.patterns.set('ipv4', /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
    this.patterns.set(
      'ipv6',
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/
    );

    // Domain patterns
    this.patterns.set('domain', /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/);

    // URL patterns
    this.patterns.set('url', /^https?:\/\//i);

    // Hash patterns (MD5, SHA1, SHA256)
    this.patterns.set('md5', /^[a-fA-F0-9]{32}$/);
    this.patterns.set('sha1', /^[a-fA-F0-9]{40}$/);
    this.patterns.set('sha256', /^[a-fA-F0-9]{64}$/);

    // Email pattern
    this.patterns.set('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);

    // C2 patterns (common C2 indicators)
    this.patterns.set('c2_domain', /^(c2|malware|bot|command|control)[a-z0-9.-]*\.[a-z]{2,}$/i);
    this.patterns.set('c2_port', /^(4444|5555|6666|7777|8888|9999|443|8080|8443)$/);
  }

  matchIndicators(text: string): IOC[] {
    const cacheKey = `match:${Buffer.from(text).toString('base64').substring(0, 32)}`;
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const matches: IOC[] = [];
    const processedValues = new Set<string>();

    // Extract potential indicators
    const potentialIOCs = this.extractPotentialIOCs(text);

    for (const { value, type } of potentialIOCs) {
      if (processedValues.has(value)) continue;
      processedValues.add(value);

      const ioc: IOC = {
        id: `extracted:${type}:${value}`,
        type: type as IOC['type'],
        value,
        source: 'pattern-match',
        confidence: this.calculateConfidence(value, type),
        firstSeen: new Date(),
        lastSeen: new Date(),
        tags: ['extracted', type],
      };

      matches.push(ioc);
    }

    cacheManager.set(cacheKey, matches, 600000); // 10 minutes cache

    return matches;
  }

  extractPotentialIOCs(text: string): Array<{ value: string; type: string }> {
    const indicators: Array<{ value: string; type: string }> = [];

    // Extract URLs
    const urlMatches = text.match(/https?:\/\/[^\s]+/gi) || [];
    for (const match of urlMatches) {
      indicators.push({ value: match, type: 'url' });
    }

    // Extract IPs (basic)
    const ipMatches = text.match(/(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g) || [];
    for (const match of ipMatches) {
      if (this.isValidIP(match)) {
        indicators.push({ value: match, type: 'ip' });
      }
    }

    // Extract domains
    const domainMatches = text.match(/([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/g) || [];
    for (const match of domainMatches) {
      if (this.isValidDomain(match)) {
        indicators.push({ value: match, type: 'domain' });
      }
    }

    // Extract hashes
    const hashMatches = text.match(/\b([a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})\b/g) || [];
    for (const match of hashMatches) {
      const type = match.length === 32 ? 'md5' : match.length === 40 ? 'sha1' : 'sha256';
      indicators.push({ value: match, type: 'hash' });
    }

    // Extract emails
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    for (const match of emailMatches) {
      indicators.push({ value: match, type: 'email' });
    }

    return indicators;
  }

  detectThreatPatterns(text: string): string[] {
    const threats: string[] = [];

    // C2 indicators
    if (/command.{0,5}control|c2|c&c/i.test(text)) {
      threats.push('potential-c2');
    }

    // Suspicious execution
    if (/powershell|cmd\.exe|rundll32|regsvcs|wmic|psexec/i.test(text)) {
      threats.push('suspicious-execution');
    }

    // Credential harvesting
    if (/password|credential|username|login|auth|session/i.test(text)) {
      threats.push('credential-harvesting');
    }

    // Data exfiltration
    if (/exfiltrate|data.{0,5}steal|upload.{0,5}server|send.{0,5}data/i.test(text)) {
      threats.push('data-exfiltration');
    }

    // Persistence mechanisms
    if (/registry|startup|scheduled.{0,5}task|service|wmi|hook|dll/i.test(text)) {
      threats.push('persistence');
    }

    // Lateral movement
    if (/psexec|wmic|invoke|remote|share|network/i.test(text)) {
      threats.push('lateral-movement');
    }

    return threats;
  }

  private calculateConfidence(value: string, type: string): number {
    let confidence = 70;

    // Higher confidence for well-formed indicators
    if (type === 'sha256' || type === 'sha1') {
      confidence = 95; // Hash values are very reliable
    } else if (type === 'email') {
      confidence = 85;
    } else if (type === 'url') {
      confidence = 80;
    } else if (type === 'ip') {
      confidence = 75;
    } else if (type === 'domain') {
      confidence = 70;
    }

    // Boost for specific patterns
    if (this.patterns.get('c2_domain')?.test(value)) {
      confidence += 15;
    }

    return Math.min(100, confidence);
  }

  private isValidIP(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;

    return parts.every((part) => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  }

  private isValidDomain(domain: string): boolean {
    // Exclude TLDs with less than 2 characters
    const parts = domain.split('.');
    if (parts.length < 2) return false;

    const tld = parts[parts.length - 1];
    return tld.length >= 2 && !/^[0-9]/.test(tld);
  }
}

export const iocMatcher = new IOCMatcher();
