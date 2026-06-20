import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { IntegrationConfig } from '@/types/enterprise';

export async function GET(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return NextResponse.json(auth.error, { status: auth.error?.statusCode || 401 });
  }

  try {
    // Verify tier access
    if (!['PRO', 'MAX'].includes(auth.context.scopes?.tier || 'free')) {
      return NextResponse.json(
        { error: 'Integrations require PRO tier or higher' },
        { status: 403 }
      );
    }

    // Mock integrations
    const integrations: IntegrationConfig[] = [
      {
        id: 'integration-1',
        name: 'Splunk SIEM',
        type: 'siem',
        endpoint: 'https://splunk.example.com:8088',
        enabled: true,
        lastSyncAt: new Date(Date.now() - 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ];

    return NextResponse.json(integrations);
  } catch (error) {
    console.error('Integrations error:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return NextResponse.json(auth.error, { status: auth.error?.statusCode || 401 });
  }

  try {
    const body = await request.json();

    if (!body.name || !body.type || !body.endpoint) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, endpoint' },
        { status: 400 }
      );
    }

    // Validate endpoint URL
    try {
      new URL(body.endpoint);
    } catch {
      return NextResponse.json({ error: 'Invalid endpoint URL' }, { status: 400 });
    }

    // Validate integration type
    if (!['siem', 'edr', 'custom', 'api'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
    }

    const integration: IntegrationConfig = {
      id: `integration-${Date.now()}`,
      name: body.name,
      type: body.type,
      endpoint: body.endpoint,
      credentials: {
        apiKey: body.apiKey ? '***' : undefined,
        secret: body.secret ? '***' : undefined,
      },
      enabled: body.enabled !== false,
      createdAt: new Date(),
    };

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error('Create integration error:', error);
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 400 });
  }
}
