import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { WebhookConfig } from '@/types/enterprise';

export async function GET(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return NextResponse.json(auth.error, { status: auth.error?.statusCode || 401 });
  }

  try {
    // Verify tier access
    if (!['NEO', 'PRO', 'MAX'].includes(auth.context.scopes?.tier || 'free')) {
      return NextResponse.json(
        { error: 'Webhooks require enterprise tier' },
        { status: 403 }
      );
    }

    const userId = auth.context.userId;

    // Mock data - replace with actual database query
    const webhooks: WebhookConfig[] = [
      {
        id: 'webhook-1',
        name: 'SIEM Integration',
        url: 'https://siem.example.com/webhook',
        events: ['threat.detected', 'scan.completed'],
        active: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastTriggeredAt: new Date(Date.now() - 60 * 60 * 1000),
        failureCount: 0,
        maxRetries: 3,
      },
    ];

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Webhooks error:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return NextResponse.json(auth.error, { status: auth.error?.statusCode || 401 });
  }

  try {
    const body = await request.json();

    if (!body.name || !body.url || !body.events || body.events.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, events' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 });
    }

    const webhook: WebhookConfig = {
      id: `webhook-${Date.now()}`,
      name: body.name,
      url: body.url,
      events: body.events,
      headers: body.headers,
      active: body.active !== false,
      createdAt: new Date(),
      failureCount: 0,
      maxRetries: 3,
    };

    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 400 });
  }
}
