'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
  FileText,
  Users,
  Target,
  Lock,
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

/**
 * Enterprise Security Dashboard
 * Comprehensive view of security posture including:
 * - Bug bounty program overview
 * - Penetration testing results
 * - Certification compliance status
 * - Security metrics and KPIs
 */

interface BugBountyStats {
  totalSubmissions: number;
  activeReports: number;
  totalRewardsIssued: number;
  averageResolutionTime: number;
  topReporters: { name: string; reports: number; rewards: number }[];
}

interface PentestStats {
  lastTestDate: Date;
  totalTests: number;
  criticalFindings: number;
  highFindings: number;
  remediationRate: number;
  overallRiskScore: number;
}

interface CertificationStats {
  frameworks: {
    name: string;
    status: 'compliant' | 'partial' | 'non-compliant';
    score: number;
    expiryDate: Date;
  }[];
  nextAudit: Date;
  openFindings: number;
  complianceScore: number;
}

interface SecurityMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'bug-bounty' | 'pentest' | 'compliance' | 'metrics'
  >('overview');

  const [bugBountyStats] = useState<BugBountyStats>({
    totalSubmissions: 147,
    activeReports: 12,
    totalRewardsIssued: 85000,
    averageResolutionTime: 18, // days
    topReporters: [
      { name: 'security-pro', reports: 23, rewards: 18500 },
      { name: 'bug-hunter', reports: 19, rewards: 14200 },
      { name: 'ethical-hacker', reports: 15, rewards: 11300 },
    ],
  });

  const [pentestStats] = useState<PentestStats>({
    lastTestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    totalTests: 156,
    criticalFindings: 2,
    highFindings: 8,
    remediationRate: 78,
    overallRiskScore: 68,
  });

  const [certificationStats] = useState<CertificationStats>({
    frameworks: [
      {
        name: 'SOC 2 Type II',
        status: 'compliant',
        score: 92,
        expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'ISO 27001:2022',
        status: 'partial',
        score: 78,
        expiryDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'GDPR',
        status: 'compliant',
        score: 89,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'HIPAA',
        status: 'compliant',
        score: 85,
        expiryDate: new Date(Date.now() + 250 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'PCI-DSS',
        status: 'compliant',
        score: 91,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      },
    ],
    nextAudit: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    openFindings: 8,
    complianceScore: 87,
  });

  const [securityMetrics] = useState<SecurityMetric[]>([
    { label: 'Overall Security Score', value: '82/100', change: 5, trend: 'up' },
    { label: 'Vulnerabilities Fixed', value: '34/42', change: 12, trend: 'up' },
    { label: 'Active Security Incidents', value: '0', change: 0, trend: 'stable' },
    { label: 'Compliance Status', value: '87%', change: 3, trend: 'up' },
    { label: 'Patch Coverage', value: '96%', change: 2, trend: 'up' },
    { label: 'Policy Compliance', value: '92%', change: -1, trend: 'down' },
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
        return 'bg-green-50 border-green-200 text-green-800';
      case 'partial':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'non-compliant':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">Enterprise Security</h1>
        </div>
        <p className="text-slate-600 text-lg">
          Comprehensive security posture and compliance management
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(['overview', 'bug-bounty', 'pentest', 'compliance', 'metrics'] as const).map(
          tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {tab.replace('-', ' ').charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Security Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {securityMetrics.map((metric, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">{metric.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{metric.value}</p>
                  </div>
                  <div
                    className={`p-2 rounded-lg ${
                      metric.trend === 'up'
                        ? 'bg-green-100'
                        : metric.trend === 'down'
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    ) : metric.trend === 'down' ? (
                      <ArrowDownRight className="w-5 h-5 text-red-600" />
                    ) : (
                      <Zap className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span
                    className={
                      metric.change >= 0 ? 'text-green-600 font-medium' : 'text-red-600'
                    }
                  >
                    {metric.change >= 0 ? '+' : ''}{metric.change}%
                  </span>
                  <span className="text-slate-500 ml-2">from last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Key Stats Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bug Bounty Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900">Bug Bounty Program</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Submissions</span>
                  <span className="font-bold text-slate-900">{bugBountyStats.totalSubmissions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Active Reports</span>
                  <span className="font-bold text-yellow-600">{bugBountyStats.activeReports}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Rewards Issued</span>
                  <span className="font-bold text-green-600">
                    ${bugBountyStats.totalRewardsIssued.toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-sm text-slate-500">
                    Avg. Resolution: {bugBountyStats.averageResolutionTime} days
                  </span>
                </div>
              </div>
            </div>

            {/* Pentest Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-bold text-slate-900">Penetration Testing</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Critical Issues</span>
                  <span className="font-bold text-red-600">{pentestStats.criticalFindings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">High Issues</span>
                  <span className="font-bold text-orange-600">{pentestStats.highFindings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Remediation Rate</span>
                  <span className="font-bold text-green-600">{pentestStats.remediationRate}%</span>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-sm text-slate-500">
                    Last Test: {pentestStats.lastTestDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Compliance Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Overall Score</span>
                  <span className="font-bold text-blue-600">
                    {certificationStats.complianceScore}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Frameworks</span>
                  <span className="font-bold text-slate-900">
                    {
                      certificationStats.frameworks.filter(f => f.status === 'compliant')
                        .length
                    }
                    /{certificationStats.frameworks.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Open Findings</span>
                  <span className="font-bold text-yellow-600">{certificationStats.openFindings}</span>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-sm text-slate-500">
                    Next Audit: {formatDate(certificationStats.nextAudit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bug Bounty Tab */}
      {activeTab === 'bug-bounty' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Bug Bounty Program</h2>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-blue-600 text-sm font-medium">Total Submissions</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {bugBountyStats.totalSubmissions}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-yellow-600 text-sm font-medium">Active Reports</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">
                  {bugBountyStats.activeReports}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-green-600 text-sm font-medium">Total Rewards</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  ${(bugBountyStats.totalRewardsIssued / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-purple-600 text-sm font-medium">Avg. Resolution</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {bugBountyStats.averageResolutionTime}d
                </p>
              </div>
            </div>

            {/* Hall of Fame */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Hall of Fame</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Reporter
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Reports
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                        Total Rewards
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bugBountyStats.topReporters.map((reporter, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-500" />
                            <span className="font-bold text-slate-900">#{idx + 1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {reporter.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{reporter.reports}</td>
                        <td className="px-6 py-4 font-medium text-green-600">
                          ${reporter.rewards.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pentest Tab */}
      {activeTab === 'pentest' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Penetration Testing Results</h2>

            {/* Risk Score Meter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Overall Risk Score</h3>
                <div className="relative w-full h-24 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                    style={{ width: '100%' }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-slate-900"
                    style={{ left: `${pentestStats.overallRiskScore}%` }}
                  />
                </div>
                <p className="text-3xl font-bold text-orange-600 mt-4">
                  {pentestStats.overallRiskScore}/100
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700 font-medium">Critical Findings</span>
                    <span className="text-2xl font-bold text-red-600">
                      {pentestStats.criticalFindings}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600"
                      style={{
                        width: `${Math.min(
                          (pentestStats.criticalFindings / 10) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700 font-medium">High Findings</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {pentestStats.highFindings}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-600"
                      style={{
                        width: `${Math.min(
                          (pentestStats.highFindings / 15) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700 font-medium">Remediation Rate</span>
                    <span className="text-2xl font-bold text-green-600">
                      {pentestStats.remediationRate}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{ width: `${pentestStats.remediationRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Test Summary */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Test Summary</h3>
              <div className="space-y-3 text-slate-700">
                <p>
                  <strong>Last Test Date:</strong>{' '}
                  {pentestStats.lastTestDate.toLocaleDateString()}
                </p>
                <p>
                  <strong>Total Tests Run:</strong> {pentestStats.totalTests}
                </p>
                <p>
                  <strong>Critical Findings:</strong>{' '}
                  <span className="text-red-600 font-bold">{pentestStats.criticalFindings}</span>
                </p>
                <p>
                  <strong>High Findings:</strong>{' '}
                  <span className="text-orange-600 font-bold">{pentestStats.highFindings}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Compliance Frameworks</h2>

            {/* Overall Score */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-lg font-medium">Overall Compliance Score</p>
                  <p className="text-5xl font-bold text-blue-900 mt-2">
                    {certificationStats.complianceScore}%
                  </p>
                </div>
                <BarChart3 className="w-24 h-24 text-blue-400 opacity-50" />
              </div>
            </div>

            {/* Framework Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificationStats.frameworks.map((framework, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-6 ${getStatusColor(framework.status)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{framework.name}</h3>
                      <p className="text-sm mt-1 opacity-75">
                        {formatDate(framework.expiryDate)}
                      </p>
                    </div>
                    {getStatusIcon(framework.status)}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Compliance</span>
                        <span className="font-bold">{framework.score}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            framework.status === 'compliant'
                              ? 'bg-green-600'
                              : framework.status === 'partial'
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${framework.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upcoming Audits */}
            <div className="mt-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">Next Scheduled Audit</h3>
              </div>
              <p className="text-slate-700 text-lg">
                {certificationStats.nextAudit.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-slate-600 mt-2">
                <Clock className="w-4 h-4 inline mr-2" />
                {formatDate(certificationStats.nextAudit)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Security Metrics & KPIs</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-lg p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-lg text-slate-900">{metric.label}</h3>
                    <div
                      className={`p-2 rounded-lg ${
                        metric.trend === 'up'
                          ? 'bg-green-100'
                          : metric.trend === 'down'
                          ? 'bg-red-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : metric.trend === 'down' ? (
                        <ArrowDownRight className="w-5 h-5 text-red-600" />
                      ) : (
                        <Zap className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-slate-900 mb-3">{metric.value}</p>
                  <p
                    className={`text-sm font-medium ${
                      metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% from last period
                  </p>
                </div>
              ))}
            </div>

            {/* Trend Analysis */}
            <div className="mt-8 bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Trend Analysis</h3>
              <div className="space-y-4 text-slate-700">
                <div className="flex items-start gap-4">
                  <ArrowUpRight className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-slate-900">
                      Security posture improving steadily
                    </p>
                    <p className="text-sm text-slate-600">
                      +5% improvement in overall security score this month
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <ArrowUpRight className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-slate-900">High remediation rate</p>
                    <p className="text-sm text-slate-600">
                      78% of identified vulnerabilities fixed within SLA
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium text-slate-900">Zero critical incidents</p>
                    <p className="text-sm text-slate-600">
                      No unresolved critical security issues
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-lg">
          <FileText className="w-4 h-4 inline mr-2" />
          Generate Security Report
        </button>
        <button className="px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition">
          <Shield className="w-4 h-4 inline mr-2" />
          Schedule Audit
        </button>
        <button className="px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition">
          <Download className="w-4 h-4 inline mr-2" />
          Download Compliance Report
        </button>
      </div>
    </div>
  );
}

// Helper component for Download icon
function Download({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M10 6a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 9.414V14a1 1 0 11-2 0V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 6zm-8 8a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 011-1h1zm4 0a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1h1zm4 0a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1h1z" />
    </svg>
  );
}
