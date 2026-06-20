import { NextRequest, NextResponse } from 'next/server';
import { createMasterOrchestrator } from '@/lib/unified/master-orchestrator';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = req.nextUrl.searchParams.get('teamId') || undefined;

    const orchestrator = createMasterOrchestrator();
    const dashboard = await orchestrator.getUnifiedDashboard(userId, teamId);

    return NextResponse.json({
      dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
