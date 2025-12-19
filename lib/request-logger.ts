// lib/request-logger.ts
/**
 * API request/response logging for debugging, monitoring, and audit trails.
 * Logs are sent to audit_logs table and/or console for development.
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTPayload } from './types';

export interface RequestLogContext {
  method: string;
  path: string;
  status?: number;
  duration?: number;
  userId?: string;
  error?: string | Error;
  metadata?: Record<string, any>;
}

/**
 * Extract client IP from request (handles proxies and CDNs)
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-client-ip') ||
    'unknown'
  );
}

/**
 * Extract user agent
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Log API request start
 */
export function logRequestStart(
  request: NextRequest,
  user?: JWTPayload
) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const path = new URL(request.url).pathname;
  const userId = user?.userId;
  const ip = getClientIp(request);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[${timestamp}] ${method} ${path} (user: ${userId}, ip: ${ip})`);
  }

  return { startTime: Date.now(), ip, timestamp };
}

/**
 * Log API request completion
 */
export async function logRequestEnd(
  context: RequestLogContext,
  request: NextRequest,
  user?: JWTPayload
) {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);
  const timestamp = new Date().toISOString();

  if (process.env.NODE_ENV === 'development') {
    const level = context.status && context.status >= 400 ? '❌' : '✓';
    console.log(
      `[${timestamp}] ${level} ${context.method} ${context.path} - ${context.status} (${context.duration}ms)`
    );
    if (context.error) {
      console.error(`  Error: ${context.error}`);
    }
  }

  // Determine entity type based on path
  let entityType: 'auth' | 'event' | 'team' | 'score' | 'user' | 'settings' | 'template' = 'user';
  if (context.path.includes('/auth/')) entityType = 'auth';
  else if (context.path.includes('/events')) entityType = 'event';
  else if (context.path.includes('/teams')) entityType = 'team';
  else if (context.path.includes('/scores')) entityType = 'score';
  else if (context.path.includes('/settings')) entityType = 'settings';
  else if (context.path.includes('/templates')) entityType = 'template';

  // Log to audit trail if it's a write operation or an error
  const isWriteOp = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(context.method);
  const isError = context.status && context.status >= 400;

  // DB logging disabled; console output above serves as audit trace during development
  // Integrate with Appwrite audit collection if needed in the future.
}

/**
 * Middleware wrapper for automatic request/response logging
 */
export async function withRequestLogging(
  handler: (request: NextRequest, user?: JWTPayload) => Promise<NextResponse>,
  user?: JWTPayload
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { startTime, ip } = logRequestStart(request, user);

    try {
      const response = await handler(request, user);
      const duration = Date.now() - startTime;

      await logRequestEnd(
        {
          method: request.method,
          path: new URL(request.url).pathname,
          status: response.status,
          duration,
          userId: user?.userId,
        },
        request,
        user
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Request error after ${duration}ms:`, error);

      await logRequestEnd(
        {
          method: request.method,
          path: new URL(request.url).pathname,
          status: 500,
          duration,
          userId: user?.userId,
          error: error instanceof Error ? error.message : String(error),
        },
        request,
        user
      );

      throw error;
    }
  };
}

/**
 * Export structured log format
 */
export interface StructuredLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
  context?: Record<string, any>;
}

export function structuredLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  component: string,
  message: string,
  context?: Record<string, any>
): StructuredLog {
  return {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    context,
  };
}
