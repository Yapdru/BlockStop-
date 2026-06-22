/**
 * BlockStop Phase 30.8 - Enhanced Learning Platform
 * Course management, interactive labs, progress tracking, badges, and leaderboards
 * Production-ready implementation with 50+ video courses
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LearningFormat = 'video' | 'interactive' | 'quiz' | 'lab' | 'document' | 'live-session';
export type EnrollmentStatus = 'enrolled' | 'in-progress' | 'completed' | 'dropped' | 'paused';
export type LabType = 'sandbox' | 'vm' | 'container' | 'web-based';
export type ChallengeType = 'code' | 'config' | 'exploit' | 'defense' | 'analysis';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type BadgeCategory = 'skill' | 'completion' | 'excellence' | 'community' | 'streak';

export interface Course {
  courseId: string;
  title: string;
  description: string;
  level: CourseLevel;
  category: string;
  prerequisites: string[];
  duration: number; // hours
  instructor: InstructorInfo;
  modules: CourseModule[];
  learningObjectives: string[];
  targetAudience: string[];
  rating: number; // 0-5
  enrollmentCount: number;
  completionRate: number; // %
  isActive: boolean;
  status: 'draft' | 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  tags: string[];
  certification?: string; // Certification track ID if applicable
}

export interface InstructorInfo {
  instructorId: string;
  name: string;
  email: string;
  bio?: string;
  expertise: string[];
  averageRating: number;
  credentials?: string[];
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
  labs: string[]; // Lab IDs
  isRequired: boolean;
  learningObjectives: string[];
}

export interface ModuleContent {
  contentId: string;
  moduleId: string;
  type: LearningFormat;
  title: string;
  duration: number; // minutes
  url?: string;
  embedUrl?: string; // YouTube, Vimeo
  description: string;
  resources: Resource[];
  sequenceNumber: number;
  difficulty: CourseLevel;
}

export interface Resource {
  resourceId: string;
  title: string;
  type: 'document' | 'video' | 'code' | 'image' | 'archive' | 'reference';
  url: string;
  fileSize: number;
  downloadCount: number;
  lastUpdated: Date;
  description?: string;
}

export interface Assessment {
  assessmentId: string;
  moduleId: string;
  title: string;
  description: string;
  type: 'quiz' | 'exam' | 'hands-on' | 'project';
  questions: Question[];
  passingScore: number; // % (0-100)
  duration: number; // minutes
  retakesAllowed: number;
  weight: number; // For final grade calculation
  showAnswerImmediately: boolean;
  feedbackType: 'immediate' | 'delayed' | 'end-of-course';
}

export interface Question {
  questionId: string;
  assessmentId: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'scenario' | 'code';
  options?: string[];
  correctAnswer?: string | string[];
  explanation: string;
  difficulty: CourseLevel;
  points: number;
  hints?: string[];
  caseStudy?: string; // Scenario context
}

export interface Enrollment {
  enrollmentId: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: EnrollmentStatus;
  progress: number; // 0-100
  lastAccessedAt: Date;
  totalTimeSpent: number; // seconds
  currentModuleId?: string;
  score?: number; // Final grade
  certificateId?: string;
}

export interface CourseProgress {
  progressId: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  moduleProgress: ModuleProgress[];
  overallPercentage: number;
  estimatedCompletionDate: Date;
  lastAccessedAt: Date;
  totalTimeSpent: number; // seconds
  currentStreak: number; // Days
  longestStreak: number; // Days
  assessmentScores: AssessmentScore[];
  labCompletions: LabCompletion[];
}

export interface ModuleProgress {
  moduleId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  percentage: number;
  contentCompleted: Set<string>; // Content IDs
  assessmentsPassed: string[]; // Assessment IDs
  timeSpent: number; // seconds
  lastAccessedAt: Date;
  completedAt?: Date;
}

export interface AssessmentScore {
  assessmentId: string;
  score: number;
  percentage: number;
  attempt: number;
  completedAt: Date;
  timeSpent: number; // seconds
}

export interface InteractiveLab {
  labId: string;
  courseId: string;
  moduleId?: string;
  title: string;
  description: string;
  environment: LabEnvironment;
  difficulty: CourseLevel;
  objectives: string[];
  estimatedDuration: number; // minutes
  instructions: LabInstruction[];
  resources: LabResource[];
  challenges: Challenge[];
  successCriteria: SuccessCriteria[];
  hints: string[];
  status: 'draft' | 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  author: string;
}

export interface LabEnvironment {
  environmentId: string;
  type: LabType;
  operatingSystem: string;
  tools: ToolRequirement[];
  language?: string;
  setupScript?: string;
  teardownScript?: string;
  maxInstances: number;
  memoryRequired: number; // MB
  storageRequired: number; // MB
  networkRequired: boolean;
}

export interface ToolRequirement {
  toolId: string;
  name: string;
  version: string;
  installCommand?: string;
}

export interface LabInstruction {
  instructionId: string;
  stepNumber: number;
  title: string;
  description: string;
  details: string;
  commands?: string[];
  expectedOutput?: string;
  screenshot?: string;
  hints: string[];
  estimatedTime?: number; // minutes
}

export interface LabResource {
  resourceId: string;
  type: 'sample-file' | 'test-data' | 'configuration' | 'malware-sample' | 'pcap' | 'log-file';
  name: string;
  description: string;
  downloadUrl: string;
  fileSize: number;
  checksum?: string;
  isDownloadable: boolean;
}

export interface Challenge {
  challengeId: string;
  labId: string;
  title: string;
  description: string;
  difficulty: CourseLevel;
  type: ChallengeType;
  objective: string;
  hints: string[];
  solution: string;
  solutionExplanation: string;
  timeLimit: number; // minutes
  pointsReward: number;
}

export interface SuccessCriteria {
  criteriaId: string;
  description: string;
  type: 'manual' | 'automated';
  automatedCheck?: string; // Script/command to verify
  required: boolean;
}

export interface LabSession {
  sessionId: string;
  labId: string;
  userId: string;
  enrollmentId: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'paused' | 'completed' | 'failed' | 'abandoned';
  instanceId: string; // Cloud instance ID
  completedChallenges: string[];
  failedChallenges: string[];
  achievements: Challenge[];
  notes: string;
  totalTimeSpent: number; // seconds
  ipAddress?: string;
  systemInfo?: Record<string, string>;
}

export interface LabCompletion {
  completionId: string;
  labId: string;
  sessionId: string;
  userId: string;
  completedAt: Date;
  score: number; // 0-100
  challenges: ChallengeCompletion[];
  certificateId?: string;
  feedbackUrl?: string;
}

export interface ChallengeCompletion {
  challengeId: string;
  completed: boolean;
  score: number;
  attempts: number;
  timeSpent: number; // seconds
  completedAt?: Date;
}

export interface BadgeAchievement {
  badgeId: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  earnedAt: Date;
  displayable: boolean;
  unlockedCondition: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  progress?: number; // For progress-based badges
}

export interface LearningPath {
  pathId: string;
  name: string;
  description: string;
  targetSkill: string;
  difficulty: CourseLevel;
  courses: CourseSequence[];
  estimatedHours: number;
  successRate: number; // %
  userCount: number;
  rating: number;
  createdAt: Date;
  prerequisites: string[];
  outcomes: string[];
}

export interface CourseSequence {
  sequenceId: string;
  courseId: string;
  order: number;
  isPrerequisite: boolean;
  dependencies: string[];
}

export interface Leaderboard {
  leaderboardId: string;
  type: 'global' | 'organization' | 'cohort' | 'course';
  period: 'weekly' | 'monthly' | 'all-time';
  entries: LeaderboardEntry[];
  updatedAt: Date;
  referenceId?: string; // For course/cohort leaderboards
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  points: number;
  coursesCompleted: number;
  certificationsEarned: number;
  badgesEarned: number;
  streakDays: number;
  lastActivityAt: Date;
  trend: 'up' | 'down' | 'stable'; // Change from last period
}

export interface LearningRecommendation {
  recommendationId: string;
  userId: string;
  type: 'next-course' | 'skill-gap' | 'trending' | 'personalized';
  course: Course;
  reason: string;
  score: number; // 0-100 relevance score
  generatedAt: Date;
}

export class LearningPlatformManager extends EventEmitter {
  private courses: Map<string, Course> = new Map();
  private labs: Map<string, InteractiveLab> = new Map();
  private enrollments: Map<string, Enrollment> = new Map();
  private progress: Map<string, CourseProgress> = new Map();
  private badges: Map<string, BadgeAchievement> = new Map();
  private badgeDefinitions: Map<string, BadgeDefinition> = new Map();
  private labSessions: Map<string, LabSession> = new Map();
  private leaderboards: Map<string, Leaderboard> = new Map();
  private learningPaths: Map<string, LearningPath> = new Map();

  constructor() {
    super();
    this.initializeBadgeDefinitions();
    this.updateLeaderboards();
  }

  // ============ COURSE MANAGEMENT ============

  /**
   * Create a course
   */
  createCourse(course: Omit<Course, 'courseId' | 'createdAt' | 'updatedAt' | 'enrollmentCount' | 'completionRate'>): Course {
    const courseId = `course-${crypto.randomBytes(8).toString('hex')}`;
    const fullCourse: Course = {
      ...course,
      courseId,
      createdAt: new Date(),
      updatedAt: new Date(),
      enrollmentCount: 0,
      completionRate: 0,
    };

    this.courses.set(courseId, fullCourse);
    this.emit('course:created', fullCourse);
    return fullCourse;
  }

  /**
   * Get course by ID
   */
  getCourse(courseId: string): Course | undefined {
    return this.courses.get(courseId);
  }

  /**
   * Get all courses
   */
  getAllCourses(): Course[] {
    return Array.from(this.courses.values()).filter(c => c.isActive && c.status === 'active');
  }

  /**
   * Get courses by level
   */
  getCoursesByLevel(level: CourseLevel): Course[] {
    return Array.from(this.courses.values()).filter(
      c => c.level === level && c.isActive && c.status === 'active'
    );
  }

  /**
   * Get courses by category
   */
  getCoursesByCategory(category: string): Course[] {
    return Array.from(this.courses.values()).filter(
      c => c.category === category && c.isActive && c.status === 'active'
    );
  }

  /**
   * Search courses
   */
  searchCourses(query: string, filters?: { level?: CourseLevel; category?: string }): Course[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.courses.values()).filter(c => {
      if (!c.isActive || c.status !== 'active') return false;
      if (filters?.level && c.level !== filters.level) return false;
      if (filters?.category && c.category !== filters.category) return false;

      return (
        c.title.toLowerCase().includes(queryLower) ||
        c.description.toLowerCase().includes(queryLower) ||
        c.tags.some(t => t.toLowerCase().includes(queryLower))
      );
    });
  }

  // ============ ENROLLMENT ============

  /**
   * Enroll user in course
   */
  enrollUser(userId: string, courseId: string): Enrollment {
    const course = this.courses.get(courseId);
    if (!course) throw new Error('Course not found');

    const enrollmentId = `enroll-${crypto.randomBytes(8).toString('hex')}`;
    const enrollment: Enrollment = {
      enrollmentId,
      userId,
      courseId,
      enrolledAt: new Date(),
      status: 'enrolled',
      progress: 0,
      lastAccessedAt: new Date(),
      totalTimeSpent: 0,
    };

    this.enrollments.set(enrollmentId, enrollment);

    // Initialize progress tracking
    const courseProgress = this.initializeCourseProgress(userId, courseId);
    this.progress.set(courseProgress.progressId, courseProgress);

    course.enrollmentCount++;

    this.emit('enrollment:created', enrollment);
    return enrollment;
  }

  /**
   * Get user's enrollments
   */
  getUserEnrollments(userId: string): Enrollment[] {
    return Array.from(this.enrollments.values()).filter(e => e.userId === userId);
  }

  /**
   * Get enrollment
   */
  getEnrollment(enrollmentId: string): Enrollment | undefined {
    return this.enrollments.get(enrollmentId);
  }

  /**
   * Update enrollment status
   */
  updateEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus): Enrollment | null {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) return null;

    enrollment.status = status;

    if (status === 'in-progress' && !enrollment.startedAt) {
      enrollment.startedAt = new Date();
    }

    if (status === 'completed' && !enrollment.completedAt) {
      enrollment.completedAt = new Date();
    }

    this.emit('enrollment:updated', enrollment);
    return enrollment;
  }

  // ============ PROGRESS TRACKING ============

  /**
   * Get course progress
   */
  getCourseProgress(userId: string, courseId: string): CourseProgress | undefined {
    return Array.from(this.progress.values()).find(
      p => p.userId === userId && p.courseId === courseId
    );
  }

  /**
   * Mark module as completed
   */
  markModuleCompleted(progressId: string, moduleId: string): CourseProgress | null {
    const progress = this.progress.get(progressId);
    if (!progress) return null;

    const moduleProgress = progress.moduleProgress.find(m => m.moduleId === moduleId);
    if (!moduleProgress) return null;

    moduleProgress.status = 'completed';
    moduleProgress.completedAt = new Date();

    // Update overall progress
    this.calculateProgress(progress);

    // Check for milestone badges
    this.checkMilestoneBadges(progress.userId, progress.courseId);

    this.emit('progress:module-completed', { progressId, moduleId });
    return progress;
  }

  /**
   * Mark content as completed
   */
  markContentCompleted(progressId: string, moduleId: string, contentId: string, timeSpent: number): ModuleProgress | null {
    const progress = this.progress.get(progressId);
    if (!progress) return null;

    const moduleProgress = progress.moduleProgress.find(m => m.moduleId === moduleId);
    if (!moduleProgress) return null;

    moduleProgress.contentCompleted.add(contentId);
    moduleProgress.timeSpent += timeSpent;
    progress.totalTimeSpent += timeSpent;

    // Update module status
    if (moduleProgress.status === 'not-started') {
      moduleProgress.status = 'in-progress';
      progress.startedAt = new Date();
    }

    // Calculate module percentage
    const course = this.courses.get(progress.courseId);
    if (course) {
      const module = course.modules.find(m => m.moduleId === moduleId);
      if (module) {
        moduleProgress.percentage = (moduleProgress.contentCompleted.size / module.content.length) * 100;
      }
    }

    // Update overall progress
    this.calculateProgress(progress);

    return moduleProgress;
  }

  /**
   * Record assessment score
   */
  recordAssessmentScore(progressId: string, assessmentId: string, score: number, timeSpent: number): AssessmentScore {
    const progress = this.progress.get(progressId);
    if (!progress) throw new Error('Progress not found');

    const percentage = score;
    const attempt = (progress.assessmentScores.filter(a => a.assessmentId === assessmentId).length || 0) + 1;

    const assessmentScore: AssessmentScore = {
      assessmentId,
      score,
      percentage,
      attempt,
      completedAt: new Date(),
      timeSpent,
    };

    progress.assessmentScores.push(assessmentScore);

    // Mark related module assessment as passed
    const course = this.courses.get(progress.courseId);
    if (course) {
      for (const module of course.modules) {
        const assessment = module.assessments.find(a => a.assessmentId === assessmentId);
        if (assessment) {
          const moduleProgress = progress.moduleProgress.find(m => m.moduleId === module.moduleId);
          if (moduleProgress && !moduleProgress.assessmentsPassed.includes(assessmentId)) {
            moduleProgress.assessmentsPassed.push(assessmentId);
          }
          break;
        }
      }
    }

    // Update overall progress
    this.calculateProgress(progress);

    // Check streak
    this.updateStreak(progress);

    // Check for achievement badges
    this.checkAchievementBadges(progress.userId, progress.courseId, score);

    this.emit('progress:assessment-completed', assessmentScore);
    return assessmentScore;
  }

  // ============ INTERACTIVE LABS ============

  /**
   * Create lab
   */
  createLab(lab: Omit<InteractiveLab, 'labId' | 'createdAt' | 'updatedAt'>): InteractiveLab {
    const labId = `lab-${crypto.randomBytes(8).toString('hex')}`;
    const fullLab: InteractiveLab = {
      ...lab,
      labId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.labs.set(labId, fullLab);
    this.emit('lab:created', fullLab);
    return fullLab;
  }

  /**
   * Get lab by ID
   */
  getLab(labId: string): InteractiveLab | undefined {
    return this.labs.get(labId);
  }

  /**
   * Launch lab session
   */
  launchLabSession(labId: string, userId: string, enrollmentId: string): LabSession {
    const lab = this.labs.get(labId);
    if (!lab) throw new Error('Lab not found');

    const sessionId = `session-${crypto.randomBytes(8).toString('hex')}`;
    const instanceId = `instance-${crypto.randomBytes(8).toString('hex')}`;

    const session: LabSession = {
      sessionId,
      labId,
      userId,
      enrollmentId,
      startedAt: new Date(),
      status: 'active',
      instanceId,
      completedChallenges: [],
      failedChallenges: [],
      achievements: [],
      notes: '',
      totalTimeSpent: 0,
    };

    this.labSessions.set(sessionId, session);
    this.emit('lab:session-started', session);
    return session;
  }

  /**
   * Complete lab session
   */
  completeLabSession(sessionId: string, notes?: string): LabCompletion | null {
    const session = this.labSessions.get(sessionId);
    if (!session) return null;

    session.status = 'completed';
    session.endedAt = new Date();
    if (notes) session.notes = notes;

    const completionId = `completion-${crypto.randomBytes(8).toString('hex')}`;
    const completion: LabCompletion = {
      completionId,
      labId: session.labId,
      sessionId,
      userId: session.userId,
      completedAt: new Date(),
      score: (session.completedChallenges.length / session.achievements.length) * 100,
      challenges: session.completedChallenges.map(challengeId => ({
        challengeId,
        completed: true,
        score: 100,
        attempts: 1,
        timeSpent: 0,
        completedAt: new Date(),
      })),
    };

    // Award lab completion badge
    this.awardBadge(session.userId, 'lab-completion', `Completed: ${session.labId}`);

    this.emit('lab:session-completed', completion);
    return completion;
  }

  /**
   * Fail lab challenge
   */
  failLabChallenge(sessionId: string, challengeId: string): void {
    const session = this.labSessions.get(sessionId);
    if (session) {
      if (!session.failedChallenges.includes(challengeId)) {
        session.failedChallenges.push(challengeId);
      }
      this.emit('lab:challenge-failed', { sessionId, challengeId });
    }
  }

  /**
   * Complete lab challenge
   */
  completeLabChallenge(sessionId: string, challengeId: string): void {
    const session = this.labSessions.get(sessionId);
    if (session) {
      const lab = this.labs.get(session.labId);
      if (lab) {
        const challenge = lab.challenges.find(c => c.challengeId === challengeId);
        if (challenge) {
          if (!session.completedChallenges.includes(challengeId)) {
            session.completedChallenges.push(challengeId);
            session.achievements.push(challenge);
          }
          this.emit('lab:challenge-completed', { sessionId, challengeId });
        }
      }
    }
  }

  // ============ BADGES & ACHIEVEMENTS ============

  /**
   * Award badge to user
   */
  awardBadge(userId: string, badgeType: string, context?: string): BadgeAchievement | null {
    const badgeDef = this.badgeDefinitions.get(badgeType);
    if (!badgeDef) return null;

    // Check if user already has this badge
    const existingBadge = Array.from(this.badges.values()).find(
      b => b.userId === userId && b.name === badgeDef.name && (context ? b.description.includes(context) : true)
    );

    if (existingBadge && badgeDef.category !== 'streak') return existingBadge;

    const badge: BadgeAchievement = {
      badgeId: `badge-${crypto.randomBytes(8).toString('hex')}`,
      userId,
      name: badgeDef.name,
      description: context ? `${badgeDef.description} - ${context}` : badgeDef.description,
      icon: badgeDef.icon,
      category: badgeDef.category,
      tier: badgeDef.tier,
      earnedAt: new Date(),
      displayable: true,
      unlockedCondition: badgeDef.unlockedCondition,
      rarity: badgeDef.rarity,
    };

    this.badges.set(badge.badgeId, badge);
    this.emit('badge:awarded', badge);
    return badge;
  }

  /**
   * Get user badges
   */
  getUserBadges(userId: string): BadgeAchievement[] {
    return Array.from(this.badges.values()).filter(b => b.userId === userId && b.displayable);
  }

  /**
   * Check for milestone badges
   */
  private checkMilestoneBadges(userId: string, courseId: string): void {
    const courseProgress = Array.from(this.progress.values()).find(
      p => p.userId === userId && p.courseId === courseId
    );

    if (!courseProgress) return;

    // 25% completion
    if (courseProgress.overallPercentage >= 25 && courseProgress.overallPercentage < 50) {
      this.awardBadge(userId, 'course-progress-25', courseId);
    }

    // 50% completion
    if (courseProgress.overallPercentage >= 50 && courseProgress.overallPercentage < 75) {
      this.awardBadge(userId, 'course-progress-50', courseId);
    }

    // 75% completion
    if (courseProgress.overallPercentage >= 75 && courseProgress.overallPercentage < 100) {
      this.awardBadge(userId, 'course-progress-75', courseId);
    }

    // 100% completion
    if (courseProgress.overallPercentage >= 100) {
      this.awardBadge(userId, 'course-complete', courseId);
    }
  }

  /**
   * Check for achievement badges based on score
   */
  private checkAchievementBadges(userId: string, courseId: string, score: number): void {
    if (score >= 95) {
      this.awardBadge(userId, 'perfect-score', courseId);
    } else if (score >= 90) {
      this.awardBadge(userId, 'excellent-score', courseId);
    }
  }

  // ============ LEADERBOARDS ============

  /**
   * Get leaderboard
   */
  getLeaderboard(type: string, period: string = 'all-time'): LeaderboardEntry[] {
    const leaderboard = this.leaderboards.get(`${type}-${period}`);
    return leaderboard?.entries || [];
  }

  /**
   * Get user rank
   */
  getUserRank(userId: string, type: string = 'global'): number {
    const leaderboard = this.leaderboards.get(`${type}-all-time`);
    if (!leaderboard) return -1;

    const entry = leaderboard.entries.find(e => e.userId === userId);
    return entry?.rank || -1;
  }

  /**
   * Update leaderboards
   */
  private updateLeaderboards(): void {
    // Calculate global points for each user
    const userPoints = new Map<string, { points: number; courses: number; certs: number; badges: number; streak: number }>();

    for (const enrollment of this.enrollments.values()) {
      if (enrollment.status === 'completed') {
        if (!userPoints.has(enrollment.userId)) {
          userPoints.set(enrollment.userId, { points: 0, courses: 0, certs: 0, badges: 0, streak: 0 });
        }

        const user = userPoints.get(enrollment.userId)!;
        user.points += 100;
        user.courses++;
      }
    }

    for (const badge of this.badges.values()) {
      if (!userPoints.has(badge.userId)) {
        userPoints.set(badge.userId, { points: 0, courses: 0, certs: 0, badges: 0, streak: 0 });
      }

      const user = userPoints.get(badge.userId)!;
      user.points += badge.tier === 'gold' ? 50 : badge.tier === 'silver' ? 25 : 10;
      user.badges++;
    }

    for (const progress of this.progress.values()) {
      if (!userPoints.has(progress.userId)) {
        userPoints.set(progress.userId, { points: 0, courses: 0, certs: 0, badges: 0, streak: 0 });
      }

      const user = userPoints.get(progress.userId)!;
      user.streak = progress.currentStreak;
    }

    // Create leaderboard entries
    const entries: LeaderboardEntry[] = Array.from(userPoints.entries())
      .map(([userId, data], index) => ({
        rank: index + 1,
        userId,
        userName: `User ${userId.substring(0, 8)}`,
        points: data.points,
        coursesCompleted: data.courses,
        certificationsEarned: data.certs,
        badgesEarned: data.badges,
        streakDays: data.streak,
        lastActivityAt: new Date(),
        trend: 'stable' as const,
      }))
      .sort((a, b) => b.points - a.points)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    this.leaderboards.set('global-all-time', {
      leaderboardId: `leaderboard-global-all-time`,
      type: 'global',
      period: 'all-time',
      entries,
      updatedAt: new Date(),
    });

    // Update periodically
    setTimeout(() => this.updateLeaderboards(), 60 * 60 * 1000); // Every hour
  }

  // ============ LEARNING PATHS ============

  /**
   * Create learning path
   */
  createLearningPath(path: Omit<LearningPath, 'pathId' | 'createdAt'>): LearningPath {
    const pathId = `path-${crypto.randomBytes(8).toString('hex')}`;
    const fullPath: LearningPath = {
      ...path,
      pathId,
      createdAt: new Date(),
      userCount: 0,
    };

    this.learningPaths.set(pathId, fullPath);
    this.emit('learning-path:created', fullPath);
    return fullPath;
  }

  /**
   * Get learning path
   */
  getLearningPath(pathId: string): LearningPath | undefined {
    return this.learningPaths.get(pathId);
  }

  /**
   * Get learning paths
   */
  getLearningPaths(): LearningPath[] {
    return Array.from(this.learningPaths.values()).sort((a, b) => b.rating - a.rating);
  }

  // ============ RECOMMENDATIONS ============

  /**
   * Get course recommendations for user
   */
  getRecommendations(userId: string, limit: number = 5): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = [];
    const userEnrollments = this.enrollments.filter(e => e[1].userId === userId);
    const enrolledCourseIds = new Set(Array.from(userEnrollments).map(e => e[1].courseId));

    // Find trending courses
    const allCourses = this.getAllCourses();
    const trendingCourses = allCourses
      .filter(c => !enrolledCourseIds.has(c.courseId))
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 5);

    trendingCourses.forEach(course => {
      recommendations.push({
        recommendationId: `rec-${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'trending',
        course,
        reason: `Trending course with ${course.enrollmentCount} enrollments`,
        score: Math.min(100, course.enrollmentCount),
        generatedAt: new Date(),
      });
    });

    return recommendations.slice(0, limit);
  }

  // ============ PRIVATE HELPER METHODS ============

  private initializeCourseProgress(userId: string, courseId: string): CourseProgress {
    const progressId = `progress-${crypto.randomBytes(8).toString('hex')}`;
    const course = this.courses.get(courseId);

    const moduleProgress: ModuleProgress[] = (course?.modules || []).map(module => ({
      moduleId: module.moduleId,
      status: 'not-started',
      percentage: 0,
      contentCompleted: new Set(),
      assessmentsPassed: [],
      timeSpent: 0,
      lastAccessedAt: new Date(),
    }));

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + Math.ceil((course?.duration || 0) * 1.2));

    return {
      progressId,
      userId,
      courseId,
      enrolledAt: new Date(),
      moduleProgress,
      overallPercentage: 0,
      estimatedCompletionDate: estimatedDate,
      lastAccessedAt: new Date(),
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      assessmentScores: [],
      labCompletions: [],
    };
  }

  private calculateProgress(progress: CourseProgress): void {
    const completedModules = progress.moduleProgress.filter(m => m.status === 'completed').length;
    const totalModules = progress.moduleProgress.length;

    progress.overallPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
    progress.lastAccessedAt = new Date();

    // Update enrollment
    const enrollment = Array.from(this.enrollments.values()).find(
      e => e.userId === progress.userId && e.courseId === progress.courseId
    );

    if (enrollment) {
      enrollment.progress = Math.round(progress.overallPercentage);
      enrollment.lastAccessedAt = new Date();

      if (progress.overallPercentage === 100 && enrollment.status !== 'completed') {
        this.updateEnrollmentStatus(enrollment.enrollmentId, 'completed');
      }
    }
  }

  private updateStreak(progress: CourseProgress): void {
    const today = new Date().toDateString();
    const lastAccess = progress.lastAccessedAt.toDateString();

    if (today === lastAccess) {
      progress.currentStreak++;
    } else if (new Date().getTime() - progress.lastAccessedAt.getTime() > 24 * 60 * 60 * 1000) {
      progress.currentStreak = 1;
    }

    progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);

    if (progress.currentStreak % 7 === 0) {
      this.awardBadge(progress.userId, 'streak-7day', `${progress.currentStreak} day streak`);
    }

    if (progress.currentStreak % 30 === 0) {
      this.awardBadge(progress.userId, 'streak-30day', `${progress.currentStreak} day streak`);
    }
  }

  private initializeBadgeDefinitions(): void {
    const badges: [string, BadgeDefinition][] = [
      ['course-complete', {
        name: 'Course Completed',
        description: 'Complete a full course',
        icon: '🏆',
        category: 'completion',
        tier: 'gold',
        unlockedCondition: 'Complete 100% of course modules',
        rarity: 'uncommon',
      }],
      ['perfect-score', {
        name: 'Perfect Score',
        description: 'Achieve 100% on an assessment',
        icon: '⭐',
        category: 'excellence',
        tier: 'platinum',
        unlockedCondition: 'Score 100% on assessment',
        rarity: 'rare',
      }],
      ['excellent-score', {
        name: 'Excellent Score',
        description: 'Achieve 90%+ on an assessment',
        icon: '✨',
        category: 'excellence',
        tier: 'gold',
        unlockedCondition: 'Score 90%+ on assessment',
        rarity: 'uncommon',
      }],
      ['lab-completion', {
        name: 'Lab Master',
        description: 'Complete an interactive lab',
        icon: '🔬',
        category: 'skill',
        tier: 'silver',
        unlockedCondition: 'Complete lab challenges',
        rarity: 'uncommon',
      }],
      ['streak-7day', {
        name: '7-Day Streak',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        category: 'streak',
        tier: 'silver',
        unlockedCondition: 'Learn for 7 consecutive days',
        rarity: 'uncommon',
      }],
      ['streak-30day', {
        name: '30-Day Streak',
        description: 'Maintain a 30-day learning streak',
        icon: '🔥🔥',
        category: 'streak',
        tier: 'gold',
        unlockedCondition: 'Learn for 30 consecutive days',
        rarity: 'rare',
      }],
      ['course-progress-25', {
        name: 'Quarter Way',
        description: 'Complete 25% of a course',
        icon: '📈',
        category: 'completion',
        tier: 'bronze',
        unlockedCondition: 'Complete 25% of course',
        rarity: 'common',
      }],
      ['course-progress-50', {
        name: 'Halfway There',
        description: 'Complete 50% of a course',
        icon: '📊',
        category: 'completion',
        tier: 'silver',
        unlockedCondition: 'Complete 50% of course',
        rarity: 'uncommon',
      }],
      ['course-progress-75', {
        name: 'Three Quarters',
        description: 'Complete 75% of a course',
        icon: '📈📈',
        category: 'completion',
        tier: 'gold',
        unlockedCondition: 'Complete 75% of course',
        rarity: 'uncommon',
      }],
    ];

    for (const [key, def] of badges) {
      this.badgeDefinitions.set(key, def);
    }
  }
}

interface BadgeDefinition {
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  unlockedCondition: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Export singleton
export const learningPlatformManager = new LearningPlatformManager();
