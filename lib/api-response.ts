// lib/api-response.ts
/**
 * Standardized API response wrapper for consistency across all endpoints.
 * Provides success/error responses with proper status codes.
 */

import { NextResponse } from 'next/server';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Success response (200, 201, etc.)
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): [body: SuccessResponse<T>, statusCode: number] {
  return [
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    status,
  ];
}

/**
 * Error response (400, 401, 403, 404, 500, etc.)
 */
export function errorResponse(
  error: string,
  code?: string,
  details?: Record<string, any>,
  status: number = 400
): [body: ErrorResponse, statusCode: number] {
  return [
    {
      success: false,
      error,
      code: code || error.toLowerCase().replace(/\s+/g, '_'),
      details,
      timestamp: new Date().toISOString(),
    },
    status,
  ];
}

/**
 * HTTP 400 Bad Request
 */
export function badRequest(error: string, details?: Record<string, any>) {
  return errorResponse(error, 'bad_request', details, 400);
}

/**
 * HTTP 401 Unauthorized
 */
export function unauthorized(error: string = 'Unauthorized', details?: Record<string, any>) {
  return errorResponse(error, 'unauthorized', details, 401);
}

/**
 * HTTP 403 Forbidden
 */
export function forbidden(error: string = 'Forbidden', details?: Record<string, any>) {
  return errorResponse(error, 'forbidden', details, 403);
}

/**
 * HTTP 404 Not Found
 */
export function notFound(error: string = 'Not Found', details?: Record<string, any>) {
  return errorResponse(error, 'not_found', details, 404);
}

/**
 * HTTP 409 Conflict
 */
export function conflict(error: string, details?: Record<string, any>) {
  return errorResponse(error, 'conflict', details, 409);
}

/**
 * HTTP 422 Unprocessable Entity
 */
export function unprocessableEntity(error: string, details?: Record<string, any>) {
  return errorResponse(error, 'unprocessable_entity', details, 422);
}

/**
 * HTTP 429 Too Many Requests
 */
export function tooManyRequests(error: string = 'Too Many Requests', retryAfter?: number) {
  return errorResponse(error, 'rate_limited', retryAfter ? { retryAfter } : undefined, 429);
}

/**
 * HTTP 500 Internal Server Error
 */
export function internalError(error: string = 'Internal Server Error', details?: Record<string, any>) {
  return errorResponse(error, 'internal_server_error', details, 500);
}

/**
 * Create NextResponse from [body, status] tuple
 */
export function toNextResponse<T>(
  [body, status]: [body: APIResponse<T>, statusCode: number],
  headers?: Record<string, string>
): NextResponse<APIResponse<T>> {
  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Convenience: create success NextResponse
 */
export function successJSON<T>(
  data: T,
  message?: string,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  return toNextResponse(successResponse(data, message, status), headers) as NextResponse;
}

/**
 * Convenience: create error NextResponse
 */
export function errorJSON(
  error: string,
  status: number = 400,
  code?: string,
  details?: Record<string, any>,
  headers?: Record<string, string>
): NextResponse {
  return toNextResponse(errorResponse(error, code, details, status), headers) as NextResponse;
}
