"use client";

import { useState, useEffect } from "react";
import PlaybookViewer from "@/components/collaboration/playbook-viewer";
import { Playbook } from "@/types/collaboration";

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchPlaybooks = async () => {
      try {
        const res = await fetch("/api/playbooks");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPlaybooks(data.playbooks || []);
      } catch (error) {
        console.error("Error fetching playbooks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaybooks();
  }, []);

  const categories = Array.from(new Set(playbooks.map((p) => p.category)));
  const filteredPlaybooks =
    selectedCategory === "all"
      ? playbooks
      : playbooks.filter((p) => p.category === selectedCategory);

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">📋 Playbooks</h1>
          <p className="text-gray-600 mt-2">
            Execute standardized incident response procedures
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading playbooks...</p>
          </div>
        ) : selectedPlaybook ? (
          <PlaybookViewer
            playbooks={playbooks}
            selectedPlaybook={selectedPlaybook}
            onSelectPlaybook={setSelectedPlaybook}
          />
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
                All ({playbooks.length})
              </button>
              {categories.map((cat) => {
                const count = playbooks.filter((p) => p.category === cat).length;
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

            {filteredPlaybooks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-light-border">
                <p className="text-gray-500">No playbooks found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPlaybooks.map((playbook) => (
                  <button
                    key={playbook.id}
                    onClick={() => setSelectedPlaybook(playbook)}
                    className="text-left p-6 bg-white rounded-lg border border-light-border hover:shadow-lg transition"
                  >
                    <h3 className="text-lg font-bold text-gray-900">
                      {playbook.title}
                    </h3>
                    <p className="text-gray-600 mt-2 text-sm">
                      {playbook.description}
                    </p>
                    <div className="mt-4">
                      <p className="text-xs text-gray-600 mb-2">Steps</p>
                      <div className="w-full bg-light-border rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary-600 h-full"
                          style={{
                            width: `${
                              (playbook.steps.filter((s) => s.status === "completed")
                                .length /
                                playbook.steps.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {playbook.steps.length} steps
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
