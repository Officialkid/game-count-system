import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = global.__prisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma__ = prisma;
}

const TRANSIENT_ERROR_PATTERNS = [
  'P1001',
  'P1002',
  'P1008',
  'P1017',
  "Can't reach database server",
  'Server has closed the connection',
  'Connection terminated unexpectedly',
  'ECONNRESET',
  'ETIMEDOUT',
];

function isTransientDbError(error: unknown): boolean {
  if (!error) return false;
  const code = (error as { code?: string }).code ?? '';
  const msg = error instanceof Error ? error.message : String(error);
  return TRANSIENT_ERROR_PATTERNS.some(
    (pattern) => code === pattern || msg.includes(pattern)
  );
}

/**
 * Retries transient Neon PostgreSQL cold-start / network hiccups automatically.
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 2,
  delayMs = 400
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < retries && isTransientDbError(error)) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Prevents leaking database hostnames, connection strings, or internal Prisma stack details.
 */
export function sanitizeApiError(error: unknown, fallback = 'Temporary server error. Please try again.'): string {
  if (!error) return fallback;
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes('neon.tech') ||
    msg.includes('postgresql://') ||
    msg.includes("Can't reach database server") ||
    msg.includes('prisma.') ||
    msg.includes(':5432')
  ) {
    return 'Database connection temporarily unavailable. Please retry in a moment.';
  }
  return msg || fallback;
}

export default prisma;
