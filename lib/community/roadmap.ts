/**
 * Public Roadmap Module
 * Manages transparent development planning and community feature integration
 */

import {
  RoadmapQuarter,
  RoadmapMilestone,
  RoadmapFeature,
  RoadmapRelease,
} from '@/types/community';

/**
 * Roadmap Management Service
 * Handles quarterly planning, milestones, and feature timelines
 */
export class RoadmapService {
  private quarters: Map<string, RoadmapQuarter> = new Map();
  private features: Map<string, RoadmapFeature> = new Map();
  private releases: Map<string, RoadmapRelease> = new Map();

  /**
   * Create a new quarterly roadmap
   */
  async createQuarter(
    year: number,
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    startDate: Date,
    endDate: Date
  ): Promise<RoadmapQuarter> {
    const key = `${year}-${quarter}`;

    const roadmapQuarter: RoadmapQuarter = {
      year,
      quarter,
      startDate,
      endDate,
      milestones: [],
    };

    this.quarters.set(key, roadmapQuarter);
    return roadmapQuarter;
  }

  /**
   * Add milestone to a quarter
   */
  async addMilestone(
    year: number,
    quarterLetter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    title: string,
    description: string,
    targetDate: Date,
    features: string[],
    priority: 'critical' | 'high' | 'medium' | 'low' = 'high'
  ): Promise<RoadmapMilestone> {
    const key = `${year}-${quarterLetter}`;
    const quarter = this.quarters.get(key);

    if (!quarter) {
      throw new Error(`Quarter ${key} not found`);
    }

    const milestone: RoadmapMilestone = {
      id: this.generateId(),
      title,
      description,
      targetDate,
      status: 'not-started',
      completionPercentage: 0,
      features,
      priority,
      communityRequestCount: 0,
    };

    quarter.milestones.push(milestone);
    return milestone;
  }

  /**
   * Update milestone status and progress
   */
  async updateMilestoneProgress(
    milestoneId: string,
    status: RoadmapMilestone['status'],
    completionPercentage: number
  ): Promise<RoadmapMilestone | null> {
    for (const quarter of this.quarters.values()) {
      const milestone = quarter.milestones.find((m) => m.id === milestoneId);
      if (milestone) {
        milestone.status = status;
        milestone.completionPercentage = Math.min(100, Math.max(0, completionPercentage));
        return milestone;
      }
    }
    return null;
  }

  /**
   * Add a feature to the roadmap
   */
  async addFeature(
    title: string,
    description: string,
    status: RoadmapFeature['status'] = 'backlog',
    priority: 'critical' | 'high' | 'medium' | 'low' = 'medium',
    estimatedDate?: Date
  ): Promise<RoadmapFeature> {
    const feature: RoadmapFeature = {
      id: this.generateId(),
      title,
      description,
      status,
      priority,
      estimatedDate,
      communityVotes: 0,
      linkedProposalIds: [],
    };

    this.features.set(feature.id, feature);
    return feature;
  }

  /**
   * Update feature details
   */
  async updateFeature(
    featureId: string,
    updates: Partial<RoadmapFeature>
  ): Promise<RoadmapFeature | null> {
    const feature = this.features.get(featureId);
    if (!feature) return null;

    Object.assign(feature, updates);
    return feature;
  }

  /**
   * Link community proposal to roadmap feature
   */
  async linkProposalToFeature(featureId: string, proposalId: string): Promise<RoadmapFeature | null> {
    const feature = this.features.get(featureId);
    if (!feature) return null;

    if (!feature.linkedProposalIds.includes(proposalId)) {
      feature.linkedProposalIds.push(proposalId);
      feature.communityVotes++;
    }

    return feature;
  }

  /**
   * Get all roadmap quarters
   */
  async getAllQuarters(): Promise<RoadmapQuarter[]> {
    return Array.from(this.quarters.values()).sort(
      (a, b) => a.year - b.year || parseInt(a.quarter.substring(1)) - parseInt(b.quarter.substring(1))
    );
  }

  /**
   * Get specific quarter
   */
  async getQuarter(year: number, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): Promise<RoadmapQuarter | null> {
    return this.quarters.get(`${year}-${quarter}`) || null;
  }

  /**
   * Get current and upcoming quarters
   */
  async getUpcomingQuarters(limit: number = 4): Promise<RoadmapQuarter[]> {
    const now = new Date();
    const allQuarters = Array.from(this.quarters.values()).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return allQuarters.filter((q) => new Date(q.startDate).getTime() >= now.getTime()).slice(0, limit);
  }

  /**
   * Get all roadmap features
   */
  async getAllFeatures(): Promise<RoadmapFeature[]> {
    return Array.from(this.features.values());
  }

  /**
   * Get features by status
   */
  async getFeaturesByStatus(status: RoadmapFeature['status']): Promise<RoadmapFeature[]> {
    return Array.from(this.features.values()).filter((f) => f.status === status);
  }

  /**
   * Get features by priority
   */
  async getFeaturesByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): Promise<RoadmapFeature[]> {
    return Array.from(this.features.values()).filter((f) => f.priority === priority);
  }

  /**
   * Get most requested features
   */
  async getMostRequestedFeatures(limit: number = 10): Promise<RoadmapFeature[]> {
    return Array.from(this.features.values())
      .sort((a, b) => b.communityVotes - a.communityVotes)
      .slice(0, limit);
  }

  /**
   * Create a release
   */
  async createRelease(
    version: string,
    releasedAt: Date,
    highlights: string[],
    features: string[],
    bugFixes: string[] = [],
    performanceImprovements: string[] = [],
    securityUpdates: string[] = []
  ): Promise<RoadmapRelease> {
    const release: RoadmapRelease = {
      version,
      releasedAt,
      highlights,
      features,
      bugFixes,
      performanceImprovements,
      securityUpdates,
    };

    this.releases.set(version, release);

    // Mark features as released
    for (const featureId of features) {
      const feature = this.features.get(featureId);
      if (feature) {
        feature.status = 'released';
        feature.releaseDate = releasedAt;
      }
    }

    return release;
  }

  /**
   * Get release notes
   */
  async getReleaseNotes(version?: string): Promise<RoadmapRelease | RoadmapRelease[]> {
    if (version) {
      const release = this.releases.get(version);
      return release || { version: '', releasedAt: new Date(), highlights: [], features: [] };
    }

    return Array.from(this.releases.values()).sort(
      (a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime()
    );
  }

  /**
   * Get roadmap summary for given timeframe
   */
  async getRoadmapSummary(months: number = 12): Promise<{
    quarters: RoadmapQuarter[];
    totalFeatures: number;
    plannedFeatures: number;
    inProgressFeatures: number;
    completedFeatures: number;
    overallProgress: number;
  }> {
    const allQuarters = await this.getUpcomingQuarters(Math.ceil(months / 3));

    const allFeatures = Array.from(this.features.values());
    const plannedFeatures = allFeatures.filter((f) => f.status === 'planned').length;
    const inProgressFeatures = allFeatures.filter((f) => f.status === 'in-progress').length;
    const completedFeatures = allFeatures.filter((f) => f.status === 'completed').length;

    const overallProgress =
      allFeatures.length > 0
        ? (completedFeatures / allFeatures.length) * 100
        : 0;

    return {
      quarters: allQuarters,
      totalFeatures: allFeatures.length,
      plannedFeatures,
      inProgressFeatures,
      completedFeatures,
      overallProgress,
    };
  }

  /**
   * Calculate roadmap completion percentage
   */
  async getQuarterCompletion(year: number, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): Promise<number> {
    const roadmapQuarter = await this.getQuarter(year, quarter);
    if (!roadmapQuarter) return 0;

    if (roadmapQuarter.milestones.length === 0) return 0;

    const totalCompletion = roadmapQuarter.milestones.reduce(
      (sum, m) => sum + m.completionPercentage,
      0
    );

    return Math.round(totalCompletion / roadmapQuarter.milestones.length);
  }

  /**
   * Get feature dependencies
   */
  async getFeatureDependencies(featureId: string): Promise<RoadmapFeature[]> {
    const feature = this.features.get(featureId);
    if (!feature || !feature.dependencies) return [];

    return feature.dependencies
      .map((depId) => this.features.get(depId))
      .filter((f) => f !== undefined) as RoadmapFeature[];
  }

  /**
   * Search features in roadmap
   */
  async searchFeatures(query: string): Promise<RoadmapFeature[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.features.values()).filter(
      (f) =>
        f.title.toLowerCase().includes(lowerQuery) ||
        f.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get roadmap timeline
   */
  async getRoadmapTimeline(): Promise<Array<{
    date: Date;
    milestone: RoadmapMilestone;
    features: RoadmapFeature[];
  }>> {
    const timeline: Array<{
      date: Date;
      milestone: RoadmapMilestone;
      features: RoadmapFeature[];
    }> = [];

    for (const quarter of this.quarters.values()) {
      for (const milestone of quarter.milestones) {
        const milestoneFeatures = milestone.features
          .map((fId) => this.features.get(fId))
          .filter((f) => f !== undefined) as RoadmapFeature[];

        timeline.push({
          date: milestone.targetDate,
          milestone,
          features: milestoneFeatures,
        });
      }
    }

    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const roadmapService = new RoadmapService();

/**
 * Helper functions for roadmap management
 */

export async function getAllRoadmaps(): Promise<RoadmapQuarter[]> {
  return roadmapService.getAllQuarters();
}

export async function getUpcomingRoadmap(months: number = 12): Promise<RoadmapQuarter[]> {
  return roadmapService.getUpcomingQuarters(Math.ceil(months / 3));
}

export async function getRoadmapFeatures(): Promise<RoadmapFeature[]> {
  return roadmapService.getAllFeatures();
}

export async function getReleaseHistory(): Promise<RoadmapRelease[]> {
  const releases = await roadmapService.getReleaseNotes();
  return Array.isArray(releases) ? releases : [releases];
}

export async function searchRoadmapFeatures(query: string): Promise<RoadmapFeature[]> {
  return roadmapService.searchFeatures(query);
}

export async function getRoadmapOverview(months?: number) {
  return roadmapService.getRoadmapSummary(months);
}
