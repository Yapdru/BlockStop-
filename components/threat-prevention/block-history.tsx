"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface BlockRecord {
  id: string;
  target: string;
  reason: string;
  timestamp: string;
  severity: "critical" | "high" | "medium" | "low";
  duration?: string;
}

interface BlockHistoryProps {
  limit?: number;
  showPagination?: boolean;
}

export default function BlockHistory({
  limit = 10,
  showPagination = true,
}: BlockHistoryProps) {
  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const response = await fetch(
          `/api/threat-prevention/blocks?page=${page}&limit=${limit}`
        );
        const data = await response.json();
        setBlocks(data.blocks || []);
      } catch (error) {
        console.error("Error fetching blocks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, [page, limit]);

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-blue-100 text-blue-700",
    };
    return colors[severity] || colors.low;
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-6 py-4 border-b border-light-border bg-light-surface">
        <h3 className="text-lg font-semibold text-gray-900">Block History</h3>
      </div>

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
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <div className="animate-spin text-primary-600">⏳</div>
                </td>
              </tr>
            ) : blocks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                  No blocks recorded
                </td>
              </tr>
            ) : (
              blocks.map((block) => (
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
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(block.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {block.duration || "Ongoing"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="px-6 py-4 border-t border-light-border flex justify-between items-center bg-light-surface">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={blocks.length < limit}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition"
          >
            Next →
          </button>
        </div>
      )}
    </motion.div>
  );
}
