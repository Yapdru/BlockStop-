'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components';
import { a11y } from '@/lib/a11y';

interface ResellerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageCustomerValue: number;
  churnRate: number;
  topCustomers: Array<{
    customerId: string;
    name: string;
    monthlyRevenue: number;
  }>;
}

export default function ResellerConsole() {
  const [stats, setStats] = useState<ResellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [markupPercentage, setMarkupPercentage] = useState(30);

  useEffect(() => {
    const fetchResellerData = async () => {
      try {
        const userId = localStorage.getItem('userId');

        const res = await fetch('/api/reseller/stats', {
          headers: { 'x-user-id': userId || '' },
        });

        if (res.ok) {
          setStats(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch reseller data:', error);
        a11y.announce('Failed to load reseller data', 'polite');
      } finally {
        setLoading(false);
      }
    };

    fetchResellerData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-neutral-600 font-medium">Loading reseller console...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-neutral-600 font-medium">Not a reseller yet</div>
        <Link href="/reseller/apply">
          <Button>Apply to Become a Reseller</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Reseller Console</h1>
        <p className="text-neutral-600">Manage your customers, pricing, and usage tracking</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Total Customers</p>
          <p className="text-3xl font-bold text-neutral-900">{stats.totalCustomers}</p>
          <p className="text-xs text-neutral-500 mt-2">
            {stats.activeCustomers} active
          </p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Monthly Revenue</p>
          <p className="text-3xl font-bold text-success">${stats.monthlyRecurringRevenue.toFixed(2)}</p>
          <p className="text-xs text-neutral-500 mt-2">
            Total: ${stats.totalRevenue.toFixed(2)}
          </p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Avg Customer Value</p>
          <p className="text-3xl font-bold text-accent-500">${stats.averageCustomerValue.toFixed(2)}</p>
          <p className="text-xs text-neutral-500 mt-2">monthly per customer</p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Churn Rate</p>
          <p className="text-3xl font-bold text-warning">{stats.churnRate.toFixed(1)}%</p>
          <p className="text-xs text-neutral-500 mt-2">monthly churn</p>
        </Card>
      </div>

      {/* Pricing Control */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Pricing Control</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-4">
              Your Markup Percentage: {markupPercentage}%
            </label>
            <input
              type="range"
              min="20"
              max="100"
              value={markupPercentage}
              onChange={(e) => setMarkupPercentage(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-neutral-500 mt-2">Minimum 20% markup required</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Link href="/reseller/pricing">
              <Button variant="secondary" className="w-full">
                Set Custom Pricing
              </Button>
            </Link>
            <Link href="/reseller/customers">
              <Button variant="secondary" className="w-full">
                Manage Customers
              </Button>
            </Link>
            <Link href="/reseller/usage-tracking">
              <Button variant="secondary" className="w-full">
                Usage Tracking
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Top Customers */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Top Customers</h2>

        {stats.topCustomers.length > 0 ? (
          <div className="space-y-3">
            {stats.topCustomers.map((customer) => (
              <div
                key={customer.customerId}
                className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-neutral-900">{customer.name}</p>
                  <p className="text-sm text-neutral-600">{customer.customerId}</p>
                </div>
                <p className="text-lg font-bold text-success">${customer.monthlyRevenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-600">No customers yet</p>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="lg">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Customer Management</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Add, manage, and monitor your customer accounts and subscriptions.
          </p>
          <Link href="/reseller/customers/new">
            <Button className="w-full">Add New Customer</Button>
          </Link>
        </Card>

        <Card padding="lg">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Support & Resources</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Access training materials, documentation, and support resources.
          </p>
          <Link href="/partner-portal">
            <Button className="w-full">Partner Portal</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
