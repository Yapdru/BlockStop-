'use client';

import React, { useState, useEffect } from 'react';
import { InstalledIntegration, IntegrationMetrics } from '@/types/integrations';
import axios from 'axios';

interface IntegrationHealthMonitorProps {
  integration: InstalledIntegration;
}

export function IntegrationHealthMonitor({ integration }: IntegrationHealthMonitorProps) {
  const [metrics, setMetrics] = useState<IntegrationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<IntegrationMetrics>(
          `/api/integrations/${integration.id}/metrics`
        );

        setMetrics(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [integration.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const successRate = metrics.totalRequests > 0
    ? (metrics.successfulRequests / metrics.totalRequests) * 100
    : 0;

  const healthStatus = integration.health.status;
  const healthColor = {
    healthy: 'text-green-600',
    degraded: 'text-yellow-600',
    error: 'text-red-600',
  }[healthStatus];

  const healthBgColor = {
    healthy: 'bg-green-50',
    degraded: 'bg-yellow-50',
    error: 'bg-red-50',
  }[healthStatus];

  const healthBorderColor = {
    healthy: 'border-green-200',
    degraded: 'border-yellow-200',
    error: 'border-red-200',
  }[healthStatus];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Health Monitor</h3>

      {/* Status Card */}
      <div className={`${healthBgColor} border ${healthBorderColor} rounded-lg p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Status</p>
            <p className={`text-2xl font-bold capitalize ${healthColor}`}>
              {healthStatus}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full ${healthBgColor} flex items-center justify-center`}>
            <span className={`text-2xl ${healthColor}`}>
              {healthStatus === 'healthy' ? '✓' : healthStatus === 'degraded' ? '⚠' : '✗'}
            </span>
          </div>
        </div>

        {integration.health.errorMessage && (
          <p className={`text-sm ${healthColor}`}>
            {integration.health.errorMessage}
          </p>
        )}

        <p className="text-xs text-gray-600 mt-2">
          Last checked: {new Date(integration.health.lastCheck).toLocaleString()}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Requests */}
        <div className="bg-white border border-light-border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Total Requests</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalRequests}</p>
        </div>

        {/* Success Rate */}
        <div className="bg-white border border-light-border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Success Rate</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-green-600">{successRate.toFixed(1)}%</p>
            <div className="flex-1">
              <div className="h-2 bg-light-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-white border border-light-border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Uptime</p>
          <p className="text-3xl font-bold text-blue-600">{(metrics.uptime * 100).toFixed(1)}%</p>
        </div>

        {/* Average Response Time */}
        <div className="bg-white border border-light-border rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Avg Response Time</p>
          <p className="text-3xl font-bold text-gray-900">{metrics.avgResponseTime.toFixed(0)}ms</p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white border border-light-border rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Request Statistics</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-gray-700">Successful Requests</span>
            </div>
            <span className="font-semibold text-gray-900">{metrics.successfulRequests}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-gray-700">Failed Requests</span>
            </div>
            <span className="font-semibold text-gray-900">{metrics.failedRequests}</span>
          </div>

          {metrics.lastError && (
            <div className="mt-4 pt-4 border-t border-light-border">
              <p className="text-sm text-gray-600 mb-2">Last Error</p>
              <p className="text-sm bg-red-50 text-red-700 p-2 rounded border border-red-200">
                {metrics.lastError}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Last Sync Info */}
      <div className="bg-light-surface rounded-lg p-4 text-center text-sm text-gray-600">
        <p>Last synchronization: {new Date(integration.lastSync).toLocaleString()}</p>
      </div>
    </div>
  );
}
