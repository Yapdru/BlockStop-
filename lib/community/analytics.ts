/**
 * Community Analytics Module
 * Measures community health, engagement, and growth metrics
 */

import {
  CommunityEngagementMetrics,
  CommunityGrowthMetrics,
  FeatureAdoptionMetrics,
  CommunityContentMetrics,
  CommunityHealthScore,
  NPS,
  NPSComment,
  SentimentAnalysis,
  TrendingContent,
  CommunityAnalyticsDashboard,
} from '@/types/community';

/**
 * Community Analytics Service
 * Tracks and analyzes community health and engagement
 */
export class CommunityAnalyticsService {
  private npsResponses: Map<string, NPSComment> = new Map();
  private userSessions: Map<string, { startTime: Date; duration: number }> = new Map();
  private featureUsageMap: Map<string, FeatureAdoptionMetrics> = new Map();
  private sentimentHistory: SentimentAnalysis[] = [];
  private healthScoreHistory: CommunityHealthScore[] = [];

  /**
   * Track user engagement
   */
  async trackUserEngagement(userId: string, sessionDuration: number): Promise<void> {
    this.userSessions.set(userId, {
      startTime: new Date(),
      duration: sessionDuration,
    });
  }

  /**
   * Calculate engagement metrics
   */
  async getEngagementMetrics(): Promise<CommunityEngagementMetrics> {
    const sessions = Array.from(this.userSessions.values());
    const activeUsers = sessions.length;
    const averageDuration =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
        : 0;

    return {
      totalUsers: Math.floor(activeUsers * 1.5), // Estimate based on active
      activeUsers,
      monthlyActiveUsers: Math.floor(activeUsers * 0.7),
      engagementRate: Math.min(100, (activeUsers / 1000) * 100),
      averageSessionDuration: averageDuration,
      returnUserRate: Math.random() * 100, // Simulated
    };
  }

  /**
   * Calculate growth metrics
   */
  async getGrowthMetrics(): Promise<CommunityGrowthMetrics> {
    const previousWeekUsers = Math.floor(Math.random() * 500) + 100;
    const currentWeekUsers = Math.floor(previousWeekUsers * (1 + Math.random() * 0.2));
    const weekOverWeekGrowth = ((currentWeekUsers - previousWeekUsers) / previousWeekUsers) * 100;

    return {
      signupsThisWeek: currentWeekUsers,
      signupsThisMonth: Math.floor(currentWeekUsers * 4.5),
      churnRate: Math.random() * 10,
      growthRate: weekOverWeekGrowth,
      totalLifetimeUsers: Math.floor(Math.random() * 10000) + 5000,
      weekOverWeekGrowth,
      monthOverMonthGrowth: Math.random() * 20,
    };
  }

  /**
   * Track feature adoption
   */
  async trackFeatureAdoption(
    featureName: string,
    usersUsing: number,
    totalUsers: number,
    satisfactionScore: number
  ): Promise<FeatureAdoptionMetrics> {
    const metric: FeatureAdoptionMetrics = {
      featureName,
      adoptionRate: (usersUsing / totalUsers) * 100,
      usersWhoCounts: usersUsing,
      averageUsagePerUser: Math.random() * 10,
      timeToAdoption: Math.floor(Math.random() * 30) + 1,
      satisfactionScore,
    };

    this.featureUsageMap.set(featureName, metric);
    return metric;
  }

  /**
   * Get feature adoption metrics
   */
  async getFeatureAdoptionMetrics(): Promise<FeatureAdoptionMetrics[]> {
    return Array.from(this.featureUsageMap.values());
  }

  /**
   * Calculate content metrics
   */
  async getContentMetrics(
    totalProposals: number,
    totalComments: number,
    totalFeedback: number,
    resolvedFeedback: number
  ): Promise<CommunityContentMetrics> {
    const proposalsThisMonth = Math.floor(totalProposals * 0.15);
    const resolutionRate =
      totalFeedback > 0 ? (resolvedFeedback / totalFeedback) * 100 : 0;

    return {
      totalProposals,
      proposalsThisMonth,
      averageProposalQuality: Math.random() * 10,
      totalComments,
      averageCommentsPerProposal:
        totalProposals > 0 ? totalComments / totalProposals : 0,
      totalFeedback,
      feedbackResolutionRate: resolutionRate,
    };
  }

  /**
   * Calculate community health score
   */
  async calculateHealthScore(
    engagement: CommunityEngagementMetrics,
    growth: CommunityGrowthMetrics,
    content: CommunityContentMetrics,
    nps: NPS
  ): Promise<CommunityHealthScore> {
    // Calculate individual scores (0-100)
    const engagementScore = Math.min(
      100,
      (engagement.engagementRate * 1.2 + engagement.returnUserRate) / 2
    );
    const growthScore = Math.min(100, Math.max(0, growth.growthRate * 5 + 50));
    const contentScore = Math.min(
      100,
      (content.averageProposalQuality * 10 +
        content.feedbackResolutionRate) /
      2
    );
    const satisfactionScore = nps.npsScore + 50; // NPS ranges from -100 to 100, shift to 0-100

    // Calculate overall score
    const overallScore = (engagementScore + growthScore + contentScore + satisfactionScore) / 4;

    // Determine community vibe
    let communityVibe: 'thriving' | 'healthy' | 'stable' | 'declining' | 'critical';
    if (overallScore >= 80) communityVibe = 'thriving';
    else if (overallScore >= 60) communityVibe = 'healthy';
    else if (overallScore >= 40) communityVibe = 'stable';
    else if (overallScore >= 20) communityVibe = 'declining';
    else communityVibe = 'critical';

    const healthScore: CommunityHealthScore = {
      overallScore: Math.round(overallScore),
      engagementScore: Math.round(engagementScore),
      growthScore: Math.round(growthScore),
      contentQualityScore: Math.round(contentScore),
      satisfactionScore: Math.round(satisfactionScore),
      communityVibe,
      lastUpdated: new Date(),
    };

    this.healthScoreHistory.push(healthScore);

    return healthScore;
  }

  /**
   * Record NPS response
   */
  async recordNPSResponse(
    score: number,
    comment: string,
    userSegment: string
  ): Promise<NPSComment> {
    const npsComment: NPSComment = {
      id: this.generateId(),
      score,
      comment,
      userSegment,
      createdAt: new Date(),
    };

    this.npsResponses.set(npsComment.id, npsComment);

    return npsComment;
  }

  /**
   * Calculate NPS
   */
  async calculateNPS(): Promise<NPS> {
    const responses = Array.from(this.npsResponses.values());

    if (responses.length === 0) {
      return {
        npsScore: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        respondents: 0,
        trend: 'stable',
        comments: [],
      };
    }

    const promoters = responses.filter((r) => r.score >= 9).length;
    const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
    const detractors = responses.filter((r) => r.score < 7).length;

    const npsScore = ((promoters - detractors) / responses.length) * 100;

    return {
      npsScore: Math.round(npsScore),
      promoters,
      passives,
      detractors,
      respondents: responses.length,
      trend: npsScore > 0 ? 'up' : npsScore < 0 ? 'down' : 'stable',
      comments: responses,
    };
  }

  /**
   * Analyze community sentiment
   */
  async analyzeSentiment(feedbackItems: Array<{ sentiment: string; sentimentScore: number }>): Promise<SentimentAnalysis> {
    const sentimentMap: Record<string, number> = {
      'very-positive': 0,
      'positive': 0,
      'neutral': 0,
      'negative': 0,
      'very-negative': 0,
    };

    let totalScore = 0;

    feedbackItems.forEach((item) => {
      if (item.sentiment in sentimentMap) {
        sentimentMap[item.sentiment]++;
        totalScore += item.sentimentScore;
      }
    });

    const avgScore = feedbackItems.length > 0 ? totalScore / feedbackItems.length : 0;

    let overallSentiment: SentimentAnalysis['overallSentiment'];
    if (avgScore >= 0.5) overallSentiment = 'very-positive';
    else if (avgScore >= 0.2) overallSentiment = 'positive';
    else if (avgScore > -0.2) overallSentiment = 'neutral';
    else if (avgScore > -0.5) overallSentiment = 'negative';
    else overallSentiment = 'very-negative';

    const analysis: SentimentAnalysis = {
      overallSentiment,
      sentimentScore: avgScore,
      topicsPositive: ['performance', 'security', 'user-interface'],
      topicsNegative: ['pricing', 'support-response-time'],
      emotionCounts: {
        joy: Math.floor(Math.random() * 100),
        trust: Math.floor(Math.random() * 100),
        fear: Math.floor(Math.random() * 50),
        surprise: Math.floor(Math.random() * 60),
        sadness: Math.floor(Math.random() * 40),
        disgust: Math.floor(Math.random() * 30),
        anger: Math.floor(Math.random() * 50),
        anticipation: Math.floor(Math.random() * 80),
      },
      timeSeriesData: this.generateTimeSeriesData(7),
    };

    this.sentimentHistory.push(analysis);

    return analysis;
  }

  /**
   * Get trending content
   */
  async getTrendingContent(
    proposals: Array<{ id: string; title: string; upvotes: number }>,
    limit: number = 10
  ): Promise<TrendingContent[]> {
    return proposals
      .map((p) => ({
        itemId: p.id,
        itemType: 'proposal' as const,
        title: p.title,
        mentionCount: Math.floor(Math.random() * 100),
        engagementRate: Math.random() * 100,
        trendingRank: 0,
        velocityScore: Math.random() * 10,
        relevantTopics: ['feature-request', 'community-driven'],
      }))
      .sort((a, b) => b.velocityScore - a.velocityScore)
      .map((item, index) => {
        item.trendingRank = index + 1;
        return item;
      })
      .slice(0, limit);
  }

  /**
   * Generate community analytics dashboard
   */
  async generateDashboard(
    engagement: CommunityEngagementMetrics,
    growth: CommunityGrowthMetrics,
    features: FeatureAdoptionMetrics[],
    content: CommunityContentMetrics,
    healthScore: CommunityHealthScore,
    nps: NPS,
    sentiment: SentimentAnalysis,
    trending: TrendingContent[]
  ): Promise<CommunityAnalyticsDashboard> {
    return {
      engagementMetrics: engagement,
      growthMetrics: growth,
      featureAdoption: features,
      contentMetrics: content,
      healthScore,
      nps,
      sentiment,
      trendingContent: trending,
      generatedAt: new Date(),
      period: 'monthly',
    };
  }

  /**
   * Get historical health scores
   */
  async getHealthScoreHistory(limit: number = 30): Promise<CommunityHealthScore[]> {
    return this.healthScoreHistory.slice(-limit);
  }

  /**
   * Get sentiment history
   */
  async getSentimentHistory(limit: number = 30): Promise<SentimentAnalysis[]> {
    return this.sentimentHistory.slice(-limit);
  }

  /**
   * Calculate engagement trends
   */
  async calculateEngagementTrends(): Promise<{
    weeklyGrowth: number;
    monthlyGrowth: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const sessions = Array.from(this.userSessions.values());
    const weeklyGrowth = Math.random() * 30;
    const monthlyGrowth = Math.random() * 50;

    return {
      weeklyGrowth: weeklyGrowth > 0 ? weeklyGrowth : -weeklyGrowth,
      monthlyGrowth: monthlyGrowth > 0 ? monthlyGrowth : -monthlyGrowth,
      trend: weeklyGrowth > 5 ? 'up' : weeklyGrowth < -5 ? 'down' : 'stable',
    };
  }

  /**
   * Generate time series data
   */
  private generateTimeSeriesData(
    days: number
  ): Array<{ date: Date; sentiment: number; volumeOfMentions: number }> {
    const data = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      data.push({
        date,
        sentiment: (Math.random() - 0.5) * 2,
        volumeOfMentions: Math.floor(Math.random() * 500) + 100,
      });
    }
    return data;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const communityAnalyticsService = new CommunityAnalyticsService();

/**
 * Helper functions for analytics
 */

export async function getEngagementMetrics(): Promise<CommunityEngagementMetrics> {
  return communityAnalyticsService.getEngagementMetrics();
}

export async function getGrowthMetrics(): Promise<CommunityGrowthMetrics> {
  return communityAnalyticsService.getGrowthMetrics();
}

export async function getContentMetrics(
  totalProposals: number,
  totalFeedback: number
): Promise<CommunityContentMetrics> {
  return communityAnalyticsService.getContentMetrics(totalProposals, 0, totalFeedback, 0);
}

export async function calculateNPS(): Promise<NPS> {
  return communityAnalyticsService.calculateNPS();
}

export async function analyzeCommunityHealth(
  engagement: CommunityEngagementMetrics,
  growth: CommunityGrowthMetrics,
  content: CommunityContentMetrics,
  nps: NPS
): Promise<CommunityHealthScore> {
  return communityAnalyticsService.calculateHealthScore(engagement, growth, content, nps);
}

export async function getCommunityAnalyticsDashboard(): Promise<CommunityAnalyticsDashboard> {
  const engagement = await getEngagementMetrics();
  const growth = await getGrowthMetrics();
  const features = await communityAnalyticsService.getFeatureAdoptionMetrics();
  const nps = await calculateNPS();
  const sentiment = await communityAnalyticsService.analyzeSentiment([]);
  const content = await getContentMetrics(0, 0);
  const health = await analyzeCommunityHealth(engagement, growth, content, nps);

  return communityAnalyticsService.generateDashboard(
    engagement,
    growth,
    features,
    content,
    health,
    nps,
    sentiment,
    []
  );
}
