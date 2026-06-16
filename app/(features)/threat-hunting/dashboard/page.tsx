import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Threat Hunting Dashboard | BlockStop",
  description: "Advanced threat hunting and investigation dashboard",
};

async function HuntStats() {
  try {
    const response = await fetch("/api/threat-hunting/hunts");
    const data = await response.json();

    const hunts = data.hunts || [];
    const active = hunts.filter((h: any) => h.status === "running").length;
    const completed = hunts.filter((h: any) => h.status === "completed").length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Total Hunts</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{hunts.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Active Hunts</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{active}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Completed</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{completed}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Success Rate</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {hunts.length > 0 ? Math.round((completed / hunts.length) * 100) : 0}%
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return <div className="text-red-600">Failed to load hunt statistics</div>;
  }
}

export default function ThreatHuntingDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Threat Hunting Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Advanced threat hunting, investigation, and forensic analysis
          </p>
        </div>

        <Suspense fallback={<div className="text-gray-600">Loading hunt statistics...</div>}>
          <HuntStats />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hunt Templates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Hunt Templates</h2>
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-gray-900">Pass the Hash</div>
                <div className="text-sm text-gray-600">Detect NTLM hash-based lateral movement</div>
              </div>
              <div className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-gray-900">Data Exfiltration</div>
                <div className="text-sm text-gray-600">Identify bulk data transfers</div>
              </div>
              <div className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-gray-900">Privilege Escalation</div>
                <div className="text-sm text-gray-600">Detect elevation attempts</div>
              </div>
              <div className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-gray-900">AD Enumeration</div>
                <div className="text-sm text-gray-600">Identify reconnaissance activities</div>
              </div>
            </div>
          </div>

          {/* Recent Hunts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Hunts</h2>
            <div className="space-y-3">
              <div className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded">
                <div className="font-medium text-gray-900">Hunt-001: Network Lateral Movement</div>
                <div className="text-sm text-gray-600 mt-1">Status: Running • 15 entities affected</div>
              </div>
              <div className="p-3 border-l-4 border-green-500 bg-green-50 rounded">
                <div className="font-medium text-gray-900">Hunt-002: Cloud Access Anomalies</div>
                <div className="text-sm text-gray-600 mt-1">Status: Completed • 8 findings</div>
              </div>
              <div className="p-3 border-l-4 border-red-500 bg-red-50 rounded">
                <div className="font-medium text-gray-900">Hunt-003: Data Staging</div>
                <div className="text-sm text-gray-600 mt-1">Status: Critical • 3 entities</div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Findings */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Findings</h2>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-md bg-red-600">
                    <span className="text-white">!</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-900">Critical: Lateral Movement Detected</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Suspicious cross-system access patterns identified on 5 endpoints
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Start New Hunt
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Create Investigation
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Run Forensics
          </button>
        </div>
      </div>
    </div>
  );
}
