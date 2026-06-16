'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Breadcrumbs } from '@/app/components/layouts/Breadcrumbs';
import { ResponsiveGrid, GridItem } from '@/app/components/layouts/ResponsiveGrid';
import {
  AlertCircle,
  TrendingUp,
  FileText,
  Mail,
  Shield,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface ScanItem {
  id: number;
  email?: string;
  fileName?: string;
  riskScore?: number;
  threatLevel?: string;
  threats: string[];
  createdAt: string;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, change, icon, trend = 'neutral' }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        {change && (
          <p className={`text-sm mt-2 ${
            trend === 'up' ? 'text-green-600 dark:text-green-400' :
            trend === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            {change}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${
        trend === 'up' ? 'bg-green-100 dark:bg-green-900' :
        trend === 'down' ? 'bg-red-100 dark:bg-red-900' :
        'bg-blue-100 dark:bg-blue-900'
      }`}>
        {icon}
      </div>
    </div>
  </div>
);

const ActivityCard: React.FC<{
  title: string;
  description: string;
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}> = ({ title, description, time, severity }) => {
  const severityColors = {
    critical: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    high: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    low: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  };

  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className={`px-3 py-1 rounded text-xs font-semibold ${severityColors[severity]}`}>
        {severity.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{description}</p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">{time}</p>
    </div>
  );
};

export default function DashboardPage() {
  const [emailHistory, setEmailHistory] = useState<ScanItem[]>([]);
  const [fileHistory, setFileHistory] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [emailRes, fileRes] = await Promise.all([
          fetch('/api/email/history'),
          fetch('/api/file/results'),
        ]);

        const emailData = await emailRes.json();
        const fileData = await fileRes.json();

        setEmailHistory(emailData.history || []);
        setFileHistory(fileData.results || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const stats = {
    totalScans: emailHistory.length + fileHistory.length,
    threatsDetected: emailHistory.filter((e) => e.riskScore && e.riskScore > 50).length,
    malwareFound: fileHistory.filter((f) => f.threatLevel === 'dangerous').length,
  };

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumbs items={[{ label: 'Dashboard' }]} />

          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back! Here's your security overview.</p>
          </div>

          {/* Stats Grid */}
          <ResponsiveGrid
            columns={{ default: 1, sm: 2, lg: 4 }}
            gap="md"
          >
            <StatCard
              title="Total Scans"
              value={stats.totalScans}
              change="+12% this week"
              trend="up"
              icon={<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            />
            <StatCard
              title="Threats Detected"
              value={stats.threatsDetected}
              change="+3 this week"
              trend="down"
              icon={<AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
            />
            <StatCard
              title="System Health"
              value="98.5%"
              change="All systems nominal"
              icon={<Shield className="w-6 h-6 text-green-600 dark:text-green-400" />}
            />
            <StatCard
              title="Avg. Scan Time"
              value="2.3s"
              change="-0.4s improvement"
              trend="up"
              icon={<Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            />
          </ResponsiveGrid>

          {/* Main Content Grid */}
          <ResponsiveGrid
            columns={{ default: 1, lg: 2, xl: 3 }}
            gap="md"
          >
            {/* Recent Activity */}
            <GridItem span={{ default: 1, lg: 2 }}>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <div className="p-6 text-center text-gray-600 dark:text-gray-400">Loading...</div>
                  ) : emailHistory.length === 0 && fileHistory.length === 0 ? (
                    <div className="p-6 text-center text-gray-600 dark:text-gray-400">No activity yet</div>
                  ) : (
                    <>
                      {emailHistory.slice(0, 2).map((item) => (
                        <ActivityCard
                          key={item.id}
                          title={`Email from ${item.email?.substring(0, 20)}...`}
                          description={`Risk Score: ${item.riskScore}%`}
                          time={new Date(item.createdAt).toLocaleDateString()}
                          severity={item.riskScore! > 70 ? 'critical' : item.riskScore! > 40 ? 'high' : 'low'}
                        />
                      ))}
                      {fileHistory.slice(0, 1).map((item) => (
                        <ActivityCard
                          key={item.id}
                          title={`File: ${item.fileName}`}
                          description={`Threat Level: ${item.threatLevel}`}
                          time={new Date(item.createdAt).toLocaleDateString()}
                          severity={item.threatLevel === 'dangerous' ? 'critical' : item.threatLevel === 'warning' ? 'high' : 'low'}
                        />
                      ))}
                    </>
                  )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-2">
                    View all activity
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GridItem>

            {/* Quick Actions */}
            <GridItem span={{ default: 1 }}>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
                </div>
                <div className="p-4 space-y-3">
                  <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 justify-center">
                    <Mail className="w-5 h-5" />
                    Scan Email
                  </button>
                  <button className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 justify-center">
                    <FileText className="w-5 h-5" />
                    Upload File
                  </button>
                  <button className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors">
                    Run Threat Hunt
                  </button>
                  <button className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors">
                    View Reports
                  </button>
                </div>
              </div>
            </GridItem>
          </ResponsiveGrid>

          {/* Alerts Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-4">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 dark:text-blue-200">
                Performance Insight
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                Your system is performing 12% better than last week. Keep monitoring your settings for optimal security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
