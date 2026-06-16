/**
 * Anomaly Detector - Identifies deviations from normal behavior
 */

import { EntityBaseline } from "./entity-baseline";

export interface AnomalyEvent {
  eventId: string;
  entityId: string;
  timestamp: Date;
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  anomalyType: string;
  reasons: string[];
  baselineDeviation: number;
}

export class AnomalyDetector {
  private anomalies: Map<string, AnomalyEvent[]> = new Map();
  private anomalyStats: Map<string, { count: number; lastDetected: Date }> = new Map();

  /**
   * Detect anomalies in an event
   */
  async detect(
    event: {
      id: string;
      entityId: string;
      timestamp: Date;
      action: string;
      target: string;
      sourceLocation?: string;
      metadata?: Record<string, unknown>;
    },
    baseline: EntityBaseline
  ): Promise<AnomalyEvent | null> {
    try {
      const anomalyCheck = await baseline.isAnomalous(event);

      if (!anomalyCheck.isAnomalous) {
        return null;
      }

      // Determine severity based on score and pattern
      let severity: "low" | "medium" | "high" | "critical" = "medium";
      if (anomalyCheck.score < 30) {
        severity = "low";
      } else if (anomalyCheck.score < 50) {
        severity = "medium";
      } else if (anomalyCheck.score < 75) {
        severity = "high";
      } else {
        severity = "critical";
      }

      // Determine anomaly type
      const anomalyType = this.classifyAnomalyType(anomalyCheck.reasons);

      const anomaly: AnomalyEvent = {
        eventId: event.id,
        entityId: event.entityId,
        timestamp: event.timestamp,
        severity,
        score: anomalyCheck.score,
        anomalyType,
        reasons: anomalyCheck.reasons,
        baselineDeviation: anomalyCheck.score,
      };

      // Store anomaly
      const entityAnomalies = this.anomalies.get(event.entityId) || [];
      entityAnomalies.push(anomaly);
      this.anomalies.set(event.entityId, entityAnomalies);

      // Update stats
      const stats = this.anomalyStats.get(event.entityId) || { count: 0, lastDetected: new Date() };
      stats.count++;
      stats.lastDetected = new Date();
      this.anomalyStats.set(event.entityId, stats);

      return anomaly;
    } catch (error) {
      console.error("[AnomalyDetector] Detection error:", error);
      throw error;
    }
  }

  /**
   * Get recent anomalies for an entity
   */
  async getRecentAnomalies(entityId: string, since: Date): Promise<AnomalyEvent[]> {
    const entityAnomalies = this.anomalies.get(entityId) || [];
    return entityAnomalies.filter((a) => a.timestamp >= since);
  }

  /**
   * Get anomaly trend over time
   */
  async getTrend(days: number): Promise<Array<{ date: Date; count: number }>> {
    const trend: Map<string, number> = new Map();

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Count anomalies by day
    for (const [, anomalies] of this.anomalies) {
      for (const anomaly of anomalies) {
        if (anomaly.timestamp >= startDate) {
          const dateStr = anomaly.timestamp.toISOString().split("T")[0];
          trend.set(dateStr, (trend.get(dateStr) || 0) + 1);
        }
      }
    }

    // Convert to array and fill gaps
    const result: Array<{ date: Date; count: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      result.push({
        date,
        count: trend.get(dateStr) || 0,
      });
    }

    return result;
  }

  /**
   * Get alert counts by type
   */
  async getAlertCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    for (const [, anomalies] of this.anomalies) {
      for (const anomaly of anomalies) {
        counts[anomaly.anomalyType] = (counts[anomaly.anomalyType] || 0) + 1;
      }
    }

    return counts;
  }

  /**
   * Get anomalies by severity
   */
  async getAnomaliesBySeverity(
    entityId: string,
    severity: "low" | "medium" | "high" | "critical"
  ): Promise<AnomalyEvent[]> {
    const entityAnomalies = this.anomalies.get(entityId) || [];
    return entityAnomalies.filter((a) => a.severity === severity);
  }

  /**
   * Get top anomalous entities
   */
  async getTopAnomalousEntities(limit: number = 10): Promise<Array<{
    entityId: string;
    anomalyCount: number;
    avgScore: number;
    lastDetected: Date;
  }>> {
    const entityStats: Array<{
      entityId: string;
      anomalyCount: number;
      avgScore: number;
      lastDetected: Date;
    }> = [];

    for (const [entityId, anomalies] of this.anomalies) {
      const avgScore = anomalies.reduce((sum, a) => sum + a.score, 0) / anomalies.length;
      const stats = this.anomalyStats.get(entityId);

      entityStats.push({
        entityId,
        anomalyCount: anomalies.length,
        avgScore,
        lastDetected: stats?.lastDetected || new Date(),
      });
    }

    return entityStats.sort((a, b) => b.anomalyCount - a.anomalyCount).slice(0, limit);
  }

  /**
   * Correlate anomalies across entities
   */
  async correlateAnomalies(timeWindow: number = 60000): Promise<Array<{
    anomalies: AnomalyEvent[];
    correlation: number;
    type: string;
  }>> {
    const correlatedSets: Array<{
      anomalies: AnomalyEvent[];
      correlation: number;
      type: string;
    }> = [];

    const allAnomalies: AnomalyEvent[] = [];
    for (const [, anomalies] of this.anomalies) {
      allAnomalies.push(...anomalies);
    }

    allAnomalies.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Find anomalies within time window
    for (let i = 0; i < allAnomalies.length; i++) {
      const related = [allAnomalies[i]];

      for (let j = i + 1; j < allAnomalies.length; j++) {
        const timeDiff = allAnomalies[j].timestamp.getTime() - allAnomalies[i].timestamp.getTime();
        if (timeDiff <= timeWindow) {
          if (allAnomalies[j].anomalyType === allAnomalies[i].anomalyType) {
            related.push(allAnomalies[j]);
          }
        } else {
          break;
        }
      }

      if (related.length > 1) {
        const avgScore = related.reduce((sum, a) => sum + a.score, 0) / related.length;
        correlatedSets.push({
          anomalies: related,
          correlation: Math.min(related.length / 5, 1), // Normalize correlation
          type: related[0].anomalyType,
        });
      }
    }

    return correlatedSets;
  }

  /**
   * Clear old anomalies
   */
  async clearOldAnomalies(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let removed = 0;

    for (const [entityId, anomalies] of this.anomalies) {
      const filtered = anomalies.filter((a) => a.timestamp >= cutoffDate);
      if (filtered.length < anomalies.length) {
        removed += anomalies.length - filtered.length;
        if (filtered.length === 0) {
          this.anomalies.delete(entityId);
        } else {
          this.anomalies.set(entityId, filtered);
        }
      }
    }

    return removed;
  }

  /**
   * Classify the type of anomaly
   */
  private classifyAnomalyType(reasons: string[]): string {
    const reasonStr = reasons.join(" ").toLowerCase();

    if (reasonStr.includes("hour")) return "Timing Anomaly";
    if (reasonStr.includes("action")) return "Behavior Anomaly";
    if (reasonStr.includes("resource")) return "Access Anomaly";
    if (reasonStr.includes("location")) return "Location Anomaly";

    return "General Anomaly";
  }

  /**
   * Export anomalies for reporting
   */
  async exportAnomalies(
    entityId?: string,
    format: "json" | "csv" = "json"
  ): Promise<string | Buffer> {
    let anomaliesToExport: AnomalyEvent[] = [];

    if (entityId) {
      anomaliesToExport = this.anomalies.get(entityId) || [];
    } else {
      for (const [, anomalies] of this.anomalies) {
        anomaliesToExport.push(...anomalies);
      }
    }

    if (format === "json") {
      return JSON.stringify(anomaliesToExport, null, 2);
    }

    // CSV format
    let csv = "EventID,EntityID,Timestamp,Severity,Score,Type,Reasons\n";
    for (const anomaly of anomaliesToExport) {
      const reasonsStr = anomaly.reasons.join("; ").replace(/"/g, '""');
      csv += `"${anomaly.eventId}","${anomaly.entityId}","${anomaly.timestamp.toISOString()}","${anomaly.severity}",${anomaly.score},"${anomaly.anomalyType}","${reasonsStr}"\n`;
    }

    return csv;
  }
}

export default AnomalyDetector;
