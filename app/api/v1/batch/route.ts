// REST API: Batch Operations Endpoint
import { NextRequest } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { BatchRequest, BatchResponse, APIErrorCode } from '@/lib/api/types';

export async function POST(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return APIMiddleware.formatError(auth.error!, request);
  }

  try {
    const body: BatchRequest = await request.json();

    if (!body.requests || !Array.isArray(body.requests)) {
      return APIMiddleware.formatError(
        {
          code: APIErrorCode.VALIDATION_FAILED,
          message: 'requests must be an array',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          requestId: APIMiddleware.getRequestId(request),
        },
        request
      );
    }

    const results: BatchResponse['results'] = [];
    const errors: BatchResponse['errors'] = [];
    const sequential = body.sequential || false;
    const stopOnError = body.stopOnError || false;

    for (const item of body.requests) {
      try {
        if (!item.id || !item.method || !item.path) {
          errors.push({
            requestId: item.id || 'unknown',
            error: {
              code: APIErrorCode.VALIDATION_FAILED,
              message:
                'Each request must have id, method, and path',
              statusCode: 400,
              timestamp: new Date().toISOString(),
              requestId: APIMiddleware.getRequestId(request),
            },
          });

          if (stopOnError) break;
          continue;
        }

        // Execute the batch request
        const batchResponse = await executeBatchRequest(
          item,
          auth.context!
        );

        results.push({
          requestId: item.id,
          status: batchResponse.status,
          body: batchResponse.body,
          headers: batchResponse.headers,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({
          requestId: item.id,
          error: {
            code: APIErrorCode.INTERNAL_SERVER_ERROR,
            message: errorMsg,
            statusCode: 500,
            timestamp: new Date().toISOString(),
            requestId: APIMiddleware.getRequestId(request),
          },
        });

        if (stopOnError) break;
      }
    }

    const response: BatchResponse = {
      results,
      ...(errors.length > 0 && { errors }),
    };

    return APIMiddleware.formatResponse(response, request, 200);
  } catch (error) {
    return APIMiddleware.formatError(
      {
        code: APIErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Batch processing failed',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        requestId: APIMiddleware.getRequestId(request),
      },
      request
    );
  }
}

async function executeBatchRequest(
  item: any,
  context: any
): Promise<{ status: number; body: any; headers: Record<string, string> }> {
  // Construct the full URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}${item.path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${context.apiKeyId}`,
    ...item.headers,
  };

  const response = await fetch(url, {
    method: item.method,
    headers,
    body: item.body ? JSON.stringify(item.body) : undefined,
  });

  const body = await response.json();

  return {
    status: response.status,
    body,
    headers: {
      'content-type':
        response.headers.get('content-type') || 'application/json',
    },
  };
}
