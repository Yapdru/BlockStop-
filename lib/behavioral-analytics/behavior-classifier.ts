/**
 * Behavior Classifier - Classifies user behaviors into categories
 */

export interface ClassifiedBehavior {
  entityId: string;
  timestamp: Date;
  behaviorType: string;
  category:
    | "normal"
    | "suspicious"
    | "malicious"
    | "policy_violation"
    | "privilege_abuse"
    | "data_exfiltration"
    | "lateral_movement"
    | "persistence"
    | "reconnaissance";
  confidence: number;
  indicators: string[];
  severity: "low" | "medium" | "high" | "critical";
  context?: Record<string, unknown>;
}

export class BehaviorClassifier {
  private behaviors: Map<string, ClassifiedBehavior[]> = new Map();
  private classifications: Map<string, Record<string, number>> = new Map();

  private readonly BEHAVIOR_PATTERNS = {
    normal: {
      patterns: ["standard file access", "regular login", "normal email activity"],
      severity: "low" as const,
    },
    suspicious: {
      patterns: ["after hours access", "unusual location", "batch operations"],
      severity: "medium" as const,
    },
    privilege_abuse: {
      patterns: [
        "privilege escalation attempt",
        "admin access abuse",
        "unauthorized privilege grant",
      ],
      severity: "high" as const,
    },
    data_exfiltration: {
      patterns: ["bulk data download", "external transfer", "data staging"],
      severity: "critical" as const,
    },
    lateral_movement: {
      patterns: [
        "cross-system access",
        "adjacent host connection",
        "network enumeration",
      ],
      severity: "high" as const,
    },
    reconnaissance: {
      patterns: ["system enumeration", "directory listing", "permission probing"],
      severity: "medium" as const,
    },
    policy_violation: {
      patterns: ["prohibited resource access", "data retention violation"],
      severity: "medium" as const,
    },
    persistence: {
      patterns: ["backdoor installation", "scheduled task creation", "service modification"],
      severity: "critical" as const,
    },
  };

  /**
   * Classify a behavior
   */
  async classify(
    event: {
      entityId: string;
      timestamp: Date;
      action: string;
      target: string;
      metadata?: Record<string, unknown>;
    },
    anomalies?: {
      score: number;
      reasons: string[];
    }
  ): Promise<ClassifiedBehavior> {
    const category = this.determineCategory(event, anomalies);
    const confidence = this.calculateConfidence(event, category);
    const indicators = this.extractIndicators(event, category);

    const behavior: ClassifiedBehavior = {
      entityId: event.entityId,
      timestamp: event.timestamp,
      behaviorType: event.action,
      category,
      confidence,
      indicators,
      severity: this.BEHAVIOR_PATTERNS[category as keyof typeof this.BEHAVIOR_PATTERNS]
        ?.severity || "low",
      context: event.metadata,
    };

    // Store behavior
    const entityBehaviors = this.behaviors.get(event.entityId) || [];
    entityBehaviors.push(behavior);
    this.behaviors.set(event.entityId, entityBehaviors);

    // Update classification counts
    const counts = this.classifications.get(event.entityId) || {};
    counts[category] = (counts[category] || 0) + 1;
    this.classifications.set(event.entityId, counts);

    return behavior;
  }

  /**
   * Get classifications for an entity
   */
  async getClassifications(
    entityId: string,
    since?: Date
  ): Promise<
    Array<{
      category: string;
      score: number;
      classification: string;
    }>
  > {
    const entityBehaviors = this.behaviors.get(entityId) || [];
    const filtered = since
      ? entityBehaviors.filter((b) => b.timestamp >= since)
      : entityBehaviors;

    // Aggregate by category
    const categoryStats = new Map<string, { count: number; avgConfidence: number }>();

    for (const behavior of filtered) {
      const stats = categoryStats.get(behavior.category) || {
        count: 0,
        avgConfidence: 0,
      };
      stats.count++;
      stats.avgConfidence = (stats.avgConfidence * (stats.count - 1) + behavior.confidence) / stats.count;
      categoryStats.set(behavior.category, stats);
    }

    return Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      score: stats.avgConfidence,
      classification: category,
    }));
  }

  /**
   * Get behavior distribution
   */
  async getDistribution(): Promise<Record<string, number>> {
    const distribution: Record<string, number> = {};

    for (const [, counts] of this.classifications) {
      for (const [category, count] of Object.entries(counts)) {
        distribution[category] = (distribution[category] || 0) + count;
      }
    }

    return distribution;
  }

  /**
   * Get malicious behaviors
   */
  async getMaliciousBehaviors(
    entityId?: string
  ): Promise<ClassifiedBehavior[]> {
    const maliciousCategories = [
      "malicious",
      "data_exfiltration",
      "lateral_movement",
      "privilege_abuse",
      "persistence",
    ];

    if (entityId) {
      const entityBehaviors = this.behaviors.get(entityId) || [];
      return entityBehaviors.filter((b) =>
        maliciousCategories.includes(b.category)
      );
    }

    const allBehaviors: ClassifiedBehavior[] = [];
    for (const [, behaviors] of this.behaviors) {
      allBehaviors.push(
        ...behaviors.filter((b) => maliciousCategories.includes(b.category))
      );
    }

    return allBehaviors;
  }

  /**
   * Get high-confidence behaviors
   */
  async getHighConfidenceBehaviors(
    threshold: number = 0.8,
    entityId?: string
  ): Promise<ClassifiedBehavior[]> {
    if (entityId) {
      const entityBehaviors = this.behaviors.get(entityId) || [];
      return entityBehaviors.filter((b) => b.confidence >= threshold);
    }

    const allBehaviors: ClassifiedBehavior[] = [];
    for (const [, behaviors] of this.behaviors) {
      allBehaviors.push(...behaviors.filter((b) => b.confidence >= threshold));
    }

    return allBehaviors;
  }

  /**
   * Determine behavior category
   */
  private determineCategory(
    event: {
      action: string;
      target: string;
      metadata?: Record<string, unknown>;
    },
    anomalies?: {
      score: number;
      reasons: string[];
    }
  ): string {
    const actionLower = event.action.toLowerCase();
    const targetLower = event.target.toLowerCase();

    // Check for data exfiltration indicators
    if (
      actionLower.includes("download") ||
      actionLower.includes("export") ||
      actionLower.includes("copy")
    ) {
      if (
        targetLower.includes("external") ||
        targetLower.includes("cloud") ||
        targetLower.includes("usb")
      ) {
        return "data_exfiltration";
      }
    }

    // Check for privilege escalation
    if (
      actionLower.includes("privilege") ||
      actionLower.includes("admin") ||
      actionLower.includes("sudo")
    ) {
      return "privilege_abuse";
    }

    // Check for lateral movement
    if (
      actionLower.includes("connect") ||
      actionLower.includes("enumerate") ||
      actionLower.includes("scan")
    ) {
      return "lateral_movement";
    }

    // Check for persistence
    if (
      actionLower.includes("install") ||
      actionLower.includes("create") &&
      (targetLower.includes("service") || targetLower.includes("task"))
    ) {
      return "persistence";
    }

    // Check for reconnaissance
    if (
      actionLower.includes("list") ||
      actionLower.includes("enumerate") ||
      actionLower.includes("query")
    ) {
      return "reconnaissance";
    }

    // Check for policy violations
    if (
      actionLower.includes("retain") ||
      actionLower.includes("share") &&
      targetLower.includes("external")
    ) {
      return "policy_violation";
    }

    // If anomalous, classify as suspicious
    if (anomalies && anomalies.score > 50) {
      return "suspicious";
    }

    return "normal";
  }

  /**
   * Calculate confidence in classification
   */
  private calculateConfidence(
    event: {
      action: string;
      target: string;
      metadata?: Record<string, unknown>;
    },
    category: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on pattern matches
    const patterns = this.BEHAVIOR_PATTERNS[category as keyof typeof this.BEHAVIOR_PATTERNS]?.patterns || [];
    const actionLower = event.action.toLowerCase();

    for (const pattern of patterns) {
      if (actionLower.includes(pattern.toLowerCase())) {
        confidence += 0.2;
      }
    }

    // Cap confidence at 0.99
    return Math.min(0.99, confidence);
  }

  /**
   * Extract indicators from event
   */
  private extractIndicators(
    event: {
      action: string;
      target: string;
      metadata?: Record<string, unknown>;
    },
    category: string
  ): string[] {
    const indicators: string[] = [];

    indicators.push(`Action: ${event.action}`);
    indicators.push(`Target: ${event.target}`);

    if (event.metadata) {
      if (event.metadata.sourceIp) {
        indicators.push(`From IP: ${event.metadata.sourceIp}`);
      }
      if (event.metadata.fileSize) {
        indicators.push(`Size: ${event.metadata.fileSize} bytes`);
      }
      if (event.metadata.recordCount) {
        indicators.push(`Records: ${event.metadata.recordCount}`);
      }
    }

    return indicators;
  }

  /**
   * Clear old classifications
   */
  async clearOld(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let removed = 0;

    for (const [entityId, behaviors] of this.behaviors) {
      const filtered = behaviors.filter((b) => b.timestamp >= cutoffDate);
      if (filtered.length < behaviors.length) {
        removed += behaviors.length - filtered.length;
        if (filtered.length === 0) {
          this.behaviors.delete(entityId);
        } else {
          this.behaviors.set(entityId, filtered);
        }
      }
    }

    return removed;
  }

  /**
   * Get entity classification summary
   */
  async getEntitySummary(entityId: string): Promise<{
    entityId: string;
    totalBehaviors: number;
    categoryBreakdown: Record<string, number>;
    riskLevel: "low" | "medium" | "high" | "critical";
  }> {
    const behaviors = this.behaviors.get(entityId) || [];
    const counts = this.classifications.get(entityId) || {};

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    if (counts["critical"] || counts["data_exfiltration"] || counts["persistence"]) {
      riskLevel = "critical";
    } else if (
      counts["privilege_abuse"] ||
      counts["lateral_movement"] ||
      counts["suspicious"]
    ) {
      riskLevel = "high";
    } else if (counts["policy_violation"] || counts["reconnaissance"]) {
      riskLevel = "medium";
    }

    return {
      entityId,
      totalBehaviors: behaviors.length,
      categoryBreakdown: counts,
      riskLevel,
    };
  }
}

export default BehaviorClassifier;
