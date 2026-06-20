/**
 * Feed Aggregator
 * Master aggregation service for threat intelligence feeds
 */

import { EventEmitter } from 'events';
import { ThreatFeed, IndicatorOfCompromise, FeedValidationResult, FeedDeduplicationResult } from '../types/feed-types';

interface AggregationMetrics {
  totalIOCs: number;
  deduplicatedIOCs: number;
  feedsProcessed: number;
  totalProcessingTime: number;
  averageQualityScore: number;
}

export class FeedAggregator extends EventEmitter {
  private feeds: Map<string, ThreatFeed> = new Map();
  private iocs: Map<string, IndicatorOfCompromise> = new Map();
  private metrics: AggregationMetrics = {
    totalIOCs: 0,
    deduplicatedIOCs: 0,
    feedsProcessed: 0,
    totalProcessingTime: 0,
    averageQualityScore: 0,
  };

  /**
   * Register a threat feed for aggregation
   */
  public registerFeed(feed: ThreatFeed): void {
    this.feeds.set(feed.id, feed);
    this.emit('feed:registered', feed);
  }

  /**
   * Unregister a threat feed
   */
  public unregisterFeed(feedId: string): void {
    this.feeds.delete(feedId);
    this.emit('feed:unregistered', feedId);
  }

  /**
   * Add IOCs from a feed
   */
  public addIOCs(feedId: string, iocs: IndicatorOfCompromise[]): void {
    const startTime = Date.now();
    let deduplicatedCount = 0;

    for (const ioc of iocs) {
      const key = `${ioc.iocType}:${ioc.iocValue}`;

      if (!this.iocs.has(key)) {
        this.iocs.set(key, ioc);
      } else {
        deduplicatedCount++;
        // Update existing IOC with newer information
        const existing = this.iocs.get(key)!;
        if (ioc.lastSeen > existing.lastSeen) {
          existing.lastSeen = ioc.lastSeen;
        }
        if (ioc.confidenceScore > existing.confidenceScore) {
          existing.confidenceScore = ioc.confidenceScore;
        }
        // Merge tags
        existing.tags = [...new Set([...existing.tags, ...ioc.tags])];
        // Track source attribution
        if (!existing.sourceAttribution.includes(feedId)) {
          existing.sourceAttribution += `,${feedId}`;
        }
      }
    }

    this.metrics.totalIOCs += iocs.length;
    this.metrics.deduplicatedIOCs += deduplicatedCount;
    this.metrics.totalProcessingTime += Date.now() - startTime;

    this.emit('iocs:added', {
      feedId,
      count: iocs.length,
      deduplicatedCount,
      totalIOCs: this.iocs.size,
    });
  }

  /**
   * Search IOCs by criteria
   */
  public searchIOCs(criteria: {
    iocValue?: string;
    iocType?: string;
    threatLevel?: string;
    tags?: string[];
    limit?: number;
  }): IndicatorOfCompromise[] {
    let results = Array.from(this.iocs.values());

    if (criteria.iocValue) {
      results = results.filter(ioc =>
        ioc.iocValue.toLowerCase().includes(criteria.iocValue!.toLowerCase())
      );
    }

    if (criteria.iocType) {
      results = results.filter(ioc => ioc.iocType === criteria.iocType);
    }

    if (criteria.threatLevel) {
      results = results.filter(ioc => ioc.threatLevel === criteria.threatLevel);
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(ioc =>
        criteria.tags!.some(tag => ioc.tags.includes(tag))
      );
    }

    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  /**
   * Get IOC by value
   */
  public getIOC(iocType: string, iocValue: string): IndicatorOfCompromise | undefined {
    const key = `${iocType}:${iocValue}`;
    return this.iocs.get(key);
  }

  /**
   * Get all feeds
   */
  public getFeeds(): ThreatFeed[] {
    return Array.from(this.feeds.values());
  }

  /**
   * Get active feeds
   */
  public getActiveFeeds(): ThreatFeed[] {
    return Array.from(this.feeds.values()).filter(feed => feed.isActive);
  }

  /**
   * Get aggregation metrics
   */
  public getMetrics(): AggregationMetrics {
    return {
      ...this.metrics,
      averageQualityScore: this.calculateAverageQualityScore(),
    };
  }

  /**
   * Rebuild aggregation (useful after feed updates)
   */
  public async rebuild(): Promise<AggregationMetrics> {
    const startTime = Date.now();
    this.iocs.clear();
    this.metrics = {
      totalIOCs: 0,
      deduplicatedIOCs: 0,
      feedsProcessed: 0,
      totalProcessingTime: 0,
      averageQualityScore: 0,
    };

    // Rebuild from feeds (would normally fetch from database)
    this.metrics.totalProcessingTime = Date.now() - startTime;
    this.metrics.feedsProcessed = this.feeds.size;

    this.emit('aggregation:rebuilt', {
      totalIOCs: this.iocs.size,
      processingTime: this.metrics.totalProcessingTime,
    });

    return this.getMetrics();
  }

  /**
   * Get statistics by IOC type
   */
  public getStatsByType(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const ioc of this.iocs.values()) {
      stats[ioc.iocType] = (stats[ioc.iocType] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get statistics by threat level
   */
  public getStatsByThreatLevel(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const ioc of this.iocs.values()) {
      stats[ioc.threatLevel] = (stats[ioc.threatLevel] || 0) + 1;
    }

    return stats;
  }

  /**
   * Deduplicate IOCs across feeds
   */
  public deduplicateIOCs(): FeedDeduplicationResult {
    const deduplicationMap = new Map<string, string[]>();
    const uniqueIOCs: IndicatorOfCompromise[] = [];

    const iocMap = new Map<string, IndicatorOfCompromise>();

    for (const ioc of this.iocs.values()) {
      const normalizedValue = this.normalizeIOCValue(ioc.iocValue, ioc.iocType);
      const key = `${ioc.iocType}:${normalizedValue}`;

      if (!iocMap.has(key)) {
        iocMap.set(key, ioc);
        uniqueIOCs.push(ioc);
      } else {
        // Track duplicate
        if (!deduplicationMap.has(key)) {
          deduplicationMap.set(key, [iocMap.get(key)!.id]);
        }
        deduplicationMap.get(key)!.push(ioc.id);
      }
    }

    return {
      uniqueIOCs,
      duplicateCount: this.iocs.size - uniqueIOCs.length,
      mergedIOCs: deduplicationMap,
    };
  }

  /**
   * Private helper to normalize IOC values
   */
  private normalizeIOCValue(value: string, type: string): string {
    switch (type) {
      case 'ip':
        // Normalize IP addresses
        return value.toLowerCase();
      case 'domain':
      case 'email':
        // Normalize to lowercase
        return value.toLowerCase();
      case 'url':
        // Normalize URL
        return value.toLowerCase().split('?')[0];
      case 'hash':
        // Normalize hash to uppercase
        return value.toUpperCase();
      default:
        return value.toLowerCase();
    }
  }

  /**
   * Private helper to calculate average quality score
   */
  private calculateAverageQualityScore(): number {
    if (this.feeds.size === 0) return 0;

    const total = Array.from(this.feeds.values()).reduce(
      (sum, feed) => sum + feed.qualityScore,
      0
    );

    return total / this.feeds.size;
  }

  /**
   * Export aggregated data for analysis
   */
  public export(): {
    feeds: ThreatFeed[];
    iocs: IndicatorOfCompromise[];
    metrics: AggregationMetrics;
  } {
    return {
      feeds: Array.from(this.feeds.values()),
      iocs: Array.from(this.iocs.values()),
      metrics: this.getMetrics(),
    };
  }
}

// Export singleton instance
export const feedAggregator = new FeedAggregator();
