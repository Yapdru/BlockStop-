/**
 * Feedback System Module
 * Handles user feedback collection, sentiment analysis, and trend detection
 */

import {
  UserFeedback,
  FeedbackResponse,
  FeedbackTrend,
  BugReport,
} from '@/types/community';

/**
 * Feedback Management Service
 * Collects, analyzes, and tracks user feedback
 */
export class FeedbackService {
  private feedbackItems: Map<string, UserFeedback> = new Map();
  private bugReports: Map<string, BugReport> = new Map();
  private trends: Map<string, FeedbackTrend> = new Map();

  /**
   * Submit user feedback
   */
  async submitFeedback(
    userId: string,
    userEmail: string,
    feedbackType: UserFeedback['feedbackType'],
    title: string,
    description: string,
    category: string,
    tags: string[] = []
  ): Promise<UserFeedback> {
    const id = this.generateId();

    const sentiment = this.analyzeSentiment(description);

    const feedback: UserFeedback = {
      id,
      userId,
      userEmail,
      feedbackType,
      title,
      description,
      category,
      sentiment: sentiment.sentiment,
      sentimentScore: sentiment.score,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: [],
      tags,
      upvotes: 0,
      linkedProposalIds: [],
    };

    this.feedbackItems.set(id, feedback);

    // Update trends
    await this.updateTrends(feedback);

    // Notify team
    await this.notifyFeedbackReceived(feedback);

    return feedback;
  }

  /**
   * Get feedback by ID
   */
  async getFeedback(feedbackId: string): Promise<UserFeedback | null> {
    return this.feedbackItems.get(feedbackId) || null;
  }

  /**
   * Get all feedback with filters
   */
  async getFeedback(filters?: {
    type?: UserFeedback['feedbackType'];
    status?: UserFeedback['status'];
    category?: string;
    sentimentRange?: [number, number];
    sortBy?: 'recent' | 'upvotes' | 'sentiment';
    limit?: number;
    offset?: number;
  }): Promise<UserFeedback[]> {
    let feedback = Array.from(this.feedbackItems.values());

    // Apply filters
    if (filters?.type) {
      feedback = feedback.filter((f) => f.feedbackType === filters.type);
    }
    if (filters?.status) {
      feedback = feedback.filter((f) => f.status === filters.status);
    }
    if (filters?.category) {
      feedback = feedback.filter((f) => f.category === filters.category);
    }
    if (filters?.sentimentRange) {
      const [min, max] = filters.sentimentRange;
      feedback = feedback.filter((f) => f.sentimentScore >= min && f.sentimentScore <= max);
    }

    // Sort
    if (filters?.sortBy === 'recent') {
      feedback.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (filters?.sortBy === 'upvotes') {
      feedback.sort((a, b) => b.upvotes - a.upvotes);
    } else if (filters?.sortBy === 'sentiment') {
      feedback.sort((a, b) => Math.abs(b.sentimentScore) - Math.abs(a.sentimentScore));
    }

    // Paginate
    const start = filters?.offset || 0;
    const end = start + (filters?.limit || 20);

    return feedback.slice(start, end);
  }

  /**
   * Get feedback by type
   */
  async getFeedbackByType(type: UserFeedback['feedbackType']): Promise<UserFeedback[]> {
    return this.getFeedback({ type, limit: 100 });
  }

  /**
   * Get feedback by category
   */
  async getFeedbackByCategory(category: string): Promise<UserFeedback[]> {
    return this.getFeedback({ category, limit: 100 });
  }

  /**
   * Get feedback by status
   */
  async getFeedbackByStatus(status: UserFeedback['status']): Promise<UserFeedback[]> {
    return this.getFeedback({ status, limit: 100 });
  }

  /**
   * Update feedback status
   */
  async updateFeedbackStatus(
    feedbackId: string,
    status: UserFeedback['status']
  ): Promise<UserFeedback | null> {
    const feedback = this.feedbackItems.get(feedbackId);
    if (!feedback) return null;

    feedback.status = status;
    feedback.updatedAt = new Date();

    return feedback;
  }

  /**
   * Add response to feedback
   */
  async respondToFeedback(
    feedbackId: string,
    responder: string,
    content: string,
    isOfficial: boolean = true
  ): Promise<FeedbackResponse | null> {
    const feedback = this.feedbackItems.get(feedbackId);
    if (!feedback) return null;

    const response: FeedbackResponse = {
      id: this.generateId(),
      feedbackId,
      responder,
      content,
      createdAt: new Date(),
      isOfficial,
    };

    feedback.responses = feedback.responses || [];
    feedback.responses.push(response);
    feedback.updatedAt = new Date();

    await this.notifyFeedbackResponse(feedback, response);

    return response;
  }

  /**
   * Report a bug
   */
  async reportBug(
    userId: string,
    userEmail: string,
    title: string,
    description: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    reproductionSteps: string[],
    affectedVersions: string[]
  ): Promise<BugReport> {
    const feedback = await this.submitFeedback(
      userId,
      userEmail,
      'bug-report',
      title,
      description,
      'bugs',
      ['bug-report', severity]
    );

    const bugReport: BugReport = {
      id: this.generateId(),
      feedback,
      severity,
      reproductionSteps,
      affectedVersions,
      reproductionRate: 0,
    };

    this.bugReports.set(bugReport.id, bugReport);

    await this.notifyBugReported(bugReport);

    return bugReport;
  }

  /**
   * Get all bug reports
   */
  async getBugReports(filters?: {
    severity?: 'critical' | 'high' | 'medium' | 'low';
    status?: UserFeedback['status'];
  }): Promise<BugReport[]> {
    let reports = Array.from(this.bugReports.values());

    if (filters?.severity) {
      reports = reports.filter((r) => r.severity === filters.severity);
    }
    if (filters?.status) {
      reports = reports.filter((r) => r.feedback.status === filters.status);
    }

    return reports.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Upvote feedback
   */
  async upvoteFeedback(feedbackId: string, userId: string): Promise<UserFeedback | null> {
    const feedback = this.feedbackItems.get(feedbackId);
    if (!feedback) return null;

    feedback.upvotes++;
    feedback.updatedAt = new Date();

    return feedback;
  }

  /**
   * Link feedback to feature proposal
   */
  async linkToProposal(feedbackId: string, proposalId: string): Promise<UserFeedback | null> {
    const feedback = this.feedbackItems.get(feedbackId);
    if (!feedback) return null;

    if (!feedback.linkedProposalIds.includes(proposalId)) {
      feedback.linkedProposalIds.push(proposalId);
    }

    return feedback;
  }

  /**
   * Get trending feedback topics
   */
  async getTrendingTopics(limit: number = 10): Promise<FeedbackTrend[]> {
    const trends = Array.from(this.trends.values())
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, limit);

    return trends;
  }

  /**
   * Get feedback sentiment distribution
   */
  async getSentimentDistribution(): Promise<{
    veryPositive: number;
    positive: number;
    neutral: number;
    negative: number;
    veryNegative: number;
  }> {
    const feedback = Array.from(this.feedbackItems.values());

    return {
      veryPositive: feedback.filter((f) => f.sentiment === 'very-positive').length,
      positive: feedback.filter((f) => f.sentiment === 'positive').length,
      neutral: feedback.filter((f) => f.sentiment === 'neutral').length,
      negative: feedback.filter((f) => f.sentiment === 'negative').length,
      veryNegative: feedback.filter((f) => f.sentiment === 'very-negative').length,
    };
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(): Promise<{
    totalFeedback: number;
    openFeedback: number;
    resolutionRate: number;
    averageSentiment: number;
    categoryCounts: Record<string, number>;
    typeCounts: Record<string, number>;
  }> {
    const feedback = Array.from(this.feedbackItems.values());

    const openFeedback = feedback.filter((f) => f.status === 'open').length;
    const resolvedFeedback = feedback.filter((f) => f.status === 'resolved').length;
    const resolutionRate = feedback.length > 0 ? (resolvedFeedback / feedback.length) * 100 : 0;

    const averageSentiment =
      feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.sentimentScore, 0) / feedback.length
        : 0;

    const categoryCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    feedback.forEach((f) => {
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
      typeCounts[f.feedbackType] = (typeCounts[f.feedbackType] || 0) + 1;
    });

    return {
      totalFeedback: feedback.length,
      openFeedback,
      resolutionRate,
      averageSentiment,
      categoryCounts,
      typeCounts,
    };
  }

  /**
   * Analyze sentiment of text
   */
  private analyzeSentiment(text: string): { sentiment: UserFeedback['sentiment']; score: number } {
    const positiveWords = [
      'excellent',
      'great',
      'amazing',
      'wonderful',
      'fantastic',
      'love',
      'awesome',
      'perfect',
      'helpful',
      'useful',
    ];
    const negativeWords = [
      'terrible',
      'horrible',
      'awful',
      'useless',
      'hate',
      'bad',
      'poor',
      'worse',
      'broken',
      'crash',
    ];

    const lowerText = text.toLowerCase();
    let score = 0;

    positiveWords.forEach((word) => {
      if (lowerText.includes(word)) score += 0.2;
    });

    negativeWords.forEach((word) => {
      if (lowerText.includes(word)) score -= 0.2;
    });

    score = Math.max(-1, Math.min(1, score));

    let sentiment: UserFeedback['sentiment'];
    if (score >= 0.5) sentiment = 'very-positive';
    else if (score >= 0.2) sentiment = 'positive';
    else if (score > -0.2) sentiment = 'neutral';
    else if (score > -0.5) sentiment = 'negative';
    else sentiment = 'very-negative';

    return { sentiment, score };
  }

  /**
   * Update trending topics
   */
  private async updateTrends(feedback: UserFeedback): Promise<void> {
    const words = feedback.description.toLowerCase().split(/\s+/);
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'is',
      'are',
      'was',
      'were',
      'been',
      'be',
    ];

    words.forEach((word) => {
      if (word.length > 3 && !stopWords.includes(word)) {
        const trend = this.trends.get(word) || {
          topic: word,
          frequency: 0,
          sentiment: feedback.sentiment,
          growthTrend: 'stable',
          mentionCount: 0,
          relatedCategories: [],
        };

        trend.mentionCount++;
        trend.frequency++;

        if (!trend.relatedCategories.includes(feedback.category)) {
          trend.relatedCategories.push(feedback.category);
        }

        this.trends.set(word, trend);
      }
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify feedback received
   */
  private async notifyFeedbackReceived(feedback: UserFeedback): Promise<void> {
    console.log(`Feedback received: ${feedback.title} (${feedback.feedbackType})`);
  }

  /**
   * Notify feedback response
   */
  private async notifyFeedbackResponse(feedback: UserFeedback, response: FeedbackResponse): Promise<void> {
    console.log(`Response to feedback: ${feedback.title}`);
  }

  /**
   * Notify bug reported
   */
  private async notifyBugReported(bugReport: BugReport): Promise<void> {
    console.log(`Bug reported: ${bugReport.feedback.title} (${bugReport.severity})`);
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();

/**
 * Helper functions for feedback management
 */

export async function submitUserFeedback(
  userId: string,
  userEmail: string,
  feedbackType: UserFeedback['feedbackType'],
  title: string,
  description: string,
  category: string
): Promise<UserFeedback> {
  return feedbackService.submitFeedback(userId, userEmail, feedbackType, title, description, category);
}

export async function reportBug(
  userId: string,
  userEmail: string,
  title: string,
  description: string,
  severity: 'critical' | 'high' | 'medium' | 'low'
): Promise<BugReport> {
  return feedbackService.reportBug(userId, userEmail, title, description, severity, [], []);
}

export async function getAllFeedback(): Promise<UserFeedback[]> {
  return feedbackService.getFeedback({ limit: 1000 });
}

export async function getBugReports(): Promise<BugReport[]> {
  return feedbackService.getBugReports();
}

export async function getTrendingTopics(): Promise<FeedbackTrend[]> {
  return feedbackService.getTrendingTopics();
}

export async function getFeedbackStats() {
  return feedbackService.getFeedbackStats();
}

export async function getSentimentDistribution() {
  return feedbackService.getSentimentDistribution();
}
