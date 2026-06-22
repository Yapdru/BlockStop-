'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Trash2, CheckCircle, AlertCircle, Eye } from 'lucide-react';

interface Integration {
  id: string;
  provider: string;
  name: string;
  icon: string;
  status: 'active' | 'error' | 'pending';
  health: {
    status: 'healthy' | 'degraded' | 'error';
    lastCheck: Date;
    uptime: number;
  };
  category: string;
  installed: boolean;
  version?: string;
  lastSync?: Date;
}

const integrationCategories = [
  { id: 'communication', name: 'Communication', count: 0 },
  { id: 'ticketing', name: 'Ticketing', count: 0 },
  { id: 'cloud', name: 'Cloud Providers', count: 0 },
  { id: 'siem', name: 'SIEM', count: 0 },
  { id: 'monitoring', name: 'Monitoring', count: 0 },
];

const mockIntegrations: Integration[] = [
  {
    id: '1',
    provider: 'slack',
    name: 'Slack',
    icon: '💬',
    status: 'active',
    health: { status: 'healthy', lastCheck: new Date(), uptime: 99.9 },
    category: 'communication',
    installed: true,
    version: '2.0.1',
    lastSync: new Date(),
  },
  {
    id: '2',
    provider: 'microsoft-teams',
    name: 'Microsoft Teams',
    icon: '👥',
    status: 'active',
    health: { status: 'healthy', lastCheck: new Date(), uptime: 99.8 },
    category: 'communication',
    installed: true,
    version: '1.5.0',
    lastSync: new Date(),
  },
  {
    id: '3',
    provider: 'jira',
    name: 'Jira',
    icon: '📋',
    status: 'active',
    health: { status: 'degraded', lastCheck: new Date(), uptime: 98.5 },
    category: 'ticketing',
    installed: true,
    version: '3.2.0',
    lastSync: new Date('2024-01-22'),
  },
  {
    id: '4',
    provider: 'servicenow',
    name: 'ServiceNow',
    icon: '🎯',
    status: 'pending',
    health: { status: 'error', lastCheck: new Date(), uptime: 0 },
    category: 'ticketing',
    installed: false,
  },
  {
    id: '5',
    provider: 'aws',
    name: 'Amazon Web Services',
    icon: '☁️',
    status: 'active',
    health: { status: 'healthy', lastCheck: new Date(), uptime: 99.99 },
    category: 'cloud',
    installed: true,
    version: '1.8.0',
    lastSync: new Date(),
  },
  {
    id: '6',
    provider: 'azure',
    name: 'Microsoft Azure',
    icon: '🔵',
    status: 'active',
    health: { status: 'healthy', lastCheck: new Date(), uptime: 99.95 },
    category: 'cloud',
    installed: true,
    version: '2.1.0',
    lastSync: new Date(),
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const filteredIntegrations = integrations.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || i.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUninstall = (id: string) => {
    setIntegrations((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Enterprise Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect BlockStop with 23+ enterprise tools including Slack, Teams, Jira, ServiceNow, SIEM, and cloud providers
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Integration
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4">
        <Input
          placeholder="Search integrations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </Button>
          {integrationCategories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIntegrations.map((integration) => (
          <Card
            key={integration.id}
            className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
              integration.status === 'error' ? 'border-red-200 dark:border-red-800' : ''
            }`}
            onClick={() => setSelectedIntegration(integration)}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {integration.category}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex gap-2">
                  {integration.installed ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Installed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Installed</Badge>
                  )}
                </div>
              </div>

              {/* Health Status */}
              {integration.installed && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {integration.health.status === 'healthy' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : integration.health.status === 'degraded' ? (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm">
                      Status: <span className="font-semibold">{integration.health.status}</span>
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Uptime: {integration.health.uptime}%</span>
                    {integration.version && <span>v{integration.version}</span>}
                  </div>
                  {integration.lastSync && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Last sync: {integration.lastSync.toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-2">
                  <Settings className="w-4 h-4" />
                  Configure
                </Button>
                {integration.installed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUninstall(integration.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="outline" size="sm">
                    Install
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Integration Details Panel */}
      {selectedIntegration && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedIntegration.name} Details
            </h2>
            <Button
              variant="ghost"
              onClick={() => setSelectedIntegration(null)}
            >
              ✕
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Integration details, webhook configuration, API keys, and testing tools coming soon
          </p>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {integrations.filter((i) => i.installed).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Installed</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">
            {integrations.filter((i) => i.health.status === 'healthy').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Healthy</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-red-600">
            {integrations.filter((i) => i.health.status === 'error').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Issues</div>
        </Card>
      </div>
    </div>
  );
}
