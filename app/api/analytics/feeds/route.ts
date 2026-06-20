import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { ThreatFeed, ThreatFeedTemplate } from '@/types/analytics';

// GET feeds or templates
export async function GET(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return NextResponse.json(auth.error, { status: auth.error?.statusCode || 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'feeds'; // 'feeds' or 'templates'
    const userId = auth.context.userId;

    // Verify tier access
    if (!['PRO', 'MAX'].includes(auth.context.scopes?.tier || 'free')) {
      return NextResponse.json(
        { error: 'Threat feeds require PRO tier or higher' },
        { status: 403 }
      );
    }

    if (type === 'templates') {
      return NextResponse.json(generateMockTemplates());
    }

    // Return user's custom feeds
    return NextResponse.json(generateMockFeeds(userId));
  } catch (error) {
    console.error('Feeds error:', error);
    return NextResponse.json({ error: 'Failed to fetch feeds' }, { status: 500 });
  }
}

// POST create new feed
export async function POST(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return NextResponse.json(auth.error, { status: auth.error?.statusCode || 401 });
  }

  try {
    const body = await request.json();
    const userId = auth.context.userId;

    if (!body.name) {
      return NextResponse.json({ error: 'Feed name required' }, { status: 400 });
    }

    // Create new feed
    const newFeed: ThreatFeed = {
      id: `feed-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      rules: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    return NextResponse.json(newFeed, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create feed' }, { status: 400 });
  }
}

function generateMockTemplates(): ThreatFeedTemplate[] {
  return [
    {
      id: 'template-malware',
      name: 'Malware Detection Pack',
      description: 'Comprehensive malware detection rules',
      category: 'malware',
      rules: [
        {
          id: 'rule-1',
          name: 'Executable Pattern Match',
          description: 'Detects suspicious executable patterns',
          ruleType: 'pattern',
          pattern: '(\\.(exe|dll|sys)$)',
          severity: 'high',
          enabled: true,
          priority: 8,
        },
      ],
    },
    {
      id: 'template-phishing',
      name: 'Phishing Detection Pack',
      description: 'Anti-phishing rules and patterns',
      category: 'phishing',
      rules: [
        {
          id: 'rule-2',
          name: 'Email Spoofing Detection',
          description: 'Detects spoofed sender addresses',
          ruleType: 'heuristic',
          pattern: 'spoofed_email_pattern',
          severity: 'medium',
          enabled: true,
          priority: 7,
        },
      ],
    },
    {
      id: 'template-ransomware',
      name: 'Ransomware Protection Pack',
      description: 'Ransomware detection and prevention rules',
      category: 'ransomware',
      rules: [
        {
          id: 'rule-3',
          name: 'File Extension Encryption Pattern',
          description: 'Detects encryption-based ransomware behavior',
          ruleType: 'behavioral',
          pattern: 'mass_file_encryption',
          severity: 'critical',
          enabled: true,
          priority: 10,
        },
      ],
    },
  ];
}

function generateMockFeeds(userId: number): ThreatFeed[] {
  return [
    {
      id: 'feed-1',
      name: 'Enterprise Malware Feed',
      description: 'Custom malware detection rules for organization',
      rules: [
        {
          id: 'rule-a',
          name: 'Custom Malware Signature',
          description: 'Organization-specific malware signature',
          ruleType: 'signature',
          pattern: 'custom_signature_abc123',
          severity: 'critical',
          enabled: true,
          priority: 10,
        },
      ],
      enabled: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      createdBy: userId,
    },
  ];
}
