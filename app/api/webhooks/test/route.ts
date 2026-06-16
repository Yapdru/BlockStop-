/**
 * Webhooks Test Endpoint
 * Test webhook delivery and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import WebhookManager from '@/lib/integrations/webhook-manager';
import WebhookValidator from '@/lib/integrations/webhook-validator';

let webhookManager: WebhookManager;

function getWebhookManager(): WebhookManager {
  if (!webhookManager) {
    webhookManager = new WebhookManager();
  }
  return webhookManager;
}

/**
 * POST /api/webhooks/test
 * Test webhook delivery
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.webhookId) {
      return NextResponse.json(
        { error: 'Missing webhookId' },
        { status: 400 }
      );
    }

    const manager = getWebhookManager();
    const result = await manager.testWebhook(body.webhookId);

    console.log('[Webhook Test]', {
      webhookId: body.webhookId,
      success: result.success,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
    });

    return NextResponse.json(
      {
        success: result.success,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        error: result.error,
        message: result.success
          ? 'Webhook test successful'
          : `Webhook test failed: ${result.error}`,
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    console.error('[Webhook Test] Error:', error);

    return NextResponse.json(
      { error: 'Failed to test webhook', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/test/[webhookId]
 * Get webhook test history
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const webhookId = url.searchParams.get('webhookId');

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Missing webhookId' },
        { status: 400 }
      );
    }

    const manager = getWebhookManager();
    const webhook = manager.getWebhook(webhookId);

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    const deliveryHistory = manager.getDeliveryHistory(webhookId, 20);

    return NextResponse.json(
      {
        success: true,
        webhookId,
        deliveries: deliveryHistory.map((d) => ({
          id: d.id,
          eventId: d.eventId,
          attempt: d.attempt,
          statusCode: d.statusCode,
          responseTime: d.responseTime,
          error: d.error,
          timestamp: d.timestamp,
        })),
        total: deliveryHistory.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Webhook History] Error:', error);

    return NextResponse.json(
      { error: 'Failed to get webhook history', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/test/validate
 * Validate webhook payload
 */
export async function POST_validate(request: NextRequest) {
  try {
    const body = await request.json();

    const payload = body.payload || {};
    const signature = body.signature || '';
    const secret = body.secret || '';
    const headers = body.headers || {};
    const clientIP = request.ip;

    // Validate signature
    const sigValidation = WebhookValidator.validateSignature(
      JSON.stringify(payload),
      signature,
      secret
    );

    if (!sigValidation.isValid) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Invalid signature',
          validation: sigValidation,
        },
        { status: 400 }
      );
    }

    // Validate payload structure
    const payloadValidation = WebhookValidator.validatePayload(payload);

    if (!payloadValidation.isValid) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Invalid payload',
          validation: payloadValidation,
        },
        { status: 400 }
      );
    }

    // Validate headers
    const headerValidation = WebhookValidator.validateHeaders(headers);

    if (!headerValidation.isValid) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Invalid headers',
          validation: headerValidation,
        },
        { status: 400 }
      );
    }

    // Validate IP if whitelist provided
    const ipWhitelist = body.ipWhitelist || [];
    const ipValidation = WebhookValidator.validateIP(clientIP || '127.0.0.1', ipWhitelist);

    if (!ipValidation.isValid) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'IP not whitelisted',
          validation: ipValidation,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        message: 'Webhook payload is valid',
        validations: {
          signature: sigValidation,
          payload: payloadValidation,
          headers: headerValidation,
          ip: ipValidation,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Webhook Validate] Error:', error);

    return NextResponse.json(
      { error: 'Failed to validate webhook', details: String(error) },
      { status: 500 }
    );
  }
}
