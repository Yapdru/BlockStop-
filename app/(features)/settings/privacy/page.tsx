'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { FormField } from '@/components/settings/FormField';

interface PrivacySettings {
  dataRetentionDays: number;
  analyticsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export default function PrivacySettings() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [dataRetentionDays, setDataRetentionDays] = useState(90);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      setError('');
      const response = await fetch('/api/settings/privacy');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setDataRetentionDays(data.data.dataRetentionDays);
        setAnalyticsEnabled(data.data.analyticsEnabled);
        setEmailNotificationsEnabled(data.data.emailNotificationsEnabled);
      }
    } catch (err) {
      setError('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (dataRetentionDays < 1 || dataRetentionDays > 365) {
      setError('Data retention must be between 1 and 365 days');
      return;
    }

    setSaving(true);
    try {
      setError('');
      const response = await fetch('/api/settings/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataRetentionDays,
          analyticsEnabled,
          emailNotificationsEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }

      setSuccess('Privacy settings updated successfully');
      setSettings(data.data);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50 flex items-center justify-center">
        <div className="animate-spin text-primary-600">⏳</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/settings" className="text-primary-600 hover:text-primary-700">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">🔐 Privacy Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
            >
              ✓ {success}
            </motion.div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Data Retention */}
            <SettingsSection
              title="Data Retention"
              description="How long we keep your scan history and data"
              icon="📅"
            >
              <FormField
                label="Retention Period (days)"
                description="Your scan history will be automatically deleted after this period"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={dataRetentionDays}
                    onChange={(e) => setDataRetentionDays(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-2xl font-bold text-primary-600 min-w-16 text-right">
                    {dataRetentionDays}
                  </span>
                </div>
              </FormField>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Deleted data cannot be recovered. This applies to email scans,
                  file scans, and all associated metadata.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {[30, 90, 180, 365].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDataRetentionDays(days)}
                    className={`px-3 py-2 rounded border transition ${
                      dataRetentionDays === days
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white border-light-border hover:border-primary-400'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </SettingsSection>

            {/* Analytics */}
            <SettingsSection
              title="Analytics & Usage Tracking"
              description="Help us improve by sharing anonymized usage data"
              icon="📊"
            >
              <label className="flex items-center justify-between p-4 bg-light-surface rounded-lg cursor-pointer hover:bg-primary-50 transition">
                <div>
                  <p className="font-semibold text-gray-900">Analytics Tracking</p>
                  <p className="text-sm text-gray-600">
                    Share anonymized usage data to help us improve your experience
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="w-6 h-6 text-primary-600 cursor-pointer"
                />
              </label>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-700 mb-2">
                  <strong>What we collect:</strong>
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Feature usage (email scanner, file scanner, etc.)</li>
                  <li>General scan statistics (not scan contents)</li>
                  <li>App performance metrics</li>
                  <li>Device type (desktop, mobile, tablet)</li>
                </ul>
                <p className="text-xs text-gray-700 mt-3 mb-2">
                  <strong>What we don't collect:</strong>
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>Email contents or attachments</li>
                  <li>File contents</li>
                  <li>Personal information</li>
                  <li>IP addresses or location data</li>
                </ul>
              </div>
            </SettingsSection>

            {/* Email Notifications */}
            <SettingsSection
              title="Email Notifications"
              description="Receive important alerts about your account"
              icon="📧"
            >
              <label className="flex items-center justify-between p-4 bg-light-surface rounded-lg cursor-pointer hover:bg-primary-50 transition">
                <div>
                  <p className="font-semibold text-gray-900">Threat Alerts</p>
                  <p className="text-sm text-gray-600">
                    Get notified when threats are detected in your scans
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={emailNotificationsEnabled}
                  onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                  className="w-6 h-6 text-primary-600 cursor-pointer"
                />
              </label>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-700 mb-2">
                  <strong>You will receive emails for:</strong>
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>High-risk threats detected</li>
                  <li>Malware found in file scans</li>
                  <li>Suspicious email patterns</li>
                  <li>Security alerts</li>
                </ul>
              </div>
            </SettingsSection>

            {/* Save Button */}
            <div className="flex justify-end gap-4 pt-6 border-t border-light-border">
              <Link
                href="/settings"
                className="px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
