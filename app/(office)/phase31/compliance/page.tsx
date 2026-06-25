'use client';

/**
 * OFFICE Phase 31.1 - Compliance Dashboard
 * Professional compliance management and monitoring
 */

import React, { useState, useEffect } from 'react';

// Types
interface ComplianceMetric {
  label: string;
  value: number | string;
  status: 'compliant' | 'at-risk' | 'non-compliant';
  trend: number;
}

interface ComplianceEvent {
  id: string;
  title: string;
  type: 'audit' | 'deadline' | 'training' | 'certification';
  date: Date;
  status: 'completed' | 'upcoming' | 'overdue';
  daysUntil: number;
}

interface HIPAAMetric {
  baaStatus: string;
  breachesReported: number;
  complianceScore: number;
  criticalFindings: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Compliance Dashboard Component
 */
export default function ComplianceDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetric[]>([]);
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [hipaaMetrics, setHIPAAMetrics] = useState<HIPAAMetric | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'hipaa' | 'calendar' | 'audit'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize dashboard with compliance data
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setLoading(true);

    // Simulate loading compliance metrics
    const mockMetrics: ComplianceMetric[] = [
      {
        label: 'Overall Compliance Score',
        value: '88%',
        status: 'compliant',
        trend: 3,
      },
      {
        label: 'Active BAAs',
        value: '24',
        status: 'compliant',
        trend: 0,
      },
      {
        label: 'Open Findings',
        value: '3',
        status: 'at-risk',
        trend: -1,
      },
      {
        label: 'Training Completion',
        value: '92%',
        status: 'compliant',
        trend: 5,
      },
      {
        label: 'Certifications Current',
        value: '4 of 5',
        status: 'at-risk',
        trend: -1,
      },
      {
        label: 'Risk Assessments',
        value: '12',
        status: 'compliant',
        trend: 2,
      },
    ];

    const mockEvents: ComplianceEvent[] = [
      {
        id: '1',
        title: 'HIPAA Annual Audit',
        type: 'audit',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'upcoming',
        daysUntil: 15,
      },
      {
        id: '2',
        title: 'Security Awareness Training',
        type: 'training',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'upcoming',
        daysUntil: 5,
      },
      {
        id: '3',
        title: 'BAA Review Deadline',
        type: 'deadline',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'overdue',
        daysUntil: -3,
      },
      {
        id: '4',
        title: 'SOC 2 Type II Certification Renewal',
        type: 'certification',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'upcoming',
        daysUntil: 90,
      },
    ];

    const mockHIPAAMetrics: HIPAAMetric = {
      baaStatus: 'All current and up-to-date',
      breachesReported: 0,
      complianceScore: 88,
      criticalFindings: 0,
      riskLevel: 'low',
    };

    setMetrics(mockMetrics);
    setEvents(mockEvents);
    setHIPAAMetrics(mockHIPAAMetrics);
    setLoading(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'compliant':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'at-risk':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'non-compliant':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Professional compliance management for healthcare organizations
          </p>
        </div>

        {/* View Selector */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {(['overview', 'hipaa', 'calendar', 'audit'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                selectedView === view
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`border rounded-lg p-6 ${getStatusColor(metric.status)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium opacity-75">{metric.label}</p>
                      <p className="mt-2 text-2xl font-bold">{metric.value}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(metric.status)}`}>
                      {metric.status === 'compliant' ? '✓' : '!'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className={metric.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                      {metric.trend > 0 ? '↑' : '↓'} {Math.abs(metric.trend)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Compliance Events</h2>
              <div className="space-y-3">
                {events
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(event.status)}`}>
                            {event.type.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-600">
                            {event.date.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(event.status)}`}
                        >
                          {event.status === 'overdue'
                            ? `${Math.abs(event.daysUntil)} days overdue`
                            : `${event.daysUntil} days`}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* HIPAA Tab */}
        {selectedView === 'hipaa' && hipaaMetrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* HIPAA Score */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">HIPAA Compliance Score</h3>
                <div className="relative h-32 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">{hipaaMetrics.complianceScore}%</p>
                    <p className="text-sm text-gray-600 mt-2">Overall Compliance</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Status: <span className="font-semibold text-green-600">Substantially Compliant</span></p>
                </div>
              </div>

              {/* BAA Status */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">BAA Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className="font-semibold text-green-600">{hipaaMetrics.baaStatus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Critical Findings</span>
                    <span className="font-semibold">{hipaaMetrics.criticalFindings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Risk Level</span>
                    <span className={`font-semibold px-3 py-1 rounded text-sm ${
                      hipaaMetrics.riskLevel === 'low'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {hipaaMetrics.riskLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Recent Risk Assessment</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><span className="text-green-600 mr-2">✓</span> Access controls compliant</li>
                  <li className="flex items-center"><span className="text-green-600 mr-2">✓</span> Encryption requirements met</li>
                  <li className="flex items-center"><span className="text-green-600 mr-2">✓</span> Audit logging functional</li>
                  <li className="flex items-center"><span className="text-yellow-600 mr-2">!</span> Backup testing needed</li>
                </ul>
              </div>

              {/* Breach Notification */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Breach History</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Breaches Reported</span>
                    <span className="font-semibold">{hipaaMetrics.breachesReported}</span>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">No breaches reported in the last 12 months</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {selectedView === 'calendar' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Compliance Calendar</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Upcoming Audits</h4>
                  <p className="text-sm text-blue-700">HIPAA Audit - October 15</p>
                  <p className="text-sm text-blue-700">SOC 2 Audit - January 20</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Training Required</h4>
                  <p className="text-sm text-yellow-700">Security Awareness - 92% complete</p>
                  <p className="text-sm text-yellow-700">HIPAA Basics - 88% complete</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Certifications</h4>
                  <p className="text-sm text-purple-700">ISO 27001 - Current</p>
                  <p className="text-sm text-purple-700">SOC 2 Type II - Expires 12/31</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Compliance Deadlines</h4>
                  <p className="text-sm text-green-700">Risk Assessment - Due 03/31</p>
                  <p className="text-sm text-green-700">BAA Reviews - Due 06/30</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {selectedView === 'audit' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Audits & Findings</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">HIPAA Risk Assessment</h4>
                    <p className="text-sm text-gray-600">Completed: August 15, 2024</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Compliant</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Overall Risk Level: Low</p>
                <p className="text-sm text-gray-600">Findings: 0 Critical, 0 High, 2 Medium, 1 Low</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">SOC 2 Type II Evaluation</h4>
                    <p className="text-sm text-gray-600">In Progress: Started July 1, 2024</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">In Progress</span>
                </div>
                <p className="text-sm text-gray-600">Estimated Completion: November 30, 2024</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
