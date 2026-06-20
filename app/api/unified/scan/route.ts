import { NextRequest, NextResponse } from 'next/server';
import { createMasterOrchestrator } from '@/lib/unified/master-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      teamId,
      integrationIds,
      includeAIAnalysis = true,
      includeThreatHunting = true,
      priority = 'normal'
    } = await req.json();

    const orchestrator = createMasterOrchestrator();

    const result = await orchestrator.executeMasterScan({
      userId,
      teamId,
      integrationIds,
      includeAIAnalysis,
      includeThreatHunting,
      priority
    });

    return NextResponse.json({
      success: true,
      job: result,
      timestamp: new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Unified scan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    );
  }
}
