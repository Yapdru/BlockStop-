"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface SettingsState {
  emailNotifications: boolean;
  autoScan: boolean;
  threatLevel: string;
  dataRetention: number;
  theme: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    autoScan: false,
    threatLevel: "medium",
    dataRetention: 90,
    theme: "light",
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof SettingsState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleChange = (key: keyof SettingsState, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Notifications Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-light-border">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Notifications</h2>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-light-surface rounded-lg cursor-pointer hover:bg-primary-50 transition">
                <div>
                  <p className="font-semibold text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive email alerts for threats</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={() => handleToggle("emailNotifications")}
                  className="w-6 h-6 text-primary-600"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-light-surface rounded-lg cursor-pointer hover:bg-primary-50 transition">
                <div>
                  <p className="font-semibold text-gray-900">Auto-Scan Emails</p>
                  <p className="text-sm text-gray-600">Automatically scan incoming emails</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoScan}
                  onChange={() => handleToggle("autoScan")}
                  className="w-6 h-6 text-primary-600"
                />
              </label>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-light-border">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Security</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Threat Alert Level
                </label>
                <select
                  value={settings.threatLevel}
                  onChange={(e) => handleChange("threatLevel", e.target.value)}
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="low">Low - Only critical threats</option>
                  <option value="medium">Medium - Standard threats</option>
                  <option value="high">High - All potential threats</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data Retention (days)
                </label>
                <input
                  type="number"
                  value={settings.dataRetention}
                  onChange={(e) => handleChange("dataRetention", parseInt(e.target.value))}
                  min="1"
                  max="365"
                  className="w-full px-4 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Scan history will be deleted after this period
                </p>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-light-border">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Appearance</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => handleChange("theme", e.target.value)}
                className="w-full px-4 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            {saved && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold"
              >
                ✓ Settings saved
              </motion.div>
            )}
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-lg hover:shadow-lg transition"
            >
              Save Settings
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
