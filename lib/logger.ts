// lib/logger.ts
// Structured logger for info and error events
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...meta,
      timestamp: new Date().toISOString(),
    }));
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.stack || error?.message || error,
      ...meta,
      timestamp: new Date().toISOString(),
    }));
  },
};
