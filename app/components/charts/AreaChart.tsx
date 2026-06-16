'use client';

import React, { useState } from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RechartsCustomTooltip } from './ChartTooltip';
import { RechartsLegend } from './ChartLegend';

interface AreaChartProps {
  data: Array<Record<string, any>>;
  areas: Array<{
    dataKey: string;
    name: string;
    color: string;
    strokeColor?: string;
    stackId?: string;
    type?: 'linear' | 'monotone' | 'natural' | 'stepBefore' | 'stepAfter';
    isAnimationActive?: boolean;
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
  stacked?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  areas,
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
  margin = { top: 5, right: 30, bottom: 5, left: 0 },
  stacked = true,
}) => {
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  const ChartComponent = responsive ? ResponsiveContainer : 'div';
  const chartProps = responsive
    ? { width: '100%', height }
    : { style: { width: '100%', height } };

  const handleExport = () => {
    if (onExportData) {
      onExportData();
    } else {
      const csv = [
        [xAxisKey, ...areas.map((a) => a.name)].join(','),
        ...data.map((row) =>
          [xAxisKey, ...areas.map((a) => row[a.dataKey])].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'area-chart-data.csv';
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
        <RechartsAreaChart data={data} margin={margin}>
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
            label={
              xAxisLabel
                ? { value: xAxisLabel, position: 'insideBottom', offset: -5 }
                : undefined
            }
          />

          <YAxis
            stroke="rgba(148, 163, 184, 0.5)"
            style={{ fontSize: '12px' }}
            label={
              yAxisLabel
                ? { value: yAxisLabel, angle: -90, position: 'insideLeft' }
                : undefined
            }
          />

          {showTooltip && (
            <Tooltip
              content={<RechartsCustomTooltip />}
              cursor={{ stroke: 'rgba(59, 130, 246, 0.3)' }}
            />
          )}

          {showLegend && <Legend content={<RechartsLegend />} />}

          {areas.map((area) => (
            <Area
              key={area.dataKey}
              type={area.type || 'monotone'}
              dataKey={area.dataKey}
              name={area.name}
              fill={area.color}
              stroke={area.strokeColor || area.color}
              fillOpacity={
                hoveredArea === null || hoveredArea === area.dataKey ? 0.6 : 0.3
              }
              stackId={stacked ? area.stackId || 'stack' : undefined}
              isAnimationActive={area.isAnimationActive !== false}
              onMouseEnter={() => setHoveredArea(area.dataKey)}
              onMouseLeave={() => setHoveredArea(null)}
            />
          ))}
        </RechartsAreaChart>
      </ChartComponent>
    </div>
  );
};

export default AreaChart;
