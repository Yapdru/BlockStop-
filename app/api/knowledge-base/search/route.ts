import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const docType = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!q || q.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    let filterQuery = 'WHERE is_published = true AND (title ILIKE $1 OR content ILIKE $1)';
    const params: any[] = [`%${q}%`];

    if (category) {
      filterQuery += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    let docTypeFilter = '';
    if (docType === 'playbooks') {
      docTypeFilter = 'SELECT * FROM playbooks';
    } else if (docType === 'runbooks') {
      docTypeFilter = 'SELECT * FROM runbooks';
    } else {
      // Search both playbooks and runbooks if no type specified
      const playbookResult = await query(
        `SELECT id, title, content, 'playbook' as type, category, created_at
         FROM playbooks ${filterQuery}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );

      const runbookResult = await query(
        `SELECT id, title, content, 'runbook' as type, category, created_at
         FROM runbooks ${filterQuery}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );

      const combined = [
        ...playbookResult.rows.map(r => ({ ...r, score: calculateScore(q, r.title, r.content) })),
        ...runbookResult.rows.map(r => ({ ...r, score: calculateScore(q, r.title, r.content) })),
      ]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return NextResponse.json({
        success: true,
        results: combined,
        total: combined.length,
      });
    }

    const result = await query(
      `${docTypeFilter} ${filterQuery}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      results: result.rows.map(r => ({
        ...r,
        type: docType || 'unknown',
        score: calculateScore(q, r.title, r.content),
      })),
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    );
  }
}

function calculateScore(query: string, title: string, content: string): number {
  let score = 0;
  const lowerQuery = query.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();

  if (lowerTitle.includes(lowerQuery)) {
    score += 100;
  }
  if (lowerContent.includes(lowerQuery)) {
    score += 50;
  }

  const queryWords = lowerQuery.split(' ');
  const titleWords = lowerTitle.split(' ');
  const contentWords = lowerContent.split(' ');

  queryWords.forEach(word => {
    if (titleWords.includes(word)) score += 10;
    if (contentWords.includes(word)) score += 5;
  });

  return score;
}
