'use client';

import React, { useState } from 'react';

interface TimelineEvent {
  id: string;
  date: string | Date;
  timestamp?: number;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface TimelineProps {
  events: TimelineEvent[];
  title?: string;
  containerClassName?: string;
  onExportData?: () => void;
  orientation?: 'vertical' | 'horizontal';
  highlight?: string[];
  onEventClick?: (event: TimelineEvent) => void;
}

const severityColors = {
  low: 'bg-green-600',
  medium: 'bg-yellow-600',
  high: 'bg-orange-600',
  critical: 'bg-red-600',
};

const severityTextColors = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

export const Timeline: React.FC<TimelineProps> = ({
  events,
  title,
  containerClassName = '',
  onExportData,
  orientation = 'vertical',
  highlight = [],
  onEventClick,
}) => {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return orientation === 'vertical' ? dateB - dateA : dateA - dateB;
  });

  const handleExport = () => {
    if (onExportData) {
      onExportData();
    } else {
      const csv = [
        ['Date', 'Title', 'Description', 'Category', 'Severity'].join(','),
        ...sortedEvents.map((e) =>
          [
            new Date(e.date).toISOString(),
            e.title,
            e.description || '',
            e.category || 'N/A',
            e.severity || 'N/A',
          ]
            .map((v) => `"${v}"`)
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timeline-data.csv';
      a.click();
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (orientation === 'horizontal') {
    return (
      <div className={`w-full ${containerClassName}`}>
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            {events.length > 0 && (
              <button
                onClick={handleExport}
                className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Export CSV
              </button>
            )}
          </div>
        )}

        {/* Horizontal Timeline */}
        <div className="relative">
          <div className="flex overflow-x-auto gap-4 pb-4">
            {sortedEvents.map((event, index) => {
              const isHighlighted = highlight.includes(event.id);
              const isHovered = hoveredEvent === event.id;
              const severityLevel = event.severity || 'medium';

              return (
                <div
                  key={event.id}
                  className="flex-shrink-0 w-80"
                  onMouseEnter={() => setHoveredEvent(event.id)}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  <button
                    onClick={() => {
                      setExpandedEvent(
                        expandedEvent === event.id ? null : event.id
                      );
                      onEventClick?.(event);
                    }}
                    className={`w-full p-4 rounded-lg border transition-all cursor-pointer ${
                      isHighlighted
                        ? 'border-blue-500 bg-blue-950'
                        : 'border-slate-700 bg-slate-800'
                    } ${isHovered ? 'shadow-lg shadow-blue-500/50' : ''}`}
                  >
                    <div
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${severityColors[severityLevel]}`}
                    >
                      {severityLevel.toUpperCase()}
                    </div>

                    <p className="text-sm text-slate-400 mb-2">
                      {formatDate(event.date)}
                    </p>

                    <h4 className="text-sm font-bold text-slate-100 text-left mb-2">
                      {event.title}
                    </h4>

                    {event.category && (
                      <p className="text-xs text-slate-400 mb-2">
                        {event.category}
                      </p>
                    )}

                    {expandedEvent === event.id && event.description && (
                      <p className="text-xs text-slate-300 text-left mt-2 pt-2 border-t border-slate-600">
                        {event.description}
                      </p>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Vertical Timeline
  return (
    <div className={`w-full ${containerClassName}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          {events.length > 0 && (
            <button
              onClick={handleExport}
              className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
      )}

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Center line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-700" />

        {/* Events */}
        <div className="space-y-8">
          {sortedEvents.map((event) => {
            const isHighlighted = highlight.includes(event.id);
            const isHovered = hoveredEvent === event.id;
            const severityLevel = event.severity || 'medium';
            const isExpanded = expandedEvent === event.id;

            return (
              <div
                key={event.id}
                className="relative"
                onMouseEnter={() => setHoveredEvent(event.id)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-2 w-16 h-16 flex items-center justify-center ${
                    isHovered ? 'scale-110' : ''
                  } transition-transform`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-4 ${severityColors[severityLevel]} border-slate-900 z-10`}
                  />
                </div>

                {/* Content */}
                <button
                  onClick={() => {
                    setExpandedEvent(
                      expandedEvent === event.id ? null : event.id
                    );
                    onEventClick?.(event);
                  }}
                  className={`ml-32 p-4 rounded-lg border transition-all text-left cursor-pointer ${
                    isHighlighted
                      ? 'border-blue-500 bg-blue-950'
                      : 'border-slate-700 bg-slate-800'
                  } ${isHovered ? 'shadow-lg shadow-blue-500/50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">
                      {formatDate(event.date)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${severityTextColors[severityLevel]}`}
                    >
                      {severityLevel.toUpperCase()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 mb-1">
                    {event.title}
                  </h4>

                  {event.category && (
                    <p className="text-xs text-slate-400 mb-2">
                      {event.category}
                    </p>
                  )}

                  {isExpanded && event.description && (
                    <p className="text-sm text-slate-300 mt-3 pt-3 border-t border-slate-600">
                      {event.description}
                    </p>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      {events.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400">Total Events</p>
            <p className="text-lg font-bold text-slate-100">{events.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400">Categories</p>
            <p className="text-lg font-bold text-slate-100">
              {new Set(events.map((e) => e.category)).size}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400">Critical</p>
            <p className="text-lg font-bold text-red-400">
              {events.filter((e) => e.severity === 'critical').length}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400">Time Span</p>
            <p className="text-xs font-bold text-slate-100">
              {events.length > 1
                ? `${Math.ceil((new Date(sortedEvents[0].date).getTime() - new Date(sortedEvents[events.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))} days`
                : 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
