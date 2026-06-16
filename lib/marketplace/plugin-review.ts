/**
 * Plugin Review Workflow
 * Manages the review process for plugin submissions
 */

export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  CHANGES_REQUESTED = 'changes_requested',
  REJECTED = 'rejected',
}

export interface ReviewComment {
  id: string;
  reviewerId: string;
  timestamp: Date;
  comment: string;
  severity: 'info' | 'warning' | 'error';
  resolved: boolean;
}

export interface PluginReview {
  id: string;
  submissionId: string;
  reviewerId: string;
  status: ReviewStatus;
  startedAt: Date;
  completedAt?: Date;
  score: number; // 0-100
  securityScore: number;
  qualityScore: number;
  comments: ReviewComment[];
  verdict?: 'approved' | 'rejected' | 'changes_requested';
  rejectionReason?: string;
}

export class PluginReviewService {
  private reviews: Map<string, PluginReview> = new Map();
  private reviewers: Set<string> = new Set();
  private nextId = 0;

  public registerReviewer(reviewerId: string): void {
    this.reviewers.add(reviewerId);
  }

  public unregisterReviewer(reviewerId: string): void {
    this.reviewers.delete(reviewerId);
  }

  public isReviewer(reviewerId: string): boolean {
    return this.reviewers.has(reviewerId);
  }

  public startReview(
    submissionId: string,
    reviewerId: string
  ): string {
    if (!this.isReviewer(reviewerId)) {
      throw new Error(`${reviewerId} is not a registered reviewer`);
    }

    const reviewId = `rev-${this.nextId++}`;

    const review: PluginReview = {
      id: reviewId,
      submissionId,
      reviewerId,
      status: ReviewStatus.IN_PROGRESS,
      startedAt: new Date(),
      score: 0,
      securityScore: 0,
      qualityScore: 0,
      comments: [],
    };

    this.reviews.set(reviewId, review);
    return reviewId;
  }

  public getReview(reviewId: string): PluginReview | undefined {
    return this.reviews.get(reviewId);
  }

  public getReviewBySubmission(submissionId: string): PluginReview | undefined {
    return Array.from(this.reviews.values()).find(
      r => r.submissionId === submissionId
    );
  }

  public addComment(
    reviewId: string,
    reviewerId: string,
    comment: string,
    severity: 'info' | 'warning' | 'error'
  ): string {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    if (review.reviewerId !== reviewerId) {
      throw new Error('Only the assigned reviewer can add comments');
    }

    const commentId = `cmt-${Date.now()}`;
    review.comments.push({
      id: commentId,
      reviewerId,
      timestamp: new Date(),
      comment,
      severity,
      resolved: false,
    });

    return commentId;
  }

  public resolveComment(reviewId: string, commentId: string): void {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    const comment = review.comments.find(c => c.id === commentId);
    if (!comment) {
      throw new Error(`Comment ${commentId} not found`);
    }

    comment.resolved = true;
  }

  public setScores(
    reviewId: string,
    securityScore: number,
    qualityScore: number
  ): void {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    if (securityScore < 0 || securityScore > 100) {
      throw new Error('Security score must be between 0 and 100');
    }

    if (qualityScore < 0 || qualityScore > 100) {
      throw new Error('Quality score must be between 0 and 100');
    }

    review.securityScore = securityScore;
    review.qualityScore = qualityScore;
    review.score = (securityScore + qualityScore) / 2;
  }

  public approveReview(reviewId: string): void {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    review.status = ReviewStatus.APPROVED;
    review.verdict = 'approved';
    review.completedAt = new Date();
  }

  public requestChanges(reviewId: string, reason: string): void {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    review.status = ReviewStatus.CHANGES_REQUESTED;
    review.verdict = 'changes_requested';
    review.completedAt = new Date();
    review.rejectionReason = reason;
  }

  public rejectReview(reviewId: string, reason: string): void {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    review.status = ReviewStatus.REJECTED;
    review.verdict = 'rejected';
    review.completedAt = new Date();
    review.rejectionReason = reason;
  }

  public getReviewsByReviewer(reviewerId: string): PluginReview[] {
    return Array.from(this.reviews.values()).filter(
      r => r.reviewerId === reviewerId
    );
  }

  public getPendingReviews(): PluginReview[] {
    return Array.from(this.reviews.values()).filter(
      r => r.status === ReviewStatus.PENDING || r.status === ReviewStatus.IN_PROGRESS
    );
  }

  public getReviewStats(): {
    total: number;
    byStatus: Record<string, number>;
    averageScore: number;
    averageSecurityScore: number;
    averageQualityScore: number;
  } {
    const reviews = Array.from(this.reviews.values());

    const stats = {
      total: reviews.length,
      byStatus: {} as Record<string, number>,
      averageScore: 0,
      averageSecurityScore: 0,
      averageQualityScore: 0,
    };

    let totalScore = 0;
    let totalSecurityScore = 0;
    let totalQualityScore = 0;
    let completedCount = 0;

    for (const review of reviews) {
      stats.byStatus[review.status] =
        (stats.byStatus[review.status] || 0) + 1;

      if (review.completedAt) {
        totalScore += review.score;
        totalSecurityScore += review.securityScore;
        totalQualityScore += review.qualityScore;
        completedCount++;
      }
    }

    if (completedCount > 0) {
      stats.averageScore = totalScore / completedCount;
      stats.averageSecurityScore = totalSecurityScore / completedCount;
      stats.averageQualityScore = totalQualityScore / completedCount;
    }

    return stats;
  }

  public getAllReviews(): PluginReview[] {
    return Array.from(this.reviews.values());
  }
}
