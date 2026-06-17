'use client';

import React from 'react';
import LineChart from './LineChart';
import BarChart from './BarChart';
import PieChart from './PieChart';
import AreaChart from './AreaChart';
import Heatmap from './Heatmap';
import SankeyDiagram from './SankeyDiagram';
import NetworkGraph from './NetworkGraph';
import GeographicMap from './GeographicMap';
import Timeline from './Timeline';
import GaugeChart from './GaugeChart';
import TrendIndicator from './TrendIndicator';
import Sparkline, { InlineSparkline } from './Sparkline';
import DataTable from './DataTable';

// Sample data for demonstrations
const timeSeriesData = [
  { date: 'Jan 1', threats: 45, malware: 12, phishing: 33 },
  { date: 'Jan 2', threats: 52, malware: 15, phishing: 37 },
  { date: 'Jan 3', threats: 48, malware: 10, phishing: 38 },
  { date: 'Jan 4', threats: 61, malware: 20, phishing: 41 },
  { date: 'Jan 5', threats: 55, malware: 18, phishing: 37 },
  { date: 'Jan 6', threats: 67, malware: 25, phishing: 42 },
  { date: 'Jan 7', threats: 72, malware: 28, phishing: 44 },
];

const categoryData = [
  { category: 'Malware', count: 156, percentage: 35 },
  { category: 'Phishing', count: 142, percentage: 32 },
  { category: 'Ransomware', count: 98, percentage: 22 },
  { category: 'Exploit', count: 49, percentage: 11 },
];

const distributionData = [
  { name: 'Critical', value: 45, color: '#ef4444' },
  { name: 'High', value: 87, color: '#f97316' },
  { name: 'Medium', value: 156, color: '#f59e0b' },
  { name: 'Low', value: 234, color: '#10b981' },
];

const geoLocations = [
  { name: 'New York', latitude: 40.7128, longitude: -74.006, value: 156, intensity: 0.9 },
  { name: 'London', latitude: 51.5074, longitude: -0.1278, value: 98, intensity: 0.7 },
  { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, value: 142, intensity: 0.85 },
  { name: 'Sydney', latitude: -33.8688, longitude: 151.2093, value: 67, intensity: 0.5 },
  { name: 'Toronto', latitude: 43.6532, longitude: -79.3832, value: 89, intensity: 0.6 },
];

const timelineEvents = [
  {
    id: '1',
    date: new Date(2024, 0, 15),
    title: 'Major Phishing Campaign Detected',
    description: 'A coordinated phishing campaign targeting enterprise email accounts',
    category: 'Phishing',
    severity: 'critical' as const,
    color: '#ef4444',
  },
  {
    id: '2',
    date: new Date(2024, 0, 12),
    title: 'Zero-Day Exploit Patched',
    description: 'Critical vulnerability in web server was identified and patched',
    category: 'Exploit',
    severity: 'high' as const,
    color: '#f97316',
  },
  {
    id: '3',
    date: new Date(2024, 0, 8),
    title: 'Ransomware Detection',
    description: 'Ransomware detected on network segment, isolated immediately',
    category: 'Ransomware',
    severity: 'critical' as const,
    color: '#ef4444',
  },
];

const networkNodes = [
  { id: '1', label: 'Router', color: '#3b82f6' },
  { id: '2', label: 'Firewall', color: '#ef4444' },
  { id: '3', label: 'Server A', color: '#10b981' },
  { id: '4', label: 'Server B', color: '#10b981' },
  { id: '5', label: 'Database', color: '#f59e0b' },
  { id: '6', label: 'Workstation', color: '#8b5cf6' },
];

const networkLinks = [
  { source: '1', target: '2', weight: 2 },
  { source: '2', target: '3', weight: 1 },
  { source: '2', target: '4', weight: 1 },
  { source: '3', target: '5', weight: 2 },
  { source: '4', target: '5', weight: 2 },
  { source: '2', target: '6', weight: 1 },
];

const tableData = [
  {
    id: 1,
    timestamp: '2024-01-15 14:23',
    type: 'Phishing',
    source: '192.168.1.100',
    destination: 'attacker.com',
    status: 'Blocked',
    severity: 'High',
  },
  {
    id: 2,
    timestamp: '2024-01-15 13:45',
    type: 'Malware',
    source: '192.168.1.105',
    destination: 'malware.net',
    status: 'Blocked',
    severity: 'Critical',
  },
  {
    id: 3,
    timestamp: '2024-01-15 12:10',
    type: 'Port Scan',
    source: '203.0.113.45',
    destination: 'Internal Network',
    status: 'Detected',
    severity: 'Medium',
  },
];

const heatmapData = [
  { x: 'Mon', y: 'Morning', value: 45, color: '#10b981' },
  { x: 'Mon', y: 'Afternoon', value: 78, color: '#f59e0b' },
  { x: 'Mon', y: 'Evening', value: 92, color: '#ef4444' },
  { x: 'Tue', y: 'Morning', value: 52, color: '#10b981' },
  { x: 'Tue', y: 'Afternoon', value: 85, color: '#ef4444' },
  { x: 'Tue', y: 'Evening', value: 88, color: '#ef4444' },
  { x: 'Wed', y: 'Morning', value: 48, color: '#f59e0b' },
  { x: 'Wed', y: 'Afternoon', value: 91, color: '#ef4444' },
  { x: 'Wed', y: 'Evening', value: 75, color: '#f59e0b' },
];

const sankeyNodes = [
  { name: 'Email' },
  { name: 'Network' },
  { name: 'Web' },
  { name: 'Phishing' },
  { name: 'Malware' },
  { name: 'Blocked' },
];

const sankeyLinks = [
  { source: 0, target: 3, value: 80 },
  { source: 1, target: 4, value: 120 },
  { source: 2, target: 4, value: 60 },
  { source: 3, target: 5, value: 80 },
  { source: 4, target: 5, value: 180 },
];

export const ChartExamples: React.FC = () => {
  return (
    <div className="space-y-12 p-8 bg-slate-950">
      {/* Line Chart */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Time Series - Threat Detection Over Time
        </h2>
        <LineChart
          data={timeSeriesData}
          xAxisKey="date"
          xAxisLabel="Date"
          yAxisLabel="Number of Threats"
          title="Daily Threat Detection Trends"
          lines={[
            {
              dataKey: 'threats',
              name: 'Total Threats',
              color: '#3b82f6',
              strokeWidth: 2,
            },
            {
              dataKey: 'malware',
              name: 'Malware',
              color: '#ef4444',
              strokeWidth: 2,
            },
            {
              dataKey: 'phishing',
              name: 'Phishing',
              color: '#f59e0b',
              strokeWidth: 2,
            },
          ]}
          height={400}
        />
      </section>

      {/* Bar Chart */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Categorical - Threat Distribution
        </h2>
        <BarChart
          data={categoryData}
          xAxisKey="category"
          xAxisLabel="Threat Type"
          yAxisLabel="Count"
          title="Threat Types by Count"
          bars={[
            {
              dataKey: 'count',
              name: 'Number of Incidents',
              color: '#3b82f6',
            },
          ]}
          layout="horizontal"
          height={300}
        />
      </section>

      {/* Pie Chart */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Distribution - Severity Breakdown
        </h2>
        <PieChart
          data={distributionData}
          title="Threat Distribution by Severity"
          height={400}
        />
      </section>

      {/* Area Chart */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Cumulative Trends - Stacked Threats
        </h2>
        <AreaChart
          data={timeSeriesData}
          xAxisKey="date"
          title="Cumulative Threat Categories"
          areas={[
            {
              dataKey: 'malware',
              name: 'Malware',
              color: '#ef4444',
              stackId: 'stack',
            },
            {
              dataKey: 'phishing',
              name: 'Phishing',
              color: '#f59e0b',
              stackId: 'stack',
            },
          ]}
          height={350}
          stacked={true}
        />
      </section>

      {/* Heatmap */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Pattern Detection - Attack Timing Matrix
        </h2>
        <Heatmap
          data={heatmapData}
          title="Threat Intensity by Time of Day"
          colorScheme="cool"
          cellSize={50}
          showValues={true}
        />
      </section>

      {/* Sankey Diagram */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Flow Visualization - Threat Routes
        </h2>
        <SankeyDiagram
          nodes={sankeyNodes}
          links={sankeyLinks}
          title="Threat Flow: Source to Status"
          height={400}
        />
      </section>

      {/* Network Graph */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Network Topology - System Connections
        </h2>
        <NetworkGraph
          nodes={networkNodes}
          links={networkLinks}
          title="Network Topology Visualization"
          width={800}
          height={500}
          physics={true}
        />
      </section>

      {/* Geographic Map */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Threat Geo-Mapping - Global Distribution
        </h2>
        <GeographicMap
          locations={geoLocations}
          title="Threat Incidents by Geographic Location"
          width={1000}
          height={500}
          showHeatmap={true}
        />
      </section>

      {/* Timeline */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Historical Timeline - Security Events
        </h2>
        <Timeline
          events={timelineEvents}
          title="Security Events Timeline"
          orientation="vertical"
        />
      </section>

      {/* Gauge Charts */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Risk/Health Metrics - System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GaugeChart
            value={72}
            max={100}
            title="Overall Risk Level"
            unit="%"
            subtitle="Current threat score"
          />
          <GaugeChart
            value={85}
            max={100}
            title="System Health"
            unit="%"
            subtitle="Security posture"
          />
          <GaugeChart
            value={43}
            max={100}
            title="Vulnerability Score"
            unit="%"
            subtitle="Patch compliance"
          />
        </div>
      </section>

      {/* Trend Indicators */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Quick Trend Display - KPI Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <TrendIndicator
            current={456}
            previous={389}
            label="Total Threats"
            unit=""
            showChart={true}
            sparklineData={[45, 52, 48, 61, 55, 67, 72]}
          />
          <TrendIndicator
            current={28}
            previous={22}
            label="Blocked Attacks"
            unit=""
            showChart={true}
            sparklineData={[12, 15, 10, 20, 18, 25, 28]}
          />
          <TrendIndicator
            current={12}
            previous={15}
            label="False Positives"
            unit=""
            colorScheme="success"
            showChart={true}
            sparklineData={[18, 17, 16, 15, 14, 13, 12]}
            trend="down"
          />
          <TrendIndicator
            current={94}
            previous={89}
            label="Uptime %"
            unit="%"
            colorScheme="success"
            showChart={true}
            sparklineData={[89, 90, 91, 92, 92, 93, 94]}
            trend="up"
          />
        </div>
      </section>

      {/* Sparklines */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Mini Inline Charts - Sparklines
        </h2>
        <div className="space-y-3 bg-slate-900 p-4 rounded-lg border border-slate-700">
          <InlineSparkline
            data={[45, 52, 48, 61, 55, 67, 72]}
            label="Daily Threats"
            value={72}
            previous={67}
            unit=""
          />
          <InlineSparkline
            data={[12, 15, 10, 20, 18, 25, 28]}
            label="Blocked Attacks"
            value={28}
            previous={25}
            unit=""
          />
          <InlineSparkline
            data={[33, 37, 38, 41, 37, 42, 44]}
            label="Phishing Attempts"
            value={44}
            previous={42}
            unit=""
          />
        </div>
      </section>

      {/* Data Table */}
      <section>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Sortable Data Table with Export
        </h2>
        <DataTable
          data={tableData}
          title="Recent Security Events"
          columns={[
            { key: 'timestamp', header: 'Timestamp', sortable: true },
            { key: 'type', header: 'Type', sortable: true },
            { key: 'source', header: 'Source IP', sortable: true },
            { key: 'destination', header: 'Destination', sortable: true },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              render: (value) => (
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    value === 'Blocked'
                      ? 'bg-red-900 text-red-100'
                      : 'bg-yellow-900 text-yellow-100'
                  }`}
                >
                  {value}
                </span>
              ),
            },
            {
              key: 'severity',
              header: 'Severity',
              sortable: true,
              render: (value) => (
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    value === 'Critical'
                      ? 'bg-red-900 text-red-100'
                      : value === 'High'
                      ? 'bg-orange-900 text-orange-100'
                      : 'bg-yellow-900 text-yellow-100'
                  }`}
                >
                  {value}
                </span>
              ),
            },
          ]}
          pageSize={10}
          searchable={true}
          striped={true}
          hoverable={true}
        />
      </section>
    </div>
  );
};

export default ChartExamples;
