/**
 * Job Scheduler - Cron-based scheduling with timezone support
 * Manages scheduled workflows and jobs with history and notifications
 */

export interface CronExpression {
  minute: number | '*' | string;
  hour: number | '*' | string;
  dayOfMonth: number | '*' | string;
  month: number | '*' | string;
  dayOfWeek: number | '*' | string;
}

export interface ScheduledJob {
  id: string;
  name: string;
  description?: string;
  type: 'workflow' | 'script' | 'cleanup' | 'backup' | 'scan';
  cron: string; // cron expression
  timezone: string; // IANA timezone
  isActive: boolean;
  maxConcurrent: number;
  payload?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  nextRun?: Date;
  lastRun?: Date;
  lastRunStatus?: 'success' | 'failed' | 'skipped';
  notificationChannels?: string[]; // email, slack, teams
}

export interface JobExecution {
  id: string;
  jobId: string;
  jobName: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  output?: Record<string, any>;
  logs: string[];
}

export interface JobHistory {
  jobId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunDate: Date;
  averageDuration: number;
  failureRate: number;
  lastError?: string;
}

export interface FailedJobNotification {
  id: string;
  jobId: string;
  executionId: string;
  notificationChannels: string[];
  message: string;
  createdAt: Date;
  sent: boolean;
  sentAt?: Date;
  error?: string;
}

export class Scheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private executions: Map<string, JobExecution> = new Map();
  private history: Map<string, JobHistory> = new Map();
  private failedNotifications: Map<string, FailedJobNotification> = new Map();
  private timers: Map<string, NodeJS.Timer> = new Map();

  /**
   * Create a scheduled job
   */
  createJob(job: Omit<ScheduledJob, 'id' | 'createdAt' | 'updatedAt' | 'nextRun'>): ScheduledJob {
    const id = this.generateId();
    const now = new Date();

    const newJob: ScheduledJob = {
      ...job,
      id,
      createdAt: now,
      updatedAt: now,
      nextRun: this.calculateNextRun(job.cron, job.timezone),
    };

    this.jobs.set(id, newJob);

    // Initialize history
    this.history.set(id, {
      jobId: id,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRunDate: new Date(0),
      averageDuration: 0,
      failureRate: 0,
    });

    // Schedule the job
    this.scheduleJob(id);

    return newJob;
  }

  /**
   * Update a scheduled job
   */
  updateJob(jobId: string, updates: Partial<Omit<ScheduledJob, 'id' | 'createdAt' | 'createdBy'>>): ScheduledJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    // Clear existing timer
    const timer = this.timers.get(jobId);
    if (timer) clearTimeout(timer);

    const updated: ScheduledJob = {
      ...job,
      ...updates,
      updatedAt: new Date(),
      nextRun: updates.cron || updates.timezone
        ? this.calculateNextRun(updates.cron || job.cron, updates.timezone || job.timezone)
        : job.nextRun,
    };

    this.jobs.set(jobId, updated);

    // Reschedule if active
    if (updated.isActive) {
      this.scheduleJob(jobId);
    }

    return updated;
  }

  /**
   * Delete a scheduled job
   */
  deleteJob(jobId: string): boolean {
    const timer = this.timers.get(jobId);
    if (timer) clearTimeout(timer);

    this.jobs.delete(jobId);
    this.timers.delete(jobId);
    this.history.delete(jobId);

    return true;
  }

  /**
   * Get a scheduled job
   */
  getJob(jobId: string): ScheduledJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * List all scheduled jobs
   */
  listJobs(filters?: { active?: boolean; type?: string }): ScheduledJob[] {
    let jobs = Array.from(this.jobs.values());

    if (filters?.active !== undefined) {
      jobs = jobs.filter((j) => j.isActive === filters.active);
    }

    if (filters?.type) {
      jobs = jobs.filter((j) => j.type === filters.type);
    }

    return jobs;
  }

  /**
   * Schedule a job execution
   */
  private scheduleJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job || !job.isActive) return;

    const now = new Date();
    const nextRun = job.nextRun || this.calculateNextRun(job.cron, job.timezone);

    if (nextRun) {
      const delay = nextRun.getTime() - now.getTime();

      if (delay > 0) {
        const timer = setTimeout(() => {
          this.executeJob(jobId);
          this.scheduleJob(jobId); // Reschedule
        }, delay);

        this.timers.set(jobId, timer);
      }
    }
  }

  /**
   * Execute a scheduled job
   */
  async executeJob(jobId: string): Promise<JobExecution | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const executionId = this.generateId();
    const execution: JobExecution = {
      id: executionId,
      jobId,
      jobName: job.name,
      status: 'running',
      startedAt: new Date(),
      logs: [],
    };

    this.executions.set(executionId, execution);

    try {
      const startTime = Date.now();

      // Execute based on type
      switch (job.type) {
        case 'workflow':
          execution.output = await this.executeWorkflow(job);
          break;
        case 'script':
          execution.output = await this.executeScript(job);
          break;
        case 'cleanup':
          execution.output = await this.executeCleanup(job);
          break;
        case 'backup':
          execution.output = await this.executeBackup(job);
          break;
        case 'scan':
          execution.output = await this.executeScan(job);
          break;
      }

      execution.status = 'success';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - startTime;

      // Update job
      job.lastRun = new Date();
      job.lastRunStatus = 'success';
      job.nextRun = this.calculateNextRun(job.cron, job.timezone);
      this.jobs.set(jobId, job);

      // Update history
      this.updateJobHistory(jobId, true, execution.duration);
    } catch (error: any) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

      // Update job
      job.lastRun = new Date();
      job.lastRunStatus = 'failed';
      job.nextRun = this.calculateNextRun(job.cron, job.timezone);
      this.jobs.set(jobId, job);

      // Update history
      this.updateJobHistory(jobId, false, execution.duration);

      // Create failed notification
      if (job.notificationChannels && job.notificationChannels.length > 0) {
        this.createFailedJobNotification(jobId, executionId, job, error);
      }
    }

    return execution;
  }

  /**
   * Execute workflow job
   */
  private async executeWorkflow(job: ScheduledJob): Promise<Record<string, any>> {
    // In production, integrate with workflow engine
    console.log('Executing workflow job:', job.name);
    return { workflowExecuted: true };
  }

  /**
   * Execute script job
   */
  private async executeScript(job: ScheduledJob): Promise<Record<string, any>> {
    // In production, execute actual script
    console.log('Executing script job:', job.name);
    return { scriptExecuted: true };
  }

  /**
   * Execute cleanup job
   */
  private async executeCleanup(job: ScheduledJob): Promise<Record<string, any>> {
    // In production, clean up old data
    console.log('Executing cleanup job:', job.name);
    return {
      cleanupExecuted: true,
      itemsDeleted: Math.floor(Math.random() * 1000),
    };
  }

  /**
   * Execute backup job
   */
  private async executeBackup(job: ScheduledJob): Promise<Record<string, any>> {
    // In production, perform backup
    console.log('Executing backup job:', job.name);
    return {
      backupExecuted: true,
      backupSize: '2.5GB',
      backupId: this.generateId(),
    };
  }

  /**
   * Execute scan job
   */
  private async executeScan(job: ScheduledJob): Promise<Record<string, any>> {
    // In production, perform scan
    console.log('Executing scan job:', job.name);
    return {
      scanExecuted: true,
      itemsScanned: Math.floor(Math.random() * 10000),
      threatsFound: Math.floor(Math.random() * 50),
    };
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(cron: string, timezone: string): Date {
    // Parse cron expression and calculate next run
    // In production, use cron parsing library like cron-parser
    const now = new Date();
    const nextRun = new Date(now.getTime() + 3600000); // 1 hour from now
    return nextRun;
  }

  /**
   * Update job history
   */
  private updateJobHistory(jobId: string, success: boolean, duration: number): void {
    const history = this.history.get(jobId);
    if (!history) return;

    history.totalRuns++;
    if (success) {
      history.successfulRuns++;
    } else {
      history.failedRuns++;
    }

    history.lastRunDate = new Date();
    history.averageDuration =
      (history.averageDuration * (history.totalRuns - 1) + duration) / history.totalRuns;
    history.failureRate = history.failedRuns / history.totalRuns;
  }

  /**
   * Create failed job notification
   */
  private createFailedJobNotification(
    jobId: string,
    executionId: string,
    job: ScheduledJob,
    error: Error
  ): void {
    const notificationId = this.generateId();

    const notification: FailedJobNotification = {
      id: notificationId,
      jobId,
      executionId,
      notificationChannels: job.notificationChannels || [],
      message: `Job "${job.name}" failed: ${error.message}`,
      createdAt: new Date(),
      sent: false,
    };

    this.failedNotifications.set(notificationId, notification);

    // Send notifications
    this.sendFailedJobNotification(notification);
  }

  /**
   * Send failed job notification
   */
  private async sendFailedJobNotification(notification: FailedJobNotification): Promise<void> {
    for (const channel of notification.notificationChannels) {
      try {
        switch (channel) {
          case 'email':
            // Send email notification
            console.log('Sending email notification:', notification.message);
            break;
          case 'slack':
            // Send Slack notification
            console.log('Sending Slack notification:', notification.message);
            break;
          case 'teams':
            // Send Teams notification
            console.log('Sending Teams notification:', notification.message);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        notification.error = String(error);
      }
    }

    notification.sent = true;
    notification.sentAt = new Date();
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): JobExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * List executions for a job
   */
  listExecutions(jobId: string, limit: number = 50): JobExecution[] {
    return Array.from(this.executions.values())
      .filter((e) => e.jobId === jobId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get job history
   */
  getHistory(jobId: string): JobHistory | null {
    return this.history.get(jobId) || null;
  }

  /**
   * Retry failed job
   */
  async retryJob(executionId: string): Promise<JobExecution | null> {
    const execution = this.executions.get(executionId);
    if (!execution) return null;

    return this.executeJob(execution.jobId);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup - stop all timers
   */
  destroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}

export default Scheduler;
