'use client';

import React, { useState } from 'react';
import {
  Sankey,
  Sink,
  Source,
  Link,
  Node,
  NodeProps,
  LinkProps,
} from 'recharts';
import { ResponsiveContainer } from 'recharts';

interface SankeyNode {
  name: string;
  color?: string;
}

interface SankeyLinkData {
  source: number;
  target: number;
  value: number;
  color?: string;
}

interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLinkData[];
  width?: number;
  height?: number;
  title?: string;
  responsive?: boolean;
  showLabels?: boolean;
  containerClassName?: string;
  onExportData?: () => void;
  nodePadding?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}

const defaultColors = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#06b6d4',
];

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  nodes,
  links,
  width = 800,
  height = 600,
  title,
  responsive = true,
  showLabels = true,
  containerClassName = '',
  onExportData,
  nodePadding = 50,
  margin = { top: 20, right: 160, bottom: 20, left: 20 },
}) => {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const processedNodes = nodes.map((node, index) => ({
    ...node,
    color: node.color || defaultColors[index % defaultColors.length],
  }));

  const processedLinks = links.map((link) => ({
    ...link,
    color:
      link.color ||
      processedNodes[link.target]?.color ||
      defaultColors[link.target % defaultColors.length],
  }));

  const handleExport = () => {
    if (onExportData) {
      onExportData();
    } else {
      const nodesCsv = [
        ['Name', 'Color'].join(','),
        ...processedNodes.map((n) => [n.name, n.color].join(',')),
      ].join('\n');

      const linksCsv = [
        ['Source', 'Target', 'Value'].join(','),
        ...processedLinks.map((l) =>
          [
            processedNodes[l.source]?.name || l.source,
            processedNodes[l.target]?.name || l.target,
            l.value,
          ].join(',')
        ),
      ].join('\n');

      const fullCsv = `NODES\n${nodesCsv}\n\nLINKS\n${linksCsv}`;
      const blob = new Blob([fullCsv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sankey-data.csv';
      a.click();
    }
  };

  const CustomNode = (props: NodeProps) => {
    const { x, y, width: w, height: h, index, payload } = props;
    if (x === null || y === null) return null;

    const isHovered = hoveredNode === index;
    const nodeColor = processedNodes[index]?.color || '#3b82f6';

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill={nodeColor}
          fillOpacity={isHovered ? 0.9 : 0.7}
          rx={4}
          onMouseEnter={() => setHoveredNode(index)}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ cursor: 'pointer', transition: 'fill-opacity 0.2s' }}
        />
        {showLabels && (
          <text
            x={x! + w! + 8}
            y={y! + h! / 2}
            dy="0.35em"
            fontSize="12"
            fill="rgb(226, 232, 240)"
            fontWeight="500"
            style={{ pointerEvents: 'none' }}
          >
            {payload.name}
          </text>
        )}
      </g>
    );
  };

  const CustomLink = (props: LinkProps) => {
    const {
      sourceX,
      sourceY,
      sourceControlX,
      targetX,
      targetY,
      targetControlX,
      linkWidth,
      index,
    } = props;

    if (
      sourceX === null ||
      sourceY === null ||
      targetX === null ||
      targetY === null
    )
      return null;

    const isHovered = hoveredLink === index;
    const linkColor = processedLinks[index]?.color || 'rgba(59, 130, 246, 0.3)';

    return (
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        fill="none"
        stroke={linkColor}
        strokeOpacity={isHovered ? 0.8 : 0.4}
        strokeWidth={Math.max(linkWidth || 1, 1)}
        onMouseEnter={() => setHoveredLink(index)}
        onMouseLeave={() => setHoveredLink(null)}
        style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s' }}
      />
    );
  };

  const ChartComponent = responsive ? ResponsiveContainer : 'div';
  const chartProps = responsive
    ? { width: '100%', height }
    : { style: { width: '100%', height } };

  return (
    <div className={`w-full ${containerClassName}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          {nodes.length > 0 && (
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
        <Sankey
          data={{
            nodes: processedNodes.map((n) => ({ name: n.name })),
            links: processedLinks,
          }}
          node={<CustomNode />}
          link={<CustomLink />}
          nodePadding={nodePadding}
          margin={margin}
        >
          <Sink dataKey="value" />
          <Source dataKey="value" />
        </Sankey>
      </ChartComponent>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {processedNodes.map((node, index) => (
          <div
            key={node.name}
            className="p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
            onMouseEnter={() => setHoveredNode(index)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: node.color }}
              />
              <span className="text-xs font-semibold text-slate-200">
                {node.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SankeyDiagram;
