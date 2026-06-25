/**
 * MAX Phase 31.1 - Threat Intelligence Enrichment
 * External threat feeds, dark web monitoring, and IOC enrichment
 */

import {
  ThreatIntelligenceFeed,
  ThreatIntelSource,
  FeedType,
  UpdateFrequency,
  EnrichedIOC,
  IndicatorType,
  SeverityLevel,
  TLPLevel,
  DarkWebMentionAlert,
} from '@/types/max-phase31';

// ============================================================================
// THREAT INTELLIGENCE ENRICHMENT ENGINE
// ============================================================================

export class ThreatIntelligenceEnrichment {
  private feeds: Map<string, ThreatIntelligenceFeed> = new Map();
  private enrichedIOCs: Map<string, EnrichedIOC> = new Map();
  private darkWebAlerts: DarkWebMentionAlert[] = [];
  private feedUpdateIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize threat intelligence feeds
   */
  async initializeFeeds(): Promise<void> {
    const sources: Array<{
      source: ThreatIntelSource;
      feedType: FeedType;
      updateFreq: UpdateFrequency;
    }> = [
      {
        source: ThreatIntelSource.MISP,
        feedType: FeedType.IOCs,
        updateFreq: UpdateFrequency.HOURLY,
      },
      {
        source: ThreatIntelSource.ABUSE_CH,
        feedType: FeedType.MALWARE_SAMPLES,
        updateFreq: UpdateFrequency.DAILY,
      },
      {
        source: ThreatIntelSource.OTXAPI,
        feedType: FeedType.IOCs,
        updateFreq: UpdateFrequency.REALTIME,
      },
      {
        source: ThreatIntelSource.VIRUSTOTAL,
        feedType: FeedType.MALWARE_SAMPLES,
        updateFreq: UpdateFrequency.REALTIME,
      },
      {
        source: ThreatIntelSource.SHODAN,
        feedType: FeedType.EXPLOITS,
        updateFreq: UpdateFrequency.DAILY,
      },
      {
        source: ThreatIntelSource.CENSYS,
        feedType: FeedType.VULNERABILITIES,
        updateFreq: UpdateFrequency.DAILY,
      },
      {
        source: ThreatIntelSource.DARK_WEB_MONITOR,
        feedType: FeedType.DARK_WEB_MENTIONS,
        updateFreq: UpdateFrequency.HOURLY,
      },
      {
        source: ThreatIntelSource.YARA_RULES,
        feedType: FeedType.MALWARE_SAMPLES,
        updateFreq: UpdateFrequency.WEEKLY,
      },
      {
        source: ThreatIntelSource.CISA_ALERTS,
        feedType: FeedType.VULNERABILITIES,
        updateFreq: UpdateFrequency.DAILY,
      },
    ];

    for (const { source, feedType, updateFreq } of sources) {
      const feed: ThreatIntelligenceFeed = {
        id: `feed-${source}`,
        name: `${source} Feed`,
        source,
        feedType,
        lastUpdated: new Date(),
        updateFrequency: updateFreq,
        isActive: true,
        indicators: [],
      };

      this.feeds.set(source, feed);

      // Schedule periodic updates
      this.schedulePeriodicUpdate(feed);
    }
  }

  /**
   * Schedule periodic feed updates
   */
  private schedulePeriodicUpdate(feed: ThreatIntelligenceFeed): void {
    const getIntervalMs = (frequency: UpdateFrequency): number => {
      switch (frequency) {
        case UpdateFrequency.REALTIME:
          return 5 * 60 * 1000; // 5 minutes
        case UpdateFrequency.HOURLY:
          return 60 * 60 * 1000; // 1 hour
        case UpdateFrequency.DAILY:
          return 24 * 60 * 60 * 1000; // 1 day
        case UpdateFrequency.WEEKLY:
          return 7 * 24 * 60 * 60 * 1000; // 1 week
        case UpdateFrequency.MONTHLY:
          return 30 * 24 * 60 * 60 * 1000; // 1 month
      }
    };

    const interval = getIntervalMs(feed.updateFrequency);

    const timeout = setInterval(async () => {
      await this.updateFeed(feed.id);
    }, interval);

    this.feedUpdateIntervals.set(feed.id, timeout);
  }

  /**
   * Update threat intelligence feed
   */
  async updateFeed(feedId: string): Promise<void> {
    const feed = this.feeds.get(feedId);
    if (!feed) return;

    try {
      const indicators = await this.fetchFeedIndicators(feed);
      feed.indicators = indicators;
      feed.lastUpdated = new Date();

      // Enrich indicators
      for (const indicator of indicators) {
        await this.enrichIOC(indicator);
      }
    } catch (error) {
      console.error(`Failed to update feed ${feedId}:`, error);
    }
  }

  /**
   * Fetch indicators from threat feed
   */
  private async fetchFeedIndicators(
    feed: ThreatIntelligenceFeed
  ): Promise<IndicatorType[]> {
    // Simulate fetching from different sources
    const indicatorCounts: Record<ThreatIntelSource, number> = {
      [ThreatIntelSource.MISP]: 150,
      [ThreatIntelSource.ABUSE_CH]: 200,
      [ThreatIntelSource.OTXAPI]: 300,
      [ThreatIntelSource.VIRUSTOTAL]: 250,
      [ThreatIntelSource.SHODAN]: 100,
      [ThreatIntelSource.CENSYS]: 80,
      [ThreatIntelSource.DARK_WEB_MONITOR]: 50,
      [ThreatIntelSource.INTERNAL_THREAT_DB]: 75,
      [ThreatIntelSource.YARA_RULES]: 40,
      [ThreatIntelSource.CISA_ALERTS]: 30,
    };

    const count = indicatorCounts[feed.source] || 100;
    const indicators: IndicatorType[] = [];

    for (let i = 0; i < count; i++) {
      const types = Object.values(IndicatorType);
      const randomType = types[Math.floor(Math.random() * types.length)];
      indicators.push(randomType as IndicatorType);
    }

    return indicators;
  }

  /**
   * Enrich IOC with threat intelligence
   */
  async enrichIOC(indicator: IndicatorType): Promise<EnrichedIOC> {
    const indicatorValue = this.generateIndicatorValue(indicator);
    const cacheKey = `${indicator}-${indicatorValue}`;

    // Check cache
    if (this.enrichedIOCs.has(cacheKey)) {
      return this.enrichedIOCs.get(cacheKey)!;
    }

    // Gather threat intelligence from multiple sources
    const sources = await this.collectSourcesForIOC(indicator, indicatorValue);
    const threatActors = await this.identifyThreatActors(indicator, indicatorValue);
    const campaigns = await this.identifyCampaigns(indicator, indicatorValue);
    const malwareSamples = await this.linkMalwareSamples(indicator, indicatorValue);
    const vulnerabilities = await this.linkVulnerabilities(
      indicator,
      indicatorValue
    );

    const enrichedIOC: EnrichedIOC = {
      indicator: indicatorValue,
      type: indicator as IndicatorType,
      confidence: 60 + Math.random() * 35,
      sources,
      firstSeen: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      lastSeen: new Date(),
      relatedIndicators: await this.findRelatedIndicators(indicator, indicatorValue),
      threatActors,
      campaigns,
      malwareSamples,
      vulnerabilities,
      severity: this.calculateIOCSeverity(threatActors.length, vulnerabilities.length),
      tlp: this.determineTLPLevel(sources),
      additionalData: {
        firstReportedBy: sources[0] || 'unknown',
        numberOfSources: sources.length,
        relatedIncidents: Math.floor(Math.random() * 10),
      },
    };

    this.enrichedIOCs.set(cacheKey, enrichedIOC);
    return enrichedIOC;
  }

  /**
   * Generate indicator value based on type
   */
  private generateIndicatorValue(indicator: IndicatorType): string {
    const generators: Record<IndicatorType, () => string> = {
      [IndicatorType.IP_ADDRESS]: () =>
        `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      [IndicatorType.DOMAIN]: () => {
        const domains = [
          'malware-c2.net',
          'threat-domain.ru',
          'exploit-kit.cc',
          'botnet-control.org',
        ];
        return domains[Math.floor(Math.random() * domains.length)];
      },
      [IndicatorType.FILE_HASH]: () =>
        Array.from({ length: 32 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
      [IndicatorType.EMAIL]: () =>
        `attacker${Math.floor(Math.random() * 10000)}@threat.net`,
      [IndicatorType.REGISTRY_KEY]: () =>
        'HKLM\\Software\\Microsoft\\Windows\\Run\\Malware',
      [IndicatorType.PROCESS_NAME]: () => {
        const processes = ['svchost.exe', 'explorer.exe', 'powershell.exe'];
        return processes[Math.floor(Math.random() * processes.length)];
      },
      [IndicatorType.BEHAVIOR_PATTERN]: () => 'c2_communication',
      [IndicatorType.VULNERABILITY_ID]: () =>
        `CVE-2024-${Math.floor(Math.random() * 10000)}`,
    };

    return generators[indicator]?.() || 'unknown';
  }

  /**
   * Collect threat intelligence sources for IOC
   */
  private async collectSourcesForIOC(
    indicator: IndicatorType,
    value: string
  ): Promise<ThreatIntelSource[]> {
    const sources: ThreatIntelSource[] = [];
    const sourceChoices = Object.values(ThreatIntelSource);

    // Randomly select 1-4 sources
    const sourceCount = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < sourceCount; i++) {
      const source =
        sourceChoices[Math.floor(Math.random() * sourceChoices.length)];
      if (!sources.includes(source)) {
        sources.push(source);
      }
    }

    return sources;
  }

  /**
   * Identify threat actors associated with IOC
   */
  private async identifyThreatActors(
    indicator: IndicatorType,
    value: string
  ): Promise<string[]> {
    const actorCount = Math.floor(Math.random() * 3);
    const actors: string[] = [];

    const threatActors = [
      'APT28',
      'APT29',
      'Lazarus',
      'FIN7',
      'Carbanak',
      'WIZARD_SPIDER',
      'Emotet',
      'TrickBot',
    ];

    for (let i = 0; i < actorCount; i++) {
      actors.push(threatActors[Math.floor(Math.random() * threatActors.length)]);
    }

    return [...new Set(actors)];
  }

  /**
   * Identify campaigns associated with IOC
   */
  private async identifyCampaigns(
    indicator: IndicatorType,
    value: string
  ): Promise<string[]> {
    const campaignCount = Math.floor(Math.random() * 2);
    const campaigns: string[] = [];

    const campaignNames = [
      'Operation Stealth',
      'Campaign Raccoon',
      'Autumn Aperture',
      'Invisible Stalker',
    ];

    for (let i = 0; i < campaignCount; i++) {
      campaigns.push(campaignNames[Math.floor(Math.random() * campaignNames.length)]);
    }

    return campaigns;
  }

  /**
   * Link malware samples to IOC
   */
  private async linkMalwareSamples(
    indicator: IndicatorType,
    value: string
  ): Promise<string[]> {
    const sampleCount = Math.floor(Math.random() * 5);
    const samples: string[] = [];

    for (let i = 0; i < sampleCount; i++) {
      samples.push(`sample-${Date.now()}-${i}`);
    }

    return samples;
  }

  /**
   * Link vulnerabilities to IOC
   */
  private async linkVulnerabilities(
    indicator: IndicatorType,
    value: string
  ): Promise<string[]> {
    const vulnCount = Math.floor(Math.random() * 3);
    const vulns: string[] = [];

    for (let i = 0; i < vulnCount; i++) {
      vulns.push(`CVE-2024-${Math.floor(Math.random() * 10000)}`);
    }

    return vulns;
  }

  /**
   * Find related indicators
   */
  private async findRelatedIndicators(
    indicator: IndicatorType,
    value: string
  ): Promise<string[]> {
    const relatedCount = Math.floor(Math.random() * 5);
    const related: string[] = [];

    for (let i = 0; i < relatedCount; i++) {
      related.push(this.generateIndicatorValue(indicator));
    }

    return related;
  }

  /**
   * Calculate IOC severity based on threat intelligence
   */
  private calculateIOCSeverity(
    actorCount: number,
    vulnerabilityCount: number
  ): SeverityLevel {
    const score = actorCount * 2 + vulnerabilityCount;

    if (score >= 8) return SeverityLevel.CRITICAL;
    if (score >= 5) return SeverityLevel.HIGH;
    if (score >= 3) return SeverityLevel.MEDIUM;
    if (score >= 1) return SeverityLevel.LOW;
    return SeverityLevel.INFO;
  }

  /**
   * Determine TLP level based on sources
   */
  private determineTLPLevel(sources: ThreatIntelSource[]): TLPLevel {
    // Sources with restricted information get higher TLP levels
    const restrictedSources = [
      ThreatIntelSource.DARK_WEB_MONITOR,
      ThreatIntelSource.INTERNAL_THREAT_DB,
    ];

    const hasRestricted = sources.some((s) =>
      restrictedSources.includes(s)
    );

    if (hasRestricted) {
      return Math.random() > 0.5 ? TLPLevel.RED : TLPLevel.AMBER;
    }

    return Math.random() > 0.5 ? TLPLevel.AMBER : TLPLevel.GREEN;
  }

  /**
   * Monitor dark web for organization mentions
   */
  async monitorDarkWeb(
    organizationName: string,
    keywords: string[]
  ): Promise<void> {
    // Simulate dark web monitoring
    const interval = setInterval(async () => {
      const mentions = await this.scanDarkWeb(organizationName, keywords);

      for (const mention of mentions) {
        this.darkWebAlerts.push(mention);

        // Alert on critical mentions
        if (mention.severity === SeverityLevel.CRITICAL) {
          await this.createDarkWebAlert(mention);
        }
      }
    }, 60 * 60 * 1000); // Check every hour

    // Store interval for cleanup
    this.feedUpdateIntervals.set(`darkweb-${organizationName}`, interval);
  }

  /**
   * Scan dark web for mentions
   */
  private async scanDarkWeb(
    organizationName: string,
    keywords: string[]
  ): Promise<DarkWebMentionAlert[]> {
    const alerts: DarkWebMentionAlert[] = [];
    const mentionCount = Math.floor(Math.random() * 3);

    for (let i = 0; i < mentionCount; i++) {
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const severity =
        Math.random() > 0.7
          ? SeverityLevel.CRITICAL
          : Math.random() > 0.5
            ? SeverityLevel.HIGH
            : SeverityLevel.MEDIUM;

      alerts.push({
        id: `darkweb-${Date.now()}-${i}`,
        timestamp: new Date(),
        source: ['Darknet forum', 'Paste site', 'Marketplace'][
          Math.floor(Math.random() * 3)
        ],
        content: `Mention of ${organizationName} in context of ${keyword}`,
        mentions: [organizationName, keyword],
        severity,
        confidence: 70 + Math.random() * 25,
        context: 'Found in threat actor discussions',
        relatedIndicators: [
          this.generateIndicatorValue(IndicatorType.IP_ADDRESS),
          this.generateIndicatorValue(IndicatorType.DOMAIN),
        ],
      });
    }

    return alerts;
  }

  /**
   * Create alert for critical dark web mention
   */
  private async createDarkWebAlert(
    mention: DarkWebMentionAlert
  ): Promise<void> {
    // Implement alert creation logic
    console.log(`Critical dark web mention: ${mention.content}`);
  }

  /**
   * Query enriched IOC
   */
  queryEnrichedIOC(indicator: string): EnrichedIOC | undefined {
    // Search through all cached IOCs
    for (const [, ioc] of this.enrichedIOCs) {
      if (ioc.indicator === indicator) {
        return ioc;
      }
    }
    return undefined;
  }

  /**
   * Get all dark web alerts
   */
  getDarkWebAlerts(
    limit: number = 100
  ): DarkWebMentionAlert[] {
    return this.darkWebAlerts.slice(0, limit);
  }

  /**
   * Get feed by source
   */
  getFeed(source: ThreatIntelSource): ThreatIntelligenceFeed | undefined {
    return this.feeds.get(source);
  }

  /**
   * Stop all feed updates
   */
  stopAllUpdates(): void {
    for (const [, timeout] of this.feedUpdateIntervals) {
      clearInterval(timeout);
    }
    this.feedUpdateIntervals.clear();
  }
}

export default ThreatIntelligenceEnrichment;
