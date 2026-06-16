'use client';

import React from 'react';

interface LegendEntry {
  id: string;
  name: string;
  color: string;
  icon?: 'circle' | 'square' | 'line';
  visible?: boolean;
  onClick?: (id: string) => void;
}

interface ChartLegendProps {
  entries: LegendEntry[];
  orientation?: 'horizontal' | 'vertical';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  onEntryClick?: (id: string) => void;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({
  entries,
  orientation = 'horizontal',
  position = 'bottom',
  className = '',
  onEntryClick,
}) => {
  const containerClass =
    orientation === 'horizontal'
      ? 'flex flex-wrap gap-4 justify-center'
      : 'flex flex-col gap-3';

  return (
    <div className={`${containerClass} ${className}`}>
      {entries.map((entry) => (
        <button
          key={entry.id}
          onClick={() => {
            if (onEntryClick) onEntryClick(entry.id);
            if (entry.onClick) entry.onClick(entry.id);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors group"
          disabled={entry.visible === false}
        >
          {/* Icon */}
          {entry.icon === 'square' ? (
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
          ) : entry.icon === 'line' ? (
            <div
              className="w-4 h-0.5"
              style={{ backgroundColor: entry.color }}
            />
          ) : (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
          )}

          {/* Label */}
          <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">
            {entry.name}
          </span>

          {/* Visibility indicator */}
          {entry.visible === false && (
            <span className="text-xs text-slate-500 ml-1">(hidden)</span>
          )}
        </button>
      ))}
    </div>
  );
};

// Recharts legend wrapper
export const RechartsLegend = (props: any) => {
  const { payload } = props;

  if (!payload) return null;

  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4 px-4 py-2">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-slate-300">{entry.name}</span>
        </div>
      ))}
    </div>
  );
};
