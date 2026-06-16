'use client';

import React from 'react';

interface TrendIndicatorProps {
  current: number;
  previous?: number;
  label?: string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  percentageChange?: number;
  containerClassName?: string;
  size?: 'small' | 'medium' | 'large';
  showChart?: boolean;
  sparklineData?: number[];
  colorScheme?: 'success' | 'warning' | 'danger' | 'info';
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  current,
  previous,
  label = 'Value',
  unit = '',
  trend,
  percentageChange,
  containerClassName = '',
  size = 'medium',
  showChart = true,
  sparklineData = [],
  colorScheme = 'info',
}) => {
  // Calculate trend if not provided
  let calculatedTrend = trend;
  let calculatedPercentage = percentageChange;

  if (!calculatedTrend && previous !== undefined) {
    if (current > previous) calculatedTrend = 'up';
    else if (current < previous) calculatedTrend = 'down';
    else calculatedTrend = 'stable';

    if (!calculatedPercentage) {
      calculatedPercentage = ((current - previous) / previous) * 100;
    }
  }

  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

  const valueClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
  };

  const labelClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  const colorSchemes = {
    success: {
      bg: 'bg-green-950',
      border: 'border-green-700',
      text: 'text-green-400',
      icon: '#10b981',
    },
    warning: {
      bg: 'bg-yellow-950',
      border: 'border-yellow-700',
      text: 'text-yellow-400',
      icon: '#f59e0b',
    },
    danger: {
      bg: 'bg-red-950',
      border: 'border-red-700',
      text: 'text-red-400',
      icon: '#ef4444',
    },
    info: {
      bg: 'bg-blue-950',
      border: 'border-blue-700',
      text: 'text-blue-400',
      icon: '#3b82f6',
    },
  };

  const colors = colorSchemes[colorScheme];

  // Determine trend color
  let trendColor = colors.icon;
  if (calculatedTrend === 'up') trendColor = '#ef4444'; // Red for up (increase in threats)
  else if (calculatedTrend === 'down') trendColor = '#10b981'; // Green for down
  else if (calculatedTrend === 'stable') trendColor = '#f59e0b'; // Amber for stable

  return (
    <div
      className={`rounded-lg border ${colors.bg} ${colors.border} ${sizeClasses[size]} ${containerClassName}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className={`${labelClasses[size]} text-slate-400`}>
          {label}
        </span>

        {/* Trend arrow */}
        {calculatedTrend && (
          <div className="flex items-center gap-1">
            {calculatedTrend === 'up' && (
              <svg
                className="w-4 h-4"
                fill={trendColor}
                viewBox="0 0 20 20"
              >
                <path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                <path d="M3.293 9.707a1 1 0 011.414 0L9 14.414V3a1 1 0 112 0v11.414l4.293-4.707a1 1 0 111.414 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414z" />
              </svg>
            )}
            {calculatedTrend === 'down' && (
              <svg
                className="w-4 h-4"
                fill={trendColor}
                viewBox="0 0 20 20"
              >
                <path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                <path d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" />
              </svg>
            )}
            {calculatedTrend === 'stable' && (
              <svg
                className="w-4 h-4"
                fill={trendColor}
                viewBox="0 0 20 20"
              >
                <path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`${valueClasses[size]} font-bold text-slate-100 mb-2`}>
        {current.toFixed(1)}{unit && <span className="text-sm ml-1">{unit}</span>}
      </div>

      {/* Percentage change */}
      {calculatedPercentage !== undefined && (
        <div className={`${colors.text} text-sm font-semibold mb-2`}>
          {calculatedPercentage > 0 ? '+' : ''}
          {calculatedPercentage.toFixed(1)}%
        </div>
      )}

      {/* Sparkline chart */}
      {showChart && sparklineData.length > 0 && (
        <div className="mt-3 h-8 flex items-end gap-0.5">
          {sparklineData.map((value, index) => {
            const maxValue = Math.max(...sparklineData);
            const minValue = Math.min(...sparklineData);
            const range = maxValue - minValue || 1;
            const height = ((value - minValue) / range) * 100;
            const isLatest = index === sparklineData.length - 1;

            return (
              <div
                key={index}
                className={`flex-1 rounded-sm ${
                  isLatest ? 'bg-blue-500' : 'bg-slate-700'
                }`}
                style={{
                  height: `${Math.max(20, height)}%`,
                  opacity: isLatest ? 1 : 0.6,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Previous value */}
      {previous !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex justify-between items-center">
            <span className={`${labelClasses[size]} text-slate-500`}>
              Previous
            </span>
            <span className="text-sm font-semibold text-slate-400">
              {previous.toFixed(1)}{unit && <span className="ml-1">{unit}</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendIndicator;
