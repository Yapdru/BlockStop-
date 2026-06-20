// REST API: Integration Templates Endpoint
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

    const templates = integrationManager.listTemplates(type || undefined);

    return APIMiddleware.formatResponse(
      {
        items: templates.map(t => ({
          id: t.id,
          name: t.name,
          type: t.type,
          description: t.description,
          requiredFields: t.requiredFields,
          documentation: t.documentation?.substring(0, 500),
        })),
        total: templates.length,
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
