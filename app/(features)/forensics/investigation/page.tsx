import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Forensics Investigation | BlockStop",
  description: "Digital forensics and incident investigation tools",
};

async function InvestigationStats() {
  try {
    const response = await fetch("/api/forensics/analyze");
    const data = await response.json();

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Active Cases</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">3</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Evidence Collected</div>
          <div className="text-3xl font-bold text-green-600 mt-2">147</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Chain of Custody Valid</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">100%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-medium">Avg Resolution Time</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">4.2d</div>
        </div>
      </div>
    );
  } catch (error) {
    return <div className="text-red-600">Failed to load investigation statistics</div>;
  }
}

export default function ForensicsInvestigation() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Forensics Investigation</h1>
          <p className="text-gray-600 mt-2">
            Digital forensics, evidence management, and incident investigation
          </p>
        </div>

        <Suspense fallback={<div className="text-gray-600">Loading investigation statistics...</div>}>
          <InvestigationStats />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Cases */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Active Cases</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 p-4 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">CASE-2024-001: Data Breach</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Unauthorized access to customer database
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                          Critical
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                          In Progress
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Evidence: 24</div>
                      <div className="text-sm text-gray-600">Findings: 12</div>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-orange-500 p-4 bg-orange-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">CASE-2024-002: Insider Threat</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Suspected data exfiltration by employee
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                          High
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                          In Progress
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Evidence: 18</div>
                      <div className="text-sm text-gray-600">Findings: 8</div>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-500 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">CASE-2024-003: System Compromise</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Investigation into potential malware infection
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                          Medium
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">
                          In Progress
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Evidence: 9</div>
                      <div className="text-sm text-gray-600">Findings: 5</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Case Types */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Forensic Types</h2>
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-gray-900">File Forensics</div>
                <div className="text-xs text-gray-600 mt-1">File system analysis</div>
              </div>
              <div className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-gray-900">Memory Forensics</div>
                <div className="text-xs text-gray-600 mt-1">RAM analysis</div>
              </div>
              <div className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-gray-900">Network Forensics</div>
                <div className="text-xs text-gray-600 mt-1">Traffic analysis</div>
              </div>
              <div className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-gray-900">Disk Forensics</div>
                <div className="text-xs text-gray-600 mt-1">Storage analysis</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline View */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Investigation Timeline</h2>
          <div className="space-y-6">
            {[
              { time: "2024-01-15 14:30", event: "Initial breach detection", severity: "critical" },
              { time: "2024-01-15 15:45", event: "Incident response team engaged", severity: "high" },
              { time: "2024-01-16 09:00", event: "Forensic imaging completed", severity: "high" },
              { time: "2024-01-16 14:20", event: "Evidence analysis in progress", severity: "medium" },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm ${
                    item.severity === "critical" ? "bg-red-600" : item.severity === "high" ? "bg-orange-600" : "bg-yellow-600"
                  }`}>
                    •
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="text-sm font-medium text-gray-900">{item.event}</div>
                  <div className="text-xs text-gray-600 mt-1">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition">
            New Investigation
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Collect Evidence
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
