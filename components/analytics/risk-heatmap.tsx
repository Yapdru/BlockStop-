"use client";

import { motion } from "framer-motion";

interface RiskData {
  category: string;
  riskLevel: number; // 0-100
  threatCount: number;
  trend: "up" | "down" | "stable";
}

interface RiskHeatmapProps {
  data: RiskData[];
  title: string;
}

export default function RiskHeatmap({ data, title }: RiskHeatmapProps) {
  const getRiskColor = (level: number) => {
    if (level >= 80) return "bg-red-500 text-white";
    if (level >= 60) return "bg-orange-500 text-white";
    if (level >= 40) return "bg-yellow-500 text-gray-900";
    if (level >= 20) return "bg-green-400 text-gray-900";
    return "bg-green-600 text-white";
  };

  const getTrendIcon = (trend: string) => {
    const icons: Record<string, string> = {
      up: "📈",
      down: "📉",
      stable: "→",
    };
    return icons[trend] || "→";
  };

  const getTrendColor = (trend: string) => {
    const colors: Record<string, string> = {
      up: "text-red-600",
      down: "text-green-600",
      stable: "text-gray-600",
    };
    return colors[trend] || colors.stable;
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
          {data.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{item.category}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getTrendColor(item.trend)}`}>
                    {getTrendIcon(item.trend)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.threatCount} threats
                  </span>
                </div>
              </div>

              <div className="relative w-full h-12 bg-gray-100 rounded-lg overflow-hidden">
                <motion.div
                  className={`h-full flex items-center justify-center font-bold ${getRiskColor(
                    item.riskLevel
                  )}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.riskLevel}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {item.riskLevel > 15 && <span>{item.riskLevel}%</span>}
                </motion.div>
                {item.riskLevel <= 15 && (
                  <span className="absolute inset-0 flex items-center justify-center font-bold text-gray-900">
                    {item.riskLevel}%
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                <span>Low Risk</span>
                <span>High Risk</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-light-border">
          <p className="text-xs font-semibold text-gray-700 mb-3">Risk Levels:</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-500" />
              <span>Critical (80+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-orange-500" />
              <span>High (60-79)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-yellow-500" />
              <span>Medium (40-59)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-600" />
              <span>Low (0-39)</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
