"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ThreatTrends from "@/components/analytics/threat-trends";

interface TrendData {
  period: string;
  threats: number;
  blocks: number;
  alerts: number;
}

export default function RiskAssessmentPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("week");

  const trendData: Record<string, TrendData[]> = {
    week: [
      { period: "Mon", threats: 34, blocks: 28, alerts: 12 },
      { period: "Tue", threats: 42, blocks: 35, alerts: 18 },
      { period: "Wed", threats: 38, blocks: 32, alerts: 14 },
      { period: "Thu", threats: 51, blocks: 44, alerts: 22 },
      { period: "Fri", threats: 45, blocks: 38, alerts: 19 },
      { period: "Sat", threats: 28, blocks: 22, alerts: 9 },
      { period: "Sun", threats: 31, blocks: 25, alerts: 11 },
    ],
    month: [
      { period: "Week 1", threats: 245, blocks: 201, alerts: 87 },
      { period: "Week 2", threats: 289, blocks: 237, alerts: 104 },
      { period: "Week 3", threats: 267, blocks: 218, alerts: 96 },
      { period: "Week 4", threats: 312, blocks: 256, alerts: 118 },
    ],
    quarter: [
      { period: "Jan", threats: 1024, blocks: 842, alerts: 367 },
      { period: "Feb", threats: 1156, blocks: 951, alerts: 412 },
      { period: "Mar", threats: 1089, blocks: 894, alerts: 388 },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-light-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 flex items-center gap-2"
          >
            ← Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            📊 Risk Assessment
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Threat trends and risk metrics over time
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Risk Score Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[
            { label: "Overall Risk", value: "62%", color: "orange", icon: "⚠️" },
            { label: "Critical Issues", value: "3", color: "red", icon: "🔴" },
            { label: "Trend", value: "Stable", color: "green", icon: "→" },
            { label: "30-Day Change", value: "+8%", color: "orange", icon: "📈" },
          ].map((card, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-xl p-6 shadow-lg border border-light-border"
              whileHover={{ y: -5 }}
            >
              <p className="text-gray-600 text-sm mb-2">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-2xl mt-2">{card.icon}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Time Range Selector */}
        <motion.div
          className="flex gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {(["week", "month", "quarter"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                timeRange === range
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 border border-light-border hover:bg-light-surface"
              }`}
            >
              {range === "week"
                ? "Last Week"
                : range === "month"
                ? "Last Month"
                : "Last Quarter"}
            </button>
          ))}
        </motion.div>

        {/* Threat Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ThreatTrends data={trendData[timeRange]} timeRange={`Last ${
            timeRange === "week"
              ? "7 Days"
              : timeRange === "month"
              ? "30 Days"
              : "90 Days"
          }`} />
        </motion.div>

        {/* Risk Factors */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* High Risk Factors */}
          <div className="bg-white rounded-xl shadow-lg border border-light-border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">🔴</span>
              High Risk Factors
            </h3>
            <div className="space-y-4">
              {[
                {
                  factor: "Unpatched Systems",
                  impact: "Critical",
                  systems: 12,
                },
                {
                  factor: "Weak Credentials",
                  impact: "High",
                  systems: 34,
                },
                {
                  factor: "Open Ports",
                  impact: "High",
                  systems: 8,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {item.factor}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.systems} systems affected
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-700">
                      {item.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remediation Progress */}
          <div className="bg-white rounded-xl shadow-lg border border-light-border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Remediation Progress
            </h3>
            <div className="space-y-6">
              {[
                {
                  item: "System Patches",
                  progress: 78,
                  target: 100,
                  color: "bg-green-600",
                },
                {
                  item: "MFA Deployment",
                  progress: 92,
                  target: 100,
                  color: "bg-green-600",
                },
                {
                  item: "Security Training",
                  progress: 65,
                  target: 100,
                  color: "bg-yellow-600",
                },
                {
                  item: "Vulnerability Scans",
                  progress: 45,
                  target: 100,
                  color: "bg-orange-600",
                },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">
                      {item.item}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={item.color}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-light-border p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            💡 Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: "🔧",
                title: "Patch Management",
                desc: "Prioritize patching 12 critical systems within 30 days",
              },
              {
                icon: "🔐",
                title: "Access Control",
                desc: "Enforce MFA organization-wide by end of Q3",
              },
              {
                icon: "📚",
                title: "Security Training",
                desc: "Complete annual security awareness training (35% done)",
              },
              {
                icon: "🔍",
                title: "Vulnerability Scanning",
                desc: "Conduct monthly vulnerability scans on all systems",
              },
            ].map((rec, i) => (
              <div
                key={i}
                className="p-4 bg-light-surface rounded-lg border border-light-border"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{rec.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
