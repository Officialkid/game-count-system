/**
 * Token Generation Utilities
 * Cryptographically secure tokens for event access control
 */

import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure random token
 * @param length - Byte length (default: 32 bytes = 64 hex chars)
 * @returns Hex-encoded token string
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate URL-safe token (base64url encoding)
 * @param length - Byte length (default: 32)
 * @returns URL-safe token string
 */
export function generateUrlSafeToken(length: number = 32): string {
  return randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate all three tokens for a new event
 * @returns Object with admin, scorer, and public tokens
 */
export function generateEventTokens(): {
  admin_token: string;
  scorer_token: string;
  public_token: string;
} {
  return {
    admin_token: generateToken(32),
    scorer_token: generateToken(32),
    public_token: generateToken(24), // Shorter for easier sharing
  };
}

/**
 * Validate token format (basic check)
 * @param token - Token string to validate
 * @returns true if token format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  // Check if token is hex string of reasonable length
  return /^[a-f0-9]{32,128}$/i.test(token);
}

/**
 * Compare tokens securely (timing-safe)
 * @param a - First token
 * @param b - Second token
 * @returns true if tokens match
 */
export function compareTokens(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  // Timing-safe comparison
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}
