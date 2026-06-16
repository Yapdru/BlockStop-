import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw, Bell, Shield, Eye } from 'lucide-react';

interface SettingsConfig {
  enableAutoScan: boolean;
  enableNotifications: boolean;
  scanAttachments: boolean;
  checkLinks: boolean;
  blockSuspiciousSenders: boolean;
  highlightPhishingIndicators: boolean;
  enableKeyboardShortcuts: boolean;
  threatLevel: 'strict' | 'balanced' | 'permissive';
  autoReportThreats: boolean;
  dataRetentionDays: number;
}

const DEFAULT_SETTINGS: SettingsConfig = {
  enableAutoScan: true,
  enableNotifications: true,
  scanAttachments: true,
  checkLinks: true,
  blockSuspiciousSenders: false,
  highlightPhishingIndicators: true,
  enableKeyboardShortcuts: true,
  threatLevel: 'balanced',
  autoReportThreats: false,
  dataRetentionDays: 30,
};

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsConfig>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load settings from Chrome storage
    chrome.storage.sync.get(DEFAULT_SETTINGS, (result) => {
      setSettings(result as SettingsConfig);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await chrome.storage.sync.set(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  const handleToggle = (key: keyof SettingsConfig) => {
    setSettings((prev) => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key],
    }));
  };

  const handleChange = (key: keyof SettingsConfig, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* Alert */}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-600 rounded-full" />
            <p className="text-green-800 text-sm">Settings saved successfully</p>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Scanning Section */}
          <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Scanning</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Threat Level */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Threat Detection Level</label>
                <div className="space-y-2">
                  {(['strict', 'balanced', 'permissive'] as const).map((level) => (
                    <label key={level} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="threatLevel"
                        value={level}
                        checked={settings.threatLevel === level}
                        onChange={() => handleChange('threatLevel', level)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">{level}</span>
                      <span className="text-xs text-gray-500">
                        {level === 'strict'
                          ? 'Most cautious'
                          : level === 'balanced'
                            ? 'Recommended'
                            : 'More permissive'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Toggle Switches */}
              {[
                {
                  key: 'enableAutoScan' as const,
                  label: 'Auto Scan Emails',
                  description: 'Automatically scan incoming emails',
                },
                {
                  key: 'scanAttachments' as const,
                  label: 'Scan Attachments',
                  description: 'Check attachments for malware and suspicious content',
                },
                {
                  key: 'checkLinks' as const,
                  label: 'Check Links',
                  description: 'Verify URLs in emails and web pages',
                },
                {
                  key: 'blockSuspiciousSenders' as const,
                  label: 'Block Suspicious Senders',
                  description: 'Automatically block emails from known suspicious sources',
                },
                {
                  key: 'highlightPhishingIndicators' as const,
                  label: 'Highlight Phishing Indicators',
                  description: 'Mark suspicious elements in emails visually',
                },
              ].map(({ key, label, description }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-600 mt-1">{description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings[key] ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </section>

          {/* Notifications Section */}
          <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Notifications & Privacy</h2>
            </div>

            <div className="p-6 space-y-4">
              {[
                {
                  key: 'enableNotifications' as const,
                  label: 'Push Notifications',
                  description: 'Receive notifications for detected threats',
                },
                {
                  key: 'enableKeyboardShortcuts' as const,
                  label: 'Enable Keyboard Shortcuts',
                  description: 'Use keyboard shortcuts for quick scanning',
                },
                {
                  key: 'autoReportThreats' as const,
                  label: 'Auto Report Threats',
                  description: 'Automatically report detected threats to improve security',
                },
              ].map(({ key, label, description }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-600 mt-1">{description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      settings[key] ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              ))}

              {/* Data Retention */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-900 mb-2">Data Retention</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.dataRetentionDays}
                    onChange={(e) => handleChange('dataRetentionDays', parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">days</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  How long to keep scan history and threat logs
                </p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Settings
            </button>
            <button
              onClick={handleReset}
              className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-blue-900">Need Help?</p>
          <p className="text-sm text-blue-800">
            Visit our documentation or contact support for questions about these settings.
          </p>
          <div className="flex gap-3 pt-2">
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Documentation
            </a>
            <span className="text-gray-400">•</span>
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
