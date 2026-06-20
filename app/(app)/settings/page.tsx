'use client';

import { useState, useEffect } from 'react';

interface Settings {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  threatAlertLevel: 'all' | 'high' | 'critical';
  autoScanEnabled: boolean;
  autoScanInterval: 'hourly' | 'daily' | 'weekly';
  theme: 'light' | 'dark';
  language: 'en' | 'es' | 'fr' | 'hi';
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [adminSection, setAdminSection] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState(false);

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
        const data = await response.json();
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
    return <div className="text-center py-10 text-gray-400">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="text-center py-10 text-gray-400">Failed to load settings</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {saved && (
        <div className="bg-green-900/20 border border-green-700 text-green-400 p-4 rounded mb-6">
          Settings saved successfully!
        </div>
      )}

      {/* Notifications Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Notifications</h2>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
              className="mr-3"
            />
            <span>Enable all notifications</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
              className="mr-3"
            />
            <span>Email notifications</span>
          </label>

          <div>
            <label className="block text-sm font-medium mb-2">Threat Alert Level</label>
            <select
              value={settings.threatAlertLevel}
              onChange={(e) => setSettings({ ...settings, threatAlertLevel: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            >
              <option value="all">All threats</option>
              <option value="high">High and above</option>
              <option value="critical">Critical only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scanning Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Auto Scanning</h2>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoScanEnabled}
              onChange={(e) => setSettings({ ...settings, autoScanEnabled: e.target.checked })}
              className="mr-3"
            />
            <span>Enable automatic scanning</span>
          </label>

          {settings.autoScanEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2">Scan Interval</label>
              <select
                value={settings.autoScanInterval}
                onChange={(e) => setSettings({ ...settings, autoScanInterval: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <button
          onClick={() => setAdminSection(!adminSection)}
          className="text-lg font-bold mb-4 text-blue-400 hover:text-blue-300"
        >
          {adminSection ? '▼ ADMIN' : '▶ ADMIN'}
        </button>

        {adminSection && (
          <div className="space-y-4 pt-4 border-t border-slate-600">
            <p className="text-gray-400 text-sm">Enter admin passcode for instant PRO upgrade</p>

            {adminError && (
              <div className="bg-red-900/20 border border-red-700 text-red-400 p-3 rounded text-sm">
                {adminError}
              </div>
            )}

            {adminSuccess && (
              <div className="bg-green-900/20 border border-green-700 text-green-400 p-3 rounded text-sm">
                ✓ Upgraded to PRO! Refreshing...
              </div>
            )}

            <input
              type="password"
              value={adminPasscode}
              onChange={(e) => setAdminPasscode(e.target.value)}
              placeholder="Enter passcode"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAdminAccess()}
            />

            <button
              onClick={handleAdminAccess}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-bold transition"
            >
              Verify & Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveSettings}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold transition"
      >
        Save Settings
      </button>
    </div>
  );
}
