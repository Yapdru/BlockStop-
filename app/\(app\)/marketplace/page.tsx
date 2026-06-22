'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Star, Users, ShoppingCart, Search } from 'lucide-react';

interface MarketplaceApp {
  id: string;
  name: string;
  author: string;
  description: string;
  icon: string;
  rating: number;
  reviews: number;
  installs: number;
  category: string;
  price: 'free' | 'paid';
  version: string;
  installed?: boolean;
}

const mockApps: MarketplaceApp[] = [
  {
    id: '1',
    name: 'Slack Integration Pro',
    author: 'BlockStop Labs',
    description: 'Enhanced Slack integration with custom notifications and rich formatting',
    icon: '💬',
    rating: 4.8,
    reviews: 256,
    installs: 5400,
    category: 'Communication',
    price: 'free',
    version: '2.1.0',
    installed: true,
  },
  {
    id: '2',
    name: 'Email Reporter',
    author: 'Security Team',
    description: 'Automated email reporting with scheduling and distribution',
    icon: '📧',
    rating: 4.5,
    reviews: 128,
    installs: 2100,
    category: 'Reporting',
    price: 'free',
    version: '1.3.2',
  },
  {
    id: '3',
    name: 'Splunk Advanced Analytics',
    author: 'Data Labs',
    description: 'Advanced threat analytics with ML-powered insights',
    icon: '📊',
    rating: 4.9,
    reviews: 456,
    installs: 8900,
    category: 'Analytics',
    price: 'paid',
    version: '3.0.0',
  },
  {
    id: '4',
    name: 'SOAR Orchestration',
    author: 'Automation Pro',
    description: 'Security orchestration and automated response workflows',
    icon: '🤖',
    rating: 4.7,
    reviews: 234,
    installs: 4200,
    category: 'Automation',
    price: 'paid',
    version: '2.5.1',
  },
  {
    id: '5',
    name: 'GeoIP Enrichment',
    author: 'Threat Intel',
    description: 'Enrich threat data with geolocation and network information',
    icon: '🌍',
    rating: 4.6,
    reviews: 189,
    installs: 3100,
    category: 'Enrichment',
    price: 'free',
    version: '1.8.0',
  },
  {
    id: '6',
    name: 'Custom Dashboard Builder',
    author: 'UI Team',
    description: 'Create custom dashboards with drag-and-drop widgets',
    icon: '📐',
    rating: 4.4,
    reviews: 95,
    installs: 1800,
    category: 'Dashboards',
    price: 'free',
    version: '1.2.0',
  },
];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [installedApps, setInstalledApps] = useState(
    mockApps.filter((a) => a.installed).map((a) => a.id)
  );

  const categories = ['Communication', 'Reporting', 'Analytics', 'Automation', 'Enrichment', 'Dashboards'];

  const filteredApps = mockApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (id: string) => {
    if (installedApps.includes(id)) {
      setInstalledApps(installedApps.filter((aid) => aid !== id));
    } else {
      setInstalledApps([...installedApps, id]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">App Marketplace</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and install community apps to extend BlockStop functionality
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-2">
            {mockApps.length} Apps Available
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search apps by name, author, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            All Categories
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((app) => {
          const isInstalled = installedApps.includes(app.id);
          return (
            <Card key={app.id} className="overflow-hidden hover:shadow-lg transition-all">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-3xl">{app.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {app.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        by {app.author}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {app.price === 'paid' ? '$99' : 'Free'}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {app.description}
                </p>

                {/* Rating and Stats */}
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{app.rating}</span>
                    <span>({app.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    <span>{(app.installs / 1000).toFixed(1)}k installs</span>
                  </div>
                </div>

                {/* Version and Category */}
                <div className="flex justify-between items-center text-xs">
                  <Badge variant="secondary">{app.category}</Badge>
                  <span className="text-gray-600 dark:text-gray-400">v{app.version}</span>
                </div>

                {/* Install Button */}
                <Button
                  onClick={() => handleInstall(app.id)}
                  variant={isInstalled ? 'secondary' : 'default'}
                  className="w-full gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {isInstalled ? 'Uninstall' : 'Install'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredApps.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">No apps found matching your search</p>
        </Card>
      )}

      {/* Publishing Guide */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold mb-2">Interested in Publishing Your App?</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Become a BlockStop marketplace developer and earn revenue from your apps with our revenue sharing program
        </p>
        <Button variant="outline" className="gap-2">
          Learn More About Publishing
        </Button>
      </Card>
    </div>
  );
}
