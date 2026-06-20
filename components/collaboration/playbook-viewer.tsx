"use client";

import { useState } from "react";
import { Playbook } from "@/types/collaboration";

interface PlaybookViewerProps {
  playbooks: Playbook[];
  selectedPlaybook?: Playbook | null;
  onSelectPlaybook?: (playbook: Playbook) => void;
  onExecuteStep?: (playbookId: string, stepId: string) => void;
}

export default function PlaybookViewer({
  playbooks,
  selectedPlaybook,
  onSelectPlaybook,
  onExecuteStep,
}: PlaybookViewerProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    const newSet = new Set(expandedSteps);
    if (newSet.has(stepId)) {
      newSet.delete(stepId);
    } else {
      newSet.add(stepId);
    }
    setExpandedSteps(newSet);
  };

  if (!selectedPlaybook) {
    return (
      <div className="bg-white rounded-lg border border-light-border p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Playbooks</h2>
        <div className="space-y-2">
          {playbooks.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No playbooks available
            </p>
          ) : (
            playbooks.map((playbook) => (
              <button
                key={playbook.id}
                onClick={() => onSelectPlaybook?.(playbook)}
                className="w-full text-left p-3 hover:bg-light-surface rounded-lg transition border border-light-border"
              >
                <h3 className="font-semibold text-gray-900">{playbook.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {playbook.description}
                </p>
                <div className="flex gap-2 mt-2">
                  {playbook.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-light-border p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <button
            onClick={() => onSelectPlaybook?.(null as any)}
            className="text-primary-600 hover:text-primary-700 text-sm font-semibold mb-2"
          >
            ← Back to Playbooks
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedPlaybook.title}
          </h2>
          <p className="text-gray-600 mt-2">{selectedPlaybook.description}</p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {selectedPlaybook.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded font-semibold"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 mb-4">Steps</h3>
        {selectedPlaybook.steps.map((step, index) => (
          <div
            key={step.id}
            className="border border-light-border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleStep(step.id)}
              className="w-full p-4 hover:bg-light-surface transition text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-500 text-white text-sm flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
              <span className={`text-xl transition ${expandedSteps.has(step.id) ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {expandedSteps.has(step.id) && (
              <div className="bg-light-surface p-4 border-t border-light-border">
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Expected Output
                  </p>
                  <p className="text-sm text-gray-800 bg-white p-2 rounded border border-light-border">
                    {step.expectedOutput}
                  </p>
                </div>

                {step.tools.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Tools Required
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {step.tools.map((tool) => (
                        <span
                          key={tool}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onExecuteStep?.(selectedPlaybook.id, step.id)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm w-full"
                >
                  Execute Step
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
