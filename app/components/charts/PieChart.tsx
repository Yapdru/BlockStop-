'use client';

import React, { useState } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RechartsCustomTooltip } from './ChartTooltip';

interface PieChartEntry {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartEntry[];
  dataKey?: string;
  nameKey?: string;
  height?: number;
  responsive?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabel?: boolean;
  title?: string;
  containerClassName?: string;
  onExportData?: () => void;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  dataKey = 'value',
  nameKey = 'name',
  height = 400,
  responsive = true,
  showLegend = true,
  showTooltip = true,
  showLabel = true,
  title,
  containerClassName = '',
  onExportData,
  innerRadius = 0,
  outerRadius = 120,
  startAngle = 90,
  endAngle = -270,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const ChartComponent = responsive ? ResponsiveContainer : 'div';
  const chartProps = responsive
    ? { width: '100%', height }
    : { style: { width: '100%', height } };

  const handleExport = () => {
    if (onExportData) {
      onExportData();
    } else {
      const csv = [
        [nameKey, dataKey].join(','),
        ...data.map((row) => [row.name, row.value].join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pie-chart-data.csv';
      a.click();
    }
  };

  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#06b6d4', // cyan
  ];

  const processedData = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  const CustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius: innerRad,
    outerRadius: outerRad,
    percent,
  }: any) => {
    if (!showLabel || percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRad + (outerRad - innerRad) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
        <RechartsPieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={<CustomLabel />}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            startAngle={startAngle}
            endAngle={endAngle}
          >
            {processedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={
                  hoveredIndex === null || hoveredIndex === index ? 1 : 0.6
                }
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </Pie>

          {showTooltip && (
            <Tooltip
              content={<RechartsCustomTooltip />}
              formatter={(value) => `${value}`}
            />
          )}

          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value, entry: any) => (
                <span className="text-sm text-slate-300">
                  {entry.payload.name}
                </span>
              )}
            />
          )}
        </RechartsPieChart>
      </ChartComponent>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {processedData.map((item, index) => {
          const total = processedData.reduce((sum, d) => sum + d.value, 0);
          const percentage = ((item.value / total) * 100).toFixed(1);

          return (
            <div
              key={item.name}
              className="p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {item.name}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {item.value}
              </div>
              <div className="text-xs text-slate-400">{percentage}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PieChart;
