/**
 * IOC Hunter - Indicator of Compromise hunting
 */

export interface IOCHunt {
  huntId: string;
  iocType: "ip" | "domain" | "hash" | "email" | "url";
  iocValue: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  firstSeen: Date;
  lastSeen?: Date;
  matches: number;
  matchedEntities: string[];
  context?: Record<string, unknown>;
}

export class IOCHunter {
  private hunts: Map<string, IOCHunt> = new Map();
  private iocIndex: Map<string, string[]> = new Map(); // Value -> Hunt IDs
  private entityMatches: Map<string, IOCHunt[]> = new Map();

  /**
   * Add IOC to hunt
   */
  async addIOC(
    iocType: string,
    iocValue: string,
    severity: string,
    source: string,
    context?: Record<string, unknown>
  ): Promise<IOCHunt> {
    const huntId = `ioc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const hunt: IOCHunt = {
      huntId,
      iocType: iocType as any,
      iocValue,
      severity: severity as any,
      source,
      firstSeen: new Date(),
      matches: 0,
      matchedEntities: [],
      context,
    };

    this.hunts.set(huntId, hunt);

    // Add to index
    const existing = this.iocIndex.get(iocValue) || [];
    existing.push(huntId);
    this.iocIndex.set(iocValue, existing);

    return hunt;
  }

  /**
   * Hunt for IOC in entity activities
   */
  async huntIOC(
    huntId: string,
    activities: Array<{
      entityId: string;
      data: string;
      timestamp: Date;
    }>
  ): Promise<{
    matches: number;
    entities: Set<string>;
  }> {
    const hunt = this.hunts.get(huntId);
    if (!hunt) {
      throw new Error(`Hunt ${huntId} not found`);
    }

    const matches = new Set<string>();
    let matchCount = 0;

    for (const activity of activities) {
      if (this.matchesIOC(hunt, activity.data)) {
        matches.add(activity.entityId);
        matchCount++;

        hunt.lastSeen = activity.timestamp;

        // Track in entity matches
        const entityHunts = this.entityMatches.get(activity.entityId) || [];
        entityHunts.push(hunt);
        this.entityMatches.set(activity.entityId, entityHunts);
      }
    }

    hunt.matches += matchCount;
    hunt.matchedEntities = Array.from(matches);

    return {
      matches: matchCount,
      entities: matches,
    };
  }

  /**
   * Hunt multiple IOCs
   */
  async huntMultipleIOCs(
    huntIds: string[],
    activities: Array<{
      entityId: string;
      data: string;
      timestamp: Date;
    }>
  ): Promise<{
    totalMatches: number;
    huntResults: Map<string, { matches: number; entities: Set<string> }>;
  }> {
    const results = new Map<string, { matches: number; entities: Set<string> }>();
    let totalMatches = 0;

    for (const huntId of huntIds) {
      const result = await this.huntIOC(huntId, activities);
      results.set(huntId, result);
      totalMatches += result.matches;
    }

    return { totalMatches, huntResults: results };
  }

  /**
   * Get IOC hunt details
   */
  async getIOCHunt(huntId: string): Promise<IOCHunt | null> {
    return this.hunts.get(huntId) || null;
  }

  /**
   * Get all active IOCs
   */
  async getActiveIOCs(): Promise<IOCHunt[]> {
    return Array.from(this.hunts.values()).filter((h) => h.matches > 0);
  }

  /**
   * Get entities with IOC matches
   */
  async getEntitiesWithMatches(entityId: string): Promise<IOCHunt[]> {
    return this.entityMatches.get(entityId) || [];
  }

  /**
   * Correlate IOCs
   */
  async correlateIOCs(): Promise<
    Array<{
      iocs: IOCHunt[];
      correlation: string;
      commonEntities: string[];
      severity: string;
    }>
  > {
    const correlations: Array<{
      iocs: IOCHunt[];
      correlation: string;
      commonEntities: string[];
      severity: string;
    }> = [];

    const hunts = Array.from(this.hunts.values());

    // Find hunts that match the same entities
    for (let i = 0; i < hunts.length; i++) {
      for (let j = i + 1; j < hunts.length; j++) {
        const commonEntities = hunts[i].matchedEntities.filter((e) =>
          hunts[j].matchedEntities.includes(e)
        );

        if (commonEntities.length > 0) {
          const maxSeverity = [hunts[i].severity, hunts[j].severity].sort().reverse()[0];
          correlations.push({
            iocs: [hunts[i], hunts[j]],
            correlation: `Both IOCs found on ${commonEntities.length} entities`,
            commonEntities,
            severity: maxSeverity,
          });
        }
      }
    }

    return correlations;
  }

  /**
   * Match IOC against data
   */
  private matchesIOC(hunt: IOCHunt, data: string): boolean {
    const value = hunt.iocValue.toLowerCase();
    const dataLower = data.toLowerCase();

    switch (hunt.iocType) {
      case "ip":
        return dataLower.includes(value);
      case "domain":
        return dataLower.includes(value);
      case "hash":
        return dataLower === value || dataLower.includes(value);
      case "email":
        return dataLower.includes(value);
      case "url":
        return dataLower.includes(value);
      default:
        return dataLower.includes(value);
    }
  }

  /**
   * Export IOC hunts
   */
  async exportIOCHunts(format: "json" | "csv" = "json"): Promise<string> {
    const hunts = Array.from(this.hunts.values());

    if (format === "json") {
      return JSON.stringify(hunts, null, 2);
    }

    // CSV format
    let csv = "HuntID,Type,Value,Severity,Matches,Source,LastSeen\n";
    for (const hunt of hunts) {
      csv += `"${hunt.huntId}","${hunt.iocType}","${hunt.iocValue}","${hunt.severity}",${hunt.matches},"${hunt.source}","${hunt.lastSeen?.toISOString() || "N/A"}"\n`;
    }

    return csv;
  }

  /**
   * Get IOC statistics
   */
  async getStatistics(): Promise<{
    totalIOCs: number;
    activeIOCs: number;
    totalMatches: number;
    affectedEntities: number;
    bySeverity: Record<string, number>;
  }> {
    const hunts = Array.from(this.hunts.values());
    const activeIOCs = hunts.filter((h) => h.matches > 0);

    const bySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const hunt of hunts) {
      bySeverity[hunt.severity]++;
    }

    const affectedEntities = new Set<string>();
    for (const hunt of hunts) {
      for (const entity of hunt.matchedEntities) {
        affectedEntities.add(entity);
      }
    }

    return {
      totalIOCs: hunts.length,
      activeIOCs: activeIOCs.length,
      totalMatches: hunts.reduce((sum, h) => sum + h.matches, 0),
      affectedEntities: affectedEntities.size,
      bySeverity,
    };
  }
}

export default IOCHunter;
