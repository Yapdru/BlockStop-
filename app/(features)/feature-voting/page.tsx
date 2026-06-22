'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components';
import { a11y } from '@/lib/a11y';
import {
  getAllProposals,
  getTrendingProposals,
  searchProposals,
  getVotingLeaderboard,
  voteOnProposal,
  proposeFeature,
} from '@/lib/community/feature-voting';
import type { FeatureProposal, VotingLeaderboardEntry } from '@/types/community';

export default function FeatureVotingPage() {
  const [proposals, setProposals] = useState<FeatureProposal[]>([]);
  const [leaderboard, setLeaderboard] = useState<VotingLeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<'votes' | 'recent' | 'trending'>('votes');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ui-ux' as const,
  });

  // Load initial data
  useEffect(() => {
    loadProposals();
    loadLeaderboard();
    a11y.announce('Feature voting page loaded', 'polite');
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      let results;
      if (searchQuery) {
        results = await searchProposals(searchQuery);
      } else if (sortBy === 'trending') {
        results = await getTrendingProposals();
      } else {
        results = await getAllProposals();
      }

      if (filterCategory !== 'all') {
        results = results.filter(
          (p) => p.category === (filterCategory as FeatureProposal['category'])
        );
      }

      setProposals(results);
    } catch (error) {
      console.error('Error loading proposals:', error);
      a11y.announce('Error loading proposals', 'alert');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await getVotingLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleVote = async (proposalId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const userId = 'current-user-id'; // In real app, get from auth
      await voteOnProposal(proposalId, userId, voteType);
      await loadProposals();
      a11y.announce(`Vote recorded on proposal`, 'polite');
    } catch (error) {
      console.error('Error voting:', error);
      a11y.announce('Error recording vote', 'alert');
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = 'current-user-id'; // In real app, get from auth
      await proposeFeature(
        formData.title,
        formData.description,
        formData.category,
        userId
      );
      setShowProposalForm(false);
      setFormData({ title: '', description: '', category: 'ui-ux' });
      await loadProposals();
      a11y.announce('Feature proposal submitted successfully', 'polite');
    } catch (error) {
      console.error('Error submitting proposal:', error);
      a11y.announce('Error submitting proposal', 'alert');
    }
  };

  const categories: FeatureProposal['category'][] = [
    'security',
    'performance',
    'ui-ux',
    'integration',
    'analytics',
    'compliance',
  ];

  const getStatusColor = (status: FeatureProposal['status']) => {
    const colorMap: Record<FeatureProposal['status'], string> = {
      'proposed': 'bg-blue-100 text-blue-800',
      'under-review': 'bg-yellow-100 text-yellow-800',
      'planned': 'bg-purple-100 text-purple-800',
      'in-progress': 'bg-cyan-100 text-cyan-800',
      'completed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getImpactLevelBadge = (level: string) => {
    const badges: Record<string, { emoji: string; color: string }> = {
      'bronze': { emoji: '🥉', color: 'bg-amber-100' },
      'silver': { emoji: '🥈', color: 'bg-slate-100' },
      'gold': { emoji: '🥇', color: 'bg-yellow-100' },
      'platinum': { emoji: '💎', color: 'bg-purple-100' },
    };
    return badges[level] || { emoji: '📊', color: 'bg-gray-100' };
  };

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="text-primary-600 hover:text-primary-700 font-medium"
              aria-label="Back to dashboard"
            >
              ← Back
            </Link>
            <h1 className="text-3xl font-bold text-neutral-900">
              <span aria-hidden="true">🗳️</span> Feature Voting
            </h1>
          </div>
          <p className="text-neutral-600">
            Help shape the future of BlockStop by voting on feature proposals
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* New Proposal Button */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowProposalForm(!showProposalForm)}
                className="flex-1"
                variant="primary"
              >
                + Propose New Feature
              </Button>
            </div>

            {/* Proposal Form */}
            {showProposalForm && (
              <Card padding="lg" className="border-2 border-primary-300">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">
                  Propose a New Feature
                </h2>
                <form onSubmit={handleSubmitProposal} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Brief title of your feature"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Description
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Describe the feature and why it would be valuable"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as FeatureProposal['category'],
                        })
                      }
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" variant="primary" className="flex-1">
                      Submit Proposal
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowProposalForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Filters */}
            <Card padding="lg">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyUp={loadProposals}
                    placeholder="Search proposals..."
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as typeof sortBy);
                    loadProposals();
                  }}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="votes">Most Voted</option>
                  <option value="recent">Most Recent</option>
                  <option value="trending">Trending</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    loadProposals();
                  }}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Proposals List */}
            {loading ? (
              <Card padding="lg" className="text-center text-neutral-600">
                Loading proposals...
              </Card>
            ) : proposals.length === 0 ? (
              <Card padding="lg" className="text-center text-neutral-600">
                <p className="mb-4">No proposals found</p>
                <Button
                  onClick={() => setShowProposalForm(true)}
                  variant="primary"
                >
                  Be the first to propose!
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <Card
                    key={proposal.id}
                    padding="lg"
                    className="hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-neutral-900 mb-2">
                          {proposal.title}
                        </h3>
                        <p className="text-neutral-600 mb-3">{proposal.description}</p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="primary">{proposal.category}</Badge>
                          <Badge
                            className={getStatusColor(proposal.status)}
                            variant="secondary"
                          >
                            {proposal.status}
                          </Badge>
                          <Badge variant="secondary">
                            {proposal.estimatedComplexity}
                          </Badge>
                          {proposal.targetRelease && (
                            <Badge variant="secondary">
                              v{proposal.targetRelease}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vote Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="text-xs text-neutral-600 mb-1">Upvotes</p>
                        <p className="text-2xl font-bold text-green-600">
                          {proposal.upvotes}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 mb-1">Community Support</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {Math.round(proposal.communityVotePercentage || 0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 mb-1">Comments</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {proposal.comments.length}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleVote(proposal.id, 'upvote')}
                        variant="secondary"
                        className="flex-1"
                      >
                        👍 Upvote
                      </Button>
                      <Button
                        onClick={() => handleVote(proposal.id, 'downvote')}
                        variant="secondary"
                        className="flex-1"
                      >
                        👎 Downvote
                      </Button>
                      <Link
                        href={`/feature-voting/${proposal.id}`}
                        className="flex-1"
                      >
                        <Button variant="primary" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Leaderboard */}
          <div className="space-y-6">
            <Card padding="lg">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">
                Community Leaders
              </h2>

              {leaderboard.length === 0 ? (
                <p className="text-neutral-600 text-sm">
                  No voting activity yet
                </p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((entry) => {
                    const badge = getImpactLevelBadge(entry.impactLevel);
                    return (
                      <div
                        key={entry.userId}
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-primary-600">
                              #{entry.rank}
                            </span>
                            <div>
                              <p className="font-medium text-neutral-900">
                                {entry.userName}
                              </p>
                              <p className="text-xs text-neutral-600">
                                {entry.acceptedProposals} accepted
                              </p>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`${badge.color} px-3 py-1 rounded-full text-lg`}
                          title={entry.impactLevel}
                        >
                          {badge.emoji}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Stats Card */}
            <Card padding="lg">
              <h3 className="text-lg font-bold text-neutral-900 mb-3">
                Voting Stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Proposals:</span>
                  <span className="font-bold text-neutral-900">
                    {proposals.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Active Voters:</span>
                  <span className="font-bold text-neutral-900">
                    {leaderboard.length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
