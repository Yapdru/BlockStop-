'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Tabs } from '@/components';
import { a11y } from '@/lib/a11y';

interface Settings {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  threatAlertLevel: 'all' | 'high' | 'critical';
  autoScanEnabled: boolean;
  autoScanInterval: 'hourly' | 'daily' | 'weekly';
  theme: 'light' | 'dark';
  language: 'en' | 'es' | 'fr' | 'hi';
}

interface SettingOption {
  id: string;
  label: string;
  content: React.ReactNode;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await fetch('/api/settings', {
          headers: { 'x-user-id': userId || '' }
        });
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleAdminAccess = async () => {
    setAdminError('');
    setAdminSuccess(false);

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/settings/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify({ passcode: adminPasscode })
      });

      if (response.ok) {
        setAdminSuccess(true);
        setAdminPasscode('');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setAdminError('Invalid passcode');
      }
    } catch (error) {
      setAdminError('Failed to verify passcode');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-neutral-600">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-neutral-600">Failed to load settings</div>
      </div>
    );
  }

  const tabs: SettingOption[] = [
    {
      id: 'notifications',
      label: '🔔 Notifications',
      content: (
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={e => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                className="w-5 h-5"
              />
              <div>
                <p className="font-medium text-neutral-900">All Notifications</p>
                <p className="text-xs text-neutral-600">Receive all security alerts</p>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={e => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-5 h-5"
              />
              <div>
                <p className="font-medium text-neutral-900">Email Alerts</p>
                <p className="text-xs text-neutral-600">Get alerts via email</p>
              </div>
            </label>
          </div>

          <div>
            <label className="block font-medium text-neutral-900 mb-3">Alert Threshold</label>
            <select
              value={settings.threatAlertLevel}
              onChange={e => setSettings({ ...settings, threatAlertLevel: e.target.value as any })}
              className="input w-full"
            >
              <option value="all">📊 All Threats</option>
              <option value="high">⚠️ High & Critical</option>
              <option value="critical">🔴 Critical Only</option>
            </select>
          </div>
        </div>
      )
    },
    {
      id: 'scanning',
      label: '🔍 Scanning',
      content: (
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoScanEnabled}
                onChange={e => setSettings({ ...settings, autoScanEnabled: e.target.checked })}
                className="w-5 h-5"
              />
              <div>
                <p className="font-medium text-neutral-900">Auto Scanning</p>
                <p className="text-xs text-neutral-600">Automatically scan files and emails</p>
              </div>
            </label>
          </div>

          {settings.autoScanEnabled && (
            <div>
              <label className="block font-medium text-neutral-900 mb-3">Scan Frequency</label>
              <select
                value={settings.autoScanInterval}
                onChange={e => setSettings({ ...settings, autoScanInterval: e.target.value as any })}
                className="input w-full"
              >
                <option value="hourly">⏱️ Hourly</option>
                <option value="daily">📅 Daily</option>
                <option value="weekly">📆 Weekly</option>
              </select>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'preferences',
      label: '⚙️ Preferences',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block font-medium text-neutral-900 mb-3">Theme</label>
            <select
              value={settings.theme}
              onChange={e => setSettings({ ...settings, theme: e.target.value as any })}
              className="input w-full"
            >
              <option value="light">☀️ Light Mode</option>
              <option value="dark">🌙 Dark Mode</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-neutral-900 mb-3">Language</label>
            <select
              value={settings.language}
              onChange={e => setSettings({ ...settings, language: e.target.value as any })}
              className="input w-full"
            >
              <option value="en">🇬🇧 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="hi">🇮🇳 हिन्दी</option>
            </select>
          </div>
        </div>
      )
    },
    {
      id: 'admin',
      label: '🔐 Admin',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">Enter admin passcode for PRO upgrade</p>

          {adminError && (
            <div className="bg-danger/10 border border-danger/20 text-danger p-3 rounded text-sm">
              ❌ {adminError}
            </div>
          )}

          {adminSuccess && (
            <div className="bg-success/10 border border-success/20 text-success p-3 rounded text-sm">
              ✅ Upgraded! Refreshing...
            </div>
          )}

          <input
            type="password"
            value={adminPasscode}
            onChange={e => setAdminPasscode(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleAdminAccess()}
            placeholder="Enter passcode"
            className="input w-full"
          />

          <Button
            onClick={handleAdminAccess}
            variant="primary"
            className="w-full"
          >
            Verify Passcode
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
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

      <main id="main-content" className="min-h-screen bg-neutral-50 pb-24 md:pb-0" tabIndex={-1}>
        <div className="container-max py-8">
          <h1 className="text-h2 font-bold text-neutral-900 mb-2">Settings</h1>
          <p className="text-neutral-600 mb-8">Customize your security experience</p>

          {saved && (
            <div role="status" aria-live="polite" aria-atomic="true" className="bg-success/10 border border-success/20 text-success p-4 rounded-lg mb-6">
              <span aria-hidden="true">✅</span>
              {' '}Settings saved successfully!
            </div>
          )}

        <Card padding="lg">
          <Tabs tabs={tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            content: <div className="pt-4">{tab.content}</div>
          }))} />
        </Card>

        <div className="mt-6 flex gap-3">
          <Button variant="primary" onClick={handleSaveSettings} className="flex-1">
            💾 Save Settings
          </Button>
          <Button variant="secondary" className="flex-1">
            ⟲ Reset to Defaults
          </Button>
        </div>
      </div>
    </main>
  );
}
