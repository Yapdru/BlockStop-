import { NextRequest, NextResponse } from 'next/server';
import { IntegrationManager } from '@/lib/integrations/user/integration-manager';
import { createIntegrationFactory } from '@/lib/integrations/user/integration-factory';
import { getSession } from '@/lib/auth/auth-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const factory = createIntegrationFactory();
    const manager = new IntegrationManager(factory);

    const integrations = await manager.getUserIntegrations(session.user.id);

    const statuses = await Promise.all(
      integrations.map(int => manager.getIntegrationStatus(session.user.id, int.id))
    );

    return NextResponse.json({
      integrations: integrations.map((int, idx) => ({
        id: int.id,
        provider: int.provider,
        serviceType: int.serviceType,
        isActive: int.isActive,
        createdAt: int.createdAt,
        updatedAt: int.updatedAt,
        status: statuses[idx]
      }))
    });
  } catch (error) {
    console.error('List integrations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list integrations' },
      { status: 500 }
    );
  }
}
