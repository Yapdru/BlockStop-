/**
 * BlockStop Phase 30.8 - Certification System
 * Manage BlockStop Security Analyst (BSA), Security Engineer (BSE), and Advanced Threat Hunter (BATH) certifications
 * Production-ready exam management, certificate issuance, and renewal tracking
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export type CertificationTrackType = 'bsa' | 'bse' | 'bath';
export type ExamStatus = 'scheduled' | 'in-progress' | 'completed' | 'passed' | 'failed' | 'cancelled';
export type QuestionType = 'multiple-choice' | 'true-false' | 'scenario' | 'short-answer';
export type CertificateStatus = 'valid' | 'expired' | 'revoked' | 'suspended' | 'pending-renewal';

export interface CertificationTrack {
  trackId: string;
  name: string;
  shortName: CertificationTrackType;
  level: 'associate' | 'engineer' | 'advanced';
  description: string;
  prerequisites: string[];
  requiredCourses: CourseRequirement[];
  requiredExam: ExamRequirement;
  skillValidations: SkillValidation[];
  validityPeriod: number; // months
  renewalRequirements: RenewalRequirement[];
  icon?: string;
  estimatedHours: number;
  jobRoles: string[];
  createdAt: Date;
}

export interface CourseRequirement {
  courseId: string;
  courseName: string;
  mandatory: boolean;
  minimumScore?: number;
}

export interface ExamRequirement {
  examId: string;
  name: string;
  duration: number; // minutes
  passingScore: number; // percentage
  numberOfQuestions: number;
  domains: ExamDomain[];
  retakesAllowed: number;
  cooldownDaysBetweenRetakes: number;
}

export interface ExamDomain {
  domainId: string;
  name: string;
  description: string;
  percentage: number; // weight in total score
  topicCount: number;
  sampleQuestions?: string[];
}

export interface SkillValidation {
  validationId: string;
  skillName: string;
  description: string;
  validationType: 'exam' | 'practical' | 'project' | 'portfolio' | 'assessment';
  validationCriteria: string;
  evidenceRequired: string;
}

export interface RenewalRequirement {
  requirementId: string;
  description: string;
  type: 'continued-learning' | 'practical-experience' | 'exam' | 'project';
  pointsRequired: number;
  frequency: 'yearly' | 'every-two-years';
}

export interface Exam {
  examId: string;
  trackId: string;
  title: string;
  description: string;
  version: number;
  passingScore: number;
  duration: number; // minutes
  questionCount: number;
  difficulty: 'intermediate' | 'advanced' | 'expert';
  domains: ExamDomain[];
  questions: ExamQuestion[];
  status: 'draft' | 'active' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  proctored: boolean;
  allowCalculator: boolean;
  allowNotes: boolean;
}

export interface ExamQuestion {
  questionId: string;
  examId: string;
  domainId: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
  points: number;
  caseStudy?: string; // For scenario questions
}

export interface ExamSchedule {
  scheduleId: string;
  examId: string;
  dateTime: Date;
  location: 'online' | 'testing-center';
  testingCenterId?: string;
  capacity: number;
  registered: number;
  proctorId?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface ExamAttempt {
  attemptId: string;
  userId: string;
  examId: string;
  trackId: string;
  scheduleId?: string;
  startedAt: Date;
  completedAt?: Date;
  submittedAt?: Date;
  score?: number;
  percentage?: number;
  status: ExamStatus;
  answers: ExamAnswer[];
  timeSpent: number; // seconds
  flaggedQuestions: string[]; // Question IDs marked for review
  reviewNotes?: string;
  proctorNotes?: string;
  ipAddress?: string;
  deviceInfo?: DeviceInfo;
  cheatingDetectionScore?: number; // 0-100, higher = more suspicious
}

export interface ExamAnswer {
  answerId: string;
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number; // seconds
  attemptNumber: number; // If user changed answer
}

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
}

export interface CertificateIssue {
  issueId: string;
  userId: string;
  trackId: string;
  certificateType: CertificationTrackType;
  certificateNumber: string;
  issuedAt: Date;
  expiresAt: Date;
  verificationCode: string;
  signedBy: string;
  signatureUrl?: string;
  status: CertificateStatus;
  pdfUrl: string;
  badgeUrl: string;
  earnedSkills: string[];
  examAttemptId: string;
}

export interface CertificateVerification {
  valid: boolean;
  certificateNumber: string;
  holderName: string;
  trackType: string;
  issuedDate: Date;
  expirationDate: Date;
  verificationDate: Date;
  issuer: string;
  skills: string[];
  publicProfile?: boolean;
}

export interface UserCertification {
  certId: string;
  userId: string;
  trackId: string;
  trackType: CertificationTrackType;
  issuedAt: Date;
  expiresAt: Date;
  renewalDueAt: Date;
  status: CertificateStatus;
  certificateNumber: string;
  verificationCode: string;
  isPublic: boolean;
  displayOnProfile: boolean;
  skills: string[];
  prerequisites: PrerequisiteStatus[];
}

export interface PrerequisiteStatus {
  prerequisiteId: string;
  name: string;
  type: 'course' | 'experience' | 'skill';
  completed: boolean;
  completedAt?: Date;
  proof?: string;
}

export interface RenewalRequest {
  renewalId: string;
  userId: string;
  certId: string;
  trackId: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requiredPoints: number;
  earnedPoints: number;
  activities: RenewalActivity[];
  approvedBy?: string;
  approvedAt?: Date;
}

export interface RenewalActivity {
  activityId: string;
  type: 'course-completion' | 'exam' | 'project' | 'publication' | 'conference';
  title: string;
  description: string;
  dateCompleted: Date;
  points: number;
  evidence: string; // URL or certificate
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface CertificationStats {
  userId: string;
  totalCertifications: number;
  activeCertifications: number;
  expiredCertifications: number;
  certificationsByTrack: Record<CertificationTrackType, number>;
  averageExamScore: number;
  totalSkillsValidated: number;
  learningHours: number;
  completedCourses: number;
}

export interface ExamReport {
  reportId: string;
  attemptId: string;
  userId: string;
  examId: string;
  trackId: string;
  dateCompleted: Date;
  totalScore: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
  timeSpent: number;
  domainPerformance: DomainPerformance[];
  questionAnalysis: QuestionAnalysis[];
  recommendations: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface DomainPerformance {
  domainId: string;
  domainName: string;
  score: number;
  percentage: number;
  questionsCorrect: number;
  totalQuestions: number;
  averageTimePerQuestion: number;
}

export interface QuestionAnalysis {
  questionId: string;
  text: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number;
  difficulty: string;
  domainName: string;
  explanation: string;
}

export class CertificationManager extends EventEmitter {
  private tracks: Map<string, CertificationTrack> = new Map();
  private exams: Map<string, Exam> = new Map();
  private schedules: Map<string, ExamSchedule> = new Map();
  private attempts: Map<string, ExamAttempt> = new Map();
  private certificates: Map<string, CertificateIssue> = new Map();
  private userCerts: Map<string, UserCertification[]> = new Map();
  private renewalRequests: Map<string, RenewalRequest> = new Map();
  private examReports: Map<string, ExamReport> = new Map();

  constructor() {
    super();
    this.initializeTracks();
    this.startExpirationChecker();
  }

  // ============ TRACK MANAGEMENT ============

  /**
   * Get all certification tracks
   */
  getAllTracks(): CertificationTrack[] {
    return Array.from(this.tracks.values());
  }

  /**
   * Get track by ID
   */
  getTrack(trackId: string): CertificationTrack | undefined {
    return this.tracks.get(trackId);
  }

  /**
   * Get track progression path
   */
  getTrackProgression(): CertificationTrack[] {
    return [
      this.tracks.get('bsa')!,
      this.tracks.get('bse')!,
      this.tracks.get('bath')!,
    ].filter(Boolean);
  }

  // ============ EXAM MANAGEMENT ============

  /**
   * Create exam
   */
  createExam(exam: Omit<Exam, 'examId' | 'createdAt' | 'updatedAt'>): Exam {
    const examId = `exam-${crypto.randomBytes(8).toString('hex')}`;
    const fullExam: Exam = {
      ...exam,
      examId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    this.exams.set(examId, fullExam);
    this.emit('exam:created', fullExam);
    return fullExam;
  }

  /**
   * Get exam by ID
   */
  getExam(examId: string): Exam | undefined {
    return this.exams.get(examId);
  }

  /**
   * Get exams by track
   */
  getExamsByTrack(trackId: string): Exam[] {
    return Array.from(this.exams.values()).filter(e => e.trackId === trackId);
  }

  /**
   * Schedule exam
   */
  scheduleExam(schedule: Omit<ExamSchedule, 'scheduleId' | 'createdAt'>): ExamSchedule {
    const scheduleId = `schedule-${crypto.randomBytes(8).toString('hex')}`;
    const fullSchedule: ExamSchedule = {
      ...schedule,
      scheduleId,
      createdAt: new Date(),
    };

    this.schedules.set(scheduleId, fullSchedule);
    this.emit('exam:scheduled', fullSchedule);
    return fullSchedule;
  }

  /**
   * Get available exam schedules
   */
  getAvailableSchedules(examId: string): ExamSchedule[] {
    return Array.from(this.schedules.values()).filter(
      s => s.examId === examId &&
           s.status === 'scheduled' &&
           s.registered < s.capacity &&
           s.dateTime > new Date()
    );
  }

  // ============ EXAM ATTEMPT & PROCTORING ============

  /**
   * Start exam attempt
   */
  startExamAttempt(
    userId: string,
    examId: string,
    trackId: string,
    scheduleId?: string,
    deviceInfo?: DeviceInfo
  ): ExamAttempt {
    const exam = this.exams.get(examId);
    if (!exam) throw new Error('Exam not found');

    const attemptId = `attempt-${crypto.randomBytes(8).toString('hex')}`;
    const attempt: ExamAttempt = {
      attemptId,
      userId,
      examId,
      trackId,
      scheduleId,
      startedAt: new Date(),
      status: 'in-progress',
      answers: [],
      timeSpent: 0,
      flaggedQuestions: [],
      deviceInfo,
      ipAddress: '', // Would be set by API layer
      cheatingDetectionScore: 0,
    };

    this.attempts.set(attemptId, attempt);
    this.emit('exam:started', attempt);
    return attempt;
  }

  /**
   * Get exam attempt in progress
   */
  getCurrentAttempt(userId: string, examId: string): ExamAttempt | undefined {
    return Array.from(this.attempts.values()).find(
      a => a.userId === userId && a.examId === examId && a.status === 'in-progress'
    );
  }

  /**
   * Record answer to exam question
   */
  recordAnswer(
    attemptId: string,
    questionId: string,
    userAnswer: string | string[],
    timeSpent: number
  ): ExamAnswer {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) throw new Error('Attempt not found');

    const exam = this.exams.get(attempt.examId);
    if (!exam) throw new Error('Exam not found');

    const question = exam.questions.find(q => q.questionId === questionId);
    if (!question) throw new Error('Question not found');

    // Check if answer is correct
    const isCorrect = this.validateAnswer(userAnswer, question.correctAnswer);
    const pointsEarned = isCorrect ? question.points : 0;

    const answer: ExamAnswer = {
      answerId: `answer-${crypto.randomBytes(8).toString('hex')}`,
      questionId,
      userAnswer,
      isCorrect,
      pointsEarned,
      timeSpent,
      attemptNumber: 1,
    };

    attempt.answers.push(answer);
    attempt.timeSpent += timeSpent;

    this.emit('exam:answer-recorded', answer);
    return answer;
  }

  /**
   * Flag question for review
   */
  flagQuestion(attemptId: string, questionId: string): void {
    const attempt = this.attempts.get(attemptId);
    if (attempt) {
      if (!attempt.flaggedQuestions.includes(questionId)) {
        attempt.flaggedQuestions.push(questionId);
      }
      this.emit('exam:question-flagged', { attemptId, questionId });
    }
  }

  /**
   * Submit exam
   */
  submitExam(attemptId: string): ExamReport {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) throw new Error('Attempt not found');

    const exam = this.exams.get(attempt.examId);
    if (!exam) throw new Error('Exam not found');

    // Calculate score
    const totalPoints = attempt.answers.reduce((sum, a) => sum + a.pointsEarned, 0);
    const maxPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((totalPoints / maxPoints) * 100);
    const passed = percentage >= exam.passingScore;

    attempt.completedAt = new Date();
    attempt.submittedAt = new Date();
    attempt.score = totalPoints;
    attempt.percentage = percentage;
    attempt.status = passed ? 'passed' : 'failed';

    // Generate report
    const report = this.generateExamReport(attempt, exam, percentage, passed);

    this.examReports.set(report.reportId, report);
    this.emit('exam:submitted', { attempt, report, passed });

    // Issue certificate if passed
    if (passed) {
      this.issueCertificate(attempt.userId, attempt.trackId, attemptId);
    }

    return report;
  }

  // ============ CERTIFICATE ISSUANCE & VERIFICATION ============

  /**
   * Issue certificate
   */
  issueCertificate(userId: string, trackId: string, examAttemptId: string): CertificateIssue {
    const track = this.tracks.get(trackId);
    if (!track) throw new Error('Track not found');

    const certificateNumber = this.generateCertificateNumber();
    const verificationCode = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + track.validityPeriod);

    const issue: CertificateIssue = {
      issueId: `cert-${crypto.randomBytes(8).toString('hex')}`,
      userId,
      trackId,
      certificateType: track.shortName,
      certificateNumber,
      issuedAt: new Date(),
      expiresAt,
      verificationCode,
      signedBy: 'BlockStop Academy',
      status: 'valid',
      pdfUrl: `https://certificates.blockstop.io/${certificateNumber}.pdf`,
      badgeUrl: `https://badges.blockstop.io/${track.shortName}.png`,
      earnedSkills: track.skillValidations.map(s => s.skillName),
      examAttemptId,
    };

    this.certificates.set(issue.issueId, issue);

    // Add to user's certifications
    if (!this.userCerts.has(userId)) {
      this.userCerts.set(userId, []);
    }

    const userCert: UserCertification = {
      certId: issue.issueId,
      userId,
      trackId,
      trackType: track.shortName,
      issuedAt: issue.issuedAt,
      expiresAt: issue.expiresAt,
      renewalDueAt: new Date(expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before expiry
      status: 'valid',
      certificateNumber: issue.certificateNumber,
      verificationCode: issue.verificationCode,
      isPublic: false,
      displayOnProfile: false,
      skills: issue.earnedSkills,
      prerequisites: track.prerequisites.map(p => ({
        prerequisiteId: p,
        name: p,
        type: 'course',
        completed: true,
      })),
    };

    this.userCerts.get(userId)!.push(userCert);

    this.emit('certificate:issued', { issue, userCert });
    return issue;
  }

  /**
   * Verify certificate by verification code
   */
  verifyCertificate(verificationCode: string): CertificateVerification | null {
    for (const cert of this.certificates.values()) {
      if (cert.verificationCode === verificationCode && cert.status === 'valid') {
        return {
          valid: true,
          certificateNumber: cert.certificateNumber,
          holderName: `User ${cert.userId}`, // Would fetch real name from user db
          trackType: cert.certificateType.toUpperCase(),
          issuedDate: cert.issuedAt,
          expirationDate: cert.expiresAt,
          verificationDate: new Date(),
          issuer: cert.signedBy,
          skills: cert.earnedSkills,
          publicProfile: false,
        };
      }
    }
    return null;
  }

  /**
   * Get user's certifications
   */
  getUserCertifications(userId: string): UserCertification[] {
    return this.userCerts.get(userId) || [];
  }

  /**
   * Get user's active certifications
   */
  getUserActiveCertifications(userId: string): UserCertification[] {
    const certs = this.userCerts.get(userId) || [];
    return certs.filter(c => c.status === 'valid' && c.expiresAt > new Date());
  }

  // ============ RENEWAL MANAGEMENT ============

  /**
   * Request certification renewal
   */
  requestRenewal(userId: string, certId: string): RenewalRequest {
    const cert = this.certificates.get(certId);
    if (!cert) throw new Error('Certificate not found');

    const track = this.tracks.get(cert.trackId);
    if (!track) throw new Error('Track not found');

    const renewalReq: RenewalRequest = {
      renewalId: `renewal-${crypto.randomBytes(8).toString('hex')}`,
      userId,
      certId,
      trackId: cert.trackId,
      requestedAt: new Date(),
      status: 'pending',
      requiredPoints: 0,
      earnedPoints: 0,
      activities: [],
    };

    this.renewalRequests.set(renewalReq.renewalId, renewalReq);
    this.emit('renewal:requested', renewalReq);
    return renewalReq;
  }

  /**
   * Add renewal activity (course, project, conference, etc.)
   */
  addRenewalActivity(
    renewalId: string,
    activity: Omit<RenewalActivity, 'activityId'>
  ): RenewalActivity {
    const renewal = this.renewalRequests.get(renewalId);
    if (!renewal) throw new Error('Renewal request not found');

    const activityRecord: RenewalActivity = {
      ...activity,
      activityId: `activity-${crypto.randomBytes(8).toString('hex')}`,
    };

    renewal.activities.push(activityRecord);
    renewal.earnedPoints += activity.points;

    this.emit('renewal:activity-added', activityRecord);
    return activityRecord;
  }

  /**
   * Approve renewal
   */
  approveRenewal(renewalId: string, approverId: string): RenewalRequest {
    const renewal = this.renewalRequests.get(renewalId);
    if (!renewal) throw new Error('Renewal request not found');

    renewal.status = 'approved';
    renewal.approvedBy = approverId;
    renewal.approvedAt = new Date();

    // Extend certificate expiration
    const cert = this.certificates.get(renewal.certId);
    if (cert) {
      const track = this.tracks.get(cert.trackId);
      if (track) {
        cert.expiresAt = new Date();
        cert.expiresAt.setMonth(cert.expiresAt.getMonth() + track.validityPeriod);
      }
    }

    this.emit('renewal:approved', renewal);
    return renewal;
  }

  // ============ STATISTICS & ANALYTICS ============

  /**
   * Get certification statistics for user
   */
  getCertificationStats(userId: string): CertificationStats {
    const userCerts = this.userCerts.get(userId) || [];
    const activeCerts = userCerts.filter(c => c.status === 'valid' && c.expiresAt > new Date());
    const expiredCerts = userCerts.filter(c => c.expiresAt <= new Date());

    const trackBreakdown: Record<CertificationTrackType, number> = {
      bsa: 0,
      bse: 0,
      bath: 0,
    };

    for (const cert of userCerts) {
      trackBreakdown[cert.trackType]++;
    }

    // Get average exam score
    const userAttempts = Array.from(this.attempts.values()).filter(a => a.userId === userId && a.percentage !== undefined);
    const avgScore = userAttempts.length > 0
      ? userAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / userAttempts.length
      : 0;

    return {
      userId,
      totalCertifications: userCerts.length,
      activeCertifications: activeCerts.length,
      expiredCertifications: expiredCerts.length,
      certificationsByTrack: trackBreakdown,
      averageExamScore: Math.round(avgScore),
      totalSkillsValidated: userCerts.reduce((sum, c) => sum + c.skills.length, 0),
      learningHours: userAttempts.length * 2, // Placeholder
      completedCourses: userAttempts.length,
    };
  }

  /**
   * Get exam report
   */
  getExamReport(reportId: string): ExamReport | undefined {
    return this.examReports.get(reportId);
  }

  /**
   * Get user's exam history
   */
  getUserExamHistory(userId: string): ExamAttempt[] {
    return Array.from(this.attempts.values())
      .filter(a => a.userId === userId && a.status !== 'in-progress')
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));
  }

  // ============ PRIVATE HELPER METHODS ============

  private validateAnswer(userAnswer: string | string[], correctAnswer?: string | string[]): boolean {
    if (!correctAnswer) return false;

    if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
      return userAnswer.sort().join(',') === correctAnswer.sort().join(',');
    }

    return userAnswer === correctAnswer;
  }

  private generateCertificateNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BSA-${year}-${random}`;
  }

  private generateVerificationCode(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateExamReport(
    attempt: ExamAttempt,
    exam: Exam,
    percentage: number,
    passed: boolean
  ): ExamReport {
    const domainPerformance: DomainPerformance[] = exam.domains.map(domain => {
      const domainQuestions = exam.questions.filter(q => q.domainId === domain.domainId);
      const domainAnswers = attempt.answers.filter(a => {
        const q = exam.questions.find(qu => qu.questionId === a.questionId);
        return q?.domainId === domain.domainId;
      });

      const correctAnswers = domainAnswers.filter(a => a.isCorrect).length;
      const domainPercentage = domainQuestions.length > 0 ? (correctAnswers / domainQuestions.length) * 100 : 0;
      const avgTime = domainAnswers.length > 0 ? domainAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / domainAnswers.length : 0;

      return {
        domainId: domain.domainId,
        domainName: domain.name,
        score: correctAnswers,
        percentage: Math.round(domainPercentage),
        questionsCorrect: correctAnswers,
        totalQuestions: domainQuestions.length,
        averageTimePerQuestion: Math.round(avgTime),
      };
    });

    const strengthAreas = domainPerformance
      .filter(d => d.percentage >= 80)
      .map(d => d.domainName);

    const improvementAreas = domainPerformance
      .filter(d => d.percentage < 70)
      .map(d => d.domainName);

    return {
      reportId: `report-${crypto.randomBytes(8).toString('hex')}`,
      attemptId: attempt.attemptId,
      userId: attempt.userId,
      examId: attempt.examId,
      trackId: attempt.trackId,
      dateCompleted: attempt.completedAt!,
      totalScore: attempt.score!,
      percentage,
      passingScore: exam.passingScore,
      passed,
      timeSpent: attempt.timeSpent,
      domainPerformance,
      questionAnalysis: attempt.answers.map(a => {
        const q = exam.questions.find(qu => qu.questionId === a.questionId)!;
        return {
          questionId: a.questionId,
          text: q.text,
          userAnswer: a.userAnswer,
          correctAnswer: q.correctAnswer || '',
          isCorrect: a.isCorrect,
          pointsEarned: a.pointsEarned,
          timeSpent: a.timeSpent,
          difficulty: q.difficulty,
          domainName: exam.domains.find(d => d.domainId === q.domainId)?.name || '',
          explanation: q.explanation,
        };
      }),
      recommendations: this.generateRecommendations(percentage, improvementAreas),
      strengthAreas,
      improvementAreas,
    };
  }

  private generateRecommendations(percentage: number, improvementAreas: string[]): string[] {
    const recommendations: string[] = [];

    if (percentage < 50) {
      recommendations.push('Consider reviewing the fundamentals before retaking the exam');
      recommendations.push('Use practice exams to familiarize yourself with question types');
    }

    if (improvementAreas.length > 0) {
      recommendations.push(`Focus on improving your knowledge in: ${improvementAreas.join(', ')}`);
      recommendations.push('Review related course modules for these domains');
    }

    if (percentage >= 80) {
      recommendations.push('Excellent performance! Consider pursuing the next certification level');
    }

    return recommendations;
  }

  private initializeTracks(): void {
    // BSA - Associate Level
    this.tracks.set('bsa', {
      trackId: 'bsa',
      name: 'BlockStop Security Associate',
      shortName: 'bsa',
      level: 'associate',
      description: 'Foundation-level certification for security professionals starting their career',
      prerequisites: [],
      requiredCourses: [
        { courseId: 'course-security-101', courseName: 'Security Fundamentals', mandatory: true },
        { courseId: 'course-threat-basics', courseName: 'Threat Detection Basics', mandatory: true },
      ],
      requiredExam: {
        examId: 'exam-bsa',
        name: 'BlockStop Security Associate Exam',
        duration: 120,
        passingScore: 70,
        numberOfQuestions: 100,
        domains: [
          { domainId: 'd1', name: 'Security Fundamentals', description: 'Core security concepts', percentage: 30, topicCount: 15 },
          { domainId: 'd2', name: 'Threat Detection', description: 'Identifying security threats', percentage: 40, topicCount: 20 },
          { domainId: 'd3', name: 'Incident Response', description: 'Responding to security incidents', percentage: 30, topicCount: 15 },
        ],
        retakesAllowed: 3,
        cooldownDaysBetweenRetakes: 7,
      },
      skillValidations: [
        { validationId: 'sv1', skillName: 'Threat Detection', description: 'Ability to detect security threats', validationType: 'exam', validationCriteria: 'Pass BSA exam', evidenceRequired: 'Exam score' },
        { validationId: 'sv2', skillName: 'Incident Triage', description: 'Ability to triage incidents', validationType: 'practical', validationCriteria: 'Score 70% or higher', evidenceRequired: 'Lab completion' },
      ],
      validityPeriod: 36, // 3 years
      renewalRequirements: [
        { requirementId: 'r1', description: 'Complete 30 CPD hours', type: 'continued-learning', pointsRequired: 30, frequency: 'every-two-years' },
      ],
      estimatedHours: 40,
      jobRoles: ['Security Analyst', 'SOC Analyst', 'Threat Hunter'],
      createdAt: new Date(),
    });

    // BSE - Engineer Level
    this.tracks.set('bse', {
      trackId: 'bse',
      name: 'BlockStop Security Engineer',
      shortName: 'bse',
      level: 'engineer',
      description: 'Professional certification for experienced security engineers',
      prerequisites: ['bsa'],
      requiredCourses: [
        { courseId: 'course-adv-threats', courseName: 'Advanced Threat Analysis', mandatory: true },
        { courseId: 'course-hunting', courseName: 'Threat Hunting', mandatory: true },
        { courseId: 'course-forensics', courseName: 'Digital Forensics', mandatory: true },
      ],
      requiredExam: {
        examId: 'exam-bse',
        name: 'BlockStop Security Engineer Exam',
        duration: 180,
        passingScore: 75,
        numberOfQuestions: 150,
        domains: [
          { domainId: 'd1', name: 'Advanced Threats', description: 'Complex threat scenarios', percentage: 35, topicCount: 25 },
          { domainId: 'd2', name: 'Threat Hunting', description: 'Proactive threat discovery', percentage: 35, topicCount: 25 },
          { domainId: 'd3', name: 'Forensic Analysis', description: 'Digital evidence analysis', percentage: 30, topicCount: 20 },
        ],
        retakesAllowed: 3,
        cooldownDaysBetweenRetakes: 14,
      },
      skillValidations: [
        { validationId: 'sv1', skillName: 'Advanced Threat Analysis', description: 'Analyze sophisticated threats', validationType: 'exam', validationCriteria: 'Pass BSE exam', evidenceRequired: 'Exam score' },
        { validationId: 'sv2', skillName: 'Threat Hunting', description: 'Proactively hunt threats', validationType: 'practical', validationCriteria: 'Complete hunting lab', evidenceRequired: 'Lab completion certificate' },
        { validationId: 'sv3', skillName: 'Forensic Analysis', description: 'Perform forensic investigations', validationType: 'project', validationCriteria: 'Complete forensics project', evidenceRequired: 'Project report' },
      ],
      validityPeriod: 36,
      renewalRequirements: [
        { requirementId: 'r1', description: 'Complete 40 CPD hours', type: 'continued-learning', pointsRequired: 40, frequency: 'every-two-years' },
        { requirementId: 'r2', description: 'Contribute to community or publish article', type: 'publication', pointsRequired: 10, frequency: 'every-two-years' },
      ],
      estimatedHours: 80,
      jobRoles: ['Security Engineer', 'Senior Analyst', 'Incident Response Manager'],
      createdAt: new Date(),
    });

    // BATH - Advanced Threat Hunter
    this.tracks.set('bath', {
      trackId: 'bath',
      name: 'BlockStop Advanced Threat Hunter',
      shortName: 'bath',
      level: 'advanced',
      description: 'Expert-level certification for advanced threat hunters and researchers',
      prerequisites: ['bse'],
      requiredCourses: [
        { courseId: 'course-apt', courseName: 'APT & Advanced Threat Groups', mandatory: true },
        { courseId: 'course-ttps', courseName: 'Techniques, Tactics & Procedures', mandatory: true },
        { courseId: 'course-malware', courseName: 'Malware Analysis & Reverse Engineering', mandatory: true },
        { courseId: 'course-intel', courseName: 'Threat Intelligence & OSINT', mandatory: true },
      ],
      requiredExam: {
        examId: 'exam-bath',
        name: 'BlockStop Advanced Threat Hunter Exam',
        duration: 240,
        passingScore: 80,
        numberOfQuestions: 200,
        domains: [
          { domainId: 'd1', name: 'APT Groups & Campaigns', description: 'Nation-state and organized crime groups', percentage: 30, topicCount: 30 },
          { domainId: 'd2', name: 'Malware Analysis', description: 'In-depth malware investigation', percentage: 30, topicCount: 30 },
          { domainId: 'd3', name: 'Threat Intelligence', description: 'Intelligence gathering and analysis', percentage: 25, topicCount: 25 },
          { domainId: 'd4', name: 'Advanced Hunting', description: 'Expert-level threat hunting', percentage: 15, topicCount: 15 },
        ],
        retakesAllowed: 2,
        cooldownDaysBetweenRetakes: 30,
      },
      skillValidations: [
        { validationId: 'sv1', skillName: 'APT Analysis', description: 'Analyze APT campaigns and groups', validationType: 'exam', validationCriteria: 'Pass BATH exam', evidenceRequired: 'Exam score' },
        { validationId: 'sv2', skillName: 'Malware Analysis', description: 'Advanced malware reverse engineering', validationType: 'practical', validationCriteria: 'Pass advanced malware lab', evidenceRequired: 'Lab certificate' },
        { validationId: 'sv3', skillName: 'Threat Intelligence', description: 'Produce actionable threat intelligence', validationType: 'project', validationCriteria: 'Complete intel research project', evidenceRequired: 'Published research' },
        { validationId: 'sv4', skillName: 'Industry Contribution', description: 'Contribute to security research community', validationType: 'portfolio', validationCriteria: 'Publications or speaking engagements', evidenceRequired: 'Links to contributions' },
      ],
      validityPeriod: 36,
      renewalRequirements: [
        { requirementId: 'r1', description: 'Complete 60 CPD hours', type: 'continued-learning', pointsRequired: 60, frequency: 'yearly' },
        { requirementId: 'r2', description: 'Maintain industry publications or speaking', type: 'publication', pointsRequired: 20, frequency: 'yearly' },
        { requirementId: 'r3', description: 'Active threat hunting contributions', type: 'project', pointsRequired: 15, frequency: 'yearly' },
      ],
      estimatedHours: 120,
      jobRoles: ['Threat Hunter', 'Security Researcher', 'Incident Response Manager', 'SOC Director'],
      createdAt: new Date(),
    });
  }

  private startExpirationChecker(): void {
    // Check certificate expirations weekly
    setInterval(() => {
      const now = new Date();
      for (const cert of this.certificates.values()) {
        if (cert.status === 'valid' && cert.expiresAt <= now) {
          cert.status = 'expired';
          this.emit('certificate:expired', cert);
        }
      }
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }
}

// Export singleton
export const certificationManager = new CertificationManager();
