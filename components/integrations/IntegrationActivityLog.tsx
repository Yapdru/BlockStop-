'use client';

import React, { useState, useEffect } from 'react';
import { IntegrationActivityLog as IActivityLog } from '@/types/integrations';
import axios from 'axios';

interface IntegrationActivityLogProps {
  integrationId: string;
  limit?: number;
}

const ACTION_ICONS: Record<string, string> = {
  install: '📦',
  uninstall: '🗑️',
  config_update: '⚙️',
  api_key_generated: '🔑',
  api_key_revoked: '🔐',
  webhook_created: '🪝',
  webhook_deleted: '🗑️',
  webhook_triggered: '→',
  error: '❌',
  sync: '🔄',
};

export function IntegrationActivityLog({ integrationId, limit = 50 }: IntegrationActivityLogProps) {
  const [logs, setLogs] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'install' | 'config' | 'keys' | 'webhooks'>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<IActivityLog[]>(
          `/api/integrations/${integrationId}/activity?limit=${limit}&filter=${filter}`
        );

        setLogs(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activity logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();

    // Refresh logs every 10 seconds
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [integrationId, limit, filter]);

  const getActionLabel = (action: string): string => {
    return action
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getActionIcon = (action: string): string => {
    return ACTION_ICONS[action] || '•';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Activity Log</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {['all', 'install', 'config', 'keys', 'webhooks'].map(filterOption => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption as any)}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
              filter === filterOption
                ? 'bg-primary-600 text-white'
                : 'bg-light-surface text-gray-700 hover:bg-light-border'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="bg-light-surface rounded-lg p-6 text-center">
            <p className="text-gray-600">No activity recorded</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={log.id}
              className="bg-white border border-light-border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-2xl mt-1 flex-shrink-0">
                  {getActionIcon(log.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {getActionLabel(log.action)}
                  </h4>

                  {/* Details */}
                  {Object.keys(log.details).length > 0 && (
                    <div className="mb-2 text-sm text-gray-600">
                      {Object.entries(log.details).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-gray-500">{key}:</span>
                          <span className="text-gray-900 font-medium">
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span>{log.userId}</span>
                  </div>
                </div>

                {/* Timeline Indicator */}
                <div className="flex-shrink-0">
                  {index === 0 && (
                    <div className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-2 py-1 rounded">
                      Recent
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Connector */}
              {index < logs.length - 1 && (
                <div className="ml-8 mt-4 h-6 border-l-2 border-light-border"></div>
              )}
            </div>
          ))
        )}
      </div>

      {logs.length > 0 && logs.length === limit && (
        <div className="text-center text-sm text-gray-500">
          Showing {logs.length} most recent activities
        </div>
      )}
    </div>
  );
}
