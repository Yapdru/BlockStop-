import { LessonLearned } from './types';
import { ERROR_MESSAGES, KB_IMPACT_LEVELS } from './constants';
import { v4 as uuidv4 } from 'uuid';

export class LessonsLearnedManager {
  private lessons: Map<string, LessonLearned> = new Map();
  private incidentIndex: Map<string, string> = new Map();
  private reviewerIndex: Map<string, Set<string>> = new Map();

  async createLesson(lesson: Omit<LessonLearned, 'id' | 'createdAt'>): Promise<LessonLearned> {
    const id = uuidv4();

    const newLesson: LessonLearned = {
      ...lesson,
      id,
      createdAt: new Date(),
    };

    this.lessons.set(id, newLesson);
    this.incidentIndex.set(lesson.incidentId, id);

    return newLesson;
  }

  async updateLesson(id: string, updates: Partial<LessonLearned>): Promise<LessonLearned> {
    const lesson = this.lessons.get(id);
    if (!lesson) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    const updated: LessonLearned = {
      ...lesson,
      ...updates,
      id: lesson.id,
      createdAt: lesson.createdAt,
    };

    this.lessons.set(id, updated);
    return updated;
  }

  async getLesson(id: string): Promise<LessonLearned | null> {
    return this.lessons.get(id) || null;
  }

  async getLessonByIncident(incidentId: string): Promise<LessonLearned | null> {
    const lessonId = this.incidentIndex.get(incidentId);
    if (!lessonId) return null;
    return this.lessons.get(lessonId) || null;
  }

  async deleteLesson(id: string): Promise<boolean> {
    const lesson = this.lessons.get(id);
    if (!lesson) return false;

    this.incidentIndex.delete(lesson.incidentId);
    return this.lessons.delete(id);
  }

  async addReviewer(lessonId: string, reviewerId: string): Promise<LessonLearned> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    if (!lesson.reviewedBy.includes(reviewerId)) {
      lesson.reviewedBy.push(reviewerId);
    }

    const reviewerSet = this.reviewerIndex.get(reviewerId) || new Set();
    reviewerSet.add(lessonId);
    this.reviewerIndex.set(reviewerId, reviewerSet);

    return this.updateLesson(lessonId, lesson);
  }

  async removeReviewer(lessonId: string, reviewerId: string): Promise<LessonLearned> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    lesson.reviewedBy = lesson.reviewedBy.filter(r => r !== reviewerId);

    const reviewerSet = this.reviewerIndex.get(reviewerId);
    if (reviewerSet) {
      reviewerSet.delete(lessonId);
    }

    return this.updateLesson(lessonId, lesson);
  }

  async approveLessonLearned(lessonId: string, reviewerId: string): Promise<LessonLearned> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    await this.addReviewer(lessonId, reviewerId);

    return this.updateLesson(lessonId, {
      ...lesson,
      status: 'approved',
    });
  }

  async rejectLessonLearned(lessonId: string): Promise<LessonLearned> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    return this.updateLesson(lessonId, {
      ...lesson,
      status: 'draft',
    });
  }

  async submitForReview(lessonId: string): Promise<LessonLearned> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    return this.updateLesson(lessonId, {
      ...lesson,
      status: 'reviewed',
    });
  }

  async listLessons(
    filters?: {
      status?: 'draft' | 'reviewed' | 'approved';
      impact?: string;
      reviewedBy?: string;
    },
    limit: number = 100
  ): Promise<LessonLearned[]> {
    let lessons = Array.from(this.lessons.values());

    if (filters?.status) {
      lessons = lessons.filter(l => l.status === filters.status);
    }

    if (filters?.impact) {
      lessons = lessons.filter(l => l.impact === filters.impact);
    }

    if (filters?.reviewedBy) {
      lessons = lessons.filter(l => l.reviewedBy.includes(filters.reviewedBy!));
    }

    return lessons.slice(-limit).reverse();
  }

  async getLessonsByImpact(impact: 'low' | 'medium' | 'high' | 'critical'): Promise<LessonLearned[]> {
    return Array.from(this.lessons.values())
      .filter(l => l.impact === impact)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async addPreventiveMeasure(lessonId: string, measure: string): Promise<LessonLearned> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    if (!lesson.preventiveMeasures.includes(measure)) {
      lesson.preventiveMeasures.push(measure);
    }

    return this.updateLesson(lessonId, lesson);
  }

  async addCorrectiveAction(lessonId: string, action: string): Promise<LessonLearned> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    if (!lesson.correctiveActions.includes(action)) {
      lesson.correctiveActions.push(action);
    }

    return this.updateLesson(lessonId, lesson);
  }

  async addRelatedPlaybook(lessonId: string, playbookId: string): Promise<LessonLearned> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) throw new Error(ERROR_MESSAGES.DOCUMENT_NOT_FOUND);

    if (!lesson.relatedPlaybooks.includes(playbookId)) {
      lesson.relatedPlaybooks.push(playbookId);
    }

    return this.updateLesson(lessonId, lesson);
  }

  async getRelatedLessons(lessonId: string): Promise<LessonLearned[]> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) return [];

    return Array.from(this.lessons.values()).filter(
      l =>
        l.impact === lesson.impact &&
        l.id !== lessonId &&
        l.status === 'approved'
    );
  }

  async getReviewerLessons(reviewerId: string): Promise<LessonLearned[]> {
    const lessonIds = this.reviewerIndex.get(reviewerId) || new Set();
    return Array.from(lessonIds)
      .map(id => this.lessons.get(id))
      .filter((l): l is LessonLearned => l !== undefined);
  }

  async generateReport(dateRange?: { start: Date; end: Date }): Promise<{
    totalLessons: number;
    byStatus: Record<string, number>;
    byImpact: Record<string, number>;
    avgPreventiveMeasures: number;
    avgCorrectiveActions: number;
  }> {
    let lessons = Array.from(this.lessons.values());

    if (dateRange) {
      lessons = lessons.filter(
        l => l.createdAt >= dateRange.start && l.createdAt <= dateRange.end
      );
    }

    const byStatus: Record<string, number> = {};
    const byImpact: Record<string, number> = {};
    let totalPreventive = 0;
    let totalCorrective = 0;

    lessons.forEach(lesson => {
      byStatus[lesson.status] = (byStatus[lesson.status] || 0) + 1;
      byImpact[lesson.impact] = (byImpact[lesson.impact] || 0) + 1;
      totalPreventive += lesson.preventiveMeasures.length;
      totalCorrective += lesson.correctiveActions.length;
    });

    return {
      totalLessons: lessons.length,
      byStatus,
      byImpact,
      avgPreventiveMeasures: lessons.length > 0 ? totalPreventive / lessons.length : 0,
      avgCorrectiveActions: lessons.length > 0 ? totalCorrective / lessons.length : 0,
    };
  }
}
