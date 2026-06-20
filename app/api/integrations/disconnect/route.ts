import { NextRequest, NextResponse } from 'next/server';
import { IntegrationManager } from '@/lib/integrations/user/integration-manager';
import { createIntegrationFactory } from '@/lib/integrations/user/integration-factory';
import { getSession } from '@/lib/auth/auth-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integrationId } = await req.json();

    if (!integrationId) {
      return NextResponse.json({ error: 'integrationId is required' }, { status: 400 });
    }

    const factory = createIntegrationFactory();
    const manager = new IntegrationManager(factory);

    await manager.disconnectIntegration(session.user.id, integrationId);

    return NextResponse.json({ success: true, message: 'Integration disconnected' });
  } catch (error) {
    console.error('Disconnect integration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
