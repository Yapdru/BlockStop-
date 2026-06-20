'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button, Tabs } from '@/components';
import { WebhookConfig, IntegrationConfig, SIEMIntegration } from '@/types/enterprise';
import { LoadingSpinner } from '@/app/components/animations/LoadingSpinner';
import { FadeIn } from '@/app/components/animations/FadeIn';

interface WebhookForm {
  name: string;
  url: string;
  events: string[];
  active: boolean;
}

interface IntegrationForm {
  name: string;
  type: 'siem' | 'edr' | 'custom' | 'api';
  endpoint: string;
  apiKey?: string;
  secret?: string;
}

export default function EnterpriseIntegrationsPage() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('webhooks');
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [showCreateIntegration, setShowCreateIntegration] = useState(false);
  const [error, setError] = useState('');

  const [webhookForm, setWebhookForm] = useState<WebhookForm>({
    name: '',
    url: '',
    events: [],
    active: true,
  });

  const [integrationForm, setIntegrationForm] = useState<IntegrationForm>({
    name: '',
    type: 'siem',
    endpoint: '',
  });

  const availableEvents = [
    'threat.detected',
    'threat.resolved',
    'scan.completed',
    'compliance.alert',
    'rule.created',
    'rule.updated',
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const headers = { 'x-user-id': userId || '' };

      const [webhooksRes, integrationsRes] = await Promise.all([
        fetch('/api/enterprise/webhooks', { headers }),
        fetch('/api/enterprise/integrations', { headers }),
      ]);

      if (webhooksRes.ok && integrationsRes.ok) {
        setWebhooks(await webhooksRes.json());
        setIntegrations(await integrationsRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/enterprise/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify(webhookForm),
      });

      if (response.ok) {
        const newWebhook = await response.json();
        setWebhooks([...webhooks, newWebhook]);
        setShowCreateWebhook(false);
        setWebhookForm({ name: '', url: '', events: [], active: true });
      }
    } catch (err) {
      setError('Failed to create webhook');
    }
  };

  const handleCreateIntegration = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/enterprise/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify(integrationForm),
      });

      if (response.ok) {
        const newIntegration = await response.json();
        setIntegrations([...integrations, newIntegration]);
        setShowCreateIntegration(false);
        setIntegrationForm({ name: '', type: 'siem', endpoint: '' });
      }
    } catch (err) {
      setError('Failed to create integration');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/enterprise/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId || '' },
      });

      if (response.ok) {
        setWebhooks(webhooks.filter((w) => w.id !== webhookId));
      }
    } catch (err) {
      setError('Failed to delete webhook');
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/enterprise/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { 'x-user-id': userId || '' },
      });

      if (response.ok) {
        alert('Webhook test successful!');
      }
    } catch (err) {
      alert('Webhook test failed');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <FadeIn>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Integrations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage webhooks, SIEM integrations, and API connections
            </p>
          </div>

          {error && (
            <div className="bg-danger/10 text-danger p-4 rounded-lg">{error}</div>
          )}

          {/* Tabs */}
          <Tabs
            tabs={[
              {
                id: 'webhooks',
                label: 'Webhooks',
                content: (
                  <div className="p-4 space-y-4">
                    {webhooks.length === 0 && !showCreateWebhook && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No webhooks configured yet</p>
                        <Button onClick={() => setShowCreateWebhook(true)}>
                          Create First Webhook
                        </Button>
                      </div>
                    )}

                    {webhooks.map((webhook) => (
                      <Card key={webhook.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {webhook.name}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  webhook.active
                                    ? 'bg-success/20 text-success'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              >
                                {webhook.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {webhook.url}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {webhook.events.map((event) => (
                                <span
                                  key={event}
                                  className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
                                >
                                  {event}
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-gray-500">
                              {webhook.lastTriggeredAt
                                ? `Last triggered: ${new Date(webhook.lastTriggeredAt).toLocaleString()}`
                                : 'Never triggered'}
                              • Failures: {webhook.failureCount}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleTestWebhook(webhook.id)}
                            >
                              Test
                            </Button>
                            <button
                              onClick={() => handleDeleteWebhook(webhook.id)}
                              className="px-3 py-1 rounded text-sm font-medium bg-danger/10 text-danger hover:bg-danger/20"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {showCreateWebhook && (
                      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                        <h3 className="font-semibold mb-4">Create Webhook</h3>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Webhook name"
                            value={webhookForm.name}
                            onChange={(e) =>
                              setWebhookForm({ ...webhookForm, name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                          />
                          <input
                            type="url"
                            placeholder="Webhook URL"
                            value={webhookForm.url}
                            onChange={(e) =>
                              setWebhookForm({ ...webhookForm, url: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                          />
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Events to Subscribe
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {availableEvents.map((event) => (
                                <label
                                  key={event}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={webhookForm.events.includes(event)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setWebhookForm({
                                          ...webhookForm,
                                          events: [...webhookForm.events, event],
                                        });
                                      } else {
                                        setWebhookForm({
                                          ...webhookForm,
                                          events: webhookForm.events.filter((ev) => ev !== event),
                                        });
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{event}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setShowCreateWebhook(false)}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleCreateWebhook}>
                              Create
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}

                    {!showCreateWebhook && (
                      <Button
                        variant="secondary"
                        onClick={() => setShowCreateWebhook(true)}
                        className="w-full"
                      >
                        Add Webhook
                      </Button>
                    )}
                  </div>
                ),
              },
              {
                id: 'siem',
                label: 'SIEM Integration',
                content: (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'Splunk', type: 'splunk', description: 'Real-time IT insights' },
                        {
                          name: 'Elastic Stack',
                          type: 'elastic',
                          description: 'Open source search and analytics',
                        },
                        {
                          name: 'Azure Sentinel',
                          type: 'azure_sentinel',
                          description: 'Cloud-native SIEM',
                        },
                        { name: 'IBM QRadar', type: 'qradar', description: 'Enterprise SIEM' },
                      ].map((siem) => {
                        const existing = integrations.find((i) => i.type === 'siem');
                        const isConnected = existing && (existing as any).siemType === siem.type;

                        return (
                          <Card
                            key={siem.type}
                            className={`p-4 border-2 ${
                              isConnected
                                ? 'border-success bg-success/5 dark:bg-success/10'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {siem.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
                              {siem.description}
                            </p>
                            {isConnected ? (
                              <div>
                                <span className="text-sm text-success font-medium">
                                  Connected
                                </span>
                                <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                                  {existing?.endpoint}
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setIntegrationForm({
                                    name: siem.name,
                                    type: 'siem',
                                    endpoint: '',
                                  });
                                  setShowCreateIntegration(true);
                                }}
                              >
                                Connect
                              </Button>
                            )}
                          </Card>
                        );
                      })}
                    </div>

                    {showCreateIntegration && (
                      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                        <h3 className="font-semibold mb-4">Configure SIEM Integration</h3>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Integration name"
                            value={integrationForm.name}
                            onChange={(e) =>
                              setIntegrationForm({ ...integrationForm, name: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                          />
                          <input
                            type="url"
                            placeholder="SIEM endpoint URL"
                            value={integrationForm.endpoint}
                            onChange={(e) =>
                              setIntegrationForm({
                                ...integrationForm,
                                endpoint: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                          />
                          <input
                            type="password"
                            placeholder="API Key"
                            value={integrationForm.apiKey || ''}
                            onChange={(e) =>
                              setIntegrationForm({
                                ...integrationForm,
                                apiKey: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setShowCreateIntegration(false)}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleCreateIntegration}>
                              Connect
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                ),
              },
              {
                id: 'api',
                label: 'API Documentation',
                content: (
                  <div className="p-4 space-y-4">
                    <Card className="p-4">
                      <h3 className="font-semibold mb-3">REST API</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        BlockStop provides a comprehensive REST API for integration with third-party
                        systems.
                      </p>
                      <div className="space-y-2 text-sm font-mono bg-gray-900 text-green-400 p-4 rounded mb-4">
                        <div>POST /api/analytics/threats</div>
                        <div>GET /api/analytics/dashboard</div>
                        <div>POST /api/enterprise/webhooks</div>
                        <div>GET /api/compliance/reports</div>
                      </div>
                      <Button variant="secondary">View Full API Docs</Button>
                    </Card>

                    <Card className="p-4">
                      <h3 className="font-semibold mb-3">Authentication</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        All API requests require Bearer token authentication.
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono mb-3">
                        Authorization: Bearer YOUR_API_KEY
                      </div>
                      <Button variant="secondary">Generate API Key</Button>
                    </Card>

                    <Card className="p-4">
                      <h3 className="font-semibold mb-3">SDKs</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {['JavaScript', 'Python', 'Go', 'Java'].map((lang) => (
                          <Button key={lang} variant="secondary" size="sm">
                            {lang} SDK
                          </Button>
                        ))}
                      </div>
                    </Card>
                  </div>
                ),
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
