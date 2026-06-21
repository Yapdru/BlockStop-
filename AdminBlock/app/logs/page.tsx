'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AdminLayout } from '@/components/AdminLayout';
import { getNetAdmin, ActivityLog } from '@/lib/NetAdmin';

type LogFilter = 'all' | 'user' | 'payment' | 'error' | 'security' | 'system';
type SeverityFilter = 'all' | 'info' | 'warning' | 'error';

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [typeFilter, setTypeFilter] = useState<LogFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const netAdmin = getNetAdmin();

      try {
        const data = await netAdmin.getActivityLogs(200);
        setLogs(data);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    // Refresh every 3 seconds
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = logs;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(log => log.type === typeFilter);
    }

    // Filter by severity
    if (severityFilter !== 'all') {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(
        log =>
          log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, typeFilter, severityFilter, searchTerm]);

  const getLogTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      user: '👤',
      payment: '💳',
      error: '❌',
      security: '🔒',
      system: '⚙️',
    };
    return icons[type] || '📝';
  };

  const getLogTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      user: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      payment: 'bg-green-500/10 text-green-400 border-green-500/30',
      error: 'bg-red-500/10 text-red-400 border-red-500/30',
      security: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      system: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      info: 'text-blue-400',
      warning: 'text-yellow-400',
      error: 'text-red-400',
    };
    return colors[severity] || 'text-gray-400';
  };

  const stats = {
    total: logs.length,
    user: logs.filter(l => l.type === 'user').length,
    payment: logs.filter(l => l.type === 'payment').length,
    error: logs.filter(l => l.type === 'error').length,
    security: logs.filter(l => l.type === 'security').length,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AdminLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-admin-text mb-2">Activity Logs</h1>
          <p className="text-admin-text-muted">
            Real-time monitoring of all system events and user activities
          </p>
        </motion.div>

        {/* Log Type Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Logs', value: stats.total, icon: '📊' },
            { label: 'User Events', value: stats.user, icon: '👤' },
            { label: 'Payments', value: stats.payment, icon: '💳' },
            { label: 'Errors', value: stats.error, icon: '❌' },
            { label: 'Security', value: stats.security, icon: '🔒' },
          ].map(stat => (
            <div key={stat.label} className="bg-admin-card border border-admin-border rounded-admin p-3">
              <p className="text-admin-text-muted text-xs mb-1">{stat.label}</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-admin-text">{stat.value}</p>
                <span className="text-lg">{stat.icon}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search logs by description or user ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-admin-card border border-admin-border rounded-admin px-4 py-2 text-admin-text placeholder-admin-text-muted focus:outline-none focus:border-admin-accent"
          />

          {/* Type and Severity Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'user', 'payment', 'error', 'security', 'system'] as LogFilter[]).map(
                type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1 rounded-admin text-xs font-medium transition-colors ${
                      typeFilter === type
                        ? 'bg-admin-accent text-white'
                        : 'bg-admin-card border border-admin-border text-admin-text hover:border-admin-accent/50'
                    }`}
                  >
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                )
              )}
            </div>

            <div className="flex gap-2">
              {(['all', 'info', 'warning', 'error'] as SeverityFilter[]).map(severity => (
                <button
                  key={severity}
                  onClick={() => setSeverityFilter(severity)}
                  className={`px-3 py-1 rounded-admin text-xs font-medium transition-colors ${
                    severityFilter === severity
                      ? 'bg-admin-accent text-white'
                      : 'bg-admin-card border border-admin-border text-admin-text hover:border-admin-accent/50'
                  }`}
                >
                  {severity === 'all' ? 'All Severities' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Logs List */}
        {!loading && (
          <motion.div variants={itemVariants} className="space-y-2">
            {filteredLogs.length > 0 ? (
              <div>
                <p className="text-sm text-admin-text-muted mb-3">
                  Showing {filteredLogs.length} of {logs.length} logs
                </p>
                <div className="space-y-2 max-h-[800px] overflow-y-auto">
                  {filteredLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() =>
                        setExpandedLog(expandedLog === log.id ? null : log.id)
                      }
                      className="cursor-pointer"
                    >
                      <div
                        className={`bg-admin-card border border-admin-border rounded-admin p-4 hover:border-admin-accent/50 transition-colors ${
                          getLogTypeColor(log.type)
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">
                                {getLogTypeIcon(log.type)}
                              </span>
                              <p className="text-admin-text font-semibold text-sm">
                                {log.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              <span
                                className={`inline-block text-xs px-2 py-1 rounded border ${getLogTypeColor(log.type)}`}
                              >
                                {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                              </span>
                              <span
                                className={`inline-block text-xs px-2 py-1 rounded border ${getSeverityColor(log.severity)} border-current/30`}
                              >
                                {log.severity.toUpperCase()}
                              </span>
                              {log.userId && (
                                <span className="text-xs text-admin-text-muted">
                                  User: {log.userId.slice(0, 8)}
                                </span>
                              )}
                              <span className="text-xs text-admin-text-muted">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedLog === log.id && log.metadata && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-admin-border/50"
                          >
                            <p className="text-xs text-admin-text-muted font-semibold mb-2">
                              Metadata:
                            </p>
                            <pre className="text-xs bg-admin-bg/50 rounded p-2 overflow-auto max-h-40 text-admin-text-muted">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-admin-text-muted py-8">
                {searchTerm || typeFilter !== 'all' || severityFilter !== 'all'
                  ? 'No logs match your filters'
                  : 'No activity logs found'}
              </div>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            variants={itemVariants}
            className="bg-admin-card border border-admin-border rounded-admin p-8 text-center"
          >
            <div className="inline-block animate-spin text-3xl mb-4">⚙️</div>
            <p className="text-admin-text-muted">Loading logs...</p>
          </motion.div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
