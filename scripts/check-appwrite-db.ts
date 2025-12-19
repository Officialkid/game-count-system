#!/usr/bin/env tsx
/**
 * Check Appwrite Database and Collections
 * Verifies that required database and collections exist before migration
 * 
 * Note: Uses fetch API to call Appwrite REST directly since Web SDK doesn't support API keys
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !project || !apiKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_APPWRITE_ENDPOINT:', endpoint ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_APPWRITE_PROJECT:', project ? '✓' : '✗');
  console.error('   APPWRITE_API_KEY:', apiKey ? '✓' : '✗');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': project,
  'X-Appwrite-Key': apiKey,
};

async function apiCall(path: string) {
  const response = await fetch(`${endpoint}${path}`, { headers });
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.text();
    throw new Error(`API call failed: ${response.status} ${error}`);
  }
  return response.json();
}

const DATABASE_ID = 'main';
const REQUIRED_COLLECTIONS = [
  'events',
  'teams',
  'scores',
  'recaps',
  'share_links',
];

async function checkDatabase() {
  console.log('🔍 Checking Appwrite Database...\n');
  
  try {
    // Check if database exists
    console.log(`📦 Database: ${DATABASE_ID}`);
    const db = await apiCall(`/databases/${DATABASE_ID}`);
    
    if (!db) {
      console.log('   ❌ Database not found\n');
      console.log('💡 Create the database in Appwrite Console:');
      console.log('   1. Go to Databases → Create Database');
      console.log(`   2. Set ID to: ${DATABASE_ID}`);
      console.log('   3. Run this script again\n');
      return false;
    }
    
    console.log(`   ✅ Database exists (${db.name})\n`);

    // Check each collection
    console.log('📋 Collections:');
    const missingCollections: string[] = [];
    
    for (const collectionId of REQUIRED_COLLECTIONS) {
      const collection = await apiCall(`/databases/${DATABASE_ID}/collections/${collectionId}`);
      if (!collection) {
        console.log(`   ❌ ${collectionId} (not found)`);
        missingCollections.push(collectionId);
      } else {
        console.log(`   ✅ ${collectionId} (${collection.name})`);
      }
    }

    console.log('');

    if (missingCollections.length > 0) {
      console.log('⚠️  Missing collections:', missingCollections.join(', '));
      console.log('💡 Use the Appwrite VS Code extension or Console to create them\n');
      return false;
    }

    console.log('✅ All required collections exist!');
    console.log('✅ Ready to enable NEXT_PUBLIC_USE_APPWRITE_SERVICES=true\n');
    return true;

  } catch (error: any) {
    console.error('❌ Error checking database:', error.message);
    return false;
  }
}

checkDatabase().then((success) => {
  process.exit(success ? 0 : 1);
});
