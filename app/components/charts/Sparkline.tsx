'use client';

import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  curveType?: 'linear' | 'smooth' | 'step';
  showArea?: boolean;
  showLine?: boolean;
  showPoints?: boolean;
  className?: string;
  trend?: 'up' | 'down' | 'stable';
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 24,
  color = '#3b82f6',
  curveType = 'smooth',
  showArea = true,
  showLine = true,
  showPoints = false,
  className = '',
  trend,
}) => {
  if (data.length === 0) {
    return <div className={className} style={{ width, height }} />;
  }

  const padding = 2;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;

  // Normalize data to fit in chart area
  const normalizedData = data.map(
    (value) => ((value - minValue) / range) * innerHeight
  );

  // Calculate points
  const pointSpacing = innerWidth / (data.length - 1 || 1);
  const points = normalizedData.map(
    (y, index) => ({
      x: padding + index * pointSpacing,
      y: padding + innerHeight - y,
      value: data[index],
    })
  );

  // Generate path for smooth curve
  const generateSmoothPath = () => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      if (curveType === 'smooth' && next) {
        // Quadratic Bezier curve
        const cpx = (prev.x + curr.x) / 2;
        const cpy = (prev.y + curr.y) / 2;
        path += ` Q ${cpx} ${cpy} ${curr.x} ${curr.y}`;
      } else if (curveType === 'step') {
        path += ` L ${curr.x} ${prev.y} L ${curr.x} ${curr.y}`;
      } else {
        path += ` L ${curr.x} ${curr.y}`;
      }
    }

    return path;
  };

  const linePath = generateSmoothPath();
  const areaPath =
    linePath + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  // Determine color based on trend
  let effectiveColor = color;
  if (trend === 'up') effectiveColor = '#ef4444'; // Red
  else if (trend === 'down') effectiveColor = '#10b981'; // Green
  else if (trend === 'stable') effectiveColor = '#f59e0b'; // Amber

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Area */}
      {showArea && (
        <path
          d={areaPath}
          fill={effectiveColor}
          fillOpacity="0.2"
          stroke="none"
        />
      )}

      {/* Line */}
      {showLine && (
        <path
          d={linePath}
          fill="none"
          stroke={effectiveColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Points */}
      {showPoints &&
        points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="2"
            fill={effectiveColor}
            stroke="white"
            strokeWidth="1"
          />
        ))}

      {/* Highlight first and last points */}
      {!showPoints && (
        <>
          <circle
            cx={points[0].x}
            cy={points[0].y}
            r="1.5"
            fill={effectiveColor}
            opacity="0.5"
          />
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="1.5"
            fill={effectiveColor}
          />
        </>
      )}
    </svg>
  );
};

// Inline sparkline component for use in tables/lists
interface InlineSparklineProps {
  data: number[];
  label: string;
  value: number;
  previous?: number;
  unit?: string;
}

export const InlineSparkline: React.FC<InlineSparklineProps> = ({
  data,
  label,
  value,
  previous,
  unit = '',
}) => {
  let trend: 'up' | 'down' | 'stable' | undefined;
  if (previous !== undefined) {
    if (value > previous) trend = 'up';
    else if (value < previous) trend = 'down';
    else trend = 'stable';
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm text-slate-300">{label}</p>
        <p className="text-lg font-bold text-slate-100">
          {value.toFixed(1)}{unit}
        </p>
      </div>
      <Sparkline
        data={data}
        width={60}
        height={24}
        showArea={true}
        showLine={true}
        trend={trend}
      />
    </div>
  );
};

export default Sparkline;
