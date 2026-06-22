'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, Trash2, Eye, Edit, Copy, MoreVertical } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: {
    type: string;
    conditions?: Record<string, any>;
  };
  actionCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  version: number;
}

const mockWorkflows: Workflow[] = [
  {
    id: '1',
    name: 'Critical Threat Response',
    description: 'Auto-respond to critical threats with incident creation and escalation',
    enabled: true,
    trigger: { type: 'on-threat', conditions: { severity: 'critical' } },
    actionCount: 5,
    tags: ['security', 'auto-response'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    lastRun: new Date(),
    version: 3,
  },
  {
    id: '2',
    name: 'Daily Compliance Report',
    description: 'Generate and email daily compliance reports',
    enabled: true,
    trigger: { type: 'on-schedule' },
    actionCount: 3,
    tags: ['compliance', 'reporting'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    lastRun: new Date('2024-01-22'),
    version: 2,
  },
  {
    id: '3',
    name: 'Slack Notifications',
    description: 'Send threat alerts to Slack channels',
    enabled: false,
    trigger: { type: 'on-threat' },
    actionCount: 2,
    tags: ['notifications', 'slack'],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19'),
    version: 1,
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterEnabled === null || w.enabled === filterEnabled;

    return matchesSearch && matchesFilter;
  });

  const handleToggle = useCallback((id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleDuplicate = useCallback((workflow: Workflow) => {
    const newWorkflow: Workflow = {
      ...workflow,
      id: Math.random().toString(36).substr(2, 9),
      name: `${workflow.name} (Copy)`,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setWorkflows((prev) => [newWorkflow, ...prev]);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workflow Automation</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage automated workflows for incident response, notifications, and compliance
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedWorkflow(null);
            setShowBuilder(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search workflows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <div className="flex gap-2">
          <Button
            variant={filterEnabled === null ? 'default' : 'outline'}
            onClick={() => setFilterEnabled(null)}
          >
            All
          </Button>
          <Button
            variant={filterEnabled === true ? 'default' : 'outline'}
            onClick={() => setFilterEnabled(true)}
          >
            Enabled
          </Button>
          <Button
            variant={filterEnabled === false ? 'default' : 'outline'}
            onClick={() => setFilterEnabled(false)}
          >
            Disabled
          </Button>
        </div>
      </div>

      {/* Workflows Grid */}
      <div className="grid gap-4">
        {filteredWorkflows.length > 0 ? (
          filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {workflow.name}
                    </h3>
                    <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                      {workflow.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">v{workflow.version}</Badge>
                  </div>
                  {workflow.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {workflow.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {workflow.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Trigger: {workflow.trigger.type}</span>
                    <span>{workflow.actionCount} actions</span>
                    {workflow.lastRun && (
                      <span>Last run: {workflow.lastRun.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWorkflow(workflow);
                      setShowBuilder(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(workflow)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(workflow.id)}
                  >
                    {workflow.enabled ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(workflow.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">No workflows found</p>
            <Button
              onClick={() => {
                setSelectedWorkflow(null);
                setShowBuilder(true);
              }}
              className="mt-4"
            >
              Create your first workflow
            </Button>
          </Card>
        )}
      </div>

      {/* Workflow Builder Modal would go here */}
      {showBuilder && (
        <Card className="p-6 mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
            </h2>
            <Button
              variant="ghost"
              onClick={() => {
                setShowBuilder(false);
                setSelectedWorkflow(null);
              }}
            >
              ✕
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Workflow builder with visual interface, drag-drop actions, conditional logic, and live preview coming soon
          </p>
          <div className="bg-white dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
            <p className="text-gray-500">Workflow builder interface</p>
          </div>
        </Card>
      )}
    </div>
  );
}
