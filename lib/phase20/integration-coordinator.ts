import { ServiceProvider, ScanResult } from '@/lib/integrations/user/types';
import { IntegrationManager } from '@/lib/integrations/user/integration-manager';
import { createIntegrationFactory } from '@/lib/integrations/user/integration-factory';

export interface CoordinationJob {
  id: string;
  userId: string;
  integrations: ServiceProvider[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  results: ScanResult[];
  errors: string[];
}

export interface AggregatedThreats {
  totalThreats: number;
  byProvider: { [key: string]: number };
  bySeverity: { [key: string]: number };
  byType: { [key: string]: number };
  riskScore: number;
  recommendations: string[];
}

export class IntegrationCoordinator {
  private manager: IntegrationManager;
  private jobs: Map<string, CoordinationJob> = new Map();

  constructor() {
    const factory = createIntegrationFactory();
    this.manager = new IntegrationManager(factory);
  }

  async coordinateScan(
    userId: string,
    integrationIds: string[],
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<CoordinationJob> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: CoordinationJob = {
      id: jobId,
      userId,
      integrations: [],
      status: 'pending',
      results: [],
      errors: []
    };

    this.jobs.set(jobId, job);

    try {
      job.status = 'running';
      job.startedAt = new Date();

      // Get user's integrations
      const userIntegrations = await this.manager.getUserIntegrations(userId);

      // Filter to requested integrations
      const targetIntegrations = userIntegrations.filter(int =>
        integrationIds.includes(int.id)
      );

      job.integrations = targetIntegrations.map(int => int.provider);

      // Execute scans in parallel or sequence based on priority
      const scanResults = await this.executeScanStrategy(
        userId,
        targetIntegrations,
        priority
      );

      job.results = scanResults;
      job.status = 'completed';
      job.completedAt = new Date();

      return job;
    } catch (error) {
      job.status = 'failed';
      job.errors = [error instanceof Error ? error.message : 'Unknown error'];
      job.completedAt = new Date();
      return job;
    }
  }

  private async executeScanStrategy(
    userId: string,
    integrations: any[],
    priority: string
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = [];

    if (priority === 'high') {
      // Parallel execution for high priority
      const promises = integrations.map(int =>
        this.manager.scanWithIntegration(userId, int.id).catch(err => ({
          provider: int.provider,
          timestamp: new Date(),
          itemsScanned: 0,
          threatsDetected: 0,
          details: [],
          error: err.message
        }))
      );

      const scanResults = await Promise.all(promises);
      results.push(...scanResults);
    } else {
      // Sequential execution for normal/low priority to avoid rate limiting
      for (const integration of integrations) {
        try {
          const result = await this.manager.scanWithIntegration(userId, integration.id);
          results.push(result);

          // Add delay for rate limiting
          await new Promise(resolve =>
            setTimeout(resolve, priority === 'normal' ? 1000 : 2000)
          );
        } catch (error) {
          results.push({
            provider: integration.provider,
            timestamp: new Date(),
            itemsScanned: 0,
            threatsDetected: 0,
            details: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          } as any);
        }
      }
    }

    return results;
  }

  async aggregateResults(jobId: string): Promise<AggregatedThreats> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    const aggregated: AggregatedThreats = {
      totalThreats: 0,
      byProvider: {},
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: {},
      riskScore: 0,
      recommendations: []
    };

    for (const result of job.results) {
      aggregated.totalThreats += result.threatsDetected;
      aggregated.byProvider[result.provider] = result.threatsDetected;

      // Categorize by severity (simulated)
      if (result.threatsDetected > 0) {
        const severityDist = this.distributeBySeverity(result.threatsDetected);
        aggregated.bySeverity.low += severityDist.low;
        aggregated.bySeverity.medium += severityDist.medium;
        aggregated.bySeverity.high += severityDist.high;
        aggregated.bySeverity.critical += severityDist.critical;
      }

      // Add threat types
      for (const detail of result.details) {
        const threatType = detail.riskLevel || 'unknown';
        aggregated.byType[threatType] = (aggregated.byType[threatType] || 0) + 1;
      }
    }

    // Calculate risk score (0-100)
    aggregated.riskScore = this.calculateRiskScore(aggregated);

    // Generate recommendations
    aggregated.recommendations = this.generateRecommendations(aggregated);

    return aggregated;
  }

  private distributeBySeverity(threatCount: number): { [key: string]: number } {
    // Simulate severity distribution
    return {
      critical: Math.floor(threatCount * 0.1),
      high: Math.floor(threatCount * 0.2),
      medium: Math.floor(threatCount * 0.4),
      low: Math.floor(threatCount * 0.3)
    };
  }

  private calculateRiskScore(aggregated: AggregatedThreats): number {
    const criticalWeight = 95;
    const highWeight = 75;
    const mediumWeight = 50;
    const lowWeight = 20;

    const weightedScore =
      (aggregated.bySeverity.critical * criticalWeight +
        aggregated.bySeverity.high * highWeight +
        aggregated.bySeverity.medium * mediumWeight +
        aggregated.bySeverity.low * lowWeight) /
      (aggregated.totalThreats || 1);

    return Math.min(100, Math.round(weightedScore));
  }

  private generateRecommendations(aggregated: AggregatedThreats): string[] {
    const recommendations: string[] = [];

    if (aggregated.bySeverity.critical > 0) {
      recommendations.push('URGENT: Critical threats detected - immediate action required');
      recommendations.push('Isolate affected systems and initiate incident response');
    }

    if (aggregated.bySeverity.high > 0) {
      recommendations.push('High severity threats detected - review and remediate');
      recommendations.push('Enable enhanced monitoring for affected services');
    }

    if (aggregated.totalThreats === 0) {
      recommendations.push('No threats detected - continue regular monitoring');
    } else {
      recommendations.push(`Review ${aggregated.totalThreats} detected threats`);
      recommendations.push('Enable automated threat response rules');
    }

    return recommendations;
  }

  async subscribeToIntegration(
    userId: string,
    integrationId: string,
    interval: 'hourly' | 'daily' | 'weekly' = 'daily'
  ): Promise<void> {
    // In production, persist subscription to DB
    const intervalMap = {
      hourly: 60,
      daily: 24 * 60,
      weekly: 7 * 24 * 60
    };

    console.log(
      `Scheduled scanning for integration ${integrationId} every ${interval} (${intervalMap[interval]}m)`
    );
  }

  getJob(jobId: string): CoordinationJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(userId: string): CoordinationJob[] {
    return Array.from(this.jobs.values()).filter(job => job.userId === userId);
  }
}

export const createIntegrationCoordinator = (): IntegrationCoordinator => {
  return new IntegrationCoordinator();
};
