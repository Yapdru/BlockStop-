'use client';

/**
 * BlockStop PRO Tier Dashboard
 * Main dashboard for PRO users with analytics, quick actions, and team collaboration
 */

import React, { useState, useEffect } from 'react';
import { AdvancedAnalyticsEngine } from '@/lib/pro/advanced-analytics';
import { ProTierQuotas } from '@/types/pro-tier';
import { PRO_QUOTAS } from '@/lib/tiers/pro-tier';

export default function ProDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [riskScore, setRiskScore] = useState(0);
  const [threatStats, setThreatStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });
  const [quotaUsage, setQuotaUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate data loading
      const mockRiskScore = AdvancedAnalyticsEngine.calculateRiskScore({
        threatCount: 45,
        criticalCount: 3,
        highCount: 8,
        averageResponseTime: 3600000,
        recentEscalations: 2,
      });

      setRiskScore(mockRiskScore);
      setThreatStats({
        critical: 3,
        high: 8,
        medium: 15,
        low: 42,
      });

      // Set quota usage
      setQuotaUsage({
        apiCalls: 45000,
        dashboards: 3,
        rules: 28,
        webhooks: 7,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuotaPercentage = (key: string, used: number) => {
    const limits: Record<string, number> = {
      apiCalls: 100000,
      dashboards: 5,
      rules: 100,
      webhooks: 10,
    };
    return Math.round((used / limits[key]) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">PRO Tier Dashboard</h1>
          <p className="text-blue-300">
            Advanced threat intelligence and security analytics powered by BlockStop PRO
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {['24h', '7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-blue-300 hover:bg-slate-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Risk Score */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-colors">
            <h3 className="text-slate-400 text-sm font-semibold mb-2">Risk Score</h3>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-blue-400">{riskScore}</span>
              <span className="text-slate-400 text-sm mb-1">/100</span>
            </div>
            <div className="mt-4 bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  riskScore > 70
                    ? 'bg-red-500'
                    : riskScore > 40
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${riskScore}%` }}
              ></div>
            </div>
          </div>

          {/* Critical Threats */}
          <div className="bg-slate-800 border border-red-900 rounded-xl p-6 hover:border-red-500 transition-colors">
            <h3 className="text-slate-400 text-sm font-semibold mb-2">Critical Threats</h3>
            <div className="text-4xl font-bold text-red-400">{threatStats.critical}</div>
            <p className="text-red-300 text-sm mt-2">Require immediate action</p>
          </div>

          {/* High Priority */}
          <div className="bg-slate-800 border border-yellow-900 rounded-xl p-6 hover:border-yellow-500 transition-colors">
            <h3 className="text-slate-400 text-sm font-semibold mb-2">High Priority</h3>
            <div className="text-4xl font-bold text-yellow-400">{threatStats.high}</div>
            <p className="text-yellow-300 text-sm mt-2">Investigation needed</p>
          </div>

          {/* API Calls Usage */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-colors">
            <h3 className="text-slate-400 text-sm font-semibold mb-2">API Usage</h3>
            <div className="text-2xl font-bold text-blue-400">
              {Math.floor(quotaUsage.apiCalls / 1000)}K
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>{getQuotaPercentage('apiCalls', quotaUsage.apiCalls)}%</span>
              <span>100K limit</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>

            <a
              href="/pro/threat-hunt"
              className="block p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔍</span>
                <span className="font-semibold text-white group-hover:text-blue-400">
                  Threat Hunting
                </span>
              </div>
              <p className="text-sm text-slate-400">Create hunting queries and find threats</p>
            </a>

            <a
              href="/pro/rules"
              className="block p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📋</span>
                <span className="font-semibold text-white group-hover:text-blue-400">
                  Custom Rules
                </span>
              </div>
              <p className="text-sm text-slate-400">YARA/Sigma detection rules</p>
            </a>

            <a
              href="/pro/integrations"
              className="block p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔗</span>
                <span className="font-semibold text-white group-hover:text-blue-400">
                  Integrations
                </span>
              </div>
              <p className="text-sm text-slate-400">Slack, Teams, Jira, ServiceNow</p>
            </a>

            <a
              href="/pro/compliance"
              className="block p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">✓</span>
                <span className="font-semibold text-white group-hover:text-blue-400">
                  Compliance
                </span>
              </div>
              <p className="text-sm text-slate-400">GDPR, HIPAA, SOC2, ISO27001</p>
            </a>
          </div>

          {/* Recent Threats */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Recent Threats</h2>
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Time</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {[
                    {
                      type: 'Malware Detected',
                      severity: 'critical',
                      time: '5 min ago',
                      status: 'Open',
                    },
                    {
                      type: 'Suspicious Login',
                      severity: 'high',
                      time: '2 hours ago',
                      status: 'Investigating',
                    },
                    {
                      type: 'Policy Violation',
                      severity: 'medium',
                      time: '4 hours ago',
                      status: 'Resolved',
                    },
                    {
                      type: 'Vulnerability Found',
                      severity: 'high',
                      time: '1 day ago',
                      status: 'Patched',
                    },
                  ].map((threat, i) => (
                    <tr key={i} className="hover:bg-slate-700 transition-colors">
                      <td className="px-4 py-3 text-white">{threat.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            threat.severity === 'critical'
                              ? 'bg-red-900 text-red-200'
                              : threat.severity === 'high'
                              ? 'bg-yellow-900 text-yellow-200'
                              : 'bg-blue-900 text-blue-200'
                          }`}
                        >
                          {threat.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{threat.time}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            threat.status === 'Open'
                              ? 'bg-red-900 text-red-200'
                              : threat.status === 'Investigating'
                              ? 'bg-yellow-900 text-yellow-200'
                              : 'bg-green-900 text-green-200'
                          }`}
                        >
                          {threat.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quota Usage Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(quotaUsage).map(([key, used]) => (
            <div key={key} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <h3 className="text-slate-400 text-sm font-semibold mb-3 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400 font-semibold">{used}</span>
                  <span className="text-slate-400">
                    {getQuotaPercentage(key, used)}% used
                  </span>
                </div>
                <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                    style={{ width: `${getQuotaPercentage(key, used)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>
            PRO Tier • ₹299/month • {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
