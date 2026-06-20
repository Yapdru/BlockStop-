'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/layouts/DashboardLayout';
import { Card, Button, Tabs } from '@/components';
import { WhiteLabelSettings, BrandingConfig, EnterpriseTier } from '@/types/enterprise';
import { LoadingSpinner } from '@/app/components/animations/LoadingSpinner';
import { FadeIn } from '@/app/components/animations/FadeIn';

const TIER_FEATURES = {
  NEO: {
    level: 'Basic',
    description: 'Essential white-label features',
    features: ['Custom domain', 'Basic logo upload'],
  },
  PRO: {
    level: 'Professional',
    description: 'Extended customization',
    features: [
      'Custom domain',
      'Logo upload',
      'Color customization',
      'Email customization',
    ],
  },
  MAX: {
    level: 'Enterprise',
    description: 'Full white-label control',
    features: [
      'Custom domain',
      'Full branding',
      'Advanced customization',
      'Dedicated support',
      'Custom CSS',
    ],
  },
};

export default function EnterpriseWhiteLabelPage() {
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tier, setTier] = useState<EnterpriseTier>('PRO');
  const [activeTab, setActiveTab] = useState('branding');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [branding, setBranding] = useState<BrandingConfig>({
    tier: 'PRO',
    colors: {
      primary: '#1e88ff',
      secondary: '#0d47a1',
      accent: '#ffe500',
      warning: '#ff9800',
      danger: '#f44336',
    },
  });

  const [domain, setDomain] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/enterprise/white-label', {
        headers: { 'x-user-id': userId || '' },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setBranding(data.branding);
        setDomain(data.customDomain || '');
        setCompanyName(data.companyName || '');
        setSupportEmail(data.branding.supportEmail || '');
        setTier(data.branding.tier);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/enterprise/white-label', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify({
          companyName,
          customDomain: domain,
          branding: {
            ...branding,
            supportEmail,
          },
        }),
      });

      if (response.ok) {
        setSuccess('Settings saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/enterprise/white-label/upload-logo', {
        method: 'POST',
        headers: { 'x-user-id': userId || '' },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setBranding({ ...branding, logo: { url: data.url, altText: 'Company logo' } });
        setSuccess('Logo uploaded successfully');
      }
    } catch (err) {
      setError('Failed to upload logo');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <FadeIn>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              White-Label Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize BlockStop with your brand identity
            </p>
          </div>

          {error && <div className="bg-danger/10 text-danger p-4 rounded-lg">{error}</div>}
          {success && (
            <div className="bg-success/10 text-success p-4 rounded-lg">{success}</div>
          )}

          {/* Tier Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.entries(TIER_FEATURES) as Array<[EnterpriseTier, typeof TIER_FEATURES['NEO']]>).map(
              ([tierKey, tierInfo]) => (
                <Card
                  key={tierKey}
                  className={`p-4 border-2 cursor-pointer transition ${
                    tier === tierKey
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                  onClick={() => setTier(tierKey)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {tierKey}
                    </h3>
                    <span className="text-xs bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300 px-2 py-1 rounded">
                      {tierInfo.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {tierInfo.description}
                  </p>
                  <ul className="text-xs space-y-1">
                    {tierInfo.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-primary-600">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            )}
          </div>

          {/* Tabs */}
          <Tabs
            tabs={[
              {
                id: 'branding',
                label: 'Branding',
                content: (
                  <div className="p-4 space-y-4">
                    {/* Company Info */}
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">Company Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                            disabled={tier === 'NEO'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Support Email
                          </label>
                          <input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                            disabled={tier === 'NEO'}
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Logo */}
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">Logo</h3>
                      {branding.logo && (
                        <div className="mb-4">
                          <img
                            src={branding.logo.url}
                            alt={branding.logo.altText}
                            className="max-w-xs h-16 object-contain"
                          />
                        </div>
                      )}
                      <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleLogoUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                          disabled={tier === 'NEO'}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Click to upload logo or drag and drop
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                    </Card>

                    {/* Colors */}
                    {tier !== 'NEO' && (
                      <Card className="p-4">
                        <h3 className="font-semibold mb-4">Color Customization</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {Object.entries(branding.colors).map(([colorName, colorValue]) => (
                            <div key={colorName}>
                              <label className="block text-xs font-medium mb-2 capitalize">
                                {colorName}
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={colorValue}
                                  onChange={(e) =>
                                    setBranding({
                                      ...branding,
                                      colors: {
                                        ...branding.colors,
                                        [colorName]: e.target.value,
                                      },
                                    })
                                  }
                                  className="w-10 h-10 rounded cursor-pointer"
                                  disabled={tier === 'PRO' && colorName !== 'primary'}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-1 font-mono">
                                {colorValue}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                ),
              },
              {
                id: 'domain',
                label: 'Domain',
                content: (
                  <div className="p-4 space-y-4">
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">Custom Domain</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Connect your own domain to provide a fully branded experience.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Custom Domain
                          </label>
                          <input
                            type="text"
                            placeholder="security.yourdomain.com"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                            disabled={tier === 'NEO'}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Point your DNS CNAME record to: blockstop-enterprise.example.com
                          </p>
                        </div>
                      </div>

                      {tier === 'NEO' && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
                          <p className="text-blue-700 dark:text-blue-300">
                            Custom domains are available in PRO and MAX tiers
                          </p>
                        </div>
                      )}
                    </Card>

                    <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold mb-3 text-sm">DNS Configuration</h3>
                      <div className="space-y-2 text-xs font-mono bg-gray-900 text-green-400 p-3 rounded">
                        <div>Type: CNAME</div>
                        <div>Name: security</div>
                        <div>Value: blockstop-enterprise.example.com</div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-3 w-full"
                        disabled={!domain}
                      >
                        Verify Domain
                      </Button>
                    </Card>
                  </div>
                ),
              },
              {
                id: 'preview',
                label: 'Preview',
                content: (
                  <div className="p-4">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-md">
                        <div className="mb-6">
                          {branding.logo ? (
                            <img
                              src={branding.logo.url}
                              alt="Logo"
                              className="h-12 mb-4"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded mb-4" />
                          )}
                          <h1
                            className="text-2xl font-bold"
                            style={{ color: branding.colors.primary }}
                          >
                            {companyName || 'Your Company'}
                          </h1>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Security Monitoring Dashboard
                          </p>

                          <div
                            className="px-4 py-2 rounded text-white font-medium text-center"
                            style={{ backgroundColor: branding.colors.primary }}
                          >
                            Primary Button
                          </div>

                          <div
                            className="px-4 py-2 rounded text-white font-medium text-center"
                            style={{ backgroundColor: branding.colors.accent }}
                          >
                            Action Button
                          </div>

                          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: branding.colors.primary }}
                            />
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: branding.colors.secondary }}
                            />
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: branding.colors.accent }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={fetchSettings}>
              Reset
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </FadeIn>
    </DashboardLayout>
  );
}
