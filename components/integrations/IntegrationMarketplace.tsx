'use client';

import React, { useState, useMemo } from 'react';
import { Integration } from '@/types/integrations';
import { useIntegrations } from './hooks/useIntegrations';

interface IntegrationMarketplaceProps {
  onSelectIntegration?: (integration: Integration) => void;
}

export function IntegrationMarketplace({ onSelectIntegration }: IntegrationMarketplaceProps) {
  const { integrations, installedIntegrations, loading, error } = useIntegrations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(integrations.map(i => i.category));
    return ['all', ...Array.from(cats).sort()];
  }, [integrations]);

  // Filter integrations
  const filteredIntegrations = useMemo(() => {
    return integrations.filter(integration => {
      const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [integrations, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-light-surface text-gray-700 hover:bg-light-border'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Found {filteredIntegrations.length} integration{filteredIntegrations.length !== 1 ? 's' : ''}
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map(integration => {
          const isInstalled = installedIntegrations.some(i => i.id === integration.id);

          return (
            <div
              key={integration.id}
              className="bg-white border border-light-border rounded-lg p-6 hover:shadow-lg transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{integration.icon}</div>
                {isInstalled && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                    Installed
                  </span>
                )}
              </div>

              {/* Title and Description */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">{integration.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

              {/* Metadata */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium">{integration.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Author</span>
                  <span className="font-medium">{integration.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{integration.rating.toFixed(1)}</span>
                  <span className="text-gray-600">({integration.reviews} reviews)</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectIntegration?.(integration)}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  isInstalled
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {isInstalled ? 'View Details' : 'Install Integration'}
              </button>
            </div>
          );
        })}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-2">No integrations found</p>
          <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
