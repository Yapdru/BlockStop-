import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Shield, Zap } from 'lucide-react';

interface ScanResult {
  threatLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  threats: string[];
  attachmentRisks: string[];
  linkStatus: Array<{
    url: string;
    status: 'safe' | 'suspicious' | 'malicious';
    reason?: string;
  }>;
  senderReputation: {
    score: number;
    verified: boolean;
  };
  timestamp: number;
}

interface EmailScannerProps {
  email?: {
    from: string;
    subject: string;
    body: string;
    attachments?: string[];
    links?: string[];
  };
  onScan?: (result: ScanResult) => void;
}

const threatColors: Record<string, string> = {
  critical: 'bg-red-100 border-red-300 text-red-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  low: 'bg-blue-100 border-blue-300 text-blue-800',
  safe: 'bg-green-100 border-green-300 text-green-800',
};

const threatIcons: Record<string, React.ReactNode> = {
  critical: <AlertCircle className="w-5 h-5 text-red-600" />,
  high: <AlertCircle className="w-5 h-5 text-orange-600" />,
  medium: <AlertCircle className="w-5 h-5 text-yellow-600" />,
  low: <AlertCircle className="w-5 h-5 text-blue-600" />,
  safe: <CheckCircle className="w-5 h-5 text-green-600" />,
};

export const EmailScanner: React.FC<EmailScannerProps> = ({ email, onScan }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleScan = async () => {
    if (!email) return;

    setIsScanning(true);

    // Simulate scan process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result: ScanResult = {
      threatLevel: 'medium',
      threats: ['Potential phishing indicators', 'Unknown sender domain'],
      attachmentRisks: email.attachments ? ['PDF contains links', 'ZIP archive detected'] : [],
      linkStatus: email.links
        ? email.links.map((link) => ({
            url: link,
            status: Math.random() > 0.7 ? 'suspicious' : 'safe',
            reason: Math.random() > 0.7 ? 'URL redirects detected' : undefined,
          }))
        : [],
      senderReputation: {
        score: Math.floor(Math.random() * 100),
        verified: Math.random() > 0.5,
      },
      timestamp: Date.now(),
    };

    setScanResult(result);
    onScan?.(result);
    setIsScanning(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Email Scanner</h2>
      </div>

      {/* Email Preview */}
      {email && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-600">From</p>
              <p className="font-medium text-gray-900">{email.from}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Subject</p>
            <p className="font-medium text-gray-900">{email.subject}</p>
          </div>
        </div>
      )}

      {/* Scan Button */}
      <button
        onClick={handleScan}
        disabled={isScanning || !email}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Zap className="w-5 h-5" />
        {isScanning ? 'Scanning...' : 'Scan Email'}
      </button>

      {/* Scan Results */}
      {scanResult && (
        <div className={`border-2 rounded-lg p-4 space-y-4 ${threatColors[scanResult.threatLevel]}`}>
          {/* Threat Level Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {threatIcons[scanResult.threatLevel]}
              <div>
                <p className="font-semibold text-lg capitalize">{scanResult.threatLevel} Threat</p>
                <p className="text-sm opacity-75">Sender Reputation: {scanResult.senderReputation.score}%</p>
              </div>
            </div>
            {scanResult.senderReputation.verified && (
              <span className="bg-green-200 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                ✓ Verified
              </span>
            )}
          </div>

          {/* Threats */}
          {scanResult.threats.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-sm">Detected Threats:</p>
              <ul className="space-y-1">
                {scanResult.threats.map((threat, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-lg">•</span>
                    <span>{threat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attachments */}
          {scanResult.attachmentRisks.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold text-sm">Attachment Concerns:</p>
              <ul className="space-y-1">
                {scanResult.attachmentRisks.map((risk, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-lg">⚠</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Links */}
          {scanResult.linkStatus.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="font-semibold text-sm">Link Analysis:</p>
              <div className="space-y-2">
                {scanResult.linkStatus.map((link, idx) => (
                  <div
                    key={idx}
                    className="bg-white bg-opacity-50 rounded p-2 cursor-pointer hover:bg-opacity-75 transition-all"
                    onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-mono break-all max-w-xs">{link.url}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          link.status === 'safe'
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {link.status}
                      </span>
                    </div>
                    {expandedIndex === idx && link.reason && (
                      <p className="text-xs mt-2 opacity-75">{link.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!scanResult && (
        <div className="text-center py-8 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Scan an email to analyze threats and security risks</p>
        </div>
      )}
    </div>
  );
};

export default EmailScanner;
