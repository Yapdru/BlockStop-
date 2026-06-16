'use client';

import React, { useState } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { RechartsCustomTooltip } from './ChartTooltip';
import { RechartsLegend } from './ChartLegend';

interface BarChartProps {
  data: Array<Record<string, any>>;
  bars: Array<{
    dataKey: string;
    name: string;
    color: string;
    stackId?: string;
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
  layout?: 'vertical' | 'horizontal';
  containerClassName?: string;
  onExportData?: () => void;
  margin?: { top: number; right: number; bottom: number; left: number };
  barSize?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  xAxisKey,
  xAxisLabel = '',
  yAxisLabel = '',
  height = 400,
  responsive = true,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  title,
  layout = 'vertical',
  containerClassName = '',
  onExportData,
  margin = { top: 5, right: 30, bottom: 5, left: 100 },
  barSize = 60,
}) => {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const ChartComponent = responsive ? ResponsiveContainer : 'div';
  const chartProps = responsive
    ? { width: '100%', height }
    : { style: { width: '100%', height } };

  const handleExport = () => {
    if (onExportData) {
      onExportData();
    } else {
      const csv = [
        [xAxisKey, ...bars.map((b) => b.name)].join(','),
        ...data.map((row) =>
          [row[xAxisKey], ...bars.map((b) => row[b.dataKey])].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bar-chart-data.csv';
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
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={margin}
          barSize={barSize}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(71, 85, 105, 0.3)"
            />
          )}

          {layout === 'vertical' ? (
            <>
              <XAxis
                type="number"
                stroke="rgba(148, 163, 184, 0.5)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                dataKey={xAxisKey}
                type="category"
                stroke="rgba(148, 163, 184, 0.5)"
                style={{ fontSize: '12px' }}
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisKey}
                stroke="rgba(148, 163, 184, 0.5)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="rgba(148, 163, 184, 0.5)"
                style={{ fontSize: '12px' }}
              />
            </>
          )}

          {showTooltip && (
            <Tooltip
              content={<RechartsCustomTooltip />}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
          )}

          {showLegend && <Legend content={<RechartsLegend />} />}

          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              stackId={bar.stackId}
              radius={[8, 8, 0, 0]}
              onMouseEnter={() => setHoveredBar(bar.dataKey)}
              onMouseLeave={() => setHoveredBar(null)}
            />
          ))}
        </RechartsBarChart>
      </ChartComponent>
    </div>
  );
};

export default BarChart;
