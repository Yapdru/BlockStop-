/**
 * Churn Prediction - User Churn Risk Analysis and Prediction
 * Predicts users at risk of churning and recommends retention actions
 */

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  riskFactors: string[];
  recommendedAction: string;
}

export interface ChurnFactor {
  factor: string;
  weight: number;
  impact: number;
}

export interface AtRiskUser {
  userId: string;
  churnProbability: number;
  daysSinceLastActivity: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  retentionActions: string[];
}

/**
 * Churn Prediction class for predicting user churn risk
 */
export class ChurnPrediction {
  private modelWeights: Map<string, number> = new Map();
  private factorThresholds: Map<string, number> = new Map();
  private trainingData: any[] = [];

  constructor() {
    this.initializeDefaultWeights();
    this.initializeThresholds();
  }

  /**
   * Predict churn probability for a specific user
   */
  async predictChurn(userId: string): Promise<ChurnPrediction> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get user metrics (in production, query from database)
      const userMetrics = await this.getUserMetrics(userId);

      if (!userMetrics) {
        throw new Error(`User ${userId} not found`);
      }

      // Calculate churn probability
      const churnProb = this.calculateChurnProbability(userMetrics);
      const riskFactors = this.identifyRiskFactors(userMetrics);
      const action = this.recommendRetentionAction(
        churnProb,
        riskFactors
      );

      return {
        userId,
        churnProbability: churnProb,
        riskFactors,
        recommendedAction: action,
      };
    } catch (error) {
      console.error('Churn prediction error:', error);
      throw error;
    }
  }

  /**
   * Identify all at-risk users above threshold
   */
  async identifyAtRiskUsers(threshold: number = 0.5): Promise<AtRiskUser[]> {
    try {
      if (threshold < 0 || threshold > 1) {
        throw new Error('Threshold must be between 0 and 1');
      }

      // In production, query all users from database
      const allUsers = await this.getAllUsers();

      const atRiskUsers: AtRiskUser[] = [];

      for (const user of allUsers) {
        const metrics = await this.getUserMetrics(user.id);
        if (!metrics) continue;

        const churnProb = this.calculateChurnProbability(metrics);

        if (churnProb >= threshold) {
          const riskLevel = this.determineRiskLevel(churnProb);
          const riskFactors = this.identifyRiskFactors(metrics);
          const actions = this.generateRetentionActions(riskFactors);

          atRiskUsers.push({
            userId: user.id,
            churnProbability: churnProb,
            daysSinceLastActivity: metrics.daysSinceLastActivity || 0,
            riskLevel,
            retentionActions: actions,
          });
        }
      }

      // Sort by churn probability (highest first)
      return atRiskUsers.sort(
        (a, b) => b.churnProbability - a.churnProbability
      );
    } catch (error) {
      console.error('At-risk user identification error:', error);
      throw error;
    }
  }

  /**
   * Get churn factors and their weights for a user
   */
  async getChurnFactors(userId: string): Promise<ChurnFactor[]> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const userMetrics = await this.getUserMetrics(userId);

      if (!userMetrics) {
        throw new Error(`User ${userId} not found`);
      }

      const factors: ChurnFactor[] = [];

      // Calculate impact of each factor
      const factorImpacts = {
        inactivity: this.calculateInactivityImpact(
          userMetrics.daysSinceLastActivity
        ),
        lowEngagement: this.calculateEngagementImpact(
          userMetrics.engagementScore
        ),
        supportTickets: this.calculateSupportImpact(
          userMetrics.unResolvedTickets
        ),
        planDowngrade: userMetrics.recentDowngrade ? 0.15 : 0,
        lowUsage: this.calculateUsageImpact(userMetrics.featureUsage),
      };

      // Add factors above threshold
      for (const [factor, impact] of Object.entries(factorImpacts)) {
        if (impact > 0) {
          const weight = this.modelWeights.get(factor) || 0.1;
          factors.push({
            factor,
            weight,
            impact,
          });
        }
      }

      // Sort by impact
      return factors.sort((a, b) => b.impact - a.impact);
    } catch (error) {
      console.error('Get churn factors error:', error);
      throw error;
    }
  }

  /**
   * Calculate churn probability using weighted factors
   */
  private calculateChurnProbability(userMetrics: any): number {
    let probability = 0;

    // Inactivity factor (highest weight)
    const inactivityImpact = this.calculateInactivityImpact(
      userMetrics.daysSinceLastActivity
    );
    probability += (this.modelWeights.get('inactivity') || 0.3) * inactivityImpact;

    // Engagement factor
    const engagementImpact = this.calculateEngagementImpact(
      userMetrics.engagementScore
    );
    probability +=
      (this.modelWeights.get('lowEngagement') || 0.25) * engagementImpact;

    // Support tickets factor
    const supportImpact = this.calculateSupportImpact(
      userMetrics.unResolvedTickets
    );
    probability +=
      (this.modelWeights.get('supportTickets') || 0.2) * supportImpact;

    // Plan downgrade factor
    if (userMetrics.recentDowngrade) {
      probability += this.modelWeights.get('planDowngrade') || 0.15;
    }

    // Feature usage factor
    const usageImpact = this.calculateUsageImpact(
      userMetrics.featureUsage
    );
    probability += (this.modelWeights.get('lowUsage') || 0.1) * usageImpact;

    // Clamp probability between 0 and 1
    return Math.min(1, Math.max(0, probability));
  }

  /**
   * Identify specific risk factors for a user
   */
  private identifyRiskFactors(userMetrics: any): string[] {
    const factors: string[] = [];

    if (userMetrics.daysSinceLastActivity > 30) {
      factors.push('Inactive for over 30 days');
    }

    if (userMetrics.engagementScore < 30) {
      factors.push('Low engagement score');
    }

    if (userMetrics.unResolvedTickets > 2) {
      factors.push('Multiple unresolved support tickets');
    }

    if (userMetrics.recentDowngrade) {
      factors.push('Recent plan downgrade');
    }

    if (userMetrics.featureUsage < 0.3) {
      factors.push('Using less than 30% of features');
    }

    if (userMetrics.paymentFailures > 0) {
      factors.push('Recent payment failures');
    }

    if (userMetrics.apiCallsPerDay < 10) {
      factors.push('Very low API usage');
    }

    return factors;
  }

  /**
   * Recommend retention action based on churn probability
   */
  private recommendRetentionAction(
    churnProb: number,
    riskFactors: string[]
  ): string {
    if (churnProb > 0.8) {
      return 'Immediate: Schedule urgent call with customer success team';
    } else if (churnProb > 0.6) {
      return 'High: Offer plan incentive or personal support session';
    } else if (churnProb > 0.4) {
      return 'Medium: Send personalized feature recommendations';
    } else {
      return 'Low: Maintain regular engagement';
    }
  }

  /**
   * Generate specific retention actions
   */
  private generateRetentionActions(riskFactors: string[]): string[] {
    const actions: string[] = [];

    if (
      riskFactors.includes('Inactive for over 30 days') ||
      riskFactors.includes('Low engagement score')
    ) {
      actions.push('Send re-engagement email with product updates');
    }

    if (riskFactors.includes('Multiple unresolved support tickets')) {
      actions.push('Assign dedicated support specialist');
    }

    if (riskFactors.includes('Recent plan downgrade')) {
      actions.push('Offer loyalty discount or premium features trial');
    }

    if (riskFactors.includes('Using less than 30% of features')) {
      actions.push('Provide personalized onboarding for unused features');
    }

    if (riskFactors.includes('Recent payment failures')) {
      actions.push('Update payment method and offer flexible payment plan');
    }

    return actions;
  }

  /**
   * Calculate inactivity impact (0-1)
   */
  private calculateInactivityImpact(daysSinceLastActivity: number): number {
    if (daysSinceLastActivity < 7) return 0;
    if (daysSinceLastActivity < 30) return 0.3;
    if (daysSinceLastActivity < 60) return 0.6;
    if (daysSinceLastActivity < 90) return 0.8;
    return 1;
  }

  /**
   * Calculate engagement impact (0-1)
   */
  private calculateEngagementImpact(engagementScore: number): number {
    // Score is 0-100
    if (engagementScore > 70) return 0;
    if (engagementScore > 50) return 0.2;
    if (engagementScore > 30) return 0.5;
    return 1;
  }

  /**
   * Calculate support tickets impact (0-1)
   */
  private calculateSupportImpact(unResolvedTickets: number): number {
    return Math.min(1, unResolvedTickets * 0.2);
  }

  /**
   * Calculate usage impact (0-1)
   */
  private calculateUsageImpact(featureUsagePercent: number): number {
    // Usage is 0-1 (0-100%)
    if (featureUsagePercent > 0.7) return 0;
    if (featureUsagePercent > 0.5) return 0.2;
    if (featureUsagePercent > 0.3) return 0.5;
    return 0.8;
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(
    churnProb: number
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (churnProb > 0.8) return 'critical';
    if (churnProb > 0.6) return 'high';
    if (churnProb > 0.4) return 'medium';
    return 'low';
  }

  /**
   * Get user metrics (mock implementation)
   */
  private async getUserMetrics(userId: string): Promise<any> {
    // In production, query from database
    return {
      id: userId,
      daysSinceLastActivity: Math.floor(Math.random() * 100),
      engagementScore: Math.floor(Math.random() * 100),
      unResolvedTickets: Math.floor(Math.random() * 5),
      recentDowngrade: Math.random() > 0.8,
      featureUsage: Math.random(),
      paymentFailures: Math.floor(Math.random() * 2),
      apiCallsPerDay: Math.floor(Math.random() * 1000),
    };
  }

  /**
   * Get all users (mock implementation)
   */
  private async getAllUsers(): Promise<any[]> {
    // In production, query from database
    return [
      { id: 'user_1' },
      { id: 'user_2' },
      { id: 'user_3' },
      { id: 'user_4' },
      { id: 'user_5' },
    ];
  }

  /**
   * Initialize default model weights
   */
  private initializeDefaultWeights(): void {
    this.modelWeights.set('inactivity', 0.3);
    this.modelWeights.set('lowEngagement', 0.25);
    this.modelWeights.set('supportTickets', 0.2);
    this.modelWeights.set('planDowngrade', 0.15);
    this.modelWeights.set('lowUsage', 0.1);
  }

  /**
   * Initialize thresholds
   */
  private initializeThresholds(): void {
    this.factorThresholds.set('inactivityDays', 30);
    this.factorThresholds.set('engagementScore', 30);
    this.factorThresholds.set('unResolvedTickets', 2);
    this.factorThresholds.set('featureUsagePercent', 0.3);
  }
}

export default ChurnPrediction;
