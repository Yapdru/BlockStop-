// REST API: Threats Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { APIErrorCode } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return APIMiddleware.formatError(auth.error!, request);
  }

  // Check rate limit
  const rateLimitCheck = APIMiddleware.checkRateLimit(auth.context.rateLimit);
  if (!rateLimitCheck.allowed) {
    return APIMiddleware.formatError(rateLimitCheck.error!, request);
  }

  try {
    // Parse pagination params
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');

    // Simulate fetching threats
    const threats = [
      {
        id: 'threat-001',
        type: 'phishing',
        severity: 'high',
        status: 'open',
        source: 'email',
        subject: 'Suspicious Email',
        timestamp: new Date(),
        detectedAt: new Date(),
        indicators: ['email@malicious.com'],
      },
      {
        id: 'threat-002',
        type: 'malware',
        severity: 'critical',
        status: 'open',
        source: 'file',
        fileName: 'suspicious.exe',
        timestamp: new Date(),
        detectedAt: new Date(),
        hash: 'abc123def456',
      },
    ];

    return APIMiddleware.formatResponse(
      {
        items: threats,
        total: 2,
        limit,
        offset,
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

  // Check scope
  const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, [
    'threats:write',
  ]);
  if (!scopeCheck.allowed) {
    return APIMiddleware.formatError(scopeCheck.error!, request);
  }

  try {
    const body = await request.json();

    // Validate request
    if (!body.type || !body.source) {
      return APIMiddleware.formatError(
        {
          code: APIErrorCode.VALIDATION_FAILED,
          message: 'Missing required fields: type, source',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          requestId: APIMiddleware.getRequestId(request),
        },
        request
      );
    }

    const threat = {
      id: `threat-${Date.now()}`,
      ...body,
      status: 'open',
      detectedAt: new Date(),
      createdBy: auth.context.userId,
    };

    return APIMiddleware.formatResponse(threat, request, 201);
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
