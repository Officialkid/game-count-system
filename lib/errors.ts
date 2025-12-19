/**
 * Error Classification & Handling System
 * Provides consistent error types, messages, and recovery suggestions
 */

export enum ErrorType {
  AUTH_REQUIRED = 'AUTH_REQUIRED',           // 401 - User needs to log in
  PERMISSION_DENIED = 'PERMISSION_DENIED',   // 403 - User logged in but not allowed
  NOT_FOUND = 'NOT_FOUND',                   // 404 - Resource doesn't exist
  SERVER_ERROR = 'SERVER_ERROR',             // 5xx - Server problem
  NETWORK_ERROR = 'NETWORK_ERROR',           // Network timeout/offline
  RATE_LIMITED = 'RATE_LIMITED',             // 429 - Too many requests
  VALIDATION_ERROR = 'VALIDATION_ERROR',     // 400 - Bad input
  CONFLICT = 'CONFLICT',                     // 409 - Duplicate/conflict
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',           // Catch-all
}

// Keep old enum for backwards compatibility
export enum APIErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  DEPRECATED = 'DEPRECATED',
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }

  /**
   * Check if error is worth retrying
   */
  isRecoverable(): boolean {
    return [
      ErrorType.NETWORK_ERROR,
      ErrorType.RATE_LIMITED,
      ErrorType.SERVER_ERROR,
    ].includes(this.type);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.AUTH_REQUIRED:
        return 'Please log in to continue';
      case ErrorType.PERMISSION_DENIED:
        return 'You do not have permission to perform this action';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found';
      case ErrorType.NETWORK_ERROR:
        return 'Network error. Please check your connection and try again.';
      case ErrorType.RATE_LIMITED:
        return 'Too many requests. Please wait a moment before trying again.';
      case ErrorType.SERVER_ERROR:
        return 'Server error. Please try again later.';
      case ErrorType.VALIDATION_ERROR:
        return `Invalid input: ${this.message}`;
      case ErrorType.CONFLICT:
        return 'This item already exists. Please use a different name.';
      default:
        return this.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

export interface APIError {
  code: APIErrorCode;
  message: string;
  details?: any;
}

/**
 * Classify a response or error into AppError
 * @param response - Fetch response or Error object
 * @returns AppError with appropriate type and message
 */
export function classifyError(response: Response | Error): AppError {
  // Handle network/fetch errors
  if (response instanceof Error) {
    const message = response.message.toLowerCase();
    
    if (message.includes('fetch failed') || 
        message.includes('econnrefused') ||
        message.includes('timeout') ||
        message.includes('network')) {
      return new AppError(
        ErrorType.NETWORK_ERROR,
        'Network connection failed',
        undefined,
        response
      );
    }
    
    if (message.includes('abort')) {
      return new AppError(
        ErrorType.NETWORK_ERROR,
        'Request timed out',
        undefined,
        response
      );
    }

    return new AppError(
      ErrorType.UNKNOWN_ERROR,
      response.message || 'An unexpected error occurred',
      undefined,
      response
    );
  }

  // Handle HTTP response errors
  if (response instanceof Response) {
    const statusCode = response.status;

    if (statusCode === 400) {
      return new AppError(
        ErrorType.VALIDATION_ERROR,
        'Invalid request - please check your input',
        statusCode
      );
    }

    if (statusCode === 401) {
      return new AppError(
        ErrorType.AUTH_REQUIRED,
        'Authentication required - please log in',
        401
      );
    }

    if (statusCode === 403) {
      return new AppError(
        ErrorType.PERMISSION_DENIED,
        'You do not have permission for this action',
        403
      );
    }

    if (statusCode === 404) {
      return new AppError(
        ErrorType.NOT_FOUND,
        'Resource not found',
        404
      );
    }

    if (statusCode === 409) {
      return new AppError(
        ErrorType.CONFLICT,
        'This item already exists',
        409
      );
    }

    if (statusCode === 429) {
      return new AppError(
        ErrorType.RATE_LIMITED,
        'Too many requests - please wait before trying again',
        429
      );
    }

    if (statusCode >= 500) {
      return new AppError(
        ErrorType.SERVER_ERROR,
        `Server error (${statusCode})`,
        statusCode
      );
    }

    // Default HTTP error
    return new AppError(
      ErrorType.UNKNOWN_ERROR,
      `HTTP Error ${statusCode}`,
      statusCode
    );
  }

  return new AppError(
    ErrorType.UNKNOWN_ERROR,
    'An unexpected error occurred'
  );
}
