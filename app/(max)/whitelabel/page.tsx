'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * White-Label Admin Panel
 * Custom branding and organization configuration
 */
export default function WhiteLabelPage() {
  const [activeTab, setActiveTab] = useState<'branding' | 'domain' | 'colors' | 'custom'>('branding');
  const [config, setConfig] = useState<any>({
    organizationName: 'Your Organization',
    logoUrl: '',
    domain: '',
    colors: {
      primary: '#0066CC',
      secondary: '#4A90E2',
      accent: '#FF6B6B',
    },
  });
  const [saving, setSaving] = useState(false);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch('/api/max/whitelabel/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">White-Label Configuration</h1>
        <p className="text-gray-600">Customize your organization branding</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'branding', label: 'Branding' },
          { id: 'domain', label: 'Custom Domain' },
          { id: 'colors', label: 'Colors' },
          { id: 'custom', label: 'Custom Pages' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Organization Name</label>
                <Input
                  value={config.organizationName}
                  onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
                  placeholder="Your Organization"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Logo URL</label>
                <Input
                  value={config.logoUrl}
                  onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            {config.logoUrl && (
              <div>
                <label className="block text-sm font-semibold mb-2">Logo Preview</label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <img src={config.logoUrl} alt="Logo" className="h-16 object-contain" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Support Email</label>
                <Input type="email" placeholder="support@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Support Phone</label>
                <Input type="tel" placeholder="+1 (555) 123-4567" />
              </div>
            </div>

            <Button onClick={saveConfig} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Branding'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Domain Tab */}
      {activeTab === 'domain' && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Domain Setup</CardTitle>
            <CardDescription>Configure your custom domain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Domain Name</label>
              <Input
                value={config.domain}
                onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                placeholder="security.yourcompany.com"
              />
            </div>

            {config.domain && (
              <div>
                <label className="block text-sm font-semibold mb-3">DNS Records</label>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs">
                    <p className="font-semibold mb-2">CNAME Record:</p>
                    <p>Name: {config.domain}</p>
                    <p>Type: CNAME</p>
                    <p>Value: app.blockstop.io</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs">
                    <p className="font-semibold mb-2">TXT Record (Verification):</p>
                    <p>Name: _blockstop.{config.domain}</p>
                    <p>Type: TXT</p>
                    <p>Value: blockstop-verification=your-org-id</p>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={saveConfig} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Domain'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <Card>
          <CardHeader>
            <CardTitle>Color Scheme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['primary', 'secondary', 'accent'].map((colorKey) => (
                <div key={colorKey}>
                  <label className="block text-sm font-semibold mb-2 capitalize">{colorKey} Color</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.colors[colorKey]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          colors: { ...config.colors, [colorKey]: e.target.value },
                        })
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.colors[colorKey]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          colors: { ...config.colors, [colorKey]: e.target.value },
                        })
                      }
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Color Preview</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div
                    className="h-20 rounded-lg mb-2"
                    style={{ backgroundColor: config.colors.primary }}
                  />
                  <p className="text-xs font-semibold">Primary</p>
                </div>
                <div>
                  <div
                    className="h-20 rounded-lg mb-2"
                    style={{ backgroundColor: config.colors.secondary }}
                  />
                  <p className="text-xs font-semibold">Secondary</p>
                </div>
                <div>
                  <div
                    className="h-20 rounded-lg mb-2"
                    style={{ backgroundColor: config.colors.accent }}
                  />
                  <p className="text-xs font-semibold">Accent</p>
                </div>
              </div>
            </div>

            <Button onClick={saveConfig} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Colors'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom Pages Tab */}
      {activeTab === 'custom' && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Pages</CardTitle>
            <CardDescription>Create custom pages for your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Privacy Policy', 'Terms of Service', 'Help Documentation', 'About Us'].map(
                (page) => (
                  <div key={page} className="p-4 border rounded-lg hover:bg-gray-50">
                    <h3 className="font-semibold mb-2">{page}</h3>
                    <p className="text-sm text-gray-600 mb-3">Customize {page.toLowerCase()}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      Edit
                    </Button>
                  </div>
                )
              )}
            </div>

            <Button className="w-full">Add Custom Page</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
