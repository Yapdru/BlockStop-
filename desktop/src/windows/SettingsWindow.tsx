/**
 * Settings Window Component
 * Application settings and preferences
 */

import React, { useState, useCallback, useEffect } from 'react';

interface AppSettings {
  general: {
    autoStartup: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
    minimizeToTray: boolean;
  };
  scanning: {
    scanOnLaunch: boolean;
    enableScheduledScans: boolean;
    scheduledTime: string;
    excludePatterns: string[];
    maxFileSize: number;
  };
  security: {
    autoQuarantine: boolean;
    confirmDelete: boolean;
    enableCloudAnalysis: boolean;
    enableSignatureUpdates: boolean;
  };
  notifications: {
    enableNotifications: boolean;
    notifyOnThreats: boolean;
    notifyOnUpdates: boolean;
    enableSound: boolean;
  };
}

const SettingsWindow: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    general: {
      autoStartup: false,
      theme: 'system',
      language: 'en-US',
      minimizeToTray: true,
    },
    scanning: {
      scanOnLaunch: false,
      enableScheduledScans: false,
      scheduledTime: '02:00',
      excludePatterns: ['node_modules', '.git', '__pycache__', 'System Volume Information'],
      maxFileSize: 100,
    },
    security: {
      autoQuarantine: false,
      confirmDelete: true,
      enableCloudAnalysis: false,
      enableSignatureUpdates: true,
    },
    notifications: {
      enableNotifications: true,
      notifyOnThreats: true,
      notifyOnUpdates: true,
      enableSound: true,
    },
  });

  const [activeTab, setActiveTab] = useState<'general' | 'scanning' | 'security' | 'notifications'>('general');
  const [isSaved, setIsSaved] = useState(false);
  const [excludePattern, setExcludePattern] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      const result = await ipcRenderer.invoke('settings:load');
      if (result.success && result.settings) {
        setSettings((prev) => ({
          ...prev,
          ...result.settings,
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  const handleSaveSettings = useCallback(async () => {
    try {
      const ipcRenderer = window.electron?.ipcRenderer;
      if (!ipcRenderer) return;

      const result = await ipcRenderer.invoke('settings:save', settings);
      if (result.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const handleAddExcludePattern = useCallback(() => {
    if (excludePattern.trim()) {
      setSettings((prev) => ({
        ...prev,
        scanning: {
          ...prev.scanning,
          excludePatterns: [...prev.scanning.excludePatterns, excludePattern],
        },
      }));
      setExcludePattern('');
    }
  }, [excludePattern]);

  const handleRemoveExcludePattern = useCallback((pattern: string) => {
    setSettings((prev) => ({
      ...prev,
      scanning: {
        ...prev.scanning,
        excludePatterns: prev.scanning.excludePatterns.filter((p) => p !== pattern),
      },
    }));
  }, []);

  const updateSetting = <K extends keyof AppSettings>(
    section: K,
    key: keyof AppSettings[K],
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  return (
    <div className="settings-window">
      <div className="window-content">
        <header className="window-header">
          <h1>Settings</h1>
          <p>Configure BlockStop preferences</p>
        </header>

        <div className="settings-layout">
          {/* Tab Navigation */}
          <div className="settings-tabs">
            <button
              className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`tab-button ${activeTab === 'scanning' ? 'active' : ''}`}
              onClick={() => setActiveTab('scanning')}
            >
              Scanning
            </button>
            <button
              className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button
              className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
          </div>

          {/* Tab Content */}
          <div className="settings-content">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="settings-section">
                <h2>General Settings</h2>

                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.general.autoStartup}
                      onChange={(e) => updateSetting('general', 'autoStartup', e.target.checked)}
                    />
                    <span>Launch BlockStop on system startup</span>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.general.minimizeToTray}
                      onChange={(e) => updateSetting('general', 'minimizeToTray', e.target.checked)}
                    />
                    <span>Minimize to system tray when closing</span>
                  </label>
                </div>

                <div className="setting-item">
                  <label htmlFor="theme">Theme</label>
                  <select
                    id="theme"
                    className="setting-select"
                    value={settings.general.theme}
                    onChange={(e) => updateSetting('general', 'theme', e.target.value as any)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>

                <div className="setting-item">
                  <label htmlFor="language">Language</label>
                  <select
                    id="language"
                    className="setting-select"
                    value={settings.general.language}
                    onChange={(e) => updateSetting('general', 'language', e.target.value)}
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="zh-CN">Chinese (Simplified)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Scanning Settings */}
            {activeTab === 'scanning' && (
              <div className="settings-section">
                <h2>Scanning Settings</h2>

                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.scanning.scanOnLaunch}
                      onChange={(e) => updateSetting('scanning', 'scanOnLaunch', e.target.checked)}
                    />
                    <span>Perform quick scan on application launch</span>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.scanning.enableScheduledScans}
                      onChange={(e) => updateSetting('scanning', 'enableScheduledScans', e.target.checked)}
                    />
                    <span>Enable scheduled scans</span>
                  </label>
                </div>

                {settings.scanning.enableScheduledScans && (
                  <div className="setting-item indented">
                    <label htmlFor="scheduledTime">Scheduled scan time</label>
                    <input
                      id="scheduledTime"
                      type="time"
                      className="setting-input"
                      value={settings.scanning.scheduledTime}
                      onChange={(e) => updateSetting('scanning', 'scheduledTime', e.target.value)}
                    />
                  </div>
                )}

                <div className="setting-item">
                  <label htmlFor="maxFileSize">Maximum file size to scan (MB)</label>
                  <input
                    id="maxFileSize"
                    type="number"
                    min="1"
                    max="1000"
                    className="setting-input"
                    value={settings.scanning.maxFileSize}
                    onChange={(e) => updateSetting('scanning', 'maxFileSize', parseInt(e.target.value))}
                  />
                </div>

                <div className="setting-item">
                  <label>Exclude patterns from scanning</label>
                  <div className="pattern-input-group">
                    <input
                      type="text"
                      className="setting-input"
                      placeholder="Enter folder or file pattern"
                      value={excludePattern}
                      onChange={(e) => setExcludePattern(e.target.value)}
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={handleAddExcludePattern}
                    >
                      Add
                    </button>
                  </div>
                  <div className="pattern-list">
                    {settings.scanning.excludePatterns.map((pattern, idx) => (
                      <div key={idx} className="pattern-item">
                        <span>{pattern}</span>
                        <button
                          className="btn-remove"
                          onClick={() => handleRemoveExcludePattern(pattern)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="settings-section">
                <h2>Security Settings</h2>

                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.security.autoQuarantine}
                      onChange={(e) => updateSetting('security', 'autoQuarantine', e.target.checked)}
                    />
                    <span>Automatically quarantine detected threats</span>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.security.confirmDelete}
                      onChange={(e) => updateSetting('security', 'confirmDelete', e.target.checked)}
                    />
                    <span>Ask for confirmation before deleting files</span>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.security.enableCloudAnalysis}
                      onChange={(e) => updateSetting('security', 'enableCloudAnalysis', e.target.checked)}
                    />
                    <span>Enable cloud-based threat analysis</span>
                  </label>
                  <small className="setting-note">
                    Sends file metadata to our security servers for advanced analysis
                  </small>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.security.enableSignatureUpdates}
                      onChange={(e) => updateSetting('security', 'enableSignatureUpdates', e.target.checked)}
                    />
                    <span>Automatically update threat signatures</span>
                  </label>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2>Notification Settings</h2>

                <div className="setting-item">
                  <label className="setting-label">
                    <input
                      type="checkbox"
                      checked={settings.notifications.enableNotifications}
                      onChange={(e) => updateSetting('notifications', 'enableNotifications', e.target.checked)}
                    />
                    <span>Enable all notifications</span>
                  </label>
                </div>

                {settings.notifications.enableNotifications && (
                  <>
                    <div className="setting-item indented">
                      <label className="setting-label">
                        <input
                          type="checkbox"
                          checked={settings.notifications.notifyOnThreats}
                          onChange={(e) => updateSetting('notifications', 'notifyOnThreats', e.target.checked)}
                        />
                        <span>Notify when threats are detected</span>
                      </label>
                    </div>

                    <div className="setting-item indented">
                      <label className="setting-label">
                        <input
                          type="checkbox"
                          checked={settings.notifications.notifyOnUpdates}
                          onChange={(e) => updateSetting('notifications', 'notifyOnUpdates', e.target.checked)}
                        />
                        <span>Notify about application updates</span>
                      </label>
                    </div>

                    <div className="setting-item indented">
                      <label className="setting-label">
                        <input
                          type="checkbox"
                          checked={settings.notifications.enableSound}
                          onChange={(e) => updateSetting('notifications', 'enableSound', e.target.checked)}
                        />
                        <span>Play sound with notifications</span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button className="btn btn-primary" onClick={handleSaveSettings}>
            {isSaved ? 'Settings Saved ✓' : 'Save Settings'}
          </button>
          <button className="btn btn-secondary" onClick={loadSettings}>
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsWindow;
