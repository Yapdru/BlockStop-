/**
 * Academy Courses API Routes
 */

import { courseEngine } from '@/lib/academy/course-engine';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/academy/courses
 * List available courses
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level');
    const studentId = searchParams.get('studentId');

    if (studentId) {
      // Get student's enrolled courses
      const enrollments = courseEngine.getStudentCourses(studentId);
      return NextResponse.json({
        success: true,
        data: enrollments,
        count: enrollments.length,
      });
    }

    // Get available courses
    const courses = courseEngine.listCourses(level as any);

    return NextResponse.json({
      success: true,
      data: courses,
      count: courses.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academy/courses
 * Create new course (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, level, instructor, duration, modules } = body;

    if (!title || !level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const course = courseEngine.createCourse({
      title,
      description,
      level,
      instructor,
      duration: duration || 0,
      modules: modules || [],
      prerequisites: [],
      tags: [],
      isActive: true,
      pricing: { isFree: false },
    });

    return NextResponse.json(
      {
        success: true,
        data: course,
        message: 'Course created',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
