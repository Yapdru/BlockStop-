'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/AdminLayout';
import { ServerStatus } from '@/components/ServerStatus';
import { getNetAdmin, ServerStatus as ServerStatusType } from '@/lib/NetAdmin';

export default function ServersPage() {
  const [servers, setServers] = useState<ServerStatusType[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const netAdmin = getNetAdmin();

      try {
        const [serverData, health] = await Promise.all([
          netAdmin.getServerStatus(),
          netAdmin.getSystemHealth(),
        ]);

        setServers(serverData);
        setSystemHealth(health);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch server data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: servers.length,
    healthy: servers.filter(s => s.status === 'healthy').length,
    warning: servers.filter(s => s.status === 'warning').length,
    critical: servers.filter(s => s.status === 'critical').length,
    avgCpu: servers.length > 0 ? servers.reduce((sum, s) => sum + s.cpuUsage, 0) / servers.length : 0,
    avgMemory: servers.length > 0 ? servers.reduce((sum, s) => sum + s.memoryUsage, 0) / servers.length : 0,
    totalRequests: servers.reduce((sum, s) => sum + s.requestsPerSecond, 0),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
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
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-admin-text">Server Monitoring</h1>
              <p className="text-admin-text-muted mt-1">
                Real-time server health and performance metrics
              </p>
            </div>
            <div className="text-xs text-admin-text-muted text-right">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </motion.div>

        {/* Status Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Servers',
              value: stats.total,
              icon: '🖥️',
              color: 'from-blue-500/20',
            },
            {
              label: 'Healthy',
              value: stats.healthy,
              icon: '✓',
              color: 'from-green-500/20',
              subtext: `${stats.total > 0 ? ((stats.healthy / stats.total) * 100).toFixed(0) : 0}%`,
            },
            {
              label: 'Warnings',
              value: stats.warning,
              icon: '⚠',
              color: 'from-yellow-500/20',
              subtext: stats.warning > 0 ? 'Attention needed' : 'None',
            },
            {
              label: 'Critical',
              value: stats.critical,
              icon: '●',
              color: 'from-red-500/20',
              subtext: stats.critical > 0 ? 'Action required' : 'None',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.color} border border-admin-border rounded-admin p-4`}
            >
              <p className="text-admin-text-muted text-sm mb-2">{stat.label}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-admin-text">{stat.value}</p>
                  {stat.subtext && (
                    <p className="text-xs text-admin-text-muted mt-1">{stat.subtext}</p>
                  )}
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Resource Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Average CPU Usage',
              value: stats.avgCpu.toFixed(1),
              unit: '%',
              icon: '⚡',
            },
            {
              label: 'Average Memory Usage',
              value: stats.avgMemory.toFixed(1),
              unit: '%',
              icon: '💾',
            },
            {
              label: 'Total Requests/sec',
              value: stats.totalRequests.toFixed(0),
              unit: 'req/s',
              icon: '📊',
            },
          ].map(stat => (
            <div key={stat.label} className="bg-admin-card border border-admin-border rounded-admin p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-admin-text-muted text-sm">{stat.label}</p>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="text-3xl font-bold text-admin-text">
                {stat.value}
                <span className="text-lg text-admin-text-muted ml-1">{stat.unit}</span>
              </p>
            </div>
          ))}
        </motion.div>

        {/* Servers Grid */}
        {!loading && (
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold text-admin-text mb-4">Server Details</h2>
            <ServerStatus servers={servers} />
          </motion.div>
        )}

        {/* Database Status */}
        {systemHealth && !loading && (
          <motion.div variants={itemVariants} className="bg-admin-card border border-admin-border rounded-admin p-6">
            <h2 className="text-xl font-semibold text-admin-text mb-4">Database Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-admin-text-muted text-sm mb-2">Active Connections</p>
                <p className="text-2xl font-bold text-admin-text">{systemHealth.dbConnections}</p>
              </div>
              <div>
                <p className="text-admin-text-muted text-sm mb-2">Cache Status</p>
                <p
                  className={`text-lg font-semibold ${
                    systemHealth.cacheStatus === 'healthy'
                      ? 'text-green-400'
                      : systemHealth.cacheStatus === 'warning'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }`}
                >
                  {systemHealth.cacheStatus.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-admin-text-muted text-sm mb-2">System Uptime</p>
                <p className="text-2xl font-bold text-admin-text">
                  {systemHealth.uptime ? Math.floor(systemHealth.uptime / 3600) : 0}h
                </p>
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
            <p className="text-admin-text-muted">Loading server data...</p>
          </motion.div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
