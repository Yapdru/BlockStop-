/**
 * Timeline Builder - Constructs event timelines for forensic analysis
 */

export interface TimelineEvent {
  timestamp: Date;
  event: string;
  eventType: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  actor: string;
  action: string;
  target: string;
  details: Record<string, unknown>;
}

export interface Timeline {
  entityId: string;
  startTime: Date;
  endTime: Date;
  events: TimelineEvent[];
  summary: {
    totalEvents: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  threats: Array<{
    type: string;
    firstSeen: Date;
    lastSeen: Date;
    occurrences: number;
  }>;
}

export class TimelineBuilder {
  private timelines: Map<string, Timeline> = new Map();
  private eventIndex: Map<string, TimelineEvent[]> = new Map();

  /**
   * Build timeline for an entity
   */
  async buildTimeline(
    entityId: string,
    startTime: Date,
    endTime?: Date
  ): Promise<Timeline> {
    const events = this.eventIndex.get(entityId) || [];
    const filtered = events.filter((e) => {
      const inRange = e.timestamp >= startTime && (!endTime || e.timestamp <= endTime);
      return inRange;
    });

    // Sort by timestamp
    filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate summary
    const summary = {
      totalEvents: filtered.length,
      criticalCount: filtered.filter((e) => e.riskLevel === "critical").length,
      highCount: filtered.filter((e) => e.riskLevel === "high").length,
      mediumCount: filtered.filter((e) => e.riskLevel === "medium").length,
      lowCount: filtered.filter((e) => e.riskLevel === "low").length,
    };

    // Extract threats
    const threatMap = new Map<
      string,
      { firstSeen: Date; lastSeen: Date; occurrences: number }
    >();
    for (const event of filtered) {
      if (event.riskLevel === "high" || event.riskLevel === "critical") {
        const key = event.eventType;
        const existing = threatMap.get(key) || {
          firstSeen: event.timestamp,
          lastSeen: event.timestamp,
          occurrences: 0,
        };
        existing.occurrences++;
        existing.lastSeen = event.timestamp;
        threatMap.set(key, existing);
      }
    }

    const threats = Array.from(threatMap.entries()).map(([type, data]) => ({
      type,
      ...data,
    }));

    const timeline: Timeline = {
      entityId,
      startTime,
      endTime: endTime || new Date(),
      events: filtered,
      summary,
      threats,
    };

    this.timelines.set(entityId, timeline);
    return timeline;
  }

  /**
   * Add event to timeline
   */
  async addEvent(
    entityId: string,
    event: Omit<TimelineEvent, "timestamp"> & { timestamp?: Date }
  ): Promise<TimelineEvent> {
    const timelineEvent: TimelineEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
    };

    const entityEvents = this.eventIndex.get(entityId) || [];
    entityEvents.push(timelineEvent);
    this.eventIndex.set(entityId, entityEvents);

    return timelineEvent;
  }

  /**
   * Get timeline
   */
  async getTimeline(entityId: string): Promise<Timeline | null> {
    return this.timelines.get(entityId) || null;
  }

  /**
   * Find patterns in timeline
   */
  async findPatterns(
    entityId: string,
    patternType: "temporal" | "behavioral" | "access"
  ): Promise<
    Array<{
      pattern: string;
      confidence: number;
      occurrences: number;
      timeRange: { start: Date; end: Date };
    }>
  > {
    const timeline = this.timelines.get(entityId);
    if (!timeline) return [];

    const patterns: Array<{
      pattern: string;
      confidence: number;
      occurrences: number;
      timeRange: { start: Date; end: Date };
    }> = [];

    if (patternType === "temporal") {
      patterns.push(...this.findTemporalPatterns(timeline));
    } else if (patternType === "behavioral") {
      patterns.push(...this.findBehavioralPatterns(timeline));
    } else if (patternType === "access") {
      patterns.push(...this.findAccessPatterns(timeline));
    }

    return patterns;
  }

  /**
   * Find temporal patterns (time-based)
   */
  private findTemporalPatterns(timeline: Timeline): Array<{
    pattern: string;
    confidence: number;
    occurrences: number;
    timeRange: { start: Date; end: Date };
  }> {
    const patterns: Array<{
      pattern: string;
      confidence: number;
      occurrences: number;
      timeRange: { start: Date; end: Date };
    }> = [];

    // Look for after-hours activity
    const afterHoursEvents = timeline.events.filter((e) => {
      const hour = e.timestamp.getHours();
      return hour < 6 || hour > 18;
    });

    if (afterHoursEvents.length > timeline.events.length * 0.3) {
      patterns.push({
        pattern: "Frequent after-hours activity",
        confidence: Math.min(1, afterHoursEvents.length / timeline.events.length),
        occurrences: afterHoursEvents.length,
        timeRange: {
          start: afterHoursEvents[0]?.timestamp || timeline.startTime,
          end: afterHoursEvents[afterHoursEvents.length - 1]?.timestamp || timeline.endTime,
        },
      });
    }

    // Look for rapid-fire events
    for (let i = 0; i < timeline.events.length - 5; i++) {
      const window = timeline.events.slice(i, i + 6);
      const timeDiff =
        window[window.length - 1].timestamp.getTime() - window[0].timestamp.getTime();

      if (timeDiff < 60000) {
        // 60 seconds
        patterns.push({
          pattern: "Rapid event sequence",
          confidence: 0.8,
          occurrences: 6,
          timeRange: {
            start: window[0].timestamp,
            end: window[window.length - 1].timestamp,
          },
        });
        i += 5; // Skip ahead
      }
    }

    return patterns;
  }

  /**
   * Find behavioral patterns
   */
  private findBehavioralPatterns(timeline: Timeline): Array<{
    pattern: string;
    confidence: number;
    occurrences: number;
    timeRange: { start: Date; end: Date };
  }> {
    const patterns: Array<{
      pattern: string;
      confidence: number;
      occurrences: number;
      timeRange: { start: Date; end: Date };
    }> = [];

    // Look for repeated actions on different targets
    const actionMap = new Map<string, TimelineEvent[]>();
    for (const event of timeline.events) {
      const key = event.action;
      const list = actionMap.get(key) || [];
      list.push(event);
      actionMap.set(key, list);
    }

    for (const [action, events] of actionMap) {
      if (events.length > 10) {
        const targetCount = new Set(events.map((e) => e.target)).size;
        if (targetCount > 5) {
          patterns.push({
            pattern: `Repeated action '${action}' on multiple targets`,
            confidence: Math.min(1, targetCount / events.length),
            occurrences: events.length,
            timeRange: {
              start: events[0].timestamp,
              end: events[events.length - 1].timestamp,
            },
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Find access patterns
   */
  private findAccessPatterns(timeline: Timeline): Array<{
    pattern: string;
    confidence: number;
    occurrences: number;
    timeRange: { start: Date; end: Date };
  }> {
    const patterns: Array<{
      pattern: string;
      confidence: number;
      occurrences: number;
      timeRange: { start: Date; end: Date };
    }> = [];

    // Look for access to sensitive resources
    const sensitivePatterns = ["admin", "root", "password", "secret", "database", "backup"];
    const sensitiveAccess = timeline.events.filter((e) =>
      sensitivePatterns.some((p) =>
        e.target.toLowerCase().includes(p.toLowerCase())
      )
    );

    if (sensitiveAccess.length > 0) {
      patterns.push({
        pattern: "Access to sensitive resources",
        confidence: Math.min(1, sensitiveAccess.length / timeline.events.length),
        occurrences: sensitiveAccess.length,
        timeRange: {
          start: sensitiveAccess[0].timestamp,
          end: sensitiveAccess[sensitiveAccess.length - 1].timestamp,
        },
      });
    }

    return patterns;
  }

  /**
   * Correlate timelines across entities
   */
  async correlateTimelines(
    entityIds: string[],
    timeWindow: number = 60000
  ): Promise<
    Array<{
      entityIds: string[];
      correlation: number;
      events: TimelineEvent[];
    }>
  > {
    const correlations: Array<{
      entityIds: string[];
      correlation: number;
      events: TimelineEvent[];
    }> = [];

    if (entityIds.length < 2) return correlations;

    // Get all events from all entities
    const eventsByEntity = new Map<string, TimelineEvent[]>();
    for (const entityId of entityIds) {
      const events = this.eventIndex.get(entityId) || [];
      eventsByEntity.set(entityId, events);
    }

    // Find correlated events
    const eventList: Array<{ entityId: string; event: TimelineEvent }> = [];
    for (const [entityId, events] of eventsByEntity) {
      for (const event of events) {
        eventList.push({ entityId, event });
      }
    }

    eventList.sort((a, b) => a.event.timestamp.getTime() - b.event.timestamp.getTime());

    // Look for events within time window
    for (let i = 0; i < eventList.length; i++) {
      const related: Array<{ entityId: string; event: TimelineEvent }> = [eventList[i]];

      for (let j = i + 1; j < eventList.length; j++) {
        const timeDiff =
          eventList[j].event.timestamp.getTime() -
          eventList[i].event.timestamp.getTime();

        if (timeDiff <= timeWindow) {
          related.push(eventList[j]);
        } else {
          break;
        }
      }

      if (related.length > 1) {
        const uniqueEntities = Array.from(new Set(related.map((r) => r.entityId)));
        if (uniqueEntities.length > 1) {
          correlations.push({
            entityIds: uniqueEntities,
            correlation: related.length / uniqueEntities.length,
            events: related.map((r) => r.event),
          });
        }
      }
    }

    return correlations;
  }

  /**
   * Export timeline
   */
  async exportTimeline(
    entityId: string,
    format: "json" | "csv" = "json"
  ): Promise<string | Buffer> {
    const timeline = this.timelines.get(entityId);
    if (!timeline) {
      return format === "json" ? "{}" : "";
    }

    if (format === "json") {
      return JSON.stringify(timeline, null, 2);
    }

    // CSV format
    let csv =
      "Timestamp,Event,EventType,RiskLevel,Actor,Action,Target\n";
    for (const event of timeline.events) {
      csv += `"${event.timestamp.toISOString()}","${event.event}","${event.eventType}","${event.riskLevel}","${event.actor}","${event.action}","${event.target}"\n`;
    }

    return csv;
  }

  /**
   * Clear old timelines
   */
  async clearOld(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let removed = 0;

    for (const [entityId, events] of this.eventIndex) {
      const filtered = events.filter((e) => e.timestamp >= cutoffDate);
      if (filtered.length < events.length) {
        removed += events.length - filtered.length;
        if (filtered.length === 0) {
          this.eventIndex.delete(entityId);
        } else {
          this.eventIndex.set(entityId, filtered);
        }
      }
    }

    return removed;
  }
}

export default TimelineBuilder;
