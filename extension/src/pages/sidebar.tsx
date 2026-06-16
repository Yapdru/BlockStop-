import React, { useState, useEffect } from 'react';
import { Mail, AlertCircle, CheckCircle2, TrendingUp, Settings, Search } from 'lucide-react';
import Results from '../components/Results';
import WarningBanner from '../components/WarningBanner';

interface EmailThread {
  id: string;
  from: string;
  subject: string;
  timestamp: number;
  threatLevel?: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  threatCount?: number;
  preview?: string;
}

export const SidebarPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailThread[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailThread | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Load emails from current Gmail conversation
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id!, { action: 'getEmails' }, (response) => {
          if (response?.emails) {
            setEmails(response.emails);
          }
        });
      }
    });
  }, []);

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const threatLevelColor = (level?: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-green-600';
    }
  };

  const threatLevelBg = (level?: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 space-y-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <span className="font-semibold">Gmail Security</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-blue-500 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-blue-500 rounded p-2 text-center">
            <div className="text-xl font-bold">{emails.length}</div>
            <div className="text-xs opacity-75">Total</div>
          </div>
          <div className="bg-red-500 rounded p-2 text-center">
            <div className="text-xl font-bold">{emails.filter((e) => e.threatLevel === 'critical').length}</div>
            <div className="text-xs opacity-75">Critical</div>
          </div>
          <div className="bg-green-500 rounded p-2 text-center">
            <div className="text-xl font-bold">{emails.filter((e) => e.threatLevel === 'safe').length}</div>
            <div className="text-xs opacity-75">Safe</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Email List */}
        <div className="w-1/2 overflow-y-auto border-r border-gray-200">
          {filteredEmails.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No emails found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-l-4 ${
                    selectedEmail?.id === email.id ? 'bg-blue-50 border-blue-600' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{email.from}</p>
                      <p className="text-xs text-gray-600 truncate">{email.subject}</p>
                    </div>
                    {email.threatLevel && email.threatLevel !== 'safe' && (
                      <AlertCircle className={`w-4 h-4 flex-shrink-0 ${threatLevelColor(email.threatLevel)}`} />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(email.timestamp).toLocaleDateString()}
                    </span>
                    {email.threatLevel && (
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          email.threatLevel === 'safe'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {email.threatLevel}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-1/2 overflow-y-auto p-4 space-y-4">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className={`border rounded-lg p-4 ${threatLevelBg(selectedEmail.threatLevel)}`}>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">From</p>
                    <p className="font-medium text-gray-900">{selectedEmail.from}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Subject</p>
                    <p className="font-medium text-gray-900">{selectedEmail.subject}</p>
                  </div>
                  {selectedEmail.preview && (
                    <div>
                      <p className="text-xs text-gray-600">Preview</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{selectedEmail.preview}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Threat Warning */}
              {selectedEmail.threatLevel && selectedEmail.threatLevel !== 'safe' && (
                <WarningBanner
                  level={selectedEmail.threatLevel === 'critical' ? 'critical' : 'warning'}
                  title="⚠️ Potential Threat Detected"
                  message={`This email has been flagged as ${selectedEmail.threatLevel} threat.`}
                  actions={[
                    { label: 'Report', onClick: () => {}, variant: 'danger' },
                    { label: 'Block Sender', onClick: () => {}, variant: 'secondary' },
                  ]}
                />
              )}

              {/* Safe Indicator */}
              {selectedEmail.threatLevel === 'safe' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm">Email is Safe</p>
                    <p className="text-xs text-green-800">No threats detected</p>
                  </div>
                </div>
              )}

              {/* Threat Details */}
              {selectedEmail.threatCount && selectedEmail.threatCount > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Detected Issues
                  </p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Suspicious sender domain</li>
                    <li>• Phishing indicators detected</li>
                    <li>• External links flagged</li>
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
                  Scan Full Email
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium rounded transition-colors">
                  Details
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select an email to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarPage;
