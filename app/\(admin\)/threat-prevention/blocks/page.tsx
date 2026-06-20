"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ActionButtons from "@/components/threat-prevention/action-buttons";

interface Block {
  id: string;
  target: string;
  reason: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: string;
  duration?: string;
  count: number;
}

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "critical" | "active">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const response = await fetch("/api/threat-prevention/blocks");
        const data = await response.json();
        setBlocks(data.blocks || []);
      } catch (error) {
        console.error("Error fetching blocks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  const filteredBlocks = blocks.filter((block) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "critical" && block.severity === "critical") ||
      (filter === "active" && !block.duration);
    const matchesSearch =
      block.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-blue-100 text-blue-700",
    };
    return colors[severity] || colors.low;
  };

  const actions = [
    {
      label: "Clear All Blocks",
      icon: "🗑️",
      onClick: () => alert("Clear all blocks?"),
      color: "red" as const,
    },
    {
      label: "Export List",
      icon: "📥",
      onClick: () => alert("Export initiated"),
      color: "primary" as const,
    },
    {
      label: "Back to Dashboard",
      icon: "🏠",
      onClick: () => (window.location.href = "/threat-prevention/dashboard"),
      color: "primary" as const,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/threat-prevention/dashboard"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            🚫 Block Management
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[
            { label: "Total Blocks", value: blocks.length, icon: "🚫" },
            {
              label: "Critical",
              value: blocks.filter((b) => b.severity === "critical").length,
              icon: "🔴",
            },
            {
              label: "Active",
              value: blocks.filter((b) => !b.duration).length,
              icon: "⏱️",
            },
            {
              label: "This Week",
              value: blocks.length,
              icon: "📅",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-xl p-6 shadow-lg border border-light-border"
              whileHover={{ y: -5 }}
            >
              <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-2xl mt-2">{stat.icon}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ActionButtons actions={actions} layout="horizontal" />
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-light-border p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search blocks by target or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "critical", "active"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    filter === f
                      ? "bg-primary-600 text-white"
                      : "bg-light-surface text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Blocks Table */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-surface border-b border-light-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="animate-spin text-primary-600">⏳</div>
                    </td>
                  </tr>
                ) : filteredBlocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                      No blocks found
                    </td>
                  </tr>
                ) : (
                  filteredBlocks.map((block) => (
                    <tr key={block.id} className="hover:bg-light-surface transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {block.target}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {block.reason}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(
                            block.severity
                          )}`}
                        >
                          {block.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {block.count}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {block.duration || "Ongoing"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(block.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
