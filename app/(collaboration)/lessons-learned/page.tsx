"use client";

import { useState, useEffect } from "react";
import { LessonLearned } from "@/types/collaboration";

export default function LessonsLearnedPage() {
  const [lessons, setLessons] = useState<LessonLearned[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonLearned | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedImpact, setSelectedImpact] = useState<string>("all");

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await fetch("/api/lessons-learned");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setLessons(data.lessons || []);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  const categories = Array.from(new Set(lessons.map((l) => l.category)));
  const impacts = ["low", "medium", "high"];

  let filteredLessons = lessons;
  if (selectedCategory !== "all") {
    filteredLessons = filteredLessons.filter(
      (l) => l.category === selectedCategory
    );
  }
  if (selectedImpact !== "all") {
    filteredLessons = filteredLessons.filter((l) => l.impact === selectedImpact);
  }

  const impactColors = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">💡 Lessons Learned</h1>
          <p className="text-gray-600 mt-2">
            Post-incident reviews and organizational learning
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading lessons...</p>
          </div>
        ) : selectedLesson ? (
          <div className="bg-white rounded-lg border border-light-border p-8">
            <button
              onClick={() => setSelectedLesson(null)}
              className="text-primary-600 hover:text-primary-700 text-sm font-semibold mb-6"
            >
              ← Back to Lessons
            </button>

            <div className="flex items-start justify-between mb-4">
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedLesson.title}
              </h2>
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${impactColors[selectedLesson.impact]}`}
              >
                {selectedLesson.impact.toUpperCase()} IMPACT
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
              <span>by {selectedLesson.author}</span>
              <span>•</span>
              <span>{new Date(selectedLesson.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-semibold">
                {selectedLesson.category}
              </span>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed">
                {selectedLesson.description}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-light-border">
              <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold">
                Create Action Item
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg border border-light-border p-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Category
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                      selectedCategory === "all"
                        ? "bg-primary-600 text-white"
                        : "bg-light-surface text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                        selectedCategory === cat
                          ? "bg-primary-600 text-white"
                          : "bg-light-surface text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Impact</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedImpact("all")}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                      selectedImpact === "all"
                        ? "bg-primary-600 text-white"
                        : "bg-light-surface text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {impacts.map((impact) => (
                    <button
                      key={impact}
                      onClick={() => setSelectedImpact(impact)}
                      className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                        selectedImpact === impact
                          ? "bg-primary-600 text-white"
                          : "bg-light-surface text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {impact.charAt(0).toUpperCase() + impact.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredLessons.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-light-border">
                <p className="text-gray-500">No lessons found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className="text-left p-6 bg-white rounded-lg border border-light-border hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">
                        {lesson.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ml-2 ${impactColors[lesson.impact]}`}
                      >
                        {lesson.impact.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                      {lesson.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{lesson.category}</span>
                      <span>{new Date(lesson.createdAt).toLocaleDateString()}</span>
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
