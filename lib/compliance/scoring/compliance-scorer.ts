/**
 * Compliance Scorer - Calculates compliance scores based on control status
 * Provides risk-weighted scoring and gap analysis
 */

import {
  ComplianceFrameworkType,
  ComplianceScore,
  CategoryScore,
  ControlStatus,
  ComplianceControl,
  SeverityLevel,
} from '../types/compliance-types';

export class ComplianceScorer {
  /**
   * Status weight mapping - how many points each status is worth
   */
  private statusWeights: Record<ControlStatus, number> = {
    [ControlStatus.NOT_STARTED]: 0,
    [ControlStatus.IN_PROGRESS]: 25,
    [ControlStatus.IMPLEMENTED]: 50,
    [ControlStatus.TESTED]: 75,
    [ControlStatus.COMPLIANT]: 100,
    [ControlStatus.NON_COMPLIANT]: 0,
    [ControlStatus.EXCEPTION_GRANTED]: 80,
    [ControlStatus.REMEDIATION_PLANNED]: 40,
  };

  /**
   * Severity weight multiplier
   */
  private severityWeights: Record<SeverityLevel, number> = {
    [SeverityLevel.CRITICAL]: 4,
    [SeverityLevel.HIGH]: 3,
    [SeverityLevel.MEDIUM]: 2,
    [SeverityLevel.LOW]: 1,
    [SeverityLevel.INFORMATIONAL]: 0.5,
  };

  /**
   * Calculate compliance score for a set of controls
   */
  calculateScore(
    controls: ComplianceControl[],
    controlStatuses: Map<string, ControlStatus>,
    useRiskWeighting: boolean = false
  ): ComplianceScore {
    if (controls.length === 0) {
      throw new Error('No controls provided for scoring');
    }

    const categoryScores = new Map<string, CategoryScore>();
    const controlStatusDistribution = new Map<ControlStatus, number>();

    // Initialize status distribution
    Object.values(ControlStatus).forEach((status) => {
      controlStatusDistribution.set(status, 0);
    });

    let totalScore = 0;
    let maxScore = 0;
    const categoryControlCount = new Map<string, number>();

    // Process each control
    controls.forEach((control) => {
      const status = controlStatuses.get(control.id) || ControlStatus.NOT_STARTED;

      // Update status distribution
      const statusCount = controlStatusDistribution.get(status) || 0;
      controlStatusDistribution.set(status, statusCount + 1);

      // Get base points
      let points = this.statusWeights[status];

      // Apply risk weighting if enabled
      if (useRiskWeighting) {
        const weightMultiplier =
          this.severityWeights[control.severity] || 1;
        points = points * weightMultiplier;
        maxScore += 100 * weightMultiplier;
      } else {
        maxScore += 100;
      }

      totalScore += points;

      // Category scoring
      const category = control.category;
      if (!categoryScores.has(category)) {
        categoryScores.set(category, {
          category,
          score: 0,
          maxScore: 0,
          percentage: 0,
          controlCount: 0,
          compliantCount: 0,
          nonCompliantCount: 0,
        });
      }

      const catScore = categoryScores.get(category)!;
      catScore.controlCount++;

      if (useRiskWeighting) {
        const weight = this.severityWeights[control.severity] || 1;
        catScore.maxScore += 100 * weight;
        catScore.score += points;
      } else {
        catScore.maxScore += 100;
        catScore.score += points;
      }

      if (status === ControlStatus.COMPLIANT) {
        catScore.compliantCount++;
      } else if (status === ControlStatus.NON_COMPLIANT) {
        catScore.nonCompliantCount++;
      }
    });

    // Calculate category percentages
    categoryScores.forEach((catScore) => {
      catScore.percentage = (catScore.score / catScore.maxScore) * 100;
    });

    const overallPercentage = (totalScore / maxScore) * 100;

    return {
      frameworkId: '',
      totalScore: Math.round(totalScore),
      maxScore: Math.round(maxScore),
      percentage: Math.round(overallPercentage * 10) / 10,
      categoryScores,
      controlStatusDistribution,
      trend: 'STABLE',
      calculatedAt: new Date(),
      reportingPeriod: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      },
    };
  }

  /**
   * Calculate trend by comparing two scores
   */
  calculateTrend(
    previousScore: number,
    currentScore: number
  ): 'IMPROVING' | 'STABLE' | 'DECLINING' {
    const difference = currentScore - previousScore;
    const tolerance = 2; // 2% tolerance

    if (Math.abs(difference) <= tolerance) {
      return 'STABLE';
    } else if (difference > 0) {
      return 'IMPROVING';
    } else {
      return 'DECLINING';
    }
  }

  /**
   * Identify compliance gaps
   */
  identifyGaps(
    controls: ComplianceControl[],
    controlStatuses: Map<string, ControlStatus>,
    threshold: number = 80
  ): ComplianceControl[] {
    const score = this.calculateScore(controls, controlStatuses);

    if (score.percentage >= threshold) {
      return [];
    }

    // Find non-compliant controls
    return controls.filter((control) => {
      const status = controlStatuses.get(control.id) || ControlStatus.NOT_STARTED;
      return (
        status === ControlStatus.NON_COMPLIANT ||
        status === ControlStatus.NOT_STARTED
      );
    });
  }

  /**
   * Get critical controls (those with critical/high severity)
   */
  getCriticalControls(controls: ComplianceControl[]): ComplianceControl[] {
    return controls.filter(
      (control) =>
        control.severity === SeverityLevel.CRITICAL ||
        control.severity === SeverityLevel.HIGH
    );
  }

  /**
   * Calculate remediation priority
   */
  calculateRemediationPriority(
    controls: ComplianceControl[],
    controlStatuses: Map<string, ControlStatus>
  ): {
    controlId: string;
    controlNumber: string;
    title: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedEffort: number;
  }[] {
    const gaps = this.identifyGaps(controls, controlStatuses, 100);

    return gaps
      .map((control) => {
        let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

        if (control.severity === SeverityLevel.CRITICAL) {
          priority = 'CRITICAL';
        } else if (
          control.severity === SeverityLevel.HIGH ||
          control.criticality === 'CRITICAL'
        ) {
          priority = 'HIGH';
        } else if (control.severity === SeverityLevel.MEDIUM) {
          priority = 'MEDIUM';
        }

        return {
          controlId: control.id,
          controlNumber: control.controlNumber,
          title: control.title,
          priority,
          estimatedEffort: control.estimatedHoursToImplement,
        };
      })
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          CRITICAL: 0,
          HIGH: 1,
          MEDIUM: 2,
          LOW: 3,
        };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  /**
   * Compare two compliance scores
   */
  compareScores(
    score1: ComplianceScore,
    score2: ComplianceScore
  ): {
    scoreImprovement: number;
    percentageImprovement: number;
    categoriesImproved: string[];
    categoriesDeclined: string[];
  } {
    const scoreImprovement = score2.totalScore - score1.totalScore;
    const percentageImprovement = score2.percentage - score1.percentage;

    const categoriesImproved: string[] = [];
    const categoriesDeclined: string[] = [];

    score2.categoryScores.forEach((cat2, category) => {
      const cat1 = score1.categoryScores.get(category);
      if (cat1) {
        if (cat2.percentage > cat1.percentage) {
          categoriesImproved.push(category);
        } else if (cat2.percentage < cat1.percentage) {
          categoriesDeclined.push(category);
        }
      }
    });

    return {
      scoreImprovement,
      percentageImprovement,
      categoriesImproved,
      categoriesDeclined,
    };
  }

  /**
   * Get score breakdown by severity
   */
  getScoreBreakdownBySeverity(
    controls: ComplianceControl[],
    controlStatuses: Map<string, ControlStatus>
  ): Record<SeverityLevel, { controls: number; compliant: number; score: number }> {
    const breakdown: Record<
      SeverityLevel,
      { controls: number; compliant: number; score: number }
    > = {
      [SeverityLevel.CRITICAL]: { controls: 0, compliant: 0, score: 0 },
      [SeverityLevel.HIGH]: { controls: 0, compliant: 0, score: 0 },
      [SeverityLevel.MEDIUM]: { controls: 0, compliant: 0, score: 0 },
      [SeverityLevel.LOW]: { controls: 0, compliant: 0, score: 0 },
      [SeverityLevel.INFORMATIONAL]: { controls: 0, compliant: 0, score: 0 },
    };

    controls.forEach((control) => {
      const status = controlStatuses.get(control.id) || ControlStatus.NOT_STARTED;
      const severity = control.severity;

      breakdown[severity].controls++;
      if (status === ControlStatus.COMPLIANT) {
        breakdown[severity].compliant++;
      }
      breakdown[severity].score += this.statusWeights[status];
    });

    return breakdown;
  }

  /**
   * Get implementation recommendation
   */
  getImplementationRecommendation(
    controls: ComplianceControl[],
    controlStatuses: Map<string, ControlStatus>
  ): string[] {
    const gaps = this.identifyGaps(controls, controlStatuses, 100);
    const criticalGaps = gaps.filter(
      (c) => c.severity === SeverityLevel.CRITICAL
    );

    const recommendations: string[] = [];

    if (criticalGaps.length > 0) {
      recommendations.push(
        `Prioritize implementation of ${criticalGaps.length} critical controls`
      );
    }

    const highEffortControls = gaps.filter((c) => c.estimatedHoursToImplement > 80);
    if (highEffortControls.length > 0) {
      recommendations.push(
        `Consider phased approach for ${highEffortControls.length} high-effort controls`
      );
    }

    const automatable = gaps.filter((c) => c.automationPossible);
    if (automatable.length > 0) {
      recommendations.push(
        `${automatable.length} controls can be automated - consider automation first`
      );
    }

    return recommendations;
  }
}

export default new ComplianceScorer();
