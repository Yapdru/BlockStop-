'use client';

import React, { useState, useEffect } from 'react';
import { LineChart } from '@/app/components/charts/LineChart';
import { PieChart } from '@/app/components/charts/PieChart';
import { BarChart } from '@/app/components/charts/BarChart';
import { GeographicMap } from '@/app/components/charts/GeographicMap';
import { GaugeChart } from '@/app/components/charts/GaugeChart';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button, Tabs } from '@/components';
import { AnalyticsDashboardData, ThreatTrendMetrics } from '@/types/analytics';
import { LoadingSpinner } from '@/app/components/animations/LoadingSpinner';
import { FadeIn } from '@/app/components/animations/FadeIn';

interface FilterOptions {
  timeRange: '7d' | '30d' | '90d' | '1y';
  severity?: 'all' | 'low' | 'medium' | 'high' | 'critical';
}

export default function AnalyticsDashboardPage() {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({ timeRange: '30d' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const userId = localStorage.getItem('userId');
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        ...(filters.severity && { severity: filters.severity }),
      });

      const response = await fetch(`/api/analytics/dashboard?${params}`, {
        headers: { 'x-user-id': userId || '' },
      });

      if (!response.ok) throw new Error('Failed to fetch analytics data');
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-danger/10 text-danger p-4 rounded-lg">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const threatTrendData = dashboardData?.threatTrends.map((trend) => ({
    date: trend.date,
    count: trend.count,
    severity: trend.severity,
  })) || [];

  const topThreatsData = dashboardData?.topThreats.map((threat) => ({
    name: threat.threatType,
    value: threat.count,
    percentage: threat.percentage,
  })) || [];

  const confidenceData = dashboardData?.confidenceScores.map((score) => ({
    name: score.threatId,
    score: score.confidenceScore,
  })) || [];

  return (
    <DashboardLayout>
      <FadeIn>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Real-time threat intelligence and analytics
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters({ ...filters, timeRange: e.target.value as any })}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
              <Button variant="secondary" size="lg">
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Threats</div>
              <div className="text-3xl font-bold text-primary-600 mt-2">
                {dashboardData?.threatTrends.reduce((sum, t) => sum + t.count, 0) || 0}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Critical</div>
              <div className="text-3xl font-bold text-danger mt-2">
                {dashboardData?.topThreats.filter((t) => t.severity === 'critical').reduce((sum, t) => sum + t.count, 0) || 0}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">High Risk</div>
              <div className="text-3xl font-bold text-warning mt-2">
                {dashboardData?.topThreats.filter((t) => t.severity === 'high').reduce((sum, t) => sum + t.count, 0) || 0}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</div>
              <div className="text-3xl font-bold text-success mt-2">
                {dashboardData ? (
                  (dashboardData.confidenceScores.reduce((sum, s) => sum + s.confidenceScore, 0) /
                    dashboardData.confidenceScores.length).toFixed(1) + '%'
                ) : (
                  '0%'
                )}
              </div>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threat Trends */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Threat Trends
              </h2>
              <LineChart
                data={threatTrendData}
                lines={[
                  {
                    dataKey: 'count',
                    name: 'Threats Detected',
                    color: '#1e88ff',
                    strokeWidth: 2,
                  },
                ]}
                xAxisKey="date"
                yAxisLabel="Count"
                height={300}
                showLegend
              />
            </Card>

            {/* Top Threat Types */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Top Threat Types
              </h2>
              <PieChart
                data={topThreatsData}
                nameKey="name"
                dataKey="value"
                height={300}
                showLegend
              />
            </Card>
          </div>

          {/* Geographic Map */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Geographic Threat Distribution
            </h2>
            <GeographicMap
              data={dashboardData?.geographicThreats || []}
              height={400}
              colorBy="threatCount"
            />
          </Card>

          {/* Confidence Score Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              AI Confidence Score Distribution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { range: '0-20%', count: confidenceData.filter((d) => d.score < 20).length },
                { range: '20-40%', count: confidenceData.filter((d) => d.score >= 20 && d.score < 40).length },
                { range: '40-60%', count: confidenceData.filter((d) => d.score >= 40 && d.score < 60).length },
                { range: '60-80%', count: confidenceData.filter((d) => d.score >= 60 && d.score < 80).length },
                { range: '80-100%', count: confidenceData.filter((d) => d.score >= 80).length },
              ].map((bucket) => (
                <Card key={bucket.range} className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary-600">{bucket.count}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {bucket.range}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
