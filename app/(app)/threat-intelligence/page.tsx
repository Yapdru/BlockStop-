// Phase 28.1 - Threat Intelligence Dashboard
'use client';

import { useEffect, useState } from 'react';
import { threatIntelligenceEngine, ThreatScore } from '@/lib/ai/threat-intelligence';
import { Card } from '@/components/Card';

interface IndicatorAnalysis {
  value: string;
  type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
  score: ThreatScore;
}

export default function ThreatIntelligencePage() {
  const [indicators, setIndicators] = useState<IndicatorAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [stats, setStats] = useState({
    totalIndicators: 0,
    totalPatterns: 0,
    totalFeeds: 0,
    criticalThreats: 0,
  });

  useEffect(() => {
    // Load threat intelligence statistics on mount
    const threatStats = threatIntelligenceEngine.getStatistics();
    setStats(threatStats);
  }, []);

  const analyzeIndicator = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const trimmedInput = input.trim();
      let type: 'ip' | 'domain' | 'hash' | 'email' | 'url' = 'ip';

      // Simple type detection
      if (trimmedInput.includes('@')) {
        type = 'email';
      } else if (trimmedInput.startsWith('http')) {
        type = 'url';
      } else if (trimmedInput.includes('.')) {
        type = 'domain';
      } else if (trimmedInput.match(/^[a-f0-9]{32,64}$/i)) {
        type = 'hash';
      }

      const score = threatIntelligenceEngine.analyzeThreat(trimmedInput, type);

      setIndicators([
        {
          value: trimmedInput,
          type,
          score,
        },
        ...indicators,
      ]);

      setInput('');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Threat Intelligence</h1>
        <p className="text-gray-600">
          Advanced threat detection powered by free threat feeds (MISP, AbuseIPDB, OTX, etc.)
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Total Indicators</p>
            <p className="text-3xl font-bold">{stats.totalIndicators.toLocaleString()}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Active Feeds</p>
            <p className="text-3xl font-bold">{stats.totalFeeds}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Threat Patterns</p>
            <p className="text-3xl font-bold">{stats.totalPatterns}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Critical Threats</p>
            <p className="text-3xl font-bold text-red-600">{stats.criticalThreats.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      {/* Analysis Input */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Analyze Indicator</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter an IP address, domain, email, URL, or file hash to check against threat intelligence feeds
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeIndicator()}
              placeholder="192.168.1.1 or example.com or malware.exe hash..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={analyzeIndicator}
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {indicators.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>

          <div className="space-y-4">
            {indicators.map((analysis) => (
              <div key={`${analysis.type}-${analysis.value}`} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-sm break-all">{analysis.value}</p>
                    <p className="text-xs text-gray-600 capitalize">{analysis.type}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(analysis.score.category)}`}>
                    {analysis.score.category.toUpperCase()}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Threat Score</span>
                    <span className="text-2xl font-bold">{Math.round(analysis.score.overallScore)}/100</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        analysis.score.overallScore >= 80
                          ? 'bg-red-600'
                          : analysis.score.overallScore >= 60
                            ? 'bg-orange-600'
                            : analysis.score.overallScore >= 40
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                      }`}
                      style={{ width: `${analysis.score.overallScore}%` }}
                    />
                  </div>
                </div>

                {analysis.score.matches.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-sm font-medium">Matching Threats:</p>
                    {analysis.score.matches.slice(0, 3).map((match, idx) => (
                      <div key={idx} className="text-xs bg-red-50 border border-red-200 rounded p-2">
                        <p className="font-semibold text-red-700">{match.pattern.name}</p>
                        <p className="text-red-600">Category: {match.pattern.category}</p>
                        <p className="text-red-600">Severity: {match.severity}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600">Sources</p>
                    <p className="font-semibold">{analysis.score.sources.length}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-600">Last Updated</p>
                    <p className="font-semibold">{analysis.score.lastUpdated.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Threat Feeds Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Active Threat Feeds</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="font-semibold">AbuseIPDB</p>
              <p className="text-sm text-gray-600">Malicious IP address database</p>
            </div>
            <span className="text-sm font-medium text-green-600">✓ Active</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="font-semibold">AlienVault OTX</p>
              <p className="text-sm text-gray-600">Open Threat Exchange intelligence</p>
            </div>
            <span className="text-sm font-medium text-green-600">✓ Active</span>
          </div>
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <p className="font-semibold">PhishTank</p>
              <p className="text-sm text-gray-600">Phishing URL database</p>
            </div>
            <span className="text-sm font-medium text-green-600">✓ Active</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">URLhaus</p>
              <p className="text-sm text-gray-600">Malicious URL feed</p>
            </div>
            <span className="text-sm font-medium text-green-600">✓ Active</span>
          </div>
        </div>
      </Card>

      {/* Information */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="space-y-2">
          <h3 className="font-semibold text-blue-900">About Threat Intelligence</h3>
          <p className="text-sm text-blue-800">
            This module aggregates data from multiple free threat feeds including MISP, AbuseIPDB, AlienVault OTX, PhishTank, and URLhaus.
            It provides real-time threat detection with pattern matching and threat scoring to help you identify and respond to security threats.
          </p>
        </div>
      </Card>
    </div>
  );
}
