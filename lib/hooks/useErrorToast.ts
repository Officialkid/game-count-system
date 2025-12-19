// lib/hooks/useErrorToast.ts
// Hook for displaying API errors with proper classification and user-friendly messages
import { useCallback, useState } from 'react';
import { AppError } from '@/lib/errors';

interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

/**
 * Hook to manage error notifications in components
 * Automatically converts AppError to user-friendly messages
 */
export function useErrorToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showError = useCallback((error: AppError | Error | string, title?: string) => {
    let message = '';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof AppError) {
      message = error.getUserMessage();
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = 'An unexpected error occurred';
    }

    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastMessage = {
      id,
      type: 'error',
      title: title || 'Error',
      message,
      duration: 5000, // Auto-dismiss after 5 seconds
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove after duration
    if (toast.duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration);
    }

    return id;
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastMessage = {
      id,
      type: 'success',
      title: title || 'Success',
      message,
      duration: 3000,
    };

    setToasts(prev => [...prev, toast]);

    if (toast.duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    showError,
    showSuccess,
    removeToast,
  };
}
