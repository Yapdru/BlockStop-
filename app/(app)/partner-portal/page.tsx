'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components';
import { a11y } from '@/lib/a11y';

interface PartnerProfile {
  type: 'affiliate' | 'reseller' | 'white-label';
  name: string;
  email: string;
  status: string;
  joinDate: string;
  earnings?: number;
  customers?: number;
}

export default function PartnerPortal() {
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartnerProfile = async () => {
      try {
        const userId = localStorage.getItem('userId');

        const res = await fetch('/api/partner/profile', {
          headers: { 'x-user-id': userId || '' },
        });

        if (res.ok) {
          setPartner(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch partner profile:', error);
        a11y.announce('Failed to load partner profile', 'polite');
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-neutral-600 font-medium">Loading partner portal...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">Partner Portal</h1>
        <p className="text-neutral-600">Central hub for affiliates, resellers, and white-label partners</p>
      </div>

      {/* Partner Dashboard Navigation */}
      {partner ? (
        <>
          <Card padding="lg" className="mb-8 bg-accent-50 border border-accent-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Partner Type</p>
                <h2 className="text-2xl font-bold text-neutral-900 capitalize">{partner.type} Partner</h2>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                partner.status === 'active'
                  ? 'bg-success/20 text-success'
                  : 'bg-warning/20 text-warning'
              }`}>
                {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
              </span>
            </div>
            <p className="text-neutral-600">{partner.name}</p>
            <p className="text-sm text-neutral-600">{partner.email}</p>

            {partner.type === 'affiliate' && (
              <Link href="/affiliate" className="mt-4 block">
                <Button>Go to Affiliate Dashboard</Button>
              </Link>
            )}
            {partner.type === 'reseller' && (
              <Link href="/reseller" className="mt-4 block">
                <Button>Go to Reseller Console</Button>
              </Link>
            )}
            {partner.type === 'white-label' && (
              <Link href="/whitelabel" className="mt-4 block">
                <Button>Go to White-Label Console</Button>
              </Link>
            )}
          </Card>
        </>
      ) : (
        <Card padding="lg" className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Become a Partner</h2>
          <p className="text-neutral-600 mb-6">
            Join our partner program to grow your revenue and expand your business reach.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/affiliate/apply">
              <Button variant="secondary" className="w-full">
                Apply as Affiliate
              </Button>
            </Link>
            <Link href="/reseller/apply">
              <Button variant="secondary" className="w-full">
                Apply as Reseller
              </Button>
            </Link>
            <Link href="/whitelabel/apply">
              <Button variant="secondary" className="w-full">
                Apply for White-Label
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Resource Library */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Resource Library</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Marketing Materials */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-neutral-900">Marketing Materials</h3>

            <div className="space-y-2">
              <Link href="/partner-portal/resources/logos" className="block p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                <p className="font-medium text-neutral-900">Logo Packages</p>
                <p className="text-sm text-neutral-600">Download high-res logos and brand assets</p>
              </Link>

              <Link href="/partner-portal/resources/banners" className="block p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                <p className="font-medium text-neutral-900">Email Templates</p>
                <p className="text-sm text-neutral-600">Ready-to-use marketing email templates</p>
              </Link>

              <Link href="/partner-portal/resources/social-media" className="block p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                <p className="font-medium text-neutral-900">Social Media Assets</p>
                <p className="text-sm text-neutral-600">Pre-designed posts and promotional graphics</p>
              </Link>

              <Link href="/partner-portal/resources/case-studies" className="block p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                <p className="font-medium text-neutral-900">Case Studies</p>
                <p className="text-sm text-neutral-600">Customer success stories and ROI data</p>
              </Link>
            </div>
          </div>

          {/* Technical Documentation */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-neutral-900">Technical Resources</h3>

            <div className="space-y-2">
              <Link href="/partner-portal/documentation/api" className="block p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                <p className="font-medium text-neutral-900">API Documentation</p>
                <p className="text-sm text-neutral-600">Complete API reference and integration guides</p>
              </Link>

              <Link href="/partner-portal/documentation/integration" className="block p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                <p className="font-medium text-neutral-900">Integration Guides</p>
                <p className="text-sm text-neutral-600">Step-by-step integration instructions</p>
              </Link>

              <Link href="/partner-portal/documentation/webhooks" className="block p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                <p className="font-medium text-neutral-900">Webhooks Reference</p>
                <p className="text-sm text-neutral-600">Real-time event webhooks documentation</p>
              </Link>

              <Link href="/partner-portal/documentation/faq" className="block p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                <p className="font-medium text-neutral-900">FAQ & Troubleshooting</p>
                <p className="text-sm text-neutral-600">Common questions and solutions</p>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Training & Support */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Training & Support</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-neutral-900 mb-4">Video Tutorials</h3>
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                Access our library of training videos covering:
              </p>
              <ul className="text-sm text-neutral-600 space-y-1 ml-4">
                <li>• Getting started with our platform</li>
                <li>• Setting up your account</li>
                <li>• Advanced features and tips</li>
                <li>• Best practices for success</li>
              </ul>
            </div>
            <Link href="/partner-portal/training/videos" className="mt-4 block">
              <Button variant="secondary" className="w-full">
                Browse Videos
              </Button>
            </Link>
          </div>

          <div>
            <h3 className="font-bold text-neutral-900 mb-4">Live Webinars</h3>
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                Join our regular webinars:
              </p>
              <ul className="text-sm text-neutral-600 space-y-1 ml-4">
                <li>• Weekly partner office hours</li>
                <li>• Monthly product updates</li>
                <li>• Quarterly business reviews</li>
                <li>• Specialized training sessions</li>
              </ul>
            </div>
            <Link href="/partner-portal/webinars" className="mt-4 block">
              <Button variant="secondary" className="w-full">
                View Schedule
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Support Channels */}
      <Card padding="lg" className="mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Get Help</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="font-bold text-neutral-900 mb-2">Partner Email Support</p>
            <p className="text-sm text-neutral-600 mb-4">
              partner-support@blockstop.io
            </p>
            <Button variant="secondary" className="w-full text-sm">
              Send Email
            </Button>
          </div>

          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="font-bold text-neutral-900 mb-2">Support Portal</p>
            <p className="text-sm text-neutral-600 mb-4">
              Create and track support tickets
            </p>
            <Link href="/partner-portal/support-tickets" className="block">
              <Button variant="secondary" className="w-full text-sm">
                Open Portal
              </Button>
            </Link>
          </div>

          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="font-bold text-neutral-900 mb-2">Community Forum</p>
            <p className="text-sm text-neutral-600 mb-4">
              Connect with other partners
            </p>
            <Link href="/partner-portal/community" className="block">
              <Button variant="secondary" className="w-full text-sm">
                Visit Forum
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* News & Updates */}
      <Card padding="lg">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Latest News & Updates</h2>

        <div className="space-y-4">
          <div className="border-b border-neutral-200 pb-4 last:border-b-0">
            <p className="text-sm text-neutral-500 mb-1">June 20, 2026</p>
            <p className="font-bold text-neutral-900 mb-1">New API Endpoints Released</p>
            <p className="text-sm text-neutral-600">
              We've released new webhook endpoints for real-time customer data synchronization.
            </p>
            <Link href="/partner-portal/news/api-endpoints" className="text-sm text-accent-500 font-medium mt-2 inline-block">
              Read more →
            </Link>
          </div>

          <div className="border-b border-neutral-200 pb-4 last:border-b-0">
            <p className="text-sm text-neutral-500 mb-1">June 15, 2026</p>
            <p className="font-bold text-neutral-900 mb-1">Updated Commission Tiers for Q3</p>
            <p className="text-sm text-neutral-600">
              We're increasing commission rates across all tiers. Check your updated earnings potential.
            </p>
            <Link href="/partner-portal/news/commission-update" className="text-sm text-accent-500 font-medium mt-2 inline-block">
              Read more →
            </Link>
          </div>

          <div className="border-b border-neutral-200 pb-4 last:border-b-0">
            <p className="text-sm text-neutral-500 mb-1">June 10, 2026</p>
            <p className="font-bold text-neutral-900 mb-1">New White-Label Features</p>
            <p className="text-sm text-neutral-600">
              Custom email branding, domain management, and enhanced SSO support now available.
            </p>
            <Link href="/partner-portal/news/whitelabel-features" className="text-sm text-accent-500 font-medium mt-2 inline-block">
              Read more →
            </Link>
          </div>
        </div>

        <Link href="/partner-portal/news" className="mt-6 block">
          <Button variant="secondary" className="w-full">
            View All News
          </Button>
        </Link>
      </Card>
    </div>
  );
}
