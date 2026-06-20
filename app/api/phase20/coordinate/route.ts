import { NextRequest, NextResponse } from 'next/server';
import { createIntegrationCoordinator } from '@/lib/phase20/integration-coordinator';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integrationIds, priority } = await req.json();

    if (!integrationIds || !Array.isArray(integrationIds)) {
      return NextResponse.json(
        { error: 'Integration IDs array is required' },
        { status: 400 }
      );
    }

    const coordinator = createIntegrationCoordinator();
    const job = await coordinator.coordinateScan(userId, integrationIds, priority || 'normal');

    return NextResponse.json({
      job,
      status: job.status,
      timestamp: new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Coordination error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Coordination failed' },
      { status: 500 }
    );
  }
}
