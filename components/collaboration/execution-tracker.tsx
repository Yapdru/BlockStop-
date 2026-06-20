"use client";

import { useState } from "react";
import { PlaybookStep } from "@/types/collaboration";

interface ExecutionTrackerProps {
  steps: PlaybookStep[];
  playbookTitle: string;
  onStepComplete?: (stepId: string, result: string) => void;
}

export default function ExecutionTracker({
  steps,
  playbookTitle,
  onStepComplete,
}: ExecutionTrackerProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<Record<string, string>>({});

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const inProgressCount = steps.filter((s) => s.status === "in-progress").length;

  const handleMarkComplete = (stepId: string, result: string) => {
    setStepResults({ ...stepResults, [stepId]: result });
    onStepComplete?.(stepId, result);
  };

  return (
    <div className="bg-white rounded-lg border border-light-border p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {playbookTitle}
        </h2>
        <div className="w-full bg-light-border rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-600 h-full transition-all"
            style={{
              width: `${(completedCount / steps.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {completedCount} of {steps.length} steps completed
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`border rounded-lg overflow-hidden transition ${
              step.status === "completed"
                ? "border-green-300 bg-green-50"
                : step.status === "in-progress"
                ? "border-blue-300 bg-blue-50"
                : "border-light-border"
            }`}
          >
            <button
              onClick={() =>
                setExpandedStep(
                  expandedStep === step.id ? null : step.id
                )
              }
              className="w-full p-4 hover:bg-light-surface transition text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-8 h-8 rounded-full text-white text-sm flex items-center justify-center font-semibold flex-shrink-0 ${
                    step.status === "completed"
                      ? "bg-green-600"
                      : step.status === "in-progress"
                      ? "bg-blue-600"
                      : "bg-gray-400"
                  }`}
                >
                  {step.status === "completed" ? "✓" : index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white">
                  {step.status.toUpperCase()}
                </span>
                <span className={`text-xl transition ${expandedStep === step.id ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </div>
            </button>

            {expandedStep === step.id && (
              <div className="bg-light-surface p-4 border-t border-gray-200">
                <textarea
                  placeholder="Enter execution results..."
                  value={stepResults[step.id] || ""}
                  onChange={(e) =>
                    setStepResults({
                      ...stepResults,
                      [step.id]: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm mb-3"
                  rows={3}
                />

                <button
                  onClick={() =>
                    handleMarkComplete(step.id, stepResults[step.id] || "")
                  }
                  disabled={step.status === "completed"}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition"
                >
                  {step.status === "completed"
                    ? "✓ Completed"
                    : "Mark Complete"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-light-surface rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Progress Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-600">Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
            <p className="text-xs text-gray-600">In Progress</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">
              {steps.length - completedCount - inProgressCount}
            </p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
}
