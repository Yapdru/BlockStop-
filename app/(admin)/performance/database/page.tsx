/**
 * Database Performance Monitoring Dashboard
 * Displays comprehensive database statistics and optimization recommendations
 */

'use client';

import React, { useState, useEffect } from 'react';

interface DBStats {
  totalConnections: number;
  activeConnections: number;
  cacheHitRate: number;
  avgQueryTime: number;
  slowQueries: number;
  replicationLag: number;
  indexes: {
    total: number;
    unused: number;
    fragmented: number;
  };
  diskUsage: {
    totalBytes: number;
    usedBytes: number;
    usagePercent: number;
  };
  tables: Array<{
    name: string;
    rowCount: number;
    sizeBytes: number;
  }>;
  timestamp: string;
}

interface TabProps {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

const DatabasePerformancePage: React.FC = () => {
  const [stats, setStats] = useState<DBStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Fetch database statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const response = await fetch('/api/performance/db-stats', {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || ''}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up auto-refresh
    const interval = setInterval(fetchStats, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading database statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Error Loading Statistics</h2>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Database Performance</h1>
          <p className="text-gray-600 mt-2">
            Last updated: {stats ? new Date(stats.timestamp).toLocaleTimeString() : 'N/A'}
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <label className="text-gray-700 font-medium">Auto-refresh: </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              className="ml-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>Every 10 seconds</option>
              <option value={30}>Every 30 seconds</option>
              <option value={60}>Every minute</option>
              <option value={0}>Disabled</option>
            </select>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh Now
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8" role="tablist">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'connections', label: 'Connections' },
              { id: 'indexes', label: 'Indexes' },
              { id: 'tables', label: 'Tables' },
              { id: 'replication', label: 'Replication' },
            ].map((tab) => (
              <Tab
                key={tab.id}
                {...tab}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {stats && (
          <div>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {/* Cache Hit Rate */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600 text-sm font-medium">Cache Hit Rate</p>
                    <p className={`text-3xl font-bold mt-2 ${getStatusColor(100 - stats.cacheHitRate, { good: 20, warning: 40 })}`}>
                      {stats.cacheHitRate.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Higher is better</p>
                  </div>

                  {/* Avg Query Time */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600 text-sm font-medium">Avg Query Time</p>
                    <p className={`text-3xl font-bold mt-2 ${getStatusColor(stats.avgQueryTime, { good: 10, warning: 50 })}`}>
                      {stats.avgQueryTime.toFixed(2)}ms
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Last 1 hour</p>
                  </div>

                  {/* Slow Queries */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600 text-sm font-medium">Slow Queries (24h)</p>
                    <p className={`text-3xl font-bold mt-2 ${getStatusColor(stats.slowQueries, { good: 10, warning: 50 })}`}>
                      {stats.slowQueries}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Requires optimization</p>
                  </div>

                  {/* Replication Lag */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600 text-sm font-medium">Replication Lag</p>
                    <p className={`text-3xl font-bold mt-2 ${getStatusColor(stats.replicationLag, { good: 1, warning: 5 })}`}>
                      {stats.replicationLag.toFixed(2)}s
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Primary to replica</p>
                  </div>
                </div>

                {/* Disk Usage */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Disk Usage</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-700">Total Database Size</span>
                        <span className="font-medium">{formatBytes(stats.diskUsage.usedBytes)} / {formatBytes(stats.diskUsage.totalBytes)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(stats.diskUsage.usagePercent, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{stats.diskUsage.usagePercent.toFixed(1)}% utilized</p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Optimization Recommendations</h2>
                  <ul className="space-y-3">
                    {stats.cacheHitRate < 95 && (
                      <li className="flex items-start">
                        <span className="text-yellow-500 mr-3">•</span>
                        <span className="text-gray-700">Cache hit rate is below 95%. Consider increasing shared_buffers or reviewing query patterns.</span>
                      </li>
                    )}
                    {stats.avgQueryTime > 50 && (
                      <li className="flex items-start">
                        <span className="text-yellow-500 mr-3">•</span>
                        <span className="text-gray-700">Average query time exceeds 50ms. Review slow queries and add appropriate indexes.</span>
                      </li>
                    )}
                    {stats.slowQueries > 50 && (
                      <li className="flex items-start">
                        <span className="text-red-500 mr-3">•</span>
                        <span className="text-gray-700">High number of slow queries detected. Immediate optimization required.</span>
                      </li>
                    )}
                    {stats.indexes.unused > 5 && (
                      <li className="flex items-start">
                        <span className="text-yellow-500 mr-3">•</span>
                        <span className="text-gray-700">{stats.indexes.unused} unused indexes found. Consider dropping to improve write performance.</span>
                      </li>
                    )}
                    {stats.replicationLag > 5 && (
                      <li className="flex items-start">
                        <span className="text-red-500 mr-3">•</span>
                        <span className="text-gray-700">Replication lag exceeds 5 seconds. Investigate replica performance.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Connections Tab */}
            {activeTab === 'connections' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Connection Pool Status</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Connections</p>
                    <p className="text-2xl font-bold mt-2">{stats.activeConnections}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Max Connections</p>
                    <p className="text-2xl font-bold mt-2">{stats.totalConnections}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Connection Usage</span>
                    <span className="font-medium">
                      {Math.round((stats.activeConnections / stats.totalConnections) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${Math.min((stats.activeConnections / stats.totalConnections) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Indexes Tab */}
            {activeTab === 'indexes' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Index Statistics</h2>
                <div className="grid grid-cols-3 gap-6">
                  <div className="border-l-4 border-blue-600 pl-4">
                    <p className="text-gray-600 text-sm font-medium">Total Indexes</p>
                    <p className="text-2xl font-bold mt-2">{stats.indexes.total}</p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <p className="text-gray-600 text-sm font-medium">Unused Indexes</p>
                    <p className="text-2xl font-bold mt-2 text-yellow-600">{stats.indexes.unused}</p>
                  </div>
                  <div className="border-l-4 border-red-600 pl-4">
                    <p className="text-gray-600 text-sm font-medium">Fragmented Indexes</p>
                    <p className="text-2xl font-bold mt-2 text-red-600">{stats.indexes.fragmented}</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Consider dropping unused indexes to improve write performance. Fragmented indexes can be rebuilt using REINDEX.
                  </p>
                </div>
              </div>
            )}

            {/* Tables Tab */}
            {activeTab === 'tables' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Top Tables by Size</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Table Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Row Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.tables.map((table, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{table.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{table.rowCount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatBytes(table.sizeBytes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Replication Tab */}
            {activeTab === 'replication' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Replication Status</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Replication Lag</p>
                    <p className={`text-3xl font-bold mt-2 ${getStatusColor(stats.replicationLag, { good: 1, warning: 5 })}`}>
                      {stats.replicationLag.toFixed(2)}s
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Status</p>
                    <p className={`text-lg font-bold mt-2 ${stats.replicationLag < 1 ? 'text-green-600' : stats.replicationLag < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {stats.replicationLag < 1 ? 'Healthy' : stats.replicationLag < 5 ? 'Warning' : 'Critical'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Replication lag indicates how far behind the replica is from the primary server. Lower values are better.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Tab: React.FC<TabProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    role="tab"
    aria-selected={active}
    className={`py-4 px-1 font-medium text-sm border-b-2 transition-colors ${
      active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

export default DatabasePerformancePage;
