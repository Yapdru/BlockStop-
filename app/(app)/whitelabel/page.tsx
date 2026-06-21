'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components';
import { a11y } from '@/lib/a11y';

interface BrandingData {
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain?: string;
  customEmailDomain?: string;
  supportEmail?: string;
}

interface LicenseData {
  licenseKey: string;
  licenseType: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  expiryDate: string;
  maxUsers?: number;
  maxCustomers?: number;
  features: string[];
  customBrandingIncluded: boolean;
  customDomainIncluded: boolean;
  apiAccessIncluded: boolean;
  supportTier: string;
}

export default function WhiteLabelConsole() {
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWhiteLabelData = async () => {
      try {
        const userId = localStorage.getItem('userId');

        const [brandingRes, licenseRes] = await Promise.all([
          fetch('/api/whitelabel/branding', {
            headers: { 'x-user-id': userId || '' },
          }),
          fetch('/api/whitelabel/license', {
            headers: { 'x-user-id': userId || '' },
          }),
        ]);

        if (brandingRes.ok) {
          setBranding(await brandingRes.json());
        }

        if (licenseRes.ok) {
          setLicense(await licenseRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch white-label data:', error);
        a11y.announce('Failed to load white-label data', 'polite');
      } finally {
        setLoading(false);
      }
    };

    fetchWhiteLabelData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-neutral-600 font-medium">Loading white-label console...</div>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-neutral-600 font-medium">Not a white-label partner yet</div>
        <Link href="/whitelabel/apply">
          <Button>Apply for White-Label</Button>
        </Link>
      </div>
    );
  }

  const daysRemaining = license.expiryDate
    ? Math.ceil((new Date(license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const licenseStatusColor = {
    active: 'text-success',
    expired: 'text-danger',
    suspended: 'text-warning',
    revoked: 'text-danger',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">White-Label Console</h1>
        <p className="text-neutral-600">Manage your custom branding, domain, and license</p>
      </div>

      {/* License Status */}
      {license && (
        <Card padding="lg" className="mb-8 border-2 border-accent-500">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">License Information</h2>
              <p className={`text-lg font-semibold ${licenseStatusColor[license.status]}`}>
                Status: {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-600">License Type</p>
              <p className="text-2xl font-bold text-neutral-900">
                {license.licenseType.charAt(0).toUpperCase() + license.licenseType.slice(1)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-neutral-600 mb-1">License Key</p>
              <p className="font-mono text-sm bg-neutral-100 p-2 rounded">{license.licenseKey}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Expires</p>
              <p className="font-semibold text-neutral-900">
                {new Date(license.expiryDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-neutral-500">{daysRemaining} days remaining</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Support Tier</p>
              <p className="font-semibold text-neutral-900">
                {license.supportTier.charAt(0).toUpperCase() + license.supportTier.slice(1)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
            {license.maxUsers && (
              <div>
                <p className="text-sm text-neutral-600">Max Users</p>
                <p className="text-lg font-bold text-neutral-900">{license.maxUsers}</p>
              </div>
            )}
            {license.maxCustomers && (
              <div>
                <p className="text-sm text-neutral-600">Max Customers</p>
                <p className="text-lg font-bold text-neutral-900">{license.maxCustomers}</p>
              </div>
            )}
          </div>

          <Link href="/whitelabel/license-renewal">
            <Button>Renew License</Button>
          </Link>
        </Card>
      )}

      {/* Included Features */}
      {license && (
        <Card padding="lg" className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Included Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${license.customBrandingIncluded ? 'bg-success/10' : 'bg-neutral-100'}`}>
              <p className="font-semibold text-neutral-900 mb-1">Custom Branding</p>
              <p className={`text-sm ${license.customBrandingIncluded ? 'text-success' : 'text-neutral-600'}`}>
                {license.customBrandingIncluded ? '✓ Included' : '✗ Not Included'}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${license.customDomainIncluded ? 'bg-success/10' : 'bg-neutral-100'}`}>
              <p className="font-semibold text-neutral-900 mb-1">Custom Domain</p>
              <p className={`text-sm ${license.customDomainIncluded ? 'text-success' : 'text-neutral-600'}`}>
                {license.customDomainIncluded ? '✓ Included' : '✗ Not Included'}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${license.apiAccessIncluded ? 'bg-success/10' : 'bg-neutral-100'}`}>
              <p className="font-semibold text-neutral-900 mb-1">API Access</p>
              <p className={`text-sm ${license.apiAccessIncluded ? 'text-success' : 'text-neutral-600'}`}>
                {license.apiAccessIncluded ? '✓ Included' : '✗ Not Included'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-700 mb-3">Additional Features:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {license.features.map((feature, index) => (
                <p key={index} className="text-sm text-neutral-600 flex items-center gap-2">
                  <span className="text-success">✓</span> {feature}
                </p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Branding Management */}
      {branding && (
        <Card padding="lg" className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Branding Configuration</h2>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Company Name</p>
              <p className="text-lg font-semibold text-neutral-900">{branding.companyName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Primary Color</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded border border-neutral-300"
                    style={{ backgroundColor: branding.primaryColor }}
                  />
                  <p className="font-mono text-sm">{branding.primaryColor}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Secondary Color</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded border border-neutral-300"
                    style={{ backgroundColor: branding.secondaryColor }}
                  />
                  <p className="font-mono text-sm">{branding.secondaryColor}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Accent Color</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded border border-neutral-300"
                    style={{ backgroundColor: branding.accentColor }}
                  />
                  <p className="font-mono text-sm">{branding.accentColor}</p>
                </div>
              </div>
            </div>

            {branding.customDomain && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Custom Domain</p>
                <p className="text-lg font-semibold text-neutral-900">{branding.customDomain}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <Link href="/whitelabel/branding">
                <Button variant="secondary" className="w-full">
                  Edit Branding
                </Button>
              </Link>
              <Link href="/whitelabel/domain">
                <Button variant="secondary" className="w-full">
                  Manage Domain
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="lg">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Email Branding</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Customize email templates and sender addresses.
          </p>
          <Link href="/whitelabel/email">
            <Button className="w-full">Configure Email</Button>
          </Link>
        </Card>

        <Card padding="lg">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Documentation</h3>
          <p className="text-sm text-neutral-600 mb-4">
            Access integration guides and API documentation.
          </p>
          <Link href="/partner-portal/documentation">
            <Button className="w-full">View Docs</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
