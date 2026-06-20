"use client";

import { useState, useEffect } from "react";

interface Procedure {
  id: string;
  title: string;
  category: string;
  steps: ProcedureStep[];
  createdAt: Date;
  updatedAt: Date;
  author: string;
  tags: string[];
}

interface ProcedureStep {
  id: string;
  order: number;
  title: string;
  description: string;
  tools: string[];
}

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        const res = await fetch("/api/procedures");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setProcedures(data.procedures || []);
      } catch (error) {
        console.error("Error fetching procedures:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProcedures();
  }, []);

  const categories = Array.from(new Set(procedures.map((p) => p.category)));
  const filteredProcedures =
    selectedCategory === "all"
      ? procedures
      : procedures.filter((p) => p.category === selectedCategory);

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">📖 Procedures</h1>
          <p className="text-gray-600 mt-2">
            Standard operating procedures for incident management
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading procedures...</p>
          </div>
        ) : selectedProcedure ? (
          <div className="bg-white rounded-lg border border-light-border p-8">
            <button
              onClick={() => setSelectedProcedure(null)}
              className="text-primary-600 hover:text-primary-700 text-sm font-semibold mb-6"
            >
              ← Back to Procedures
            </button>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedProcedure.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
              <span>by {selectedProcedure.author}</span>
              <span>•</span>
              <span>
                Updated{" "}
                {new Date(selectedProcedure.updatedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-6 mb-8">
              {selectedProcedure.steps.map((step) => (
                <div key={step.id} className="border-l-4 border-primary-600 pl-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Step {step.order}: {step.title}
                  </h3>
                  <p className="text-gray-700 mb-3">{step.description}</p>

                  {step.tools.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {step.tools.map((tool) => (
                        <span
                          key={tool}
                          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {selectedProcedure.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  selectedCategory === "all"
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-light-border text-gray-700 hover:bg-light-surface"
                }`}
              >
                All ({procedures.length})
              </button>
              {categories.map((cat) => {
                const count = procedures.filter((p) => p.category === cat)
                  .length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      selectedCategory === cat
                        ? "bg-primary-600 text-white"
                        : "bg-white border border-light-border text-gray-700 hover:bg-light-surface"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {filteredProcedures.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-light-border">
                <p className="text-gray-500">No procedures found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProcedures.map((procedure) => (
                  <button
                    key={procedure.id}
                    onClick={() => setSelectedProcedure(procedure)}
                    className="text-left p-6 bg-white rounded-lg border border-light-border hover:shadow-lg transition"
                  >
                    <h3 className="text-lg font-bold text-gray-900">
                      {procedure.title}
                    </h3>
                    <p className="text-gray-600 mt-2 text-sm">
                      by {procedure.author}
                    </p>
                    <div className="mt-4">
                      <p className="text-xs text-gray-600 mb-2">Procedure Steps</p>
                      <p className="text-sm font-semibold text-primary-600">
                        {procedure.steps.length} steps
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {procedure.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
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
