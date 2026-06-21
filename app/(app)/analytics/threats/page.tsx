"use client";

import React, { useEffect, useState } from "react";

interface ThreatAnalytics {
  period: string;
  totalThreats: number;
  uniqueThreats: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  bySource: Record<string, number>;
  trend: {
    direction: string;
    percentChange: number;
  };
  topThreats: Array<{
    type: string;
    severity: string;
    count: number;
    lastSeen: string;
  }>;
}

export default function ThreatsAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<ThreatAnalytics | null>(null);
  const [period, setPeriod] = useState("24h");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/threats?period=${period}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading threat analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-8">Failed to load analytics</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Threat Analytics Dashboard</h1>
        <div className="space-x-2">
          {["24h", "7d", "30d", "90d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Total Threats</div>
          <div className="text-4xl font-bold text-blue-600">
            {analytics.totalThreats}
          </div>
          <div
            className={`text-sm mt-2 ${
              analytics.trend.direction === "increasing"
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {analytics.trend.direction === "increasing" ? "↑" : "↓"}{" "}
            {Math.abs(analytics.trend.percentChange)}%
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Critical</div>
          <div className="text-4xl font-bold text-red-600">
            {analytics.bySeverity["critical"] || 0}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">High</div>
          <div className="text-4xl font-bold text-orange-600">
            {analytics.bySeverity["high"] || 0}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Unique Types</div>
          <div className="text-4xl font-bold text-purple-600">
            {analytics.uniqueThreats}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* By Type */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Threats by Type</h2>
          <div className="space-y-2">
            {Object.entries(analytics.byType)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm">{type}</span>
                  <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(count / analytics.totalThreats) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* By Severity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Distribution by Severity</h2>
          <div className="space-y-2">
            {[
              ["critical", "text-red-600"],
              ["high", "text-orange-600"],
              ["medium", "text-yellow-600"],
              ["low", "text-green-600"],
            ].map(([severity, color]) => (
              <div
                key={severity}
                className="flex justify-between items-center"
              >
                <span className="text-sm capitalize">{severity}</span>
                <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${color}`}
                    style={{
                      width: `${((analytics.bySeverity[severity] || 0) / analytics.totalThreats) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold">
                  {analytics.bySeverity[severity] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Threats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Top Threats</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Type</th>
              <th className="text-left py-2">Severity</th>
              <th className="text-right py-2">Count</th>
              <th className="text-left py-2">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {analytics.topThreats.map((threat, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="py-2">{threat.type}</td>
                <td className="py-2">
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${
                      threat.severity === "critical"
                        ? "bg-red-100 text-red-800"
                        : threat.severity === "high"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {threat.severity.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 text-right font-semibold">
                  {threat.count}
                </td>
                <td className="py-2 text-gray-600">
                  {new Date(threat.lastSeen).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
