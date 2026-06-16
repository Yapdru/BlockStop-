import { motion } from "framer-motion";
import { RiskScore } from "./RiskScore";
import { ThreatBadge } from "./ThreatBadge";

interface ResultCardProps {
  title: string;
  riskScore?: number;
  threatLevel?: "safe" | "warning" | "dangerous";
  threats: string[];
  timestamp?: string;
  details?: Record<string, unknown>;
}

export function ResultCard({
  title,
  riskScore,
  threatLevel,
  threats,
  timestamp,
  details,
}: ResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-8 border border-light-border"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          {timestamp && (
            <p className="text-sm text-gray-600 mt-1">
              {new Date(timestamp).toLocaleString()}
            </p>
          )}
        </div>
        {riskScore !== undefined && <RiskScore score={riskScore} size="md" />}
        {threatLevel && <ThreatBadge level={threatLevel} size="lg" />}
      </div>

      {/* Threats Section */}
      {threats.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Detected Threats</h4>
          <ul className="space-y-2">
            {threats.map((threat, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-700">
                <span className="text-red-500">•</span>
                {threat}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Details Section */}
      {details && Object.keys(details).length > 0 && (
        <div className="mb-6 grid md:grid-cols-2 gap-4">
          {Object.entries(details).map(([key, value]) => (
            <div key={key} className="p-3 bg-light-surface rounded-lg">
              <p className="text-xs text-gray-600 font-semibold uppercase">
                {key.replace(/_/g, " ")}
              </p>
              <p className="text-gray-900 font-semibold mt-1">
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition font-medium">
          📥 Export
        </button>
        <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
          🔗 Share
        </button>
      </div>
    </motion.div>
  );
}
