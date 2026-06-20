'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Input } from '@/components';

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
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading privacy settings...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4 flex items-center gap-4">
          <Link href="/settings" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Back
          </Link>
          <h1 className="text-h3 font-bold text-neutral-900">🔐 Privacy Settings</h1>
        </div>
      </header>

      <div className="container-max py-8">
        {/* Messages */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-lg animate-slideDown mb-6">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-success/10 border border-success/20 text-success p-4 rounded-lg animate-slideDown mb-6">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Data Retention */}
          <Card padding="lg">
            <div className="mb-6">
              <h2 className="text-h4 font-bold text-neutral-900">📅 Data Retention</h2>
              <p className="text-sm text-neutral-600 mt-1">How long we keep your scan history</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-neutral-900">
                    Retention Period
                  </label>
                  <span className="text-2xl font-bold text-primary-500">{dataRetentionDays}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="365"
                  value={dataRetentionDays}
                  onChange={(e) => setDataRetentionDays(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-200 rounded-lg cursor-pointer appearance-none accent-primary-500"
                />
                <div className="flex justify-between text-xs text-neutral-600 mt-2">
                  <span>1 day</span>
                  <span>365 days</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[30, 90, 180, 365].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDataRetentionDays(days)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                      dataRetentionDays === days
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-neutral-700">
                  <strong>Note:</strong> Deleted data cannot be recovered. This applies to email scans, file scans, and all metadata.
                </p>
              </div>
            </div>
          </Card>

          {/* Analytics */}
          <Card padding="lg">
            <div className="mb-6">
              <h2 className="text-h4 font-bold text-neutral-900">📊 Analytics & Usage</h2>
              <p className="text-sm text-neutral-600 mt-1">Help us improve by sharing anonymized data</p>
            </div>

            <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-primary-50 transition border border-neutral-200">
              <div>
                <p className="font-medium text-neutral-900">Analytics Tracking</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Share anonymized usage data
                </p>
              </div>

              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                className="w-5 h-5 text-primary-500 cursor-pointer"
              />
            </label>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <p className="text-xs font-semibold text-neutral-900 mb-3">We collect:</p>
                <ul className="text-xs text-neutral-700 space-y-1">
                  <li>✓ Feature usage patterns</li>
                  <li>✓ Scan statistics</li>
                  <li>✓ App performance</li>
                  <li>✓ Device type</li>
                </ul>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <p className="text-xs font-semibold text-neutral-900 mb-3">We don&apos;t collect:</p>
                <ul className="text-xs text-neutral-700 space-y-1">
                  <li>✗ Email contents</li>
                  <li>✗ File contents</li>
                  <li>✗ Personal info</li>
                  <li>✗ IP/location</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Email Notifications */}
          <Card padding="lg">
            <div className="mb-6">
              <h2 className="text-h4 font-bold text-neutral-900">📧 Email Notifications</h2>
              <p className="text-sm text-neutral-600 mt-1">Security alerts about your account</p>
            </div>

            <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-primary-50 transition border border-neutral-200">
              <div>
                <p className="font-medium text-neutral-900">Threat Alerts</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Get notified of detected threats
                </p>
              </div>

              <input
                type="checkbox"
                checked={emailNotificationsEnabled}
                onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                className="w-5 h-5 text-primary-500 cursor-pointer"
              />
            </label>

            <div className="mt-4 bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <p className="text-xs font-semibold text-neutral-900 mb-3">You&apos;ll receive alerts for:</p>
              <ul className="text-xs text-neutral-700 space-y-1">
                <li>⚠️ High-risk threats detected</li>
                <li>⚠️ Malware in file scans</li>
                <li>⚠️ Suspicious email patterns</li>
                <li>⚠️ Security incidents</li>
              </ul>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <Link href="/settings" className="flex-1">
              <Button variant="secondary" className="w-full">
                ← Cancel
              </Button>
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
