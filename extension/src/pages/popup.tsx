import React, { useState, useEffect } from 'react';
import { Shield, Settings, History, LogOut } from 'lucide-react';
import EmailScanner from '../components/EmailScanner';
import QuickScan from '../components/QuickScan';
import WarningBanner from '../components/WarningBanner';

type TabType = 'scan' | 'quick' | 'history';

export const PopupPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('scan');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    // Check authentication status
    chrome.storage.sync.get(['userId', 'email'], (result) => {
      if (result.userId) {
        setIsLoggedIn(true);
        setUserEmail(result.email || '');
      }
    });
  }, []);

  const handleLogout = () => {
    chrome.storage.sync.remove(['userId', 'email']);
    setIsLoggedIn(false);
  };

  const handleOpenSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  if (!isLoggedIn) {
    return (
      <div className="w-96 p-6 space-y-4">
        {/* Logo */}
        <div className="text-center space-y-2 py-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">BlockStop</span>
          </div>
          <p className="text-sm text-gray-600">Email & Content Security</p>
        </div>

        {/* Login Message */}
        <WarningBanner
          level="info"
          title="Sign In Required"
          message="Please sign in to use BlockStop security features"
          dismissible={false}
        />

        {/* Sign In Button */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          Sign In
        </button>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500">
          BlockStop protects your email and browsing from threats
        </p>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <div>
              <p className="font-semibold text-sm">BlockStop</p>
              <p className="text-xs opacity-90">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleOpenSettings}
            className="p-2 hover:bg-blue-500 rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {[
          { id: 'scan', label: 'Scan', icon: Shield },
          { id: 'quick', label: 'Quick Scan', icon: LogOut },
          { id: 'history', label: 'History', icon: History },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TabType)}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'scan' && <EmailScanner onScan={setScanResult} />}

        {activeTab === 'quick' && (
          <div className="space-y-4">
            <QuickScan
              result={scanResult}
              onScan={(content) => {
                // Trigger scan
              }}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Scans</h3>
            {/* Placeholder for scan history */}
            <div className="text-center py-8 text-gray-500">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No scans yet</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-3 flex gap-2 justify-between text-xs">
        <button className="text-blue-600 hover:text-blue-700">Help</button>
        <button className="text-blue-600 hover:text-blue-700">Privacy</button>
        <button onClick={handleLogout} className="text-red-600 hover:text-red-700">
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default PopupPage;
