'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Input } from '@/components';
import { a11y } from '@/lib/a11y';

interface VPNProvider {
  id: string;
  name: string;
  country: string;
  flag: string;
  servers: number;
  speed: 'fast' | 'medium' | 'slow';
  encryption: string;
  tier: 'free' | 'pro' | 'max';
  enabled: boolean;
  latency?: number;
}

export default function VPNSelectorPage() {
  const [vpns, setVpns] = useState<VPNProvider[]>([
    {
      id: '1',
      name: 'ProtonVPN',
      country: 'Switzerland',
      flag: '🇨🇭',
      servers: 3000,
      speed: 'fast',
      encryption: 'AES-256',
      tier: 'pro',
      enabled: true,
      latency: 45,
    },
    {
      id: '2',
      name: 'Windscribe',
      country: 'Canada',
      flag: '🇨🇦',
      servers: 110,
      speed: 'fast',
      encryption: 'AES-256',
      tier: 'free',
      enabled: false,
      latency: 52,
    },
    {
      id: '3',
      name: 'TunnelBear',
      country: 'Canada',
      flag: '🇨🇦',
      servers: 23,
      speed: 'medium',
      encryption: 'AES-256',
      tier: 'free',
      enabled: false,
      latency: 58,
    },
    {
      id: '4',
      name: 'Hide.me',
      country: 'Malaysia',
      flag: '🇲🇾',
      servers: 1800,
      speed: 'fast',
      encryption: 'AES-256',
      tier: 'pro',
      enabled: false,
      latency: 48,
    },
    {
      id: '5',
      name: 'Hotspot Shield',
      country: 'USA',
      flag: '🇺🇸',
      servers: 3200,
      speed: 'fast',
      encryption: 'AES-256',
      tier: 'free',
      enabled: false,
      latency: 35,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | 'free' | 'pro' | 'max'>('all');

  const filtered = vpns.filter(vpn => {
    const matchesSearch = vpn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vpn.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'all' || vpn.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const handleToggleVPN = async (id: string) => {
    setVpns(vpns.map(vpn =>
      vpn.id === id ? { ...vpn, enabled: !vpn.enabled } : vpn
    ));
  };

  const getSpeedBadge = (speed: string) => {
    const badges: Record<string, string> = {
      fast: '⚡ Fast',
      medium: '⏱️ Medium',
      slow: '🐢 Slow'
    };
    return badges[speed];
  };

  const getSpeedColor = (speed: string) => {
    const colors: Record<string, string> = {
      fast: 'success',
      medium: 'warning',
      slow: 'danger'
    };
    return colors[speed];
  };

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-0" id="main-content">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="absolute top-0 left-0 p-2 bg-primary-600 text-white rounded-b-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 -translate-y-full focus:translate-y-0 transition-transform"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded font-medium"
              aria-label="Back to dashboard"
            >
              ← Back
            </Link>
            <h1 className="text-h3 font-bold text-neutral-900">
              <span aria-hidden="true">🌐</span> VPN Selector
            </h1>
          </div>
          <p className="text-sm text-neutral-600">Choose your preferred VPN provider for secure browsing</p>
        </div>
      </header>

      <div className="container-max py-8">
        {/* Info Banner */}
        <Card padding="lg" className="border-primary-200 bg-primary-50 mb-8">
          <p className="text-sm text-neutral-900">
            <strong>Free tier:</strong> 5 VPNs available • <strong>PRO/MAX:</strong> 100+ servers worldwide
          </p>
        </Card>

        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <Input
            type="search"
            placeholder="Search by VPN name or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search VPN providers by name or country"
          />

          {/* Tier Filters */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="VPN tier filters">
            {(['all', 'free', 'pro', 'max'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 ${
                  selectedTier === tier
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                }`}
                role="tab"
                aria-selected={selectedTier === tier}
                aria-label={`${tier.toUpperCase()} tier VPNs`}
              >
                {tier === 'all' ? <><span aria-hidden="true">🔗</span> All</> : tier === 'free' ? <><span aria-hidden="true">🆓</span> Free</> : tier === 'pro' ? <><span aria-hidden="true">⭐</span> PRO</> : <><span aria-hidden="true">✨</span> MAX</>}
              </button>
            ))}
          </div>
        </div>

        {/* VPN Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {filtered.map((vpn) => (
              <Card
                key={vpn.id}
                padding="lg"
                className={`flex flex-col transition ${
                  vpn.enabled ? 'border-primary-300 bg-primary-50' : 'border-neutral-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{vpn.flag}</span>
                    <div>
                      <h3 className="text-h5 font-bold text-neutral-900">{vpn.name}</h3>
                      <p className="text-sm text-neutral-600">{vpn.country}</p>
                    </div>
                  </div>
                  <Badge variant={vpn.enabled ? 'success' : 'info'}>
                    {vpn.enabled ? '✓ Enabled' : '○ Disabled'}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6 pb-4 border-b border-neutral-200">
                  <div>
                    <p className="text-xs text-neutral-600">Servers</p>
                    <p className="text-h6 font-bold text-neutral-900">{vpn.servers}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Speed</p>
                    <p className="text-xs font-medium text-neutral-900">{getSpeedBadge(vpn.speed)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Latency</p>
                    <p className="text-h6 font-bold text-neutral-900">{vpn.latency}ms</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-600">Encryption</span>
                    <span className="text-xs font-medium text-neutral-900">🔐 {vpn.encryption}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-600">Tier</span>
                    <Badge variant={vpn.tier === 'free' ? 'info' : vpn.tier === 'pro' ? 'primary' : 'accent'}>
                      {vpn.tier.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  variant={vpn.enabled ? 'secondary' : 'primary'}
                  className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
                  onClick={() => {
                    handleToggleVPN(vpn.id);
                    a11y.announce(`${vpn.name} VPN ${vpn.enabled ? 'disabled' : 'enabled'}`);
                  }}
                  disabled={loading}
                  aria-pressed={vpn.enabled}
                  aria-label={`${vpn.enabled ? 'Disable' : 'Enable'} ${vpn.name} VPN`}
                >
                  {vpn.enabled ? <><span aria-hidden="true">✓</span> Enabled</> : <><span aria-hidden="true">⚙️</span> Enable</>}
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-neutral-600 mb-2">No VPNs found</p>
            <p className="text-sm text-neutral-500">Try adjusting your search or tier filter</p>
          </div>
        )}

        {/* Recommendation Banner */}
        <section className="mt-12 border-accent-200 bg-accent-50 rounded-lg p-6" aria-label="VPN setup recommendations">
          <h3 className="font-semibold text-neutral-900 mb-2">
            <span aria-hidden="true">⚡</span> Recommended Setup
          </h3>
          <p className="text-sm text-neutral-700 mb-4">
            For optimal security and performance, enable multiple VPNs and rotate between them.
          </p>
          <div className="text-xs text-neutral-600" aria-live="polite">
            <strong>Currently enabled:</strong> {vpns.filter(v => v.enabled).length} VPN(s)
          </div>
        </section>
      </div>
    </main>
  );
}
