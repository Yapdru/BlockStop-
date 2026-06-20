import { NextRequest, NextResponse } from 'next/server';
import { createThreatHunter } from '@/lib/phase20/threat-hunter';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scope } = await req.json();

    const hunter = createThreatHunter();
    const results = await hunter.huntThreats(userId, scope || 'user');

    return NextResponse.json({
      huntingResults: results,
      totalMatches: results.reduce((sum, r) => sum + r.matchCount, 0),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Hunting error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Hunting failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hunter = createThreatHunter();

    return NextResponse.json({
      rules: hunter.getRules(),
      totalRules: hunter.getRules().length,
      enabledRules: hunter.getRules().filter(r => r.enabled).length
    });
  } catch (error) {
    console.error('Rules fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}
