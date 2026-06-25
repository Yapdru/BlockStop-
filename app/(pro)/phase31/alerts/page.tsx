// PRO Phase 31.1 - Alert Rules Management
// Production-ready React component for alert rule builder and management

'use client';

import React, { useState } from 'react';
import {
  alertRuleBuilder,
  describeRule,
} from '@/lib/pro/phase31/alert-rule-builder';
import {
  alertRuleEngine,
  testAlertDelivery,
} from '@/lib/pro/phase31/real-time-alerts';
import { RuleBuilderConfig, AlertCondition, AlertAction, ConditionGroup } from '@/types/pro-phase31';

// ============================================================================
// ALERT RULES MANAGEMENT PAGE
// ============================================================================

export default function AlertRulesPage() {
  const [rules, setRules] = useState<RuleBuilderConfig[]>(alertRuleBuilder.getAllRules());
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleBuilderConfig | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const templates = alertRuleBuilder.getRuleTemplates();

  const handleCreateRule = () => {
    setSelectedTemplate(null);
    setEditingRule(null);
    setShowBuilder(true);
  };

  const handleLoadTemplate = (template: RuleBuilderConfig) => {
    const newRule = alertRuleBuilder.cloneRule(template.id, `${template.name} - Copy`);
    if (newRule) {
      setEditingRule(newRule);
      setShowBuilder(true);
    }
  };

  const handleSaveRule = (rule: RuleBuilderConfig) => {
    const validation = alertRuleBuilder.validateRule(rule);

    if (!validation.valid) {
      alert(`Validation errors:\n${validation.errors.join('\n')}`);
      return;
    }

    if (editingRule?.id === rule.id) {
      alertRuleBuilder.updateRule(rule.id, rule);
    } else {
      alertRuleBuilder.createRule({
        ...rule,
        id: undefined as any,
        createdAt: undefined as any,
        updatedAt: undefined as any,
      });
    }

    setRules(alertRuleBuilder.getAllRules());
    setShowBuilder(false);
    setEditingRule(null);
  };

  const handleToggleRule = (ruleId: string) => {
    const rule = alertRuleBuilder.getRule(ruleId);
    if (rule) {
      alertRuleBuilder.updateRule(ruleId, { ...rule, enabled: !rule.enabled });
      setRules(alertRuleBuilder.getAllRules());
    }
  };

  const handleTestRule = async (ruleId: string) => {
    setTestingRuleId(ruleId);
    const rule = alertRuleBuilder.getRule(ruleId);

    if (rule) {
      try {
        const result = await testAlertDelivery(
          {
            id: rule.id,
            name: rule.name,
            description: rule.description,
            enabled: rule.enabled,
            severity: rule.severity,
            conditions: [],
            actions: rule.actions,
            webhooks: rule.webhooks,
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt,
            createdBy: rule.createdBy,
          },
          undefined
        );

        setTestResults(result);
      } catch (error) {
        setTestResults({
          success: false,
          message: `Test failed: ${error}`,
          deliveryTimes: {},
        });
      }
    }

    setTestingRuleId(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      alertRuleBuilder.deleteRule(ruleId);
      setRules(alertRuleBuilder.getAllRules());
    }
  };

  const enabledCount = rules.filter((r) => r.enabled).length;
  const totalRules = rules.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Alert Rules</h1>
          <p className="text-slate-400">Manage and create custom alert rules</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Rules" value={totalRules} color="blue" />
          <StatCard label="Active Rules" value={enabledCount} color="green" />
          <StatCard label="Inactive Rules" value={totalRules - enabledCount} color="yellow" />
        </div>

        {/* Action Button */}
        <div className="mb-8 flex gap-3">
          <button
            onClick={handleCreateRule}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            + Create Custom Rule
          </button>
        </div>

        {/* Templates Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 hover:bg-slate-800/80 transition-colors"
              >
                <h3 className="font-semibold text-white mb-2">{template.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{template.description}</p>
                <div className="flex gap-2">
                  <span
                    className="px-3 py-1 rounded text-xs font-semibold text-white"
                    style={{
                      backgroundColor:
                        template.severity === 'critical'
                          ? '#ef4444'
                          : template.severity === 'high'
                            ? '#f97316'
                            : '#eab308',
                    }}
                  >
                    {template.severity.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => handleLoadTemplate(template)}
                  className="w-full mt-4 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded font-medium transition-colors text-sm"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rules List */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Custom Rules</h2>

          {rules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No custom rules created yet.</p>
              <button
                onClick={handleCreateRule}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create First Rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={() => handleToggleRule(rule.id)}
                  onEdit={() => {
                    setEditingRule(rule);
                    setShowBuilder(true);
                  }}
                  onTest={() => handleTestRule(rule.id)}
                  onDelete={() => handleDeleteRule(rule.id)}
                  testing={testingRuleId === rule.id}
                  testResults={testResults}
                />
              ))}
            </div>
          )}
        </div>

        {/* Rule Builder Modal */}
        {showBuilder && (
          <RuleBuilderModal
            rule={editingRule}
            onSave={handleSaveRule}
            onCancel={() => {
              setShowBuilder(false);
              setEditingRule(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ label, value, color }: StatCardProps) {
  const bgColors = {
    blue: 'bg-blue-900/30',
    green: 'bg-green-900/30',
    yellow: 'bg-yellow-900/30',
    red: 'bg-red-900/30',
  };

  return (
    <div className={`${bgColors[color]} backdrop-blur border border-slate-700 rounded-lg p-4`}>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

interface RuleCardProps {
  rule: RuleBuilderConfig;
  onToggle: () => void;
  onEdit: () => void;
  onTest: () => void;
  onDelete: () => void;
  testing: boolean;
  testResults?: any;
}

function RuleCard({
  rule,
  onToggle,
  onEdit,
  onTest,
  onDelete,
  testing,
  testResults,
}: RuleCardProps) {
  const severityColors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#84cc16',
  };

  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onToggle}
              className={`w-10 h-6 rounded-full transition-colors ${
                rule.enabled ? 'bg-green-600' : 'bg-slate-600'
              }`}
            />
            <div>
              <h3 className="font-semibold text-white">{rule.name}</h3>
              <p className="text-sm text-slate-400">{rule.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded text-xs font-semibold text-white"
            style={{ backgroundColor: severityColors[rule.severity] }}
          >
            {rule.severity.toUpperCase()}
          </span>
          <span className="text-xs text-slate-400">
            {rule.conditions.conditions.length} conditions
          </span>
          <span className="text-xs text-slate-400">
            {rule.actions.length} actions
          </span>
        </div>
      </div>

      <div className="text-xs text-slate-500 mb-4 font-mono">
        {rule.ruleType === 'threat-detection' && '🎯 Threat Detection'}
        {rule.ruleType === 'anomaly' && '📊 Anomaly Detection'}
        {rule.ruleType === 'threshold' && '⚖️ Threshold Based'}
        {rule.ruleType === 'correlation' && '🔗 Correlation'}
        {rule.ruleType === 'custom' && '⚙️ Custom Rule'}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded text-xs font-medium transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onTest}
          disabled={testing}
          className="px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test'}
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs font-medium transition-colors"
        >
          Delete
        </button>
      </div>

      {testResults && (
        <div className={`mt-4 p-3 rounded text-sm ${
          testResults.success ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
        }`}>
          {testResults.message}
        </div>
      )}
    </div>
  );
}

interface RuleBuilderModalProps {
  rule?: RuleBuilderConfig | null;
  onSave: (rule: RuleBuilderConfig) => void;
  onCancel: () => void;
}

function RuleBuilderModal({ rule, onSave, onCancel }: RuleBuilderModalProps) {
  const [formData, setFormData] = useState<Partial<RuleBuilderConfig>>(
    rule || {
      name: '',
      description: '',
      ruleType: 'threat-detection',
      severity: 'high',
      enabled: true,
      conditions: { logic: 'AND', conditions: [] },
      actions: [],
      webhooks: [],
      createdBy: 'current-user',
    }
  );

  const handleAddCondition = () => {
    const conditions = formData.conditions as ConditionGroup;
    const newCondition: AlertCondition = {
      field: '',
      operator: 'eq',
      value: '',
    };
    conditions.conditions.push(newCondition);
    setFormData({ ...formData });
  };

  const handleAddAction = () => {
    const newAction: AlertAction = {
      type: 'email',
      config: {},
      enabled: true,
    };
    setFormData({
      ...formData,
      actions: [...(formData.actions || []), newAction],
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.description) {
      alert('Name and description are required');
      return;
    }

    onSave({
      id: rule?.id || `rule_${Date.now()}`,
      ...(formData as any),
      createdAt: rule?.createdAt || new Date(),
      updatedAt: new Date(),
    });
  };

  const fields = alertRuleBuilder.getAvailableFields();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            {rule ? 'Edit Rule' : 'Create Alert Rule'}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Rule Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Critical Malware Detection"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this rule detects..."
              rows={2}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Severity</label>
            <select
              value={formData.severity || 'high'}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Rule Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Rule Type</label>
            <select
              value={formData.ruleType || 'threat-detection'}
              onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as any })}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="threat-detection">Threat Detection</option>
              <option value="anomaly">Anomaly Detection</option>
              <option value="threshold">Threshold Based</option>
              <option value="correlation">Correlation</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-white">Conditions</label>
              <button
                onClick={handleAddCondition}
                className="text-sm px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded transition-colors"
              >
                + Add Condition
              </button>
            </div>
            {(formData.conditions?.conditions || []).length === 0 ? (
              <p className="text-sm text-slate-500">No conditions added yet</p>
            ) : (
              <div className="space-y-2">
                {(formData.conditions?.conditions || []).map((cond: any, idx) => (
                  <div key={idx} className="p-3 bg-slate-700/30 border border-slate-600 rounded">
                    <p className="text-sm text-slate-300">
                      <span className="font-mono">{cond.field || '?'}</span>
                      {' '}
                      <span>{cond.operator}</span>
                      {' '}
                      <span className="font-mono">{String(cond.value || '?')}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-white">Actions</label>
              <button
                onClick={handleAddAction}
                className="text-sm px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded transition-colors"
              >
                + Add Action
              </button>
            </div>
            {(formData.actions || []).length === 0 ? (
              <p className="text-sm text-slate-500">No actions added yet</p>
            ) : (
              <div className="space-y-2">
                {(formData.actions || []).map((action, idx) => (
                  <div key={idx} className="p-3 bg-slate-700/30 border border-slate-600 rounded">
                    <p className="text-sm text-slate-300">
                      Send {action.type} notification
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {rule && (
            <div className="mt-4 p-3 bg-slate-700/20 border border-slate-600 rounded max-h-32 overflow-y-auto">
              <p className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
                {describeRule(rule)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}
