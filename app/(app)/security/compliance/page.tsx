'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Clock, FileText, Shield } from 'lucide-react';

interface ComplianceStatus {
  framework: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  score: number;
  lastAudit: Date;
  nextAudit: Date;
}

interface ControlItem {
  id: string;
  control: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: Date;
  owner: string;
}

export default function ComplianceDashboard() {
  const [complianceStatuses, setComplianceStatuses] = useState<ComplianceStatus[]>([
    {
      framework: 'SOC 2 Type II',
      status: 'compliant',
      score: 92,
      lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextAudit: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
    },
    {
      framework: 'ISO 27001:2022',
      status: 'partial',
      score: 78,
      lastAudit: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      nextAudit: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000),
    },
    {
      framework: 'GDPR',
      status: 'compliant',
      score: 89,
      lastAudit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      nextAudit: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000),
    },
    {
      framework: 'HIPAA',
      status: 'compliant',
      score: 85,
      lastAudit: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      nextAudit: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000),
    },
  ]);

  const [outstandingControls] = useState<ControlItem[]>([
    {
      id: '1',
      control: 'A8.1.1 - Equipment location and protection',
      status: 'non-compliant',
      priority: 'critical',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      owner: 'Infrastructure Team',
    },
    {
      id: '2',
      control: 'A6.3.1 - Awareness, education and training',
      status: 'partial',
      priority: 'high',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      owner: 'HR & Security',
    },
    {
      id: '3',
      control: 'CC8.2 - Incident response effectiveness',
      status: 'partial',
      priority: 'medium',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      owner: 'Security Operations',
    },
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'non-compliant':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-50 border-green-200';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200';
      case 'non-compliant':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const averageScore = Math.round(
    complianceStatuses.reduce((sum, s) => sum + s.score, 0) / complianceStatuses.length
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Security & Compliance Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time compliance status across all frameworks and certification programs
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Overall Compliance Score</h2>
              <p className="text-gray-600 mt-1">Average across all frameworks</p>
            </div>
            <div className="text-5xl font-bold text-blue-600">{averageScore}%</div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${averageScore}%` }}
            ></div>
          </div>
        </div>

        {/* Compliance Frameworks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {complianceStatuses.map((framework) => (
            <div
              key={framework.framework}
              className={`rounded-lg shadow-md p-6 border-2 ${getStatusColor(framework.status)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(framework.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{framework.framework}</h3>
                    <p className="text-sm text-gray-600 capitalize">{framework.status}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-900">{framework.score}%</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Audit:</span>
                  <span className="font-medium">
                    {Math.floor(
                      (Date.now() - framework.lastAudit.getTime()) / (1000 * 60 * 60 * 24)
                    )}{' '}
                    days ago
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Audit:</span>
                  <span className="font-medium">
                    {Math.floor(
                      (framework.nextAudit.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )}{' '}
                    days
                  </span>
                </div>
              </div>

              <button className="mt-4 w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                View Details
              </button>
            </div>
          ))}
        </div>

        {/* Outstanding Findings */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Outstanding Findings & Remediation Plan
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Control
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {outstandingControls.map((control) => (
                  <tr key={control.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {control.control}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(control.status)}
                        <span className="capitalize">{control.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(control.priority)}`}>
                        {control.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{control.owner}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Clock className="w-4 h-4" />
                        {Math.floor((control.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Control Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Security Controls */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Security Control Implementation
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Access Control', percentage: 95 },
                { label: 'Encryption', percentage: 98 },
                { label: 'Monitoring & Logging', percentage: 92 },
                { label: 'Incident Response', percentage: 85 },
                { label: 'Vulnerability Management', percentage: 88 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.percentage}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Schedule */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Upcoming Audit Schedule
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {[
                { framework: 'ISO 27001', date: 'July 15, 2026' },
                { framework: 'SOC 2 Type II', date: 'August 30, 2026' },
                { framework: 'GDPR Audit', date: 'September 10, 2026' },
                { framework: 'Internal Assessment', date: 'Every Quarter' },
              ].map((item) => (
                <div key={item.framework} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-sm font-medium text-gray-700">{item.framework}</span>
                  <span className="text-sm text-gray-600">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Documentation & Reports */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Compliance Documentation & Reports</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'SOC 2 Type II Report', date: 'March 2026', status: 'Current' },
                { title: 'ISO 27001 Certification', date: 'December 2025', status: 'Valid' },
                { title: 'GDPR Compliance Assessment', date: 'May 2026', status: 'Current' },
                { title: 'Security Policy Documents', date: 'Updated June 2026', status: 'Current' },
                { title: 'Data Processing Agreements', date: 'Updated April 2026', status: 'Current' },
                { title: 'Incident Response Plan', date: 'Updated May 2026', status: 'Current' },
              ].map((doc) => (
                <div key={doc.title} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{doc.date}</p>
                    </div>
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                      {doc.status}
                    </span>
                  </div>
                  <button className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700">
                    View Document →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
