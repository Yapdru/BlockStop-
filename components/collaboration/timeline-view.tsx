"use client";

import { TimelineEvent } from "@/types/collaboration";

interface TimelineViewProps {
  events: TimelineEvent[];
  incidentId: string;
  onAddEvent?: (event: Omit<TimelineEvent, "id">) => void;
}

export default function TimelineView({
  events,
  incidentId,
  onAddEvent,
}: TimelineViewProps) {
  const typeIcons = {
    detection: "🔍",
    investigation: "🔎",
    action: "⚡",
    note: "📝",
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-white rounded-lg border border-light-border p-6">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 to-gray-200" />

        <div className="space-y-6 pl-16">
          {sortedEvents.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <p>No timeline events yet</p>
            </div>
          ) : (
            sortedEvents.map((event) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-9 top-1 w-6 h-6 rounded-full bg-white border-2 border-primary-500 flex items-center justify-center">
                  <span className="text-xs">{typeIcons[event.type]}</span>
                </div>

                <div className="bg-light-surface rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {event.type.toUpperCase()}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">by {event.author}</p>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="text-xs text-gray-500">
                        {Object.entries(event.metadata).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="mr-3">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
