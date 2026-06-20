/**
 * Feed Normalizer
 * Normalizes threat feeds to STIX 2.1 standard format
 */

import {
  IndicatorOfCompromise,
  IOCType,
  ThreatLevel,
  TLPLevel,
  FeedNormalizationResult,
} from '../types/feed-types';

export class FeedNormalizer {
  /**
   * Normalize raw feed data to IOCs
   */
  public async normalizeIOCs(
    feedId: string,
    rawData: any[],
    mappingRules?: Record<string, any>
  ): Promise<FeedNormalizationResult> {
    const startTime = Date.now();
    const normalizedIOCs: IndicatorOfCompromise[] = [];
    const iocMap = new Map<string, IndicatorOfCompromise>();

    for (const item of rawData) {
      try {
        const ioc = this.normalizeItem(feedId, item, mappingRules);
        if (ioc) {
          const key = `${ioc.iocType}:${ioc.iocValue}`;

          if (!iocMap.has(key)) {
            iocMap.set(key, ioc);
            normalizedIOCs.push(ioc);
          } else {
            // Merge with existing IOC
            const existing = iocMap.get(key)!;
            this.mergeIOCs(existing, ioc);
          }
        }
      } catch (error) {
        // Skip invalid items
        console.error(`Failed to normalize item:`, error);
      }
    }

    return {
      normalizedIOCs,
      duplicateCount: rawData.length - normalizedIOCs.length,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Normalize STIX 2.1 format
   */
  public normalizeSTIX(stixData: any, feedId: string): IndicatorOfCompromise | null {
    try {
      // Handle STIX indicator objects
      if (stixData.type === 'indicator') {
        return this.parseSTIXIndicator(stixData, feedId);
      }

      // Handle STIX malware/tool objects
      if (stixData.type === 'malware' || stixData.type === 'tool') {
        return this.parseSTIXMalware(stixData, feedId);
      }

      // Handle STIX campaign objects
      if (stixData.type === 'campaign') {
        return this.parseSTIXCampaign(stixData, feedId);
      }

      return null;
    } catch (error) {
      console.error('STIX normalization error:', error);
      return null;
    }
  }

  /**
   * Normalize CSV format
   */
  public normalizeCSV(
    csvRow: Record<string, string>,
    feedId: string,
    headerMapping: Record<string, string>
  ): IndicatorOfCompromise | null {
    try {
      const iocValue = csvRow[headerMapping['iocValue']]?.trim();
      const iocType = this.inferIOCType(csvRow[headerMapping['iocType']]?.trim() || iocValue);

      if (!iocValue || !iocType) {
        return null;
      }

      return {
        id: this.generateIOCId(),
        feedId,
        iocType: iocType as IOCType,
        iocValue,
        iocFamily: csvRow[headerMapping['family']]?.trim(),
        threatLevel: this.normalizeThreatLevel(csvRow[headerMapping['threatLevel']]?.trim()),
        confidenceScore: this.parseConfidence(csvRow[headerMapping['confidence']]?.trim()),
        tlpLevel: this.normalizeTLPLevel(csvRow[headerMapping['tlp']]?.trim()),
        sourceAttribution: feedId,
        firstSeen: this.parseDate(csvRow[headerMapping['firstSeen']]?.trim()),
        lastSeen: this.parseDate(csvRow[headerMapping['lastSeen']]?.trim() || new Date().toISOString()),
        description: csvRow[headerMapping['description']]?.trim(),
        tags: this.parseTags(csvRow[headerMapping['tags']]?.trim()),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('CSV normalization error:', error);
      return null;
    }
  }

  /**
   * Normalize JSON format
   */
  public normalizeJSON(jsonData: any, feedId: string): IndicatorOfCompromise | null {
    try {
      const iocValue = jsonData.value || jsonData.ioc || jsonData.indicator;
      const iocType = this.inferIOCType(jsonData.type || jsonData.ioc_type || iocValue);

      if (!iocValue || !iocType) {
        return null;
      }

      return {
        id: this.generateIOCId(),
        feedId,
        iocType: iocType as IOCType,
        iocValue,
        iocFamily: jsonData.family || jsonData.malware_family,
        threatLevel: this.normalizeThreatLevel(jsonData.threat_level || jsonData.severity),
        confidenceScore: this.parseConfidence(jsonData.confidence || jsonData.confidence_score),
        tlpLevel: this.normalizeTLPLevel(jsonData.tlp || jsonData.traffic_light_protocol),
        sourceAttribution: feedId,
        firstSeen: this.parseDate(jsonData.first_seen),
        lastSeen: this.parseDate(jsonData.last_seen || new Date().toISOString()),
        description: jsonData.description || jsonData.note,
        tags: this.parseTags(jsonData.tags || jsonData.labels),
        related: jsonData.related_iocs,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('JSON normalization error:', error);
      return null;
    }
  }

  /**
   * Normalize MISP format
   */
  public normalizeMISP(mispEvent: any, feedId: string): IndicatorOfCompromise[] {
    const iocs: IndicatorOfCompromise[] = [];

    try {
      if (!mispEvent.Attribute) {
        return iocs;
      }

      for (const attr of mispEvent.Attribute) {
        const iocType = this.inferIOCType(attr.type);

        if (!iocType) {
          continue;
        }

        iocs.push({
          id: this.generateIOCId(),
          feedId,
          iocType: iocType as IOCType,
          iocValue: attr.value,
          iocFamily: mispEvent.info,
          threatLevel: this.normalizeThreatLevel(attr.distribution),
          confidenceScore: this.calculateMISPConfidence(attr.to_ids),
          tlpLevel: this.normalizeTLPLevel(attr.distribution),
          sourceAttribution: feedId,
          firstSeen: this.parseDate(mispEvent.timestamp),
          lastSeen: this.parseDate(mispEvent.publish_timestamp || new Date().toISOString()),
          description: mispEvent.info,
          tags: mispEvent.Tag?.map((t: any) => t.name) || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('MISP normalization error:', error);
    }

    return iocs;
  }

  /**
   * Enrich IOCs with additional metadata
   */
  public enrichIOC(ioc: IndicatorOfCompromise, enrichmentData: Record<string, any>): IndicatorOfCompromise {
    return {
      ...ioc,
      description: enrichmentData.description || ioc.description,
      tags: [...new Set([...ioc.tags, ...(enrichmentData.tags || [])])],
      iocFamily: enrichmentData.family || ioc.iocFamily,
      confidenceScore: Math.max(ioc.confidenceScore, enrichmentData.confidence || 0),
      updatedAt: new Date(),
    };
  }

  /**
   * Private helper methods
   */

  private normalizeItem(feedId: string, item: any, mappingRules?: Record<string, any>): IndicatorOfCompromise | null {
    // Detect format and normalize accordingly
    if (item.type === 'indicator' || item.pattern) {
      return this.normalizeSTIX(item, feedId);
    }

    if (typeof item === 'string') {
      return this.normalizeString(item, feedId);
    }

    if (item.value || item.ioc) {
      return this.normalizeJSON(item, feedId);
    }

    return null;
  }

  private normalizeString(value: string, feedId: string): IndicatorOfCompromise | null {
    const iocType = this.inferIOCType(value);

    if (!iocType) {
      return null;
    }

    return {
      id: this.generateIOCId(),
      feedId,
      iocType: iocType as IOCType,
      iocValue: value,
      threatLevel: ThreatLevel.MEDIUM,
      confidenceScore: 0.7,
      tlpLevel: TLPLevel.AMBER,
      sourceAttribution: feedId,
      firstSeen: new Date(),
      lastSeen: new Date(),
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private parseSTIXIndicator(stixData: any, feedId: string): IndicatorOfCompromise | null {
    // Parse STIX pattern to extract IOC values
    const pattern = stixData.pattern;
    const iocType = this.extractSTIXIOCType(pattern);
    const iocValue = this.extractSTIXIOCValue(pattern);

    if (!iocType || !iocValue) {
      return null;
    }

    return {
      id: stixData.id || this.generateIOCId(),
      feedId,
      iocType: iocType as IOCType,
      iocValue,
      threatLevel: ThreatLevel.MEDIUM,
      confidenceScore: stixData.confidence || 0.7,
      tlpLevel: this.normalizeTLPLevel(stixData.marking_definitions?.[0]),
      sourceAttribution: feedId,
      firstSeen: this.parseDate(stixData.created),
      lastSeen: this.parseDate(stixData.modified || stixData.created),
      description: stixData.description,
      tags: stixData.labels || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private parseSTIXMalware(stixData: any, feedId: string): IndicatorOfCompromise | null {
    return {
      id: stixData.id || this.generateIOCId(),
      feedId,
      iocType: IOCType.FILE,
      iocValue: stixData.name,
      iocFamily: stixData.name,
      threatLevel: ThreatLevel.HIGH,
      confidenceScore: 0.9,
      tlpLevel: TLPLevel.AMBER,
      sourceAttribution: feedId,
      firstSeen: this.parseDate(stixData.created),
      lastSeen: this.parseDate(stixData.modified || stixData.created),
      description: stixData.description,
      tags: stixData.labels || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private parseSTIXCampaign(stixData: any, feedId: string): IndicatorOfCompromise | null {
    return {
      id: stixData.id || this.generateIOCId(),
      feedId,
      iocType: IOCType.FILE,
      iocValue: stixData.name,
      iocFamily: stixData.name,
      threatLevel: ThreatLevel.HIGH,
      confidenceScore: 0.85,
      tlpLevel: TLPLevel.AMBER,
      sourceAttribution: feedId,
      firstSeen: this.parseDate(stixData.created),
      lastSeen: this.parseDate(stixData.modified || stixData.created),
      description: stixData.description,
      tags: ['campaign', ...(stixData.labels || [])],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private mergeIOCs(existing: IndicatorOfCompromise, incoming: IndicatorOfCompromise): void {
    if (incoming.lastSeen > existing.lastSeen) {
      existing.lastSeen = incoming.lastSeen;
    }
    if (incoming.confidenceScore > existing.confidenceScore) {
      existing.confidenceScore = incoming.confidenceScore;
    }
    if (incoming.threatLevel) {
      existing.threatLevel = incoming.threatLevel;
    }

    // Merge tags
    existing.tags = [...new Set([...existing.tags, ...incoming.tags])];

    // Update source attribution
    if (!existing.sourceAttribution.includes(incoming.feedId)) {
      existing.sourceAttribution += `,${incoming.feedId}`;
    }

    existing.updatedAt = new Date();
  }

  private inferIOCType(value: string): IOCType | null {
    if (!value) return null;

    // Check for hash (MD5, SHA1, SHA256)
    if (/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(value)) {
      return IOCType.HASH;
    }

    // Check for IPv4/IPv6
    if (this.isValidIP(value)) {
      return IOCType.IP;
    }

    // Check for domain
    if (/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(value)) {
      return IOCType.DOMAIN;
    }

    // Check for URL
    if (/^https?:\/\//.test(value)) {
      return IOCType.URL;
    }

    // Check for email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return IOCType.EMAIL;
    }

    return IOCType.FILE;
  }

  private isValidIP(ip: string): boolean {
    // IPv4
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
    if (ipv4) {
      const parts = ip.split('.');
      return parts.every(part => parseInt(part) <= 255);
    }

    // IPv6
    const ipv6 = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i.test(ip);
    return ipv6;
  }

  private normalizeThreatLevel(level: string | undefined): ThreatLevel {
    if (!level) return ThreatLevel.MEDIUM;

    const normalized = level.toLowerCase();

    if (normalized.includes('critical')) return ThreatLevel.CRITICAL;
    if (normalized.includes('high')) return ThreatLevel.HIGH;
    if (normalized.includes('medium')) return ThreatLevel.MEDIUM;
    if (normalized.includes('low')) return ThreatLevel.LOW;

    return ThreatLevel.INFORMATIONAL;
  }

  private normalizeTLPLevel(level: string | undefined): TLPLevel {
    if (!level) return TLPLevel.AMBER;

    const normalized = level.toLowerCase();

    if (normalized.includes('white')) return TLPLevel.WHITE;
    if (normalized.includes('green')) return TLPLevel.GREEN;
    if (normalized.includes('red')) return TLPLevel.RED;

    return TLPLevel.AMBER;
  }

  private parseConfidence(value: string | undefined): number {
    if (!value) return 0.7;

    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0.7 : Math.min(Math.max(parsed, 0), 1);
  }

  private parseDate(value: string | number | undefined): Date {
    if (!value) return new Date();

    if (typeof value === 'number') {
      return new Date(value * 1000);
    }

    return new Date(value);
  }

  private parseTags(value: string | string[] | undefined): string[] {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value;
    }

    return value.split(',').map(tag => tag.trim());
  }

  private extractSTIXIOCType(pattern: string): IOCType | null {
    if (!pattern) return null;

    if (pattern.includes('file:hashes')) return IOCType.HASH;
    if (pattern.includes('ipv4-addr') || pattern.includes('ipv6-addr')) return IOCType.IP;
    if (pattern.includes('domain-name')) return IOCType.DOMAIN;
    if (pattern.includes('url')) return IOCType.URL;
    if (pattern.includes('email-addr')) return IOCType.EMAIL;

    return null;
  }

  private extractSTIXIOCValue(pattern: string): string | null {
    if (!pattern) return null;

    // Simple extraction - in production, use STIX pattern parser
    const match = pattern.match(/'([^']+)'/);
    return match ? match[1] : null;
  }

  private calculateMISPConfidence(toIds: boolean): number {
    return toIds ? 0.9 : 0.5;
  }

  private generateIOCId(): string {
    return `ioc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const feedNormalizer = new FeedNormalizer();
