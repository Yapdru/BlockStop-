import React, { useState } from 'react';
import { Search, Loader, Copy, ExternalLink } from 'lucide-react';

interface QuickScanProps {
  onScan?: (content: string) => void;
  loading?: boolean;
  result?: {
    isSafe: boolean;
    score: number;
    details: string;
  };
}

export const QuickScan: React.FC<QuickScanProps> = ({ onScan, loading = false, result }) => {
  const [scanInput, setScanInput] = useState('');
  const [scanType, setScanType] = useState<'url' | 'email' | 'text'>('url');
  const [copied, setCopied] = useState(false);

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    onScan?.(scanInput);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scanInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleScan();
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Quick Scan</h3>
      </div>

      {/* Scan Type Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['url', 'email', 'text'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setScanType(type)}
            className={`px-4 py-2 font-medium text-sm capitalize transition-colors ${
              scanType === type
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">
          {scanType === 'url' ? 'Enter URL' : scanType === 'email' ? 'Enter Email Address' : 'Enter Text'}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              scanType === 'url'
                ? 'https://example.com'
                : scanType === 'email'
                  ? 'sender@example.com'
                  : 'Enter text to scan...'
            }
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={loading}
          />
          <button
            onClick={handleCopy}
            disabled={!scanInput.trim()}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scan Button */}
      <button
        onClick={handleScan}
        disabled={loading || !scanInput.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Scan Now
          </>
        )}
      </button>

      {/* Result Display */}
      {result && (
        <div
          className={`rounded-lg p-4 space-y-3 ${
            result.isSafe
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-2 font-semibold text-sm ${
                result.isSafe ? 'text-green-800' : 'text-red-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${result.isSafe ? 'bg-green-600' : 'bg-red-600'}`} />
              {result.isSafe ? 'Safe' : 'Threat Detected'}
            </span>
            <button
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="View full details"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Score Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-gray-700">Safety Score</span>
              <span className={result.isSafe ? 'text-green-700' : 'text-red-700'}>
                {Math.round(result.score * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${result.isSafe ? 'bg-green-600' : 'bg-red-600'}`}
                style={{ width: `${result.score * 100}%` }}
              />
            </div>
          </div>

          {/* Details */}
          <p className="text-sm text-gray-700">{result.details}</p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center">
        💡 Tip: Use keyboard shortcut <kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl+Shift+B</kbd> for
        quick scan
      </p>
    </div>
  );
};

export default QuickScan;
