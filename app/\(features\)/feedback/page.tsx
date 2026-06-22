'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components';
import { a11y } from '@/lib/a11y';
import {
  submitUserFeedback,
  getAllFeedback,
  getBugReports,
  getFeedbackStats,
  getTrendingTopics,
} from '@/lib/community/feedback';
import type { UserFeedback, BugReport, FeedbackTrend } from '@/types/community';

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<FeedbackTrend[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | UserFeedback['feedbackType']>(
    'all'
  );
  const [filterStatus, setFilterStatus] = useState<'all' | UserFeedback['status']>(
    'all'
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'improvement' as UserFeedback['feedbackType'],
    category: 'general',
    email: '',
  });

  useEffect(() => {
    loadFeedbackData();
    a11y.announce('Feedback page loaded', 'polite');
  }, []);

  const loadFeedbackData = async () => {
    setLoading(true);
    try {
      const [feedbackData, bugsData, statsData, topicsData] = await Promise.all([
        getAllFeedback(),
        getBugReports(),
        getFeedbackStats(),
        getTrendingTopics(),
      ]);

      let filteredFeedback = feedbackData;
      if (filterType !== 'all') {
        filteredFeedback = filteredFeedback.filter(
          (f) => f.feedbackType === filterType
        );
      }
      if (filterStatus !== 'all') {
        filteredFeedback = filteredFeedback.filter((f) => f.status === filterStatus);
      }

      setFeedbacks(filteredFeedback);
      setBugReports(bugsData);
      setStats(statsData);
      setTrendingTopics(topicsData);
    } catch (error) {
      console.error('Error loading feedback:', error);
      a11y.announce('Error loading feedback data', 'alert');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.email) {
      a11y.announce('Please fill in all required fields', 'alert');
      return;
    }

    setSubmitting(true);
    try {
      const userId = 'current-user-id'; // In real app, get from auth
      await submitUserFeedback(
        userId,
        formData.email,
        formData.type,
        formData.title,
        formData.description,
        formData.category
      );

      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'improvement',
        category: 'general',
        email: '',
      });

      await loadFeedbackData();
      a11y.announce('Feedback submitted successfully. Thank you!', 'polite');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      a11y.announce('Error submitting feedback', 'alert');
    } finally {
      setSubmitting(false);
    }
  };

  const getSentimentColor = (sentiment: UserFeedback['sentiment']) => {
    const colors: Record<UserFeedback['sentiment'], string> = {
      'very-positive': 'bg-green-100 text-green-800',
      'positive': 'bg-lime-100 text-lime-800',
      'neutral': 'bg-gray-100 text-gray-800',
      'negative': 'bg-orange-100 text-orange-800',
      'very-negative': 'bg-red-100 text-red-800',
    };
    return colors[sentiment] || 'bg-gray-100 text-gray-800';
  };

  const getSentimentEmoji = (sentiment: UserFeedback['sentiment']) => {
    const emojis: Record<UserFeedback['sentiment'], string> = {
      'very-positive': '😍',
      'positive': '😊',
      'neutral': '😐',
      'negative': '😕',
      'very-negative': '😞',
    };
    return emojis[sentiment] || '😐';
  };

  const getStatusColor = (status: UserFeedback['status']) => {
    const colors: Record<UserFeedback['status'], string> = {
      'open': 'bg-blue-100 text-blue-800',
      'acknowledged': 'bg-cyan-100 text-cyan-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800',
      'wont-fix': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
              <span aria-hidden="true">💬</span> User Feedback
            </h1>
          </div>
          <p className="text-neutral-600">
            Help us improve BlockStop by sharing your thoughts and suggestions
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Submit Feedback Button */}
            <div>
              <Button
                onClick={() => setShowForm(!showForm)}
                className="w-full sm:w-auto"
                variant="primary"
              >
                + Submit Feedback
              </Button>
            </div>

            {/* Feedback Form */}
            {showForm && (
              <Card padding="lg" className="border-2 border-primary-300">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">
                  Share Your Feedback
                </h2>
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Feedback Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as UserFeedback['feedbackType'],
                          })
                        }
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="feature-request">Feature Request</option>
                        <option value="bug-report">Bug Report</option>
                        <option value="improvement">Improvement</option>
                        <option value="complaint">Complaint</option>
                        <option value="praise">Praise</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="general">General</option>
                        <option value="performance">Performance</option>
                        <option value="security">Security</option>
                        <option value="ui-ux">UI/UX</option>
                        <option value="documentation">Documentation</option>
                        <option value="support">Support</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Brief title of your feedback"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={5}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Tell us what you think. Include as much detail as possible."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowForm(false)}
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
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as typeof filterType);
                    loadFeedbackData();
                  }}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  <option value="feature-request">Feature Requests</option>
                  <option value="bug-report">Bug Reports</option>
                  <option value="improvement">Improvements</option>
                  <option value="praise">Praise</option>
                  <option value="complaint">Complaints</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as typeof filterStatus);
                    loadFeedbackData();
                  }}
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </Card>

            {/* Feedback List */}
            {loading ? (
              <Card padding="lg" className="text-center text-neutral-600">
                Loading feedback...
              </Card>
            ) : feedbacks.length === 0 ? (
              <Card padding="lg" className="text-center text-neutral-600">
                <p className="mb-4">No feedback found</p>
                <Button onClick={() => setShowForm(true)} variant="primary">
                  Be the first to submit feedback!
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <Card
                    key={feedback.id}
                    padding="lg"
                    className="hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-neutral-900 mb-2">
                          {feedback.title}
                        </h3>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge
                            className={getSentimentColor(feedback.sentiment)}
                            variant="secondary"
                          >
                            <span className="mr-1">
                              {getSentimentEmoji(feedback.sentiment)}
                            </span>
                            {feedback.sentiment}
                          </Badge>
                          <Badge
                            className={getStatusColor(feedback.status)}
                            variant="secondary"
                          >
                            {feedback.status}
                          </Badge>
                          <Badge variant="secondary">{feedback.feedbackType}</Badge>
                          <Badge variant="secondary">{feedback.category}</Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-neutral-600 mb-4 line-clamp-3">
                      {feedback.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg mb-4">
                      <div>
                        <p className="text-xs text-neutral-600 mb-1">Community Upvotes</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {feedback.upvotes}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 mb-1">Responses</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {feedback.responses?.length || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1">
                        👍 Upvote ({feedback.upvotes})
                      </Button>
                      <Link href={`/feedback/${feedback.id}`} className="flex-1">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            {stats && (
              <Card padding="lg">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">
                  Feedback Stats
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Total Feedback</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {stats.totalFeedback}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Open Feedback</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.openFeedback}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Resolution Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(stats.resolutionRate)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Avg Sentiment</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {(stats.averageSentiment * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Trending Topics */}
            {trendingTopics.length > 0 && (
              <Card padding="lg">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">
                  Trending Topics
                </h3>
                <div className="space-y-3">
                  {trendingTopics.slice(0, 8).map((topic, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <p className="font-medium text-neutral-900 text-sm mb-1">
                        {topic.topic}
                      </p>
                      <div className="flex justify-between items-center text-xs text-neutral-600">
                        <span>{topic.mentionCount} mentions</span>
                        <span
                          className={getSentimentColor(
                            topic.sentiment as UserFeedback['sentiment']
                          )}
                        >
                          {topic.sentiment}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Bug Reports Summary */}
            {bugReports.length > 0 && (
              <Card padding="lg">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">
                  Critical Bugs
                </h3>
                <div className="space-y-2">
                  {bugReports
                    .filter((b) => b.severity === 'critical')
                    .slice(0, 5)
                    .map((bug) => (
                      <div
                        key={bug.id}
                        className="p-2 bg-red-50 rounded border border-red-200"
                      >
                        <p className="text-xs font-medium text-red-900 truncate">
                          {bug.feedback.title}
                        </p>
                      </div>
                    ))}
                  {bugReports.length === 0 && (
                    <p className="text-sm text-neutral-600">No critical bugs reported</p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
