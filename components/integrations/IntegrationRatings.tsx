'use client';

import React, { useState, useEffect } from 'react';
import { Integration, IntegrationReview } from '@/types/integrations';
import axios from 'axios';

interface IntegrationRatingsProps {
  integration: Integration;
}

export function IntegrationRatings({ integration }: IntegrationRatingsProps) {
  const [reviews, setReviews] = useState<IntegrationReview[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [userTitle, setUserTitle] = useState('');
  const [userComment, setUserComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get<IntegrationReview[]>(
          `/api/integrations/${integration.id}/reviews`
        );
        setReviews(response.data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };

    fetchReviews();
  }, [integration.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userRating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!userTitle.trim() || !userComment.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newReview = await axios.post<IntegrationReview>(
        `/api/integrations/${integration.id}/reviews`,
        {
          rating: userRating,
          title: userTitle,
          comment: userComment,
        }
      );

      setReviews([newReview.data, ...reviews]);
      setUserRating(0);
      setUserTitle('');
      setUserComment('');
      setSubmitted(true);

      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const distribution = getRatingDistribution();
  const totalReviews = reviews.length;

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-bold text-gray-900">Reviews & Ratings</h3>

      {/* Overall Rating */}
      <div className="bg-white border border-light-border rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rating Summary */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {integration.rating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.round(integration.rating) ? 'text-yellow-500' : 'text-gray-300'}>
                  ★
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Based on {integration.reviews} {integration.reviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = distribution[rating as keyof typeof distribution];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    {[...Array(rating)].map((_, i) => (
                      <span key={i} className="text-xs text-yellow-500">★</span>
                    ))}
                  </div>
                  <div className="flex-1 h-2 bg-light-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit Review */}
      <form onSubmit={handleSubmitReview} className="bg-light-surface rounded-lg p-6 space-y-4">
        <h4 className="font-semibold text-gray-900">Write a Review</h4>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-green-700 text-sm">
            ✓ Thank you! Your review has been submitted.
          </div>
        )}

        {/* Rating Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => setUserRating(rating)}
                className={`text-3xl transition ${
                  rating <= userRating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-200'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            placeholder="Summarize your experience"
            value={userTitle}
            onChange={(e) => setUserTitle(e.target.value)}
            className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Review
          </label>
          <textarea
            placeholder="Share your detailed feedback..."
            value={userComment}
            onChange={(e) => setUserComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-light-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>

      {/* Reviews List */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">
          {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
        </h4>

        {reviews.length === 0 ? (
          <div className="bg-light-surface rounded-lg p-6 text-center">
            <p className="text-gray-600">No reviews yet</p>
            <p className="text-sm text-gray-500 mt-1">Be the first to review this integration</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white border border-light-border rounded-lg p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold text-gray-900">{review.title}</h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment */}
              <p className="text-gray-600 text-sm mb-3">{review.comment}</p>

              {/* Footer */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <button className="hover:text-primary-600 transition">
                  👍 Helpful ({review.helpful})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
