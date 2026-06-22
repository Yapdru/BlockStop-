/**
 * BlockStop Phase 29.5 - Learning Platform
 * Comprehensive course management, progress tracking, and certification
 * Production-ready implementation
 */

import { EventEmitter } from 'events';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LearningFormat = 'video' | 'interactive' | 'quiz' | 'lab' | 'document' | 'live-session';
export type EnrollmentStatus = 'enrolled' | 'in-progress' | 'completed' | 'dropped' | 'paused';
export type QuizType = 'multiple-choice' | 'true-false' | 'short-answer' | 'hands-on' | 'scenario-based';
export type CertificateStatus = 'issued' | 'pending' | 'expired' | 'revoked' | 'suspended';

export interface Course {
  courseId: string;
  title: string;
  description: string;
  level: CourseLevel;
  category: string;
  prerequisites: string[];
  duration: number; // hours
  createdAt: Date;
  updatedAt: Date;
  instructor: InstructorInfo;
  modules: CourseModule[];
  learningObjectives: string[];
  targetAudience: string[];
  certification?: CertificationInfo;
  rating: number; // 0-5
  enrollmentCount: number;
  completionRate: number; // %
  isActive: boolean;
}

export interface InstructorInfo {
  instructorId: string;
  name: string;
  email: string;
  bio?: string;
  expertise: string[];
  averageRating: number;
}

export interface CourseModule {
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  sequenceNumber: number;
  duration: number; // minutes
  content: ModuleContent[];
  assessments: Assessment[];
  isRequired: boolean;
}

export interface ModuleContent {
  contentId: string;
  moduleId: string;
  type: LearningFormat;
  title: string;
  duration: number; // minutes
  url?: string;
  embedUrl?: string; // For YouTube, etc.
  description: string;
  resources?: Resource[];
  sequenceNumber: number;
}

export interface Resource {
  resourceId: string;
  title: string;
  type: 'document' | 'video' | 'code' | 'image' | 'archive';
  url: string;
  fileSize: number;
  downloadCount: number;
  lastUpdated: Date;
}

export interface Assessment {
  assessmentId: string;
  moduleId: string;
  title: string;
  description: string;
  type: QuizType;
  questions: Question[];
  passingScore: number; // % (0-100)
  duration: number; // minutes
  retakesAllowed: number;
  weight: number; // For final grade calculation
}

export interface Question {
  questionId: string;
  assessmentId: string;
  text: string;
  type: QuizType;
  options?: string[];
  correctAnswer?: string | string[];
  explanation: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface StudentEnrollment {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  organizationId: string;
  enrolledAt: Date;
  startDate: Date;
  expectedCompletionDate: Date;
  status: EnrollmentStatus;
  progress: number; // 0-100%
  moduleProgress: Map<string, ModuleProgress>;
  assessmentScores: Map<string, number>;
  totalLearningTime: number; // hours
  lastActivityDate: Date;
  notes?: string;
}

export interface ModuleProgress {
  moduleId: string;
  completionDate?: Date;
  percentage: number; // 0-100
  timeSpent: number; // minutes
  contentProgress: Map<string, boolean>; // content ID -> viewed
  assessmentAttempts: number;
  bestScore: number;
}

export interface StudentProgress {
  studentId: string;
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalLearningHours: number;
  averageScore: number;
  currentStreak: number; // days of continuous learning
  badges: Badge[];
  certificates: Certification[];
  lastLearningActivity: Date;
}

export interface Badge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  category: 'completion' | 'performance' | 'consistency' | 'challenge';
}

export interface CertificationInfo {
  certificationId: string;
  title: string;
  issuer: string;
  requirements: CertificationRequirement[];
  validityPeriod?: number; // months, null = permanent
  skills: string[];
  alignedFrameworks: string[];
}

export interface CertificationRequirement {
  requirementId: string;
  description: string;
  type: 'course-completion' | 'score-threshold' | 'proctored-exam' | 'project-submission';
  target: number | string;
  completed: boolean;
}

export interface Certification {
  certificationId: string;
  studentId: string;
  certificateId: string;
  title: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: CertificateStatus;
  verificationUrl: string;
  pdfUrl: string;
  skills: string[];
  metadata: Record<string, any>;
}

export interface LearningPath {
  pathId: string;
  title: string;
  description: string;
  studentId: string;
  organizationId: string;
  courses: PathCourse[];
  createdAt: Date;
  updatedAt: Date;
  estimatedDuration: number; // hours
  progress: number; // 0-100%
  targetRole: string;
  targetCompetencies: string[];
}

export interface PathCourse {
  sequenceNumber: number;
  courseId: string;
  title: string;
  required: boolean;
  completed: boolean;
  completedDate?: Date;
}

export interface AdaptiveModuleConfig {
  studentId: string;
  courseId: string;
  baselineDifficulty: CourseLevel;
  adaptationEnabled: boolean;
  difficultyScoreThreshold: number;
  successRate: number; // Current success rate
  recommendedDifficulty: CourseLevel;
  recommendedPaceMultiplier: number;
}

export interface LearningAnalytics {
  studentId: string;
  courseId: string;
  enrollmentDuration: number; // days
  totalTimeSpent: number; // hours
  averageSessionLength: number; // minutes
  sessionsPerWeek: number;
  assessmentAverageScore: number;
  completionTrend: number[]; // % per week
  strugglingTopics: string[];
  strongTopics: string[];
  recommendedReview: string[];
  predictionForCompletion: number; // % probability
}

export class LearningPlatform extends EventEmitter {
  private courses: Map<string, Course> = new Map();
  private enrollments: Map<string, StudentEnrollment> = new Map();
  private studentProgress: Map<string, StudentProgress> = new Map();
  private learningPaths: Map<string, LearningPath> = new Map();
  private certifications: Map<string, Certification> = new Map();
  private adaptiveConfigs: Map<string, AdaptiveModuleConfig> = new Map();

  constructor() {
    super();
  }

  // Course Management
  createCourse(courseData: Partial<Course>): Course {
    const course: Course = {
      courseId: `course-${Date.now()}-${Math.random()}`,
      title: courseData.title || 'Untitled Course',
      description: courseData.description || '',
      level: courseData.level || 'beginner',
      category: courseData.category || 'security',
      prerequisites: courseData.prerequisites || [],
      duration: courseData.duration || 8,
      createdAt: new Date(),
      updatedAt: new Date(),
      instructor: courseData.instructor || { instructorId: '', name: '', email: '', expertise: [], averageRating: 0 },
      modules: courseData.modules || [],
      learningObjectives: courseData.learningObjectives || [],
      targetAudience: courseData.targetAudience || [],
      certification: courseData.certification,
      rating: 0,
      enrollmentCount: 0,
      completionRate: 0,
      isActive: true
    };

    this.courses.set(course.courseId, course);
    this.emit('course-created', course);

    return course;
  }

  addModuleToCourse(courseId: string, module: CourseModule): void {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    course.modules.push(module);
    course.updatedAt = new Date();
    this.emit('module-added', { courseId, module });
  }

  addContentToModule(courseId: string, moduleId: string, content: ModuleContent): void {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    const module = course.modules.find(m => m.moduleId === moduleId);
    if (!module) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    module.content.push(content);
    this.emit('content-added', { courseId, moduleId, content });
  }

  getCourse(courseId: string): Course | undefined {
    return this.courses.get(courseId);
  }

  getAllCourses(filters?: { level?: CourseLevel; category?: string; isActive?: boolean }): Course[] {
    let courses = Array.from(this.courses.values());

    if (filters?.level) {
      courses = courses.filter(c => c.level === filters.level);
    }
    if (filters?.category) {
      courses = courses.filter(c => c.category === filters.category);
    }
    if (filters?.isActive !== undefined) {
      courses = courses.filter(c => c.isActive === filters.isActive);
    }

    return courses;
  }

  // Student Enrollment
  enrollStudent(studentId: string, courseId: string, organizationId: string): StudentEnrollment {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    // Check prerequisites
    const studentProgress = this.studentProgress.get(studentId);
    if (course.prerequisites.length > 0 && studentProgress) {
      const completedCourses = new Set(
        Array.from(this.enrollments.values())
          .filter(e => e.studentId === studentId && e.status === 'completed')
          .map(e => e.courseId)
      );

      for (const prereq of course.prerequisites) {
        if (!completedCourses.has(prereq)) {
          this.emit('enrollment-warning', {
            studentId,
            courseId,
            message: `Student has not completed prerequisite: ${prereq}`
          });
        }
      }
    }

    const enrollment: StudentEnrollment = {
      enrollmentId: `enrollment-${Date.now()}-${Math.random()}`,
      studentId,
      courseId,
      organizationId,
      enrolledAt: new Date(),
      startDate: new Date(),
      expectedCompletionDate: new Date(Date.now() + course.duration * 7 * 24 * 60 * 60 * 1000),
      status: 'enrolled',
      progress: 0,
      moduleProgress: new Map(),
      assessmentScores: new Map(),
      totalLearningTime: 0,
      lastActivityDate: new Date()
    };

    // Initialize module progress
    course.modules.forEach(module => {
      enrollment.moduleProgress.set(module.moduleId, {
        moduleId: module.moduleId,
        percentage: 0,
        timeSpent: 0,
        contentProgress: new Map(),
        assessmentAttempts: 0,
        bestScore: 0
      });
    });

    this.enrollments.set(enrollment.enrollmentId, enrollment);
    course.enrollmentCount++;

    this.emit('student-enrolled', { studentId, courseId, enrollment });

    return enrollment;
  }

  updateEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus): void {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error(`Enrollment not found: ${enrollmentId}`);
    }

    enrollment.status = status;
    this.emit('enrollment-status-changed', { enrollmentId, status });
  }

  recordModuleCompletion(enrollmentId: string, moduleId: string): void {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error(`Enrollment not found: ${enrollmentId}`);
    }

    const moduleProgress = enrollment.moduleProgress.get(moduleId);
    if (moduleProgress) {
      moduleProgress.completionDate = new Date();
      moduleProgress.percentage = 100;
    }

    // Update overall progress
    this.updateOverallProgress(enrollmentId);

    this.emit('module-completed', { enrollmentId, moduleId });
  }

  recordAssessmentResult(enrollmentId: string, assessmentId: string, score: number): void {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error(`Enrollment not found: ${enrollmentId}`);
    }

    enrollment.assessmentScores.set(assessmentId, score);
    this.emit('assessment-completed', { enrollmentId, assessmentId, score });

    // Check if passing score
    const course = this.courses.get(enrollment.courseId);
    if (course) {
      const module = course.modules.find(m =>
        m.assessments.some(a => a.assessmentId === assessmentId)
      );

      if (module) {
        const assessment = module.assessments.find(a => a.assessmentId === assessmentId);
        if (assessment && score >= assessment.passingScore) {
          this.recordModuleCompletion(enrollmentId, module.moduleId);
        }
      }
    }
  }

  private updateOverallProgress(enrollmentId: string): void {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) return;

    const moduleProgresses = Array.from(enrollment.moduleProgress.values());
    if (moduleProgresses.length === 0) {
      enrollment.progress = 0;
      return;
    }

    enrollment.progress = Math.round(
      moduleProgresses.reduce((sum, p) => sum + p.percentage, 0) / moduleProgresses.length
    );

    // Update enrollment status
    if (enrollment.progress === 100) {
      this.updateEnrollmentStatus(enrollment.enrollmentId, 'completed');

      // Award certification if applicable
      const course = this.courses.get(enrollment.courseId);
      if (course?.certification) {
        this.issueCertificate(enrollment.studentId, course, enrollment);
      }
    } else if (enrollment.progress > 0) {
      this.updateEnrollmentStatus(enrollment.enrollmentId, 'in-progress');
    }
  }

  // Learning Path Management
  createLearningPath(
    studentId: string,
    organizationId: string,
    targetRole: string,
    courseIds: string[]
  ): LearningPath {
    const courses = courseIds.map(id => this.courses.get(id)).filter(Boolean) as Course[];

    const path: LearningPath = {
      pathId: `path-${Date.now()}-${Math.random()}`,
      title: `${targetRole} Learning Path`,
      description: `Curated learning path for ${targetRole} role`,
      studentId,
      organizationId,
      courses: courses.map((c, idx) => ({
        sequenceNumber: idx + 1,
        courseId: c.courseId,
        title: c.title,
        required: idx < 3,
        completed: false
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedDuration: courses.reduce((sum, c) => sum + c.duration, 0),
      progress: 0,
      targetRole,
      targetCompetencies: courses.flatMap(c => c.learningObjectives)
    };

    this.learningPaths.set(path.pathId, path);
    this.emit('learning-path-created', path);

    // Auto-enroll in first course
    if (courses.length > 0) {
      this.enrollStudent(studentId, courses[0].courseId, organizationId);
    }

    return path;
  }

  getRecommendedPath(studentId: string, organizationId: string): LearningPath | undefined {
    // In production, this would use ML to recommend based on student profile
    const allPaths = Array.from(this.learningPaths.values()).filter(
      p => p.organizationId === organizationId
    );

    return allPaths.length > 0 ? allPaths[0] : undefined;
  }

  // Adaptive Learning
  getAdaptiveModuleConfig(enrollmentId: string): AdaptiveModuleConfig {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error(`Enrollment not found: ${enrollmentId}`);
    }

    let config = this.adaptiveConfigs.get(enrollmentId);

    if (!config) {
      const course = this.courses.get(enrollment.courseId);
      config = {
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        baselineDifficulty: course?.level || 'beginner',
        adaptationEnabled: true,
        difficultyScoreThreshold: 70,
        successRate: 50,
        recommendedDifficulty: course?.level || 'beginner',
        recommendedPaceMultiplier: 1.0
      };

      this.adaptiveConfigs.set(enrollmentId, config);
    }

    // Calculate adaptive difficulty based on assessment performance
    const scores = Array.from(enrollment.assessmentScores.values());
    if (scores.length > 0) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      config.successRate = avgScore;

      if (avgScore > 85) {
        config.recommendedDifficulty = 'advanced';
        config.recommendedPaceMultiplier = 1.3;
      } else if (avgScore < 60) {
        config.recommendedDifficulty = 'beginner';
        config.recommendedPaceMultiplier = 0.7;
      }
    }

    return config;
  }

  // Student Progress & Analytics
  getStudentProgress(studentId: string): StudentProgress {
    let progress = this.studentProgress.get(studentId);

    if (!progress) {
      progress = {
        studentId,
        enrolledCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalLearningHours: 0,
        averageScore: 0,
        currentStreak: 0,
        badges: [],
        certificates: [],
        lastLearningActivity: new Date()
      };

      this.studentProgress.set(studentId, progress);
    }

    // Update from enrollments
    const studentEnrollments = Array.from(this.enrollments.values()).filter(e => e.studentId === studentId);

    progress.enrolledCourses = studentEnrollments.length;
    progress.completedCourses = studentEnrollments.filter(e => e.status === 'completed').length;
    progress.inProgressCourses = studentEnrollments.filter(e => e.status === 'in-progress').length;
    progress.totalLearningHours = Math.round(
      studentEnrollments.reduce((sum, e) => sum + e.totalLearningTime, 0)
    );

    const allScores = studentEnrollments.flatMap(e => Array.from(e.assessmentScores.values()));
    progress.averageScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    progress.certificates = Array.from(this.certifications.values()).filter(c => c.studentId === studentId);

    return progress;
  }

  getLearningAnalytics(enrollmentId: string): LearningAnalytics {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error(`Enrollment not found: ${enrollmentId}`);
    }

    const enrollmentDays = Math.ceil(
      (new Date().getTime() - enrollment.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const assessmentScores = Array.from(enrollment.assessmentScores.values());
    const avgScore = assessmentScores.length > 0
      ? assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length
      : 0;

    return {
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      enrollmentDuration: enrollmentDays,
      totalTimeSpent: enrollment.totalLearningTime,
      averageSessionLength: enrollment.totalLearningTime > 0
        ? Math.round((enrollment.totalLearningTime * 60) / Math.max(1, enrollmentDays))
        : 0,
      sessionsPerWeek: 5, // Would be calculated from actual session data
      assessmentAverageScore: Math.round(avgScore),
      completionTrend: this.calculateCompletionTrend(enrollment),
      strugglingTopics: this.identifyStrugglingTopics(enrollment),
      strongTopics: this.identifyStrongTopics(enrollment),
      recommendedReview: this.getRecommendedReviewTopics(enrollment),
      predictionForCompletion: Math.min(100, enrollment.progress + (100 - enrollment.progress) * 0.7)
    };
  }

  private calculateCompletionTrend(enrollment: StudentEnrollment): number[] {
    // Simulate weekly completion percentages
    const weeks = Math.ceil((new Date().getTime() - enrollment.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const trend: number[] = [];

    for (let i = 0; i < weeks; i++) {
      trend.push(Math.min(100, (i + 1) * (enrollment.progress / Math.max(1, weeks))));
    }

    return trend;
  }

  private identifyStrugglingTopics(enrollment: StudentEnrollment): string[] {
    const course = this.courses.get(enrollment.courseId);
    if (!course) return [];

    const strugglingTopics: string[] = [];
    const moduleProgresses = enrollment.moduleProgress;

    moduleProgresses.forEach((progress, moduleId) => {
      if (progress.percentage < 50) {
        const module = course.modules.find(m => m.moduleId === moduleId);
        if (module) {
          strugglingTopics.push(module.title);
        }
      }
    });

    return strugglingTopics;
  }

  private identifyStrongTopics(enrollment: StudentEnrollment): string[] {
    const course = this.courses.get(enrollment.courseId);
    if (!course) return [];

    const strongTopics: string[] = [];
    const assessmentScores = enrollment.assessmentScores;

    assessmentScores.forEach((score, assessmentId) => {
      if (score >= 85) {
        const module = course.modules.find(m =>
          m.assessments.some(a => a.assessmentId === assessmentId)
        );

        if (module && !strongTopics.includes(module.title)) {
          strongTopics.push(module.title);
        }
      }
    });

    return strongTopics;
  }

  private getRecommendedReviewTopics(enrollment: StudentEnrollment): string[] {
    const course = this.courses.get(enrollment.courseId);
    if (!course) return [];

    const review: string[] = [];
    const assessmentScores = enrollment.assessmentScores;

    assessmentScores.forEach((score, assessmentId) => {
      if (score >= 60 && score < 75) {
        const module = course.modules.find(m =>
          m.assessments.some(a => a.assessmentId === assessmentId)
        );

        if (module && !review.includes(module.title)) {
          review.push(module.title);
        }
      }
    });

    return review;
  }

  // Certification
  private issueCertificate(studentId: string, course: Course, enrollment: StudentEnrollment): Certification {
    if (!course.certification) {
      throw new Error('Course does not offer certification');
    }

    const certification: Certification = {
      certificationId: `cert-${Date.now()}-${Math.random()}`,
      studentId,
      certificateId: `certificate-${Date.now()}`,
      title: course.certification.title,
      issuer: course.certification.issuer,
      issuedAt: new Date(),
      expiresAt: course.certification.validityPeriod
        ? new Date(Date.now() + course.certification.validityPeriod * 30 * 24 * 60 * 60 * 1000)
        : undefined,
      status: 'issued',
      verificationUrl: `/verify/cert-${Date.now()}`,
      pdfUrl: `/certificates/cert-${Date.now()}.pdf`,
      skills: course.certification.skills,
      metadata: {
        courseId: course.courseId,
        enrollmentId: enrollment.enrollmentId,
        completionDate: new Date(),
        finalScore: Array.from(enrollment.assessmentScores.values()).reduce((a, b) => a + b, 0) /
          Math.max(1, enrollment.assessmentScores.size)
      }
    };

    this.certifications.set(certification.certificationId, certification);
    this.emit('certification-issued', certification);

    return certification;
  }

  getCertification(certificationId: string): Certification | undefined {
    return this.certifications.get(certificationId);
  }

  getStudentCertifications(studentId: string): Certification[] {
    return Array.from(this.certifications.values()).filter(c => c.studentId === studentId);
  }

  revokeCertification(certificationId: string, reason: string): void {
    const cert = this.certifications.get(certificationId);
    if (cert) {
      cert.status = 'revoked';
      this.emit('certification-revoked', { certificationId, reason });
    }
  }

  // Query Methods
  getEnrollment(enrollmentId: string): StudentEnrollment | undefined {
    return this.enrollments.get(enrollmentId);
  }

  getStudentEnrollments(studentId: string): StudentEnrollment[] {
    return Array.from(this.enrollments.values()).filter(e => e.studentId === studentId);
  }

  getLearningPath(pathId: string): LearningPath | undefined {
    return this.learningPaths.get(pathId);
  }

  getStatistics(): Record<string, any> {
    return {
      totalCourses: this.courses.size,
      activeCourses: Array.from(this.courses.values()).filter(c => c.isActive).length,
      totalEnrollments: this.enrollments.size,
      completedEnrollments: Array.from(this.enrollments.values()).filter(e => e.status === 'completed').length,
      totalCertifications: this.certifications.size,
      averageCompletionRate: this.calculateAverageCompletionRate()
    };
  }

  private calculateAverageCompletionRate(): number {
    const enrollments = Array.from(this.enrollments.values());
    if (enrollments.length === 0) return 0;

    return Math.round(
      enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
    );
  }
}

export default LearningPlatform;
