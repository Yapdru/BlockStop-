'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components';
import { a11y } from '@/lib/a11y';
import {
  getAllRoadmaps,
  getRoadmapFeatures,
  getReleaseHistory,
  getRoadmapOverview,
} from '@/lib/community/roadmap';
import type { RoadmapQuarter, RoadmapFeature, RoadmapRelease } from '@/types/community';

export default function RoadmapPage() {
  const [quarters, setQuarters] = useState<RoadmapQuarter[]>([]);
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [releases, setReleases] = useState<RoadmapRelease[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'releases' | 'features'>(
    'roadmap'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoadmapData();
    a11y.announce('Roadmap page loaded', 'polite');
  }, []);

  const loadRoadmapData = async () => {
    setLoading(true);
    try {
      const [quartersData, featuresData, releasesData, overviewData] = await Promise.all([
        getAllRoadmaps(),
        getRoadmapFeatures(),
        getReleaseHistory(),
        getRoadmapOverview(12),
      ]);

      setQuarters(quartersData);
      setFeatures(featuresData);
      setReleases(Array.isArray(releasesData) ? releasesData : [releasesData]);
      setOverview(overviewData);
    } catch (error) {
      console.error('Error loading roadmap:', error);
      a11y.announce('Error loading roadmap data', 'alert');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'not-started': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-cyan-100 text-cyan-800',
      'completed': 'bg-green-100 text-green-800',
      'delayed': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
      'backlog': 'bg-slate-100 text-slate-800',
      'planned': 'bg-purple-100 text-purple-800',
      'beta': 'bg-orange-100 text-orange-800',
      'released': 'bg-green-100 text-green-800',
      'discontinued': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-red-100 text-red-800',
      'high': 'bg-orange-100 text-orange-800',
      'medium': 'bg-blue-100 text-blue-800',
      'low': 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 pb-24">
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-neutral-900">
              <span aria-hidden="true">🗺️</span> Public Roadmap
            </h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card padding="lg" className="text-center">
            Loading roadmap...
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="text-primary-600 hover:text-primary-700 font-medium"
              aria-label="Back to dashboard"
            >
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900">
              <span aria-hidden="true">🗺️</span> Public Roadmap
            </h1>
          </div>
          <p className="text-neutral-600">
            See what's coming next for BlockStop and help shape our future
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card padding="lg">
              <p className="text-neutral-600 text-sm mb-2">Total Features</p>
              <p className="text-3xl font-bold text-neutral-900">
                {overview.totalFeatures}
              </p>
            </Card>
            <Card padding="lg">
              <p className="text-neutral-600 text-sm mb-2">In Progress</p>
              <p className="text-3xl font-bold text-cyan-600">
                {overview.inProgressFeatures}
              </p>
            </Card>
            <Card padding="lg">
              <p className="text-neutral-600 text-sm mb-2">Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {overview.completedFeatures}
              </p>
            </Card>
            <Card padding="lg">
              <p className="text-neutral-600 text-sm mb-2">Overall Progress</p>
              <p className="text-3xl font-bold text-primary-600">
                {Math.round(overview.overallProgress)}%
              </p>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-neutral-200">
          {(['roadmap', 'features', 'releases'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab === 'roadmap' && '📅 Quarterly Roadmap'}
              {tab === 'features' && '⭐ All Features'}
              {tab === 'releases' && '📦 Release History'}
            </button>
          ))}
        </div>

        {/* Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            {quarters.length === 0 ? (
              <Card padding="lg" className="text-center text-neutral-600">
                No roadmap quarters available
              </Card>
            ) : (
              quarters.map((quarter) => (
                <Card key={`${quarter.year}-${quarter.quarter}`} padding="lg">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                      {quarter.quarter} {quarter.year}
                    </h2>
                    <p className="text-sm text-neutral-600">
                      {new Date(quarter.startDate).toLocaleDateString()} -{' '}
                      {new Date(quarter.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  {quarter.milestones.length === 0 ? (
                    <p className="text-neutral-600">
                      No milestones planned for this quarter
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {quarter.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-neutral-900 mb-1">
                                {milestone.title}
                              </h3>
                              <p className="text-neutral-600 text-sm mb-3">
                                {milestone.description}
                              </p>

                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge
                                  className={getStatusColor(milestone.status)}
                                  variant="secondary"
                                >
                                  {milestone.status}
                                </Badge>
                                <Badge
                                  className={getPriorityBadge(milestone.priority)}
                                  variant="secondary"
                                >
                                  {milestone.priority} priority
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-medium text-neutral-600">
                                Progress
                              </span>
                              <span className="text-sm font-bold text-neutral-900">
                                {milestone.completionPercentage}%
                              </span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div
                                className={`${getProgressBarColor(
                                  milestone.completionPercentage
                                )} h-2 rounded-full transition-all`}
                                style={{
                                  width: `${milestone.completionPercentage}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Features & Stats */}
                          <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg">
                            <div>
                              <p className="text-xs text-neutral-600 mb-1">Features</p>
                              <p className="text-xl font-bold text-neutral-900">
                                {milestone.features.length}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-600 mb-1">
                                Community Requests
                              </p>
                              <p className="text-xl font-bold text-primary-600">
                                {milestone.communityRequestCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            {features.length === 0 ? (
              <Card padding="lg" className="text-center text-neutral-600">
                No features in roadmap
              </Card>
            ) : (
              features.map((feature) => (
                <Card key={feature.id} padding="lg" className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-neutral-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-neutral-600 mb-3">{feature.description}</p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge
                          className={getStatusColor(feature.status)}
                          variant="secondary"
                        >
                          {feature.status}
                        </Badge>
                        <Badge
                          className={getPriorityBadge(feature.priority)}
                          variant="secondary"
                        >
                          {feature.priority}
                        </Badge>
                        {feature.releaseDate && (
                          <Badge variant="secondary">
                            Released:{' '}
                            {new Date(feature.releaseDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">Community Votes</p>
                      <p className="text-2xl font-bold text-primary-600">
                        {feature.communityVotes}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-600 mb-1">
                        Linked Proposals
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {feature.linkedProposalIds.length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-3">
                    <Link href={`/feature-voting`} className="flex-1">
                      <Button variant="secondary" className="w-full">
                        View Proposals
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Releases Tab */}
        {activeTab === 'releases' && (
          <div className="space-y-4">
            {releases.length === 0 ? (
              <Card padding="lg" className="text-center text-neutral-600">
                No release notes available
              </Card>
            ) : (
              releases.map((release) => (
                <Card key={release.version} padding="lg">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-neutral-900">
                      v{release.version}
                    </h2>
                    <span className="text-sm text-neutral-600">
                      {new Date(release.releasedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {release.highlights.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-bold text-neutral-900 mb-2">Highlights</h3>
                      <ul className="list-disc list-inside space-y-1 text-neutral-700">
                        {release.highlights.map((highlight, idx) => (
                          <li key={idx}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {release.features.length > 0 && (
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">
                          New Features
                        </h4>
                        <ul className="space-y-1">
                          {release.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-neutral-700 flex items-center gap-2"
                            >
                              <span className="text-green-600">✓</span> {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {release.bugFixes.length > 0 && (
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Bug Fixes</h4>
                        <ul className="space-y-1">
                          {release.bugFixes.slice(0, 5).map((fix, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-neutral-700 flex items-center gap-2"
                            >
                              <span className="text-orange-600">✓</span> {fix}
                            </li>
                          ))}
                          {release.bugFixes.length > 5 && (
                            <li className="text-sm text-neutral-600 italic">
                              +{release.bugFixes.length - 5} more fixes
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {(release.securityUpdates.length > 0 ||
                    release.performanceImprovements.length > 0) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {release.securityUpdates.length > 0 && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <h4 className="font-medium text-red-900 mb-2">
                            🔒 Security Updates
                          </h4>
                          <ul className="space-y-1">
                            {release.securityUpdates.map((update, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-red-700 flex items-center gap-2"
                              >
                                <span>✓</span> {update}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {release.performanceImprovements.length > 0 && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-900 mb-2">
                            ⚡ Performance
                          </h4>
                          <ul className="space-y-1">
                            {release.performanceImprovements.map((perf, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-green-700 flex items-center gap-2"
                              >
                                <span>✓</span> {perf}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
