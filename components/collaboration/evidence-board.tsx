"use client";

import { useState } from "react";
import { Evidence } from "@/types/collaboration";

interface EvidenceBoardProps {
  evidence: Evidence[];
  incidentId: string;
  onSelectEvidence?: (evidence: Evidence) => void;
  onUploadEvidence?: (file: File) => void;
}

export default function EvidenceBoard({
  evidence,
  incidentId,
  onSelectEvidence,
  onUploadEvidence,
}: EvidenceBoardProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const typeIcons = {
    file: "📄",
    log: "📋",
    screenshot: "🖼️",
    network: "🌐",
    system: "⚙️",
  };

  const filteredEvidence = selectedType
    ? evidence.filter((e) => e.type === selectedType)
    : evidence;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (onUploadEvidence) {
        onUploadEvidence(file);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/incidents/${incidentId}/evidence`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to upload");
      }
    } catch (error) {
      console.error("Error uploading:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-light-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Evidence Board</h2>
        <label className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer text-sm font-semibold disabled:opacity-50">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? "Uploading..." : "Upload Evidence"}
        </label>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition ${
            selectedType === null
              ? "bg-primary-500 text-white"
              : "bg-light-surface text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({evidence.length})
        </button>
        {["file", "log", "screenshot", "network", "system"].map((type) => {
          const count = evidence.filter((e) => e.type === type).length;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                selectedType === type
                  ? "bg-primary-500 text-white"
                  : "bg-light-surface text-gray-700 hover:bg-gray-200"
              }`}
            >
              {type} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvidence.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-12 text-gray-500">
            <p>No evidence items found</p>
          </div>
        ) : (
          filteredEvidence.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectEvidence?.(item)}
              className="bg-light-surface rounded-lg p-4 hover:shadow-lg transition cursor-pointer border border-light-border hover:border-primary-500"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{typeIcons[item.type]}</span>
                <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full font-semibold">
                  {item.type}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 truncate mb-2">
                {item.name}
              </h3>

              <p className="text-xs text-gray-600 mb-3">
                {(item.size / 1024).toFixed(2)} KB
              </p>

              <div className="flex gap-1 flex-wrap mb-3">
                {item.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 2 && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    +{item.tags.length - 2}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500">
                by {item.uploadedBy} • {new Date(item.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
