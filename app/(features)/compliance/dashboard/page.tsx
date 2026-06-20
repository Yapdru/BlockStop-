'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Input } from '@/components';

interface Framework {
  id: string;
  name: string;
  type: string;
  score: number;
  controls: number;
  passing: number;
}

interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  framework: string;
  status: 'open' | 'in-progress' | 'resolved';
}

export default function ComplianceDashboard() {
  const [score, setScore] = useState(72.5);
  const [frameworks, setFrameworks] = useState<Framework[]>([
    {
      id: '1',
      name: 'HIPAA',
      type: 'hipaa',
      score: 85,
      controls: 164,
      passing: 139,
    },
    {
      id: '2',
      name: 'SOC 2',
      type: 'soc2',
      score: 78,
      controls: 76,
      passing: 59,
    },
    {
      id: '3',
      name: 'ISO 27001',
      type: 'iso27001',
      score: 72,
      controls: 114,
      passing: 82,
    },
  ]);

  const [findings, setFindings] = useState<Finding[]>([
    {
      id: '1',
      title: 'Encryption not enabled on all data at rest',
      severity: 'critical',
      category: 'Data Protection',
      framework: 'ISO 27001',
      status: 'open',
    },
    {
      id: '2',
      title: 'Missing access control logs',
      severity: 'high',
      category: 'Access Control',
      framework: 'SOC 2',
      status: 'in-progress',
    },
    {
      id: '3',
      title: 'Incomplete background checks',
      severity: 'high',
      category: 'Personnel Security',
      framework: 'HIPAA',
      status: 'open',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'primary',
    };
    return colors[severity];
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      open: 'danger',
      'in-progress': 'warning',
      resolved: 'success',
    };
    return badges[status];
  };

  const filteredFindings = searchQuery
    ? findings.filter(f =>
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.framework.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : findings;

  const openFindings = findings.filter(f => f.status === 'open').length;
  const criticalFindings = findings.filter(f => f.severity === 'critical').length;

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
              ← Back
            </Link>
            <h1 className="text-h3 font-bold text-neutral-900">📋 Compliance Dashboard</h1>
          </div>
          <p className="text-sm text-neutral-600">Monitor organizational compliance posture across frameworks</p>
        </div>
      </header>

      <div className="container-max py-8">
        {/* Overall Score Card */}
        <Card padding="lg" className="mb-8 border-primary-200 bg-primary-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-neutral-600 mb-2">Overall Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-h2 font-bold text-primary-600">{score.toFixed(1)}</span>
                <span className="text-sm text-neutral-600">/100</span>
              </div>
              <div className="mt-3 w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    score >= 80
                      ? 'bg-success'
                      : score >= 60
                      ? 'bg-warning'
                      : 'bg-danger'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-xs text-neutral-600 mt-2">
                {score >= 80 ? '✓ Good' : score >= 60 ? '⚠️ Fair' : '🔴 Poor'} standing
              </p>
            </div>

            <div className="flex flex-col justify-center border-l border-primary-200 pl-6">
              <p className="text-xs text-neutral-600">Active Frameworks</p>
              <p className="text-h3 font-bold text-neutral-900">{frameworks.length}</p>
              <p className="text-xs text-neutral-600 mt-1">{frameworks.reduce((sum, f) => sum + f.controls, 0)} controls</p>
            </div>

            <div className="flex flex-col justify-center border-l border-primary-200 pl-6">
              <p className="text-xs text-neutral-600">Open Findings</p>
              <p className="text-h3 font-bold text-danger">{openFindings}</p>
              <p className="text-xs text-neutral-600 mt-1">Requiring remediation</p>
            </div>

            <div className="flex flex-col justify-center border-l border-primary-200 pl-6">
              <p className="text-xs text-neutral-600">Critical Issues</p>
              <p className="text-h3 font-bold text-danger">{criticalFindings}</p>
              <p className="text-xs text-neutral-600 mt-1">High priority</p>
            </div>
          </div>
        </Card>

        {/* Frameworks Grid */}
        <div className="mb-8">
          <h2 className="text-h4 font-bold text-neutral-900 mb-4">📊 Compliance Frameworks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {frameworks.map((framework) => (
              <Card
                key={framework.id}
                padding="lg"
                className="cursor-pointer transition hover:border-primary-300"
                onClick={() => setSelectedFramework(selectedFramework === framework.id ? null : framework.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-h5 font-bold text-neutral-900">{framework.name}</h3>
                    <p className="text-xs text-neutral-600 mt-1">{framework.type.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">{framework.score}%</p>
                  </div>
                </div>

                <div className="mb-4 pb-4 border-b border-neutral-200">
                  <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500"
                      style={{ width: `${framework.score}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-neutral-600">Controls</p>
                    <p className="font-bold text-neutral-900">{framework.controls}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Passing</p>
                    <p className="font-bold text-success">{framework.passing}</p>
                  </div>
                </div>

                {selectedFramework === framework.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <p className="text-xs text-neutral-600 mb-2">Failing Controls: {framework.controls - framework.passing}</p>
                    <Button variant="secondary" size="sm" className="w-full">
                      View Details
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Findings Section */}
        <div>
          <h2 className="text-h4 font-bold text-neutral-900 mb-4">🔍 Open Findings</h2>

          <div className="mb-6">
            <Input
              type="search"
              placeholder="Search findings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredFindings.length > 0 ? (
            <div className="space-y-4">
              {filteredFindings.map((finding) => (
                <Card key={finding.id} padding="lg">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-h5 font-bold text-neutral-900 flex-1">{finding.title}</h3>
                    <Badge variant={getSeverityColor(finding.severity)}>
                      {finding.severity.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm mb-4 pb-4 border-b border-neutral-200">
                    <div>
                      <p className="text-xs text-neutral-600">Category</p>
                      <p className="font-medium text-neutral-900">{finding.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-600">Framework</p>
                      <p className="font-medium text-neutral-900">{finding.framework}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-600">Status</p>
                      <Badge variant={getStatusBadge(finding.status)}>
                        {finding.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="secondary" size="sm">
                      View Evidence
                    </Button>
                    <Button variant="primary" size="sm">
                      Update Status
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-600 mb-2">No findings found</p>
              <p className="text-sm text-neutral-500">Try adjusting your search</p>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h3 className="font-semibold text-neutral-900 mb-2">💡 Next Steps</h3>
          <ul className="text-sm text-neutral-700 space-y-1">
            <li>• Address {criticalFindings} critical finding(s) to improve compliance score</li>
            <li>• Review and update all failing controls</li>
            <li>• Schedule compliance audit for Q3</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
