"use client";

import { useState, useEffect } from "react";

interface KBArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  views: number;
  lastUpdated: Date;
  tags: string[];
  author: string;
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/knowledge-base");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const categories = Array.from(new Set(articles.map((a) => a.category)));
  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    const matchesSearch = article.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">📚 Knowledge Base</h1>
          <p className="text-gray-600 mt-2">
            Explore security incident investigation guides and best practices
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-light-border p-6 mb-8">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-6"
          />

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                selectedCategory === "all"
                  ? "bg-primary-600 text-white"
                  : "bg-light-surface text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({articles.length})
            </button>
            {categories.map((cat) => {
              const count = articles.filter((a) => a.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                    selectedCategory === cat
                      ? "bg-primary-600 text-white"
                      : "bg-light-surface text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading articles...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-light-border">
                <p className="text-gray-500">No articles found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className="w-full text-left p-6 bg-white rounded-lg border border-light-border hover:shadow-lg transition"
                  >
                    <h3 className="text-lg font-bold text-gray-900">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                      {article.content}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-2">
                        {article.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        👁️ {article.views} views
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {selectedArticle ? (
              <div className="bg-white rounded-lg border border-light-border p-6 sticky top-20">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-semibold mb-4"
                >
                  ← Back
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedArticle.title}
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  by {selectedArticle.author} • Updated{" "}
                  {new Date(selectedArticle.lastUpdated).toLocaleDateString()}
                </p>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700">{selectedArticle.content}</p>
                </div>
                <div className="flex gap-2 flex-wrap mt-4">
                  {selectedArticle.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-light-border p-6 text-center text-gray-500">
                <p className="text-sm">Select an article to read</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
