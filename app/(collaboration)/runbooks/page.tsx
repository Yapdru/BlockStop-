"use client";

import { useState, useEffect } from "react";
import ExecutionTracker from "@/components/collaboration/execution-tracker";
import { Runbook, RunbookStep } from "@/types/collaboration";

export default function RunbooksPage() {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    const fetchRunbooks = async () => {
      try {
        const res = await fetch("/api/runbooks");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setRunbooks(data.runbooks || []);
      } catch (error) {
        console.error("Error fetching runbooks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRunbooks();
  }, []);

  const types = Array.from(new Set(runbooks.map((r) => r.incidentType)));
  const filteredRunbooks =
    selectedType === "all"
      ? runbooks
      : runbooks.filter((r) => r.incidentType === selectedType);

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">⚙️ Runbooks</h1>
          <p className="text-gray-600 mt-2">
            Automated response execution guides for common incidents
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading runbooks...</p>
          </div>
        ) : selectedRunbook ? (
          <div className="bg-white rounded-lg border border-light-border p-6">
            <button
              onClick={() => setSelectedRunbook(null)}
              className="text-primary-600 hover:text-primary-700 text-sm font-semibold mb-6"
            >
              ← Back to Runbooks
            </button>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedRunbook.title}
            </h2>
            <p className="text-gray-600 mb-6">{selectedRunbook.description}</p>

            <div className="space-y-4 mb-8">
              {selectedRunbook.steps.map((step) => (
                <div
                  key={step.id}
                  className="border border-light-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      Step {step.order}: {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>

                  {step.command && (
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg mb-3 font-mono text-sm overflow-x-auto">
                      <code>{step.command}</code>
                    </div>
                  )}

                  <div className="bg-light-surface p-3 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      Expected Result
                    </p>
                    <p className="text-sm text-gray-800">{step.expectedResult}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold">
              Execute Runbook
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedType("all")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  selectedType === "all"
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-light-border text-gray-700 hover:bg-light-surface"
                }`}
              >
                All ({runbooks.length})
              </button>
              {types.map((type) => {
                const count = runbooks.filter((r) => r.incidentType === type)
                  .length;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      selectedType === type
                        ? "bg-primary-600 text-white"
                        : "bg-white border border-light-border text-gray-700 hover:bg-light-surface"
                    }`}
                  >
                    {type} ({count})
                  </button>
                );
              })}
            </div>

            {filteredRunbooks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-light-border">
                <p className="text-gray-500">No runbooks found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRunbooks.map((runbook) => (
                  <button
                    key={runbook.id}
                    onClick={() => setSelectedRunbook(runbook)}
                    className="w-full text-left p-6 bg-white rounded-lg border border-light-border hover:shadow-lg transition"
                  >
                    <h3 className="text-lg font-bold text-gray-900">
                      {runbook.title}
                    </h3>
                    <p className="text-gray-600 mt-2 text-sm">
                      {runbook.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded font-semibold">
                        {runbook.incidentType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {runbook.steps.length} steps
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
