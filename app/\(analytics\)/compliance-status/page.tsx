"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ComplianceScorecard from "@/components/analytics/compliance-scorecard";

export default function ComplianceStatusPage() {
  const [selectedFramework, setSelectedFramework] = useState<"iso27001" | "hipaa" | "cis">("iso27001");

  const frameworks = {
    iso27001: {
      name: "ISO 27001",
      overallScore: 87,
      controls: [
        {
          id: "1",
          name: "Access Control",
          standard: "A.9",
          status: "compliant" as const,
          score: 95,
          evidenceCount: 12,
          lastAudited: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          name: "Cryptography",
          standard: "A.10",
          status: "compliant" as const,
          score: 92,
          evidenceCount: 8,
          lastAudited: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          name: "Physical Controls",
          standard: "A.11",
          status: "partial" as const,
          score: 78,
          evidenceCount: 5,
          lastAudited: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "4",
          name: "Incident Management",
          standard: "A.16",
          status: "compliant" as const,
          score: 88,
          evidenceCount: 15,
          lastAudited: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "5",
          name: "Risk Assessment",
          standard: "A.12",
          status: "compliant" as const,
          score: 82,
          evidenceCount: 10,
          lastAudited: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "6",
          name: "Business Continuity",
          standard: "A.17",
          status: "non-compliant" as const,
          score: 65,
          evidenceCount: 3,
          lastAudited: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    hipaa: {
      name: "HIPAA",
      overallScore: 92,
      controls: [
        {
          id: "1",
          name: "Patient Privacy",
          standard: "164.501",
          status: "compliant" as const,
          score: 98,
          evidenceCount: 20,
          lastAudited: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          name: "Security Rule",
          standard: "164.306",
          status: "compliant" as const,
          score: 90,
          evidenceCount: 18,
          lastAudited: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          name: "Breach Notification",
          standard: "164.400",
          status: "compliant" as const,
          score: 88,
          evidenceCount: 12,
          lastAudited: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    cis: {
      name: "CIS Controls",
      overallScore: 79,
      controls: [
        {
          id: "1",
          name: "Inventory and Control",
          standard: "v8.1",
          status: "compliant" as const,
          score: 85,
          evidenceCount: 14,
          lastAudited: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          name: "Access Control",
          standard: "v8.2",
          status: "partial" as const,
          score: 72,
          evidenceCount: 7,
          lastAudited: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          name: "Data Protection",
          standard: "v8.3",
          status: "compliant" as const,
          score: 80,
          evidenceCount: 10,
          lastAudited: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  };

  const current = frameworks[selectedFramework];

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
            ✅ Compliance Status
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Framework compliance and control assessments
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[
            { label: "Frameworks", value: "3", icon: "📋" },
            {
              label: "Total Controls",
              value: Object.values(frameworks).reduce(
                (sum, f) => sum + f.controls.length,
                0
              ),
              icon: "⚙️",
            },
            { label: "Avg Compliance", value: "86%", icon: "✅" },
          ].map((card, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-xl p-6 shadow-lg border border-light-border"
              whileHover={{ y: -5 }}
            >
              <p className="text-gray-600 text-sm mb-2">{card.label}</p>
              <p className="text-4xl font-bold text-gray-900">{card.value}</p>
              <p className="text-2xl mt-2">{card.icon}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Framework Selection */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-light-border p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-semibold text-gray-900 mb-4">
            Select Compliance Framework
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["iso27001", "hipaa", "cis"] as const).map((fk) => {
              const f = frameworks[fk];
              return (
                <motion.button
                  key={fk}
                  onClick={() => setSelectedFramework(fk)}
                  className={`p-6 rounded-lg border-2 transition ${
                    selectedFramework === fk
                      ? "border-primary-600 bg-primary-50"
                      : "border-light-border hover:border-primary-600"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h4 className="font-bold text-lg text-gray-900">{f.name}</h4>
                  <p className={`text-3xl font-bold mt-2 ${
                    f.overallScore >= 80
                      ? "text-green-600"
                      : f.overallScore >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}>
                    {f.overallScore}%
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {f.controls.length} controls
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Compliance Scorecard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ComplianceScorecard
            controls={current.controls}
            overallScore={current.overallScore}
            framework={current.name}
          />
        </motion.div>

        {/* Action Items */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-light-border p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            📋 Remediation Items
          </h3>
          <div className="space-y-3">
            {[
              {
                item: "Update disaster recovery procedures",
                priority: "high",
                dueDate: "2024-07-15",
              },
              {
                item: "Complete physical security audit",
                priority: "high",
                dueDate: "2024-07-22",
              },
              {
                item: "Review access control policies",
                priority: "medium",
                dueDate: "2024-08-01",
              },
              {
                item: "Update incident response plan",
                priority: "medium",
                dueDate: "2024-08-15",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-light-surface rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.item}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {item.priority.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
