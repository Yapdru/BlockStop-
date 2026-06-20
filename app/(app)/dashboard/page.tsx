'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components';
import { Card } from '@/components';
import { a11y } from '@/lib/a11y';

interface DashboardData {
  dashboard: {
    threatSummary: { critical: number; high: number; medium: number; low: number };
    totalUnresolvedThreats: number;
    recentJobs: any[];
  };
}

interface StatCardProps {
  label: string;
  value: number;
  variant: 'critical' | 'high' | 'medium' | 'low';
}

function StatCard({ label, value, variant }: StatCardProps) {
  const variantStyles = {
    critical: 'bg-danger/10 border-danger/20 text-danger',
    high: 'bg-warning/10 border-warning/20 text-warning',
    medium: 'bg-accent-100/50 border-accent-300 text-accent-700',
    low: 'bg-success/10 border-success/20 text-success',
  };

  return (
    <Card padding="md" className={`${variantStyles[variant]} border-2`}>
      <p className="text-sm font-semibold opacity-75 mb-2">{label}</p>
      <p className="text-4xl font-bold">{value}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const announcementRef = useRef<HTMLDivElement>(null);

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
      a11y.announce('Scan initiated. Check your integrations in Settings.', 'assertive');
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-neutral-600 font-medium">Loading dashboard...</div>
      </div>
    );
  }

  const threatData = data?.dashboard.threatSummary || { critical: 0, high: 0, medium: 0, low: 0 };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 md:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded"
        onClick={(e) => {
          e.preventDefault();
          const main = document.querySelector('#main-content');
          if (main instanceof HTMLElement) {
            main.focus();
          }
        }}
      >
        Skip to main content
      </a>
      <div className="container-max py-8" id="main-content">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900 mb-2">Security Dashboard</h1>
            <p className="text-neutral-600">Monitor threats and scan activity in real-time</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartScan}
            isLoading={scanning}
            aria-label={scanning ? 'Scan in progress' : 'Start security scan'}
            aria-busy={scanning}
          >
            📊 Start Scan
          </Button>
        </div>

        {/* Threat Summary */}
        <div className="mb-10">
          <h2 className="text-h4 font-semibold text-neutral-900 mb-4">Threat Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Critical" value={threatData.critical} variant="critical" />
            <StatCard label="High" value={threatData.high} variant="high" />
            <StatCard label="Medium" value={threatData.medium} variant="medium" />
            <StatCard label="Low" value={threatData.low} variant="low" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-h4 font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/email-checker" className="group">
              <Card
                padding="lg"
                className="hover:shadow-lg cursor-pointer text-center transition-all focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
                role="link"
                tabIndex={0}
                aria-label="Check Email - Analyze for threats"
              >
                <p className="text-3xl mb-2" aria-hidden="true">📧</p>
                <p className="font-semibold text-neutral-900">Check Email</p>
                <p className="text-xs text-neutral-600 mt-1">Analyze for threats</p>
              </Card>
            </Link>
            <Link href="/file-scanner" className="group">
              <Card
                padding="lg"
                className="hover:shadow-lg cursor-pointer text-center transition-all focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
                role="link"
                tabIndex={0}
                aria-label="Scan File - Check for malware"
              >
                <p className="text-3xl mb-2" aria-hidden="true">📁</p>
                <p className="font-semibold text-neutral-900">Scan File</p>
                <p className="text-xs text-neutral-600 mt-1">Check for malware</p>
              </Card>
            </Link>
            <Link href="/betterbot" className="group">
              <Card
                padding="lg"
                className="hover:shadow-lg cursor-pointer text-center border-primary-200 border-2 bg-primary-50 transition-all focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
                role="link"
                tabIndex={0}
                aria-label="BetterBot AI - Ask about threats"
              >
                <p className="text-3xl mb-2" aria-hidden="true">🤖</p>
                <p className="font-semibold text-primary-700">BetterBot AI</p>
                <p className="text-xs text-primary-600 mt-1">Ask about threats</p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Scans */}
        <div>
          <h2 className="text-h4 font-semibold text-neutral-900 mb-4">Recent Scans</h2>
          <Card padding="lg">
            {data?.dashboard.recentJobs && data.dashboard.recentJobs.length > 0 ? (
              <ul className="space-y-3" role="list">
                {data.dashboard.recentJobs.slice(0, 5).map((job: any) => (
                  <li
                    key={job.id}
                    className="flex justify-between items-center pb-3 border-b border-neutral-200 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{job.job_type}</p>
                      <p className="text-xs text-neutral-600">{new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.status === 'completed'
                          ? 'bg-success/10 text-success'
                          : 'bg-accent-100/50 text-accent-700'
                      }`}
                      role="status"
                      aria-label={a11y.statusLabel(
                        job.job_type,
                        job.status === 'completed' ? 'Completed' : 'Pending'
                      )}
                    >
                      {job.status === 'completed' ? '✓ Done' : '⏱ Pending'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-600 text-sm">No scans yet</p>
                <p className="text-neutral-500 text-xs mt-1">Start your first security scan above</p>
              </div>
            )}
          </Card>
        </div>

        {/* Links */}
        <div className="flex gap-3 mt-6">
          <Link href="/integrations" className="flex-1">
            <Button variant="secondary" className="w-full" aria-label="Configure integrations">
              ⚙️ <span className="ml-1">Integrations</span>
            </Button>
          </Link>
          <Link href="/settings" className="flex-1">
            <Button variant="secondary" className="w-full" aria-label="Go to settings">
              ⚡ <span className="ml-1">Settings</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
