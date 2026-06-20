'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button, Tabs } from '@/components';
import { ThreatFeed, ThreatFeedTemplate, ThreatRule } from '@/types/analytics';
import { LoadingSpinner } from '@/app/components/animations/LoadingSpinner';
import { FadeIn } from '@/app/components/animations/FadeIn';

interface CreateFeedForm {
  name: string;
  description: string;
  templateId?: string;
}

interface CreateRuleForm {
  name: string;
  ruleType: 'pattern' | 'heuristic' | 'signature' | 'behavioral';
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: number;
}

export default function AnalyticsFeedsPage() {
  const [feeds, setFeeds] = useState<ThreatFeed[]>([]);
  const [templates, setTemplates] = useState<ThreatFeedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('library');
  const [showCreateFeed, setShowCreateFeed] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<ThreatFeed | null>(null);
  const [error, setError] = useState('');

  const [createFeedForm, setCreateFeedForm] = useState<CreateFeedForm>({
    name: '',
    description: '',
  });

  const [createRuleForm, setCreateRuleForm] = useState<CreateRuleForm>({
    name: '',
    ruleType: 'pattern',
    pattern: '',
    severity: 'medium',
    priority: 5,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const headers = { 'x-user-id': userId || '' };

      const [feedsRes, templatesRes] = await Promise.all([
        fetch('/api/analytics/feeds', { headers }),
        fetch('/api/analytics/feeds/templates', { headers }),
      ]);

      if (feedsRes.ok && templatesRes.ok) {
        setFeeds(await feedsRes.json());
        setTemplates(await templatesRes.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feeds');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeed = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/analytics/feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify(createFeedForm),
      });

      if (response.ok) {
        setFeeds([...feeds, await response.json()]);
        setShowCreateFeed(false);
        setCreateFeedForm({ name: '', description: '' });
      }
    } catch (err) {
      setError('Failed to create feed');
    }
  };

  const handleAddRule = async () => {
    if (!selectedFeed) return;

    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/analytics/feeds/${selectedFeed.id}/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify(createRuleForm),
      });

      if (response.ok) {
        const newRule = await response.json();
        const updatedFeed = { ...selectedFeed, rules: [...selectedFeed.rules, newRule] };
        setFeeds(feeds.map((f) => (f.id === selectedFeed.id ? updatedFeed : f)));
        setSelectedFeed(updatedFeed);
        setShowCreateRule(false);
        setCreateRuleForm({ name: '', ruleType: 'pattern', pattern: '', severity: 'medium', priority: 5 });
      }
    } catch (err) {
      setError('Failed to add rule');
    }
  };

  const handleToggleFeed = async (feedId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const feed = feeds.find((f) => f.id === feedId);
      if (!feed) return;

      const response = await fetch(`/api/analytics/feeds/${feedId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify({ enabled: !feed.enabled }),
      });

      if (response.ok) {
        setFeeds(feeds.map((f) => (f.id === feedId ? { ...f, enabled: !f.enabled } : f)));
      }
    } catch (err) {
      setError('Failed to update feed');
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`/api/analytics/feeds/${feedId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId || '' },
      });

      if (response.ok) {
        setFeeds(feeds.filter((f) => f.id !== feedId));
        if (selectedFeed?.id === feedId) setSelectedFeed(null);
      }
    } catch (err) {
      setError('Failed to delete feed');
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Threat Feed Builder
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create and manage custom threat feeds and detection rules
              </p>
            </div>
            <Button onClick={() => setShowCreateFeed(true)} size="lg">
              Create Feed
            </Button>
          </div>

          {error && (
            <div className="bg-danger/10 text-danger p-4 rounded-lg">{error}</div>
          )}

          {/* Tabs */}
          <Tabs
            tabs={[
              {
                id: 'library',
                label: 'Template Library',
                content: (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="p-4 cursor-pointer hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {template.name}
                          </h3>
                          <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                            {template.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {template.description}
                        </p>
                        <div className="text-xs text-gray-500 mb-4">
                          {template.rules.length} rules included
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setCreateFeedForm({ ...createFeedForm, templateId: template.id });
                            setShowCreateFeed(true);
                          }}
                          className="w-full"
                        >
                          Use Template
                        </Button>
                      </Card>
                    ))}
                  </div>
                ),
              },
              {
                id: 'feeds',
                label: 'My Feeds',
                content: (
                  <div className="space-y-4 p-4">
                    {feeds.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No feeds yet. Create one to get started.
                      </div>
                    ) : (
                      feeds.map((feed) => (
                        <Card
                          key={feed.id}
                          className={`p-4 cursor-pointer transition ${
                            selectedFeed?.id === feed.id
                              ? 'border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedFeed(feed)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {feed.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {feed.description}
                              </p>
                              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                                <span>{feed.rules.length} rules</span>
                                <span>
                                  Created{' '}
                                  {new Date(feed.createdAt).toLocaleDateString()}
                                </span>
                                <span>
                                  {feed.enabled ? (
                                    <span className="text-success">Active</span>
                                  ) : (
                                    <span className="text-gray-400">Inactive</span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFeed(feed.id);
                                }}
                                className={`px-3 py-1 rounded text-sm font-medium transition ${
                                  feed.enabled
                                    ? 'bg-success/10 text-success'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {feed.enabled ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFeed(feed.id);
                                }}
                                className="px-3 py-1 rounded text-sm font-medium bg-danger/10 text-danger hover:bg-danger/20 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                ),
              },
              {
                id: 'rules',
                label: 'Rule Builder',
                content: selectedFeed ? (
                  <div className="p-4 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Rules for "{selectedFeed.name}"
                      </h3>
                      <div className="space-y-3 mb-6">
                        {selectedFeed.rules.map((rule) => (
                          <Card key={rule.id} className="p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{rule.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {rule.description}
                                </p>
                                <div className="flex gap-2 mt-2 text-xs">
                                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                                    {rule.ruleType}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded ${
                                      rule.severity === 'critical'
                                        ? 'bg-danger/20 text-danger'
                                        : rule.severity === 'high'
                                        ? 'bg-warning/20 text-warning'
                                        : 'bg-gray-100 dark:bg-gray-700'
                                    }`}
                                  >
                                    {rule.severity}
                                  </span>
                                  <span className="text-gray-500">Priority: {rule.priority}</span>
                                </div>
                              </div>
                              <button className="text-danger hover:bg-danger/10 p-2 rounded">
                                Remove
                              </button>
                            </div>
                          </Card>
                        ))}
                      </div>

                      {showCreateRule && (
                        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                          <h4 className="font-semibold mb-4">Add New Rule</h4>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Rule name"
                              value={createRuleForm.name}
                              onChange={(e) =>
                                setCreateRuleForm({ ...createRuleForm, name: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                            />
                            <select
                              value={createRuleForm.ruleType}
                              onChange={(e) =>
                                setCreateRuleForm({
                                  ...createRuleForm,
                                  ruleType: e.target.value as any,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                            >
                              <option value="pattern">Pattern</option>
                              <option value="heuristic">Heuristic</option>
                              <option value="signature">Signature</option>
                              <option value="behavioral">Behavioral</option>
                            </select>
                            <textarea
                              placeholder="Rule pattern/expression"
                              value={createRuleForm.pattern}
                              onChange={(e) =>
                                setCreateRuleForm({ ...createRuleForm, pattern: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 font-mono text-sm"
                              rows={4}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                value={createRuleForm.severity}
                                onChange={(e) =>
                                  setCreateRuleForm({
                                    ...createRuleForm,
                                    severity: e.target.value as any,
                                  })
                                }
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                              </select>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                placeholder="Priority"
                                value={createRuleForm.priority}
                                onChange={(e) =>
                                  setCreateRuleForm({
                                    ...createRuleForm,
                                    priority: parseInt(e.target.value),
                                  })
                                }
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleAddRule}>
                                Save Rule
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setShowCreateRule(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}

                      {!showCreateRule && (
                        <Button
                          variant="secondary"
                          onClick={() => setShowCreateRule(true)}
                          className="w-full"
                        >
                          Add Rule
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Select a feed to view and edit its rules
                  </div>
                ),
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Create Feed Modal */}
          {showCreateFeed && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4">Create New Feed</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Feed name"
                    value={createFeedForm.name}
                    onChange={(e) =>
                      setCreateFeedForm({ ...createFeedForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={createFeedForm.description}
                    onChange={(e) =>
                      setCreateFeedForm({ ...createFeedForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" onClick={() => setShowCreateFeed(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFeed}>Create</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
