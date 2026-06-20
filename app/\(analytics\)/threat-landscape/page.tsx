"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import RiskHeatmap from "@/components/analytics/risk-heatmap";

interface RiskData {
  category: string;
  riskLevel: number;
  threatCount: number;
  trend: "up" | "down" | "stable";
}

export default function ThreatLandscapePage() {
  const [riskData, setRiskData] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/analytics/threat-landscape");
        const data = await response.json();
        setRiskData(data.riskData || []);
      } catch (error) {
        console.error("Error fetching threat landscape:", error);
        // Mock data
        setRiskData([
          {
            category: "Malware",
            riskLevel: 75,
            threatCount: 342,
            trend: "up",
          },
          {
            category: "Phishing",
            riskLevel: 68,
            threatCount: 289,
            trend: "stable",
          },
          {
            category: "Zero-Day",
            riskLevel: 85,
            threatCount: 12,
            trend: "up",
          },
          {
            category: "DDoS",
            riskLevel: 45,
            threatCount: 156,
            trend: "down",
          },
          {
            category: "Ransomware",
            riskLevel: 82,
            threatCount: 67,
            trend: "up",
          },
          {
            category: "Data Exfiltration",
            riskLevel: 72,
            threatCount: 234,
            trend: "stable",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
            🌍 Threat Landscape
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Global threat distribution and risk assessment
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[
            {
              label: "Critical Threats",
              value: "24",
              icon: "🔴",
              trend: "+12%",
            },
            {
              label: "Avg Risk Level",
              value: "72%",
              icon: "📊",
              trend: "+5%",
            },
            {
              label: "Monitored Categories",
              value: "18",
              icon: "📁",
              trend: "Stable",
            },
            {
              label: "Active Incidents",
              value: "7",
              icon: "🚨",
              trend: "-3%",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-xl p-6 shadow-lg border border-light-border"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-2">{card.label}</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">{card.trend}</p>
                </div>
                <div className="text-5xl opacity-50">{card.icon}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Risk Heatmap */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <RiskHeatmap data={riskData} title="Threat Risk Heatmap" />
          </motion.div>
        )}

        {/* Geographic Distribution */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-light-border p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            📍 Geographic Threat Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                Top Threat Origins
              </h4>
              <div className="space-y-3">
                {[
                  { country: "China", count: 1240, percentage: 28 },
                  { country: "Russia", count: 1100, percentage: 25 },
                  { country: "North Korea", count: 780, percentage: 18 },
                  { country: "Iran", count: 560, percentage: 13 },
                  { country: "Other", count: 520, percentage: 16 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {item.country}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                Most Targeted Regions
              </h4>
              <div className="space-y-3">
                {[
                  { region: "North America", attacks: 2340, icon: "🇺🇸" },
                  { region: "Europe", attacks: 1890, icon: "🇪🇺" },
                  { region: "Asia Pacific", attacks: 1650, icon: "🇦🇺" },
                  { region: "Middle East", attacks: 890, icon: "🇸🇦" },
                  { region: "Latin America", attacks: 560, icon: "🇧🇷" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-light-surface rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-medium text-gray-900">
                        {item.region}
                      </span>
                    </div>
                    <span className="font-semibold text-primary-600">
                      {item.attacks}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Threat Categories */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-light-border p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            🎯 Threat Categories Over Time
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: "APT", count: 34, color: "bg-red-100 text-red-700" },
              { name: "Malware", count: 342, color: "bg-orange-100 text-orange-700" },
              { name: "Phishing", count: 289, color: "bg-yellow-100 text-yellow-700" },
              { name: "Ransomware", count: 67, color: "bg-red-100 text-red-700" },
              { name: "DDoS", count: 156, color: "bg-blue-100 text-blue-700" },
              {
                name: "Supply Chain",
                count: 89,
                color: "bg-purple-100 text-purple-700",
              },
            ].map((cat, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg ${cat.color} text-center`}
              >
                <p className="font-semibold text-lg">{cat.count}</p>
                <p className="text-sm font-medium mt-1">{cat.name}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
