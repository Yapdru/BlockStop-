'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components';
import { a11y } from '@/lib/a11y';

interface SaaSMetrics {
  mrr: number;
  arr: number;
  mrrGrowth: number;
  cac: number;
  ltv: number;
  cacPaybackPeriod: number;
  churnRate: number;
  annualChurnRate: number;
  retentionRate: number;
  ndcExponent: number;
  grossMargin: number;
  operatingMargin: number;
  burnRate: number;
  runway: number;
}

interface RevenueProjection {
  month: string;
  projectedMRR: number;
  projectedARR: number;
  confidence: 'high' | 'medium' | 'low';
}

export default function SaaSMetricsDashboard() {
  const [metrics, setMetrics] = useState<SaaSMetrics | null>(null);
  const [projections, setProjections] = useState<RevenueProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Check if user is admin
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'admin') {
          a11y.announce('Admin access required to view SaaS metrics', 'polite');
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        const [metricsRes, projectionsRes] = await Promise.all([
          fetch('/api/saas/metrics'),
          fetch('/api/saas/forecast?months=12'),
        ]);

        if (metricsRes.ok) {
          setMetrics(await metricsRes.json());
        }

        if (projectionsRes.ok) {
          setProjections(await projectionsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        a11y.announce('Failed to load SaaS metrics', 'polite');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-neutral-600 font-medium">Loading SaaS metrics...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-danger font-medium">Admin Access Required</div>
        <p className="text-neutral-600">Only admins can view SaaS metrics</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-neutral-600 font-medium">Failed to load SaaS metrics</div>
      </div>
    );
  }

  const getHealthIndicator = (value: number, metric: string) => {
    switch (metric) {
      case 'churnRate':
        if (value < 5) return 'text-success';
        if (value < 10) return 'text-warning';
        return 'text-danger';
      case 'retentionRate':
        if (value > 95) return 'text-success';
        if (value > 90) return 'text-warning';
        return 'text-danger';
      case 'ltv':
        if (value > metrics.cac * 3) return 'text-success';
        return 'text-warning';
      case 'mrrGrowth':
        if (value > 10) return 'text-success';
        if (value > 0) return 'text-warning';
        return 'text-danger';
      default:
        return 'text-neutral-900';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">SaaS Metrics Dashboard</h1>
        <p className="text-neutral-600">Key business metrics and performance indicators</p>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Monthly Recurring Revenue</p>
          <p className="text-3xl font-bold text-success">${metrics.mrr.toFixed(0)}</p>
          <p className={`text-sm font-semibold mt-2 ${getHealthIndicator(metrics.mrrGrowth, 'mrrGrowth')}`}>
            {metrics.mrrGrowth > 0 ? '+' : ''}{metrics.mrrGrowth.toFixed(1)}% MoM
          </p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Annual Recurring Revenue</p>
          <p className="text-3xl font-bold text-success">${metrics.arr.toFixed(0)}</p>
          <p className="text-xs text-neutral-500 mt-2">MRR × 12</p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Gross Margin</p>
          <p className="text-3xl font-bold text-accent-500">{metrics.grossMargin.toFixed(1)}%</p>
          <p className="text-xs text-neutral-500 mt-2">Revenue after COGS</p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Operating Margin</p>
          <p className={`text-3xl font-bold ${metrics.operatingMargin > 0 ? 'text-success' : 'text-danger'}`}>
            {metrics.operatingMargin.toFixed(1)}%
          </p>
          <p className="text-xs text-neutral-500 mt-2">After operating expenses</p>
        </Card>
      </div>

      {/* Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Customer Churn Rate</p>
          <p className={`text-3xl font-bold ${getHealthIndicator(metrics.churnRate, 'churnRate')}`}>
            {metrics.churnRate.toFixed(2)}%
          </p>
          <p className="text-xs text-neutral-500 mt-2">monthly</p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Retention Rate</p>
          <p className={`text-3xl font-bold ${getHealthIndicator(metrics.retentionRate, 'retentionRate')}`}>
            {metrics.retentionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-neutral-500 mt-2">monthly</p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Customer Acquisition Cost</p>
          <p className="text-3xl font-bold text-neutral-900">${metrics.cac.toFixed(0)}</p>
          <p className="text-xs text-neutral-500 mt-2">per customer</p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Customer Lifetime Value</p>
          <p className={`text-3xl font-bold ${getHealthIndicator(metrics.ltv, 'ltv')}`}>
            ${metrics.ltv.toFixed(0)}
          </p>
          <p className="text-xs text-neutral-500 mt-2">LTV:CAC = {(metrics.ltv / metrics.cac).toFixed(1)}:1</p>
        </Card>
      </div>

      {/* Profitability & Runway */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">CAC Payback Period</p>
          <p className="text-3xl font-bold text-neutral-900">{metrics.cacPaybackPeriod.toFixed(1)}</p>
          <p className="text-xs text-neutral-500 mt-2">months</p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Monthly Burn Rate</p>
          <p className={`text-3xl font-bold ${metrics.burnRate > 0 ? 'text-danger' : 'text-success'}`}>
            ${metrics.burnRate.toFixed(0)}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            {metrics.burnRate > 0 ? 'Cash burn' : 'Profitable'}
          </p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Runway</p>
          <p className={`text-3xl font-bold ${metrics.runway > 12 ? 'text-success' : 'text-warning'}`}>
            {metrics.runway === Infinity ? '∞' : metrics.runway.toFixed(0)}
          </p>
          <p className="text-xs text-neutral-500 mt-2">months of cash</p>
        </Card>
      </div>

      {/* Net Dollar Churn */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Net Dollar Churn Exponent</h2>

        <div className="flex items-end gap-8">
          <div>
            <p className="text-4xl font-bold text-accent-500">{metrics.ndcExponent.toFixed(1)}%</p>
            <p className="text-sm text-neutral-600 mt-2">
              {metrics.ndcExponent > 0
                ? 'Positive growth - expansion revenue exceeds churn'
                : 'Negative growth - churn exceeds expansion'}
            </p>
          </div>

          <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${metrics.ndcExponent > 0 ? 'bg-success' : 'bg-danger'}`}
              style={{
                width: `${Math.min(Math.abs(metrics.ndcExponent) * 5, 100)}%`,
              }}
            />
          </div>
        </div>
      </Card>

      {/* Revenue Forecast */}
      {projections.length > 0 && (
        <Card padding="lg" className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">12-Month Revenue Forecast</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projections.slice(0, 6).map((proj, index) => (
              <div key={index} className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm font-medium text-neutral-600 mb-2">
                  {new Date(proj.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
                <p className="text-2xl font-bold text-success mb-1">${proj.projectedMRR.toFixed(0)}</p>
                <p className="text-xs text-neutral-600 mb-2">
                  ARR: ${proj.projectedARR.toFixed(0)}
                </p>
                <span className={`text-xs px-2 py-1 rounded ${
                  proj.confidence === 'high'
                    ? 'bg-success/20 text-success'
                    : proj.confidence === 'medium'
                    ? 'bg-warning/20 text-warning'
                    : 'bg-neutral-300 text-neutral-700'
                }`}>
                  {proj.confidence} confidence
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Health Summary */}
      <Card padding="lg">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Business Health Summary</h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
            <div>
              <p className="font-semibold text-neutral-900">Revenue Growth</p>
              <p className="text-sm text-neutral-600">MRR growth rate</p>
            </div>
            <p className={`text-lg font-bold ${metrics.mrrGrowth > 5 ? 'text-success' : 'text-warning'}`}>
              {metrics.mrrGrowth > 0 ? '+' : ''}{metrics.mrrGrowth.toFixed(1)}%
            </p>
          </div>

          <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
            <div>
              <p className="font-semibold text-neutral-900">Unit Economics</p>
              <p className="text-sm text-neutral-600">LTV to CAC Ratio</p>
            </div>
            <p className={`text-lg font-bold ${(metrics.ltv / metrics.cac) > 3 ? 'text-success' : 'text-warning'}`}>
              {(metrics.ltv / metrics.cac).toFixed(1)}:1
            </p>
          </div>

          <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
            <div>
              <p className="font-semibold text-neutral-900">Profitability</p>
              <p className="text-sm text-neutral-600">Operating margin</p>
            </div>
            <p className={`text-lg font-bold ${metrics.operatingMargin > 0 ? 'text-success' : 'text-danger'}`}>
              {metrics.operatingMargin.toFixed(1)}%
            </p>
          </div>

          <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
            <div>
              <p className="font-semibold text-neutral-900">Retention</p>
              <p className="text-sm text-neutral-600">Customer retention rate</p>
            </div>
            <p className={`text-lg font-bold ${metrics.retentionRate > 90 ? 'text-success' : 'text-warning'}`}>
              {metrics.retentionRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
