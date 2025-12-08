// components/ui/Toast.tsx
'use client';

import React, { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastMessage['type'],
    options?: { duration?: number; learnMoreHref?: string }
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = (
    message: string,
    type: ToastMessage['type'] = 'info',
    options: { duration?: number; learnMoreHref?: string } = {}
  ) => {
    const { duration, learnMoreHref } = options;
    const content = (
      <div className="flex flex-col gap-1">
        <span>{message}</span>
        {learnMoreHref && (
          <a
            href={learnMoreHref}
            className="underline text-white/90 text-xs"
            target="_blank"
            rel="noreferrer"
          >
            Learn more
          </a>
        )}
      </div>
    );

    const sharedStyle = {
      borderRadius: '12px',
      fontWeight: 600,
      whiteSpace: 'pre-line' as const,
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      padding: '14px 16px',
    };

    const byType: Record<ToastMessage['type'], { icon: string; background: string; duration: number }> = {
      success: { icon: '✅', background: '#10B981', duration: 5000 },
      error: { icon: '❌', background: '#EF4444', duration: 8000 },
      warning: { icon: '⚠️', background: '#F59E0B', duration: 6000 },
      info: { icon: 'ℹ️', background: '#3B82F6', duration: 5000 },
    };

    const style = {
      ...sharedStyle,
      background: byType[type].background,
      color: '#fff',
    };

    const toastOptions = {
      duration: duration ?? byType[type].duration,
      style,
      icon: byType[type].icon,
    };

    if (type === 'success') return toast.success(content, toastOptions);
    if (type === 'error') return toast.error(content, toastOptions);
    return toast(content, toastOptions);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#3B82F6',
            color: '#fff',
            borderRadius: '12px',
            whiteSpace: 'pre-line',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          },
        }}
      />
    </ToastContext.Provider>
  );
}

// Export helper for direct toast usage
export { toast };
