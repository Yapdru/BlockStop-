'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface BackupStatus {
  id: string;
  service: string;
  lastBackup: Date;
  nextScheduled: Date;
  size: number;
  itemsCount: number;
  status: 'healthy' | 'warning' | 'error';
}

interface RTOTarget {
  service: string;
  target: number;
  current: number;
  met: boolean;
}

interface FailoverPolicy {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  status: 'active' | 'failed-over' | 'error';
  lastTest: Date;
}

const mockBackups: BackupStatus[] = [
  {
    id: '1',
    service: 'Primary Database',
    lastBackup: new Date(Date.now() - 3600000),
    nextScheduled: new Date(Date.now() + 3600000),
    size: 125e9,
    itemsCount: 2500000,
    status: 'healthy',
  },
  {
    id: '2',
    service: 'Document Store',
    lastBackup: new Date(Date.now() - 7200000),
    nextScheduled: new Date(Date.now() + 1800000),
    size: 75e9,
    itemsCount: 500000,
    status: 'healthy',
  },
  {
    id: '3',
    service: 'Search Index',
    lastBackup: new Date(Date.now() - 86400000),
    nextScheduled: new Date(Date.now() + 86400000),
    size: 45e9,
    itemsCount: 1000000,
    status: 'warning',
  },
];

const mockRTOTargets: RTOTarget[] = [
  { service: 'API Servers', target: 5, current: 3.2, met: true },
  { service: 'Database', target: 15, current: 12.5, met: true },
  { service: 'Cache Cluster', target: 2, current: 1.8, met: true },
  { service: 'Message Queue', target: 10, current: 14.2, met: false },
];

const mockFailoverPolicies: FailoverPolicy[] = [
  {
    id: '1',
    name: 'Primary Datacenter',
    primary: 'US-East-1',
    secondary: 'US-West-2',
    status: 'active',
    lastTest: new Date(Date.now() - 604800000),
  },
  {
    id: '2',
    name: 'Cache Layer',
    primary: 'us-east-1a',
    secondary: 'us-east-1b',
    status: 'active',
    lastTest: new Date(Date.now() - 1209600000),
  },
];

export default function DisasterRecoveryPage() {
  const [backups, setBackups] = useState<BackupStatus[]>(mockBackups);
  const [selectedPolicyForTest, setSelectedPolicyForTest] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Disaster Recovery</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Business continuity planning, backup management, failover, and resilience testing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" gap-2>
            <RefreshCw className="w-4 h-4" />
            Run Test
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Policy
          </Button>
        </div>
      </div>

      {/* Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overall Status</p>
              <p className="text-2xl font-bold text-green-600">Healthy</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">RTO Compliance</p>
              <p className="text-2xl font-bold text-green-600">75%</p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Backup Size</p>
              <p className="text-2xl font-bold text-blue-600">245 GB</p>
            </div>
            <Database className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Policies</p>
              <p className="text-2xl font-bold text-blue-600">{mockFailoverPolicies.length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* RTO Targets */}
      <div className="grid gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recovery Time Objectives (RTO)</h2>
        {mockRTOTargets.map((rto) => (
          <Card key={rto.service} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{rto.service}</h3>
                <div className="mt-2 flex items-center gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Target: </span>
                    <span className="font-semibold">{rto.target} minutes</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current: </span>
                    <span className={`font-semibold ${rto.met ? 'text-green-600' : 'text-red-600'}`}>
                      {rto.current} minutes
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {rto.met ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    On Target
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    At Risk
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Backup Status */}
      <div className="grid gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Backup Status</h2>
        {backups.map((backup) => (
          <Card key={backup.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{backup.service}</h3>
                  <Badge
                    variant={
                      backup.status === 'healthy'
                        ? 'default'
                        : backup.status === 'warning'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {backup.status}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Last Backup: </span>
                    <span className="font-semibold">
                      {backup.lastBackup.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Next Scheduled: </span>
                    <span className="font-semibold">
                      {backup.nextScheduled.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Size: </span>
                    <span className="font-semibold">{formatBytes(backup.size)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Items: </span>
                    <span className="font-semibold">
                      {(backup.itemsCount / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Failover Policies */}
      <div className="grid gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Failover Policies</h2>
        {mockFailoverPolicies.map((policy) => (
          <Card key={policy.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{policy.name}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Primary: </span>
                    <span className="font-semibold">{policy.primary}</span>
                  </div>
                  <Zap className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Secondary: </span>
                    <span className="font-semibold">{policy.secondary}</span>
                  </div>
                  <div className="ml-auto">
                    <span className="text-gray-600 dark:text-gray-400">Last Test: </span>
                    <span className="font-semibold">
                      {Math.floor((Date.now() - policy.lastTest.getTime()) / 86400000)} days ago
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    policy.status === 'active'
                      ? 'default'
                      : policy.status === 'failed-over'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {policy.status}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPolicyForTest(policy.id)}
                >
                  Test
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chaos Testing */}
      <Card className="p-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Chaos Engineering & Resilience Testing</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Simulate failures to test your system resilience: server outages, network latency, disk
          failures, database issues, and more
        </p>
        <Button variant="outline" className="gap-2">
          <Activity className="w-4 h-4" />
          Launch Chaos Test
        </Button>
      </Card>

      {/* Documentation */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold mb-2">Disaster Recovery Documentation</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          View comprehensive DR guides, recovery procedures, runbooks, and best practices
        </p>
        <Button variant="outline" className="mt-4">
          View Documentation
        </Button>
      </Card>
    </div>
  );
}
