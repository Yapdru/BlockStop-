'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge } from '@/components';

interface Integration {
  id: string;
  name: string;
  platform: string;
  description: string;
  icon: string;
  category: string;
  version: string;
  installCount: number;
  ratingScore: number;
  featured: boolean;
  oauthRequired: boolean;
  features: Record<string, boolean>;
  pricingTier: string;
  supportEmail: string;
  documentationUrl: string;
}

export default function MarketplaceIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const params = new URLSearchParams({
          ...(selectedCategory && { category: selectedCategory }),
          ...(selectedTier && { tier: selectedTier }),
        });

        const response = await fetch(`/api/marketplace/integrations?${params}`);
        const data = await response.json();

        if (data.success) {
          setIntegrations(data.data.integrations);
        }
      } catch (error) {
        console.error('Failed to fetch integrations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntegrations();
  }, [selectedCategory, selectedTier]);

  const handleInstall = async (integrationId: string) => {
    try {
      const userId = localStorage.getItem('userId') || 'user-123';
      const response = await fetch(`/api/marketplace/integrations/${integrationId}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, workspaceId: 'default' }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.authUrl) {
          // OAuth flow
          window.location.href = data.data.authUrl;
        } else {
          alert('Integration installed successfully!');
        }
      }
    } catch (error) {
      console.error('Failed to install integration:', error);
    }
  };

  const categories = ['communication', 'ticketing', 'monitoring', 'siem', 'incident_management'];
  const tiers = ['free', 'pro', 'max'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Integration Marketplace</h1>
          <p className="text-lg text-slate-600">
            Connect BlockStop with your favorite tools and platforms
          </p>
        </div>

        {/* Featured Integrations */}
        {integrations.filter(i => i.featured).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Popular Integrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {integrations
                .filter(i => i.featured)
                .slice(0, 4)
                .map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onInstall={handleInstall}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 border border-slate-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Category
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={selectedCategory === null}
                    onChange={() => setSelectedCategory(null)}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-600">All Categories</span>
                </label>
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-600 capitalize">{cat.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Pricing Tier
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tier"
                    value=""
                    checked={selectedTier === null}
                    onChange={() => setSelectedTier(null)}
                    className="mr-2"
                  />
                  <span className="text-sm text-slate-600">All Tiers</span>
                </label>
                {tiers.map((tier) => (
                  <label key={tier} className="flex items-center">
                    <input
                      type="radio"
                      name="tier"
                      value={tier}
                      checked={selectedTier === tier}
                      onChange={() => setSelectedTier(tier)}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-600 capitalize">{tier}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* All Integrations */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">All Integrations</h2>
          {loading ? (
            <div className="text-center text-slate-600">Loading integrations...</div>
          ) : integrations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onInstall={handleInstall}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-600">No integrations found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({
  integration,
  onInstall,
}: {
  integration: Integration;
  onInstall: (id: string) => void;
}) {
  return (
    <Card padding="lg" className="border border-slate-200 hover:border-blue-300 transition flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{integration.name}</h3>
          <p className="text-xs text-slate-600 mt-1">v{integration.version}</p>
        </div>
        <Badge variant="secondary">{integration.pricingTier.toUpperCase()}</Badge>
      </div>

      <p className="text-sm text-slate-600 mb-4">{integration.description}</p>

      <div className="mb-4 text-sm">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-900">{integration.installCount}</span> installations
        </p>
        <p className="text-slate-600">
          Rating: <span className="font-semibold text-slate-900">{integration.ratingScore}/5</span>
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(integration.features)
          .filter(([, enabled]) => enabled)
          .map(([feature]) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature.replace(/_/g, ' ')}
            </Badge>
          ))}
      </div>

      <div className="mt-auto space-y-2">
        <Button
          onClick={() => onInstall(integration.id)}
          className="w-full"
        >
          {integration.oauthRequired ? 'Connect' : 'Install'}
        </Button>
        <a
          href={integration.documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-blue-600 hover:text-blue-700"
        >
          Documentation
        </a>
      </div>
    </Card>
  );
}
