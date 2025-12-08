// lib/middleware.ts
import { NextRequest } from 'next/server';
import { auth } from './auth';
import { JWTPayload } from './types';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function authenticateRequest(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization');
  const token = auth.extractToken(authHeader);
  
  if (!token) {
    return null;
  }

  return auth.verifyToken(token);
}

export function requireAuth(
  request: NextRequest,
  options?: { requiredRole?: 'admin' | 'user' }
): { 
  authenticated: false; 
  error: Response 
} | { 
  authenticated: true; 
  user: JWTPayload;
  newToken?: string;
} {
  const user = authenticateRequest(request);
  
  if (!user) {
    logAuthAttempt(request, false, 'Invalid or missing token');
    return {
      authenticated: false,
      error: Response.json(
        { success: false, error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      ),
    };
  }

  // Check role if required
  if (options?.requiredRole) {
    const userRole = user.role || 'user';
    if (options.requiredRole === 'admin' && userRole !== 'admin') {
      logAuthAttempt(request, false, `Insufficient permissions: required ${options.requiredRole}, got ${userRole}`);
      return {
        authenticated: false,
        error: Response.json(
          { success: false, error: 'Forbidden - Insufficient permissions' },
          { status: 403 }
        ),
      };
    }
  }

  // Check if token needs refresh
  const authHeader = request.headers.get('authorization');
  const token = auth.extractToken(authHeader);
  let newToken: string | undefined;
  if (token) {
    newToken = auth.refreshTokenIfNeeded(token) || undefined;
  }

  logAuthAttempt(request, true);
  return { authenticated: true, user, newToken };
}

/**
 * Log authentication attempts for security monitoring
 */
function logAuthAttempt(
  request: NextRequest,
  success: boolean,
  reason?: string
) {
  const timestamp = new Date().toISOString();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const url = request.url;
  const method = request.method;

  const logEntry = {
    timestamp,
    ip,
    method,
    url,
    success,
    reason: reason || (success ? 'Authenticated' : 'Failed'),
  };

  // In production, send to logging service (e.g., CloudWatch, Datadog)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with logging service
    console.log('[AUTH]', JSON.stringify(logEntry));
  } else {
    const emoji = success ? '✅' : '❌';
    console.log(`${emoji} [AUTH] ${method} ${url} - ${logEntry.reason} (IP: ${ip})`);
  }
}

/**
 * Helper to create a Response with refreshed token in header
 */
export function createAuthResponse(
  body: any,
  options: { status?: number; newToken?: string } = {}
): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (options.newToken) {
    headers['X-Refreshed-Token'] = options.newToken;
  }

  return new Response(JSON.stringify(body), {
    status: options.status || 200,
    headers,
  });
}

/**
 * Check if user has required permission for an event operation
 * Returns admin role and permissions or error response
 */
export async function requireEventPermission(
  request: NextRequest,
  eventId: string,
  requiredPermission: keyof import('./types').AdminPermissions
): Promise<{
  authenticated: false;
  error: Response;
} | {
  authenticated: true;
  user: JWTPayload;
  role: string;
  permissions: import('./types').AdminPermissions;
  newToken?: string;
}> {
  // First check authentication
  const authResult = requireAuth(request);
  if (!authResult.authenticated) {
    return authResult;
  }

  const { user, newToken } = authResult;

  // Import db methods dynamically to avoid circular dependency
  const { getAdminRole, getAdminPermissions } = await import('./db');

  // Check if user is admin of this event
  const role = await getAdminRole(eventId, user.userId);
  if (!role) {
    return {
      authenticated: false,
      error: Response.json(
        { success: false, error: 'Forbidden - You are not an administrator of this event' },
        { status: 403 }
      ),
    };
  }

  // Get permissions for this role
  const permissions = getAdminPermissions(role);

  // Check specific permission
  if (!permissions[requiredPermission]) {
    return {
      authenticated: false,
      error: Response.json(
        { success: false, error: `Forbidden - Your role (${role}) does not have permission to ${requiredPermission}` },
        { status: 403 }
      ),
    };
  }

  return {
    authenticated: true,
    user,
    role,
    permissions,
    newToken,
  };
}
