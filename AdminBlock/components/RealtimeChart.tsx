'use client';

import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RealtimeChartProps {
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }>;
  height?: number;
}

export function RealtimeChart({
  title,
  labels,
  datasets,
  height = 300,
}: RealtimeChartProps) {
  const chartRef = useRef<any>(null);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        color: '#e4e6eb',
        font: {
          size: 14,
          weight: '600' as const,
        },
      },
      legend: {
        labels: {
          color: '#8a8d99',
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1a1f2e',
        titleColor: '#e4e6eb',
        bodyColor: '#e4e6eb',
        borderColor: '#2d3142',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: '#2d3142',
          drawBorder: false,
        },
        ticks: {
          color: '#8a8d99',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: '#2d3142',
          drawBorder: false,
        },
        ticks: {
          color: '#8a8d99',
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const data = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 2,
      pointBorderColor: dataset.borderColor,
    })),
  };

  return (
    <div className="bg-admin-card border border-admin-border rounded-admin p-4">
      <div style={{ height: `${height}px` }}>
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}
