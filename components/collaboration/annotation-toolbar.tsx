"use client";

import { useState } from "react";
import { Annotation } from "@/types/collaboration";

interface AnnotationToolbarProps {
  evidenceId: string;
  onAddAnnotation?: (annotation: Omit<Annotation, "id">) => void;
  annotations: Annotation[];
  currentUserId: string;
  currentUserName: string;
}

export default function AnnotationToolbar({
  evidenceId,
  onAddAnnotation,
  annotations,
  currentUserId,
  currentUserName,
}: AnnotationToolbarProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    text: "",
    color: "yellow",
  });

  const colors = [
    { name: "yellow", bg: "bg-yellow-300", label: "Yellow" },
    { name: "red", bg: "bg-red-300", label: "Red" },
    { name: "green", bg: "bg-green-300", label: "Green" },
    { name: "blue", bg: "bg-blue-300", label: "Blue" },
    { name: "purple", bg: "bg-purple-300", label: "Purple" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) return;

    const newAnnotation: Omit<Annotation, "id"> = {
      evidenceId,
      userId: currentUserId,
      userName: currentUserName,
      text: formData.text,
      color: formData.color,
      createdAt: new Date(),
    };

    if (onAddAnnotation) {
      onAddAnnotation(newAnnotation);
    }

    setFormData({ text: "", color: "yellow" });
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg border border-light-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Annotations</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-semibold"
        >
          + Add Note
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-light-surface rounded-lg">
          <textarea
            placeholder="Add your annotation..."
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            className="w-full px-3 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm mb-3"
            rows={2}
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.name })}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    formData.color === color.name
                      ? "border-gray-900 scale-110"
                      : "border-gray-300"
                  } ${color.bg}`}
                  title={color.label}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1 border border-light-border rounded-lg hover:bg-light-surface text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {annotations.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No annotations yet</p>
        ) : (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`p-3 rounded-lg border-2 ${
                annotation.color === "yellow"
                  ? "bg-yellow-100 border-yellow-300"
                  : annotation.color === "red"
                  ? "bg-red-100 border-red-300"
                  : annotation.color === "green"
                  ? "bg-green-100 border-green-300"
                  : annotation.color === "blue"
                  ? "bg-blue-100 border-blue-300"
                  : "bg-purple-100 border-purple-300"
              }`}
            >
              <p className="text-xs font-semibold text-gray-800 mb-1">
                {annotation.userName}
              </p>
              <p className="text-sm text-gray-800">{annotation.text}</p>
              <p className="text-xs text-gray-600 mt-2">
                {new Date(annotation.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
