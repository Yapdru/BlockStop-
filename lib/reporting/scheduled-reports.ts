/**
 * Scheduled Reports - Automated report scheduling and delivery
 * Supports daily, weekly, monthly reports with email delivery
 */

import { EventEmitter } from "events";

export interface ReportSchedule {
  scheduleId: string;
  reportName: string;
  reportType: "executive" | "technical" | "forensics" | "hunting" | "compliance";
  frequency: "daily" | "weekly" | "monthly" | "custom";
  cronExpression?: string; // For custom frequency
  nextRun: Date;
  lastRun?: Date;
  enabled: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface ReportDistribution {
  distributionId: string;
  scheduleId: string;
  recipients: string[]; // Email addresses
  ccRecipients?: string[];
  bccRecipients?: string[];
  includeAttachment: boolean;
  attachmentFormats: ("pdf" | "excel" | "csv" | "json")[];
  includeLink: boolean;
  dashboardUrl?: string;
  enabled: boolean;
}

export interface ReportHistory {
  historyId: string;
  scheduleId: string;
  reportId: string;
  generatedAt: Date;
  generatedBy: string;
  deliveryStatus: "pending" | "sent" | "failed";
  deliveryErrors?: string[];
  downloadCount: number;
  viewCount: number;
}

export class ScheduledReportsManager extends EventEmitter {
  private schedules: Map<string, ReportSchedule> = new Map();
  private distributions: Map<string, ReportDistribution> = new Map();
  private history: Map<string, ReportHistory> = new Map();
  private activeJobs: Map<string, NodeJS.Timer> = new Map();

  /**
   * Create a new report schedule
   */
  async createSchedule(
    reportName: string,
    reportType: ReportSchedule["reportType"],
    frequency: ReportSchedule["frequency"],
    createdBy: string,
    cronExpression?: string
  ): Promise<ReportSchedule> {
    const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const nextRun = this.calculateNextRun(frequency, cronExpression);

    const schedule: ReportSchedule = {
      scheduleId,
      reportName,
      reportType,
      frequency,
      cronExpression,
      nextRun,
      enabled: true,
      createdAt: new Date(),
      createdBy,
    };

    this.schedules.set(scheduleId, schedule);
    this.emit("schedule_created", schedule);

    return schedule;
  }

  /**
   * Update report schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<ReportSchedule>
  ): Promise<ReportSchedule> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    // Stop existing job if running
    if (this.activeJobs.has(scheduleId)) {
      clearInterval(this.activeJobs.get(scheduleId)!);
      this.activeJobs.delete(scheduleId);
    }

    const updated = { ...schedule, ...updates };
    this.schedules.set(scheduleId, updated);

    // Reschedule if enabled
    if (updated.enabled) {
      this.scheduleReportJob(updated);
    }

    this.emit("schedule_updated", updated);
    return updated;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<boolean> {
    if (this.activeJobs.has(scheduleId)) {
      clearInterval(this.activeJobs.get(scheduleId)!);
      this.activeJobs.delete(scheduleId);
    }

    const deleted = this.schedules.delete(scheduleId);
    if (deleted) {
      this.emit("schedule_deleted", { scheduleId });
    }

    return deleted;
  }

  /**
   * Get schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<ReportSchedule | null> {
    return this.schedules.get(scheduleId) || null;
  }

  /**
   * Get all schedules
   */
  async getAllSchedules(enabledOnly: boolean = false): Promise<ReportSchedule[]> {
    let schedules = Array.from(this.schedules.values());

    if (enabledOnly) {
      schedules = schedules.filter((s) => s.enabled);
    }

    return schedules.sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());
  }

  /**
   * Create distribution list for a schedule
   */
  async createDistribution(
    scheduleId: string,
    recipients: string[],
    options: {
      ccRecipients?: string[];
      bccRecipients?: string[];
      includeAttachment?: boolean;
      attachmentFormats?: ("pdf" | "excel" | "csv" | "json")[];
      includeLink?: boolean;
      dashboardUrl?: string;
    } = {}
  ): Promise<ReportDistribution> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const distributionId = `dist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const distribution: ReportDistribution = {
      distributionId,
      scheduleId,
      recipients,
      ccRecipients: options.ccRecipients || [],
      bccRecipients: options.bccRecipients || [],
      includeAttachment: options.includeAttachment ?? true,
      attachmentFormats: options.attachmentFormats || ["pdf"],
      includeLink: options.includeLink ?? true,
      dashboardUrl: options.dashboardUrl,
      enabled: true,
    };

    this.distributions.set(distributionId, distribution);
    this.emit("distribution_created", distribution);

    return distribution;
  }

  /**
   * Update distribution
   */
  async updateDistribution(
    distributionId: string,
    updates: Partial<ReportDistribution>
  ): Promise<ReportDistribution> {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) {
      throw new Error(`Distribution ${distributionId} not found`);
    }

    const updated = { ...distribution, ...updates };
    this.distributions.set(distributionId, updated);

    this.emit("distribution_updated", updated);
    return updated;
  }

  /**
   * Get distributions for a schedule
   */
  async getDistributions(scheduleId: string): Promise<ReportDistribution[]> {
    return Array.from(this.distributions.values()).filter(
      (d) => d.scheduleId === scheduleId
    );
  }

  /**
   * Record report generation in history
   */
  async recordHistory(
    scheduleId: string,
    reportId: string,
    generatedBy: string
  ): Promise<ReportHistory> {
    const historyId = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const history: ReportHistory = {
      historyId,
      scheduleId,
      reportId,
      generatedAt: new Date(),
      generatedBy,
      deliveryStatus: "pending",
      downloadCount: 0,
      viewCount: 0,
    };

    this.history.set(historyId, history);
    this.emit("report_generated", history);

    return history;
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    historyId: string,
    status: "sent" | "failed",
    errors?: string[]
  ): Promise<ReportHistory> {
    const history = this.history.get(historyId);
    if (!history) {
      throw new Error(`History ${historyId} not found`);
    }

    const updated = {
      ...history,
      deliveryStatus: status,
      deliveryErrors: errors || [],
    };

    this.history.set(historyId, updated);
    this.emit("delivery_status_updated", updated);

    return updated;
  }

  /**
   * Get report history for a schedule
   */
  async getHistory(
    scheduleId: string,
    limit: number = 50
  ): Promise<ReportHistory[]> {
    return Array.from(this.history.values())
      .filter((h) => h.scheduleId === scheduleId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get report usage metrics
   */
  async getUsageMetrics(reportId: string): Promise<{
    downloads: number;
    views: number;
    lastAccessed?: Date;
  }> {
    const histories = Array.from(this.history.values()).filter(
      (h) => h.reportId === reportId
    );

    if (histories.length === 0) {
      return { downloads: 0, views: 0 };
    }

    const downloads = histories.reduce((sum, h) => sum + h.downloadCount, 0);
    const views = histories.reduce((sum, h) => sum + h.viewCount, 0);

    return {
      downloads,
      views,
      lastAccessed: new Date(),
    };
  }

  /**
   * Start scheduled report job
   */
  private scheduleReportJob(schedule: ReportSchedule): void {
    if (this.activeJobs.has(schedule.scheduleId)) {
      return; // Already scheduled
    }

    const calculateDelay = (): number => {
      const now = new Date();
      const nextRun = schedule.nextRun;
      const delay = Math.max(nextRun.getTime() - now.getTime(), 0);
      return delay;
    };

    const scheduleNext = () => {
      const delay = calculateDelay();
      const timeout = setTimeout(async () => {
        try {
          // Trigger report generation
          this.emit("should_generate_report", {
            scheduleId: schedule.scheduleId,
            reportType: schedule.reportType,
          });

          // Update next run time
          const updated = {
            ...schedule,
            lastRun: new Date(),
            nextRun: this.calculateNextRun(schedule.frequency, schedule.cronExpression),
          };
          this.schedules.set(schedule.scheduleId, updated);

          // Reschedule
          scheduleNext();
        } catch (error) {
          this.emit("schedule_error", {
            scheduleId: schedule.scheduleId,
            error,
          });
        }
      }, delay);

      this.activeJobs.set(schedule.scheduleId, timeout as any);
    };

    scheduleNext();
  }

  /**
   * Calculate next run time based on frequency
   */
  private calculateNextRun(
    frequency: string,
    cronExpression?: string
  ): Date {
    const now = new Date();

    switch (frequency) {
      case "daily": {
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        return next;
      }

      case "weekly": {
        const next = new Date(now);
        next.setDate(next.getDate() + (7 - next.getDay()));
        next.setHours(0, 0, 0, 0);
        return next;
      }

      case "monthly": {
        const next = new Date(now);
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(0, 0, 0, 0);
        return next;
      }

      case "custom":
        if (cronExpression) {
          // Basic cron parsing - in production use a proper cron library
          return this.parseBasicCron(now, cronExpression);
        }
        // Fall back to daily if no cron provided
        return this.calculateNextRun("daily");

      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Parse basic cron expression (simplified)
   */
  private parseBasicCron(now: Date, cronExpression: string): Date {
    // This is a simplified parser. For production, use a library like 'cron-parser'
    // Format: minute hour day-of-month month day-of-week
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    const [minute, hour] = parts;
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Start all enabled schedules
   */
  async startAll(): Promise<void> {
    const enabledSchedules = await this.getAllSchedules(true);
    for (const schedule of enabledSchedules) {
      this.scheduleReportJob(schedule);
    }

    this.emit("all_schedules_started", { count: enabledSchedules.length });
  }

  /**
   * Stop all schedules
   */
  async stopAll(): Promise<void> {
    for (const [scheduleId, timeout] of this.activeJobs) {
      clearInterval(timeout);
    }
    this.activeJobs.clear();
    this.emit("all_schedules_stopped");
  }

  /**
   * Manually trigger report generation for a schedule
   */
  async triggerReportGeneration(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    this.emit("should_generate_report", {
      scheduleId,
      reportType: schedule.reportType,
      manual: true,
    });
  }
}

export default ScheduledReportsManager;
