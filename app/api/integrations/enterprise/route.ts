import { NextRequest, NextResponse } from 'next/server';
import { getUserTier } from '@/lib/neo/auth-service';
import { getEnterpriseConnectors, getConnectorsByTier } from '@/lib/integrations/enterprise/enterprise-connectors';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const category = req.nextUrl.searchParams.get('category') || undefined;

    // Get user tier
    const userTier = await getUserTier(userId);

    // Get available connectors for user's tier
    const availableConnectors = getConnectorsByTier(userTier);

    // Filter by category if provided
    const connectors = category
      ? availableConnectors.filter(c => c.category === category)
      : availableConnectors;

    return NextResponse.json({
      tier: userTier,
      availableConnectors: connectors,
      total: connectors.length,
      allConnectors: getEnterpriseConnectors(category).length
    });
  } catch (error) {
    console.error('Enterprise integrations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}
