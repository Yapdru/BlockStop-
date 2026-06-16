'use client';

import React, { useState } from 'react';

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title?: string;
  subtitle?: string;
  unit?: string;
  containerClassName?: string;
  size?: number;
  strokeWidth?: number;
  segments?: Array<{
    name: string;
    min: number;
    max: number;
    color: string;
  }>;
  thresholds?: Array<{
    value: number;
    color: string;
    label: string;
  }>;
  showValue?: boolean;
  animated?: boolean;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min = 0,
  max = 100,
  title,
  subtitle,
  unit = '%',
  containerClassName = '',
  size = 200,
  strokeWidth = 20,
  segments,
  thresholds,
  showValue = true,
  animated = true,
}) => {
  const [isAnimating, setIsAnimating] = useState(animated);

  React.useEffect(() => {
    if (!animated) setIsAnimating(false);
  }, [animated]);

  const percentage = ((value - min) / (max - min)) * 100;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  // Default segments based on value ranges
  const defaultSegments = [
    { name: 'Low', min: 0, max: 33, color: '#10b981' },
    { name: 'Medium', min: 33, max: 66, color: '#f59e0b' },
    { name: 'High', min: 66, max: 100, color: '#ef4444' },
  ];

  const segmentsToUse = segments || defaultSegments;

  const getSegmentColor = () => {
    const currentSegment = segmentsToUse.find(
      (s) => clampedPercentage >= s.min && clampedPercentage <= s.max
    );
    return currentSegment?.color || '#3b82f6';
  };

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (clampedPercentage / 100) * circumference;

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className={`w-full ${containerClassName}`}>
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-slate-100">{title}</h3>
      )}

      <div className="flex flex-col items-center gap-6">
        {/* Gauge SVG */}
        <div className="relative">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Background segments */}
            {segmentsToUse.map((segment, index) => {
              const startAngle = (segment.min / 100) * 180 * (Math.PI / 180);
              const endAngle = (segment.max / 100) * 180 * (Math.PI / 180);

              const startX =
                cx + radius * Math.cos(startAngle - Math.PI / 2);
              const startY =
                cy + radius * Math.sin(startAngle - Math.PI / 2);
              const endX = cx + radius * Math.cos(endAngle - Math.PI / 2);
              const endY = cy + radius * Math.sin(endAngle - Math.PI / 2);

              const largeArc = segment.max - segment.min > 50 ? 1 : 0;

              return (
                <path
                  key={`segment-${index}`}
                  d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity="0.3"
                />
              );
            })}

            {/* Value arc */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="rgba(71, 85, 105, 0.2)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset="0"
            />

            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={getSegmentColor()}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={isAnimating ? offset : 0}
              strokeLinecap="round"
              style={{
                transition: isAnimating ? 'stroke-dashoffset 1.5s ease-out' : 'none',
                transform: `rotate(-90deg)`,
                transformOrigin: `${cx}px ${cy}px`,
              }}
            />

            {/* Center circle */}
            <circle
              cx={cx}
              cy={cy}
              r={radius - strokeWidth / 2}
              fill="rgba(15, 23, 42, 0.8)"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1"
            />

            {/* Value text */}
            {showValue && (
              <g>
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-3xl font-bold"
                  fill="white"
                >
                  {clampedPercentage.toFixed(0)}
                </text>
                <text
                  x={cx}
                  y={cy + 15}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-sm"
                  fill="rgba(226, 232, 240, 0.7)"
                >
                  {unit}
                </text>
              </g>
            )}
          </svg>

          {/* Needle pointer */}
          <div
            className="absolute top-0 left-1/2 origin-bottom"
            style={{
              width: '2px',
              height: `${radius - strokeWidth / 4}px`,
              backgroundColor: getSegmentColor(),
              transform: `translateX(-50%) rotate(${clampedPercentage * 1.8 - 90}deg)`,
              transition: isAnimating ? 'transform 1.5s ease-out' : 'none',
              marginTop: `${strokeWidth / 2}px`,
            }}
          />
        </div>

        {/* Info */}
        {subtitle && (
          <p className="text-sm text-slate-400 text-center">{subtitle}</p>
        )}

        {/* Value info */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-center">
            <p className="text-xs text-slate-400">Min</p>
            <p className="text-lg font-bold text-slate-100">{min}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-center">
            <p className="text-xs text-slate-400">Current</p>
            <p className="text-lg font-bold text-slate-100">{value.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-center">
            <p className="text-xs text-slate-400">Max</p>
            <p className="text-lg font-bold text-slate-100">{max}</p>
          </div>
        </div>

        {/* Segment legend */}
        {segmentsToUse.length > 0 && (
          <div className="w-full grid grid-cols-3 gap-2 mt-4">
            {segmentsToUse.map((segment) => (
              <div
                key={segment.name}
                className="p-2 rounded-lg bg-slate-800 border border-slate-700"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    {segment.name}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {segment.min.toFixed(0)}-{segment.max.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: getSegmentColor() }}
          />
          <span className="text-sm text-slate-200">
            {clampedPercentage >= 66
              ? 'High'
              : clampedPercentage >= 33
              ? 'Medium'
              : 'Low'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GaugeChart;
