import { NextRequest, NextResponse } from 'next/server';
import { createIntegrationFactory } from '@/lib/integrations/user/integration-factory';
import { ServiceProvider } from '@/lib/integrations/user/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') as ServiceProvider;
    const state = searchParams.get('state') || generateRandomState();

    if (!provider || !Object.values(ServiceProvider).includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const factory = createIntegrationFactory();

    const tempIntegration = {
      id: `temp_${Date.now()}`,
      userId: 'temp',
      provider,
      serviceType: factory.getServiceType(provider),
      accessToken: 'temp',
      isActive: true,
      scopes: getDefaultScopes(provider),
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const integration = factory.createIntegration('temp', tempIntegration);
    const authUrl = integration.getAuthorizationUrl(state);

    return NextResponse.json({
      authorizationUrl: authUrl,
      state,
      provider
    });
  } catch (error) {
    console.error('Authorization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authorization failed' },
      { status: 500 }
    );
  }
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getDefaultScopes(provider: ServiceProvider): string[] {
  const scopeMap: { [key in ServiceProvider]?: string[] } = {
    [ServiceProvider.GMAIL]: ['https://www.googleapis.com/auth/gmail.readonly'],
    [ServiceProvider.GOOGLE_DRIVE]: ['https://www.googleapis.com/auth/drive.readonly'],
    [ServiceProvider.OUTLOOK]: ['Mail.Read', 'offline_access'],
    [ServiceProvider.ONEDRIVE]: ['Files.Read.All', 'offline_access'],
    [ServiceProvider.PROTONMAIL]: ['mail:read']
  };
  return scopeMap[provider] || [];
}
