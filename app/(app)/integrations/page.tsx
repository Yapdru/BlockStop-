'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Input } from '@/components';

interface Integration {
  name: string;
  category: string;
  auth: string;
  connected: boolean;
  icon?: string;
  description?: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await fetch('/api/integrations/enterprise', {
          headers: { 'x-user-id': userId || '' }
        });
        if (response.ok) {
          const data = await response.json();
          const mapped = data.availableConnectors.map((c: any) => ({
            ...c,
            connected: false
          }));
          setIntegrations(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch integrations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, []);

  const categories = ['all', ...new Set(integrations.map(i => i.category))];
  let filtered = selectedCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === selectedCategory);

  if (searchQuery) {
    filtered = filtered.filter(i =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const handleConnect = (name: string) => {
    alert(`Connect ${name} - Redirecting to authorization...`);
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      email: '📧',
      cloud: '☁️',
      communication: '💬',
      monitoring: '📊',
      workflow: '🔄',
      security: '🔒',
      all: '🔗'
    };
    return icons[category.toLowerCase()] || '🔗';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading integrations...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24 md:pb-0">
      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium">
              ← Back
            </Link>
            <h1 className="text-h3 font-bold text-neutral-900">🔗 Integrations</h1>
          </div>
          <p className="text-sm text-neutral-600">Connect your favorite tools and services</p>
        </div>
      </header>

      <div className="container-max py-8">
        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <Input
            type="search"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  selectedCategory === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
                }`}
              >
                {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Integration Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((integration) => (
              <Card
                key={integration.name}
                padding="lg"
                className={`flex flex-col transition ${
                  integration.connected
                    ? 'border-success/30 bg-success/5'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-h5 font-bold text-neutral-900">{integration.name}</h3>
                  <Badge variant={integration.connected ? 'success' : 'info'}>
                    {integration.connected ? '✓' : '○'} {integration.category}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-neutral-600 mb-4 flex-1">
                  {integration.description || `Connect your ${integration.name} account for enhanced security integration.`}
                </p>

                {/* Auth Method */}
                <div className="mb-6 pb-4 border-b border-neutral-200">
                  <p className="text-xs text-neutral-600 mb-1">Authentication</p>
                  <p className="text-sm font-medium text-neutral-900 capitalize">
                    {integration.auth === 'oauth' ? '🔑 OAuth 2.0' : '⚙️ ' + integration.auth}
                  </p>
                </div>

                {/* Action Button */}
                {integration.connected ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => alert(`Manage ${integration.name}`)}
                  >
                    ⚙️ Manage
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleConnect(integration.name)}
                  >
                    🔗 Connect
                  </Button>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-neutral-600 mb-2">No integrations found</p>
            <p className="text-sm text-neutral-500">Try adjusting your search or category filter</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h3 className="font-semibold text-neutral-900 mb-2">💡 Need more integrations?</h3>
          <p className="text-sm text-neutral-700 mb-4">
            We&apos;re constantly adding new integrations to BlockStop. Let us know which tools you&apos;d like to see integrated.
          </p>
          <Button variant="primary" size="sm">
            Request Integration
          </Button>
        </div>
      </div>
    </main>
  );
}
