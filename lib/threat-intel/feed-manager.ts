// Feed Manager - Central orchestration for threat intelligence feeds

import { query } from '@/lib/db';
import { IOC, ThreatFeed, FeedUpdateResult } from './types';
import { abuseCHFeed } from './feed-integrations/abuse-ch';
import { otxFeed } from './feed-integrations/otx';
import { virusTotalFeed } from './feed-integrations/virustotal';
import { phishTankFeed } from './feed-integrations/phishtank';
import { urlhausFeed } from './feed-integrations/urlhaus';
import { shodanFeed } from './feed-integrations/shodan';
import { cacheManager } from './cache-manager';

export class FeedManager {
  private feeds: Map<string, ThreatFeed> = new Map();
  private updateTimers: Map<string, NodeJS.Timer> = new Map();

  async initialize(): Promise<void> {
    try {
      const result = await query(
        `SELECT * FROM threat_feeds WHERE enabled = true`
      );

      for (const feed of result.rows) {
        this.feeds.set(feed.id, feed);
      }

      console.log(`[FeedManager] Initialized ${this.feeds.size} feeds`);
    } catch (error) {
      console.error('[FeedManager] Initialization error:', error);
    }
  }

  async registerFeed(feed: ThreatFeed): Promise<void> {
    this.feeds.set(feed.id, feed);

    try {
      await query(
        `INSERT INTO threat_feeds (id, name, type, url, enabled, update_interval, last_update)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET
         name = $2, enabled = $5, update_interval = $6`,
        [feed.id, feed.name, feed.type, feed.url, feed.enabled, feed.updateInterval]
      );

      console.log(`[FeedManager] Registered feed: ${feed.name}`);
    } catch (error) {
      console.error('[FeedManager] Failed to register feed:', error);
    }
  }

  async updateFeed(feedId: string): Promise<FeedUpdateResult> {
    const feed = this.feeds.get(feedId);
    if (!feed) {
      throw new Error(`Feed not found: ${feedId}`);
    }

    const startTime = Date.now();
    let iocs: IOC[] = [];
    let error: string | undefined;

    try {
      iocs = await this.fetchFeedIndicators(feed);
      await this.storeIndicators(iocs);

      await query(
        `UPDATE threat_feeds SET last_update = NOW(), status = 'success' WHERE id = $1`,
        [feedId]
      );
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[FeedManager] Update failed for ${feed.name}:`, err);

      await query(
        `UPDATE threat_feeds SET status = 'failed', error = $1 WHERE id = $2`,
        [error, feedId]
      );
    }

    const duration = Date.now() - startTime;

    return {
      feedId,
      feedName: feed.name,
      timestamp: new Date(),
      success: !error,
      newIndicators: iocs.length,
      updatedIndicators: 0, // Would need deduplication logic
      error,
      duration,
    };
  }

  async updateAllFeeds(): Promise<FeedUpdateResult[]> {
    const results: FeedUpdateResult[] = [];

    for (const feed of this.feeds.values()) {
      if (feed.enabled) {
        const result = await this.updateFeed(feed.id);
        results.push(result);
      }
    }

    return results;
  }

  private async fetchFeedIndicators(feed: ThreatFeed): Promise<IOC[]> {
    switch (feed.type) {
      case 'abuse-ch':
        return abuseCHFeed.fetchLatestIndicators();

      case 'otx':
        return otxFeed.fetchLatestPulses();

      case 'virustotal':
        // VT requires specific lookups, return empty for batch
        return [];

      case 'phishtank':
        return phishTankFeed.fetchRecent(100);

      case 'urlhaus':
        return urlhausFeed.fetchRecent(100);

      case 'shodan':
        // Shodan requires API key and specific queries
        return [];

      default:
        throw new Error(`Unknown feed type: ${feed.type}`);
    }
  }

  private async storeIndicators(iocs: IOC[]): Promise<void> {
    if (iocs.length === 0) return;

    const values: unknown[] = [];
    let paramCount = 1;
    const placeholders: string[] = [];

    for (const ioc of iocs) {
      placeholders.push(
        `($${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++})`
      );

      values.push(
        ioc.id,
        ioc.type,
        ioc.value,
        ioc.source,
        ioc.confidence,
        ioc.firstSeen,
        ioc.lastSeen,
        JSON.stringify(ioc.tags),
        JSON.stringify(ioc.context || {})
      );
    }

    await query(
      `INSERT INTO threat_indicators (id, type, value, source, confidence, first_seen, last_seen, tags, context)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (id) DO UPDATE SET
       last_seen = EXCLUDED.last_seen,
       confidence = GREATEST(confidence, EXCLUDED.confidence)`,
      values
    );
  }

  async searchIndicators(value: string, type?: string): Promise<IOC[]> {
    const cacheKey = `search:${type}:${value}`;
    const cached = cacheManager.get<IOC[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      let sql = `SELECT * FROM threat_indicators WHERE value = $1`;
      const params: unknown[] = [value];

      if (type) {
        sql += ` AND type = $2`;
        params.push(type);
      }

      const result = await query(sql + ` ORDER BY confidence DESC LIMIT 50`, params);

      const iocs = result.rows.map((row: Record<string, unknown>) => ({
        id: row.id,
        type: row.type,
        value: row.value,
        source: row.source,
        confidence: row.confidence,
        firstSeen: new Date(row.first_seen as string),
        lastSeen: new Date(row.last_seen as string),
        tags: JSON.parse(String(row.tags || '[]')),
        context: JSON.parse(String(row.context || '{}')),
      }));

      cacheManager.set(cacheKey, iocs, 1800000); // 30 minutes cache

      return iocs;
    } catch (error) {
      console.error('[FeedManager] Search error:', error);
      return [];
    }
  }

  async getIndicatorStats(): Promise<{
    totalIndicators: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    try {
      const result = await query(`
        SELECT
          COUNT(*) as total,
          type,
          source
        FROM threat_indicators
        GROUP BY type, source
      `);

      const stats = {
        totalIndicators: 0,
        byType: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
      };

      for (const row of result.rows) {
        stats.totalIndicators += parseInt(String(row.total));
        stats.byType[String(row.type)] = (stats.byType[String(row.type)] || 0) + parseInt(String(row.total));
        stats.bySource[String(row.source)] = (stats.bySource[String(row.source)] || 0) + parseInt(String(row.total));
      }

      return stats;
    } catch (error) {
      console.error('[FeedManager] Stats error:', error);
      return { totalIndicators: 0, byType: {}, bySource: {} };
    }
  }

  scheduleFeedUpdate(feedId: string, interval: number): void {
    if (this.updateTimers.has(feedId)) {
      clearInterval(this.updateTimers.get(feedId)!);
    }

    const timer = setInterval(async () => {
      const result = await this.updateFeed(feedId);
      console.log(`[FeedManager] Feed update completed:`, result);
    }, interval);

    this.updateTimers.set(feedId, timer);
  }

  async destroy(): Promise<void> {
    for (const timer of this.updateTimers.values()) {
      clearInterval(timer);
    }
    this.updateTimers.clear();
    cacheManager.destroy();
  }
}

export const feedManager = new FeedManager();
