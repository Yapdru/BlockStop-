import { IOCAnalysis } from './types';
import { normalizeScore, calculateTimeDecay } from './utils';
import { IOC_TYPES, SEVERITY_THRESHOLDS } from './constants';

export class IOCAnalyzer {
  private iocs: Map<string, IOCAnalysis> = new Map();
  private iocIndex: Map<string, Set<string>> = new Map();

  registerIOC(ioc: IOCAnalysis): void {
    this.iocs.set(ioc.ioc, ioc);

    if (!this.iocIndex.has(ioc.type)) {
      this.iocIndex.set(ioc.type, new Set());
    }
    this.iocIndex.get(ioc.type)!.add(ioc.ioc);
  }

  analyzeIOC(value: string, type: string): IOCAnalysis {
    const existing = this.iocs.get(value);
    if (existing) return existing;

    const severity = this.calculateIOCSeverity(value, type);
    const confidence = this.calculateIOCConfidence(value, type);

    const analysis: IOCAnalysis = {
      ioc: value,
      type: type as any,
      severity: normalizeScore(severity, 0, 100),
      confidence: normalizeScore(confidence, 0, 1),
      sources: this.identifySources(value, type),
      relatedThreats: [],
      detectionMethods: this.determineDetectionMethods(type),
      lastSeen: new Date(),
      geolocation: this.geolocateIOC(value, type),
      infrastructure: this.analyzeInfrastructure(value, type),
    };

    this.registerIOC(analysis);
    return analysis;
  }

  private calculateIOCSeverity(value: string, type: string): number {
    let baseSeverity = 30;

    switch (type) {
      case IOC_TYPES.IP:
        baseSeverity = this.analyzeIPReputation(value);
        break;
      case IOC_TYPES.DOMAIN:
        baseSeverity = this.analyzeDomainReputation(value);
        break;
      case IOC_TYPES.HASH:
        baseSeverity = this.analyzeHashReputation(value);
        break;
      case IOC_TYPES.URL:
        baseSeverity = this.analyzeURLReputation(value);
        break;
      case IOC_TYPES.EMAIL:
        baseSeverity = this.analyzeEmailReputation(value);
        break;
    }

    return baseSeverity;
  }

  private analyzeIPReputation(ip: string): number {
    const parts = ip.split('.');
    if (parts.length !== 4) return 0;

    const firstOctet = parseInt(parts[0]);
    if (firstOctet === 127 || firstOctet === 10) return 10;
    if (firstOctet === 192 && parseInt(parts[1]) === 168) return 10;

    const isPrivate = (firstOctet === 10) || (firstOctet === 172 && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31);
    return isPrivate ? 15 : 50;
  }

  private analyzeDomainReputation(domain: string): number {
    const hasKnownC2 = domain.includes('bit.ly') || domain.includes('tinyurl') ? 80 : 0;
    const tldScore = domain.endsWith('.ru') || domain.endsWith('.cn') ? 40 : 20;

    return Math.max(hasKnownC2, tldScore);
  }

  private analyzeHashReputation(hash: string): number {
    const hashLength = hash.length;
    if (hashLength === 32) return 45;
    if (hashLength === 40) return 50;
    if (hashLength === 64) return 55;
    return 30;
  }

  private analyzeURLReputation(url: string): number {
    let severity = 30;

    if (url.includes('?') || url.includes('=')) severity += 20;
    if (url.includes('..') || url.includes('%')) severity += 25;
    if (url.includes('cmd') || url.includes('exec')) severity += 15;

    return normalizeScore(severity, 0, 100);
  }

  private analyzeEmailReputation(email: string): number {
    const domain = email.split('@')[1];
    if (!domain) return 20;

    const isCommonDomain = ['gmail.com', 'outlook.com', 'yahoo.com'].includes(domain);
    return isCommonDomain ? 15 : 40;
  }

  private calculateIOCConfidence(value: string, type: string): number {
    const formatValid = this.validateIOCFormat(value, type) ? 0.8 : 0.3;
    const sourceCount = 1;
    const sourceConfidence = Math.min(1, sourceCount / 5);

    return (formatValid * 0.6 + sourceConfidence * 0.4);
  }

  private validateIOCFormat(value: string, type: string): boolean {
    const patterns: Record<string, RegExp> = {
      [IOC_TYPES.IP]: /^(\d{1,3}\.){3}\d{1,3}$/,
      [IOC_TYPES.DOMAIN]: /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i,
      [IOC_TYPES.HASH]: /^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i,
      [IOC_TYPES.URL]: /^https?:\/\/.+/i,
      [IOC_TYPES.EMAIL]: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    };

    const pattern = patterns[type];
    return pattern ? pattern.test(value) : false;
  }

  private identifySources(value: string, type: string): string[] {
    const sources: string[] = [];

    if (type === IOC_TYPES.DOMAIN || type === IOC_TYPES.IP) {
      sources.push('passive-dns');
    }
    if (type === IOC_TYPES.HASH) {
      sources.push('malware-repository');
    }
    if (type === IOC_TYPES.URL) {
      sources.push('phishing-feed');
    }

    return sources;
  }

  private determineDetectionMethods(type: string): string[] {
    const methods: Record<string, string[]> = {
      [IOC_TYPES.IP]: ['firewall', 'ids', 'siem'],
      [IOC_TYPES.DOMAIN]: ['dns-filtering', 'proxy', 'siem'],
      [IOC_TYPES.HASH]: ['antivirus', 'endpoint', 'edr'],
      [IOC_TYPES.URL]: ['web-gateway', 'proxy', 'browser'],
      [IOC_TYPES.EMAIL]: ['email-gateway', 'spam-filter'],
    };

    return methods[type] || [];
  }

  private geolocateIOC(value: string, type: string): string | undefined {
    if (type !== IOC_TYPES.IP && type !== IOC_TYPES.DOMAIN) return undefined;

    const geoMap: Record<string, string> = {
      '192.': 'US',
      '10.': 'Private',
      '172.': 'Private',
    };

    for (const [prefix, country] of Object.entries(geoMap)) {
      if (value.startsWith(prefix)) return country;
    }

    return 'Unknown';
  }

  private analyzeInfrastructure(value: string, type: string): string | undefined {
    if (type === IOC_TYPES.IP) {
      return 'datacenter';
    }
    if (type === IOC_TYPES.DOMAIN) {
      return 'hosting-provider';
    }
    return undefined;
  }

  getIOCsByType(type: string): IOCAnalysis[] {
    const iocSet = this.iocIndex.get(type) || new Set();
    return Array.from(iocSet).map(ioc => this.iocs.get(ioc)!).filter(Boolean);
  }

  getHighSeverityIOCs(threshold: number = 70): IOCAnalysis[] {
    return Array.from(this.iocs.values())
      .filter(ioc => ioc.severity >= threshold)
      .sort((a, b) => b.severity - a.severity);
  }

  calculateIOCRiskScore(iocValue: string): number {
    const ioc = this.iocs.get(iocValue);
    if (!ioc) return 0;

    const ageInDays = (Date.now() - ioc.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
    const timeDecay = calculateTimeDecay(ageInDays, 30);

    const baseScore = (ioc.severity * 0.6 + ioc.confidence * 100 * 0.4);
    return baseScore * timeDecay;
  }

  findRelatedIOCs(iocValue: string, type: string): string[] {
    const ioc = this.iocs.get(iocValue);
    if (!ioc) return [];

    return ioc.relatedThreats.slice(0, 5);
  }

  enrichIOC(iocValue: string, threatId: string): void {
    const ioc = this.iocs.get(iocValue);
    if (ioc && !ioc.relatedThreats.includes(threatId)) {
      ioc.relatedThreats.push(threatId);
    }
  }

  generateIOCReport(iocValue: string): object {
    const ioc = this.iocs.get(iocValue);
    if (!ioc) return {};

    return {
      value: ioc.ioc,
      type: ioc.type,
      severity: ioc.severity,
      confidence: (ioc.confidence * 100).toFixed(1),
      lastSeen: ioc.lastSeen.toISOString(),
      sources: ioc.sources,
      detectionMethods: ioc.detectionMethods,
      relatedThreats: ioc.relatedThreats,
      geolocation: ioc.geolocation,
    };
  }
}
