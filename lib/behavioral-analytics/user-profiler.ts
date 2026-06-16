/**
 * User Profiler - Creates and maintains user behavioral profiles
 */

export interface UserProfile {
  userId: string;
  name: string;
  department: string;
  role: string;
  createdAt: Date;
  lastUpdated: Date;
  riskProfile: {
    baselineRiskScore: number;
    historicalAnomalies: number;
    suspiciousBehaviors: number;
    trustedResources: string[];
    unusualPatterns: string[];
  };
  activityPatterns: {
    typicalAccessTimes: string[];
    frequentResources: string[];
    commonActions: string[];
    geographicLocations: string[];
  };
  connectionPatterns: {
    frequentContacts: string[];
    departmentConnections: Record<string, number>;
    externalConnections: string[];
  };
  metadata?: Record<string, unknown>;
}

export class UserProfiler {
  private profiles: Map<string, UserProfile> = new Map();
  private profileCache: Map<string, { data: UserProfile; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Build or update a user profile
   */
  async buildProfile(user: {
    id: string;
    name: string;
    department?: string;
  }): Promise<UserProfile> {
    const profile: UserProfile = {
      userId: user.id,
      name: user.name,
      department: user.department || "Unknown",
      role: this.inferRole(user.department),
      createdAt: new Date(),
      lastUpdated: new Date(),
      riskProfile: {
        baselineRiskScore: 0,
        historicalAnomalies: 0,
        suspiciousBehaviors: 0,
        trustedResources: [],
        unusualPatterns: [],
      },
      activityPatterns: {
        typicalAccessTimes: [],
        frequentResources: [],
        commonActions: [],
        geographicLocations: [],
      },
      connectionPatterns: {
        frequentContacts: [],
        departmentConnections: {},
        externalConnections: [],
      },
    };

    this.profiles.set(user.id, profile);
    this.invalidateCache(user.id);

    return profile;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    // Check cache first
    const cached = this.profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const profile = this.profiles.get(userId);
    if (profile) {
      this.profileCache.set(userId, { data: profile, timestamp: Date.now() });
    }

    return profile || null;
  }

  /**
   * Update activity patterns based on events
   */
  async updateActivityPatterns(
    userId: string,
    events: Array<{
      timestamp: Date;
      action: string;
      target: string;
      sourceLocation?: string;
    }>
  ): Promise<void> {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    // Extract time patterns
    const timePatterns = new Map<string, number>();
    const resourceAccess = new Map<string, number>();
    const actionCounts = new Map<string, number>();
    const locations = new Set<string>();

    for (const event of events) {
      const hour = event.timestamp.getHours();
      timePatterns.set(`${hour}:00`, (timePatterns.get(`${hour}:00`) || 0) + 1);

      resourceAccess.set(event.target, (resourceAccess.get(event.target) || 0) + 1);
      actionCounts.set(event.action, (actionCounts.get(event.action) || 0) + 1);

      if (event.sourceLocation) {
        locations.add(event.sourceLocation);
      }
    }

    // Update patterns
    profile.activityPatterns.typicalAccessTimes = Array.from(timePatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([time]) => time);

    profile.activityPatterns.frequentResources = Array.from(resourceAccess.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([resource]) => resource);

    profile.activityPatterns.commonActions = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action]) => action);

    profile.activityPatterns.geographicLocations = Array.from(locations);

    profile.lastUpdated = new Date();
    this.invalidateCache(userId);
  }

  /**
   * Update connection patterns
   */
  async updateConnectionPatterns(
    userId: string,
    connections: Array<{
      relatedUserId: string;
      department: string;
      isExternal: boolean;
      frequency: number;
    }>
  ): Promise<void> {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    profile.connectionPatterns.frequentContacts = connections
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)
      .map((c) => c.relatedUserId);

    const deptConnections: Record<string, number> = {};
    const externalConnections: string[] = [];

    for (const conn of connections) {
      if (conn.isExternal) {
        externalConnections.push(conn.relatedUserId);
      } else {
        deptConnections[conn.department] =
          (deptConnections[conn.department] || 0) + conn.frequency;
      }
    }

    profile.connectionPatterns.departmentConnections = deptConnections;
    profile.connectionPatterns.externalConnections = externalConnections;

    profile.lastUpdated = new Date();
    this.invalidateCache(userId);
  }

  /**
   * Update risk profile based on analysis
   */
  async updateRiskProfile(
    userId: string,
    riskData: {
      anomalyCount: number;
      suspiciousBehaviorCount: number;
      baselineScore: number;
      trustedResources?: string[];
      unusualPatterns?: string[];
    }
  ): Promise<void> {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    profile.riskProfile.historicalAnomalies = riskData.anomalyCount;
    profile.riskProfile.suspiciousBehaviors = riskData.suspiciousBehaviorCount;
    profile.riskProfile.baselineRiskScore = riskData.baselineScore;

    if (riskData.trustedResources) {
      profile.riskProfile.trustedResources = riskData.trustedResources;
    }

    if (riskData.unusualPatterns) {
      profile.riskProfile.unusualPatterns = riskData.unusualPatterns;
    }

    profile.lastUpdated = new Date();
    this.invalidateCache(userId);
  }

  /**
   * Compare current behavior to profile
   */
  async compareBehavior(
    userId: string,
    currentAction: string,
    currentTarget: string,
    currentTime: Date
  ): Promise<{
    isNormal: boolean;
    deviationScore: number;
    deviations: string[];
  }> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      return { isNormal: true, deviationScore: 0, deviations: [] };
    }

    const deviations: string[] = [];
    let deviationScore = 0;

    // Check time pattern
    const hour = currentTime.getHours();
    if (!profile.activityPatterns.typicalAccessTimes.some((t) => t.startsWith(`${hour}:`))) {
      deviations.push(`Access at unusual hour: ${hour}:00`);
      deviationScore += 10;
    }

    // Check action pattern
    if (!profile.activityPatterns.commonActions.includes(currentAction)) {
      deviations.push(`Unusual action type: ${currentAction}`);
      deviationScore += 15;
    }

    // Check resource access
    if (!profile.activityPatterns.frequentResources.includes(currentTarget)) {
      deviations.push(`Unusual resource access: ${currentTarget}`);
      deviationScore += 10;
    }

    return {
      isNormal: deviationScore < 20,
      deviationScore,
      deviations,
    };
  }

  /**
   * Infer user role from department
   */
  private inferRole(department?: string): string {
    if (!department) return "User";

    const deptLower = department.toLowerCase();
    if (deptLower.includes("admin")) return "Administrator";
    if (deptLower.includes("security")) return "Security";
    if (deptLower.includes("executive")) return "Executive";
    if (deptLower.includes("dev")) return "Developer";
    if (deptLower.includes("data")) return "Data Analyst";

    return "User";
  }

  /**
   * Invalidate cache for a user
   */
  private invalidateCache(userId: string): void {
    this.profileCache.delete(userId);
  }

  /**
   * Get all profiles (for bulk operations)
   */
  async getAllProfiles(): Promise<UserProfile[]> {
    return Array.from(this.profiles.values());
  }

  /**
   * Delete a profile
   */
  async deleteProfile(userId: string): Promise<void> {
    this.profiles.delete(userId);
    this.invalidateCache(userId);
  }
}

export default UserProfiler;
