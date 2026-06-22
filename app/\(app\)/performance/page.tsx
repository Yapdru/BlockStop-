'use client';

/**
 * BlockStop Performance Dashboard
 * Real-time monitoring of system performance, sync status, offline capacity, and alert metrics
 *
 * Phase 30.6 - Performance & Offline
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Activity,
  Cloud,
  Cpu,
  Database,
  HardDrive,
  Zap,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';

interface PerformanceMetric {
  timestamp: number;
  queryDuration: number;
  cacheHitRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface SyncMetric {
  timestamp: number;
  bytesSynced: number;
  changeCount: number;
  conflictCount: number;
  syncDuration: number;
}

interface AlertMetric {
  timestamp: number;
  activeAlerts: number;
  criticalAlerts: number;
  escalatedAlerts: number;
  acknowledgedAlerts: number;
}

interface OfflineMetric {
  timestamp: number;
  scannedFiles: number;
  threatsDetected: number;
  databaseSize: number;
  mlModelsLoaded: number;
}

export default function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [syncData, setSyncData] = useState<SyncMetric[]>([]);
  const [alertData, setAlertData] = useState<AlertMetric[]>([]);
  const [offlineData, setOfflineData] = useState<OfflineMetric[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'pending'>('idle');
  const [offlineCapacity, setOfflineCapacity] = useState(75);
  const [currentMetrics, setCurrentMetrics] = useState({
    avgQueryTime: 0,
    cacheHitRate: 0,
    activeConnections: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    pendingChanges: 0,
    conflicts: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
  });

  // Simulate metrics data
  useEffect(() => {
    const generateMetric = () => {
      const timestamp = Date.now();
      const baseTime = Math.floor(Date.now() / 1000);

      // Performance data
      setPerformanceData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp: baseTime,
            queryDuration: Math.random() * 100 + 10,
            cacheHitRate: Math.random() * 0.4 + 0.6,
            activeConnections: Math.floor(Math.random() * 20) + 5,
            memoryUsage: Math.random() * 30 + 40,
            cpuUsage: Math.random() * 40 + 20,
          },
        ];
        return newData.slice(-30);
      });

      // Sync data
      setSyncData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp: baseTime,
            bytesSynced: Math.floor(Math.random() * 5000) + 1000,
            changeCount: Math.floor(Math.random() * 50) + 10,
            conflictCount: Math.floor(Math.random() * 5),
            syncDuration: Math.random() * 2000 + 500,
          },
        ];
        return newData.slice(-20);
      });

      // Alert data
      setAlertData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp: baseTime,
            activeAlerts: Math.floor(Math.random() * 30) + 5,
            criticalAlerts: Math.floor(Math.random() * 5),
            escalatedAlerts: Math.floor(Math.random() * 8),
            acknowledgedAlerts: Math.floor(Math.random() * 15) + 5,
          },
        ];
        return newData.slice(-20);
      });

      // Offline data
      setOfflineData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp: baseTime,
            scannedFiles: Math.floor(Math.random() * 10000) + 1000,
            threatsDetected: Math.floor(Math.random() * 50),
            databaseSize: Math.random() * 200 + 100,
            mlModelsLoaded: Math.floor(Math.random() * 2) + 1,
          },
        ];
        return newData.slice(-20);
      });

      // Current metrics
      setCurrentMetrics({
        avgQueryTime: Math.random() * 100 + 10,
        cacheHitRate: Math.random() * 0.4 + 0.6,
        activeConnections: Math.floor(Math.random() * 20) + 5,
        memoryUsage: Math.random() * 30 + 40,
        cpuUsage: Math.random() * 40 + 20,
        pendingChanges: Math.floor(Math.random() * 100) + 10,
        conflicts: Math.floor(Math.random() * 5),
        activeAlerts: Math.floor(Math.random() * 30) + 5,
        criticalAlerts: Math.floor(Math.random() * 5),
      });
    };

    const interval = setInterval(generateMetric, 2000);
    generateMetric(); // Initial data

    return () => clearInterval(interval);
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync simulation
  useEffect(() => {
    if (isOnline && syncStatus === 'pending') {
      setSyncStatus('syncing');
      const timer = setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncStatus]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    unit = '',
  }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down' | 'stable';
    unit?: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-2">
              {value}
              {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
            </p>
          </div>
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1">
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
            <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trend === 'up' ? 'Improving' : 'Declining'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of system performance and threat detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <Badge variant="default" className="bg-green-600">
                  Online
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-gray-500" />
                <Badge variant="outline">Offline</Badge>
              </>
            )}
          </div>
          <Badge variant={syncStatus === 'idle' ? 'secondary' : 'default'}>
            {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'pending' ? 'Pending' : 'Synced'}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Query Time"
          value={currentMetrics.avgQueryTime.toFixed(0)}
          icon={Clock}
          unit="ms"
          trend="down"
        />
        <StatCard
          title="Cache Hit Rate"
          value={(currentMetrics.cacheHitRate * 100).toFixed(1)}
          icon={Activity}
          unit="%"
          trend="up"
        />
        <StatCard
          title="Memory Usage"
          value={currentMetrics.memoryUsage.toFixed(1)}
          icon={HardDrive}
          unit="MB"
          trend="stable"
        />
        <StatCard
          title="CPU Usage"
          value={currentMetrics.cpuUsage.toFixed(1)}
          icon={Cpu}
          unit="%"
          trend="stable"
        />
      </div>

      {/* Alert Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Alerts"
          value={currentMetrics.activeAlerts}
          icon={AlertCircle}
          trend="down"
        />
        <StatCard
          title="Critical Alerts"
          value={currentMetrics.criticalAlerts}
          icon={Zap}
          trend="down"
        />
        <StatCard
          title="Pending Changes"
          value={currentMetrics.pendingChanges}
          icon={Cloud}
        />
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="query" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="query">Query Performance</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Duration Trend</CardTitle>
              <CardDescription>Average query execution time over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="queryDuration"
                    stroke="#3b82f6"
                    dot={false}
                    name="Query Duration (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>Memory and CPU usage patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="memoryUsage"
                    stackId="1"
                    stroke="#ec4899"
                    fill="#ec4899"
                    name="Memory (MB)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cpuUsage"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    name="CPU (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Hit Rate</p>
                  <Progress value={currentMetrics.cacheHitRate * 100} />
                  <p className="text-sm mt-1">
                    {(currentMetrics.cacheHitRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Active Connections</p>
                  <Progress value={currentMetrics.activeConnections} max={50} />
                  <p className="text-sm mt-1">{currentMetrics.activeConnections}/50</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Pool Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'Active',
                          value: currentMetrics.activeConnections,
                        },
                        {
                          name: 'Available',
                          value: 50 - currentMetrics.activeConnections,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Activity</CardTitle>
              <CardDescription>Data synchronization metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={syncData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bytesSynced" fill="#10b981" name="Bytes Synced" />
                  <Bar dataKey="changeCount" fill="#3b82f6" name="Changes" />
                  <Bar dataKey="conflictCount" fill="#ef4444" name="Conflicts" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Network Status</span>
                    <Badge variant={isOnline ? 'default' : 'outline'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Sync</span>
                    <span className="text-sm font-semibold">2 minutes ago</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Changes</span>
                    <span className="text-sm font-semibold">{currentMetrics.pendingChanges}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Conflicts</span>
                    <span className="text-sm font-semibold">{currentMetrics.conflicts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {syncData.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Avg Sync Duration</p>
                      <p className="text-2xl font-bold">
                        {(syncData.reduce((sum, d) => sum + d.syncDuration, 0) / syncData.length).toFixed(0)}
                        ms
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Data Synced</p>
                      <p className="text-2xl font-bold">
                        {(syncData.reduce((sum, d) => sum + d.bytesSynced, 0) / 1024).toFixed(1)}
                        KB
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Volume Trend</CardTitle>
              <CardDescription>Number of active alerts over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={alertData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="activeAlerts"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    name="Active Alerts"
                  />
                  <Area
                    type="monotone"
                    dataKey="criticalAlerts"
                    stroke="#ef4444"
                    fill="#ef4444"
                    name="Critical Alerts"
                  />
                  <Area
                    type="monotone"
                    dataKey="escalatedAlerts"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    name="Escalated Alerts"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alert Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Alerts</span>
                  <Badge variant="default">{currentMetrics.activeAlerts}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Critical</span>
                  <Badge variant="destructive">{currentMetrics.criticalAlerts}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Acknowledged</span>
                  <Badge variant="secondary">~12</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alert Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Critical', value: currentMetrics.criticalAlerts },
                        { name: 'High', value: 8 },
                        { name: 'Medium', value: 5 },
                        { name: 'Low', value: 3 },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#f97316" />
                      <Cell fill="#eab308" />
                      <Cell fill="#84cc16" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-xl font-bold">~8 min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Escalation Rate</p>
                  <p className="text-xl font-bold">2.3%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="offline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offline Database Size</CardTitle>
              <CardDescription>Threat signature database growth</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={offlineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="databaseSize"
                    stroke="#10b981"
                    dot={false}
                    name="Database Size (MB)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Offline Capacity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Used</span>
                    <span className="text-sm font-semibold">{offlineCapacity}%</span>
                  </div>
                  <Progress value={offlineCapacity} />
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Threat Rules: 500K+</p>
                  <p>ML Models: 2 loaded</p>
                  <p>Available: 512 MB</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Detection</CardTitle>
              </CardHeader>
              <CardContent>
                {offlineData.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Scanned</p>
                      <p className="text-2xl font-bold">
                        {offlineData[offlineData.length - 1].scannedFiles.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Threats Found</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {offlineData[offlineData.length - 1].threatsDetected}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Offline Scan Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={offlineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scannedFiles" fill="#3b82f6" name="Files Scanned" />
                  <Bar dataKey="threatsDetected" fill="#ef4444" name="Threats" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
