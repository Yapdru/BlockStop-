// REST API: Webhooks Endpoint
import { NextRequest } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { webhookManager } from '@/lib/api/webhook-manager';
import { APIErrorCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return APIMiddleware.formatError(auth.error!, request);
  }

  try {
    const webhooks = webhookManager.listWebhooks(auth.context.orgId);

    return APIMiddleware.formatResponse(
      {
        items: webhooks.map(w => ({
          id: w.id,
          url: w.url,
          eventTypes: w.eventTypes,
          active: w.active,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })),
        total: webhooks.length,
      },
      request,
      200
    );
  } catch (error) {
    return APIMiddleware.formatError(
      {
        code: APIErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        requestId: APIMiddleware.getRequestId(request),
      },
      request
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return APIMiddleware.formatError(auth.error!, request);
  }

  const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, [
    'webhooks:write',
  ]);
  if (!scopeCheck.allowed) {
    return APIMiddleware.formatError(scopeCheck.error!, request);
  }

  try {
    const body = await request.json();

    if (!body.url || !body.eventTypes) {
      return APIMiddleware.formatError(
        {
          code: APIErrorCode.VALIDATION_FAILED,
          message: 'Missing required fields: url, eventTypes',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          requestId: APIMiddleware.getRequestId(request),
        },
        request
      );
    }

    const webhook = webhookManager.registerWebhook(
      auth.context.orgId,
      body.url,
      body.eventTypes,
      body.secret
    );

    return APIMiddleware.formatResponse(
      {
        id: webhook.id,
        url: webhook.url,
        eventTypes: webhook.eventTypes,
        active: webhook.active,
        createdAt: webhook.createdAt,
      },
      request,
      201
    );
  } catch (error) {
    return APIMiddleware.formatError(
      {
        code: APIErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        requestId: APIMiddleware.getRequestId(request),
      },
      request
    );
  }
}
