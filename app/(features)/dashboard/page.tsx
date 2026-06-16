"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface ScanItem {
  id: number;
  email?: string;
  fileName?: string;
  riskScore?: number;
  threatLevel?: string;
  threats: string[];
  createdAt: string;
}

export default function Dashboard() {
  const [emailHistory, setEmailHistory] = useState<ScanItem[]>([]);
  const [fileHistory, setFileHistory] = useState<ScanItem[]>([]);
  const [activeTab, setActiveTab] = useState<"email" | "file">("email");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [emailRes, fileRes] = await Promise.all([
          fetch("/api/email/history"),
          fetch("/api/file/results"),
        ]);

        const emailData = await emailRes.json();
        const fileData = await fileRes.json();

        setEmailHistory(emailData.history || []);
        setFileHistory(fileData.results || []);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const stats = {
    totalScans: emailHistory.length + fileHistory.length,
    threatsDetected: emailHistory.filter(
      (e) => e.riskScore && e.riskScore > 50
    ).length,
    malwareFound: fileHistory.filter((f) => f.threatLevel === "dangerous")
      .length,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary-600 hover:text-primary-700">
              ← Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[
            {
              label: "Total Scans",
              value: stats.totalScans,
              icon: "📋",
              color: "primary",
            },
            {
              label: "Threats Detected",
              value: stats.threatsDetected,
              icon: "⚠️",
              color: "yellow",
            },
            {
              label: "Malware Found",
              value: stats.malwareFound,
              icon: "🦠",
              color: "red",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-xl p-6 shadow-lg border border-light-border"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className="text-5xl opacity-50">{stat.icon}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex border-b border-light-border">
            <button
              onClick={() => setActiveTab("email")}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === "email"
                  ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📧 Email Scans ({emailHistory.length})
            </button>
            <button
              onClick={() => setActiveTab("file")}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === "file"
                  ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📁 File Scans ({fileHistory.length})
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-surface border-b border-light-border">
                <tr>
                  {activeTab === "email" ? (
                    <>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Email Content
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Risk Score
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        File Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Threat Level
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Threats
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="animate-spin text-primary-600">⏳</div>
                    </td>
                  </tr>
                ) : activeTab === "email" && emailHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                      No email scans yet
                    </td>
                  </tr>
                ) : activeTab === "file" && fileHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                      No file scans yet
                    </td>
                  </tr>
                ) : activeTab === "email" ? (
                  emailHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-light-surface transition">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.email?.substring(0, 50)}...
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full font-semibold text-xs ${
                            item.riskScore! > 70
                              ? "bg-red-100 text-red-700"
                              : item.riskScore! > 40
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.riskScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.threats.length > 0
                          ? item.threats[0]
                          : "No threats"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  fileHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-light-surface transition">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.fileName}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full font-semibold text-xs ${
                            item.threatLevel === "dangerous"
                              ? "bg-red-100 text-red-700"
                              : item.threatLevel === "warning"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.threatLevel?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.threats.length > 0
                          ? item.threats[0]
                          : "No threats"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString()}
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
