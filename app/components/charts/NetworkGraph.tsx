'use client';

import React, { useEffect, useRef, useState } from 'react';

interface NetworkNode {
  id: string;
  label: string;
  color?: string;
  size?: number;
  group?: string;
}

interface NetworkLink {
  source: string;
  target: string;
  weight?: number;
  color?: string;
}

interface NetworkGraphProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  width?: number;
  height?: number;
  title?: string;
  containerClassName?: string;
  onExportData?: () => void;
  nodeRadius?: number;
  linkDistance?: number;
  showLabels?: boolean;
  physics?: boolean;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  links,
  width = 800,
  height = 600,
  title,
  containerClassName = '',
  onExportData,
  nodeRadius = 8,
  linkDistance = 100,
  showLabels = true,
  physics = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const velocitiesRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const defaultColors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
  ];

  // Initialize node positions
  useEffect(() => {
    const positions = positionsRef.current;
    const velocities = velocitiesRef.current;

    nodes.forEach((node) => {
      if (!positions.has(node.id)) {
        positions.set(node.id, {
          x: Math.random() * width,
          y: Math.random() * height,
        });
        velocities.set(node.id, { x: 0, y: 0 });
      }
    });
  }, [nodes, width, height]);

  // Physics simulation
  useEffect(() => {
    if (!physics || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const damping = 0.99;
    const repulsionStrength = 5000;
    const attractionStrength = 0.1;
    const timeStep = 0.016; // ~60fps

    const simulate = () => {
      const positions = positionsRef.current;
      const velocities = velocitiesRef.current;

      // Apply forces
      nodes.forEach((nodeA) => {
        let fx = 0,
          fy = 0;
        const posA = positions.get(nodeA.id);
        if (!posA) return;

        // Repulsion between all nodes
        nodes.forEach((nodeB) => {
          if (nodeA.id === nodeB.id) return;
          const posB = positions.get(nodeB.id);
          if (!posB) return;

          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          fx -= (dx / dist) * (repulsionStrength / (dist * dist));
          fy -= (dy / dist) * (repulsionStrength / (dist * dist));
        });

        // Attraction for connected nodes
        links.forEach((link) => {
          if (link.source === nodeA.id) {
            const posB = positions.get(link.target);
            if (!posB) return;

            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDist = linkDistance;

            fx += (dx / dist) * attractionStrength * (dist - targetDist);
            fy += (dy / dist) * attractionStrength * (dist - targetDist);
          } else if (link.target === nodeA.id) {
            const posB = positions.get(link.source);
            if (!posB) return;

            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDist = linkDistance;

            fx += (dx / dist) * attractionStrength * (dist - targetDist);
            fy += (dy / dist) * attractionStrength * (dist - targetDist);
          }
        });

        // Update velocity and position
        const vel = velocities.get(nodeA.id);
        if (vel) {
          vel.x = (vel.x + fx * timeStep) * damping;
          vel.y = (vel.y + fy * timeStep) * damping;

          posA.x += vel.x * timeStep;
          posA.y += vel.y * timeStep;

          // Boundary conditions
          posA.x = Math.max(nodeRadius, Math.min(canvas.width - nodeRadius, posA.x));
          posA.y = Math.max(nodeRadius, Math.min(canvas.height - nodeRadius, posA.y));
        }
      });

      // Draw
      draw(ctx);
      animationFrameId = requestAnimationFrame(simulate);
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const positions = positionsRef.current;

      // Draw links
      links.forEach((link) => {
        const sourcePos = positions.get(link.source);
        const targetPos = positions.get(link.target);
        if (!sourcePos || !targetPos) return;

        ctx.strokeStyle = link.color || 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = link.weight || 1;
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pos = positions.get(node.id);
        if (!pos) return;

        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode === node.id;
        const nodeColor = node.color || defaultColors[nodes.indexOf(node) % defaultColors.length];
        const radius = isHovered ? nodeRadius * 1.5 : node.size || nodeRadius;

        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw label
        if (showLabels) {
          ctx.fillStyle = '#f1f5f9';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, pos.x, pos.y);
        }
      });
    };

    const handleCanvasClick = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const positions = positionsRef.current;
      for (const node of nodes) {
        const pos = positions.get(node.id);
        if (!pos) continue;

        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist < (node.size || nodeRadius) * 2) {
          setSelectedNode(node.id);
          return;
        }
      }
      setSelectedNode(null);
    };

    const handleCanvasMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const positions = positionsRef.current;
      let found = false;

      for (const node of nodes) {
        const pos = positions.get(node.id);
        if (!pos) continue;

        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist < (node.size || nodeRadius) * 2) {
          setHoveredNode(node.id);
          found = true;
          break;
        }
      }

      if (!found) {
        setHoveredNode(null);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMove);

    simulate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMove);
    };
  }, [nodes, links, physics, nodeRadius, linkDistance, showLabels]);

  const handleExport = () => {
    if (onExportData) {
      onExportData();
    } else {
      const nodesCsv = [
        ['ID', 'Label', 'Color', 'Size'].join(','),
        ...nodes.map((n) => [n.id, n.label, n.color || '#3b82f6', n.size || nodeRadius].join(',')),
      ].join('\n');

      const linksCsv = [
        ['Source', 'Target', 'Weight', 'Color'].join(','),
        ...links.map((l) => [l.source, l.target, l.weight || 1, l.color || 'default'].join(',')),
      ].join('\n');

      const fullCsv = `NODES\n${nodesCsv}\n\nLINKS\n${linksCsv}`;
      const blob = new Blob([fullCsv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'network-data.csv';
      a.click();
    }
  };

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

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 cursor-pointer"
        style={{ display: 'block' }}
      />

      {hoveredNode && (
        <div className="mt-3 p-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200">
          <span className="font-semibold">
            {nodes.find((n) => n.id === hoveredNode)?.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
