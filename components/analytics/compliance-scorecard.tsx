"use client";

import { motion } from "framer-motion";

interface ComplianceControl {
  id: string;
  name: string;
  standard: string;
  status: "compliant" | "non-compliant" | "partial";
  score: number;
  evidenceCount: number;
  lastAudited: string;
}

interface ComplianceScorecardProps {
  controls: ComplianceControl[];
  overallScore: number;
  framework: string;
}

export default function ComplianceScorecard({
  controls,
  overallScore,
  framework,
}: ComplianceScorecardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      compliant: "bg-green-100 text-green-700 border-green-300",
      "non-compliant": "bg-red-100 text-red-700 border-red-300",
      partial: "bg-yellow-100 text-yellow-700 border-yellow-300",
    };
    return colors[status] || colors.compliant;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header with Score */}
      <div className="px-6 py-6 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-light-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{framework}</h3>
            <p className="text-sm text-gray-600 mt-1">Compliance Framework</p>
          </div>
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl font-bold text-primary-600">
              {overallScore}%
            </div>
            <p className="text-xs text-gray-600 font-semibold mt-1">
              Overall Score
            </p>
          </motion.div>
        </div>
      </div>

      {/* Controls List */}
      <div className="divide-y divide-light-border">
        {controls.map((control, index) => (
          <motion.div
            key={control.id}
            className="px-6 py-4 hover:bg-light-surface transition"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{control.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Standard: {control.standard}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                  <span>{control.evidenceCount} pieces of evidence</span>
                  <span>
                    Last audited:{" "}
                    {new Date(control.lastAudited).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`inline-block px-4 py-2 rounded-lg border mb-3 font-semibold text-sm ${getStatusColor(
                    control.status
                  )}`}
                >
                  {control.status.replace("-", " ").toUpperCase()}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${getScoreColor(control.score)}`}>
                    {control.score}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-light-surface border-t border-light-border">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-700">Compliance Progress</span>
          <span className="text-gray-600">
            {controls.filter((c) => c.status === "compliant").length} of{" "}
            {controls.length}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-600 to-green-400"
            initial={{ width: 0 }}
            animate={{
              width: `${(
                (controls.filter((c) => c.status === "compliant").length /
                  controls.length) *
                100
              ).toFixed(0)}%`,
            }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
