import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Behavioral Analytics Dashboard | BlockStop",
  description: "User and entity behavior analytics (UEBA) dashboard",
};

async function BehaviorStats() {
  try {
    const response = await fetch("/api/behavioral-analytics/anomalies?days=30");
    const data = await response.json();

    const summary = data.summary || { total: 0, severityCounts: {} };

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Total Anomalies (30d)</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{summary.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Critical</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {summary.severityCounts.critical || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">High Risk</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">
            {summary.severityCounts.high || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Medium</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">
            {summary.severityCounts.medium || 0}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return <div className="text-red-600">Failed to load behavior statistics</div>;
  }
}

export default function BehavioralAnalyticsDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Behavioral Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            User and Entity Behavior Analytics (UEBA) - Detect insider threats and compromised accounts
          </p>
        </div>

        <Suspense fallback={<div className="text-gray-600">Loading behavior statistics...</div>}>
          <BehaviorStats />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Risk Distribution</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="text-sm font-medium text-gray-700 w-20">Critical</div>
                <div className="flex-1 h-2 bg-red-600 rounded" style={{ width: "25%" }}></div>
                <div className="text-sm text-gray-600 ml-2">25%</div>
              </div>
              <div className="flex items-center">
                <div className="text-sm font-medium text-gray-700 w-20">High</div>
                <div className="flex-1 h-2 bg-orange-500 rounded" style={{ width: "35%" }}></div>
                <div className="text-sm text-gray-600 ml-2">35%</div>
              </div>
              <div className="flex items-center">
                <div className="text-sm font-medium text-gray-700 w-20">Medium</div>
                <div className="flex-1 h-2 bg-yellow-500 rounded" style={{ width: "30%" }}></div>
                <div className="text-sm text-gray-600 ml-2">30%</div>
              </div>
              <div className="flex items-center">
                <div className="text-sm font-medium text-gray-700 w-20">Low</div>
                <div className="flex-1 h-2 bg-green-500 rounded" style={{ width: "10%" }}></div>
                <div className="text-sm text-gray-600 ml-2">10%</div>
              </div>
            </div>
          </div>

          {/* Top At-Risk Entities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top At-Risk Entities</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <div>
                  <div className="font-medium text-gray-900">john.smith@company.com</div>
                  <div className="text-sm text-gray-600">Risk Score: 0.92</div>
                </div>
                <div className="text-red-600 font-bold">CRITICAL</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <div>
                  <div className="font-medium text-gray-900">sarah.johnson@company.com</div>
                  <div className="text-sm text-gray-600">Risk Score: 0.78</div>
                </div>
                <div className="text-orange-600 font-bold">HIGH</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <div>
                  <div className="font-medium text-gray-900">admin-service@company.com</div>
                  <div className="text-sm text-gray-600">Risk Score: 0.65</div>
                </div>
                <div className="text-yellow-600 font-bold">MEDIUM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly Trends */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Anomaly Trends (Last 7 Days)</h2>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-600">Chart visualization will be rendered here</p>
          </div>
        </div>

        {/* Behavior Categories */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Suspicious Behaviors</div>
            <div className="text-2xl font-bold text-orange-600">42</div>
            <p className="text-xs text-gray-600 mt-2">Unusual access patterns detected</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Policy Violations</div>
            <div className="text-2xl font-bold text-yellow-600">18</div>
            <p className="text-xs text-gray-600 mt-2">Data handling violations</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-2">Privilege Escalations</div>
            <div className="text-2xl font-bold text-red-600">7</div>
            <p className="text-xs text-gray-600 mt-2">Unauthorized elevation attempts</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Analyze User Profile
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Generate Risk Report
          </button>
        </div>
      </div>
    </div>
  );
}
