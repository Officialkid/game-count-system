export interface DatabasePlatformConfig {
  provider: 'neon-postgres';
  runtime: 'nodejs';
  orm: 'prisma';
  storage: 'cloudflare-r2';
  hosting: 'vercel';
}

export const DATABASE_PLATFORM: DatabasePlatformConfig = {
  provider: 'neon-postgres',
  runtime: 'nodejs',
  orm: 'prisma',
  storage: 'cloudflare-r2',
  hosting: 'vercel',
};

export function getRequiredServerEnv() {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,
  };
}

export function validateDatabaseEnv(): string[] {
  const env = getRequiredServerEnv();
  const missing: string[] = [];

  if (!env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!env.NEXT_PUBLIC_APP_URL) missing.push('NEXT_PUBLIC_APP_URL');

  return missing;
}
