// Feed Scheduler - Automated feed update scheduling and management

import { query } from '@/lib/db';
import { feedManager } from './feed-manager';
import { ThreatFeed } from './types';

export class FeedScheduler {
  private updateJobs: Map<string, NodeJS.Timer> = new Map();
  private isRunning: boolean = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[FeedScheduler] Already running');
      return;
    }

    console.log('[FeedScheduler] Starting scheduler');
    this.isRunning = true;

    try {
      await feedManager.initialize();

      // Schedule initial updates
      const feeds = await this.getEnabledFeeds();

      for (const feed of feeds) {
        this.scheduleFeedUpdate(feed);
        // Perform initial update
        await feedManager.updateFeed(feed.id);
      }

      // Setup master scheduler to check for new/modified feeds every hour
      const masterTimer = setInterval(async () => {
        await this.refreshSchedules();
      }, 3600000); // 1 hour

      this.updateJobs.set('master-scheduler', masterTimer);
      console.log('[FeedScheduler] Master scheduler started');
    } catch (error) {
      console.error('[FeedScheduler] Start error:', error);
      this.isRunning = false;
    }
  }

  async stop(): Promise<void> {
    console.log('[FeedScheduler] Stopping scheduler');

    for (const timer of this.updateJobs.values()) {
      clearInterval(timer);
    }

    this.updateJobs.clear();
    this.isRunning = false;

    try {
      await feedManager.destroy();
    } catch (error) {
      console.error('[FeedScheduler] Cleanup error:', error);
    }
  }

  private scheduleFeedUpdate(feed: ThreatFeed): void {
    if (this.updateJobs.has(feed.id)) {
      clearInterval(this.updateJobs.get(feed.id)!);
    }

    // Use configured interval or default to 6 hours
    const interval = feed.updateInterval || 6 * 60 * 60 * 1000;

    const timer = setInterval(async () => {
      try {
        const result = await feedManager.updateFeed(feed.id);
        console.log(`[FeedScheduler] Feed updated: ${feed.name}`, {
          success: result.success,
          indicators: result.newIndicators,
          duration: result.duration,
        });

        // Notify about failures
        if (!result.success && result.error) {
          await this.notifyFeedFailure(feed.id, result.error);
        }
      } catch (error) {
        console.error(`[FeedScheduler] Update error for ${feed.name}:`, error);
        await this.notifyFeedFailure(feed.id, error instanceof Error ? error.message : 'Unknown error');
      }
    }, interval);

    this.updateJobs.set(feed.id, timer);
    console.log(`[FeedScheduler] Scheduled ${feed.name} (${interval}ms)`);
  }

  private async refreshSchedules(): Promise<void> {
    try {
      const feeds = await this.getEnabledFeeds();
      const scheduledIds = new Set(this.updateJobs.keys());

      // Remove disabled feeds
      for (const id of scheduledIds) {
        if (id !== 'master-scheduler' && !feeds.some((f) => f.id === id)) {
          const timer = this.updateJobs.get(id);
          if (timer) {
            clearInterval(timer);
            this.updateJobs.delete(id);
          }
        }
      }

      // Add or update feeds
      for (const feed of feeds) {
        if (!scheduledIds.has(feed.id)) {
          this.scheduleFeedUpdate(feed);
        }
      }

      console.log(`[FeedScheduler] Refresh complete: ${feeds.length} feeds scheduled`);
    } catch (error) {
      console.error('[FeedScheduler] Refresh error:', error);
    }
  }

  private async getEnabledFeeds(): Promise<ThreatFeed[]> {
    try {
      const result = await query(`
        SELECT id, name, type, url, enabled, update_interval, last_update
        FROM threat_feeds
        WHERE enabled = true
      `);

      return result.rows.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        name: String(row.name),
        type: String(row.type) as ThreatFeed['type'],
        url: String(row.url),
        enabled: Boolean(row.enabled),
        updateInterval: Number(row.update_interval) || 6 * 60 * 60 * 1000,
        lastUpdate: row.last_update ? new Date(String(row.last_update)) : undefined,
      }));
    } catch (error) {
      console.error('[FeedScheduler] Failed to fetch feeds:', error);
      return [];
    }
  }

  private async notifyFeedFailure(feedId: string, error: string): Promise<void> {
    try {
      // Could integrate with monitoring/alerting system
      console.error(`[FeedScheduler] Feed failure alert for ${feedId}: ${error}`);

      // Store failure log
      await query(
        `INSERT INTO feed_update_logs (feed_id, success, error, timestamp)
         VALUES ($1, false, $2, NOW())`,
        [feedId, error]
      );
    } catch (err) {
      console.error('[FeedScheduler] Failed to log failure:', err);
    }
  }

  getStatus(): {
    running: boolean;
    activeFeeds: number;
    timers: string[];
  } {
    return {
      running: this.isRunning,
      activeFeeds: this.updateJobs.size - 1, // Exclude master scheduler
      timers: Array.from(this.updateJobs.keys()),
    };
  }
}

export const feedScheduler = new FeedScheduler();
