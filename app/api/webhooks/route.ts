/**
 * Webhooks Management API
 * Register, update, and manage custom webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import WebhookManager from '@/lib/integrations/webhook-manager';
import WebhookValidator from '@/lib/integrations/webhook-validator';

// Global webhook manager instance
let webhookManager: WebhookManager;

// Initialize on first request
function getWebhookManager(): WebhookManager {
  if (!webhookManager) {
    webhookManager = new WebhookManager();
  }
  return webhookManager;
}

/**
 * POST /api/webhooks
 * Register a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook data
    if (!body.name || !body.url || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: name, url, events' },
        { status: 400 }
      );
    }

    const manager = getWebhookManager();

    // Generate webhook secret
    const crypto = require('crypto');
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = manager.registerWebhook({
      name: body.name,
      url: body.url,
      events: body.events,
      secret,
      isActive: body.isActive !== false,
      retryPolicy: body.retryPolicy,
      headers: body.headers,
    });

    // Audit log
    console.log('[Webhook] Registered', {
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
    });

    return NextResponse.json(
      {
        success: true,
        webhook: {
          id: webhook.id,
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          secret,
          isActive: webhook.isActive,
          createdAt: webhook.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Webhook Register] Error:', error);

    return NextResponse.json(
      { error: 'Failed to register webhook', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks
 * List all webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const manager = getWebhookManager();
    const webhooks = manager.listWebhooks();

    return NextResponse.json(
      {
        success: true,
        webhooks: webhooks.map((w) => ({
          id: w.id,
          name: w.name,
          url: w.url,
          events: w.events,
          isActive: w.isActive,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })),
        total: webhooks.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Webhook List] Error:', error);

    return NextResponse.json(
      { error: 'Failed to list webhooks', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/webhooks/[id]
 * Update a webhook
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const webhookId = body.id;

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Missing webhook id' },
        { status: 400 }
      );
    }

    const manager = getWebhookManager();
    const updated = manager.updateWebhook(webhookId, {
      name: body.name,
      url: body.url,
      events: body.events,
      isActive: body.isActive,
      retryPolicy: body.retryPolicy,
      headers: body.headers,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    console.log('[Webhook] Updated', webhookId);

    return NextResponse.json(
      {
        success: true,
        webhook: {
          id: updated.id,
          name: updated.name,
          url: updated.url,
          events: updated.events,
          isActive: updated.isActive,
          updatedAt: updated.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Webhook Update] Error:', error);

    return NextResponse.json(
      { error: 'Failed to update webhook', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/[id]
 * Delete a webhook
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const webhookId = body.id;

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Missing webhook id' },
        { status: 400 }
      );
    }

    const manager = getWebhookManager();
    const deleted = manager.deleteWebhook(webhookId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    console.log('[Webhook] Deleted', webhookId);

    return NextResponse.json(
      { success: true, webhookId },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Webhook Delete] Error:', error);

    return NextResponse.json(
      { error: 'Failed to delete webhook', details: String(error) },
      { status: 500 }
    );
  }
}
