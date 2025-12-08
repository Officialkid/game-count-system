// lib/auth.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWTPayload } from './types';

// SECURITY: Validate JWT_SECRET on startup
if (!process.env.JWT_SECRET) {
  throw new Error(
    '❌ CRITICAL: JWT_SECRET is not defined in environment variables!\n' +
    '   Run: npm run generate-secret\n' +
    '   Then add JWT_SECRET to your .env file'
  );
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error(
    `❌ CRITICAL: JWT_SECRET must be at least 32 characters long!\n` +
    `   Current length: ${process.env.JWT_SECRET.length}\n` +
    `   Run: npm run generate-secret\n` +
    `   Then add the generated secret to your .env file`
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

// Dummy hash for timing attack prevention
const DUMMY_HASH = '$2b$10$' + 'X'.repeat(53); // Valid bcrypt hash format

export const auth = {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  // Verify password with timing attack prevention
  // Always performs bcrypt comparison even for non-existent users
  async verifyPasswordSafe(password: string, hash: string | null): Promise<boolean> {
    const hashToCompare = hash || DUMMY_HASH;
    const result = await bcrypt.compare(password, hashToCompare);
    // If hash was null (user doesn't exist), always return false
    return hash !== null && result;
  },

  // Generate JWT access token (short-lived)
  generateToken(payload: JWTPayload, expiresIn: string = '15m'): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
  },

  // Generate refresh token (long-lived)
  generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  },

  // Verify JWT token
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      return null;
    }
  },

  // Extract token from Authorization header
  extractToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  },

  // Check if token is expired or expiring soon (within 5 minutes)
  isTokenExpiring(token: string, thresholdMinutes: number = 5): boolean {
    try {
      const payload = jwt.decode(token) as JWTPayload | null;
      if (!payload || !payload.exp) return true;
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = payload.exp - now;
      return expiresIn <= thresholdMinutes * 60;
    } catch (error) {
      return true;
    }
  },

  // Refresh token if expiring soon
  refreshTokenIfNeeded(token: string): string | null {
    if (this.isTokenExpiring(token)) {
      const payload = this.verifyToken(token);
      if (payload) {
        // Remove iat/exp before re-signing
        const { iat, exp, ...rest } = payload;
        return this.generateToken(rest as JWTPayload);
      }
    }
    return null;
  },
};
