"use client";

import { motion } from "framer-motion";

interface AttackStep {
  id: string;
  phase: string;
  technique: string;
  description: string;
  detectionRate: number;
  mitigations: string[];
}

interface AttackChainDiagramProps {
  chain: AttackStep[];
  title: string;
}

export default function AttackChainDiagram({
  chain,
  title,
}: AttackChainDiagramProps) {
  const getDetectionColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-6 py-4 border-b border-light-border bg-light-surface">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {chain.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Arrow between steps */}
              {index > 0 && (
                <div className="flex items-center justify-center mb-4">
                  <div className="text-2xl text-primary-600">↓</div>
                </div>
              )}

              {/* Step card */}
              <div className="p-4 bg-light-surface rounded-lg border-2 border-primary-200 hover:border-primary-400 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">
                        {index + 1}
                      </span>
                      <h4 className="font-semibold text-gray-900">
                        {step.phase}: {step.technique}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 ml-9 mb-3">
                      {step.description}
                    </p>
                    <div className="ml-9 space-y-2">
                      <p className="text-xs font-semibold text-gray-700">
                        Recommended Mitigations:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {step.mitigations.map((mitigation, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-700 font-semibold"
                          >
                            {mitigation}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 font-semibold mb-1">
                      Detection Rate
                    </p>
                    <p
                      className={`text-xl font-bold ${getDetectionColor(
                        step.detectionRate
                      )}`}
                    >
                      {step.detectionRate}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
