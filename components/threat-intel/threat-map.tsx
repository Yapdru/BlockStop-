'use client';

import React, { useEffect, useState } from 'react';

interface IOCLocation {
  country: string;
  count: number;
  coordinates: [number, number];
}

interface ThreatMapProps {
  iocs?: IOCLocation[];
  height?: string;
}

export function ThreatMap({ iocs = [], height = '500px' }: ThreatMapProps) {
  const [locations, setLocations] = useState<IOCLocation[]>(iocs);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  useEffect(() => {
    setLocations(iocs);
  }, [iocs]);

  // Simple grid-based visualization
  const rows = 10;
  const cols = 20;
  const gridSize = 100 / cols;

  const getIntensityColor = (count: number, maxCount: number) => {
    const intensity = Math.log(count + 1) / Math.log(maxCount + 1);

    if (intensity > 0.8) return 'rgb(220, 38, 38)'; // red
    if (intensity > 0.6) return 'rgb(245, 158, 11)'; // orange
    if (intensity > 0.4) return 'rgb(251, 146, 60)'; // amber
    if (intensity > 0.2) return 'rgb(34, 197, 94)'; // green
    return 'rgb(229, 231, 235)'; // gray
  };

  const maxCount = Math.max(...locations.map((l) => l.count), 1);

  return (
    <div className="w-full" style={{ height }}>
      <div className="h-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="h-full relative">
          {/* Grid-based heatmap */}
          <svg width="100%" height="100%" className="mb-4">
            {locations.map((location) => {
              const x = (location.coordinates[1] + 180) / 360; // longitude normalization
              const y = (90 - location.coordinates[0]) / 180; // latitude normalization

              const svgX = x * 100;
              const svgY = y * 100;

              return (
                <g key={location.country}>
                  {/* Heat point */}
                  <circle
                    cx={`${svgX}%`}
                    cy={`${svgY}%`}
                    r={Math.sqrt(location.count) * 2}
                    fill={getIntensityColor(location.count, maxCount)}
                    opacity={0.7}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    onMouseEnter={() => setHoveredLocation(location.country)}
                    onMouseLeave={() => setHoveredLocation(null)}
                  />

                  {/* Tooltip */}
                  {hoveredLocation === location.country && (
                    <foreignObject
                      x={`${svgX}%`}
                      y={`${svgY - 30}%`}
                      width="100"
                      height="50"
                    >
                      <div className="bg-slate-900 text-white text-xs p-2 rounded border border-slate-600 pointer-events-none">
                        <div className="font-semibold">{location.country}</div>
                        <div>{location.count} indicators</div>
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-300 px-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: 'rgb(229, 231, 235)' }}
              />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: 'rgb(34, 197, 94)' }}
              />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: 'rgb(251, 146, 60)' }}
              />
              <span>High</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: 'rgb(220, 38, 38)' }}
              />
              <span>Critical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThreatMap;
