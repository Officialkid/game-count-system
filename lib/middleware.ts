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

export function requireAuth(request: NextRequest): { 
  authenticated: false; 
  error: Response 
} | { 
  authenticated: true; 
  user: JWTPayload 
} {
  const user = authenticateRequest(request);
  
  if (!user) {
    return {
      authenticated: false,
      error: Response.json(
        { success: false, error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      ),
    };
  }

  return { authenticated: true, user };
}
