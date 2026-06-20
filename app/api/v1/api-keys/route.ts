// REST API: API Keys Endpoint
import { NextRequest } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { apiKeyManager } from '@/lib/api/api-key-manager';
import { APIErrorCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return APIMiddleware.formatError(auth.error!, request);
  }

  try {
    const keys = apiKeyManager.listKeys(auth.context.orgId);

    return APIMiddleware.formatResponse(
      {
        items: keys.map(k => ({
          id: k.id,
          name: k.name,
          scopes: k.scopes,
          active: k.active,
          lastUsedAt: k.lastUsedAt,
          createdAt: k.createdAt,
          expiresAt: k.expiresAt,
        })),
        total: keys.length,
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
    'api-keys:write',
  ]);
  if (!scopeCheck.allowed) {
    return APIMiddleware.formatError(scopeCheck.error!, request);
  }

  try {
    const body = await request.json();

    if (!body.name || !body.scopes) {
      return APIMiddleware.formatError(
        {
          code: APIErrorCode.VALIDATION_FAILED,
          message: 'Missing required fields: name, scopes',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          requestId: APIMiddleware.getRequestId(request),
        },
        request
      );
    }

    const { key, apiKey } = apiKeyManager.createKey({
      name: body.name,
      orgId: auth.context.orgId,
      userId: auth.context.userId,
      scopes: body.scopes,
      expiresIn: body.expiresIn,
      metadata: body.metadata,
    });

    return APIMiddleware.formatResponse(
      {
        id: apiKey.id,
        name: apiKey.name,
        key, // Only returned once
        scopes: apiKey.scopes,
        active: apiKey.active,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
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
