/**
 * BlockStop Phase 30.8 - Community Forum Page
 * Discussion threads, voting, expert tagging, and community engagement
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';

interface ForumThread {
  id: string;
  title: string;
  category: string;
  author: string;
  views: number;
  replies: number;
  votes: number;
  isSolved: boolean;
  lastActivity: Date;
  tags: string[];
  pinned: boolean;
}

interface ForumPost {
  id: string;
  threadId: string;
  author: string;
  content: string;
  votes: number;
  createdAt: Date;
  isAnswer: boolean;
  authorReputation: number;
}

export default function CommunityPage() {
  const [tab, setTab] = useState<'overview' | 'forum' | 'discussions' | 'experts'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<ForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'general', name: 'General Discussion', icon: '💬', count: 1250 },
    { id: 'threats', name: 'Threats & Incidents', icon: '⚠️', count: 890 },
    { id: 'security', name: 'Security Questions', icon: '🔐', count: 2340 },
    { id: 'compliance', name: 'Compliance & Governance', icon: '📋', count: 560 },
    { id: 'features', name: 'Feature Requests', icon: '💡', count: 345 },
    { id: 'integrations', name: 'Integrations & APIs', icon: '🔌', count: 780 },
    { id: 'practices', name: 'Best Practices', icon: '⭐', count: 1560 },
    { id: 'cases', name: 'Case Studies', icon: '📊', count: 230 },
  ];

  useEffect(() => {
    // Simulate loading threads
    setTimeout(() => {
      const mockThreads: ForumThread[] = [
        {
          id: 'thread-1',
          title: 'Best practices for detecting ransomware in cloud environments',
          category: 'security',
          author: 'Sarah Chen',
          views: 4230,
          replies: 23,
          votes: 156,
          isSolved: true,
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          tags: ['ransomware', 'cloud', 'detection'],
          pinned: true,
        },
        {
          id: 'thread-2',
          title: 'GDPR compliance checklist for security teams',
          category: 'compliance',
          author: 'Mike Johnson',
          views: 3120,
          replies: 18,
          votes: 89,
          isSolved: false,
          lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000),
          tags: ['gdpr', 'compliance', 'checklist'],
          pinned: false,
        },
        {
          id: 'thread-3',
          title: 'Integration with Slack for alerts',
          category: 'integrations',
          author: 'Alex Kumar',
          views: 2890,
          replies: 14,
          votes: 67,
          isSolved: true,
          lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          tags: ['slack', 'integration', 'alerts'],
          pinned: false,
        },
        {
          id: 'thread-4',
          title: 'How to set up Zero Trust Architecture',
          category: 'practices',
          author: 'Emma White',
          views: 5670,
          replies: 31,
          votes: 234,
          isSolved: false,
          lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000),
          tags: ['zero-trust', 'architecture', 'security'],
          pinned: true,
        },
        {
          id: 'thread-5',
          title: 'Real-world malware analysis walkthrough',
          category: 'threats',
          author: 'David Lee',
          views: 3450,
          replies: 21,
          votes: 145,
          isSolved: false,
          lastActivity: new Date(Date.now() - 12 * 60 * 60 * 1000),
          tags: ['malware', 'analysis', 'reverse-engineering'],
          pinned: false,
        },
        {
          id: 'thread-6',
          title: 'Incident response for data breaches',
          category: 'security',
          author: 'Lisa Anderson',
          views: 4120,
          replies: 28,
          votes: 198,
          isSolved: true,
          lastActivity: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          tags: ['incident-response', 'data-breach', 'response'],
          pinned: false,
        },
      ];

      const mockPosts: ForumPost[] = [
        {
          id: 'post-1',
          threadId: 'thread-1',
          author: 'Sarah Chen',
          content: 'Looking for best practices on ransomware detection in cloud...',
          votes: 156,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isAnswer: false,
          authorReputation: 8500,
        },
        {
          id: 'post-2',
          threadId: 'thread-1',
          author: 'John Smith',
          content: 'Great question! Here are the key indicators to monitor...',
          votes: 89,
          createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
          isAnswer: true,
          authorReputation: 6200,
        },
      ];

      setThreads(mockThreads);
      setFilteredThreads(mockThreads);
      setPosts(mockPosts);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    // Filter threads
    let filtered = threads;

    if (searchQuery) {
      filtered = filtered.filter(
        t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             t.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Sort by pinned first, then by last activity
    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });

    setFilteredThreads(filtered);
  }, [searchQuery, selectedCategory, threads]);

  const getReputationBadge = (reputation: number) => {
    if (reputation >= 10000) return '⭐ Expert';
    if (reputation >= 5000) return '🏆 Advanced';
    if (reputation >= 1000) return '✓ Active';
    return '👤 Member';
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'General';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Community Forum</h1>
        <p className="text-xl text-gray-600">Join discussions, share knowledge, and connect with security professionals</p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-sm text-gray-600">Total Discussions</div>
            <div className="text-3xl font-bold">{threads.length}</div>
            <div className="text-xs text-blue-600 mt-2">Active threads</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Total Posts</div>
            <div className="text-3xl font-bold">{posts.length + 342}</div>
            <div className="text-xs text-green-600 mt-2">Community posts</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Expert Members</div>
            <div className="text-3xl font-bold">128</div>
            <div className="text-xs text-purple-600 mt-2">Verified experts</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600">Active Users</div>
            <div className="text-3xl font-bold">3.2K</div>
            <div className="text-xs text-orange-600 mt-2">This month</div>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b overflow-x-auto">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('forum')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'forum' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Forum
        </button>
        <button
          onClick={() => setTab('discussions')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'discussions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          My Discussions
        </button>
        <button
          onClick={() => setTab('experts')}
          className={`px-4 py-2 font-medium border-b-2 whitespace-nowrap ${
            tab === 'experts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
          }`}
        >
          Expert Members
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Featured Categories */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Popular Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map(cat => (
                <Card
                  key={cat.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setTab('forum');
                  }}
                >
                  <div className="text-4xl mb-3">{cat.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{cat.name}</h3>
                  <p className="text-sm text-gray-600">{cat.count} discussions</p>
                  <button className="mt-4 w-full text-blue-600 font-medium hover:underline">
                    Browse →
                  </button>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Discussions */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Recent Discussions</h2>
            <div className="space-y-3">
              {threads.slice(0, 3).map(thread => (
                <Card
                  key={thread.id}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedThread(thread);
                    setTab('forum');
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{thread.title}</h3>
                      <p className="text-sm text-gray-600">by {thread.author}</p>
                    </div>
                    <div className="flex gap-2">
                      {thread.pinned && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">📌 Pinned</span>}
                      {thread.isSolved && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">✓ Solved</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {thread.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>👁️ {thread.views} views</span>
                    <span>💬 {thread.replies} replies</span>
                    <span>👍 {thread.votes} votes</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h2 className="text-2xl font-bold mb-4">Join the Conversation</h2>
            <p className="mb-6 text-blue-100">Share your knowledge, ask questions, and connect with thousands of security professionals.</p>
            <button className="w-full bg-white text-blue-600 py-3 rounded-lg font-bold hover:bg-gray-50">
              Start a New Discussion
            </button>
          </Card>
        </div>
      )}

      {tab === 'forum' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Thread List */}
          <div className="space-y-3">
            {filteredThreads.map(thread => (
              <Card
                key={thread.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedThread(thread)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{thread.title}</h3>
                      {thread.pinned && <span className="text-yellow-500">📌</span>}
                      {thread.isSolved && <span className="text-green-600">✓</span>}
                    </div>
                    <p className="text-sm text-gray-600">by <strong>{thread.author}</strong> in <strong>{getCategoryName(thread.category)}</strong></p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {thread.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-6 text-sm text-gray-600">
                    <span>👁️ {thread.views}</span>
                    <span>💬 {thread.replies}</span>
                    <span>👍 {thread.votes}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.ceil((Date.now() - thread.lastActivity.getTime()) / (1000 * 60))} mins ago
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {filteredThreads.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No discussions found in this category.</p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
                Start New Discussion
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'discussions' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Recent Discussions</h2>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't created any discussions yet.</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
              Create Your First Discussion
            </button>
          </div>
        </div>
      )}

      {tab === 'experts' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Expert Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Sarah Chen', reputation: 8500, expertise: ['Ransomware', 'Cloud Security', 'Detection'] },
              { name: 'John Smith', reputation: 7200, expertise: ['Malware Analysis', 'Reverse Engineering'] },
              { name: 'Emma White', reputation: 9100, expertise: ['Zero Trust', 'Architecture', 'Compliance'] },
              { name: 'Mike Johnson', reputation: 6800, expertise: ['GDPR', 'Data Protection', 'Governance'] },
              { name: 'Alex Kumar', reputation: 5900, expertise: ['Slack Integration', 'APIs', 'Automation'] },
              { name: 'Lisa Anderson', reputation: 8700, expertise: ['Incident Response', 'SOAR', 'Playbooks'] },
            ].map((expert, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-all">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    {expert.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-lg">{expert.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{getReputationBadge(expert.reputation)}</p>
                  <div className="flex flex-wrap gap-1 justify-center mb-4">
                    {expert.expertise.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <button className="w-full border border-blue-600 text-blue-600 py-2 rounded font-medium hover:bg-blue-50">
                    Message
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
