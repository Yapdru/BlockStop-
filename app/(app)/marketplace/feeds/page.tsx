'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge, Input } from '@/components';

interface ThreatFeed {
  id: string;
  name: string;
  description: string;
  threatCount: number;
  ratingScore: number;
  downloadCount: number;
  subscriptionPrice: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  featured: boolean;
  category: string;
  threatTypes: string[];
  updateFrequency: string;
}

export default function MarketplaceFeedsPage() {
  const [feeds, setFeeds] = useState<ThreatFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '12',
          ...(selectedCategory && { category: selectedCategory }),
          ...(searchQuery && { search: searchQuery }),
        });

        const response = await fetch(`/api/marketplace/feeds?${params}`);
        const data = await response.json();

        if (data.success) {
          setFeeds(data.data.feeds);
          setTotalPages(data.data.pagination.pages);
        }
      } catch (error) {
        console.error('Failed to fetch feeds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeds();
  }, [page, selectedCategory, searchQuery]);

  const handleSubscribe = async (feedId: string) => {
    try {
      const userId = localStorage.getItem('userId') || 'user-123';
      const response = await fetch(`/api/marketplace/feeds/${feedId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriberId: userId }),
      });

      if (response.ok) {
        alert('Successfully subscribed to feed');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Community Threat Feeds</h1>
          <p className="text-lg text-slate-600">
            Subscribe to curated threat intelligence feeds from our community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Search feeds..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full"
            />
          </div>

          <div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value || null);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
            >
              <option value="">All Categories</option>
              <option value="ransomware">Ransomware</option>
              <option value="phishing">Phishing</option>
              <option value="malware">Malware</option>
              <option value="apt">APT</option>
              <option value="iocs">IOCs</option>
            </select>
          </div>

          <Button
            onClick={() => {
              // Navigate to create feed
              window.location.href = '/marketplace/create-feed';
            }}
            className="w-full"
          >
            Submit Feed
          </Button>
        </div>

        {/* Featured Feeds */}
        {feeds.filter(f => f.featured).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Featured Feeds</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeds
                .filter(f => f.featured)
                .slice(0, 3)
                .map((feed) => (
                  <FeedCard key={feed.id} feed={feed} onSubscribe={handleSubscribe} />
                ))}
            </div>
          </div>
        )}

        {/* All Feeds */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">All Feeds</h2>
          {loading ? (
            <div className="text-center text-slate-600">Loading feeds...</div>
          ) : feeds.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {feeds.map((feed) => (
                  <FeedCard key={feed.id} feed={feed} onSubscribe={handleSubscribe} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-slate-600 py-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-slate-600">No feeds found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedCard({
  feed,
  onSubscribe,
}: {
  feed: ThreatFeed;
  onSubscribe: (feedId: string) => void;
}) {
  return (
    <Card padding="lg" className="border border-slate-200 hover:border-blue-300 transition">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{feed.name}</h3>
        <p className="text-sm text-slate-600">{feed.description}</p>
      </div>

      <div className="mb-4">
        {feed.threatTypes.slice(0, 3).map((type) => (
          <Badge key={type} variant="secondary" className="mr-2 mb-2">
            {type}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="text-slate-600">
          <p className="font-semibold text-slate-900">{feed.threatCount}</p>
          <p className="text-xs">Threats</p>
        </div>
        <div className="text-slate-600">
          <p className="font-semibold text-slate-900">{feed.downloadCount}</p>
          <p className="text-xs">Subscriptions</p>
        </div>
        <div className="text-slate-600">
          <p className="font-semibold text-slate-900">{feed.ratingScore.toFixed(1)}/5</p>
          <p className="text-xs">Rating</p>
        </div>
        <div className="text-slate-600">
          <p className="font-semibold text-slate-900">${feed.subscriptionPrice}/mo</p>
          <p className="text-xs">Price</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-600">
          Updated {feed.updateFrequency} • Status:{' '}
          <Badge
            variant={
              feed.verificationStatus === 'verified'
                ? 'success'
                : feed.verificationStatus === 'pending'
                ? 'warning'
                : 'danger'
            }
          >
            {feed.verificationStatus}
          </Badge>
        </p>
      </div>

      <Button
        onClick={() => onSubscribe(feed.id)}
        className="w-full"
        variant={feed.verificationStatus === 'verified' ? 'primary' : 'outline'}
      >
        {feed.subscriptionPrice === 0 ? 'Subscribe Free' : 'Subscribe'}
      </Button>
    </Card>
  );
}
