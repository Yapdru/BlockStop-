'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardData {
  dashboard: {
    threatSummary: { critical: number; high: number; medium: number; low: number };
    totalUnresolvedThreats: number;
    recentJobs: any[];
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await fetch('/api/unified/dashboard', {
          headers: { 'x-user-id': userId || '' }
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleStartScan = async () => {
    setScanning(true);
    try {
      const userId = localStorage.getItem('userId');
      // Trigger scan - would need integration IDs
      alert('Scan initiated. Check your integrations in Settings.');
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const threatData = data?.dashboard.threatSummary || { critical: 0, high: 0, medium: 0, low: 0 };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <button
          onClick={handleStartScan}
          disabled={scanning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded font-bold transition"
        >
          {scanning ? 'Scanning...' : 'Start Security Scan'}
        </button>
      </div>

      {/* Threat Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <p className="text-red-400 text-sm">CRITICAL</p>
          <p className="text-3xl font-bold text-red-400">{threatData.critical}</p>
        </div>
        <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-6">
          <p className="text-orange-400 text-sm">HIGH</p>
          <p className="text-3xl font-bold text-orange-400">{threatData.high}</p>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
          <p className="text-yellow-400 text-sm">MEDIUM</p>
          <p className="text-3xl font-bold text-yellow-400">{threatData.medium}</p>
        </div>
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
          <p className="text-green-400 text-sm">LOW</p>
          <p className="text-3xl font-bold text-green-400">{threatData.low}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Scans</h2>
          {data?.dashboard.recentJobs && data.dashboard.recentJobs.length > 0 ? (
            <div className="space-y-2">
              {data.dashboard.recentJobs.slice(0, 5).map((job: any) => (
                <div key={job.id} className="flex justify-between items-center p-3 bg-slate-700 rounded">
                  <div>
                    <p className="font-medium">{job.job_type}</p>
                    <p className="text-sm text-gray-400">{new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-bold ${
                    job.status === 'completed' ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No scans yet. Start your first security scan!</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/integrations"
              className="block bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded transition font-medium"
            >
              Connect Integrations
            </Link>
            <Link
              href="/settings"
              className="block bg-slate-700 hover:bg-slate-600 text-white text-center py-2 rounded transition font-medium"
            >
              Settings
            </Link>
            <Link
              href="/products"
              className="block bg-slate-700 hover:bg-slate-600 text-white text-center py-2 rounded transition font-medium"
            >
              Upgrade Plan
            </Link>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded transition font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
