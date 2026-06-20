"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PolicyBuilder from "@/components/threat-prevention/policy-builder";
import WhitelistManager from "@/components/threat-prevention/whitelist-manager";
import ActionButtons from "@/components/threat-prevention/action-buttons";

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState<"policies" | "whitelist">(
    "policies"
  );

  const actions = [
    {
      label: "Back to Dashboard",
      icon: "🏠",
      onClick: () => (window.location.href = "/threat-prevention/dashboard"),
      color: "primary" as const,
    },
    {
      label: "Sync Policies",
      icon: "🔄",
      onClick: () => alert("Syncing policies..."),
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
            ⚙️ Policies & Whitelist
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Actions */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ActionButtons actions={actions} layout="horizontal" />
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex border-b border-light-border">
            <button
              onClick={() => setActiveTab("policies")}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === "policies"
                  ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ⚙️ Policies
            </button>
            <button
              onClick={() => setActiveTab("whitelist")}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === "whitelist"
                  ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ✅ Whitelist
            </button>
          </div>

          <div className="p-6">
            {activeTab === "policies" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <PolicyBuilder />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <WhitelistManager />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            {
              title: "Policy Best Practices",
              icon: "📋",
              content: [
                "Create policies based on risk profiles",
                "Regularly review and update policies",
                "Test policies in sandbox environment",
                "Document all policy changes",
              ],
            },
            {
              title: "Whitelist Management",
              icon: "✅",
              content: [
                "Whitelist only trusted sources",
                "Review whitelisted items quarterly",
                "Maintain audit trail for all entries",
                "Use comments to document reasons",
              ],
            },
            {
              title: "Policy Deployment",
              icon: "🚀",
              content: [
                "Deploy during low-traffic periods",
                "Monitor system impact closely",
                "Have rollback plans ready",
                "Track policy effectiveness metrics",
              ],
            },
            {
              title: "Compliance Notes",
              icon: "📚",
              content: [
                "Ensure policies align with regulations",
                "Maintain documentation for audits",
                "Review with compliance team",
                "Track policy versions and history",
              ],
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-xl shadow-lg border border-light-border p-6"
              whileHover={{ y: -5 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <span className="text-2xl">{card.icon}</span>
                {card.title}
              </h3>
              <ul className="space-y-2">
                {card.content.map((item, j) => (
                  <li key={j} className="text-sm text-gray-600 flex items-start gap-3">
                    <span className="text-primary-600 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
