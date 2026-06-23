'use client';

/**
 * Threat Hunting Workspace
 * Advanced threat hunting interface for PRO users
 */

import React, { useState } from 'react';
import { ThreatHuntingEngine } from '@/lib/pro/threat-hunting';

export default function ThreatHuntingPage() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [queryType, setQueryType] = useState<'kql' | 'sql' | 'eql' | 'yara' | 'sigma'>('kql');
  const [queryText, setQueryText] = useState('');
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [workspaces, setWorkspaces] = useState([
    {
      id: '1',
      name: 'APT Detection Campaign',
      findings: 12,
      status: 'active',
      created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ]);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;

    const workspace = await ThreatHuntingEngine.createWorkspace(
      workspaceName,
      'Custom threat hunting workspace',
      'user_123'
    );

    setWorkspaces([
      ...workspaces,
      {
        id: workspace.id,
        name: workspace.name,
        findings: 0,
        status: 'active' as const,
        created: new Date(),
      },
    ]);

    setWorkspaceName('');
    setShowCreateWorkspace(false);
  };

  const handleExecuteQuery = async () => {
    // In production, would execute actual query
    console.log(`Executing ${queryType} query`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Threat Hunting Workspace</h1>
          <p className="text-blue-300">
            Advanced threat investigation with custom queries and collaborative analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Query Builder */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Query Builder</h2>

              {/* Query Type Selector */}
              <div className="mb-4">
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Query Type
                </label>
                <select
                  value={queryType}
                  onChange={(e) => setQueryType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="kql">KQL (Kibana Query Language)</option>
                  <option value="sql">SQL</option>
                  <option value="eql">EQL (Event Query Language)</option>
                  <option value="yara">YARA</option>
                  <option value="sigma">Sigma</option>
                </select>
              </div>

              {/* Query Editor */}
              <div className="mb-4">
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  Query
                </label>
                <textarea
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder={`Enter ${queryType} query here...`}
                  className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Execute Button */}
              <button
                onClick={handleExecuteQuery}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors mb-6"
              >
                Execute Query
              </button>

              {/* Query Templates */}
              <div className="border-t border-slate-600 pt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Templates</h3>
                <div className="space-y-2">
                  {[
                    'Lateral Movement Detection',
                    'Privilege Escalation',
                    'Data Exfiltration',
                    'C2 Communication',
                  ].map((template) => (
                    <button
                      key={template}
                      className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded text-sm text-blue-300 transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Workspaces & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Workspace Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Workspaces</h2>
                <button
                  onClick={() => setShowCreateWorkspace(!showCreateWorkspace)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  + New Workspace
                </button>
              </div>

              {/* Create Workspace Form */}
              {showCreateWorkspace && (
                <div className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Workspace name..."
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateWorkspace}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setShowCreateWorkspace(false)}
                      className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Workspaces List */}
              <div className="space-y-2">
                {workspaces.map((workspace) => (
                  <a
                    key={workspace.id}
                    href={`/pro/threat-hunt/${workspace.id}`}
                    className="block p-4 bg-slate-700 border border-slate-600 rounded-lg hover:border-blue-500 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-blue-400">
                          {workspace.name}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {workspace.findings} findings • Created{' '}
                          {Math.floor((Date.now() - workspace.created.getTime()) / (24 * 60 * 60 * 1000))}{' '}
                          days ago
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-900 text-green-200 text-xs font-semibold rounded-full">
                        {workspace.status}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Recent Findings */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Findings</h2>
              <div className="space-y-3">
                {[
                  {
                    title: 'Suspicious PowerShell Activity',
                    severity: 'high',
                    systems: 2,
                    confidence: 92,
                  },
                  {
                    title: 'Lateral Movement Pattern',
                    severity: 'critical',
                    systems: 5,
                    confidence: 87,
                  },
                  {
                    title: 'Data Staging Detected',
                    severity: 'high',
                    systems: 1,
                    confidence: 78,
                  },
                ].map((finding, i) => (
                  <div key={i} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{finding.title}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          finding.severity === 'critical'
                            ? 'bg-red-900 text-red-200'
                            : 'bg-yellow-900 text-yellow-200'
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-400">
                      <span>Systems: {finding.systems}</span>
                      <span>Confidence: {finding.confidence}%</span>
                      <button className="text-blue-400 hover:text-blue-300">
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
