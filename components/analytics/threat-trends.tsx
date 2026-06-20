"use client";

import { motion } from "framer-motion";

interface TrendData {
  period: string;
  threats: number;
  blocks: number;
  alerts: number;
}

interface ThreatTrendsProps {
  data: TrendData[];
  timeRange: string;
}

export default function ThreatTrends({
  data,
  timeRange,
}: ThreatTrendsProps) {
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.threats, d.blocks, d.alerts))
  );

  const getBarHeight = (value: number) => {
    return (value / maxValue) * 100;
  };

  const stats = {
    totalThreats: data.reduce((sum, d) => sum + d.threats, 0),
    totalBlocks: data.reduce((sum, d) => sum + d.blocks, 0),
    totalAlerts: data.reduce((sum, d) => sum + d.alerts, 0),
    avgThreats:
      Math.round(
        data.reduce((sum, d) => sum + d.threats, 0) / data.length
      ),
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-6 py-4 border-b border-light-border bg-light-surface flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Threat Trends</h3>
        <span className="text-sm text-gray-600">{timeRange}</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 px-6 py-6 border-b border-light-border bg-light-surface">
        {[
          { label: "Total Threats", value: stats.totalThreats, color: "red" },
          { label: "Total Blocks", value: stats.totalBlocks, color: "green" },
          { label: "Total Alerts", value: stats.totalAlerts, color: "orange" },
          { label: "Avg Daily", value: stats.avgThreats, color: "blue" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            className="p-3 rounded-lg bg-white border border-light-border"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-xs text-gray-600 font-semibold mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="px-6 py-8">
        <div className="flex items-end justify-between gap-2 h-60">
          {data.map((item, index) => (
            <motion.div
              key={index}
              className="flex-1 flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Bar Group */}
              <div className="flex items-end justify-center gap-1 h-40 w-full">
                {/* Threats Bar */}
                <motion.div
                  className="flex-1 bg-red-600 rounded-t-lg hover:bg-red-700 transition cursor-pointer relative group"
                  initial={{ height: 0 }}
                  animate={{ height: `${getBarHeight(item.threats)}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {item.threats}
                  </div>
                </motion.div>

                {/* Blocks Bar */}
                <motion.div
                  className="flex-1 bg-green-600 rounded-t-lg hover:bg-green-700 transition cursor-pointer relative group"
                  initial={{ height: 0 }}
                  animate={{ height: `${getBarHeight(item.blocks)}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05 + 0.1 }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {item.blocks}
                  </div>
                </motion.div>

                {/* Alerts Bar */}
                <motion.div
                  className="flex-1 bg-orange-600 rounded-t-lg hover:bg-orange-700 transition cursor-pointer relative group"
                  initial={{ height: 0 }}
                  animate={{ height: `${getBarHeight(item.alerts)}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05 + 0.2 }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {item.alerts}
                  </div>
                </motion.div>
              </div>

              {/* Label */}
              <span className="text-xs font-semibold text-gray-600 text-center mt-2">
                {item.period}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-6 justify-center mt-8 pt-6 border-t border-light-border">
          {[
            { color: "bg-red-600", label: "Threats" },
            { color: "bg-green-600", label: "Blocks" },
            { color: "bg-orange-600", label: "Alerts" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="text-sm text-gray-600 font-semibold">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
