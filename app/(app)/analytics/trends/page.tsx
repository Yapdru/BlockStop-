'use client';

import React, { useState, useEffect } from 'react';
import { LineChart } from '@/app/components/charts/LineChart';
import { BarChart } from '@/app/components/charts/BarChart';
import { DataTable } from '@/app/components/charts/DataTable';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button } from '@/components';
import { AnalyticsTrendsResponse, FilterCriteria } from '@/types/analytics';
import { LoadingSpinner } from '@/app/components/animations/LoadingSpinner';
import { FadeIn } from '@/app/components/animations/FadeIn';

interface FilterState extends FilterCriteria {
  startDate?: string;
  endDate?: string;
}

export default function AnalyticsTrendsPage() {
  const [trendsData, setTrendsData] = useState<AnalyticsTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    threatTypes: [],
    severities: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrendsData();
  }, [filters]);

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      setError('');
      const userId = localStorage.getItem('userId');
      const params = new URLSearchParams();

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      filters.threatTypes?.forEach((t) => params.append('threatTypes', t));
      filters.severities?.forEach((s) => params.append('severities', s));

      const response = await fetch(`/api/analytics/trends?${params}`, {
        headers: { 'x-user-id': userId || '' },
      });

      if (!response.ok) throw new Error('Failed to fetch trends data');
      const data = await response.json();
      setTrendsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = generateCSV(trendsData?.data || []);
      downloadFile(csv, 'threat-trends.csv', 'text/csv');
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleExportPDF = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/analytics/trends/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify(trendsData),
      });

      if (response.ok) {
        const blob = await response.blob();
        downloadFile(blob, 'threat-trends.pdf', 'application/pdf');
      }
    } catch (err) {
      console.error('PDF export failed:', err);
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

  const chartData = trendsData?.data.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleDateString(),
    threats: item.threatCount,
    low: item.severityBreakdown.low,
    medium: item.severityBreakdown.medium,
    high: item.severityBreakdown.high,
    critical: item.severityBreakdown.critical,
  })) || [];

  const tableData = trendsData?.data.map((item, idx) => ({
    id: idx,
    date: new Date(item.timestamp).toLocaleDateString(),
    threats: item.threatCount,
    avgConfidence: (item.averageConfidence * 100).toFixed(1) + '%',
    topThreat: item.topThreatType,
    critical: item.severityBreakdown.critical,
    high: item.severityBreakdown.high,
  })) || [];

  return (
    <DashboardLayout>
      <FadeIn>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Threat Analytics Deep Dive
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Detailed time-series analysis and trend exploration
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Filters & Drill-Down</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Severity</label>
                <select
                  multiple
                  value={filters.severities}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      severities: Array.from(e.target.selectedOptions, (o) => o.value as any),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={fetchTrendsData} size="lg" className="flex-1">
                  Apply Filters
                </Button>
              </div>
            </div>
          </Card>

          {/* Summary */}
          {trendsData && (
            <Card className="p-6 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Total Threats</div>
                  <div className="text-2xl font-bold text-primary-600">
                    {trendsData.summary.totalThreats}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Average Severity</div>
                  <div className="text-2xl font-bold text-accent-500">
                    {trendsData.summary.averageSeverity}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Time Range</div>
                  <div className="text-sm font-medium">
                    {new Date(trendsData.summary.timeRange.startDate).toLocaleDateString()} -{' '}
                    {new Date(trendsData.summary.timeRange.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Top Threats</div>
                  <div className="text-sm font-medium">
                    {trendsData.summary.topThreats.slice(0, 2).join(', ')}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Time Series Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Threat Timeline</h2>
            <LineChart
              data={chartData}
              lines={[
                { dataKey: 'threats', name: 'Total Threats', color: '#1e88ff' },
                { dataKey: 'critical', name: 'Critical', color: '#f44336' },
                { dataKey: 'high', name: 'High', color: '#ff9800' },
              ]}
              xAxisKey="timestamp"
              height={350}
              showLegend
            />
          </Card>

          {/* Severity Breakdown */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Severity Distribution Over Time</h2>
            <BarChart
              data={chartData}
              bars={[
                { dataKey: 'critical', name: 'Critical', fill: '#f44336' },
                { dataKey: 'high', name: 'High', fill: '#ff9800' },
                { dataKey: 'medium', name: 'Medium', fill: '#ffc107' },
                { dataKey: 'low', name: 'Low', fill: '#4caf50' },
              ]}
              xAxisKey="timestamp"
              height={300}
              showLegend
            />
          </Card>

          {/* Detailed Data Table */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Detailed Analysis</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-right">Total Threats</th>
                    <th className="px-4 py-2 text-right">Critical</th>
                    <th className="px-4 py-2 text-right">High</th>
                    <th className="px-4 py-2 text-left">Top Threat</th>
                    <th className="px-4 py-2 text-right">Avg Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2">{row.date}</td>
                      <td className="px-4 py-2 text-right font-semibold">{row.threats}</td>
                      <td className="px-4 py-2 text-right">
                        <span className="bg-danger/10 text-danger px-2 py-1 rounded">
                          {row.critical}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className="bg-warning/10 text-warning px-2 py-1 rounded">
                          {row.high}
                        </span>
                      </td>
                      <td className="px-4 py-2">{row.topThreat}</td>
                      <td className="px-4 py-2 text-right">{row.avgConfidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Export Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handleExportPDF}>
              Export PDF
            </Button>
          </div>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}

function generateCSV(data: any[]): string {
  const headers = ['Date', 'Total Threats', 'Critical', 'High', 'Medium', 'Low', 'Avg Confidence'];
  const rows = data.map((item) => [
    new Date(item.timestamp).toLocaleDateString(),
    item.threatCount,
    item.severityBreakdown.critical,
    item.severityBreakdown.high,
    item.severityBreakdown.medium,
    item.severityBreakdown.low,
    (item.averageConfidence * 100).toFixed(1) + '%',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csv;
}

function downloadFile(content: string | Blob, filename: string, type: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
