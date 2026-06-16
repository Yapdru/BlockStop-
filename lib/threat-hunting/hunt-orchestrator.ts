/**
 * Hunt Orchestrator - Manages threat hunting campaigns
 */

export interface HuntConfiguration {
  huntId: string;
  name: string;
  description: string;
  huntType: "ioc" | "behavior" | "anomaly" | "timeline" | "custom";
  targetScope: {
    entityIds?: string[];
    departments?: string[];
    allEntities: boolean;
  };
  timeRange: {
    start: Date;
    end: Date;
  };
  status: "created" | "running" | "completed" | "failed";
  createdAt: Date;
  createdBy: string;
  estimatedDuration: number; // minutes
}

export interface HuntResult {
  huntId: string;
  findings: Array<{
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    entityId: string;
    evidence: string[];
    timestamp: Date;
  }>;
  statistics: {
    totalMatches: number;
    criticalFindings: number;
    highFindings: number;
    affectedEntities: number;
  };
  executionTime: number; // milliseconds
  completedAt: Date;
}

export interface HuntSchedule {
  scheduleId: string;
  huntId: string;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  nextRun: Date;
  lastRun?: Date;
  enabled: boolean;
  cronExpression?: string;
}

export class HuntOrchestrator {
  private hunts: Map<string, HuntConfiguration> = new Map();
  private results: Map<string, HuntResult> = new Map();
  private schedules: Map<string, HuntSchedule> = new Map();
  private activeHunts: Set<string> = new Set();

  /**
   * Create a new hunt
   */
  async createHunt(config: Omit<HuntConfiguration, "huntId" | "createdAt" | "status">): Promise<HuntConfiguration> {
    const huntId = `hunt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const hunt: HuntConfiguration = {
      ...config,
      huntId,
      status: "created",
      createdAt: new Date(),
    };

    this.hunts.set(huntId, hunt);

    console.log(`[HuntOrchestrator] Created hunt: ${huntId}`);
    return hunt;
  }

  /**
   * Start hunt execution
   */
  async startHunt(huntId: string): Promise<void> {
    const hunt = this.hunts.get(huntId);
    if (!hunt) {
      throw new Error(`Hunt ${huntId} not found`);
    }

    if (this.activeHunts.has(huntId)) {
      throw new Error(`Hunt ${huntId} is already running`);
    }

    hunt.status = "running";
    this.activeHunts.add(huntId);

    console.log(`[HuntOrchestrator] Started hunt: ${huntId}`);

    // Schedule completion check
    this.scheduleHuntCompletion(huntId, hunt.estimatedDuration);
  }

  /**
   * Complete hunt
   */
  async completeHunt(huntId: string, result: Omit<HuntResult, "huntId" | "completedAt">): Promise<HuntResult> {
    const hunt = this.hunts.get(huntId);
    if (!hunt) {
      throw new Error(`Hunt ${huntId} not found`);
    }

    const huntResult: HuntResult = {
      ...result,
      huntId,
      completedAt: new Date(),
    };

    this.results.set(huntId, huntResult);
    hunt.status = "completed";
    this.activeHunts.delete(huntId);

    console.log(`[HuntOrchestrator] Completed hunt: ${huntId}`);
    return huntResult;
  }

  /**
   * Get hunt details
   */
  async getHunt(huntId: string): Promise<{
    config: HuntConfiguration | null;
    result: HuntResult | null;
  }> {
    return {
      config: this.hunts.get(huntId) || null,
      result: this.results.get(huntId) || null,
    };
  }

  /**
   * Get all hunts
   */
  async getAllHunts(status?: string): Promise<HuntConfiguration[]> {
    const hunts = Array.from(this.hunts.values());
    return status ? hunts.filter((h) => h.status === status) : hunts;
  }

  /**
   * Get hunt results
   */
  async getResults(huntId: string): Promise<HuntResult | null> {
    return this.results.get(huntId) || null;
  }

  /**
   * Schedule hunt to run periodically
   */
  async scheduleHunt(
    huntId: string,
    frequency: "daily" | "weekly" | "monthly" | "custom",
    cronExpression?: string
  ): Promise<HuntSchedule> {
    const hunt = this.hunts.get(huntId);
    if (!hunt) {
      throw new Error(`Hunt ${huntId} not found`);
    }

    const scheduleId = `schedule-${huntId}`;
    const schedule: HuntSchedule = {
      scheduleId,
      huntId,
      frequency,
      nextRun: this.calculateNextRun(frequency),
      enabled: true,
      cronExpression,
    };

    this.schedules.set(scheduleId, schedule);

    console.log(`[HuntOrchestrator] Scheduled hunt ${huntId} with frequency: ${frequency}`);
    return schedule;
  }

  /**
   * Update schedule
   */
  async updateSchedule(
    scheduleId: string,
    enabled: boolean
  ): Promise<HuntSchedule | null> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    schedule.enabled = enabled;
    return schedule;
  }

  /**
   * Get active hunts
   */
  async getActiveHunts(): Promise<HuntConfiguration[]> {
    return Array.from(this.activeHunts).map((id) => this.hunts.get(id)!);
  }

  /**
   * Cancel hunt
   */
  async cancelHunt(huntId: string): Promise<void> {
    const hunt = this.hunts.get(huntId);
    if (!hunt) {
      throw new Error(`Hunt ${huntId} not found`);
    }

    hunt.status = "failed";
    this.activeHunts.delete(huntId);

    console.log(`[HuntOrchestrator] Cancelled hunt: ${huntId}`);
  }

  /**
   * Export hunt results
   */
  async exportResults(huntId: string, format: "json" | "csv" = "json"): Promise<string | Buffer> {
    const result = this.results.get(huntId);
    if (!result) {
      return format === "json" ? "{}" : "";
    }

    if (format === "json") {
      return JSON.stringify(result, null, 2);
    }

    // CSV format
    let csv = "Type,Severity,EntityID,Evidence,Timestamp\n";
    for (const finding of result.findings) {
      const evidenceStr = finding.evidence.join("; ").replace(/"/g, '""');
      csv += `"${finding.type}","${finding.severity}","${finding.entityId}","${evidenceStr}","${finding.timestamp.toISOString()}"\n`;
    }

    return csv;
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(frequency: string): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case "daily":
        next.setDate(next.getDate() + 1);
        next.setHours(2, 0, 0, 0);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        next.setHours(2, 0, 0, 0);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        next.setHours(2, 0, 0, 0);
        break;
    }

    return next;
  }

  /**
   * Schedule hunt completion check
   */
  private scheduleHuntCompletion(huntId: string, durationMinutes: number): void {
    const timeoutMs = durationMinutes * 60 * 1000;

    setTimeout(async () => {
      // Check if hunt completed, if not, mark as failed
      const hunt = this.hunts.get(huntId);
      if (hunt && hunt.status === "running") {
        hunt.status = "failed";
        this.activeHunts.delete(huntId);
        console.log(`[HuntOrchestrator] Hunt ${huntId} timed out`);
      }
    }, timeoutMs);
  }

  /**
   * Get hunt statistics
   */
  async getStatistics(): Promise<{
    totalHunts: number;
    completedHunts: number;
    activeHunts: number;
    failedHunts: number;
    avgFindingsPerHunt: number;
  }> {
    const hunts = Array.from(this.hunts.values());
    const completedResults = Array.from(this.results.values());

    const totalHunts = hunts.length;
    const completedHunts = hunts.filter((h) => h.status === "completed").length;
    const activeHunts = this.activeHunts.size;
    const failedHunts = hunts.filter((h) => h.status === "failed").length;

    const avgFindingsPerHunt =
      completedResults.length > 0
        ? completedResults.reduce((sum, r) => sum + r.findings.length, 0) /
          completedResults.length
        : 0;

    return {
      totalHunts,
      completedHunts,
      activeHunts,
      failedHunts,
      avgFindingsPerHunt,
    };
  }
}

export default HuntOrchestrator;
