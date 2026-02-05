/**
 * Token Validation Middleware for API Routes
 * Use this to protect API endpoints with token-based access control
 */

import { NextResponse } from 'next/server';
import { adminGetDocument } from './firestore-admin-helpers';
import { COLLECTIONS } from './firebase-collections';
import { validateTokenAccess, extractToken, TokenType, TokenPermissions } from './token-utils';

export interface TokenValidationResult {
  valid: boolean;
  tokenType: TokenType | null;
  permissions: TokenPermissions | null;
  event: any | null;
  error?: string;
}

/**
 * Validate token for an event
 * Use this in API routes to protect endpoints
 */
export async function validateEventToken(
  eventId: string,
  token: string | null
): Promise<TokenValidationResult> {
  // Check if token is provided
  if (!token) {
    return {
      valid: false,
      tokenType: null,
      permissions: null,
      event: null,
      error: 'No token provided',
    };
  }

  // Get event from Firestore
  const event = await adminGetDocument(COLLECTIONS.EVENTS, eventId);

  if (!event) {
    return {
      valid: false,
      tokenType: null,
      permissions: null,
      event: null,
      error: 'Event not found',
    };
  }

  // Validate token
  const validation = validateTokenAccess(token, event as any);

  if (!validation.valid) {
    return {
      valid: false,
      tokenType: null,
      permissions: null,
      event: null,
      error: 'Invalid token',
    };
  }

  return {
    valid: true,
    tokenType: validation.tokenType,
    permissions: validation.permissions,
    event,
  };
}

/**
 * Middleware to require admin access
 */
export async function requireAdminToken(
  eventId: string,
  token: string | null
): Promise<TokenValidationResult | NextResponse> {
  const validation = await validateEventToken(eventId, token);

  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  if (validation.tokenType !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Admin access required' },
      { status: 403 }
    );
  }

  return validation;
}

/**
 * Middleware to require scorer or admin access
 */
export async function requireScorerToken(
  eventId: string,
  token: string | null
): Promise<TokenValidationResult | NextResponse> {
  const validation = await validateEventToken(eventId, token);

  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!['admin', 'scorer'].includes(validation.tokenType || '')) {
    return NextResponse.json(
      { success: false, error: 'Scorer or admin access required' },
      { status: 403 }
    );
  }

  return validation;
}

/**
 * Middleware to require any valid token (admin, scorer, or viewer)
 */
export async function requireAnyToken(
  eventId: string,
  token: string | null
): Promise<TokenValidationResult | NextResponse> {
  const validation = await validateEventToken(eventId, token);

  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return validation;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  permissions: TokenPermissions | null,
  permission: keyof TokenPermissions
): boolean {
  return permissions?.[permission] === true;
}
