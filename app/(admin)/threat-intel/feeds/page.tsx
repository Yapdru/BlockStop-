'use client';

import { useState, useEffect } from 'react';

interface Feed {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  lastUpdate: string | null;
  status: string;
  error?: string;
}

export default function FeedsManagement() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchFeeds();
  }, []);

  async function fetchFeeds() {
    try {
      const response = await fetch('/api/threat-intel/feeds');
      const data = await response.json();
      setFeeds(data.feeds || []);
    } catch (error) {
      console.error('Error fetching feeds:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeed(feedId: string) {
    try {
      const response = await fetch('/api/threat-intel/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-feed', feedId }),
      });

      if (response.ok) {
        await fetchFeeds();
      }
    } catch (error) {
      console.error('Error toggling feed:', error);
    }
  }

  async function updateFeed(feedId: string) {
    setUpdating(feedId);
    try {
      const response = await fetch('/api/threat-intel/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-feed', feedId }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Feed updated: ${result.result.newIndicators} new indicators added`
        );
        await fetchFeeds();
      }
    } catch (error) {
      console.error('Error updating feed:', error);
      alert('Error updating feed');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-7xl mx-auto">Loading feeds...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Feed Management</h1>
          <p className="text-slate-400">Configure and manage threat intelligence feeds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="bg-slate-900 rounded-lg border border-slate-700 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{feed.name}</h3>
                  <p className="text-sm text-slate-400 capitalize">{feed.type}</p>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    feed.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              </div>

              <div className="space-y-3 mb-6">
                <div className="text-sm">
                  <span className="text-slate-400">Status: </span>
                  <span className="font-semibold capitalize">{feed.status}</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">Last Update: </span>
                  <span className="font-semibold">
                    {feed.lastUpdate
                      ? new Date(feed.lastUpdate).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                {feed.error && (
                  <div className="text-sm text-red-400">
                    <span>Error: {feed.error}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => updateFeed(feed.id)}
                  disabled={updating === feed.id}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded transition-colors text-sm font-semibold"
                >
                  {updating === feed.id ? 'Updating...' : 'Update'}
                </button>
                <button
                  onClick={() => toggleFeed(feed.id)}
                  className={`flex-1 px-3 py-2 rounded transition-colors text-sm font-semibold ${
                    feed.enabled
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  {feed.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
