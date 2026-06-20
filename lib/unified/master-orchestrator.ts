import { getDb } from '@/lib/db';
import { IntegrationManager } from '@/lib/integrations/user/integration-manager';
import { createIntegrationFactory } from '@/lib/integrations/user/integration-factory';
import { IntegrationCoordinator } from '@/lib/phase20/integration-coordinator';
import { createAIOrchestrator } from '@/lib/phase20/ai-orchestrator';
import { createThreatHunter } from '@/lib/phase20/threat-hunter';
import { getUserById, getUserTier } from '@/lib/neo/auth-service';
import { getTeamById } from '@/lib/neo/team-service';
import crypto from 'crypto';

export interface UnifiedScanRequest {
  userId: string;
  teamId?: string;
  integrationIds?: string[];
  includeAIAnalysis?: boolean;
  includeThreatHunting?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface UnifiedScanResult {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration: number;
  results: {
    providerResults: any[];
    aiAnalysis: any;
    huntingResults: any[];
    aggregatedThreatCount: number;
    overallRiskScore: number;
    recommendations: string[];
  };
  threats: ThreatEvent[];
  remediationActions: RemediationAction[];
}

export interface ThreatEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  provider: string;
  timestamp: Date;
  details: any;
  resolved: boolean;
}

export interface RemediationAction {
  id: string;
  threatId: string;
  actionType: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: Date;
}

export class MasterOrchestrator {
  private integrationManager: IntegrationManager;
  private integrationCoordinator: IntegrationCoordinator;
  private aiOrchestrator: any;
  private threatHunter: any;

  constructor() {
    const factory = createIntegrationFactory();
    this.integrationManager = new IntegrationManager(factory);
    this.integrationCoordinator = new IntegrationCoordinator();
    this.aiOrchestrator = createAIOrchestrator();
    this.threatHunter = createThreatHunter();
  }

  async executeMasterScan(req: UnifiedScanRequest): Promise<UnifiedScanResult> {
    const db = getDb();
    const jobId = `master_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Validate user and tier
      const user = await getUserById(req.userId);
      const userTier = await getUserTier(req.userId);

      // Check team permissions if team scan
      if (req.teamId) {
        const team = await getTeamById(req.teamId);
        if (team.createdBy !== req.userId) {
          throw new Error('Unauthorized to scan this team');
        }
      }

      // Create job record
      await db.query(
        `INSERT INTO unified_jobs (id, user_id, team_id, job_type, status, priority, integrations, start_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [jobId, req.userId, req.teamId || null, 'full_scan', 'running', req.priority || 'normal', req.integrationIds || []]
      );

      // Get user's integrations
      const userIntegrations = await this.integrationManager.getUserIntegrations(req.userId);
      const targetIntegrations = req.integrationIds
        ? userIntegrations.filter(int => req.integrationIds!.includes(int.id))
        : userIntegrations;

      if (targetIntegrations.length === 0) {
        throw new Error('No integrations configured for scanning');
      }

      // Execute integration scans
      const coordJob = await this.integrationCoordinator.coordinateScan(
        req.userId,
        targetIntegrations.map(int => int.id),
        req.priority || 'normal'
      );

      const providerResults = coordJob.results;
      const aggregatedResults = await this.integrationCoordinator.aggregateResults(coordJob.id);

      // Execute AI analysis if requested
      let aiAnalysis = null;
      if (req.includeAIAnalysis) {
        for (const result of providerResults) {
          if (result.details && result.details.length > 0) {
            const firstDetail = result.details[0];
            aiAnalysis = await this.aiOrchestrator.analyzeWithMultipleModels({
              emailContent: firstDetail.itemName || ''
            });
          }
        }
      }

      // Execute threat hunting if requested
      let huntingResults: any[] = [];
      if (req.includeThreatHunting) {
        huntingResults = await this.threatHunter.huntThreats(req.userId, req.teamId ? 'team' : 'user');
      }

      // Create threat events
      const threats = await this.createThreatEvents(
        jobId,
        req.userId,
        req.teamId,
        providerResults,
        aiAnalysis,
        huntingResults
      );

      // Generate remediation actions
      const remediationActions = await this.generateRemediationActions(
        jobId,
        req.userId,
        req.teamId,
        threats
      );

      // Store results in DB
      const resultId = `result_${Date.now()}`;
      await db.query(
        `INSERT INTO unified_results (id, job_id, user_id, team_id, provider, threat_data, ai_analysis, hunting_matches, recommendations)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          resultId,
          jobId,
          req.userId,
          req.teamId || null,
          'multi-provider',
          JSON.stringify(threats),
          JSON.stringify(aiAnalysis),
          JSON.stringify(huntingResults),
          aggregatedResults.recommendations
        ]
      );

      // Update job status
      const duration = Date.now() - startTime;
      await db.query(
        `UPDATE unified_jobs SET status = 'completed', end_time = NOW(), duration_ms = $1 WHERE id = $2`,
        [duration, jobId]
      );

      return {
        jobId,
        status: 'completed',
        duration,
        results: {
          providerResults,
          aiAnalysis,
          huntingResults,
          aggregatedThreatCount: aggregatedResults.totalThreats,
          overallRiskScore: aggregatedResults.riskScore,
          recommendations: aggregatedResults.recommendations
        },
        threats,
        remediationActions
      };
    } catch (error) {
      await db.query(
        `UPDATE unified_jobs SET status = 'failed' WHERE id = $1`,
        [jobId]
      );
      throw error;
    }
  }

  private async createThreatEvents(
    jobId: string,
    userId: string,
    teamId: string | undefined,
    providerResults: any[],
    aiAnalysis: any,
    huntingResults: any[]
  ): Promise<ThreatEvent[]> {
    const db = getDb();
    const threats: ThreatEvent[] = [];

    // Create events from provider results
    for (const result of providerResults) {
      if (result.threatsDetected > 0) {
        for (const detail of result.details || []) {
          const threatId = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const threat: ThreatEvent = {
            id: threatId,
            type: detail.threatType || 'unknown',
            severity: (detail.riskLevel || 'low') as any,
            provider: result.provider,
            timestamp: new Date(),
            details: detail,
            resolved: false
          };

          threats.push(threat);

          // Store in threat_timeline
          await db.query(
            `INSERT INTO threat_timeline (id, user_id, team_id, threat_type, severity, provider, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [threatId, userId, teamId || null, threat.type, threat.severity, threat.provider, JSON.stringify(detail)]
          );
        }
      }
    }

    // Create events from AI analysis
    if (aiAnalysis && aiAnalysis.threats) {
      for (const threat of aiAnalysis.threats) {
        const threatId = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const event: ThreatEvent = {
          id: threatId,
          type: threat.threatType,
          severity: threat.severity,
          provider: 'ai-analysis',
          timestamp: new Date(),
          details: threat,
          resolved: false
        };

        threats.push(event);

        await db.query(
          `INSERT INTO threat_timeline (id, user_id, team_id, threat_type, severity, provider, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [threatId, userId, teamId || null, event.type, event.severity, 'ai-analysis', JSON.stringify(threat)]
        );
      }
    }

    // Create events from hunting results
    for (const huntResult of huntingResults) {
      if (huntResult.matchCount > 0) {
        const threatId = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const event: ThreatEvent = {
          id: threatId,
          type: huntResult.ruleName,
          severity: huntResult.severity,
          provider: 'threat-hunting',
          timestamp: new Date(),
          details: huntResult,
          resolved: false
        };

        threats.push(event);

        await db.query(
          `INSERT INTO threat_timeline (id, user_id, team_id, threat_type, severity, provider, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [threatId, userId, teamId || null, event.type, event.severity, 'threat-hunting', JSON.stringify(huntResult)]
        );
      }
    }

    return threats;
  }

  private async generateRemediationActions(
    jobId: string,
    userId: string,
    teamId: string | undefined,
    threats: ThreatEvent[]
  ): Promise<RemediationAction[]> {
    const db = getDb();
    const actions: RemediationAction[] = [];

    for (const threat of threats) {
      const actionType = this.determineActionType(threat.type, threat.severity);
      const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const action: RemediationAction = {
        id: actionId,
        threatId: threat.id,
        actionType,
        status: 'pending',
        timestamp: new Date()
      };

      actions.push(action);

      await db.query(
        `INSERT INTO remediation_actions (id, user_id, team_id, threat_id, action_type, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [actionId, userId, teamId || null, threat.id, actionType, 'pending']
      );
    }

    return actions;
  }

  private determineActionType(threatType: string, severity: string): string {
    if (severity === 'critical') {
      return 'isolate_and_alert';
    } else if (severity === 'high') {
      return 'quarantine_and_notify';
    } else if (severity === 'medium') {
      return 'monitor_and_log';
    } else {
      return 'log_only';
    }
  }

  async getUnifiedDashboard(userId: string, teamId?: string): Promise<any> {
    const db = getDb();

    // Get recent jobs
    const jobsQuery = teamId
      ? `SELECT * FROM unified_jobs WHERE user_id = $1 AND team_id = $2 ORDER BY created_at DESC LIMIT 10`
      : `SELECT * FROM unified_jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`;

    const jobsResult = await db.query(jobsQuery, teamId ? [userId, teamId] : [userId]);

    // Get threat timeline
    const threatsQuery = teamId
      ? `SELECT * FROM threat_timeline WHERE user_id = $1 AND team_id = $2 ORDER BY created_at DESC LIMIT 50`
      : `SELECT * FROM threat_timeline WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`;

    const threatsResult = await db.query(threatsQuery, teamId ? [userId, teamId] : [userId]);

    // Aggregate threat counts by severity
    const threatCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const row of threatsResult.rows) {
      threatCounts[row.severity as keyof typeof threatCounts]++;
    }

    return {
      recentJobs: jobsResult.rows,
      threatTimeline: threatsResult.rows,
      threatSummary: threatCounts,
      totalUnresolvedThreats: threatsResult.rows.filter((r: any) => !r.resolved).length
    };
  }
}

export const createMasterOrchestrator = (): MasterOrchestrator => {
  return new MasterOrchestrator();
};
