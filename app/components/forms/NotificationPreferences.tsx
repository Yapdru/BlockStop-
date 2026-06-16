'use client';

import React, { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export const NotificationPreferences: React.FC<{ onSubmit?: (data: any) => Promise<void> }> = ({ onSubmit }) => {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'threats',
      label: 'Threat Alerts',
      description: 'Receive alerts when threats are detected',
      enabled: true,
      channels: { email: true, push: true, sms: false },
    },
    {
      id: 'scans',
      label: 'Scan Completion',
      description: 'Get notified when scans complete',
      enabled: true,
      channels: { email: true, push: false, sms: false },
    },
    {
      id: 'updates',
      label: 'System Updates',
      description: 'Receive notifications about security updates',
      enabled: true,
      channels: { email: true, push: true, sms: false },
    },
    {
      id: 'suspicious',
      label: 'Suspicious Activity',
      description: 'Alert on suspicious account activity',
      enabled: true,
      channels: { email: true, push: true, sms: true },
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleToggle = (id: string) => {
    setSettings(settings.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleChannelToggle = (id: string, channel: 'email' | 'push' | 'sms') => {
    setSettings(settings.map(s =>
      s.id === id ? { ...s, channels: { ...s.channels, [channel]: !s.channels[channel] } } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      if (onSubmit) {
        await onSubmit(settings);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">Preferences saved successfully!</p>
        </div>
      )}

      <div className="space-y-4">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={setting.enabled}
                      onChange={() => handleToggle(setting.id)}
                      className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded accent-blue-600"
                      aria-label={`Enable ${setting.label}`}
                    />
                    {setting.label}
                  </label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{setting.description}</p>
              </div>
            </div>

            {/* Channels */}
            {setting.enabled && (
              <div className="ml-7 space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Notification channels:</p>
                <div className="space-y-2">
                  {['email', 'push', 'sms'].map((channel) => (
                    <label key={channel} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={setting.channels[channel as keyof typeof setting.channels]}
                        onChange={() => handleChannelToggle(setting.id, channel as 'email' | 'push' | 'sms')}
                        className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded accent-blue-600"
                        aria-label={`Send ${setting.label} via ${channel}`}
                      />
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Preferences'
        )}
      </button>
    </form>
  );
};
