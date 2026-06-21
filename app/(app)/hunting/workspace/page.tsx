"use client";

import React, { useState } from "react";

interface TimelineEvent {
  timestamp: Date;
  eventType: string;
  source: string;
  description: string;
  severity?: string;
}

interface Evidence {
  evidenceId: string;
  type: string;
  source: string;
  description: string;
  hash: string;
}

export default function ThreatHuntingWorkspace() {
  const [activeTab, setActiveTab] = useState<"timeline" | "evidence" | "queries">("timeline");
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      eventType: "login",
      source: "auth_service",
      description: "Suspicious login from unusual location",
      severity: "high",
    },
    {
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      eventType: "file_access",
      source: "file_system",
      description: "Bulk file download detected",
      severity: "high",
    },
    {
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      eventType: "network",
      source: "network_monitor",
      description: "Data exfiltration attempt blocked",
      severity: "critical",
    },
  ]);

  const [evidence, setEvidence] = useState<Evidence[]>([
    {
      evidenceId: "evt-001",
      type: "file",
      source: "/var/log/auth.log",
      description: "Authentication log",
      hash: "a1b2c3d4e5f6...",
    },
    {
      evidenceId: "evt-002",
      type: "network",
      source: "Network packet capture",
      description: "Suspicious traffic",
      hash: "f6e5d4c3b2a1...",
    },
  ]);

  const [queryInput, setQueryInput] = useState("");
  const [queryResults, setQueryResults] = useState<any[]>([]);

  const handleQuerySubmit = () => {
    if (queryInput.trim()) {
      setQueryResults([
        {
          id: "result-1",
          description: `Query results for: ${queryInput}`,
          count: Math.floor(Math.random() * 1000),
        },
      ]);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Threat Hunting Workspace</h1>
        <p className="text-gray-600">Forensic investigation and evidence correlation</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b">
        {["timeline", "evidence", "queries"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-semibold ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline Tab */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Investigation Timeline</h2>
          <div className="space-y-3">
            {timeline.map((event, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-4 p-4 border-l-4 border-blue-600 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">
                      {event.eventType}
                    </div>
                    {event.severity && (
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          event.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : event.severity === "high"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.severity.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    {event.description}
                  </p>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>Source: {event.source}</span>
                    <span>{event.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Tab */}
      {activeTab === "evidence" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Evidence Collection</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Hash (SHA256)
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {evidence.map((evt) => (
                  <tr key={evt.evidenceId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {evt.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">{evt.source}</td>
                    <td className="px-6 py-3 text-sm">{evt.description}</td>
                    <td className="px-6 py-3 text-sm font-mono text-gray-600">
                      {evt.hash}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <button className="text-blue-600 hover:text-blue-800">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Queries Tab */}
      {activeTab === "queries" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Query Builder</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Query
                </label>
                <textarea
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  className="w-full p-3 border rounded font-mono text-sm"
                  rows={4}
                  placeholder="Enter your query (e.g., user_id = 'user123' AND timestamp > '2024-01-01')"
                />
              </div>
              <button
                onClick={handleQuerySubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Execute Query
              </button>
            </div>

            {queryResults.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4">Results</h3>
                <div className="space-y-3">
                  {queryResults.map((result) => (
                    <div key={result.id} className="p-4 bg-gray-50 rounded">
                      <div className="flex justify-between items-center">
                        <span>{result.description}</span>
                        <span className="font-semibold">
                          {result.count} records
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
