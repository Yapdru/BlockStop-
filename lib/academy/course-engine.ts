/**
 * Course Engine
 * Manages course content and enrollment
 */

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface CourseModule {
  moduleId: string;
  title: string;
  description: string;
  duration: number; // minutes
  content: string; // markdown or HTML
  videoUrl?: string;
  resources: Array<{ title: string; url: string }>;
  quiz?: {
    questions: QuizQuestion[];
    passingScore: number;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
}

export interface Course {
  courseId: string;
  title: string;
  description: string;
  level: CourseLevel;
  instructor: string;
  duration: number; // minutes
  modules: CourseModule[];
  prerequisites: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  pricing?: {
    isFree: boolean;
    price?: number;
  };
}

export interface CourseEnrollment {
  enrollmentId: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'dropped';
  progress: number; // 0-100
  completedModules: string[];
  moduleProgress: Map<string, ModuleProgress>;
  certificateId?: string;
  completedAt?: Date;
}

export interface ModuleProgress {
  moduleId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  quizScore?: number;
}

export class CourseEngine {
  private courses: Map<string, Course> = new Map();
  private enrollments: Map<string, CourseEnrollment> = new Map();
  private studentCourses: Map<string, Set<string>> = new Map();

  /**
   * Create a new course
   */
  createCourse(courseData: Omit<Course, 'courseId' | 'createdAt' | 'updatedAt'>): Course {
    const courseId = `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const course: Course = {
      courseId,
      ...courseData,
      createdAt: now,
      updatedAt: now,
    };

    this.courses.set(courseId, course);
    return course;
  }

  /**
   * Enroll student in course
   */
  enrollStudent(studentId: string, courseId: string): CourseEnrollment {
    const course = this.courses.get(courseId);
    if (!course) throw new Error('Course not found');

    const enrollmentId = `enr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const enrollment: CourseEnrollment = {
      enrollmentId,
      studentId,
      courseId,
      enrolledAt: new Date(),
      status: 'active',
      progress: 0,
      completedModules: [],
      moduleProgress: new Map(course.modules.map((m) => [m.moduleId, { moduleId: m.moduleId, status: 'not-started', progress: 0 }])),
    };

    this.enrollments.set(enrollmentId, enrollment);

    // Track student courses
    if (!this.studentCourses.has(studentId)) {
      this.studentCourses.set(studentId, new Set());
    }
    this.studentCourses.get(studentId)!.add(courseId);

    return enrollment;
  }

  /**
   * Start module
   */
  startModule(enrollmentId: string, moduleId: string): ModuleProgress {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const moduleProgress = enrollment.moduleProgress.get(moduleId);
    if (!moduleProgress) throw new Error('Module not found in enrollment');

    moduleProgress.status = 'in-progress';
    moduleProgress.startedAt = new Date();

    this.updateEnrollmentProgress(enrollmentId);

    return moduleProgress;
  }

  /**
   * Complete module
   */
  completeModule(enrollmentId: string, moduleId: string, quizScore?: number): ModuleProgress {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const moduleProgress = enrollment.moduleProgress.get(moduleId);
    if (!moduleProgress) throw new Error('Module not found in enrollment');

    moduleProgress.status = 'completed';
    moduleProgress.completedAt = new Date();
    moduleProgress.quizScore = quizScore;

    if (!enrollment.completedModules.includes(moduleId)) {
      enrollment.completedModules.push(moduleId);
    }

    this.updateEnrollmentProgress(enrollmentId);

    return moduleProgress;
  }

  /**
   * Get course
   */
  getCourse(courseId: string): Course | undefined {
    return this.courses.get(courseId);
  }

  /**
   * Get student's courses
   */
  getStudentCourses(studentId: string): CourseEnrollment[] {
    return Array.from(this.enrollments.values()).filter((e) => e.studentId === studentId);
  }

  /**
   * Get enrollment details
   */
  getEnrollment(enrollmentId: string): CourseEnrollment | undefined {
    return this.enrollments.get(enrollmentId);
  }

  /**
   * List available courses
   */
  listCourses(level?: CourseLevel, tags?: string[]): Course[] {
    return Array.from(this.courses.values())
      .filter((c) => {
        if (!c.isActive) return false;
        if (level && c.level !== level) return false;
        if (tags && !tags.some((t) => c.tags.includes(t))) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Complete course
   */
  completeCourse(enrollmentId: string, certificateId?: string): CourseEnrollment {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    // Check if all modules are completed
    const allCompleted = Array.from(enrollment.moduleProgress.values()).every((p) => p.status === 'completed');

    if (!allCompleted) {
      throw new Error('Not all modules are completed');
    }

    enrollment.status = 'completed';
    enrollment.progress = 100;
    enrollment.completedAt = new Date();
    enrollment.certificateId = certificateId || `cert-${Date.now()}`;

    this.enrollments.set(enrollmentId, enrollment);

    return enrollment;
  }

  /**
   * Update enrollment progress
   */
  private updateEnrollmentProgress(enrollmentId: string): void {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) return;

    const moduleProgresses = Array.from(enrollment.moduleProgress.values());
    const completedCount = moduleProgresses.filter((p) => p.status === 'completed').length;
    enrollment.progress = Math.round((completedCount / moduleProgresses.length) * 100);
  }

  /**
   * Get course statistics
   */
  getCourseStats(courseId: string) {
    const enrollments = Array.from(this.enrollments.values()).filter((e) => e.courseId === courseId);

    return {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter((e) => e.status === 'active').length,
      completedEnrollments: enrollments.filter((e) => e.status === 'completed').length,
      averageProgress: enrollments.length > 0 ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length : 0,
      completionRate: enrollments.length > 0 ? (enrollments.filter((e) => e.status === 'completed').length / enrollments.length) * 100 : 0,
    };
  }

  /**
   * Get all courses (admin)
   */
  getAllCourses(): Course[] {
    return Array.from(this.courses.values());
  }

  /**
   * Update course
   */
  updateCourse(courseId: string, updates: Partial<Course>): Course {
    const course = this.courses.get(courseId);
    if (!course) throw new Error('Course not found');

    const updated: Course = { ...course, ...updates, updatedAt: new Date() };
    this.courses.set(courseId, updated);

    return updated;
  }
}

export const courseEngine = new CourseEngine();
