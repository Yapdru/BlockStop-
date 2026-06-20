import { NextRequest, NextResponse } from 'next/server';
import { IntegrationManager } from '@/lib/integrations/user/integration-manager';
import { createIntegrationFactory } from '@/lib/integrations/user/integration-factory';
import { ServiceProvider } from '@/lib/integrations/user/types';
import { getSession } from '@/lib/auth/auth-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const provider = searchParams.get('provider') as ServiceProvider;
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      return NextResponse.json(
        { error: error, description: errorDescription || 'Authorization denied' },
        { status: 400 }
      );
    }

    if (!code || !state || !provider) {
      return NextResponse.json(
        { error: 'Missing required parameters: code, state, or provider' },
        { status: 400 }
      );
    }

    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const factory = createIntegrationFactory();
    const manager = new IntegrationManager(factory);

    const integration = await manager.connectIntegration(
      session.user.id,
      provider,
      code,
      []
    );

    const redirectUrl = new URL('/integrations/success', req.nextUrl.origin);
    redirectUrl.searchParams.set('integrationId', integration.id);
    redirectUrl.searchParams.set('provider', provider);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorUrl = new URL('/integrations/error', req.nextUrl.origin);
    errorUrl.searchParams.set('message', error instanceof Error ? error.message : 'OAuth callback failed');
    return NextResponse.redirect(errorUrl);
  }
}
