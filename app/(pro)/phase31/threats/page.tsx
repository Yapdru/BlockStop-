// PRO Phase 31.1 - Advanced Threat Dashboard
// Production-ready React component for threat visualization and management

'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  threatDetector,
  getRiskCategory,
  formatRiskExplanation,
} from '@/lib/pro/phase31/advanced-threat-detection';
import {
  threatCorrelationEngine,
} from '@/lib/pro/phase31/threat-correlation';
import {
  dashboardInsights,
  getSeverityColor,
  formatMetric,
} from '@/lib/pro/phase31/dashboard-insights';
import {
  alertRuleEngine,
} from '@/lib/pro/phase31/real-time-alerts';
import {
  DashboardMetrics,
  ThreatPrediction,
  ThreatFeatures,
  GeoLocation,
} from '@/types/pro-phase31';

// ============================================================================
// ADVANCED THREAT DASHBOARD
// ============================================================================

export default function AdvancedThreatDashboard() {
  const [threats, setThreats] = useState<ThreatPrediction[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selectedThreat, setSelectedThreat] = useState<ThreatPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [expandedThreat, setExpandedThreat] = useState<string | null>(null);

  useEffect(() => {
    loadThreatsAndMetrics();
    const interval = setInterval(loadThreatsAndMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadThreatsAndMetrics = async () => {
    setLoading(true);

    // Generate sample threats for demonstration
    const sampleThreats = generateSampleThreats(15);

    // Analyze each threat
    const analyzedThreats = await Promise.all(
      sampleThreats.map((features) =>
        threatDetector.analyzeThreat(`threat_${Date.now()}_${Math.random()}`, features)
      )
    );

    setThreats(analyzedThreats);

    // Register threats for correlation
    analyzedThreats.forEach((threat) => {
      threatCorrelationEngine.registerThreat(threat);
    });

    // Calculate metrics
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const calculatedMetrics = dashboardInsights.calculateMetrics(analyzedThreats, {
      start: startOfDay,
      end: now,
    });

    setMetrics(calculatedMetrics);
    setLoading(false);
  };

  const generateSampleThreats = (count: number): ThreatFeatures[] => {
    const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'SSH', 'DNS'];
    const countries = ['US', 'CN', 'RU', 'KP', 'IR', 'GB', 'DE'];
    const patterns = ['SQLInjection', 'XSS', 'BufferOverflow', 'PrivilegeEscalation', 'DnsExfil'];

    return Array.from({ length: count }, (_, i) => ({
      sourceIp: `192.168.${Math.floor(i / 256)}.${(i % 256) + 1}`,
      destinationIp: `10.0.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      payloadSize: Math.floor(Math.random() * 65536) + 1000,
      packetCount: Math.floor(Math.random() * 50000) + 100,
      duration: Math.floor(Math.random() * 3600) + 1,
      anomalousPatterns: patterns.slice(0, Math.floor(Math.random() * 3) + 1),
      geoLocation: {
        country: countries[Math.floor(Math.random() * countries.length)],
        region: 'Unknown',
        city: 'Unknown',
        latitude: Math.random() * 180 - 90,
        longitude: Math.random() * 360 - 180,
        timezone: 'UTC',
        ispName: `ISP_${Math.floor(Math.random() * 1000)}`,
      } as GeoLocation,
      asn: `AS${Math.floor(Math.random() * 64999) + 1}`,
      threatIntel: {
        isKnownMalicious: Math.random() > 0.7,
        knownAssets: Math.random() > 0.8 ? ['asset1', 'asset2'] : [],
        previousIncidents: Math.floor(Math.random() * 20),
        threatLevel: Math.random() > 0.5 ? 'high' : 'medium',
        sources: ['threat-feed-1', 'threat-feed-2'],
        lastSeen: new Date(Date.now() - Math.random() * 86400000),
      },
    }));
  };

  const filteredThreats = threats.filter((t) => {
    if (filter === 'all') return true;
    const category = getRiskCategory(t.riskScore);
    return category === filter;
  });

  const threatSummary = metrics ? dashboardInsights.getDashboardSummary(metrics) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Advanced Threat Detection</h1>
          <p className="text-slate-400">ML-powered threat analysis with ensemble predictions</p>
        </div>

        {/* Status Alert */}
        {threatSummary && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              threatSummary.status === 'critical'
                ? 'bg-red-900/20 border-red-500'
                : threatSummary.status === 'high'
                  ? 'bg-orange-900/20 border-orange-500'
                  : threatSummary.status === 'medium'
                    ? 'bg-yellow-900/20 border-yellow-500'
                    : 'bg-green-900/20 border-green-500'
            }`}
          >
            <p className="text-white font-semibold">{threatSummary.summary}</p>
            {threatSummary.recommendations.length > 0 && (
              <ul className="mt-2 text-sm text-slate-300 space-y-1">
                {threatSummary.recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx}>• {rec}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Total Threats"
              value={metrics.totalThreats}
              change={metrics.threatsChangePercent}
              trend={metrics.threatsTrendingUp}
            />
            <MetricCard
              label="Critical Threats"
              value={metrics.criticalThreats}
              highlight="critical"
            />
            <MetricCard
              label="Detection Accuracy"
              value={`${metrics.detectionAccuracy}%`}
              highlight="success"
            />
            <MetricCard
              label="Avg Response Time"
              value={`${metrics.averageResponseTime}ms`}
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Threat Types */}
          {metrics && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Threat Types Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.topThreatTypes}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {metrics.topThreatTypes.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getSeverityColor(entry.severity)}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Time Series */}
          {metrics && metrics.timeSeriesData.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Threat Timeline (24h)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#94a3b8"
                    tickFormatter={(d) => new Date(d).getHours() + ':00'}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="threatCount"
                    stroke="#ef4444"
                    name="Total Threats"
                  />
                  <Line
                    type="monotone"
                    dataKey="criticalCount"
                    stroke="#dc2626"
                    name="Critical"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Attack Vectors */}
        {metrics && metrics.topAttackVectors.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Top Attack Vectors</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.topAttackVectors}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="vector" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Attack Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Threat List */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Threat Details</h2>
            <div className="flex gap-2">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({
                    threats.filter((t) => getRiskCategory(t.riskScore) === f || f === 'all').length
                  })
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-slate-400">Loading threats...</p>
            ) : filteredThreats.length === 0 ? (
              <p className="text-slate-400">No threats detected in this category.</p>
            ) : (
              filteredThreats.map((threat) => (
                <ThreatCard
                  key={threat.threatId}
                  threat={threat}
                  expanded={expandedThreat === threat.threatId}
                  onToggle={() =>
                    setExpandedThreat(
                      expandedThreat === threat.threatId ? null : threat.threatId
                    )
                  }
                  onSelect={() => setSelectedThreat(threat)}
                />
              ))
            )}
          </div>
        </div>

        {/* Threat Details Panel */}
        {selectedThreat && (
          <ThreatDetailsPanel threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: boolean;
  highlight?: 'critical' | 'success' | 'warning';
}

function MetricCard({ label, value, change, trend, highlight }: MetricCardProps) {
  let bgColor = 'bg-slate-700/50';
  if (highlight === 'critical') bgColor = 'bg-red-900/30';
  if (highlight === 'success') bgColor = 'bg-green-900/30';
  if (highlight === 'warning') bgColor = 'bg-yellow-900/30';

  return (
    <div className={`${bgColor} backdrop-blur rounded-lg p-4 border border-slate-600`}>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {change !== undefined && (
        <p className={`text-sm mt-2 ${trend ? 'text-red-400' : 'text-green-400'}`}>
          {trend ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </p>
      )}
    </div>
  );
}

interface ThreatCardProps {
  threat: ThreatPrediction;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

function ThreatCard({ threat, expanded, onToggle, onSelect }: ThreatCardProps) {
  const category = getRiskCategory(threat.riskScore);
  const categoryColor = getSeverityColor(category);

  const topPrediction = Object.entries(threat.predictions).sort((a, b) => b[1] - a[1])[0];

  return (
    <div
      className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/50 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <span className="font-mono text-sm text-slate-400">{threat.threatId.slice(0, 20)}...</span>
            <span
              className="px-2 py-1 rounded text-xs font-semibold"
              style={{ backgroundColor: categoryColor, color: 'white' }}
            >
              {category.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Risk Score</p>
              <p className="text-white font-semibold">{(threat.riskScore * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-slate-500">Confidence</p>
              <p className="text-white font-semibold">{(threat.confidenceScore * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-slate-500">Top Threat</p>
              <p className="text-white font-semibold">{topPrediction?.[0] || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <button
          className="text-slate-400 hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="text-sm text-slate-300 space-y-2">
            <p>
              <span className="text-slate-500">Source IP:</span> {threat.features.sourceIp}
            </p>
            <p>
              <span className="text-slate-500">Destination IP:</span> {threat.features.destinationIp}
            </p>
            <p>
              <span className="text-slate-500">Protocol:</span> {threat.features.protocol}
            </p>
            <p>
              <span className="text-slate-500">Location:</span> {threat.features.geoLocation.country}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface ThreatDetailsPanelProps {
  threat: ThreatPrediction;
  onClose: () => void;
}

function ThreatDetailsPanel({ threat, onClose }: ThreatDetailsPanelProps) {
  const category = getRiskCategory(threat.riskScore);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50">
      <div className="w-full md:w-96 bg-slate-800 border-t border-slate-700 rounded-t-xl p-6 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-white">Threat Analysis</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-500">Risk Category</p>
            <p className="text-white font-semibold text-lg">{category.toUpperCase()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(threat.predictions).map(([key, value]) => (
              <div key={key}>
                <p className="text-slate-500 capitalize">{key}</p>
                <div className="w-full bg-slate-700 rounded h-2 mt-1">
                  <div
                    className="bg-blue-500 h-2 rounded"
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
                <p className="text-white text-xs mt-1">{(value * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>

          {threat.explanation.riskFactors.length > 0 && (
            <div>
              <p className="text-slate-500 font-semibold mb-2">Risk Factors</p>
              <ul className="space-y-1 text-slate-300">
                {threat.explanation.riskFactors.map((factor, idx) => (
                  <li key={idx} className="text-xs">
                    • {factor.name}: {factor.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {threat.explanation.recommendedActions.length > 0 && (
            <div>
              <p className="text-slate-500 font-semibold mb-2">Recommended Actions</p>
              <ul className="space-y-1 text-slate-300">
                {threat.explanation.recommendedActions.slice(0, 3).map((action, idx) => (
                  <li key={idx} className="text-xs">
                    • {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
