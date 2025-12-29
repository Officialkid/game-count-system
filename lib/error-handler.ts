/**
 * Global Error Handler for Appwrite API calls
 * Handles session expiry and other common errors
 */

export function handleAppwriteError(err: any, context?: string) {
  const code = err?.code || err?.response?.code;
  const message = err?.message || err?.response?.message || '';
  
  console.error(`[${context || 'API'}] Error:`, { code, message, err });
  
  // Handle session expiry - redirect to login
  if (code === 401) {
    console.error(`[${context || 'API'}] ❌ Session expired or unauthorized`);
    
    // Trigger re-authentication
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/debug/auth' && currentPath !== '/') {
        window.location.href = `/debug/auth?returnUrl=${encodeURIComponent(currentPath)}`;
      }
    }
    
    return { success: false, error: 'Session expired. Please log in again.' };
  }
  
  // Handle other common errors
  if (code === 429) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }
  
  if (code === 404) {
    return { success: false, error: 'Resource not found.' };
  }
  
  if (code === 403) {
    return { success: false, error: 'Access denied.' };
  }
  
  return { success: false, error: message || 'An unexpected error occurred.' };
}

export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (err: any) {
      return handleAppwriteError(err, context) as R;
    }
  };
}