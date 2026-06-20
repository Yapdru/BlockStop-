/**
 * Feed Scheduler
 * Manages scheduled updates of threat intelligence feeds
 */

import { EventEmitter } from 'events';
import { FeedSchedule } from '../types/feed-types';

interface ScheduledJob {
  feedId: string;
  cronExpression: string;
  lastRun?: Date;
  nextRun: Date;
  isActive: boolean;
  handler?: () => Promise<void>;
}

export class FeedScheduler extends EventEmitter {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  /**
   * Add a scheduled job
   */
  public addSchedule(
    feedId: string,
    cronExpression: string,
    handler: () => Promise<void>
  ): FeedSchedule {
    const nextRun = this.calculateNextRun(cronExpression);

    const job: ScheduledJob = {
      feedId,
      cronExpression,
      nextRun,
      isActive: true,
      handler,
    };

    this.jobs.set(feedId, job);
    this.emit('schedule:added', { feedId, cronExpression, nextRun });

    if (this.isRunning) {
      this.scheduleJob(feedId);
    }

    return {
      feedId,
      cronExpression,
      nextRun,
      isActive: true,
    };
  }

  /**
   * Remove a scheduled job
   */
  public removeSchedule(feedId: string): boolean {
    const job = this.jobs.get(feedId);
    if (!job) return false;

    this.clearJobTimer(feedId);
    this.jobs.delete(feedId);
    this.emit('schedule:removed', feedId);

    return true;
  }

  /**
   * Start the scheduler
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.emit('scheduler:started');

    // Schedule all active jobs
    for (const [feedId, job] of this.jobs) {
      if (job.isActive) {
        this.scheduleJob(feedId);
      }
    }
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.emit('scheduler:stopped');

    // Clear all timers
    for (const [feedId] of this.timers) {
      this.clearJobTimer(feedId);
    }
  }

  /**
   * Get all schedules
   */
  public getSchedules(): FeedSchedule[] {
    return Array.from(this.jobs.values()).map(job => ({
      feedId: job.feedId,
      cronExpression: job.cronExpression,
      nextRun: job.nextRun,
      lastRun: job.lastRun,
      isActive: job.isActive,
    }));
  }

  /**
   * Get schedule for a specific feed
   */
  public getSchedule(feedId: string): FeedSchedule | undefined {
    const job = this.jobs.get(feedId);
    if (!job) return undefined;

    return {
      feedId: job.feedId,
      cronExpression: job.cronExpression,
      nextRun: job.nextRun,
      lastRun: job.lastRun,
      isActive: job.isActive,
    };
  }

  /**
   * Trigger a job manually
   */
  public async triggerJob(feedId: string): Promise<boolean> {
    const job = this.jobs.get(feedId);
    if (!job || !job.handler) return false;

    try {
      this.emit('job:started', feedId);
      const startTime = Date.now();

      await job.handler();

      job.lastRun = new Date();
      job.nextRun = this.calculateNextRun(job.cronExpression);

      const duration = Date.now() - startTime;
      this.emit('job:completed', {
        feedId,
        duration,
        nextRun: job.nextRun,
      });

      // Reschedule the job
      if (this.isRunning && job.isActive) {
        this.scheduleJob(feedId);
      }

      return true;
    } catch (error) {
      this.emit('job:failed', {
        feedId,
        error: error instanceof Error ? error.message : String(error),
      });

      return false;
    }
  }

  /**
   * Get job statistics
   */
  public getStatistics(): {
    totalJobs: number;
    activeJobs: number;
    inactiveJobs: number;
    isRunning: boolean;
    nextScheduledRun?: Date;
  } {
    const jobs = Array.from(this.jobs.values());
    const activeJobs = jobs.filter(j => j.isActive);

    const nextRuns = activeJobs
      .map(j => j.nextRun)
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      inactiveJobs: jobs.length - activeJobs.length,
      isRunning: this.isRunning,
      nextScheduledRun: nextRuns[0],
    };
  }

  /**
   * Pause a schedule
   */
  public pauseSchedule(feedId: string): boolean {
    const job = this.jobs.get(feedId);
    if (!job) return false;

    job.isActive = false;
    this.clearJobTimer(feedId);
    this.emit('schedule:paused', feedId);

    return true;
  }

  /**
   * Resume a schedule
   */
  public resumeSchedule(feedId: string): boolean {
    const job = this.jobs.get(feedId);
    if (!job) return false;

    job.isActive = true;

    if (this.isRunning) {
      this.scheduleJob(feedId);
    }

    this.emit('schedule:resumed', feedId);

    return true;
  }

  /**
   * Update a schedule
   */
  public updateSchedule(feedId: string, cronExpression: string): boolean {
    const job = this.jobs.get(feedId);
    if (!job) return false;

    job.cronExpression = cronExpression;
    job.nextRun = this.calculateNextRun(cronExpression);

    this.clearJobTimer(feedId);

    if (this.isRunning && job.isActive) {
      this.scheduleJob(feedId);
    }

    this.emit('schedule:updated', { feedId, cronExpression, nextRun: job.nextRun });

    return true;
  }

  /**
   * Private helper methods
   */

  private scheduleJob(feedId: string): void {
    const job = this.jobs.get(feedId);
    if (!job || !job.isActive || !job.handler) return;

    const now = new Date();
    const delay = Math.max(0, job.nextRun.getTime() - now.getTime());

    const timer = setTimeout(() => {
      this.triggerJob(feedId);
    }, delay);

    this.timers.set(feedId, timer);
  }

  private clearJobTimer(feedId: string): void {
    const timer = this.timers.get(feedId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(feedId);
    }
  }

  private calculateNextRun(cronExpression: string): Date {
    const now = new Date();
    const next = new Date(now);

    // Parse cron expression (simplified)
    const [minute, hour, day, month, dayOfWeek] = cronExpression.split(' ');

    if (minute === '*' && hour === '*') {
      // Every minute
      next.setMinutes(next.getMinutes() + 1);
    } else if (minute === '0' && hour === '*') {
      // Every hour
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
    } else if (minute === '0' && hour === '0') {
      // Every day
      next.setDate(next.getDate() + 1);
      next.setHours(0);
      next.setMinutes(0);
    } else if (minute === '0' && hour !== '*') {
      // Specific hour
      const targetHour = parseInt(hour);
      next.setHours(targetHour);
      next.setMinutes(0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    } else {
      // Default: every hour
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
    }

    return next;
  }
}

// Export singleton instance
export const feedScheduler = new FeedScheduler();
