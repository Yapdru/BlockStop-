import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card, CardHeader, CardBody } from '../../design-system/components/Card';

const meta = {
  title: 'Components/Charts',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Chart component examples and patterns for data visualization.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Simple bar chart
export const BarChart: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-2xl">
      <CardHeader padding="lg">
        <h3 className="font-bold text-lg">Monthly Revenue</h3>
      </CardHeader>
      <CardBody padding="lg">
        <div className="flex items-end gap-4 h-64 justify-around">
          {[45, 60, 75, 55, 80, 90].map((value, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-blue-600 rounded-t-lg"
                style={{ height: `${(value / 100) * 200}px` }}
              />
              <span className="text-xs text-neutral-600 mt-2">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">$405K</p>
            <p className="text-xs text-neutral-600">Total Revenue</p>
          </div>
        </div>
      </CardBody>
    </Card>
  ),
};

// Line chart
export const LineChart: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-2xl">
      <CardHeader padding="lg">
        <h3 className="font-bold text-lg">User Growth</h3>
      </CardHeader>
      <CardBody padding="lg">
        <svg viewBox="0 0 600 300" className="w-full">
          {/* Grid lines */}
          {[1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="50"
              y1={50 + i * 50}
              x2="550"
              y2={50 + i * 50}
              stroke="#e5e5e5"
              strokeWidth="1"
            />
          ))}
          {/* Line chart path */}
          <polyline
            points="50,200 120,150 190,120 260,130 330,80 400,60 470,40 550,30"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
          />
          {/* Dots */}
          {[50, 120, 190, 260, 330, 400, 470, 550].map((x, i) => (
            <circle key={i} cx={x} cy={[200, 150, 120, 130, 80, 60, 40, 30][i]} r="4" fill="#3b82f6" />
          ))}
          {/* Axes */}
          <line x1="50" y1="50" x2="50" y2="250" stroke="#000" strokeWidth="2" />
          <line x1="50" y1="250" x2="550" y2="250" stroke="#000" strokeWidth="2" />
        </svg>
        <div className="mt-4 text-center">
          <p className="text-2xl font-bold text-blue-600">2,450</p>
          <p className="text-xs text-neutral-600">Active Users</p>
        </div>
      </CardBody>
    </Card>
  ),
};

// Pie chart
export const PieChart: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-md">
      <CardHeader padding="lg">
        <h3 className="font-bold text-lg">Market Share</h3>
      </CardHeader>
      <CardBody padding="lg">
        <div className="flex items-center justify-center gap-8">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Pie slices */}
            <path
              d="M 100,100 L 100,20 A 80,80 0 0,1 180,100 Z"
              fill="#3b82f6"
            />
            <path
              d="M 100,100 L 180,100 A 80,80 0 0,1 60,170 Z"
              fill="#8b5cf6"
            />
            <path
              d="M 100,100 L 60,170 A 80,80 0 0,1 100,20 Z"
              fill="#ec4899"
            />
          </svg>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded" />
              <span className="text-sm">Product A: 45%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-600 rounded" />
              <span className="text-sm">Product B: 35%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-600 rounded" />
              <span className="text-sm">Product C: 20%</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  ),
};

// Progress chart
export const ProgressChart: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-md">
      <CardHeader padding="lg">
        <h3 className="font-bold text-lg">Project Progress</h3>
      </CardHeader>
      <CardBody padding="lg">
        <div className="space-y-4">
          {[
            { label: 'Design', progress: 100 },
            { label: 'Development', progress: 75 },
            { label: 'Testing', progress: 45 },
            { label: 'Deployment', progress: 20 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-neutral-600">{item.progress}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  ),
};

// Stacked bar chart
export const StackedBarChart: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-2xl">
      <CardHeader padding="lg">
        <h3 className="font-bold text-lg">Sales by Region</h3>
      </CardHeader>
      <CardBody padding="lg">
        <div className="space-y-4">
          {[
            { region: 'North America', values: [40, 30, 30] },
            { region: 'Europe', values: [35, 35, 30] },
            { region: 'Asia', values: [50, 25, 25] },
            { region: 'Other', values: [45, 30, 25] },
          ].map((item) => (
            <div key={item.region}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{item.region}</span>
                <span className="text-sm text-neutral-600">
                  {item.values.reduce((a, b) => a + b, 0)}K
                </span>
              </div>
              <div className="flex h-6 rounded-full overflow-hidden bg-neutral-200">
                <div
                  className="bg-blue-600"
                  style={{ width: `${(item.values[0] / 100) * 100}%` }}
                />
                <div
                  className="bg-purple-600"
                  style={{ width: `${(item.values[1] / 100) * 100}%` }}
                />
                <div
                  className="bg-pink-600"
                  style={{ width: `${(item.values[2] / 100) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded" />
            <span className="text-xs">Q1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-600 rounded" />
            <span className="text-xs">Q2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-600 rounded" />
            <span className="text-xs">Q3</span>
          </div>
        </div>
      </CardBody>
    </Card>
  ),
};

// Area chart
export const AreaChart: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-2xl">
      <CardHeader padding="lg">
        <h3 className="font-bold text-lg">Cumulative Users</h3>
      </CardHeader>
      <CardBody padding="lg">
        <svg viewBox="0 0 600 300" className="w-full">
          {/* Background area */}
          <path
            d="M 50,200 L 120,150 L 190,120 L 260,130 L 330,80 L 400,60 L 470,40 L 550,30 L 550,250 L 50,250 Z"
            fill="#3b82f6"
            fillOpacity="0.2"
          />
          {/* Line */}
          <polyline
            points="50,200 120,150 190,120 260,130 330,80 400,60 470,40 550,30"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
          />
          {/* Axes */}
          <line x1="50" y1="50" x2="50" y2="250" stroke="#000" strokeWidth="2" />
          <line x1="50" y1="250" x2="550" y2="250" stroke="#000" strokeWidth="2" />
        </svg>
      </CardBody>
    </Card>
  ),
};

// Gauge chart
export const GaugeChart: Story = {
  render: () => (
    <Card variant="elevated" padding="lg" className="max-w-md">
      <CardHeader padding="lg">
        <h3 className="font-bold text-lg">System Performance</h3>
      </CardHeader>
      <CardBody padding="lg">
        <div className="flex flex-col items-center">
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Background arc */}
            <path
              d="M 20,100 A 80,80 0 0,1 180,100"
              fill="none"
              stroke="#e5e5e5"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d="M 20,100 A 80,80 0 0,1 155,30"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Center text */}
            <text x="100" y="95" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#000">
              87%
            </text>
          </svg>
          <p className="text-center text-neutral-600 mt-4">
            Performance is <strong className="text-blue-600">excellent</strong>
          </p>
        </div>
      </CardBody>
    </Card>
  ),
};

// Heatmap
export const Heatmap: Story = {
  render: () => {
    const data = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => Math.floor(Math.random() * 100))
    );

    const getColor = (value: number) => {
      if (value < 20) return '#e0e7ff';
      if (value < 40) return '#c7d2fe';
      if (value < 60) return '#a5b4fc';
      if (value < 80) return '#818cf8';
      return '#4f46e5';
    };

    return (
      <Card variant="elevated" padding="lg" className="max-w-4xl">
        <CardHeader padding="lg">
          <h3 className="font-bold text-lg">Activity Heatmap</h3>
        </CardHeader>
        <CardBody padding="lg">
          <div className="overflow-x-auto">
            <div className="inline-block">
              {data.map((row, dayIdx) => (
                <div key={dayIdx} className="flex gap-1">
                  {row.map((value, hourIdx) => (
                    <div
                      key={hourIdx}
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: getColor(value) }}
                      title={`${value}% activity`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <span className="text-xs text-neutral-600">Low</span>
            <div className="flex gap-1">
              {[0, 25, 50, 75].map((val) => (
                <div
                  key={val}
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getColor(val) }}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-600">High</span>
          </div>
        </CardBody>
      </Card>
    );
  },
};

// Dark mode
export const DarkModePreview: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="bg-neutral-900 p-8 rounded-lg">
      <Card variant="elevated" padding="lg" className="max-w-md bg-neutral-800 border-neutral-700">
        <CardHeader padding="lg" className="border-neutral-700">
          <h3 className="font-bold text-lg text-white">Dark Mode Chart</h3>
        </CardHeader>
        <CardBody padding="lg">
          <div className="space-y-2">
            {[60, 45, 75].map((value, i) => (
              <div key={i}>
                <div className="w-full bg-neutral-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  ),
};
