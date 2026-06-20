/**
 * Feed Manager
 * Manages threat feed lifecycle (CRUD operations)
 */

import { ThreatFeed, FeedSchedule, FeedHealth } from '../types/feed-types';

export class FeedManager {
  private feeds: Map<string, ThreatFeed> = new Map();
  private feedSchedules: Map<string, FeedSchedule> = new Map();
  private feedHealthMetrics: Map<string, FeedHealth> = new Map();

  /**
   * Create a new threat feed
   */
  public async createFeed(feedData: Omit<ThreatFeed, 'id' | 'createdAt' | 'updatedAt'>): Promise<ThreatFeed> {
    const id = this.generateId();
    const now = new Date();

    const feed: ThreatFeed = {
      ...feedData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.feeds.set(id, feed);

    // Initialize health metrics
    this.feedHealthMetrics.set(id, {
      feedId: id,
      lastSuccessfulUpdate: now,
      consecutiveFailures: 0,
      uptime: 100,
      averageLatency: 0,
      status: 'healthy',
    });

    return feed;
  }

  /**
   * Get a feed by ID
   */
  public getFeedById(feedId: string): ThreatFeed | undefined {
    return this.feeds.get(feedId);
  }

  /**
   * Get all feeds
   */
  public getAllFeeds(): ThreatFeed[] {
    return Array.from(this.feeds.values());
  }

  /**
   * Get active feeds
   */
  public getActiveFeeds(): ThreatFeed[] {
    return Array.from(this.feeds.values()).filter(feed => feed.isActive);
  }

  /**
   * Update a feed
   */
  public async updateFeed(feedId: string, updates: Partial<ThreatFeed>): Promise<ThreatFeed | null> {
    const feed = this.feeds.get(feedId);
    if (!feed) return null;

    const updated: ThreatFeed = {
      ...feed,
      ...updates,
      id: feed.id,
      createdAt: feed.createdAt,
      updatedAt: new Date(),
    };

    this.feeds.set(feedId, updated);
    return updated;
  }

  /**
   * Delete a feed
   */
  public async deleteFeed(feedId: string): Promise<boolean> {
    const deleted = this.feeds.delete(feedId);
    this.feedSchedules.delete(feedId);
    this.feedHealthMetrics.delete(feedId);
    return deleted;
  }

  /**
   * Enable a feed
   */
  public async enableFeed(feedId: string): Promise<boolean> {
    const feed = this.feeds.get(feedId);
    if (!feed) return false;

    feed.isActive = true;
    feed.updatedAt = new Date();
    return true;
  }

  /**
   * Disable a feed
   */
  public async disableFeed(feedId: string): Promise<boolean> {
    const feed = this.feeds.get(feedId);
    if (!feed) return false;

    feed.isActive = false;
    feed.updatedAt = new Date();
    return true;
  }

  /**
   * Schedule a feed for updates
   */
  public async scheduleFeed(feedId: string, cronExpression: string): Promise<FeedSchedule | null> {
    const feed = this.feeds.get(feedId);
    if (!feed) return null;

    const schedule: FeedSchedule = {
      feedId,
      cronExpression,
      nextRun: this.calculateNextRun(cronExpression),
      isActive: true,
    };

    this.feedSchedules.set(feedId, schedule);
    return schedule;
  }

  /**
   * Get feed schedule
   */
  public getFeedSchedule(feedId: string): FeedSchedule | undefined {
    return this.feedSchedules.get(feedId);
  }

  /**
   * Update feed health metrics
   */
  public updateFeedHealth(feedId: string, metrics: Partial<FeedHealth>): void {
    const health = this.feedHealthMetrics.get(feedId) || {
      feedId,
      lastSuccessfulUpdate: new Date(),
      consecutiveFailures: 0,
      uptime: 100,
      averageLatency: 0,
      status: 'healthy' as const,
    };

    const updated: FeedHealth = {
      ...health,
      ...metrics,
      feedId,
    };

    // Determine status based on consecutive failures
    if (updated.consecutiveFailures > 3) {
      updated.status = 'failed';
    } else if (updated.consecutiveFailures > 1) {
      updated.status = 'degraded';
    } else {
      updated.status = 'healthy';
    }

    this.feedHealthMetrics.set(feedId, updated);
  }

  /**
   * Get feed health metrics
   */
  public getFeedHealth(feedId: string): FeedHealth | undefined {
    return this.feedHealthMetrics.get(feedId);
  }

  /**
   * Get all feed health metrics
   */
  public getAllFeedHealth(): FeedHealth[] {
    return Array.from(this.feedHealthMetrics.values());
  }

  /**
   * Get feeds by health status
   */
  public getFeedsByStatus(status: 'healthy' | 'degraded' | 'failed'): ThreatFeed[] {
    const feedIds = Array.from(this.feedHealthMetrics.entries())
      .filter(([_, health]) => health.status === status)
      .map(([feedId]) => feedId);

    return feedIds
      .map(feedId => this.feeds.get(feedId))
      .filter((feed): feed is ThreatFeed => !!feed);
  }

  /**
   * Get feeds by provider
   */
  public getFeedsByProvider(provider: string): ThreatFeed[] {
    return Array.from(this.feeds.values()).filter(feed => feed.provider === provider);
  }

  /**
   * Get feeds by type
   */
  public getFeedsByType(feedType: string): ThreatFeed[] {
    return Array.from(this.feeds.values()).filter(feed => feed.feedType === feedType);
  }

  /**
   * Record feed update success
   */
  public recordFeedUpdateSuccess(feedId: string, iocCount: number, latency: number): void {
    const feed = this.feeds.get(feedId);
    if (!feed) return;

    feed.lastUpdate = new Date();
    feed.iocCount = iocCount;
    feed.updatedAt = new Date();

    this.updateFeedHealth(feedId, {
      lastSuccessfulUpdate: new Date(),
      consecutiveFailures: 0,
      averageLatency: latency,
    });
  }

  /**
   * Record feed update failure
   */
  public recordFeedUpdateFailure(feedId: string): void {
    const health = this.feedHealthMetrics.get(feedId);
    if (!health) return;

    this.updateFeedHealth(feedId, {
      lastFailedUpdate: new Date(),
      consecutiveFailures: (health.consecutiveFailures || 0) + 1,
    });
  }

  /**
   * Get feed statistics
   */
  public getFeedStatistics(): {
    totalFeeds: number;
    activeFeeds: number;
    inactiveFeeds: number;
    totalIOCs: number;
    averageQualityScore: number;
    feedsByStatus: Record<string, number>;
  } {
    const feeds = Array.from(this.feeds.values());
    const health = Array.from(this.feedHealthMetrics.values());

    const statusCounts = {
      healthy: 0,
      degraded: 0,
      failed: 0,
    };

    health.forEach(h => {
      statusCounts[h.status]++;
    });

    return {
      totalFeeds: feeds.length,
      activeFeeds: feeds.filter(f => f.isActive).length,
      inactiveFeeds: feeds.filter(f => !f.isActive).length,
      totalIOCs: feeds.reduce((sum, f) => sum + f.iocCount, 0),
      averageQualityScore: feeds.length > 0 ? feeds.reduce((sum, f) => sum + f.qualityScore, 0) / feeds.length : 0,
      feedsByStatus: statusCounts,
    };
  }

  /**
   * Private helpers
   */
  private generateId(): string {
    return `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simple calculation - in production, use a cron parser library
    const now = new Date();
    const next = new Date(now);

    // Parse common patterns
    if (cronExpression === '* * * * *') {
      // Every minute
      next.setMinutes(next.getMinutes() + 1);
    } else if (cronExpression === '0 * * * *') {
      // Every hour
      next.setHours(next.getHours() + 1);
    } else if (cronExpression === '0 0 * * *') {
      // Daily
      next.setDate(next.getDate() + 1);
    }

    return next;
  }
}

// Export singleton instance
export const feedManager = new FeedManager();
