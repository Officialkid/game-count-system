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
  showToast: (message: string, type?: ToastMessage['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = (message: string, type: ToastMessage['type'] = 'info', duration = 3000) => {
    const toastOptions = {
      duration,
      style: {
        borderRadius: '8px',
        fontWeight: '500',
      },
    };

    switch (type) {
      case 'success':
        toast.success(message, {
          ...toastOptions,
          icon: '✅',
          style: {
            ...toastOptions.style,
            background: '#10B981',
            color: '#fff',
          },
        });
        break;
      case 'error':
        toast.error(message, {
          ...toastOptions,
          duration: 4000,
          icon: '❌',
          style: {
            ...toastOptions.style,
            background: '#EF4444',
            color: '#fff',
          },
        });
        break;
      case 'warning':
        toast(message, {
          ...toastOptions,
          icon: '⚠️',
          style: {
            ...toastOptions.style,
            background: '#F59E0B',
            color: '#fff',
          },
        });
        break;
      case 'info':
      default:
        toast(message, {
          ...toastOptions,
          icon: 'ℹ️',
          style: {
            ...toastOptions.style,
            background: '#3B82F6',
            color: '#fff',
          },
        });
        break;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </ToastContext.Provider>
  );
}

// Export helper for direct toast usage
export { toast };
