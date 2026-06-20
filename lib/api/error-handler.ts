/**
 * BlockStop Phase 16: Enterprise API & Integrations
 * Centralized Error Handler
 */

import { Response } from 'express';
import { APIError, APIErrorCode } from '../../types/api';
import { v4 as uuidv4 } from 'uuid';

export class APIException extends Error {
  constructor(
    public code: APIErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = 'APIException';
    Object.setPrototypeOf(this, APIException.prototype);
  }
}

export class ValidationError extends APIException {
  constructor(message: string, details?: Record<string, any>) {
    super(APIErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class AuthenticationError extends APIException {
  constructor(message: string = 'Authentication required') {
    super(APIErrorCode.UNAUTHORIZED, message, 401);
  }
}

export class AuthorizationError extends APIException {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(APIErrorCode.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends APIException {
  constructor(resource: string = 'Resource') {
    super(APIErrorCode.NOT_FOUND, `${resource} not found`, 404);
  }
}

export class RateLimitError extends APIException {
  constructor(
    public remaining: number = 0,
    public resetTime: number = 0,
  ) {
    super(APIErrorCode.RATE_LIMIT_EXCEEDED, 'Too many requests. Please try again later.', 429);
  }
}

// Error response handler
export function sendErrorResponse(
  res: Response,
  error: Error | APIException | any,
  statusCode?: number,
  requestId?: string,
): Response {
  const id = requestId || uuidv4();
  let code: string;
  let message: string;
  let status: number;

  if (error instanceof APIException) {
    code = error.code;
    message = error.message;
    status = error.statusCode;
  } else {
    code = 'INTERNAL_ERROR';
    message = process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : error.message || 'An unexpected error occurred';
    status = statusCode || 500;
  }

  const apiError: APIError = {
    code,
    message,
    timestamp: new Date(),
    request_id: id,
  };

  return res.status(status).json({
    success: false,
    error: apiError,
  });
}

// Error handler middleware
export function errorHandlerMiddleware(err: any, req: any, res: Response, next: any) {
  const requestId = req.requestId || uuidv4();
  sendErrorResponse(res, err, undefined, requestId);
}

export default {
  APIException,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  sendErrorResponse,
  errorHandlerMiddleware,
};
