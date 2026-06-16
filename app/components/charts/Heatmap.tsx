'use client';

import React, { useState } from 'react';

interface HeatmapData {
  x: string;
  y: string;
  value: number;
  color?: string;
}

interface HeatmapProps {
  data: HeatmapData[];
  width?: number;
  height?: number;
  title?: string;
  colorScheme?: 'viridis' | 'cool' | 'warm' | 'red-green' | 'blues' | 'custom';
  customColors?: string[];
  minValue?: number;
  maxValue?: number;
  cellSize?: number;
  showValues?: boolean;
  containerClassName?: string;
  onExportData?: () => void;
  onCellClick?: (data: HeatmapData) => void;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  width = 800,
  height = 600,
  title,
  colorScheme = 'viridis',
  customColors,
  minValue,
  maxValue,
  cellSize = 40,
  showValues = true,
  containerClassName = '',
  onExportData,
  onCellClick,
}) => {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  const colorSchemes = {
    viridis: [
      '#440154',
      '#482878',
      '#3e4a89',
      '#31688e',
      '#26828e',
      '#1f9e89',
      '#35b779',
      '#6ece58',
      '#b5de2b',
      '#fde724',
    ],
    cool: [
      '#0d47a1',
      '#1565c0',
      '#1976d2',
      '#1e88e5',
      '#2196f3',
      '#42a5f5',
      '#64b5f6',
      '#90caf9',
      '#bbdefb',
      '#e3f2fd',
    ],
    warm: [
      '#fff7fb',
      '#fde0dd',
      '#fcc5c0',
      '#fa9fb5',
      '#f768a1',
      '#dd3497',
      '#ae017e',
      '#7a0177',
      '#49006a',
      '#1a0033',
    ],
    'red-green': [
      '#d73027',
      '#f46d43',
      '#fdae61',
      '#fee090',
      '#ffffbf',
      '#e0f3f8',
      '#abd9e9',
      '#74add1',
      '#4575b4',
      '#313695',
    ],
    blues: [
      '#f7fbff',
      '#eff3ff',
      '#e7f0ff',
      '#d5e5f5',
      '#c6dbef',
      '#b3d9e8',
      '#9ecae1',
      '#6baed6',
      '#4292c6',
      '#08519c',
      '#08306b',
    ],
  };

  const getColors = () => customColors || colorSchemes[colorScheme];
  const colors = getColors();

  // Get unique X and Y values
  const xValues = Array.from(new Set(data.map((d) => d.x))).sort();
  const yValues = Array.from(new Set(data.map((d) => d.y))).sort();

  // Calculate min and max values
  const min = minValue !== undefined ? minValue : Math.min(...data.map((d) => d.value));
  const max = maxValue !== undefined ? maxValue : Math.max(...data.map((d) => d.value));
  const range = max - min || 1;

  // Create a map for quick lookup
  const dataMap = new Map(data.map((d) => [`${d.x}-${d.y}`, d]));

  const getColor = (value: number) => {
    const normalized = (value - min) / range;
    const index = Math.floor(normalized * (colors.length - 1));
    return colors[Math.max(0, Math.min(index, colors.length - 1))];
  };

  const handleExport = () => {
    if (onExportData) {
      onExportData();
    } else {
      const csv = [
        ['X', 'Y', 'Value'].join(','),
        ...data.map((d) => [d.x, d.y, d.value].join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'heatmap-data.csv';
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

      {/* Legend */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-slate-400">Min: {min.toFixed(2)}</span>
        <div className="flex gap-0.5">
          {colors.map((color, index) => (
            <div
              key={color}
              className="h-6 flex-1"
              style={{
                backgroundColor: color,
                borderRadius: index === 0 ? '4px 0 0 4px' : index === colors.length - 1 ? '0 4px 4px 0' : '0',
              }}
            />
          ))}
        </div>
        <span className="text-sm text-slate-400">Max: {max.toFixed(2)}</span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(${xValues.length}, ${cellSize}px)`, gap: '1px', backgroundColor: 'rgba(71, 85, 105, 0.2)', padding: '1px' }}>
            {/* Corner cell */}
            <div style={{ width: '60px', height: cellSize, backgroundColor: 'rgba(15, 23, 42, 0.5)' }} />

            {/* X headers */}
            {xValues.map((x) => (
              <div
                key={`header-${x}`}
                className="flex items-center justify-center bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700"
                style={{ width: cellSize, height: cellSize, overflow: 'hidden' }}
                title={x}
              >
                {x.length > 3 ? `${x.substring(0, 3)}...` : x}
              </div>
            ))}

            {/* Y rows */}
            {yValues.map((y) => (
              <React.Fragment key={`row-${y}`}>
                {/* Y label */}
                <div
                  className="flex items-center justify-center bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700 px-2"
                  style={{ width: '60px', height: cellSize, overflow: 'hidden' }}
                  title={y}
                >
                  {y.length > 6 ? `${y.substring(0, 6)}...` : y}
                </div>

                {/* Cells */}
                {xValues.map((x, index) => {
                  const cellData = dataMap.get(`${x}-${y}`);
                  const value = cellData?.value || 0;
                  const color = cellData ? getColor(value) : 'rgba(71, 85, 105, 0.1)';
                  const isHovered = hoveredCell === `${x}-${y}`;

                  return (
                    <button
                      key={`cell-${x}-${y}`}
                      className="relative border border-slate-700 hover:border-slate-500 transition-all"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: color,
                        opacity: isHovered ? 1 : 0.9,
                        boxShadow: isHovered
                          ? '0 0 8px rgba(59, 130, 246, 0.5)'
                          : 'none',
                      }}
                      onMouseEnter={() => setHoveredCell(`${x}-${y}`)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => cellData && onCellClick?.(cellData)}
                      title={cellData ? `${x}, ${y}: ${cellData.value}` : ''}
                    >
                      {showValues && cellData && (
                        <span className="text-xs font-semibold text-white drop-shadow-md">
                          {cellData.value}
                        </span>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics */}
      {hoveredCell && (
        <div className="mt-4 p-3 rounded-lg bg-slate-800 border border-slate-700">
          <p className="text-sm text-slate-200">
            <span className="font-semibold">Selected Cell:</span> {hoveredCell}
          </p>
        </div>
      )}
    </div>
  );
};

export default Heatmap;
