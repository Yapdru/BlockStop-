/**
 * BlockStop Phase 30.8 - Training Hub Page
 * Central hub for course discovery, enrollment, and progress tracking
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';

interface Course {
  courseId: string;
  title: string;
  description: string;
  level: string;
  category: string;
  duration: number;
  rating: number;
  enrollmentCount: number;
  completionRate: number;
  instructor: {
    name: string;
    expertise: string[];
  };
}

interface Enrollment {
  enrollmentId: string;
  courseId: string;
  status: string;
  progress: number;
  startedAt?: Date;
}

export default function TrainingPage() {
  const [tab, setTab] = useState<'overview' | 'courses' | 'progress' | 'paths'>('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const categories = [
    'Threat Detection',
    'Incident Response',
    'Compliance',
    'Cloud Security',
    'Endpoint Security',
    'API Security',
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  useEffect(() => {
    // Simulate loading courses and enrollments
    setTimeout(() => {
      const mockCourses: Course[] = [
        {
          courseId: 'course-1',
          title: 'Threat Detection Fundamentals',
          description: 'Learn the basics of detecting security threats in your environment',
          level: 'Beginner',
          category: 'Threat Detection',
          duration: 8,
          rating: 4.8,
          enrollmentCount: 2450,
          completionRate: 78,
          instructor: { name: 'John Smith', expertise: ['Detection', 'Analysis'] },
        },
        {
          courseId: 'course-2',
          title: 'Advanced Threat Hunting',
          description: 'Master proactive threat hunting techniques and tools',
          level: 'Advanced',
          category: 'Threat Detection',
          duration: 16,
          rating: 4.9,
          enrollmentCount: 890,
          completionRate: 65,
          instructor: { name: 'Sarah Johnson', expertise: ['Hunting', 'Analytics'] },
        },
        {
          courseId: 'course-3',
          title: 'Incident Response Playbooks',
          description: 'Handle security incidents effectively with proven playbooks',
          level: 'Intermediate',
          category: 'Incident Response',
          duration: 12,
          rating: 4.7,
          enrollmentCount: 1560,
          completionRate: 82,
          instructor: { name: 'Mike Chen', expertise: ['Incident Response', 'SOAR'] },
        },
        {
          courseId: 'course-4',
          title: 'GDPR and Data Protection',
          description: 'Ensure compliance with GDPR and data protection regulations',
          level: 'Intermediate',
          category: 'Compliance',
          duration: 6,
          rating: 4.6,
          enrollmentCount: 3200,
          completionRate: 89,
          instructor: { name: 'Lisa Anderson', expertise: ['Compliance', 'Governance'] },
        },
        {
          courseId: 'course-5',
          title: 'Cloud Security Architecture',
          description: 'Design and implement secure cloud infrastructure',
          level: 'Advanced',
          category: 'Cloud Security',
          duration: 18,
          rating: 4.8,
          enrollmentCount: 1240,
          completionRate: 71,
          instructor: { name: 'David Kumar', expertise: ['Cloud', 'Architecture'] },
        },
      ];

      const mockEnrollments: Enrollment[] = [
        {
          enrollmentId: 'enroll-1',
          courseId: 'course-1',
          status: 'in-progress',
          progress: 65,
          startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          enrollmentId: 'enroll-2',
          courseId: 'course-3',
          status: 'enrolled',
          progress: 0,
        },
      ];

      setCourses(mockCourses);
      setFilteredCourses(mockCourses);
      setEnrollments(mockEnrollments);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    // Filter courses
    let filtered = courses;

    if (searchQuery) {
      filtered = filtered.filter(
        c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             c.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLevel) {
      filtered = filtered.filter(c => c.level === selectedLevel);
    }

    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    setFilteredCourses(filtered);
  }, [searchQuery, selectedLevel, selectedCategory, courses]);

  const enrolledCourses = enrollments.map(e => courses.find(c => c.courseId === e.courseId)).filter(Boolean) as Course[];
  const inProgressCourses = enrollments.filter(e => e.status === 'in-progress');
  const completedCourses = enrollments.filter(e => e.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Learning Hub</h1>
        <p className="text-xl text-gray-600">Develop your security expertise with our comprehensive training platform</p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-sm text-gray-600">Active Enrollments</div>
            <div className="text-3xl font-bold">{inProgressCourses.length}</div>
            <div className="text-xs text-blue-600 mt-2">In progress</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-3xl font-bold">{completedCourses.length}</div>
            <div className="text-xs text-green-600 mt-2">Courses finished</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Total Hours</div>
            <div className="text-3xl font-bold">{Math.round(enrolledCourses.reduce((sum, c) => sum + c.duration, 0))}</div>
            <div className="text-xs text-purple-600 mt-2">Learning time</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Available Courses</div>
            <div className="text-3xl font-bold">{courses.length}</div>
            <div className="text-xs text-orange-600 mt-2">Ready to enroll</div>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2 font-medium border-b-2 ${
            tab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('courses')}
          className={`px-4 py-2 font-medium border-b-2 ${
            tab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Course Catalog
        </button>
        <button
          onClick={() => setTab('progress')}
          className={`px-4 py-2 font-medium border-b-2 ${
            tab === 'progress' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          My Progress
        </button>
        <button
          onClick={() => setTab('paths')}
          className={`px-4 py-2 font-medium border-b-2 ${
            tab === 'paths' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Learning Paths
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Featured Courses */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Featured Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.slice(0, 4).map(course => (
                <Card key={course.courseId} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{course.title}</h3>
                      <p className="text-sm text-gray-600">{course.instructor.name}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {course.level}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-4">{course.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                    <span>⭐ {course.rating} ({course.enrollmentCount} students)</span>
                    <span>⏱️ {course.duration}h</span>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
                    Enroll Now
                  </button>
                </Card>
              ))}
            </div>
          </div>

          {/* Current Learning */}
          {inProgressCourses.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Continue Learning</h2>
              <div className="space-y-3">
                {inProgressCourses.map(enrollment => {
                  const course = courses.find(c => c.courseId === enrollment.courseId);
                  return course ? (
                    <Card key={enrollment.enrollmentId} className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold">{course.title}</h3>
                        <span className="text-sm font-medium text-gray-600">{enrollment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <button className="text-blue-600 font-medium text-sm hover:underline">
                        Continue →
                      </button>
                    </Card>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'courses' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex flex-wrap gap-2">
              {levels.map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map(course => (
              <Card key={course.courseId} className="p-6 hover:shadow-lg transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{course.title}</h3>
                    <p className="text-xs text-gray-600">{course.instructor.name}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {course.level}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-4 flex-grow">{course.description.substring(0, 80)}...</p>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>⭐ {course.rating} ({course.enrollmentCount} students)</div>
                  <div>⏱️ {course.duration} hours</div>
                  <div>✓ {course.completionRate}% completion rate</div>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
                  Enroll
                </button>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No courses found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'progress' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Progress</h2>
          {enrolledCourses.length > 0 ? (
            <div className="space-y-4">
              {enrollments.map(enrollment => {
                const course = courses.find(c => c.courseId === enrollment.courseId);
                return course ? (
                  <Card key={enrollment.enrollmentId} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{course.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Started: {enrollment.startedAt?.toLocaleDateString()}</p>
                      </div>
                      <span className="px-4 py-2 bg-blue-100 text-blue-800 font-bold rounded-full">
                        {enrollment.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {Math.round(course.duration * (enrollment.progress / 100))} / {course.duration} hours completed
                      </span>
                      <button className="text-blue-600 font-medium hover:underline">
                        View Details →
                      </button>
                    </div>
                  </Card>
                ) : null;
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">You haven't enrolled in any courses yet. Browse our catalog to get started!</p>
            </div>
          )}
        </div>
      )}

      {tab === 'paths' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Learning Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2">Security Analyst Path</h3>
              <p className="text-gray-600 text-sm mb-4">
                Foundation-level training for aspiring security analysts covering threat detection and incident response.
              </p>
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                <div>📚 5 courses</div>
                <div>⏱️ 40 hours total</div>
                <div>🎯 40% complete</div>
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
                Continue Path
              </button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2">Advanced Threat Hunter</h3>
              <p className="text-gray-600 text-sm mb-4">
                Expert-level training in threat hunting, malware analysis, and advanced persistent threats.
              </p>
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                <div>📚 8 courses</div>
                <div>⏱️ 80 hours total</div>
                <div>🎯 Not started</div>
              </div>
              <button className="w-full border border-blue-600 text-blue-600 py-2 rounded font-medium hover:bg-blue-50">
                Start Path
              </button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2">Compliance & Governance</h3>
              <p className="text-gray-600 text-sm mb-4">
                Learn GDPR, compliance frameworks, and governance best practices.
              </p>
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                <div>📚 6 courses</div>
                <div>⏱️ 30 hours total</div>
                <div>🎯 Not started</div>
              </div>
              <button className="w-full border border-blue-600 text-blue-600 py-2 rounded font-medium hover:bg-blue-50">
                Start Path
              </button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg mb-2">Cloud Security</h3>
              <p className="text-gray-600 text-sm mb-4">
                Secure your cloud infrastructure with AWS, Azure, and GCP security best practices.
              </p>
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                <div>📚 7 courses</div>
                <div>⏱️ 60 hours total</div>
                <div>🎯 Not started</div>
              </div>
              <button className="w-full border border-blue-600 text-blue-600 py-2 rounded font-medium hover:bg-blue-50">
                Start Path
              </button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
