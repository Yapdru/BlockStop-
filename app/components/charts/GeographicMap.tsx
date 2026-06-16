'use client';

import React, { useState } from 'react';

interface GeoLocation {
  name: string;
  latitude: number;
  longitude: number;
  value: number;
  color?: string;
  intensity?: number; // 0-1 scale
}

interface GeographicMapProps {
  locations: GeoLocation[];
  width?: number;
  height?: number;
  title?: string;
  containerClassName?: string;
  onExportData?: () => void;
  showHeatmap?: boolean;
  maxValue?: number;
  minValue?: number;
  onLocationClick?: (location: GeoLocation) => void;
}

export const GeographicMap: React.FC<GeographicMapProps> = ({
  locations,
  width = 1000,
  height = 600,
  title,
  containerClassName = '',
  onExportData,
  showHeatmap = true,
  maxValue,
  minValue,
  onLocationClick,
}) => {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Simple Mercator projection
  const projectLonLat = (lon: number, lat: number) => {
    const metersPerPx = 40075016.686 / (256 * Math.pow(2, zoomLevel)) / 10;
    const x = (lon + 180) * (width / 360) + pan.x;
    const y =
      (height / 2) -
      (Math.log(Math.tan((Math.PI / 4 + (lat * Math.PI) / 360))) *
        (width / (2 * Math.PI))) +
      pan.y;
    return { x: Math.max(0, Math.min(width, x)), y: Math.max(0, Math.min(height, y)) };
  };

  const maxVal = maxValue !== undefined ? maxValue : Math.max(...locations.map((l) => l.value));
  const minVal = minValue !== undefined ? minValue : Math.min(...locations.map((l) => l.value));
  const range = maxVal - minVal || 1;

  const getColor = (value: number) => {
    const normalized = (value - minVal) / range;
    // Red to yellow to green gradient
    const hue = (1 - normalized) * 120; // 0 = red, 120 = green
    return `hsl(${hue}, 100%, 50%)`;
  };

  const handleExport = () => {
    if (onExportData) {
      onExportData();
    } else {
      const csv = [
        ['Name', 'Latitude', 'Longitude', 'Value'].join(','),
        ...locations.map((l) =>
          [l.name, l.latitude, l.longitude, l.value].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'geo-map-data.csv';
      a.click();
    }
  };

  return (
    <div className={`w-full ${containerClassName}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <div className="flex gap-2">
            {locations.length > 0 && (
              <button
                onClick={handleExport}
                className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Export CSV
              </button>
            )}
            <button
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
              className="px-2 py-1 text-sm rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              -
            </button>
            <span className="px-2 py-1 text-sm text-slate-300">
              {zoomLevel}x
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(5, zoomLevel + 1))}
              className="px-2 py-1 text-sm rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative rounded-lg overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 border border-slate-700">
        <svg
          width={width}
          height={height}
          className="block bg-gradient-to-b from-blue-900 to-blue-800"
          style={{ userSelect: 'none' }}
        >
          {/* Grid */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(59, 130, 246, 0.1)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid)" />

          {/* Latitude lines */}
          {[-60, -30, 0, 30, 60].map((lat) => {
            const startPos = projectLonLat(-180, lat);
            const endPos = projectLonLat(180, lat);
            return (
              <line
                key={`lat-${lat}`}
                x1={startPos.x}
                y1={startPos.y}
                x2={endPos.x}
                y2={endPos.y}
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Longitude lines */}
          {[-180, -120, -60, 0, 60, 120, 180].map((lon) => {
            const startPos = projectLonLat(lon, -85);
            const endPos = projectLonLat(lon, 85);
            return (
              <line
                key={`lon-${lon}`}
                x1={startPos.x}
                y1={startPos.y}
                x2={endPos.x}
                y2={endPos.y}
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Heatmap circles */}
          {showHeatmap &&
            locations.map((location, index) => {
              const pos = projectLonLat(location.longitude, location.latitude);
              const intensity = location.intensity || (location.value - minVal) / range;
              const radius = 5 + intensity * 15;

              return (
                <g key={`heat-${index}`}>
                  {/* Glow effect */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 3}
                    fill={location.color || getColor(location.value)}
                    opacity="0.2"
                  />
                  {/* Main circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius}
                    fill={location.color || getColor(location.value)}
                    opacity={hoveredLocation === location.name ? 0.9 : 0.7}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={() => setHoveredLocation(location.name)}
                    onMouseLeave={() => setHoveredLocation(null)}
                    onClick={() => onLocationClick?.(location)}
                  />
                </g>
              );
            })}

          {/* Location labels */}
          {locations.map((location, index) => {
            if (hoveredLocation !== location.name) return null;

            const pos = projectLonLat(location.longitude, location.latitude);
            return (
              <g key={`label-${index}`}>
                <rect
                  x={pos.x - 40}
                  y={pos.y - 40}
                  width="80"
                  height="30"
                  rx="4"
                  fill="rgba(15, 23, 42, 0.9)"
                  stroke="rgba(59, 130, 246, 0.5)"
                  strokeWidth="1"
                />
                <text
                  x={pos.x}
                  y={pos.y - 22}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {location.name}
                </text>
                <text
                  x={pos.x}
                  y={pos.y - 10}
                  textAnchor="middle"
                  fill="rgba(226, 232, 240, 0.8)"
                  fontSize="11"
                >
                  {location.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4">
        <span className="text-sm text-slate-400">Low</span>
        <div className="flex gap-0.5 flex-1">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((val) => (
            <div
              key={`legend-${val}`}
              className="h-6 flex-1 rounded-sm"
              style={{
                backgroundColor: `hsl(${(1 - val) * 120}, 100%, 50%)`,
              }}
            />
          ))}
        </div>
        <span className="text-sm text-slate-400">High</span>
      </div>

      {/* Stats */}
      {locations.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400">Locations</p>
            <p className="text-lg font-bold text-slate-100">{locations.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400">Min Value</p>
            <p className="text-lg font-bold text-slate-100">{minVal.toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-400">Max Value</p>
            <p className="text-lg font-bold text-slate-100">{maxVal.toFixed(0)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicMap;
