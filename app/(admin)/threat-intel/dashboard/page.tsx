'use client';

import { useEffect, useState } from 'react';
import { ThreatMap } from '@/components/threat-intel/threat-map';

interface FeedStats {
  name: string;
  type: string;
  enabled: boolean;
  status: string;
  lastUpdate: string | null;
}

interface IndicatorStats {
  totalIndicators: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
}

interface DashboardData {
  feeds: FeedStats[];
  stats: IndicatorStats;
  schedulerStatus: {
    running: boolean;
    activeFeeds: number;
  };
}

export default function ThreatIntelDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      const response = await fetch('/api/threat-intel/feeds');
      if (!response.ok) throw new Error('Failed to fetch data');

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedUpdate(feedId: string) {
    try {
      const response = await fetch('/api/threat-intel/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-feed', feedId }),
      });

      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  }

  async function handleUpdateAll() {
    try {
      const response = await fetch('/api/threat-intel/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-all' }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Updated ${result.totalSuccessful} feeds successfully, ${result.totalFailed} failed`
        );
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-white">Loading threat intelligence dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-red-400">Error: {error || 'Failed to load data'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Threat Intelligence Dashboard</h1>
          <p className="text-slate-400">Real-time monitoring of threat feeds and indicators</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-semibold mb-2">Total Indicators</div>
            <div className="text-3xl font-bold text-blue-400">
              {data.stats.totalIndicators.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-semibold mb-2">Active Feeds</div>
            <div className="text-3xl font-bold text-green-400">{data.feeds.length}</div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-semibold mb-2">Scheduler Status</div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  data.schedulerStatus.running ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="font-semibold">
                {data.schedulerStatus.running ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-semibold mb-2">IOC Types</div>
            <div className="text-sm space-y-1">
              {Object.entries(data.stats.byType)
                .slice(0, 3)
                .map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-slate-400">{type}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Threat Map */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Global Threat Distribution</h2>
          <ThreatMap height="400px" />
        </div>

        {/* Feed Management */}
        <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Threat Feeds</h2>
            <button
              onClick={handleUpdateAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-semibold"
            >
              Update All Feeds
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Feed Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Last Update
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.feeds.map((feed, index) => (
                  <tr key={index} className="hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold">{feed.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{feed.type}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          feed.status === 'success'
                            ? 'bg-green-900 text-green-200'
                            : feed.status === 'failed'
                            ? 'bg-red-900 text-red-200'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {feed.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {feed.lastUpdate
                        ? new Date(feed.lastUpdate).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleFeedUpdate(feed.name.toLowerCase())}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-xs font-semibold"
                      >
                        Update Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Indicator Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Indicators by Type</h3>
            <div className="space-y-3">
              {Object.entries(data.stats.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-slate-400 capitalize">{type}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{
                          width: `${
                            (count / Math.max(...Object.values(data.stats.byType))) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="font-semibold min-w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Indicators by Source</h3>
            <div className="space-y-3">
              {Object.entries(data.stats.bySource)
                .slice(0, 5)
                .map(([source, count]) => (
                  <div key={source} className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">{source}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 rounded-full transition-all"
                          style={{
                            width: `${
                              (count / Math.max(...Object.values(data.stats.bySource))) * 100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold min-w-12 text-right text-sm">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
