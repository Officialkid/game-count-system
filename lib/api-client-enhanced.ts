// lib/api-client-enhanced.ts
// Enhanced API client with centralized error classification and handling
import { classifyError, AppError, ErrorType } from './errors';
import { apiClient } from './api-client';

/**
 * Enhanced API response wrapper that includes error classification
 */
export interface EnhancedApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
  raw?: any; // Original error response from server
}

/**
 * Classify and wrap all API errors consistently
 */
async function classifyApiResponse<T>(response: Response): Promise<EnhancedApiResponse<T>> {
  try {
    const data = await response.json();
    
    if (response.ok) {
      return {
        success: true,
        data: data.data || data, // Handle both wrapped and direct responses
      };
    }
    
    // Error response
    const error = classifyError(response);
    return {
      success: false,
      error,
      raw: data,
    };
  } catch (parseError) {
    // Failed to parse response body
    const error = classifyError(new Error(`Invalid server response: ${parseError}`));
    return {
      success: false,
      error,
    };
  }
}

/**
 * Throw error for failed API calls (for Promise-based error handling)
 */
function throwIfError<T>(response: EnhancedApiResponse<T>): T {
  if (!response.success && response.error) {
    throw response.error;
  }
  return response.data as T;
}

/**
 * Enhanced API client with automatic error classification
 */
export const enhancedApiClient = {
  /**
   * POST request with error classification
   */
  async post<T = any>(
    endpoint: string,
    data: any,
    token?: string
  ): Promise<EnhancedApiResponse<T>> {
    try {
      const response = await apiClient.post(endpoint, data, token);
      return classifyApiResponse<T>(response);
    } catch (error) {
      const appError = classifyError(error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: appError,
      };
    }
  },

  /**
   * GET request with error classification
   */
  async get<T = any>(
    endpoint: string,
    token?: string
  ): Promise<EnhancedApiResponse<T>> {
    try {
      const response = await apiClient.get(endpoint, token);
      return classifyApiResponse<T>(response);
    } catch (error) {
      const appError = classifyError(error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: appError,
      };
    }
  },

  /**
   * DELETE request with error classification
   */
  async delete<T = any>(
    endpoint: string,
    token?: string
  ): Promise<EnhancedApiResponse<T>> {
    try {
      const response = await apiClient.delete(endpoint, token);
      return classifyApiResponse<T>(response);
    } catch (error) {
      const appError = classifyError(error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: appError,
      };
    }
  },

  /**
   * PATCH request with error classification
   */
  async patch<T = any>(
    endpoint: string,
    data: any,
    token?: string
  ): Promise<EnhancedApiResponse<T>> {
    try {
      const response = await apiClient.patch(endpoint, data, token);
      return classifyApiResponse<T>(response);
    } catch (error) {
      const appError = classifyError(error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        error: appError,
      };
    }
  },

  /**
   * Helper to throw error if response failed
   * Usage: const data = throwIfError(await enhancedApiClient.get(...))
   */
  throwIfError,
};

/**
 * Hook-friendly async error handler for components
 * Usage: 
 *   const { data, error, loading } = await apiClient.getWithError(url)
 *   if (error) showToast(error.getUserMessage())
 */
export async function handleApiCall<T>(
  apiCall: Promise<EnhancedApiResponse<T>>
): Promise<{ data?: T; error?: AppError }> {
  try {
    const response = await apiCall;
    if (!response.success && response.error) {
      return { error: response.error };
    }
    return { data: response.data };
  } catch (error) {
    const appError = classifyError(error instanceof Error ? error : new Error(String(error)));
    return { error: appError };
  }
}

/**
 * Get user-friendly error message from API error
 * Shows different messages based on error type (network vs validation vs server)
 */
export function getErrorMessage(error?: AppError): string {
  if (!error) return 'An unexpected error occurred';
  
  const userMessage = error.getUserMessage();
  return userMessage || 'An unexpected error occurred';
}

/**
 * Check if error is recoverable (can be retried)
 * Usage: if (error?.isRecoverable()) { retryRequest(); }
 */
export function isRecoverableError(error?: AppError): boolean {
  return error?.isRecoverable() ?? false;
}
