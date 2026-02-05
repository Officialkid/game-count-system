/**
 * Token Generation and Validation Utilities
 * Secure token-based access control system
 */

import crypto from 'crypto';

export type TokenType = 'admin' | 'scorer' | 'viewer';

export interface TokenPermissions {
  canEditEvent: boolean;
  canAddTeams: boolean;
  canDeleteTeams: boolean;
  canSubmitScores: boolean;
  canEditScores: boolean;
  canDeleteScores: boolean;
  canFinalizeEvent: boolean;
  canViewScoreboard: boolean;
}

/**
 * Permission sets for each token type
 */
export const TOKEN_PERMISSIONS: Record<TokenType, TokenPermissions> = {
  admin: {
    canEditEvent: true,
    canAddTeams: true,
    canDeleteTeams: true,
    canSubmitScores: true,
    canEditScores: true,
    canDeleteScores: true,
    canFinalizeEvent: true,
    canViewScoreboard: true,
  },
  scorer: {
    canEditEvent: false,
    canAddTeams: false,
    canDeleteTeams: false,
    canSubmitScores: true,
    canEditScores: false,
    canDeleteScores: false,
    canFinalizeEvent: false,
    canViewScoreboard: true,
  },
  viewer: {
    canEditEvent: false,
    canAddTeams: false,
    canDeleteTeams: false,
    canSubmitScores: false,
    canEditScores: false,
    canDeleteScores: false,
    canFinalizeEvent: false,
    canViewScoreboard: true,
  },
};

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  // Use crypto.randomUUID for secure token generation
  // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (remove dashes for cleaner URLs)
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Hash a token using SHA-256
 * @param token - The plain text token
 * @returns Hashed token (hex string)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify if a plain token matches a hashed token
 */
export function verifyToken(plainToken: string, hashedToken: string): boolean {
  const hash = hashToken(plainToken);
  return hash === hashedToken;
}

/**
 * Generate all tokens for a new event
 * @returns Object with plain tokens (to return to user) and hashed tokens (to store)
 */
export function generateEventTokens() {
  const adminToken = generateToken();
  const scorerToken = generateToken();
  const viewerToken = generateToken();

  return {
    // Plain tokens - return these to user ONCE
    plain: {
      admin_token: adminToken,
      scorer_token: scorerToken,
      public_token: viewerToken,
    },
    // Hashed tokens - store these in Firestore
    hashed: {
      admin_token_hash: hashToken(adminToken),
      scorer_token_hash: hashToken(scorerToken),
      public_token_hash: hashToken(viewerToken),
    },
  };
}

/**
 * Determine token type and permissions from event data
 */
export function validateTokenAccess(
  providedToken: string,
  event: {
    admin_token_hash: string;
    scorer_token_hash: string;
    public_token_hash: string;
  }
): { valid: boolean; tokenType: TokenType | null; permissions: TokenPermissions | null } {
  const tokenHash = hashToken(providedToken);

  // Check admin token
  if (tokenHash === event.admin_token_hash) {
    return {
      valid: true,
      tokenType: 'admin',
      permissions: TOKEN_PERMISSIONS.admin,
    };
  }

  // Check scorer token
  if (tokenHash === event.scorer_token_hash) {
    return {
      valid: true,
      tokenType: 'scorer',
      permissions: TOKEN_PERMISSIONS.scorer,
    };
  }

  // Check viewer token
  if (tokenHash === event.public_token_hash) {
    return {
      valid: true,
      tokenType: 'viewer',
      permissions: TOKEN_PERMISSIONS.viewer,
    };
  }

  // Invalid token
  return {
    valid: false,
    tokenType: null,
    permissions: null,
  };
}

/**
 * Generate shareable link for an event with token
 */
export function generateShareLink(
  eventId: string,
  token: string,
  tokenType: TokenType,
  baseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
): string {
  const paths: Record<TokenType, string> = {
    admin: `/admin/${token}`,
    scorer: `/score/${token}`,
    viewer: `/public/${token}`,
  };

  const path = paths[tokenType];
  return `${baseUrl}${path}`;
}

/**
 * Extract token from URL or headers
 */
export function extractToken(
  searchParams: URLSearchParams | null,
  headers?: Headers
): string | null {
  // Try URL parameter first
  if (searchParams) {
    const urlToken = searchParams.get('token');
    if (urlToken) return urlToken;
  }

  // Try Authorization header
  if (headers) {
    const authHeader = headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }

  return null;
}

/**
 * Get user-friendly token type name
 */
export function getTokenTypeName(tokenType: TokenType): string {
  const names: Record<TokenType, string> = {
    admin: 'Administrator',
    scorer: 'Score Keeper',
    viewer: 'Viewer',
  };
  return names[tokenType];
}

/**
 * Get token type description
 */
export function getTokenTypeDescription(tokenType: TokenType): string {
  const descriptions: Record<TokenType, string> = {
    admin: 'Full control - Can manage event, teams, and scores',
    scorer: 'Score submission - Can add and view scores',
    viewer: 'View only - Can view scoreboard',
  };
  return descriptions[tokenType];
}

/**
 * Get token type color for UI
 */
export function getTokenTypeColor(tokenType: TokenType): string {
  const colors: Record<TokenType, string> = {
    admin: '#EF4444', // Red
    scorer: '#F59E0B', // Amber
    viewer: '#10B981', // Green
  };
  return colors[tokenType];
}
