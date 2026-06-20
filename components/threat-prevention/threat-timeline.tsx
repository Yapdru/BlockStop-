"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TimelineEvent {
  id: string;
  type: "block" | "detection" | "policy" | "alert";
  title: string;
  description: string;
  timestamp: string;
  severity: "critical" | "high" | "medium" | "low";
  icon: string;
}

interface ThreatTimelineProps {
  limit?: number;
}

export default function ThreatTimeline({ limit = 15 }: ThreatTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `/api/threat-prevention/timeline?limit=${limit}`
        );
        const data = await response.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error("Error fetching timeline:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [limit]);

  const getEventColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "border-red-500 bg-red-50",
      high: "border-orange-500 bg-orange-50",
      medium: "border-yellow-500 bg-yellow-50",
      low: "border-blue-500 bg-blue-50",
    };
    return colors[severity] || colors.low;
  };

  const getIconColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "text-red-600",
      high: "text-orange-600",
      medium: "text-yellow-600",
      low: "text-blue-600",
    };
    return colors[severity] || colors.low;
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg border border-light-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-6 py-4 border-b border-light-border bg-light-surface">
        <h3 className="text-lg font-semibold text-gray-900">Threat Timeline</h3>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-primary-600 text-2xl">⏳</div>
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No events recorded</p>
        ) : (
          <div className="space-y-6 relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-600 to-transparent" />

            {events.map((event, index) => (
              <motion.div
                key={event.id}
                className="pl-16 relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 w-12 h-12 rounded-full ${getEventColor(
                    event.severity
                  )} border-4 flex items-center justify-center text-lg`}
                >
                  {event.icon}
                </div>

                {/* Event card */}
                <div
                  className={`p-4 rounded-lg border-l-4 ${getEventColor(
                    event.severity
                  )} bg-white`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {event.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-4 ${
                        event.severity === "critical"
                          ? "bg-red-100 text-red-700"
                          : event.severity === "high"
                          ? "bg-orange-100 text-orange-700"
                          : event.severity === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {event.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
