'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components';
import { a11y } from '@/lib/a11y';
import {
  getEngagementMetrics,
  getGrowthMetrics,
  getContentMetrics,
  calculateNPS,
  getCommunityAnalyticsDashboard,
} from '@/lib/community/analytics';
import type {
  CommunityEngagementMetrics,
  CommunityGrowthMetrics,
  CommunityContentMetrics,
  NPS,
  CommunityAnalyticsDashboard,
} from '@/types/community';

export default function CommunityInsightsPage() {
  const [engagement, setEngagement] = useState<CommunityEngagementMetrics | null>(null);
  const [growth, setGrowth] = useState<CommunityGrowthMetrics | null>(null);
  const [content, setContent] = useState<CommunityContentMetrics | null>(null);
  const [nps, setNps] = useState<NPS | null>(null);
  const [dashboard, setDashboard] = useState<CommunityAnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'growth' | 'health'>(
    'overview'
  );

  useEffect(() => {
    loadAnalyticsData();
    a11y.announce('Community insights page loaded', 'polite');
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [engagementData, growthData, contentData, npsData, dashboardData] =
        await Promise.all([
          getEngagementMetrics(),
          getGrowthMetrics(),
          getContentMetrics(50, 100),
          calculateNPS(),
          getCommunityAnalyticsDashboard(),
        ]);

      setEngagement(engagementData);
      setGrowth(growthData);
      setContent(contentData);
      setNps(npsData);
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      a11y.announce('Error loading community insights', 'alert');
    } finally {
      setLoading(false);
    }
  };

  const getHealthVibeColor = (vibe: string) => {
    const colors: Record<string, string> = {
      'thriving': 'bg-green-100 text-green-800',
      'healthy': 'bg-lime-100 text-lime-800',
      'stable': 'bg-blue-100 text-blue-800',
      'declining': 'bg-yellow-100 text-yellow-800',
      'critical': 'bg-red-100 text-red-800',
    };
    return colors[vibe] || 'bg-gray-100 text-gray-800';
  };

  const getHealthVibeEmoji = (vibe: string) => {
    const emojis: Record<string, string> = {
      'thriving': '🌟',
      'healthy': '✅',
      'stable': '➡️',
      'declining': '⚠️',
      'critical': '🆘',
    };
    return emojis[vibe] || '📊';
  };

  const renderMetricCard = (label: string, value: string | number, unit?: string) => (
    <Card padding="lg" className="text-center">
      <p className="text-neutral-600 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-neutral-900">
        {value}
        {unit && <span className="text-lg text-neutral-600 ml-1">{unit}</span>}
      </p>
    </Card>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 pb-24">
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-neutral-900">
              <span aria-hidden="true">📊</span> Community Insights
            </h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card padding="lg" className="text-center">
            Loading analytics...
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
              <span aria-hidden="true">📊</span> Community Insights
            </h1>
          </div>
          <p className="text-neutral-600">
            Understand community engagement, growth, and health metrics
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Health Status Alert */}
        {dashboard?.healthScore && (
          <Card
            padding="lg"
            className={`mb-8 border-2 ${
              dashboard.healthScore.overallScore >= 80
                ? 'border-green-300 bg-green-50'
                : dashboard.healthScore.overallScore >= 60
                  ? 'border-blue-300 bg-blue-50'
                  : dashboard.healthScore.overallScore >= 40
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-red-300 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  Community Health: {dashboard.healthScore.overallScore}/100
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Badge className={getHealthVibeColor(dashboard.healthScore.communityVibe)}>
                    <span className="mr-2">
                      {getHealthVibeEmoji(dashboard.healthScore.communityVibe)}
                    </span>
                    {dashboard.healthScore.communityVibe.toUpperCase()}
                  </Badge>
                  <span className="text-neutral-600">
                    Last updated:{' '}
                    {new Date(dashboard.healthScore.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-neutral-900">
                  {dashboard.healthScore.overallScore}
                </p>
              </div>
            </div>

            {/* Health Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-200">
              <div>
                <p className="text-xs text-neutral-600 mb-1">Engagement</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {dashboard.healthScore.engagementScore}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 mb-1">Growth</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {dashboard.healthScore.growthScore}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 mb-1">Content Quality</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {dashboard.healthScore.contentQualityScore}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-600 mb-1">Satisfaction</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {dashboard.healthScore.satisfactionScore}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-neutral-200">
          {(['overview', 'engagement', 'growth', 'health'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab === 'overview' && '📈 Overview'}
              {tab === 'engagement' && '👥 Engagement'}
              {tab === 'growth' && '📊 Growth'}
              {tab === 'health' && '💚 Health'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Key Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {engagement &&
                  renderMetricCard(
                    'Active Users',
                    engagement.activeUsers,
                    'users'
                  )}
                {growth &&
                  renderMetricCard(
                    'Monthly Growth',
                    growth.growthRate.toFixed(1),
                    '%'
                  )}
                {content &&
                  renderMetricCard(
                    'Total Proposals',
                    content.totalProposals,
                    ''
                  )}
                {nps &&
                  renderMetricCard(
                    'NPS Score',
                    nps.npsScore,
                    ''
                  )}
              </div>
            </div>

            {/* Featured Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Engagement Overview */}
              {engagement && (
                <Card padding="lg">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">
                    Engagement Overview
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-neutral-600 text-sm">
                          Return User Rate
                        </span>
                        <span className="font-bold text-neutral-900">
                          {engagement.returnUserRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, engagement.returnUserRate)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-600 mb-2">
                        Avg Session Duration
                      </p>
                      <p className="text-2xl font-bold text-neutral-900">
                        {engagement.averageSessionDuration.toFixed(1)}
                        <span className="text-sm text-neutral-600 ml-2">minutes</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-600 mb-2">Engagement Rate</p>
                      <p className="text-2xl font-bold text-neutral-900">
                        {engagement.engagementRate.toFixed(1)}
                        <span className="text-sm text-neutral-600 ml-2">%</span>
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Growth Overview */}
              {growth && (
                <Card padding="lg">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">
                    Growth Metrics
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-neutral-600 mb-2">
                        Weekly Signups
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {growth.signupsThisWeek}
                        <span className="text-sm text-neutral-600 ml-2">new users</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-600 mb-2">
                        Month-over-Month Growth
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {growth.monthOverMonthGrowth.toFixed(1)}
                        <span className="text-sm text-neutral-600 ml-2">%</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-600 mb-2">Churn Rate</p>
                      <p className="text-2xl font-bold text-red-600">
                        {growth.churnRate.toFixed(1)}
                        <span className="text-sm text-neutral-600 ml-2">%</span>
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Content Performance */}
            {content && (
              <Card padding="lg">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">
                  Content Performance
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-neutral-600 text-sm mb-2">Total Comments</p>
                    <p className="text-3xl font-bold text-neutral-900">
                      {content.totalComments}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600 text-sm mb-2">Avg per Proposal</p>
                    <p className="text-3xl font-bold text-neutral-900">
                      {content.averageCommentsPerProposal.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600 text-sm mb-2">Total Feedback</p>
                    <p className="text-3xl font-bold text-neutral-900">
                      {content.totalFeedback}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600 text-sm mb-2">Resolution Rate</p>
                    <p className="text-3xl font-bold text-green-600">
                      {content.feedbackResolutionRate.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Engagement Tab */}
        {activeTab === 'engagement' && engagement && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                Engagement Breakdown
              </h2>

              <div className="space-y-6">
                {/* Total vs Active */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderMetricCard(
                    'Total Users',
                    engagement.totalUsers,
                    ''
                  )}
                  {renderMetricCard(
                    'Active Users',
                    engagement.activeUsers,
                    ''
                  )}
                  {renderMetricCard(
                    'Monthly Active',
                    engagement.monthlyActiveUsers,
                    ''
                  )}
                </div>

                {/* Engagement Details */}
                <div className="border-t border-neutral-200 pt-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">
                    Engagement Depth
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-neutral-900">
                          Return User Rate
                        </span>
                        <span className="font-bold text-neutral-900">
                          {engagement.returnUserRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, engagement.returnUserRate)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-neutral-900">
                          Engagement Rate
                        </span>
                        <span className="font-bold text-neutral-900">
                          {engagement.engagementRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, engagement.engagementRate)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-neutral-900 mb-2">
                        Avg Session Duration
                      </p>
                      <p className="text-3xl font-bold text-primary-600">
                        {engagement.averageSessionDuration.toFixed(1)}
                        <span className="text-lg text-neutral-600 ml-2">minutes</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Growth Tab */}
        {activeTab === 'growth' && growth && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                Growth Analytics
              </h2>

              <div className="space-y-6">
                {/* Current Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderMetricCard(
                    'Signups This Week',
                    growth.signupsThisWeek,
                    'users'
                  )}
                  {renderMetricCard(
                    'Signups This Month',
                    growth.signupsThisMonth,
                    'users'
                  )}
                </div>

                {/* Growth Rates */}
                <div className="border-t border-neutral-200 pt-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">
                    Growth Rates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-neutral-600 text-sm mb-2">
                        Week-over-Week
                      </p>
                      <p
                        className={`text-3xl font-bold ${
                          growth.weekOverWeekGrowth >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {growth.weekOverWeekGrowth.toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-neutral-600 text-sm mb-2">
                        Month-over-Month
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {growth.monthOverMonthGrowth.toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-neutral-600 text-sm mb-2">Churn Rate</p>
                      <p className="text-3xl font-bold text-red-600">
                        {growth.churnRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lifetime */}
                <div className="border-t border-neutral-200 pt-6">
                  <p className="text-neutral-600 text-sm mb-2">
                    Total Lifetime Users
                  </p>
                  <p className="text-4xl font-bold text-neutral-900">
                    {growth.totalLifetimeUsers}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === 'health' && nps && (
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                Community Health & NPS
              </h2>

              {/* NPS Section */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 rounded-lg border border-primary-200">
                  <p className="text-neutral-600 text-sm mb-2">Net Promoter Score</p>
                  <p className="text-5xl font-bold text-primary-600 mb-4">
                    {nps.npsScore}
                  </p>
                  <p className="text-neutral-700">
                    {nps.npsScore >= 50 && '🎉 Excellent! Your community is highly loyal.'}
                    {nps.npsScore >= 0 && nps.npsScore < 50 && '✅ Good! Keep improving.'}
                    {nps.npsScore < 0 && '⚠️ Needs attention. Focus on customer satisfaction.'}
                  </p>
                </div>

                {/* NPS Distribution */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900 mb-2">Promoters (9-10)</p>
                    <p className="text-3xl font-bold text-green-600">
                      {nps.promoters}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-900 mb-2">Passives (7-8)</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {nps.passives}
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-900 mb-2">Detractors (0-6)</p>
                    <p className="text-3xl font-bold text-red-600">
                      {nps.detractors}
                    </p>
                  </div>
                </div>

                <div className="text-center text-sm text-neutral-600">
                  Total Respondents: {nps.respondents}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
