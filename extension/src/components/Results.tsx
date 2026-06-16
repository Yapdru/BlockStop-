import React, { useState } from 'react';
import { TrendingUp, Clock, AlertTriangle, CheckCircle2, Shield, Download } from 'lucide-react';

interface ThreatDetail {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ResultsProps {
  threats: ThreatDetail[];
  overallScore: number;
  timestamp?: number;
  onExport?: () => void;
  onDismiss?: (threatId: string) => void;
}

const severityStyles = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
};

const severityIcons = {
  critical: <AlertTriangle className="w-5 h-5 text-red-600" />,
  high: <AlertTriangle className="w-5 h-5 text-orange-600" />,
  medium: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  low: <Shield className="w-5 h-5 text-blue-600" />,
};

export const Results: React.FC<ResultsProps> = ({
  threats,
  overallScore,
  timestamp,
  onExport,
  onDismiss,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedThreats, setDismissedThreats] = useState<Set<string>>(new Set());

  const handleDismiss = (threatId: string) => {
    setDismissedThreats((prev) => new Set(prev).add(threatId));
    onDismiss?.(threatId);
  };

  const visibleThreats = threats.filter((t) => !dismissedThreats.has(t.id));
  const criticalCount = visibleThreats.filter((t) => t.severity === 'critical').length;
  const highCount = visibleThreats.filter((t) => t.severity === 'high').length;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Security Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-blue-600">{Math.round(overallScore)}</span>
              <span className="text-gray-500">/100</span>
            </div>
          </div>
          <div className="text-right space-y-2">
            {timestamp && (
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {formatTime(timestamp)}
              </p>
            )}
            <button
              onClick={onExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-blue-600"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-200">
          <div>
            <p className="text-xs text-gray-600">Critical</p>
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">High Risk</p>
            <p className="text-2xl font-bold text-orange-600">{highCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Items Scanned</p>
            <p className="text-2xl font-bold text-gray-900">{threats.length}</p>
          </div>
        </div>
      </div>

      {/* Threats List */}
      {visibleThreats.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Detected Threats</h3>
            <span className="ml-auto text-sm text-gray-600">
              {visibleThreats.length} threat{visibleThreats.length !== 1 ? 's' : ''}
            </span>
          </div>

          {visibleThreats.map((threat) => (
            <div
              key={threat.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                severityStyles[threat.severity]
              } border-opacity-50`}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(expandedId === threat.id ? null : threat.id)}
                className="w-full p-4 flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
              >
                <div className="flex-shrink-0">
                  {severityIcons[threat.severity]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{threat.type}</p>
                  <p className="text-xs opacity-75 truncate">{threat.description}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-1 bg-black bg-opacity-10 rounded capitalize">
                    {threat.severity}
                  </span>
                  <span className="text-lg">{expandedId === threat.id ? '▼' : '▶'}</span>
                </div>
              </button>

              {/* Details */}
              {expandedId === threat.id && (
                <div className="px-4 pb-4 border-t border-black border-opacity-10 space-y-3 pt-3">
                  <div>
                    <p className="text-xs font-semibold opacity-75">Details</p>
                    <p className="text-sm mt-1">{threat.description}</p>
                  </div>

                  {threat.metadata && Object.keys(threat.metadata).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold opacity-75">Additional Info</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {Object.entries(threat.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="opacity-75">{key}:</span>
                            <span className="font-mono">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleDismiss(threat.id)}
                      className="px-3 py-1 text-xs font-medium bg-black bg-opacity-10 rounded hover:bg-opacity-20 transition-all"
                    >
                      Dismiss
                    </button>
                    <button className="px-3 py-1 text-xs font-medium bg-black bg-opacity-10 rounded hover:bg-opacity-20 transition-all">
                      Learn More
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="font-semibold text-green-900">All Clear!</p>
          <p className="text-sm text-green-800 mt-1">No threats detected in this scan</p>
        </div>
      )}

      {/* Dismissed Count */}
      {dismissedThreats.size > 0 && (
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {dismissedThreats.size} threat{dismissedThreats.size !== 1 ? 's' : ''} dismissed
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
        <p className="text-xs text-gray-600">
          BlockStop uses advanced threat intelligence and machine learning to detect security risks. Always exercise
          caution with suspicious content.
        </p>
      </div>
    </div>
  );
};

export default Results;
