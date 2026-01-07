/**
 * Standardized API Response Helpers
 * Consistent response shapes across all endpoints
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  error: null;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'BAD_REQUEST' | 'INTERNAL_ERROR' | 'UNAUTHORIZED' | 'CONFLICT';
    message: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create success response
 */
export function successResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

/**
 * Create error response
 */
export function errorResponse(
  code: ApiErrorResponse['error']['code'],
  message: string
): ApiErrorResponse {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
    },
  };
}

/**
 * HTTP status codes for error types
 */
export const ERROR_STATUS_MAP: Record<ApiErrorResponse['error']['code'], number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  INTERNAL_ERROR: 500,
};
