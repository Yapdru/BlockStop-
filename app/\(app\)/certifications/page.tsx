/**
 * BlockStop Phase 30.8 - Certifications Tracker Page
 * Manage certification paths, exams, and progress
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';

interface CertificationTrack {
  id: string;
  name: string;
  level: string;
  description: string;
  prerequisites: string[];
  requiredCourses: string[];
  estimatedHours: number;
  icon: string;
}

interface UserCertification {
  id: string;
  trackId: string;
  name: string;
  issued: Date;
  expires: Date;
  status: string;
  certificateNumber: string;
}

interface ExamSchedule {
  examId: string;
  trackId: string;
  title: string;
  dateTime: Date;
  location: string;
  capacity: number;
  registered: number;
}

export default function CertificationsPage() {
  const [tab, setTab] = useState<'overview' | 'tracks' | 'exams' | 'certificates'>('overview');
  const [tracks, setTracks] = useState<CertificationTrack[]>([]);
  const [userCerts, setUserCerts] = useState<UserCertification[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      const mockTracks: CertificationTrack[] = [
        {
          id: 'bsa',
          name: 'BlockStop Security Associate',
          level: 'Associate',
          description: 'Foundation-level certification for security professionals',
          prerequisites: [],
          requiredCourses: ['Security Fundamentals', 'Threat Detection Basics'],
          estimatedHours: 40,
          icon: '🔒',
        },
        {
          id: 'bse',
          name: 'BlockStop Security Engineer',
          level: 'Professional',
          description: 'Professional certification for experienced security engineers',
          prerequisites: ['bsa'],
          requiredCourses: ['Advanced Threats', 'Threat Hunting', 'Digital Forensics'],
          estimatedHours: 80,
          icon: '⚙️',
        },
        {
          id: 'bath',
          name: 'BlockStop Advanced Threat Hunter',
          level: 'Expert',
          description: 'Expert-level certification for advanced threat hunters',
          prerequisites: ['bse'],
          requiredCourses: ['APT Groups', 'Malware Analysis', 'Threat Intelligence'],
          estimatedHours: 120,
          icon: '🎯',
        },
      ];

      const mockUserCerts: UserCertification[] = [
        {
          id: 'cert-1',
          trackId: 'bsa',
          name: 'BlockStop Security Associate',
          issued: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          expires: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
          status: 'active',
          certificateNumber: 'BSA-2024-ABC123',
        },
      ];

      const mockSchedules: ExamSchedule[] = [
        {
          examId: 'exam-bse-1',
          trackId: 'bse',
          title: 'BlockStop Security Engineer Exam',
          dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          location: 'Online Proctored',
          capacity: 50,
          registered: 34,
        },
        {
          examId: 'exam-bath-1',
          trackId: 'bath',
          title: 'BlockStop Advanced Threat Hunter Exam',
          dateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          location: 'Online Proctored',
          capacity: 30,
          registered: 12,
        },
      ];

      setTracks(mockTracks);
      setUserCerts(mockUserCerts);
      setSchedules(mockSchedules);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Certifications</h1>
        <p className="text-xl text-gray-600">Manage your BlockStop security certifications and exam schedules</p>
      </div>

      {/* Certification Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-sm text-gray-600">Active Certifications</div>
            <div className="text-3xl font-bold">{userCerts.filter(c => c.status === 'active').length}</div>
            <div className="text-xs text-blue-600 mt-2">Currently valid</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Total Earned</div>
            <div className="text-3xl font-bold">{userCerts.length}</div>
            <div className="text-xs text-green-600 mt-2">All certifications</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Highest Level</div>
            <div className="text-3xl font-bold">Associate</div>
            <div className="text-xs text-purple-600 mt-2">Next: Engineer</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Exam Schedule</div>
            <div className="text-3xl font-bold">{schedules.length}</div>
            <div className="text-xs text-orange-600 mt-2">Upcoming exams</div>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b overflow-x-auto">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('tracks')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'tracks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Certification Tracks
        </button>
        <button
          onClick={() => setTab('exams')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'exams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Exam Schedules
        </button>
        <button
          onClick={() => setTab('certificates')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'certificates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          My Certificates
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Certification Path Diagram */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Certification Progression Path</h2>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {tracks.map((track, idx) => {
                const userHas = userCerts.some(c => c.trackId === track.id);
                return (
                  <div key={track.id} className="flex-1">
                    <Card
                      className={`p-6 text-center cursor-pointer transition-all ${
                        userHas ? 'bg-blue-50 border-2 border-blue-600' : 'hover:shadow-lg'
                      }`}
                      onClick={() => setSelectedTrack(selectedTrack === track.id ? null : track.id)}
                    >
                      <div className="text-4xl mb-2">{track.icon}</div>
                      <h3 className="font-bold text-lg">{track.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{track.level}</p>
                      {userHas ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          ✓ Earned
                        </span>
                      ) : idx > 0 && userCerts.filter(c => c.trackId === tracks[idx - 1].id).length === 0 ? (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          Locked
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Available
                        </span>
                      )}
                    </Card>
                    {idx < tracks.length - 1 && (
                      <div className="hidden md:block text-2xl text-gray-400 text-center mt-4">→</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Track Details */}
          {selectedTrack && (
            <Card className="p-8 bg-blue-50 border-2 border-blue-200">
              {tracks.find(t => t.id === selectedTrack) && (
                <div>
                  <h3 className="text-2xl font-bold mb-4">{tracks.find(t => t.id === selectedTrack)?.name}</h3>
                  <p className="text-gray-700 mb-6">{tracks.find(t => t.id === selectedTrack)?.description}</p>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Required Courses</h4>
                      <ul className="space-y-2">
                        {tracks.find(t => t.id === selectedTrack)?.requiredCourses.map((course, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-center">
                            <span className="mr-2">📚</span> {course}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Prerequisites</h4>
                      {tracks.find(t => t.id === selectedTrack)?.prerequisites.length === 0 ? (
                        <p className="text-sm text-gray-700">None - You can start immediately</p>
                      ) : (
                        <ul className="space-y-2">
                          {tracks.find(t => t.id === selectedTrack)?.prerequisites.map((prereq, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-center">
                              <span className="mr-2">📋</span> {tracks.find(tr => tr.id === prereq)?.name || prereq}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        <strong>Estimated Time:</strong> {tracks.find(t => t.id === selectedTrack)?.estimatedHours} hours
                      </span>
                      <span className="text-gray-700">
                        <strong>Exam Duration:</strong> 2-4 hours
                      </span>
                      <span className="text-gray-700">
                        <strong>Validity:</strong> 3 years
                      </span>
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
                    View Exam Schedule
                  </button>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {tab === 'tracks' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">All Certification Tracks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tracks.map(track => {
              const userHas = userCerts.some(c => c.trackId === track.id);
              return (
                <Card key={track.id} className={`p-6 ${userHas ? 'bg-blue-50 border-2 border-blue-600' : ''}`}>
                  <div className="text-5xl mb-4">{track.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{track.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{track.description}</p>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex items-center text-gray-700">
                      <span className="mr-2">📚</span>
                      <span>{track.requiredCourses.length} Required Courses</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="mr-2">⏱️</span>
                      <span>{track.estimatedHours} Hours</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="mr-2">📝</span>
                      <span>2-4 Hour Exam</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="mr-2">✓</span>
                      <span>3 Year Validity</span>
                    </div>
                  </div>

                  {userHas ? (
                    <button className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700">
                      ✓ Earned - Renew in 2 years
                    </button>
                  ) : (
                    <button className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
                      View Track Details
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'exams' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Upcoming Exam Schedules</h2>
          {schedules.length > 0 ? (
            <div className="space-y-4">
              {schedules.map(schedule => {
                const daysUntil = Math.ceil((schedule.dateTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <Card key={schedule.examId} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{schedule.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 {schedule.dateTime.toLocaleDateString()} at {schedule.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`px-4 py-2 rounded-full font-medium text-white ${
                        daysUntil <= 7 ? 'bg-red-600' : daysUntil <= 14 ? 'bg-yellow-600' : 'bg-green-600'
                      }`}>
                        {daysUntil} days
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-700">
                        <strong>Format:</strong> {schedule.location}
                      </span>
                      <span className="text-gray-700">
                        <strong>Availability:</strong> {schedule.registered} / {schedule.capacity} registered
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(schedule.registered / schedule.capacity) * 100}%` }}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
                        Register Now
                      </button>
                      <button className="flex-1 border border-blue-600 text-blue-600 py-2 rounded font-medium hover:bg-blue-50">
                        View Details
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No exam schedules available currently.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'certificates' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Certificates</h2>
          {userCerts.length > 0 ? (
            <div className="space-y-4">
              {userCerts.map(cert => {
                const daysUntilExpire = Math.ceil((cert.expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const expiringWarning = daysUntilExpire < 180;
                return (
                  <Card key={cert.id} className={`p-6 ${expiringWarning ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{cert.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Certificate #: {cert.certificateNumber}</p>
                      </div>
                      <span className="px-4 py-2 bg-green-100 text-green-800 font-medium rounded-full">
                        ✓ Active
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-gray-600">Issued</p>
                        <p className="font-semibold">{cert.issued.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Expires</p>
                        <p className="font-semibold">{cert.expires.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Remaining</p>
                        <p className={`font-semibold ${expiringWarning ? 'text-yellow-600' : 'text-green-600'}`}>
                          {daysUntilExpire} days
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
                        Download PDF
                      </button>
                      <button className="flex-1 bg-gray-600 text-white py-2 rounded font-medium hover:bg-gray-700">
                        Share
                      </button>
                      <button className="flex-1 border border-blue-600 text-blue-600 py-2 rounded font-medium hover:bg-blue-50">
                        Verify
                      </button>
                    </div>

                    {expiringWarning && (
                      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                        ⚠️ This certificate will expire in {daysUntilExpire} days. Plan your renewal soon!
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">You haven't earned any certificates yet. Complete the required courses and pass the exam!</p>
              <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
                View Certification Tracks
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
