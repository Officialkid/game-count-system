/**
 * API Response Helpers
 * Standardized response format for all API routes
 */

import { NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ============================================================================
// SUCCESS RESPONSES
// ============================================================================

export function success<T>(data: T, message?: string, status: number = HTTP_STATUS.OK) {
  return NextResponse.json<SuccessResponse<T>>(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function created<T>(data: T, message?: string) {
  return success(data, message, HTTP_STATUS.CREATED);
}

export function noContent() {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export function error(
  errorMessage: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code?: string,
  details?: any
) {
  return NextResponse.json<ErrorResponse>(
    {
      success: false,
      error: errorMessage,
      code,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function badRequest(message: string, details?: any) {
  return error(message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', details);
}

export function unauthorized(message: string = 'Unauthorized') {
  return error(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
}

export function forbidden(message: string = 'Forbidden') {
  return error(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
}

export function notFound(message: string = 'Resource not found') {
  return error(message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
}

export function conflict(message: string, details?: any) {
  return error(message, HTTP_STATUS.CONFLICT, 'CONFLICT', details);
}

export function validationError(message: string, details?: any) {
  return error(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', details);
}

export function internalError(message: string = 'Internal server error', details?: any) {
  return error(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', details);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle API errors consistently
 */
export function handleApiError(err: any) {
  console.error('API Error:', err);
  
  // Firebase errors
  if (err.code) {
    switch (err.code) {
      case 'permission-denied':
        return forbidden('Permission denied');
      case 'not-found':
        return notFound('Resource not found');
      case 'already-exists':
        return conflict('Resource already exists');
      case 'invalid-argument':
        return badRequest('Invalid argument');
      default:
        return internalError(err.message);
    }
  }
  
  // Validation errors
  if (err.errors) {
    return validationError('Validation failed', err.errors);
  }
  
  // Generic errors
  return internalError(err.message || 'An unexpected error occurred');
}

/**
 * Validate request method
 */
export function validateMethod(request: Request, allowedMethods: string[]) {
  if (!allowedMethods.includes(request.method)) {
    throw new Error(`Method ${request.method} not allowed`);
  }
}

/**
 * Parse JSON body with error handling
 */
export async function parseBody<T = any>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch (err) {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Extract query parameters
 */
export function getQueryParam(url: string, param: string): string | null {
  const urlObj = new URL(url);
  return urlObj.searchParams.get(param);
}

/**
 * Extract multiple query parameters
 */
export function getQueryParams(url: string, params: string[]): Record<string, string | null> {
  const urlObj = new URL(url);
  const result: Record<string, string | null> = {};
  
  params.forEach(param => {
    result[param] = urlObj.searchParams.get(param);
  });
  
  return result;
}

// ============================================================================
// BACKWARDS COMPATIBILITY ALIASES
// ============================================================================

// Old function names for compatibility with existing code
export const successResponse = success;

// errorResponse compatibility wrapper (old signature: code, message)
export function errorResponse(code: string, message: string) {
  // Map old codes to new status codes
  const statusMap: Record<string, number> = {
    'UNAUTHORIZED': HTTP_STATUS.UNAUTHORIZED,
    'FORBIDDEN': HTTP_STATUS.FORBIDDEN,
    'NOT_FOUND': HTTP_STATUS.NOT_FOUND,
    'BAD_REQUEST': HTTP_STATUS.BAD_REQUEST,
    'CONFLICT': HTTP_STATUS.CONFLICT,
    'VALIDATION_ERROR': HTTP_STATUS.UNPROCESSABLE_ENTITY,
    'INTERNAL_ERROR': HTTP_STATUS.INTERNAL_SERVER_ERROR,
  };
  
  const status = statusMap[code] || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  return error(message, status, code);
}

export const ERROR_STATUS_MAP = HTTP_STATUS;
