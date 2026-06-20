/**
 * Certification Exam Module
 * Manages certification exams and credentials
 */

export type CertificationType = 'BCA' | 'BCP' | 'BCE' | 'BCT';

export interface CertificationExam {
  examId: string;
  certificationType: CertificationType;
  title: string;
  description: string;
  prerequisites: string[]; // Course IDs
  duration: number; // minutes
  totalQuestions: number;
  passingScore: number; // percentage
  questions: ExamQuestion[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'scenario';
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  weight: number; // Points for this question
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ExamAttempt {
  attemptId: string;
  studentId: string;
  examId: string;
  certificationType: CertificationType;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  passed?: boolean;
  certificateId?: string;
  answers: Map<string, string>;
  timeSpentMinutes?: number;
}

export interface BlockStopCertificate {
  certificateId: string;
  studentId: string;
  studentName: string;
  certificationType: CertificationType;
  issuedAt: Date;
  expiresAt: Date;
  examScore: number;
  certificateNumber: string;
  credentialUrl: string;
  isActive: boolean;
}

export interface CertificationStats {
  certificationType: CertificationType;
  totalAttempts: number;
  totalPassed: number;
  passRate: number;
  averageScore: number;
  certificatesIssued: number;
}

export const CERTIFICATION_SPECS: Record<CertificationType, any> = {
  BCA: {
    title: 'BlockStop Certified Associate',
    description: 'Entry-level certification covering BlockStop basics',
    duration: 180, // 3 hours
    totalQuestions: 50,
    passingScore: 70,
    prerequisites: ['blockstop-basics'],
    validityYears: 2,
    hourlyRate: 25,
  },
  BCP: {
    title: 'BlockStop Certified Professional',
    description: 'Advanced certification for experienced users',
    duration: 300, // 5 hours
    totalQuestions: 100,
    passingScore: 75,
    prerequisites: ['BCA'],
    validityYears: 2,
    hourlyRate: 50,
  },
  BCE: {
    title: 'BlockStop Certified Expert',
    description: 'Expert-level certification for security professionals',
    duration: 360, // 6 hours
    totalQuestions: 150,
    passingScore: 80,
    prerequisites: ['BCP'],
    validityYears: 2,
    hourlyRate: 100,
  },
  BCT: {
    title: 'BlockStop Certified Trainer',
    description: 'Train-the-trainer certification for authorized instructors',
    duration: 240, // 4 hours
    totalQuestions: 80,
    passingScore: 85,
    prerequisites: ['BCE'],
    validityYears: 1,
    hourlyRate: 150,
  },
};

export class CertificationExamEngine {
  private exams: Map<string, CertificationExam> = new Map();
  private attempts: Map<string, ExamAttempt> = new Map();
  private certificates: Map<string, BlockStopCertificate> = new Map();
  private studentCertificates: Map<string, BlockStopCertificate[]> = new Map();

  /**
   * Create certification exam
   */
  createExam(examData: Omit<CertificationExam, 'examId' | 'createdAt' | 'updatedAt'>): CertificationExam {
    const examId = `exam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const exam: CertificationExam = {
      examId,
      ...examData,
      createdAt: now,
      updatedAt: now,
    };

    this.exams.set(examId, exam);
    return exam;
  }

  /**
   * Start exam attempt
   */
  startExamAttempt(studentId: string, examId: string): ExamAttempt {
    const exam = this.exams.get(examId);
    if (!exam) throw new Error('Exam not found');

    const attemptId = `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const attempt: ExamAttempt = {
      attemptId,
      studentId,
      examId,
      certificationType: exam.certificationType,
      startedAt: new Date(),
      answers: new Map(),
    };

    this.attempts.set(attemptId, attempt);
    return attempt;
  }

  /**
   * Save answer
   */
  saveAnswer(attemptId: string, questionId: string, answer: string): void {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) throw new Error('Attempt not found');

    if (attempt.completedAt) {
      throw new Error('Exam already completed');
    }

    attempt.answers.set(questionId, answer);
  }

  /**
   * Submit exam
   */
  submitExam(attemptId: string): ExamAttempt {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) throw new Error('Attempt not found');

    const exam = this.exams.get(attempt.examId);
    if (!exam) throw new Error('Exam not found');

    // Calculate score
    let score = 0;
    let totalWeight = 0;

    for (const question of exam.questions) {
      const studentAnswer = attempt.answers.get(question.id);
      totalWeight += question.weight;

      if (this.isAnswerCorrect(studentAnswer, question.correctAnswer)) {
        score += question.weight;
      }
    }

    const scorePercentage = (score / totalWeight) * 100;
    const passed = scorePercentage >= exam.passingScore;

    attempt.completedAt = new Date();
    attempt.score = Math.round(scorePercentage);
    attempt.passed = passed;
    attempt.timeSpentMinutes = Math.round((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / (60 * 1000));

    // Issue certificate if passed
    if (passed) {
      const certificate = this.issueCertificate(attempt);
      attempt.certificateId = certificate.certificateId;
    }

    this.attempts.set(attemptId, attempt);
    return attempt;
  }

  /**
   * Get student's certificates
   */
  getStudentCertificates(studentId: string): BlockStopCertificate[] {
    return this.studentCertificates.get(studentId) || [];
  }

  /**
   * Verify certificate
   */
  verifyCertificate(certificateId: string): BlockStopCertificate | undefined {
    return this.certificates.get(certificateId);
  }

  /**
   * Get certification statistics
   */
  getCertificationStats(certificationType: CertificationType): CertificationStats {
    const relatedAttempts = Array.from(this.attempts.values()).filter(
      (a) => a.certificationType === certificationType && a.completedAt
    );

    const passedAttempts = relatedAttempts.filter((a) => a.passed).length;
    const passRate = relatedAttempts.length > 0 ? (passedAttempts / relatedAttempts.length) * 100 : 0;
    const averageScore = relatedAttempts.length > 0 ? relatedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / relatedAttempts.length : 0;

    const activeCerts = Array.from(this.certificates.values()).filter(
      (c) => c.certificationType === certificationType && c.isActive
    );

    return {
      certificationType,
      totalAttempts: relatedAttempts.length,
      totalPassed: passedAttempts,
      passRate: Math.round(passRate),
      averageScore: Math.round(averageScore),
      certificatesIssued: activeCerts.length,
    };
  }

  /**
   * Get exam
   */
  getExam(examId: string): CertificationExam | undefined {
    return this.exams.get(examId);
  }

  /**
   * Get exam attempts for student
   */
  getStudentExamAttempts(studentId: string, examId?: string): ExamAttempt[] {
    return Array.from(this.attempts.values()).filter((a) => {
      if (a.studentId !== studentId) return false;
      if (examId && a.examId !== examId) return false;
      return true;
    });
  }

  /**
   * Issue certificate
   */
  private issueCertificate(attempt: ExamAttempt): BlockStopCertificate {
    const certificateId = `cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const issuedAt = new Date();
    const spec = CERTIFICATION_SPECS[attempt.certificationType];
    const expiresAt = new Date(issuedAt.getTime() + spec.validityYears * 365 * 24 * 60 * 60 * 1000);

    const certificate: BlockStopCertificate = {
      certificateId,
      studentId: attempt.studentId,
      studentName: `Student-${attempt.studentId}`, // Would be populated with actual student name
      certificationType: attempt.certificationType,
      issuedAt,
      expiresAt,
      examScore: attempt.score || 0,
      certificateNumber: this.generateCertificateNumber(),
      credentialUrl: `https://blockstop.io/verify/${certificateId}`,
      isActive: true,
    };

    this.certificates.set(certificateId, certificate);

    // Track student certificate
    if (!this.studentCertificates.has(attempt.studentId)) {
      this.studentCertificates.set(attempt.studentId, []);
    }
    this.studentCertificates.get(attempt.studentId)!.push(certificate);

    return certificate;
  }

  /**
   * Check if answer is correct
   */
  private isAnswerCorrect(studentAnswer: string | undefined, correctAnswer: string | string[]): boolean {
    if (!studentAnswer) return false;

    if (Array.isArray(correctAnswer)) {
      return correctAnswer.includes(studentAnswer);
    }

    return studentAnswer.toLowerCase() === (correctAnswer as string).toLowerCase();
  }

  /**
   * Generate certificate number
   */
  private generateCertificateNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    return `BS-${timestamp}-${random}`;
  }

  /**
   * Revoke certificate
   */
  revokeCertificate(certificateId: string, reason: string): void {
    const certificate = this.certificates.get(certificateId);
    if (certificate) {
      certificate.isActive = false;
    }
  }

  /**
   * List all exams
   */
  getAllExams(): CertificationExam[] {
    return Array.from(this.exams.values());
  }
}

export const certificationExamEngine = new CertificationExamEngine();
