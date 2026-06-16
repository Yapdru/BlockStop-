'use client';

import React, { useState } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts';
import { RechartsCustomTooltip } from './ChartTooltip';
import { RechartsLegend } from './ChartLegend';

interface LineChartProps {
  data: Array<Record<string, any>>;
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
    strokeWidth?: number;
    type?: 'linear' | 'monotone' | 'natural' | 'stepBefore' | 'stepAfter';
    isAnimationActive?: boolean;
    dot?: boolean | { fill: string; r: number };
  }>;
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
  responsive?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  title?: string;
  containerClassName?: string;
  onExportData?: () => void;
  margin?: { top: number; right: number; bottom: number; left: number };
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  xAxisKey,
  xAxisLabel = '',
  yAxisLabel = '',
  height = 400,
  responsive = true,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  title,
  containerClassName = '',
  onExportData,
  margin = { top: 5, right: 30, left: 0, bottom: 5 },
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const ChartComponent = responsive ? ResponsiveContainer : 'div';
  const chartProps = responsive
    ? { width: '100%', height }
    : { style: { width: '100%', height } };

  const handleExport = () => {
    if (onExportData) {
      onExportData();
    } else {
      // Default CSV export
      const csv = [
        [xAxisKey, ...lines.map((l) => l.name)].join(','),
        ...data.map((row) =>
          [xAxisKey, ...lines.map((l) => row[l.dataKey])].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chart-data.csv';
      a.click();
    }
  };

  return (
    <div className={`w-full ${containerClassName}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          {data.length > 0 && (
            <button
              onClick={handleExport}
              className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
      )}

      <ChartComponent {...chartProps}>
        <RechartsLineChart data={data} margin={margin}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(71, 85, 105, 0.3)"
            />
          )}

          <XAxis
            dataKey={xAxisKey}
            stroke="rgba(148, 163, 184, 0.5)"
            style={{ fontSize: '12px' }}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
          />

          <YAxis
            stroke="rgba(148, 163, 184, 0.5)"
            style={{ fontSize: '12px' }}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />

          {showTooltip && (
            <Tooltip
              content={<RechartsCustomTooltip />}
              cursor={{ stroke: 'rgba(59, 130, 246, 0.3)' }}
            />
          )}

          {showLegend && <Legend content={<RechartsLegend />} />}

          {lines.map((line) => (
            <Line
              key={line.dataKey}
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              type={line.type || 'monotone'}
              isAnimationActive={line.isAnimationActive !== false}
              dot={
                line.dot ||
                hoveredKey === line.dataKey
                  ? { fill: line.color, r: 4 }
                  : false
              }
              onMouseEnter={() => setHoveredKey(line.dataKey)}
              onMouseLeave={() => setHoveredKey(null)}
            />
          ))}
        </RechartsLineChart>
      </ChartComponent>
    </div>
  );
};

export default LineChart;
