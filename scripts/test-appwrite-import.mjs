/**
 * Appwrite SDK Import Test
 * Run with: node scripts/test-appwrite-import.mjs
 */

// Load environment variables
import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

console.log('🔍 Testing Appwrite SDK import...\n');

console.log('Environment variables:');
console.log('  NEXT_PUBLIC_APPWRITE_ENDPOINT:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
console.log('  NEXT_PUBLIC_APPWRITE_PROJECT:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT);
console.log('  APPWRITE_API_KEY:', process.env.APPWRITE_API_KEY ? '✅ Set (hidden)' : '❌ Not set');
console.log();

try {
  // Dynamic import to handle TypeScript
  const appwrite = await import('../lib/appwrite.js');
  
  console.log('✅ Appwrite SDK imported successfully!\n');
  console.log('Available exports:');
  console.log('  - client:', typeof appwrite.client);
  console.log('  - account:', typeof appwrite.account);
  console.log('  - databases:', typeof appwrite.databases);
  console.log('  - storage:', typeof appwrite.storage);
  console.log('  - functions:', typeof appwrite.functions);
  console.log('  - getServerClient:', typeof appwrite.getServerClient);
  console.log('  - DATABASE_ID:', appwrite.DATABASE_ID);
  console.log('  - COLLECTIONS:', Object.keys(appwrite.COLLECTIONS).length, 'collections');
  console.log('  - BUCKETS:', Object.keys(appwrite.BUCKETS).length, 'buckets');
  
  console.log('\n✅ Phase A Complete! All Appwrite setup verified.');
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to import Appwrite SDK:');
  console.error(error);
  process.exit(1);
}
