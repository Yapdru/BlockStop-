// REST API: Integrations Endpoint
import { NextRequest } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { integrationManager } from '@/lib/api/integration-manager';
import { APIErrorCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return APIMiddleware.formatError(auth.error!, request);
  }

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const enabled = url.searchParams.get('enabled');

    const integrations = integrationManager.listIntegrations(
      type || undefined,
      enabled === 'true'
    );

    return APIMiddleware.formatResponse(
      {
        items: integrations.map(i => ({
          id: i.id,
          name: i.name,
          type: i.type,
          category: i.category,
          enabled: i.enabled,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        })),
        total: integrations.length,
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
    'integrations:write',
  ]);
  if (!scopeCheck.allowed) {
    return APIMiddleware.formatError(scopeCheck.error!, request);
  }

  try {
    const body = await request.json();

    if (!body.name || !body.type || !body.config) {
      return APIMiddleware.formatError(
        {
          code: APIErrorCode.VALIDATION_FAILED,
          message: 'Missing required fields: name, type, config',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          requestId: APIMiddleware.getRequestId(request),
        },
        request
      );
    }

    const integration = integrationManager.registerIntegration(
      body.name,
      body.type,
      body.category || '',
      body.config
    );

    return APIMiddleware.formatResponse(
      {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        enabled: integration.enabled,
        createdAt: integration.createdAt,
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
