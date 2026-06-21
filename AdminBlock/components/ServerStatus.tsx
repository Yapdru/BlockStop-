'use client';

import { motion } from 'framer-motion';
import { ServerStatus as ServerStatusType } from '@/lib/NetAdmin';

interface ServerStatusProps {
  servers: ServerStatusType[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return { bg: 'bg-green-500/10', text: 'text-green-400', icon: '●' };
    case 'warning':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: '⚠' };
    case 'critical':
      return { bg: 'bg-red-500/10', text: 'text-red-400', icon: '●' };
    default:
      return { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: '?' };
  }
};

const MetricBar = ({ label, value, max = 100 }: { label: string; value: number; max?: number }) => {
  const percentage = (value / max) * 100;
  const barColor =
    percentage < 60 ? 'bg-green-500' : percentage < 80 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-admin-text-muted">{label}</span>
        <span className="text-admin-text font-semibold">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-admin-border/50 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export function ServerStatus({ servers }: ServerStatusProps) {
  if (servers.length === 0) {
    return (
      <div className="text-center text-admin-text-muted py-8">
        No servers available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {servers.map((server, index) => {
        const statusConfig = getStatusColor(server.status);

        return (
          <motion.div
            key={server.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-admin-card border border-admin-border rounded-admin p-4 ${statusConfig.bg}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-lg ${statusConfig.text}`}>{statusConfig.icon}</span>
                  <h3 className="text-admin-text font-semibold text-lg">{server.name}</h3>
                </div>
                <p className="text-admin-text-muted text-sm">ID: {server.id.slice(0, 8)}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded font-semibold ${statusConfig.text} bg-admin-bg/50`}
              >
                {server.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <MetricBar label="CPU Usage" value={server.cpuUsage} />
              <MetricBar label="Memory Usage" value={server.memoryUsage} />
              <MetricBar label="Cache Hit Rate" value={server.cacheHitRate} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-admin-border/50">
              <div>
                <p className="text-admin-text-muted text-xs mb-1">Requests/sec</p>
                <p className="text-admin-text font-bold text-sm">{server.requestsPerSecond.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-admin-text-muted text-xs mb-1">Latency</p>
                <p className="text-admin-text font-bold text-sm">{server.latencyMs.toFixed(0)}ms</p>
              </div>
              <div>
                <p className="text-admin-text-muted text-xs mb-1">DB Connections</p>
                <p className="text-admin-text font-bold text-sm">{server.dbConnections}</p>
              </div>
              <div>
                <p className="text-admin-text-muted text-xs mb-1">Uptime</p>
                <p className="text-admin-text font-bold text-sm">
                  {Math.floor(server.uptime / 3600)}h
                </p>
              </div>
            </div>

            <div className="mt-3 text-xs text-admin-text-muted">
              Last update: {new Date(server.lastUpdate).toLocaleTimeString()}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
