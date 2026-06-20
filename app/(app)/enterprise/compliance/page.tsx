'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button, Tabs } from '@/components';
import {
  ComplianceDashboard,
  ComplianceFramework,
  ComplianceReport,
  AuditTrailEntry,
} from '@/types/enterprise';
import { LoadingSpinner } from '@/app/components/animations/LoadingSpinner';
import { FadeIn } from '@/app/components/animations/FadeIn';
import { BarChart } from '@/app/components/charts/BarChart';

export default function EnterpriseCompliancePage() {
  const [dashboard, setDashboard] = useState<ComplianceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/enterprise/compliance', {
        headers: { 'x-user-id': userId || '' },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      } else {
        setError('Failed to load compliance data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (framework: string) => {
    try {
      setExporting(true);
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/enterprise/compliance/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify({ framework }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${framework}-compliance-report.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-success/20 text-success';
      case 'non_compliant':
        return 'bg-danger/20 text-danger';
      case 'in_progress':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getControlStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-success/10 border-success/50 text-success';
      case 'fail':
        return 'bg-danger/10 border-danger/50 text-danger';
      case 'warning':
        return 'bg-warning/10 border-warning/50 text-warning';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const chartData =
    dashboard?.frameworks.map((f) => ({
      name: f.name,
      score: f.score,
      target: 100,
    })) || [];

  return (
    <DashboardLayout>
      <FadeIn>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Compliance Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor compliance frameworks and generate audit reports
            </p>
          </div>

          {error && (
            <div className="bg-danger/10 text-danger p-4 rounded-lg">{error}</div>
          )}

          {/* Tabs */}
          <Tabs
            tabs={[
              {
                id: 'overview',
                label: 'Overview',
                content: (
                  <div className="p-4 space-y-6">
                    {/* Overall Score */}
                    <Card className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Overall Compliance Score
                      </h2>
                      <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32">
                          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                            <circle
                              cx="60"
                              cy="60"
                              r="54"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="8"
                              className="text-gray-200 dark:text-gray-700"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="54"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="8"
                              strokeDasharray={`${(dashboard?.overallScore || 0) * 3.39} 339`}
                              className={`${getScoreColor(dashboard?.overallScore || 0)} transition-all duration-500`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div
                                className={`text-3xl font-bold ${getScoreColor(
                                  dashboard?.overallScore || 0
                                )}`}
                              >
                                {dashboard?.overallScore || 0}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Out of 100
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Frameworks Grid */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Compliance Frameworks
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboard?.frameworks.map((framework) => (
                          <Card
                            key={framework.id}
                            className={`p-4 border-l-4 ${
                              framework.status === 'compliant'
                                ? 'border-success'
                                : 'border-warning'
                            } cursor-pointer hover:shadow-lg transition`}
                            onClick={() => setSelectedFramework(framework.id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {framework.name}
                              </h4>
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(
                                  framework.status
                                )}`}
                              >
                                {framework.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="mb-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Score
                                </span>
                                <span className={`font-bold ${getScoreColor(framework.score)}`}>
                                  {framework.score}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    framework.score >= 80
                                      ? 'bg-success'
                                      : framework.score >= 60
                                      ? 'bg-warning'
                                      : 'bg-danger'
                                  }`}
                                  style={{ width: `${framework.score}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>
                                Last Audit:{' '}
                                {new Date(framework.lastAuditDate).toLocaleDateString()}
                              </div>
                              <div>
                                Next Audit:{' '}
                                {new Date(framework.nextAuditDate).toLocaleDateString()}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full mt-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportPDF(framework.name);
                              }}
                              disabled={exporting}
                            >
                              Export Report
                            </Button>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Score Chart */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Compliance Scores
                      </h3>
                      <BarChart
                        data={chartData}
                        bars={[
                          { dataKey: 'score', name: 'Current Score', fill: '#1e88ff' },
                          { dataKey: 'target', name: 'Target', fill: '#4caf50' },
                        ]}
                        xAxisKey="name"
                        height={300}
                      />
                    </Card>
                  </div>
                ),
              },
              {
                id: 'controls',
                label: 'Controls',
                content: (
                  <div className="p-4 space-y-4">
                    {dashboard?.controls.map((control) => (
                      <Card
                        key={control.id}
                        className={`p-4 border-2 ${getControlStatusColor(control.status)}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {control.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {control.description}
                            </p>
                          </div>
                          <span className="text-xs font-bold uppercase px-2 py-1 rounded">
                            {control.status}
                          </span>
                        </div>

                        {control.evidence.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                            <h5 className="text-xs font-semibold mb-2 opacity-75">
                              Evidence
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {control.evidence.map((evidence) => (
                                <a
                                  key={evidence.id}
                                  href={evidence.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black px-2 py-1 rounded transition"
                                >
                                  {evidence.type}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {control.remediation && (
                          <div className="mt-3 p-2 bg-warning/10 border border-warning/50 rounded text-sm">
                            <strong className="text-warning">Remediation:</strong>{' '}
                            {control.remediation}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ),
              },
              {
                id: 'alerts',
                label: 'Alerts',
                content: (
                  <div className="p-4 space-y-4">
                    {dashboard?.alerts.length === 0 ? (
                      <Card className="p-4 text-center text-gray-500">
                        No compliance alerts
                      </Card>
                    ) : (
                      dashboard?.alerts.map((alert) => (
                        <Card
                          key={alert.id}
                          className={`p-4 border-l-4 ${
                            alert.level === 'critical'
                              ? 'border-danger bg-danger/5'
                              : 'border-warning bg-warning/5'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                    alert.level === 'critical'
                                      ? 'bg-danger/20 text-danger'
                                      : 'bg-warning/20 text-warning'
                                  }`}
                                >
                                  {alert.level}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {alert.framework} - {alert.control}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white mt-2">
                                {alert.message}
                              </p>
                              <div className="text-xs text-gray-500 mt-2">
                                {new Date(alert.timestamp).toLocaleString()}
                              </div>
                            </div>
                            <button className="text-xs font-medium text-success hover:underline">
                              Mark Resolved
                            </button>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                ),
              },
              {
                id: 'audit',
                label: 'Audit Trail',
                content: (
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-2 text-left">Timestamp</th>
                            <th className="px-4 py-2 text-left">User</th>
                            <th className="px-4 py-2 text-left">Action</th>
                            <th className="px-4 py-2 text-left">Resource</th>
                            <th className="px-4 py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard?.recentChanges.map((entry) => (
                            <tr
                              key={entry.id}
                              className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                              <td className="px-4 py-2 text-xs">
                                {new Date(entry.timestamp).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-xs">User {entry.userId}</td>
                              <td className="px-4 py-2 text-xs font-medium">
                                {entry.action}
                              </td>
                              <td className="px-4 py-2 text-xs">
                                {entry.resource} ({entry.resourceId})
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span
                                  className={`text-xs font-medium px-2 py-1 rounded ${
                                    entry.status === 'success'
                                      ? 'bg-success/20 text-success'
                                      : 'bg-danger/20 text-danger'
                                  }`}
                                >
                                  {entry.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ),
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
