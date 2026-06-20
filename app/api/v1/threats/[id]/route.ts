// REST API: Individual Threat Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { APIMiddleware } from '@/lib/api/middleware';
import { APIErrorCode } from '@/lib/api/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return APIMiddleware.formatError(auth.error!, request);
  }

  try {
    const threatId = params.id;

    // Simulate fetching threat
    const threat = {
      id: threatId,
      type: 'phishing',
      severity: 'high',
      status: 'open',
      source: 'email',
      subject: 'Suspicious Email',
      body: 'Contains malicious links',
      senderEmail: 'attacker@malicious.com',
      recipientEmail: 'user@example.com',
      timestamp: new Date(),
      detectedAt: new Date(),
      indicators: ['email@malicious.com', 'https://malicious.com'],
      analysis: {
        spamScore: 9.8,
        phishingScore: 8.5,
        malwareScore: 0,
      },
      actions: [
        {
          id: 'action-1',
          type: 'quarantine',
          status: 'completed',
          timestamp: new Date(),
        },
      ],
    };

    return APIMiddleware.formatResponse(threat, request, 200);
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const threatId = params.id;

    // Update threat
    const updatedThreat = {
      id: threatId,
      ...body,
      updatedAt: new Date(),
      updatedBy: auth.context.userId,
    };

    return APIMiddleware.formatResponse(updatedThreat, request, 200);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = APIMiddleware.authenticateRequest(request);
  if (!auth.valid || !auth.context) {
    return APIMiddleware.formatError(auth.error!, request);
  }

  // Check scope
  const scopeCheck = APIMiddleware.checkScopeAccess(auth.context, [
    'threats:delete',
  ]);
  if (!scopeCheck.allowed) {
    return APIMiddleware.formatError(scopeCheck.error!, request);
  }

  try {
    const threatId = params.id;

    return APIMiddleware.formatResponse(
      {
        message: `Threat ${threatId} deleted`,
      },
      request,
      204
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
