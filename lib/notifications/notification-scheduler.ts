/**
 * Notification Scheduler
 * Manages scheduling of recurring notifications (daily tips, team updates, etc.)
 * Supports multiple scheduling strategies: once, daily, weekly, custom cron
 */

import { EventEmitter } from 'events';
import {
  NotificationSchedule,
  NotificationType,
  NotificationPayload,
  NotificationPriority,
} from './notification-types';

export interface ScheduleJob {
  id: string;
  nextRunTime: number;
  isRunning: boolean;
}

export class NotificationScheduler extends EventEmitter {
  private schedules: Map<string, NotificationSchedule> = new Map();
  private jobs: Map<string, ScheduleJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor(private persistenceCallback?: (schedules: NotificationSchedule[]) => Promise<void>) {
    super();
  }

  /**
   * Initialize scheduler with existing schedules
   */
  async initialize(schedules: NotificationSchedule[]): Promise<void> {
    try {
      schedules.forEach((schedule) => {
        this.schedules.set(schedule.id, schedule);
      });

      // Start jobs for enabled schedules
      for (const schedule of schedules) {
        if (schedule.enabled) {
          await this.startSchedule(schedule.id);
        }
      }

      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', { error, context: 'initialize' });
      throw error;
    }
  }

  /**
   * Create a new schedule
   */
  async createSchedule(schedule: NotificationSchedule): Promise<void> {
    try {
      if (this.schedules.has(schedule.id)) {
        throw new Error(`Schedule with ID ${schedule.id} already exists`);
      }

      this.schedules.set(schedule.id, schedule);

      if (schedule.enabled) {
        await this.startSchedule(schedule.id);
      }

      await this.persist();
      this.emit('schedule:created', { id: schedule.id });
    } catch (error) {
      this.emit('error', { error, context: 'createSchedule' });
      throw error;
    }
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(id: string, updates: Partial<NotificationSchedule>): Promise<void> {
    try {
      const schedule = this.schedules.get(id);
      if (!schedule) {
        throw new Error(`Schedule with ID ${id} not found`);
      }

      // Stop if it was running
      if (schedule.enabled) {
        await this.stopSchedule(id);
      }

      // Apply updates
      Object.assign(schedule, updates);

      // Restart if enabled
      if (schedule.enabled) {
        await this.startSchedule(id);
      }

      await this.persist();
      this.emit('schedule:updated', { id });
    } catch (error) {
      this.emit('error', { error, context: 'updateSchedule' });
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(id: string): Promise<void> {
    try {
      const schedule = this.schedules.get(id);
      if (!schedule) {
        throw new Error(`Schedule with ID ${id} not found`);
      }

      if (schedule.enabled) {
        await this.stopSchedule(id);
      }

      this.schedules.delete(id);
      this.jobs.delete(id);
      await this.persist();
      this.emit('schedule:deleted', { id });
    } catch (error) {
      this.emit('error', { error, context: 'deleteSchedule' });
      throw error;
    }
  }

  /**
   * Get a schedule by ID
   */
  getSchedule(id: string): NotificationSchedule | undefined {
    return this.schedules.get(id);
  }

  /**
   * Get all schedules of a specific type
   */
  getSchedulesByType(type: NotificationType): NotificationSchedule[] {
    return Array.from(this.schedules.values()).filter((s) => s.type === type);
  }

  /**
   * Get next scheduled notifications
   */
  getUpcomingSchedules(limit: number = 10): NotificationSchedule[] {
    return Array.from(this.schedules.values())
      .filter((s) => s.enabled)
      .sort((a, b) => (a.nextTriggerAt || 0) - (b.nextTriggerAt || 0))
      .slice(0, limit);
  }

  /**
   * Start a schedule
   */
  private async startSchedule(id: string): Promise<void> {
    try {
      const schedule = this.schedules.get(id);
      if (!schedule) return;

      // Clear existing timer
      const existingTimer = this.timers.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Calculate next run time
      const nextRunTime = this.calculateNextRunTime(schedule);
      const delay = Math.max(0, nextRunTime - Date.now());

      // Create job
      const job: ScheduleJob = {
        id,
        nextRunTime,
        isRunning: true,
      };

      this.jobs.set(id, job);

      // Schedule the timer
      const timer = setTimeout(async () => {
        await this.executeSchedule(id);
      }, delay);

      this.timers.set(id, timer);
      schedule.nextTriggerAt = nextRunTime;

      this.emit('schedule:started', {
        id,
        nextRunTime,
        delayMs: delay,
      });
    } catch (error) {
      this.emit('error', { error, context: 'startSchedule', scheduleId: id });
    }
  }

  /**
   * Stop a schedule
   */
  private async stopSchedule(id: string): Promise<void> {
    try {
      const timer = this.timers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(id);
      }

      const job = this.jobs.get(id);
      if (job) {
        job.isRunning = false;
      }

      const schedule = this.schedules.get(id);
      if (schedule) {
        schedule.enabled = false;
      }

      this.emit('schedule:stopped', { id });
    } catch (error) {
      this.emit('error', { error, context: 'stopSchedule', scheduleId: id });
    }
  }

  /**
   * Execute a scheduled notification
   */
  private async executeSchedule(id: string): Promise<void> {
    try {
      const schedule = this.schedules.get(id);
      if (!schedule || !schedule.enabled) return;

      const now = Date.now();
      schedule.lastTriggeredAt = now;

      // Emit event to trigger notification creation
      this.emit('schedule:triggered', {
        id,
        type: schedule.type,
        metadata: schedule.metadata,
        triggeredAt: now,
      });

      // Reschedule for next occurrence
      if (schedule.frequency !== 'once') {
        await this.startSchedule(id);
        await this.persist();
      } else {
        // One-time schedules are marked as disabled after execution
        await this.stopSchedule(id);
        schedule.enabled = false;
        await this.persist();
      }
    } catch (error) {
      this.emit('error', { error, context: 'executeSchedule', scheduleId: id });
    }
  }

  /**
   * Calculate next run time for a schedule
   */
  private calculateNextRunTime(schedule: NotificationSchedule): number {
    const now = new Date();

    switch (schedule.frequency) {
      case 'once':
        return schedule.nextTriggerAt || Date.now() + 60000; // 1 minute from now if not specified

      case 'daily': {
        const [hours, minutes] = (schedule.time || '09:00').split(':').map(Number);
        const nextRun = new Date();
        nextRun.setHours(hours, minutes, 0, 0);

        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }

        return nextRun.getTime();
      }

      case 'weekly': {
        const days = schedule.days || [0]; // Default to Sunday
        const [hours, minutes] = (schedule.time || '09:00').split(':').map(Number);

        let nextRun = new Date();
        nextRun.setHours(hours, minutes, 0, 0);

        // Find next occurrence of specified day
        let daysToAdd = 0;
        const currentDay = nextRun.getDay();
        const sortedDays = days.sort((a, b) => a - b);

        for (const day of sortedDays) {
          if (day > currentDay) {
            daysToAdd = day - currentDay;
            break;
          }
        }

        if (daysToAdd === 0) {
          daysToAdd = sortedDays[0] + 7 - currentDay;
        }

        nextRun.setDate(nextRun.getDate() + daysToAdd);

        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }

        return nextRun.getTime();
      }

      case 'custom':
        return this.parseCronExpression(schedule.customSchedule || '0 9 * * *', now);

      default:
        return Date.now() + 3600000; // 1 hour default
    }
  }

  /**
   * Parse cron expression and calculate next run time
   * Simplified cron parser supporting: minute hour day month weekday
   */
  private parseCronExpression(expression: string, baseTime: Date): number {
    try {
      const parts = expression.split(' ');
      if (parts.length < 5) {
        throw new Error('Invalid cron expression');
      }

      const [minute, hour, day, month, weekday] = parts.map((p) =>
        p === '*' ? null : parseInt(p, 10)
      );

      let nextRun = new Date(baseTime);

      // Simple implementation: increment from base time
      if (hour !== null && minute !== null) {
        nextRun.setHours(hour, minute, 0, 0);

        if (nextRun <= baseTime) {
          nextRun.setDate(nextRun.getDate() + 1);
        }

        return nextRun.getTime();
      }

      return baseTime.getTime() + 3600000;
    } catch (error) {
      this.emit('warn', {
        message: 'Failed to parse cron expression',
        expression,
        error,
      });
      return baseTime.getTime() + 3600000;
    }
  }

  /**
   * Persist schedules to storage
   */
  private async persist(): Promise<void> {
    try {
      if (this.persistenceCallback) {
        const schedules = Array.from(this.schedules.values());
        await this.persistenceCallback(schedules);
      }
    } catch (error) {
      this.emit('error', { error, context: 'persist' });
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isInitialized: boolean;
    totalSchedules: number;
    enabledSchedules: number;
    activeJobs: number;
    upcomingSchedules: Array<{
      id: string;
      type: NotificationType;
      nextRunTime: number;
    }>;
  } {
    const schedules = Array.from(this.schedules.values());
    const enabledSchedules = schedules.filter((s) => s.enabled).length;
    const upcomingSchedules = schedules
      .filter((s) => s.enabled && s.nextTriggerAt)
      .sort((a, b) => (a.nextTriggerAt || 0) - (b.nextTriggerAt || 0))
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        type: s.type,
        nextRunTime: s.nextTriggerAt || 0,
      }));

    return {
      isInitialized: this.isInitialized,
      totalSchedules: schedules.length,
      enabledSchedules,
      activeJobs: this.jobs.size,
      upcomingSchedules,
    };
  }

  /**
   * Destroy scheduler and clean up resources
   */
  destroy(): void {
    try {
      // Clear all timers
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }

      this.timers.clear();
      this.jobs.clear();
      this.schedules.clear();

      this.emit('destroyed');
    } catch (error) {
      this.emit('error', { error, context: 'destroy' });
    }
  }
}
