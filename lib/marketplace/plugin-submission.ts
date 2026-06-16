/**
 * Plugin Submission Handler
 * Manages plugin submission process and validation
 */

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

export interface PluginSubmission {
  id: string;
  pluginId: string;
  version: string;
  authorId: string;
  authorEmail: string;
  status: SubmissionStatus;
  submittedAt: Date;
  reviewStartedAt?: Date;
  reviewCompletedAt?: Date;
  publishedAt?: Date;
  manifest: any;
  changeLog?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
}

export interface SubmissionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

export class PluginSubmissionService {
  private submissions: Map<string, PluginSubmission> = new Map();
  private nextId = 0;

  public async submitPlugin(
    pluginId: string,
    version: string,
    authorId: string,
    authorEmail: string,
    manifest: any,
    changeLog?: string
  ): Promise<string> {
    const submissionId = `sub-${this.nextId++}-${Date.now()}`;

    const submission: PluginSubmission = {
      id: submissionId,
      pluginId,
      version,
      authorId,
      authorEmail,
      status: SubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
      manifest,
      changeLog,
    };

    this.submissions.set(submissionId, submission);
    return submissionId;
  }

  public getSubmission(submissionId: string): PluginSubmission | undefined {
    return this.submissions.get(submissionId);
  }

  public getSubmissionsByPlugin(pluginId: string): PluginSubmission[] {
    return Array.from(this.submissions.values()).filter(
      s => s.pluginId === pluginId
    );
  }

  public getSubmissionsByAuthor(authorId: string): PluginSubmission[] {
    return Array.from(this.submissions.values()).filter(
      s => s.authorId === authorId
    );
  }

  public getSubmissionsByStatus(status: SubmissionStatus): PluginSubmission[] {
    return Array.from(this.submissions.values()).filter(
      s => s.status === status
    );
  }

  public updateSubmissionStatus(
    submissionId: string,
    status: SubmissionStatus,
    notes?: string
  ): void {
    const submission = this.submissions.get(submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    submission.status = status;

    if (status === SubmissionStatus.UNDER_REVIEW && !submission.reviewStartedAt) {
      submission.reviewStartedAt = new Date();
    }

    if (
      (status === SubmissionStatus.APPROVED ||
        status === SubmissionStatus.REJECTED) &&
      !submission.reviewCompletedAt
    ) {
      submission.reviewCompletedAt = new Date();
      if (notes) {
        submission.reviewNotes = notes;
      }
    }

    if (status === SubmissionStatus.PUBLISHED && !submission.publishedAt) {
      submission.publishedAt = new Date();
    }
  }

  public setRejectionReason(submissionId: string, reason: string): void {
    const submission = this.submissions.get(submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }
    submission.rejectionReason = reason;
  }

  public validateSubmission(submission: PluginSubmission): SubmissionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate manifest
    if (!submission.manifest) {
      errors.push('Manifest is required');
    } else {
      if (!submission.manifest.id) {
        errors.push('Plugin ID is required in manifest');
      }
      if (!submission.manifest.name) {
        errors.push('Plugin name is required in manifest');
      }
      if (!submission.manifest.description) {
        errors.push('Plugin description is required in manifest');
      }
      if (!submission.manifest.version) {
        errors.push('Plugin version is required in manifest');
      }
    }

    // Validate author info
    if (!submission.authorId) {
      errors.push('Author ID is required');
    }
    if (!submission.authorEmail) {
      errors.push('Author email is required');
    }

    // Warnings
    if (!submission.changeLog) {
      warnings.push('No changelog provided. Users benefit from knowing what changed.');
    }

    // Suggestions
    if (submission.manifest && submission.manifest.description?.length < 50) {
      suggestions.push('Consider providing a more detailed description (at least 50 characters)');
    }

    if (!submission.manifest?.icon) {
      suggestions.push('Plugin icon is recommended for marketplace visibility');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  public getSubmissionStats(): {
    total: number;
    byStatus: Record<string, number>;
    averageReviewTime?: number;
  } {
    const stats = {
      total: this.submissions.size,
      byStatus: {} as Record<string, number>,
      averageReviewTime: undefined as number | undefined,
    };

    const completedReviews: number[] = [];

    for (const submission of this.submissions.values()) {
      stats.byStatus[submission.status] =
        (stats.byStatus[submission.status] || 0) + 1;

      if (
        submission.reviewStartedAt &&
        submission.reviewCompletedAt
      ) {
        const reviewTime =
          submission.reviewCompletedAt.getTime() -
          submission.reviewStartedAt.getTime();
        completedReviews.push(reviewTime);
      }
    }

    if (completedReviews.length > 0) {
      stats.averageReviewTime =
        completedReviews.reduce((a, b) => a + b) / completedReviews.length;
    }

    return stats;
  }

  public getSubmissionById(submissionId: string): PluginSubmission | null {
    return this.submissions.get(submissionId) || null;
  }

  public listAllSubmissions(): PluginSubmission[] {
    return Array.from(this.submissions.values());
  }
}
