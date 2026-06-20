'use client';

/**
 * Caching Performance Dashboard
 * Displays cache statistics, hit rates, and optimization insights
 */

import { useEffect, useState } from 'react';

interface CacheStats {
  success: boolean;
  timestamp: string;
  cache: {
    statistics: {
      totalHits: number;
      totalMisses: number;
      hitRate: number;
      totalSize: number;
      totalEntries: number;
      averageEntrySize: number;
    };
    layers: {
      l1: {
        name: string;
        size: number;
        entries: number;
        percentage: string;
        ttl: number;
      };
      l2: {
        name: string;
        size: number;
        entries: number;
        percentage: string;
        ttl: number;
      };
      l3: {
        name: string;
        size: number;
        entries: number;
        percentage: string;
        ttl: number;
      };
    };
  };
  topKeys?: Array<{
    key: string;
    hits: number;
    misses: number;
    size: number;
    hitRate: string;
  }>;
}

export default function CachingDashboard() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch cache statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/performance/cache/stats?topKeys=true&limit=10');
      if (!response.ok) {
        throw new Error('Failed to fetch cache statistics');
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initialize and setup auto-refresh
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Invalidate cache
  const handleInvalidateCache = async (pattern: string) => {
    try {
      const response = await fetch('/api/performance/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern,
          reason: 'Manual invalidation from dashboard',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to invalidate cache');
      }

      // Refresh stats after invalidation
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invalidate cache');
    }
  };

  // Clear all cache
  const handleClearAllCache = async () => {
    if (!confirm('Are you sure you want to clear all cache?')) return;

    try {
      const response = await fetch('/api/performance/cache/invalidate', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear cache');
      }

      // Refresh stats
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-slate-300 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Cache Performance</h1>
              <p className="text-slate-600 mt-1">Multi-layer caching strategy dashboard</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded font-medium transition ${
                  autoRefresh
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
                }`}
              >
                {autoRefresh ? '⏸ Auto-refresh On' : '▶ Auto-refresh Off'}
              </button>
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleClearAllCache}
                className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-500">Last updated: {stats?.timestamp}</p>
        </div>

        {/* Main Statistics */}
        {stats && (
          <>
            {/* Hit Rate Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-4xl font-bold text-green-600">
                  {stats.cache.statistics.hitRate.toFixed(1)}%
                </div>
                <p className="text-slate-600 mt-2">Hit Rate</p>
                <p className="text-xs text-slate-500 mt-1">Overall cache effectiveness</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-blue-600">
                  {(stats.cache.statistics.totalHits / 1000).toFixed(1)}K
                </div>
                <p className="text-slate-600 mt-2">Total Hits</p>
                <p className="text-xs text-slate-500 mt-1">Cache hits in tracking period</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-orange-600">
                  {(stats.cache.statistics.totalSize / (1024 * 1024)).toFixed(1)}MB
                </div>
                <p className="text-slate-600 mt-2">Total Size</p>
                <p className="text-xs text-slate-500 mt-1">Cache memory consumption</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.cache.statistics.totalEntries.toLocaleString()}
                </div>
                <p className="text-slate-600 mt-2">Entries</p>
                <p className="text-xs text-slate-500 mt-1">Cached items</p>
              </div>
            </div>

            {/* Cache Layers */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Cache Layers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[stats.cache.layers.l1, stats.cache.layers.l2, stats.cache.layers.l3].map(
                  (layer) => (
                    <div
                      key={layer.name}
                      className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition"
                    >
                      <h3 className="font-semibold text-slate-900 mb-4">{layer.name}</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600">Size</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {(layer.size / (1024 * 1024)).toFixed(1)}MB
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Entries</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {layer.entries.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">TTL</p>
                          <p className="text-sm text-slate-700">{formatTTL(layer.ttl)}</p>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: layer.percentage }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{layer.percentage} of total</p>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Top Keys */}
            {stats.topKeys && stats.topKeys.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Top Cached Keys</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-900">Key</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">Hits</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">
                          Misses
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">
                          Hit Rate
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-900">Size</th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-900">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topKeys.map((key, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-100 hover:bg-slate-50 transition"
                        >
                          <td className="py-3 px-4 text-slate-900 font-mono text-sm">{key.key}</td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            {key.hits.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            {key.misses.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex px-2 py-1 rounded bg-green-100 text-green-800 text-sm font-medium">
                              {key.hitRate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">
                            {(key.size / 1024).toFixed(1)}KB
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleInvalidateCache(key.key)}
                              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
                            >
                              Invalidate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Performance Insights</h2>
              <div className="space-y-3">
                {stats.cache.statistics.hitRate >= 80 ? (
                  <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                    <span className="text-xl">✓</span>
                    <div>
                      <p className="font-semibold text-green-900">Excellent Cache Hit Rate</p>
                      <p className="text-sm text-green-800">
                        Your cache hit rate is above 80%, indicating optimal cache strategy.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <span className="text-xl">⚠</span>
                    <div>
                      <p className="font-semibold text-yellow-900">Improve Hit Rate</p>
                      <p className="text-sm text-yellow-800">
                        Consider implementing cache warming to improve hit rates.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-xl">ℹ</span>
                  <div>
                    <p className="font-semibold text-blue-900">Multi-Layer Distribution</p>
                    <p className="text-sm text-blue-800">
                      Your cache is distributed across 3 layers: In-Memory (L1), Secondary (L2),
                      and Redis (L3).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Format TTL in human-readable format
 */
function formatTTL(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
