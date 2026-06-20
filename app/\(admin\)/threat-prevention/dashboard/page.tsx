"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import BlockHistory from "@/components/threat-prevention/block-history";
import ThreatTimeline from "@/components/threat-prevention/threat-timeline";
import ActionButtons from "@/components/threat-prevention/action-buttons";

interface DashboardStats {
  activeBlocks: number;
  blocksToday: number;
  threatsDetected: number;
  systemHealth: number;
  policiesActive: number;
  whitelistEntries: number;
}

export default function ThreatPreventionDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeBlocks: 0,
    blocksToday: 0,
    threatsDetected: 0,
    systemHealth: 0,
    policiesActive: 0,
    whitelistEntries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/threat-prevention/stats");
        const data = await response.json();
        setStats(data.stats || {});
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const actions = [
    {
      label: "View Blocks",
      icon: "🚫",
      onClick: () => (window.location.href = "/threat-prevention/blocks"),
      color: "primary" as const,
    },
    {
      label: "Manage Policies",
      icon: "⚙️",
      onClick: () => (window.location.href = "/threat-prevention/policies"),
      color: "primary" as const,
    },
    {
      label: "Export Report",
      icon: "📊",
      onClick: () => alert("Export initiated"),
      color: "green" as const,
    },
    {
      label: "System Health",
      icon: "💚",
      onClick: () => alert("System Health: " + stats.systemHealth + "%"),
      color: "primary" as const,
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-primary-600 hover:text-primary-700">
              ← Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              🛡️ Threat Prevention Dashboard
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[
            {
              label: "Active Blocks",
              value: stats.activeBlocks,
              icon: "🚫",
              color: "red",
            },
            {
              label: "Blocks Today",
              value: stats.blocksToday,
              icon: "📈",
              color: "orange",
            },
            {
              label: "Threats Detected",
              value: stats.threatsDetected,
              icon: "⚠️",
              color: "yellow",
            },
            {
              label: "Policies Active",
              value: stats.policiesActive,
              icon: "⚙️",
              color: "blue",
            },
            {
              label: "Whitelist Entries",
              value: stats.whitelistEntries,
              icon: "✅",
              color: "green",
            },
            {
              label: "System Health",
              value: stats.systemHealth + "%",
              icon: "💚",
              color: "primary",
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

        {/* Action Buttons */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ActionButtons actions={actions} layout="horizontal" />
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Block History */}
          <div className="lg:col-span-2">
            <BlockHistory limit={8} showPagination={false} />
          </div>

          {/* Quick Stats */}
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-light-border p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Quick Stats
            </h3>
            <div className="space-y-6">
              {[
                { label: "Block Rate", value: "94%", color: "green" },
                { label: "False Positives", value: "0.2%", color: "blue" },
                { label: "Response Time", value: "12ms", color: "primary" },
                { label: "Uptime", value: "99.99%", color: "green" },
              ].map((item, i) => (
                <div key={i} className="pb-4 border-b border-light-border last:border-0">
                  <p className="text-sm text-gray-600 mb-2">{item.label}</p>
                  <p
                    className={`text-2xl font-bold ${
                      item.color === "green"
                        ? "text-green-600"
                        : item.color === "blue"
                        ? "text-blue-600"
                        : "text-primary-600"
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Threat Timeline */}
        <div className="mt-8">
          <ThreatTimeline limit={10} />
        </div>
      </div>
    </main>
  );
}
