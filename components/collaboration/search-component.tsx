"use client";

import { useState } from "react";

interface SearchResult {
  id: string;
  title: string;
  type: "message" | "evidence" | "timeline" | "assignment" | "playbook";
  preview: string;
  date: Date;
}

interface SearchComponentProps {
  incidentId: string;
  onSearch?: (query: string) => Promise<SearchResult[]>;
}

export default function SearchComponent({
  incidentId,
  onSearch,
}: SearchComponentProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const typeIcons = {
    message: "💬",
    evidence: "📄",
    timeline: "📅",
    assignment: "✓",
    playbook: "📋",
  };

  const typeColors = {
    message: "bg-blue-100 text-blue-800",
    evidence: "bg-orange-100 text-orange-800",
    timeline: "bg-purple-100 text-purple-800",
    assignment: "bg-green-100 text-green-800",
    playbook: "bg-yellow-100 text-yellow-800",
  };

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      if (onSearch) {
        const searchResults = await onSearch(value);
        setResults(searchResults);
      } else {
        const res = await fetch(
          `/api/incidents/${incidentId}/search?q=${encodeURIComponent(value)}`
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.results || []);
      }
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search incident..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowResults(results.length > 0)}
          className="w-full px-4 py-2 pl-10 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
        {searching && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-600 animate-spin">
            ⏳
          </span>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-light-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2 space-y-1">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  setQuery("");
                  setShowResults(false);
                }}
                className="w-full text-left p-3 hover:bg-light-surface rounded-lg transition"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">
                    {typeIcons[result.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">
                      {result.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {result.preview}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${typeColors[result.type]}`}
                      >
                        {result.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(result.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && query.trim() && results.length === 0 && !searching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-light-border rounded-lg shadow-lg z-50 p-4 text-center text-gray-500 text-sm">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
