/**
 * Community Threat Feeds Marketplace API
 * Handles feed creation, listing, rating, and revenue sharing
 */

import { NextRequest, NextResponse } from 'next/server';

interface ThreatFeed {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  creatorId: string;
  category: string;
  threatTypes: string[];
  feedUrl: string;
  dataFormat: 'json' | 'csv' | 'yara' | 'snort' | 'suricata';
  updateFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  threatCount: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  ratingScore: number; // 0-5
  downloadCount: number;
  subscriptionPrice: number; // dollars per month
  revenueShare: number; // 70% to creator
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    dataQuality: number; // 0-100
    falsePositiveRate: number;
    lastUpdate: Date;
    threatLanguages: string[];
    geoCoverage: string[];
  };
}

interface FeedRating {
  id: string;
  feedId: string;
  userId: string;
  rating: number; // 1-5
  review: string;
  helpful: number;
  createdAt: Date;
}

interface FeedSubscription {
  id: string;
  feedId: string;
  subscriberId: string;
  status: 'active' | 'cancelled' | 'expired';
  subscriptionDate: Date;
  expiryDate: Date;
  accessToken: string;
}

// In-memory storage (replace with database in production)
const feedDatabase: Map<string, ThreatFeed> = new Map();
const feedRatings: Map<string, FeedRating[]> = new Map();
const feedSubscriptions: Map<string, FeedSubscription[]> = new Map();

/**
 * GET /api/marketplace/feeds
 * List all threat feeds with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const verified = searchParams.get('verified') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search')?.toLowerCase();

    let feeds = Array.from(feedDatabase.values());

    // Apply filters
    if (category) {
      feeds = feeds.filter(f => f.category === category);
    }

    if (verified) {
      feeds = feeds.filter(f => f.verificationStatus === 'verified');
    }

    if (featured) {
      feeds = feeds.filter(f => f.featured);
    }

    if (search) {
      feeds = feeds.filter(
        f =>
          f.name.toLowerCase().includes(search) ||
          f.description.toLowerCase().includes(search)
      );
    }

    // Sort by rating and download count
    feeds.sort((a, b) => {
      const ratingDiff = b.ratingScore - a.ratingScore;
      return ratingDiff !== 0 ? ratingDiff : b.downloadCount - a.downloadCount;
    });

    // Pagination
    const total = feeds.length;
    const startIdx = (page - 1) * limit;
    const paginatedFeeds = feeds.slice(startIdx, startIdx + limit);

    return NextResponse.json({
      success: true,
      data: {
        feeds: paginatedFeeds,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feeds' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/feeds
 * Create a new threat feed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      creatorId,
      createdBy,
      category,
      threatTypes,
      feedUrl,
      dataFormat,
      updateFrequency,
      threatCount,
      subscriptionPrice,
    } = body;

    // Validation
    if (!name || !description || !creatorId || !feedUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const feedId = `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newFeed: ThreatFeed = {
      id: feedId,
      name,
      description,
      createdBy: createdBy || creatorId,
      creatorId,
      category: category || 'custom',
      threatTypes: threatTypes || [],
      feedUrl,
      dataFormat: dataFormat || 'json',
      updateFrequency: updateFrequency || 'daily',
      threatCount: threatCount || 0,
      verificationStatus: 'pending',
      ratingScore: 0,
      downloadCount: 0,
      subscriptionPrice: subscriptionPrice || 9.99,
      revenueShare: 70,
      featured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        dataQuality: 85,
        falsePositiveRate: 2.5,
        lastUpdate: new Date(),
        threatLanguages: ['en'],
        geoCoverage: ['global'],
      },
    };

    feedDatabase.set(feedId, newFeed);
    feedRatings.set(feedId, []);
    feedSubscriptions.set(feedId, []);

    return NextResponse.json(
      {
        success: true,
        data: newFeed,
        message: 'Feed submitted for verification',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create feed' },
      { status: 400 }
    );
  }
}

/**
 * GET /api/marketplace/feeds/:feedId
 * Get feed details and ratings
 */
export async function GET_DETAIL(request: NextRequest) {
  try {
    const feedId = request.nextUrl.pathname.split('/').pop();

    if (!feedId) {
      return NextResponse.json({ error: 'Feed ID required' }, { status: 400 });
    }

    const feed = feedDatabase.get(feedId);
    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    const ratings = feedRatings.get(feedId) || [];
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        feed,
        ratings: ratings.slice(0, 10), // Latest 10 ratings
        averageRating: Math.round(avgRating * 10) / 10,
        totalRatings: ratings.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feed details' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/feeds/:feedId/verify
 * Admin endpoint to verify a feed
 */
export async function POST_VERIFY(request: NextRequest) {
  try {
    const feedId = request.nextUrl.pathname.split('/')[4];
    const { approved, comment } = await request.json();

    const feed = feedDatabase.get(feedId);
    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    feed.verificationStatus = approved ? 'verified' : 'rejected';
    feed.verifiedAt = new Date();
    feed.updatedAt = new Date();

    return NextResponse.json({
      success: true,
      data: feed,
      message: `Feed ${approved ? 'approved' : 'rejected'} for marketplace`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to verify feed' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/marketplace/feeds/:feedId/rate
 * Rate and review a feed
 */
export async function POST_RATE(request: NextRequest) {
  try {
    const feedId = request.nextUrl.pathname.split('/')[4];
    const { userId, rating, review } = await request.json();

    if (!feedId || !userId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating parameters' },
        { status: 400 }
      );
    }

    const feed = feedDatabase.get(feedId);
    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    const newRating: FeedRating = {
      id: `rating-${Date.now()}`,
      feedId,
      userId,
      rating,
      review: review || '',
      helpful: 0,
      createdAt: new Date(),
    };

    if (!feedRatings.has(feedId)) {
      feedRatings.set(feedId, []);
    }

    feedRatings.get(feedId)!.push(newRating);

    // Update feed rating
    const ratings = feedRatings.get(feedId) || [];
    feed.ratingScore =
      Math.round(
        (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10
      ) / 10;

    return NextResponse.json({
      success: true,
      data: newRating,
      message: 'Rating submitted',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit rating' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/marketplace/feeds/:feedId/subscribe
 * Subscribe to a threat feed
 */
export async function POST_SUBSCRIBE(request: NextRequest) {
  try {
    const feedId = request.nextUrl.pathname.split('/')[4];
    const { subscriberId } = await request.json();

    if (!feedId || !subscriberId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const feed = feedDatabase.get(feedId);
    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    const accessToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const subscription: FeedSubscription = {
      id: `sub-${Date.now()}`,
      feedId,
      subscriberId,
      status: 'active',
      subscriptionDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      accessToken,
    };

    if (!feedSubscriptions.has(feedId)) {
      feedSubscriptions.set(feedId, []);
    }

    feedSubscriptions.get(feedId)!.push(subscription);
    feed.downloadCount++;

    return NextResponse.json(
      {
        success: true,
        data: subscription,
        message: 'Successfully subscribed to feed',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe' },
      { status: 400 }
    );
  }
}
