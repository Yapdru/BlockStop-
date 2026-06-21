'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components';
import { a11y } from '@/lib/a11y';

interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  thisMonthReferrals: number;
  thisMonthCommission: number;
}

interface PayoutSummary {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  nextPayoutDate?: string;
  lastPayoutDate?: string;
  averagePayoutAmount: number;
  totalPayoutsThisYear: number;
}

export default function AffiliateDashboard() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    const fetchAffiliateData = async () => {
      try {
        const userId = localStorage.getItem('userId');

        const [statsRes, payoutRes] = await Promise.all([
          fetch('/api/affiliate/stats', { headers: { 'x-user-id': userId || '' } }),
          fetch('/api/affiliate/payouts/summary', { headers: { 'x-user-id': userId || '' } }),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
          setAffiliateCode(data.affiliateCode);
          setReferralLink(`${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${data.affiliateCode}`);
        }

        if (payoutRes.ok) {
          setPayoutSummary(await payoutRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch affiliate data:', error);
        a11y.announce('Failed to load affiliate data', 'polite');
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliateData();
  }, []);

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    a11y.announce('Referral link copied to clipboard', 'polite');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-neutral-600 font-medium">Loading affiliate dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-neutral-600 font-medium">Not an active affiliate yet</div>
        <Link href="/affiliate/apply">
          <Button>Apply to Become an Affiliate</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Affiliate Dashboard</h1>
        <p className="text-neutral-600">Track your referrals, commissions, and earnings</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Total Referrals</p>
          <p className="text-3xl font-bold text-neutral-900">{stats.totalReferrals}</p>
          <p className="text-xs text-neutral-500 mt-2">
            {stats.activeReferrals} active ({stats.conversionRate.toFixed(1)}%)
          </p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Total Commission</p>
          <p className="text-3xl font-bold text-success">${stats.totalCommissionEarned.toFixed(2)}</p>
          <p className="text-xs text-neutral-500 mt-2">
            ${stats.totalCommissionPaid.toFixed(2)} paid
          </p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">Pending Payout</p>
          <p className="text-3xl font-bold text-warning">${stats.pendingCommission.toFixed(2)}</p>
          <p className="text-xs text-neutral-500 mt-2">
            This month: ${stats.thisMonthCommission.toFixed(2)}
          </p>
        </Card>

        <Card padding="md">
          <p className="text-sm font-semibold text-neutral-600 mb-2">This Month</p>
          <p className="text-3xl font-bold text-accent-500">{stats.thisMonthReferrals}</p>
          <p className="text-xs text-neutral-500 mt-2">new referrals</p>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Your Referral Link</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Affiliate Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={affiliateCode}
                readOnly
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(affiliateCode);
                  a11y.announce('Code copied', 'polite');
                }}
              >
                Copy Code
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Full Referral Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 text-sm"
              />
              <Button onClick={handleCopyReferralLink}>Copy Link</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <Link href="/affiliate/marketing-materials">
              <Button variant="secondary" className="w-full">
                Marketing Materials
              </Button>
            </Link>
            <Link href="/affiliate/performance">
              <Button variant="secondary" className="w-full">
                Performance Tracking
              </Button>
            </Link>
            <Link href="/affiliate/payouts">
              <Button variant="secondary" className="w-full">
                Payout History
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Payout Section */}
      {payoutSummary && (
        <Card padding="lg" className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Payout Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-neutral-600 mb-2">Pending</p>
              <p className="text-2xl font-bold text-warning">
                ${payoutSummary.totalPending.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-neutral-600 mb-2">Processing</p>
              <p className="text-2xl font-bold text-accent-500">
                ${payoutSummary.totalProcessing.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-neutral-600 mb-2">Total Paid</p>
              <p className="text-2xl font-bold text-success">
                ${payoutSummary.totalCompleted.toFixed(2)}
              </p>
            </div>
          </div>

          {payoutSummary.nextPayoutDate && (
            <p className="text-sm text-neutral-600 mt-4">
              Next payout scheduled: {new Date(payoutSummary.nextPayoutDate).toLocaleDateString()}
            </p>
          )}

          <Link href="/affiliate/payouts/request" className="mt-6 block">
            <Button className="w-full md:w-auto">Request Payout</Button>
          </Link>
        </Card>
      )}

      {/* Commission Structure */}
      <Card padding="lg">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Commission Structure</h2>

        <div className="space-y-4">
          <div className="p-4 bg-neutral-50 rounded-lg">
            <h3 className="font-semibold text-neutral-900 mb-2">Bronze Tier</h3>
            <p className="text-sm text-neutral-600">10% base commission, no milestone bonuses</p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-lg">
            <h3 className="font-semibold text-neutral-900 mb-2">Silver Tier</h3>
            <p className="text-sm text-neutral-600">15% base + 1% per 10 referrals + 2% team commission</p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-lg">
            <h3 className="font-semibold text-neutral-900 mb-2">Gold Tier</h3>
            <p className="text-sm text-neutral-600">20% base + 1.5% per 10 referrals + 3% team commission</p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-lg">
            <h3 className="font-semibold text-neutral-900 mb-2">Platinum Tier</h3>
            <p className="text-sm text-neutral-600">30% base + 2% per 10 referrals + 5% team commission</p>
          </div>
        </div>

        <p className="text-sm text-neutral-600 mt-6">
          Your commission rate increases automatically as you reach more referrals. Unlock higher tiers for better
          commissions!
        </p>
      </Card>
    </div>
  );
}
