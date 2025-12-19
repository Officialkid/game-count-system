#!/usr/bin/env tsx
/**
 * Create Recaps Collection
 * Creates the missing recaps collection with required attributes
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !project || !apiKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': project,
  'X-Appwrite-Key': apiKey,
};

async function post(path: string, body: any) {
  const response = await fetch(`${endpoint}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${response.status}: ${error}`);
  }
  return response.json();
}

const DATABASE_ID = 'main';

async function createRecapsCollection() {
  console.log('📋 Creating recaps collection...\n');

  try {
    // Create collection
    const collection = await post(`/databases/${DATABASE_ID}/collections`, {
      collectionId: 'recaps',
      name: 'Recaps',
      permissions: [
        'read("any")',
        'create("users")',
        'update("users")',
        'delete("users")',
      ],
      documentSecurity: true,
    });
    console.log('✅ Collection created:', collection.name);

    // Add event_id attribute (relationship to events)
    await post(`/databases/${DATABASE_ID}/collections/recaps/attributes/string`, {
      key: 'event_id',
      size: 36,
      required: true,
    });
    console.log('   ✅ event_id (string)');

    // Add user_id attribute (owner)
    await post(`/databases/${DATABASE_ID}/collections/recaps/attributes/string`, {
      key: 'user_id',
      size: 36,
      required: true,
    });
    console.log('   ✅ user_id (string)');

    // Add snapshot (JSON data)
    await post(`/databases/${DATABASE_ID}/collections/recaps/attributes/string`, {
      key: 'snapshot',
      size: 1000000, // 1MB for JSON
      required: true,
    });
    console.log('   ✅ snapshot (string/JSON)');

    // Add generated_at timestamp
    await post(`/databases/${DATABASE_ID}/collections/recaps/attributes/datetime`, {
      key: 'generated_at',
      required: true,
    });
    console.log('   ✅ generated_at (datetime)');

    // Create index on event_id
    await post(`/databases/${DATABASE_ID}/collections/recaps/indexes`, {
      key: 'event_id_index',
      type: 'key',
      attributes: ['event_id'],
    });
    console.log('   ✅ Index on event_id');

    // Create index on generated_at
    await post(`/databases/${DATABASE_ID}/collections/recaps/indexes`, {
      key: 'generated_at_index',
      type: 'key',
      attributes: ['generated_at'],
      orders: ['DESC'],
    });
    console.log('   ✅ Index on generated_at');

    console.log('\n✅ Recaps collection created successfully!');
    console.log('💡 Now you can enable NEXT_PUBLIC_USE_APPWRITE_SERVICES=true\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createRecapsCollection();
