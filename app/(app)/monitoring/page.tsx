'use client';

import React, { useState, useEffect } from 'react';
import { performanceTracker } from '@/lib/monitoring/performance-tracker';
import { metricsCollector } from '@/lib/monitoring/metrics-collector';
import { alertsSystem } from '@/lib/monitoring/alerts';
import { queryOptimizer } from '@/lib/db/query-optimizer';

interface MetricsData {
  pageLoad: any;
  apiLatency: any;
  coreWebVitals: any;
  systemMetrics: any;
  alerts: any;
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/monitoring/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="text-center text-gray-400">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Performance Monitoring</h1>
          <p className="text-gray-400">Real-time system metrics and performance analytics</p>
        </div>

        {/* Refresh Interval Control */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setRefreshInterval(5000)}
            className={`px-4 py-2 rounded ${
              refreshInterval === 5000
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            5s
          </button>
          <button
            onClick={() => setRefreshInterval(10000)}
            className={`px-4 py-2 rounded ${
              refreshInterval === 10000
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            10s
          </button>
          <button
            onClick={() => setRefreshInterval(30000)}
            className={`px-4 py-2 rounded ${
              refreshInterval === 30000
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            30s
          </button>
        </div>

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Page Load Time */}
            <MetricCard
              title="Avg Page Load Time"
              value={`${metrics.pageLoad?.avgTime || 0}ms`}
              status={
                metrics.pageLoad?.avgTime < 2000 ? 'good' : metrics.pageLoad?.avgTime < 4000 ? 'warning' : 'critical'
              }
            />

            {/* API Latency */}
            <MetricCard
              title="API P95 Latency"
              value={`${metrics.apiLatency?.p95 || 0}ms`}
              status={
                metrics.apiLatency?.p95 < 200 ? 'good' : metrics.apiLatency?.p95 < 500 ? 'warning' : 'critical'
              }
            />

            {/* Cache Hit Rate */}
            <MetricCard
              title="Cache Hit Rate"
              value={`${metrics.systemMetrics?.cacheHitRate?.toFixed(1) || 0}%`}
              status={
                metrics.systemMetrics?.cacheHitRate > 80
                  ? 'good'
                  : metrics.systemMetrics?.cacheHitRate > 60
                    ? 'warning'
                    : 'critical'
              }
            />

            {/* Error Rate */}
            <MetricCard
              title="Error Rate"
              value={`${metrics.systemMetrics?.errorRate?.toFixed(2) || 0}%`}
              status={
                metrics.systemMetrics?.errorRate < 1
                  ? 'good'
                  : metrics.systemMetrics?.errorRate < 5
                    ? 'warning'
                    : 'critical'
              }
            />

            {/* CPU Usage */}
            <MetricCard
              title="CPU Usage"
              value={`${metrics.systemMetrics?.cpu?.toFixed(1) || 0}%`}
              status={
                metrics.systemMetrics?.cpu < 50 ? 'good' : metrics.systemMetrics?.cpu < 80 ? 'warning' : 'critical'
              }
            />

            {/* Memory Usage */}
            <MetricCard
              title="Memory Usage"
              value={`${metrics.systemMetrics?.memory?.toFixed(1) || 0}%`}
              status={
                metrics.systemMetrics?.memory < 60
                  ? 'good'
                  : metrics.systemMetrics?.memory < 85
                    ? 'warning'
                    : 'critical'
              }
            />
          </div>
        )}

        {/* Core Web Vitals */}
        {metrics?.coreWebVitals && (
          <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Core Web Vitals</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <VitalCard
                label="FCP"
                value={`${metrics.coreWebVitals.fcp}ms`}
                status={metrics.coreWebVitals.fcp < 1800 ? 'good' : metrics.coreWebVitals.fcp < 3000 ? 'warning' : 'poor'}
              />
              <VitalCard
                label="LCP"
                value={`${metrics.coreWebVitals.lcp}ms`}
                status={
                  metrics.coreWebVitals.lcp < 2500 ? 'good' : metrics.coreWebVitals.lcp < 4000 ? 'warning' : 'poor'
                }
              />
              <VitalCard
                label="CLS"
                value={`${metrics.coreWebVitals.cls}`}
                status={
                  metrics.coreWebVitals.cls < 0.1 ? 'good' : metrics.coreWebVitals.cls < 0.25 ? 'warning' : 'poor'
                }
              />
              <VitalCard
                label="TTFB"
                value={`${metrics.coreWebVitals.ttfb}ms`}
                status={
                  metrics.coreWebVitals.ttfb < 600 ? 'good' : metrics.coreWebVitals.ttfb < 1800 ? 'warning' : 'poor'
                }
              />
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {metrics?.alerts?.activeAlerts && metrics.alerts.activeAlerts.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Active Alerts</h2>
            <div className="space-y-3">
              {metrics.alerts.activeAlerts.slice(0, 5).map((alert: any, idx: number) => (
                <AlertItem key={idx} alert={alert} />
              ))}
            </div>
            {metrics.alerts.activeAlerts.length > 5 && (
              <p className="text-gray-400 text-sm mt-4">
                +{metrics.alerts.activeAlerts.length - 5} more alerts
              </p>
            )}
          </div>
        )}

        {/* Database Performance */}
        {metrics?.pageLoad && (
          <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Database Performance</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="Slow Queries (1h)" value={metrics.pageLoad.slowQueryCount || 0} />
              <StatBox label="Avg Query Time" value={`${metrics.pageLoad.avgQueryTime || 0}ms`} />
              <StatBox label="Connection Pool" value={`${metrics.pageLoad.poolUsage || 0}%`} />
              <StatBox label="Query Count" value={metrics.pageLoad.queryCount || 0} />
            </div>
          </div>
        )}

        {/* System Health Summary */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">System Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <HealthBox label="Overall Status" value={metrics?.systemMetrics?.overallHealth || 'Unknown'} />
            <HealthBox label="Uptime" value={`${Math.floor((metrics?.systemMetrics?.uptime || 0) / 3600)}h`} />
            <HealthBox label="RPS" value={`${metrics?.systemMetrics?.requestsPerSecond || 0}`} />
            <HealthBox label="Services Healthy" value={metrics?.alerts?.stats?.total || 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  status,
}: {
  title: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
}) {
  const statusColors = {
    good: 'bg-green-900 border-green-700',
    warning: 'bg-yellow-900 border-yellow-700',
    critical: 'bg-red-900 border-red-700',
  };

  const statusBadgeColors = {
    good: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-black',
    critical: 'bg-red-500 text-white',
  };

  return (
    <div className={`rounded-lg p-4 border ${statusColors[status]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-300 text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${statusBadgeColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </div>
  );
}

function VitalCard({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'good' | 'warning' | 'poor';
}) {
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    poor: 'text-red-400',
  };

  return (
    <div className="bg-slate-700 rounded p-4 text-center">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className={`text-2xl font-bold ${statusColors[status]}`}>{value}</p>
    </div>
  );
}

function AlertItem({ alert }: { alert: any }) {
  const severityColors = {
    critical: 'bg-red-900 border-red-700',
    warning: 'bg-yellow-900 border-yellow-700',
    info: 'bg-blue-900 border-blue-700',
  };

  return (
    <div className={`rounded p-4 border ${severityColors[alert.severity] || severityColors.info}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white font-semibold">{alert.title}</p>
          <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
        </div>
        <span className="text-gray-400 text-xs whitespace-nowrap ml-4">
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-700 rounded p-4 text-center">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function HealthBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-700 rounded p-4 text-center">
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-xl font-bold text-blue-400">{value}</p>
    </div>
  );
}
