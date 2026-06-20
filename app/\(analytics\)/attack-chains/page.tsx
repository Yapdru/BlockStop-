"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import AttackChainDiagram from "@/components/analytics/attack-chain-diagram";

interface AttackChain {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  stepCount: number;
  frequency: number;
}

export default function AttackChainsPage() {
  const [chains, setChains] = useState<AttackChain[]>([]);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChains = async () => {
      try {
        const response = await fetch("/api/analytics/attack-chains");
        const data = await response.json();
        setChains(data.chains || []);
        if (data.chains && data.chains.length > 0) {
          setSelectedChain(data.chains[0].id);
        }
      } catch (error) {
        console.error("Error fetching attack chains:", error);
        // Mock data
        const mockChains: AttackChain[] = [
          {
            id: "1",
            name: "Emotet Campaign 2024",
            severity: "critical",
            stepCount: 7,
            frequency: 342,
          },
          {
            id: "2",
            name: "LockBit Ransomware Chain",
            severity: "critical",
            stepCount: 8,
            frequency: 189,
          },
          {
            id: "3",
            name: "Spear Phishing to Data Exfil",
            severity: "high",
            stepCount: 6,
            frequency: 267,
          },
          {
            id: "4",
            name: "Supply Chain Compromise",
            severity: "high",
            stepCount: 5,
            frequency: 45,
          },
        ];
        setChains(mockChains);
        setSelectedChain(mockChains[0].id);
      } finally {
        setLoading(false);
      }
    };

    fetchChains();
  }, []);

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-blue-100 text-blue-700",
    };
    return colors[severity] || colors.low;
  };

  // Mock attack chain data
  const mockChainDetails = {
    "1": [
      {
        id: "s1",
        phase: "Initial Access",
        technique: "Phishing Email",
        description:
          "Malicious email with compromised attachment sent to targets",
        detectionRate: 78,
        mitigations: ["Email filtering", "User training", "MFA"],
      },
      {
        id: "s2",
        phase: "Execution",
        technique: "Macro-based Exploit",
        description: "Malicious macro in Office document executes payload",
        detectionRate: 85,
        mitigations: ["Disable macros", "EDR solutions", "Sandbox"],
      },
      {
        id: "s3",
        phase: "Persistence",
        technique: "Registry Run Keys",
        description: "Modifies registry to maintain persistence",
        detectionRate: 72,
        mitigations: ["Registry monitoring", "AppLocker", "AMSI"],
      },
      {
        id: "s4",
        phase: "Privilege Escalation",
        technique: "Token Impersonation",
        description: "Escalates privileges using token impersonation",
        detectionRate: 68,
        mitigations: ["UAC hardening", "Privilege access mgmt", "Monitoring"],
      },
      {
        id: "s5",
        phase: "Defense Evasion",
        technique: "Obfuscation",
        description: "Code obfuscation to evade detection",
        detectionRate: 55,
        mitigations: ["Behavior analysis", "YARA rules", "Detonation"],
      },
      {
        id: "s6",
        phase: "Command & Control",
        technique: "DNS Tunneling",
        description: "Establishes C2 through DNS tunneling",
        detectionRate: 82,
        mitigations: ["DNS monitoring", "Network segmentation", "Proxy logs"],
      },
      {
        id: "s7",
        phase: "Data Exfiltration",
        technique: "Data Staging",
        description: "Stages and exfiltrates sensitive data",
        detectionRate: 76,
        mitigations: ["DLP solutions", "Network monitoring", "Encryption"],
      },
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
            🔗 Attack Chains
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Detailed analysis of adversary TTPs and attack sequences
          </p>
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
            { label: "Total Chains", value: chains.length, icon: "🔗" },
            { label: "Critical", value: chains.filter(c => c.severity === "critical").length, icon: "🔴" },
            { label: "Avg Steps", value: Math.round(chains.reduce((sum, c) => sum + c.stepCount, 0) / Math.max(chains.length, 1)), icon: "📊" },
            { label: "Total Observed", value: chains.reduce((sum, c) => sum + c.frequency, 0), icon: "👁️" },
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chains List */}
          <motion.div
            className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="px-6 py-4 border-b border-light-border bg-light-surface">
              <h3 className="font-semibold text-gray-900">Known Attack Chains</h3>
            </div>

            <div className="divide-y divide-light-border max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-6 py-8 text-center">
                  <div className="animate-spin text-primary-600">⏳</div>
                </div>
              ) : (
                chains.map((chain) => (
                  <motion.button
                    key={chain.id}
                    onClick={() => setSelectedChain(chain.id)}
                    className={`w-full text-left px-6 py-4 transition ${
                      selectedChain === chain.id
                        ? "bg-primary-50 border-l-4 border-primary-600"
                        : "hover:bg-light-surface"
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {chain.name}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(
                          chain.severity
                        )}`}
                      >
                        {chain.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-gray-600">
                      <span>{chain.stepCount} steps</span>
                      <span>{chain.frequency} observed</span>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>

          {/* Chain Details */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {selectedChain && chains.find((c) => c.id === selectedChain) && (
              <AttackChainDiagram
                chain={
                  mockChainDetails[selectedChain as keyof typeof mockChainDetails] ||
                  []
                }
                title={chains.find((c) => c.id === selectedChain)?.name || "Attack Chain"}
              />
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
