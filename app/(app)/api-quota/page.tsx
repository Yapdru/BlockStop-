/**
 * API Quota Dashboard
 * Monitor API usage and quota limits
 */

"use client";

import { useState, useEffect } from "react";

export default function ApiQuotaPage() {
  const [quotaData, setQuotaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuota = async () => {
      try {
        // In production: fetch from API
        setQuotaData({
          tier: "pro",
          apiCalls: { used: 45230, limit: 100000, percentage: 45 },
          storage: { used: 45, limit: 100, percentage: 45 },
          bandwidth: { used: 23, limit: 100, percentage: 23 },
          resources: {
            dashboards: { used: 3, limit: 5 },
            webhooks: { used: 4, limit: 10 },
            apiKeys: { used: 2, limit: 10 },
            sessions: { used: 1, limit: 5 },
          },
          billingCycleEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuota();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading quota information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            API Quota & Usage
          </h1>
          <p className="text-slate-400">
            Monitor your API usage and quota limits
          </p>
        </div>

        {/* Tier Badge */}
        <div className="mb-8 p-4 bg-blue-900 border border-blue-700 rounded-lg">
          <p className="text-blue-200">
            <span className="font-bold">Current Plan:</span> {quotaData?.tier?.toUpperCase()}
          </p>
          <p className="text-blue-300 text-sm mt-1">
            Billing cycle ends: {quotaData?.billingCycleEnd?.toLocaleDateString()}
          </p>
        </div>

        {/* Usage Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* API Calls */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              API Calls
            </h3>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-slate-300">
                  {quotaData?.apiCalls?.used?.toLocaleString()} /{" "}
                  {quotaData?.apiCalls?.limit?.toLocaleString()}
                </p>
                <p className="text-sm font-semibold text-white">
                  {quotaData?.apiCalls?.percentage}%
                </p>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    quotaData?.apiCalls?.percentage > 80
                      ? "bg-red-600"
                      : quotaData?.apiCalls?.percentage > 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${quotaData?.apiCalls?.percentage || 0}%`,
                  }}
                />
              </div>
            </div>
            <button className="w-full text-center py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm">
              View Details
            </button>
          </div>

          {/* Storage */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Storage
            </h3>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-slate-300">
                  {quotaData?.storage?.used?.toFixed(1)} /{" "}
                  {quotaData?.storage?.limit} GB
                </p>
                <p className="text-sm font-semibold text-white">
                  {quotaData?.storage?.percentage}%
                </p>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    quotaData?.storage?.percentage > 80
                      ? "bg-red-600"
                      : quotaData?.storage?.percentage > 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${quotaData?.storage?.percentage || 0}%`,
                  }}
                />
              </div>
            </div>
            <button className="w-full text-center py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm">
              Manage Storage
            </button>
          </div>

          {/* Bandwidth */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Bandwidth
            </h3>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-slate-300">
                  {quotaData?.bandwidth?.used?.toFixed(1)} /{" "}
                  {quotaData?.bandwidth?.limit} GB
                </p>
                <p className="text-sm font-semibold text-white">
                  {quotaData?.bandwidth?.percentage}%
                </p>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    quotaData?.bandwidth?.percentage > 80
                      ? "bg-red-600"
                      : quotaData?.bandwidth?.percentage > 60
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${quotaData?.bandwidth?.percentage || 0}%`,
                  }}
                />
              </div>
            </div>
            <button className="w-full text-center py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm">
              Analyze Usage
            </button>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-slate-800 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">
            Resource Limits
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Custom Dashboards",
                used: quotaData?.resources?.dashboards?.used,
                limit: quotaData?.resources?.dashboards?.limit,
                icon: "📊",
              },
              {
                name: "Webhooks",
                used: quotaData?.resources?.webhooks?.used,
                limit: quotaData?.resources?.webhooks?.limit,
                icon: "🪝",
              },
              {
                name: "API Keys",
                used: quotaData?.resources?.apiKeys?.used,
                limit: quotaData?.resources?.apiKeys?.limit,
                icon: "🔑",
              },
              {
                name: "Concurrent Sessions",
                used: quotaData?.resources?.sessions?.used,
                limit: quotaData?.resources?.sessions?.limit,
                icon: "👤",
              },
            ].map((resource) => (
              <div
                key={resource.name}
                className="bg-slate-700 rounded-lg p-4"
              >
                <div className="text-2xl mb-2">{resource.icon}</div>
                <p className="text-sm font-medium text-slate-300 mb-2">
                  {resource.name}
                </p>
                <p className="text-2xl font-bold text-white">
                  {resource.used}/{resource.limit}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {resource.limit - resource.used} remaining
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Upgrade Plan
          </button>
          <button className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
}
