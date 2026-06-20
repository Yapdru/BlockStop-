/**
 * Health Score Module
 * Calculates customer health scores
 */

export interface HealthScoreBreakdown {
  productAdoption: {
    score: number;
    teamActivation: number;
    featureUtilization: number;
    scanVolume: number;
    integrationCount: number;
  };
  supportEngagement: {
    score: number;
    ticketResponse: number;
    trainingCompletion: number;
    communityParticipation: number;
  };
  compliance: {
    score: number;
    policyCompliance: number;
    alertResponseTime: number;
    vulnerabilityPatching: number;
  };
  satisfaction: {
    score: number;
    npsScore: number;
    ticketRatings: number;
  };
  business: {
    score: number;
    paymentStatus: number;
    renewalProbability: number;
  };
}

export interface CustomerHealthScore {
  customerId: string;
  overallScore: number; // 0-100
  healthStatus: 'green' | 'yellow' | 'red';
  lastCalculated: Date;
  breakdown: HealthScoreBreakdown;
  trend: 'improving' | 'stable' | 'declining';
  riskFactors: string[];
  opportunities: string[];
}

export class HealthScoreCalculator {
  /**
   * Calculate comprehensive health score
   */
  calculateHealthScore(customerData: Record<string, any>): CustomerHealthScore {
    const breakdown = this.calculateBreakdown(customerData);
    const overallScore = this.calculateOverallScore(breakdown);
    const healthStatus = this.getHealthStatus(overallScore);
    const trend = this.calculateTrend(customerData);
    const riskFactors = this.identifyRiskFactors(customerData, breakdown);
    const opportunities = this.identifyOpportunities(customerData, breakdown);

    return {
      customerId: customerData.customerId,
      overallScore,
      healthStatus,
      lastCalculated: new Date(),
      breakdown,
      trend,
      riskFactors,
      opportunities,
    };
  }

  /**
   * Calculate score breakdown by category
   */
  private calculateBreakdown(data: Record<string, any>): HealthScoreBreakdown {
    // Product Adoption (30%)
    const teamActivation = this.calculateTeamActivation(data.teamStats);
    const featureUtilization = this.calculateFeatureUtilization(data.usageStats);
    const scanVolume = this.calculateScanVolume(data.scanStats);
    const integrationCount = this.calculateIntegrationScore(data.integrations?.length || 0);

    const productAdoption = {
      score: (teamActivation * 0.05 + featureUtilization * 0.1 + scanVolume * 0.1 + integrationCount * 0.05) / 0.3,
      teamActivation,
      featureUtilization,
      scanVolume,
      integrationCount,
    };

    // Support & Engagement (25%)
    const ticketResponse = this.calculateTicketResponseScore(data.supportStats);
    const trainingCompletion = this.calculateTrainingScore(data.trainingStats);
    const communityParticipation = this.calculateCommunityScore(data.communityStats);

    const supportEngagement = {
      score: (ticketResponse * 0.1 + trainingCompletion * 0.1 + communityParticipation * 0.05) / 0.25,
      ticketResponse,
      trainingCompletion,
      communityParticipation,
    };

    // Compliance & Security (20%)
    const policyCompliance = this.calculatePolicyCompliance(data.complianceStats);
    const alertResponseTime = this.calculateAlertResponseScore(data.alertStats);
    const vulnerabilityPatching = this.calculatePatchingScore(data.vulnerabilityStats);

    const compliance = {
      score: (policyCompliance * 0.1 + alertResponseTime * 0.1 + vulnerabilityPatching * 0.05) / 0.2,
      policyCompliance,
      alertResponseTime,
      vulnerabilityPatching,
    };

    // Satisfaction (15%)
    const npsScore = this.normalizeScore(data.npsScore || 0);
    const ticketRatings = this.calculateSatisfactionScore(data.supportRatings);

    const satisfaction = {
      score: (npsScore * 0.1 + ticketRatings * 0.05) / 0.15,
      npsScore,
      ticketRatings,
    };

    // Business Metrics (10%)
    const paymentStatus = this.calculatePaymentScore(data.paymentStatus);
    const renewalProbability = this.calculateRenewalScore(data.renewalData);

    const business = {
      score: (paymentStatus * 0.05 + renewalProbability * 0.05) / 0.1,
      paymentStatus,
      renewalProbability,
    };

    return {
      productAdoption,
      supportEngagement,
      compliance,
      satisfaction,
      business,
    };
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallScore(breakdown: HealthScoreBreakdown): number {
    const score =
      breakdown.productAdoption.score * 0.3 +
      breakdown.supportEngagement.score * 0.25 +
      breakdown.compliance.score * 0.2 +
      breakdown.satisfaction.score * 0.15 +
      breakdown.business.score * 0.1;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Get health status based on score
   */
  private getHealthStatus(score: number): 'green' | 'yellow' | 'red' {
    if (score > 70) return 'green';
    if (score >= 40) return 'yellow';
    return 'red';
  }

  /**
   * Calculate health score trend
   */
  private calculateTrend(data: Record<string, any>): 'improving' | 'stable' | 'declining' {
    if (!data.previousScore) return 'stable';

    const change = data.currentScore - data.previousScore;
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(data: Record<string, any>, breakdown: HealthScoreBreakdown): string[] {
    const risks: string[] = [];

    if (breakdown.business.paymentStatus < 50) {
      risks.push('Payment issues detected');
    }

    if (breakdown.business.renewalProbability < 40) {
      risks.push('Low renewal probability');
    }

    if (breakdown.satisfaction.npsScore < 40) {
      risks.push('Low customer satisfaction (NPS < 40)');
    }

    if (breakdown.supportEngagement.ticketResponse < 40) {
      risks.push('Poor support ticket response');
    }

    if (breakdown.productAdoption.featureUtilization < 30) {
      risks.push('Low feature adoption');
    }

    if (breakdown.compliance.alertResponseTime > 50) {
      risks.push('Slow alert response times');
    }

    return risks;
  }

  /**
   * Identify growth opportunities
   */
  private identifyOpportunities(data: Record<string, any>, breakdown: HealthScoreBreakdown): string[] {
    const opportunities: string[] = [];

    if (breakdown.productAdoption.integrationCount < 50) {
      opportunities.push('Opportunity to expand integrations');
    }

    if (breakdown.supportEngagement.trainingCompletion < 80) {
      opportunities.push('Recommend advanced training courses');
    }

    if (breakdown.productAdoption.scanVolume < 100) {
      opportunities.push('Encourage more frequent scans');
    }

    if (breakdown.supportEngagement.communityParticipation < 40) {
      opportunities.push('Invite participation in user community');
    }

    if (breakdown.productAdoption.teamActivation < 60) {
      opportunities.push('Expand team member onboarding');
    }

    return opportunities;
  }

  // Helper methods for score calculations
  private calculateTeamActivation(stats: any): number {
    if (!stats) return 0;
    const ratio = stats.activeMembers / stats.totalMembers;
    return Math.min(100, ratio * 100);
  }

  private calculateFeatureUtilization(stats: any): number {
    if (!stats) return 0;
    return Math.min(100, (stats.featuresUsed / stats.totalFeatures) * 100);
  }

  private calculateScanVolume(stats: any): number {
    if (!stats) return 0;
    const avgScansPerWeek = stats.totalScans / (stats.daysActive / 7);
    return Math.min(100, (avgScansPerWeek / 10) * 100);
  }

  private calculateIntegrationScore(count: number): number {
    return Math.min(100, (count / 15) * 100);
  }

  private calculateTicketResponseScore(stats: any): number {
    if (!stats || stats.avgResponseTime === undefined) return 50;
    const hoursResponse = stats.avgResponseTime / (60 * 60 * 1000);
    return Math.max(0, Math.min(100, 100 - hoursResponse * 5));
  }

  private calculateTrainingScore(stats: any): number {
    if (!stats) return 0;
    return Math.min(100, (stats.completedCourses / stats.availableCourses) * 100);
  }

  private calculateCommunityScore(stats: any): number {
    if (!stats) return 0;
    return Math.min(100, stats.participationLevel || 0);
  }

  private calculatePolicyCompliance(stats: any): number {
    if (!stats) return 50;
    return Math.min(100, stats.compliancePercentage || 0);
  }

  private calculateAlertResponseScore(stats: any): number {
    if (!stats) return 50;
    const avgResponseMinutes = stats.avgResponseTime / (60 * 1000);
    return Math.max(0, Math.min(100, 100 - avgResponseMinutes / 2));
  }

  private calculatePatchingScore(stats: any): number {
    if (!stats) return 50;
    const daysToPatched = stats.avgDaysToPatched || 30;
    return Math.max(0, Math.min(100, 100 - daysToPatched));
  }

  private normalizeScore(score: number): number {
    return Math.max(0, Math.min(100, score * 10));
  }

  private calculateSatisfactionScore(ratings: any): number {
    if (!ratings || ratings.length === 0) return 50;
    const avg = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
    return (avg / 5) * 100;
  }

  private calculatePaymentScore(status: string): number {
    switch (status) {
      case 'current':
        return 100;
      case 'late':
        return 40;
      case 'overdue':
        return 10;
      default:
        return 50;
    }
  }

  private calculateRenewalScore(data: any): number {
    if (!data) return 50;
    return data.renewalProbability || 50;
  }
}

export const healthScoreCalculator = new HealthScoreCalculator();
