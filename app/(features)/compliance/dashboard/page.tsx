/**
 * Compliance Dashboard - Main compliance operations center
 * Real-time compliance status, controls, evidence, and findings
 */

'use client';

import React, { useState, useEffect } from 'react';

export default function ComplianceDashboard() {
  const [complianceScore, setComplianceScore] = useState<number>(0);
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [controls, setControls] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch frameworks
      const frameworksRes = await fetch('/api/v1/compliance/frameworks');
      const frameworksData = await frameworksRes.json();
      setFrameworks(frameworksData.data || []);

      // Fetch controls
      const controlsRes = await fetch('/api/v1/compliance/controls');
      const controlsData = await controlsRes.json();
      setControls(controlsData.data || []);

      // Set default score (would come from database)
      setComplianceScore(72.5);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load compliance dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading compliance dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Compliance Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time monitoring of organizational compliance posture
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Overall Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Overall Compliance Score
            </h3>
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {complianceScore.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">
              {complianceScore >= 80 ? '✓ Good' : complianceScore >= 60 ? '⚠ Fair' : '✗ Poor'} standing
            </p>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  complianceScore >= 80
                    ? 'bg-green-500'
                    : complianceScore >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${complianceScore}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Active Frameworks
            </h3>
            <div className="text-5xl font-bold text-purple-600">
              {frameworks.length}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              {frameworks.length > 0 && frameworks[0].totalControls} total controls
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Controls
            </h3>
            <div className="text-5xl font-bold text-indigo-600">
              {controls.length}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Across all frameworks
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Open Findings
            </h3>
            <div className="text-5xl font-bold text-red-600">
              {findings.length}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Requiring remediation
            </p>
          </div>
        </div>

        {/* Frameworks Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Compliance Frameworks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frameworks.length > 0 ? (
              frameworks.map((framework) => (
                <div
                  key={framework.type}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {framework.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {framework.totalControls} controls
                  </p>
                  <a
                    href={`/compliance/frameworks/${framework.type}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details →
                  </a>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-2">No frameworks enabled</p>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Recent Controls
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Control
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Severity
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Framework
                  </th>
                </tr>
              </thead>
              <tbody>
                {controls.length > 0 ? (
                  controls.slice(0, 10).map((control) => (
                    <tr
                      key={control.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-900">
                        {control.title}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {control.category}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            control.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : control.severity === 'HIGH'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {control.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {control.framework}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-gray-500 text-center">
                      No controls available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
