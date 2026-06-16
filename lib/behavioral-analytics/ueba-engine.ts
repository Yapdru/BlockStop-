/**
 * UEBA (User and Entity Behavior Analytics) Engine
 * Core orchestration for behavioral analysis and anomaly detection
 */

import { UserProfiler } from "./user-profiler";
import { EntityBaseline } from "./entity-baseline";
import { AnomalyDetector } from "./anomaly-detector";
import { RiskScorer } from "./risk-scorer";
import { BehaviorClassifier } from "./behavior-classifier";
import { TimelineBuilder } from "./timeline-builder";
import { RelationshipMapper } from "./relationship-mapper";

export interface UserEntity {
  id: string;
  type: "user" | "service" | "device" | "account";
  name: string;
  department?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, unknown>;
}

export interface BehavioralEvent {
  id: string;
  entityId: string;
  entityType: string;
  timestamp: Date;
  eventType: string;
  action: string;
  target?: string;
  sourceIp?: string;
  location?: string;
  resourceAccess?: {
    resourceId: string;
    resourceType: string;
    accessType: "read" | "write" | "execute" | "delete";
  };
  metadata?: Record<string, unknown>;
}

export interface AnomalyResult {
  eventId: string;
  entityId: string;
  severity: "low" | "medium" | "high" | "critical";
  anomalyType: string;
  score: number;
  reasons: string[];
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface RiskAssessment {
  entityId: string;
  overallRiskScore: number;
  anomalies: AnomalyResult[];
  behaviors: Array<{
    category: string;
    score: number;
    classification: string;
  }>;
  timeline: Array<{
    timestamp: Date;
    event: string;
    riskLevel: string;
  }>;
  relationships: Array<{
    relatedEntityId: string;
    relationshipType: string;
    riskFactor: number;
  }>;
}

export class UEBAEngine {
  private userProfiler: UserProfiler;
  private entityBaseline: EntityBaseline;
  private anomalyDetector: AnomalyDetector;
  private riskScorer: RiskScorer;
  private behaviorClassifier: BehaviorClassifier;
  private timelineBuilder: TimelineBuilder;
  private relationshipMapper: RelationshipMapper;

  constructor() {
    this.userProfiler = new UserProfiler();
    this.entityBaseline = new EntityBaseline();
    this.anomalyDetector = new AnomalyDetector();
    this.riskScorer = new RiskScorer();
    this.behaviorClassifier = new BehaviorClassifier();
    this.timelineBuilder = new TimelineBuilder();
    this.relationshipMapper = new RelationshipMapper();
  }

  /**
   * Initialize UEBA engine with historical data
   */
  async initialize(entities: UserEntity[], events: BehavioralEvent[]): Promise<void> {
    try {
      console.log(`[UEBA] Initializing with ${entities.length} entities and ${events.length} events`);

      // Build baselines from historical data
      for (const entity of entities) {
        await this.entityBaseline.calculateBaseline(entity.id, events);
        await this.userProfiler.buildProfile(entity);
      }

      // Build relationship graph
      await this.relationshipMapper.buildGraph(entities, events);

      console.log("[UEBA] Initialization complete");
    } catch (error) {
      console.error("[UEBA] Initialization error:", error);
      throw error;
    }
  }

  /**
   * Analyze a behavioral event for anomalies
   */
  async analyzeEvent(event: BehavioralEvent): Promise<AnomalyResult | null> {
    try {
      // Check for anomalies
      const anomaly = await this.anomalyDetector.detect(event, this.entityBaseline);
      if (!anomaly) {
        return null;
      }

      // Classify behavior
      const classification = await this.behaviorClassifier.classify(event, anomaly);
      anomaly.context = { ...anomaly.context, classification };

      return anomaly;
    } catch (error) {
      console.error("[UEBA] Event analysis error:", error);
      throw error;
    }
  }

  /**
   * Perform comprehensive risk assessment for an entity
   */
  async assessRisk(entityId: string, lookbackDays: number = 30): Promise<RiskAssessment> {
    try {
      const baseline = await this.entityBaseline.getBaseline(entityId);
      const profile = await this.userProfiler.getProfile(entityId);

      if (!baseline || !profile) {
        throw new Error(`No data found for entity ${entityId}`);
      }

      // Get recent events
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

      // Calculate anomalies
      const anomalies = await this.anomalyDetector.getRecentAnomalies(entityId, cutoffDate);

      // Classify behaviors
      const behaviors = await this.behaviorClassifier.getClassifications(entityId, cutoffDate);

      // Build timeline
      const timeline = await this.timelineBuilder.buildTimeline(entityId, cutoffDate);

      // Get relationships
      const relationships = await this.relationshipMapper.getRelationships(entityId);

      // Calculate overall risk score
      const overallRiskScore = await this.riskScorer.calculateScore({
        anomalies,
        behaviors,
        timeline,
        relationships,
        profile,
      });

      return {
        entityId,
        overallRiskScore,
        anomalies,
        behaviors,
        timeline,
        relationships,
      };
    } catch (error) {
      console.error("[UEBA] Risk assessment error:", error);
      throw error;
    }
  }

  /**
   * Get anomalies for multiple entities
   */
  async getEntityAnomalies(
    entityIds: string[],
    since?: Date
  ): Promise<Map<string, AnomalyResult[]>> {
    const results = new Map<string, AnomalyResult[]>();

    for (const entityId of entityIds) {
      const anomalies = await this.anomalyDetector.getRecentAnomalies(
        entityId,
        since || new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      results.set(entityId, anomalies);
    }

    return results;
  }

  /**
   * Get dashboard data for threat monitoring
   */
  async getDashboardData(): Promise<{
    topRisks: Array<{ entityId: string; score: number }>;
    anomalyTrend: Array<{ date: Date; count: number }>;
    behaviorDistribution: Record<string, number>;
    alertCounts: Record<string, number>;
  }> {
    try {
      const topRisks = await this.riskScorer.getTopRisks(10);
      const anomalyTrend = await this.anomalyDetector.getTrend(30);
      const behaviorDistribution = await this.behaviorClassifier.getDistribution();
      const alertCounts = await this.anomalyDetector.getAlertCounts();

      return {
        topRisks,
        anomalyTrend,
        behaviorDistribution,
        alertCounts,
      };
    } catch (error) {
      console.error("[UEBA] Dashboard data error:", error);
      throw error;
    }
  }

  /**
   * Export UEBA data for reporting
   */
  async exportData(
    entityId: string,
    format: "json" | "csv"
  ): Promise<string | Buffer> {
    try {
      const assessment = await this.assessRisk(entityId);

      if (format === "json") {
        return JSON.stringify(assessment, null, 2);
      }

      // CSV format
      let csv = "Event,Severity,Score,Type\n";
      for (const anomaly of assessment.anomalies) {
        csv += `${anomaly.eventId},"${anomaly.severity}",${anomaly.score},"${anomaly.anomalyType}"\n`;
      }

      return csv;
    } catch (error) {
      console.error("[UEBA] Export error:", error);
      throw error;
    }
  }
}

export default UEBAEngine;
