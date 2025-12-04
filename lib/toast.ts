// lib/toast.ts
import toast, { Toaster as HotToaster } from 'react-hot-toast';

// Toast configuration
const toastConfig = {
  success: {
    duration: 3000,
    icon: '✅',
    style: {
      background: '#10B981',
      color: '#FFF',
    },
  },
  error: {
    duration: 4000,
    icon: '❌',
    style: {
      background: '#EF4444',
      color: '#FFF',
    },
  },
  loading: {
    icon: '⏳',
    style: {
      background: '#3B82F6',
      color: '#FFF',
    },
  },
  info: {
    duration: 3000,
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#FFF',
    },
  },
};

export const showToast = {
  success: (message: string) => {
    toast.success(message, toastConfig.success);
  },
  error: (message: string) => {
    toast.error(message, toastConfig.error);
  },
  loading: (message: string) => {
    return toast.loading(message, toastConfig.loading);
  },
  info: (message: string) => {
    toast(message, toastConfig.info);
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};

// Export Toaster component
export { HotToaster as Toaster };
