'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/AdminLayout';
import { RealtimeChart } from '@/components/RealtimeChart';
import { getNetAdmin, RevenueStats, SystemHealth } from '@/lib/NetAdmin';

interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  icon: string;
  color: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ labels: string[]; revenue: number[] }>({
    labels: [],
    revenue: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const netAdmin = getNetAdmin();

      try {
        // Fetch all data in parallel
        const [revenue, systemHealth, users] = await Promise.all([
          netAdmin.getRevenueStats(),
          netAdmin.getSystemHealth(),
          netAdmin.getActiveUsers(),
        ]);

        setRevenueStats(revenue);
        setHealth(systemHealth);

        // Build stats cards
        const statCards: StatCard[] = [
          {
            label: 'Total Revenue',
            value: `$${revenue.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
            icon: '💰',
            color: 'from-green-500/20 to-green-500/5',
          },
          {
            label: 'This Month',
            value: `$${revenue.thisMonthRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
            change: `vs $${revenue.lastMonthRevenue.toFixed(2)} last month`,
            icon: '📈',
            color: 'from-blue-500/20 to-blue-500/5',
          },
          {
            label: 'Active Users',
            value: users.length,
            icon: '👥',
            color: 'from-purple-500/20 to-purple-500/5',
          },
          {
            label: 'Payment Success Rate',
            value: `${revenue.paymentSuccessRate.toFixed(1)}%`,
            icon: '✓',
            color: 'from-emerald-500/20 to-emerald-500/5',
          },
          {
            label: 'Healthy Servers',
            value: `${systemHealth.activeServers}/${systemHealth.totalServers}`,
            icon: '🖥️',
            color: systemHealth.allServersHealthy
              ? 'from-green-500/20 to-green-500/5'
              : 'from-red-500/20 to-red-500/5',
          },
          {
            label: 'API Latency',
            value: `${systemHealth.apiLatency.toFixed(0)}ms`,
            icon: '⚡',
            color: 'from-yellow-500/20 to-yellow-500/5',
          },
        ];

        setStats(statCards);

        // Generate mock chart data for last 7 days
        const labels = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const revenueData = Array.from({ length: 7 }, (_, i) => {
          const baseRevenue = revenue.thisMonthRevenue / 7;
          const variation = (Math.random() - 0.5) * baseRevenue * 0.4;
          return baseRevenue + variation;
        });

        setChartData({ labels, revenue: revenueData });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AdminLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-admin-text mb-2">Dashboard</h1>
          <p className="text-admin-text-muted">
            Real-time overview of BlockStop operations
          </p>
        </motion.div>

        {/* Stats Grid */}
        {!loading && stats.length > 0 && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-gradient-to-br ${stat.color} border border-admin-border rounded-admin p-6`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-admin-text-muted text-sm font-medium mb-2">
                      {stat.label}
                    </p>
                    <p className="text-admin-text text-2xl font-bold">
                      {stat.value}
                    </p>
                    {stat.change && (
                      <p className="text-xs text-admin-text-muted mt-2">{stat.change}</p>
                    )}
                  </div>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Charts */}
        {!loading && chartData.labels.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-4">
            <RealtimeChart
              title="Revenue Trend (7 Days)"
              labels={chartData.labels}
              datasets={[
                {
                  label: 'Daily Revenue',
                  data: chartData.revenue,
                  borderColor: '#10b981',
                  backgroundColor: '#10b98120',
                  tension: 0.4,
                },
              ]}
              height={350}
            />
          </motion.div>
        )}

        {/* System Status */}
        {!loading && health && (
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Cache Status */}
            <div className="bg-admin-card border border-admin-border rounded-admin p-6">
              <h3 className="text-admin-text font-semibold mb-4">Cache Status</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-admin-text-muted text-sm mb-2">Overall Status</p>
                  <p
                    className={`text-lg font-bold ${
                      health.cacheStatus === 'healthy'
                        ? 'text-green-400'
                        : health.cacheStatus === 'warning'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {health.cacheStatus.toUpperCase()}
                  </p>
                </div>
                <span className="text-3xl">
                  {health.cacheStatus === 'healthy'
                    ? '✓'
                    : health.cacheStatus === 'warning'
                      ? '⚠'
                      : '✕'}
                </span>
              </div>
            </div>

            {/* Error Rate */}
            <div className="bg-admin-card border border-admin-border rounded-admin p-6">
              <h3 className="text-admin-text font-semibold mb-4">Error Rate</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-admin-text-muted text-sm mb-2">Current</p>
                  <p
                    className={`text-lg font-bold ${
                      health.errorRate < 1
                        ? 'text-green-400'
                        : health.errorRate < 5
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  >
                    {health.errorRate.toFixed(2)}%
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-admin-border flex items-center justify-center">
                  <span className="text-2xl font-bold text-admin-accent">
                    {Math.round(100 - health.errorRate)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            variants={itemVariants}
            className="bg-admin-card border border-admin-border rounded-admin p-8 text-center"
          >
            <div className="inline-block animate-spin text-3xl mb-4">⚙️</div>
            <p className="text-admin-text-muted">Loading dashboard data...</p>
          </motion.div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
