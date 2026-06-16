'use client';

import React from 'react';

interface ChartTooltipProps {
  label?: string;
  payload?: Array<{
    name: string;
    value: number | string;
    color?: string;
    unit?: string;
  }>;
  active?: boolean;
  labelFormatter?: (value: any) => string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  label,
  payload,
  active,
  labelFormatter,
  backgroundColor = 'rgba(15, 23, 42, 0.95)',
  borderColor = 'rgba(59, 130, 246, 0.5)',
  textColor = '#f1f5f9',
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formattedLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div
      className="rounded-lg border p-3 shadow-lg"
      style={{
        backgroundColor,
        borderColor,
        borderWidth: '1px',
      }}
    >
      {formattedLabel && (
        <p
          className="mb-2 font-semibold text-sm"
          style={{ color: textColor }}
        >
          {formattedLabel}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={`payload-${index}`} className="flex items-center gap-2">
            {entry.color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="text-xs" style={{ color: textColor }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
              {entry.unit && <span className="ml-1">{entry.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom Recharts tooltip wrapper
export const RechartsCustomTooltip = ({
  active,
  payload,
  label,
  labelFormatter,
  contentStyle = {},
  formatter,
}: any) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formattedLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div
      className="rounded-lg border p-3 shadow-lg bg-slate-900 border-blue-500/50"
    >
      {formattedLabel && (
        <p className="mb-2 font-semibold text-sm text-slate-100">
          {formattedLabel}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={`payload-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-200">
              {entry.name}:{' '}
              <span className="font-semibold">
                {formatter ? formatter(entry.value) : entry.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
