#!/usr/bin/env node
/**
 * Appwrite Setup Script
 * 
 * This script creates all required collections, buckets, and sets permissions
 * in your Appwrite instance for the Game Count System.
 * 
 * Usage:
 *   node scripts/setup-appwrite.js
 * 
 * Prerequisites:
 *   - Appwrite server running
 *   - APPWRITE_ENDPOINT and APPWRITE_API_KEY environment variables set
 *   - Or update the values below
 */

const { Client, Databases, Storage, ID, Permission, Role } = require('node-appwrite');

// Configuration
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT || '694164500028df77ada9';
const API_KEY = process.env.APPWRITE_API_KEY || '';

const DATABASE_ID = 'main';

// Collection definitions
const COLLECTIONS = {
  users: {
    id: 'users',
    name: 'Users',
    attributes: [
      { name: 'email', type: 'email', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'avatar_url', type: 'url', required: false },
      { name: 'contact', type: 'string', required: false },
    ],
  },
  events: {
    id: 'events',
    name: 'Events',
    attributes: [
      { name: 'user_id', type: 'string', required: true },
      { name: 'event_name', type: 'string', required: true },
      { name: 'theme_color', type: 'string', required: false },
      { name: 'logo_path', type: 'url', required: false },
      { name: 'allow_negative', type: 'boolean', required: false },
      { name: 'display_mode', type: 'string', required: false },
      { name: 'num_teams', type: 'integer', required: false },
      { name: 'status', type: 'string', required: false },
      { name: 'created_at', type: 'datetime', required: false },
      { name: 'updated_at', type: 'datetime', required: false },
    ],
  },
  teams: {
    id: 'teams',
    name: 'Teams',
    attributes: [
      { name: 'event_id', type: 'string', required: true },
      { name: 'team_name', type: 'string', required: true },
      { name: 'avatar_url', type: 'url', required: false },
      { name: 'total_points', type: 'integer', required: false },
      { name: 'created_at', type: 'datetime', required: false },
    ],
  },
  scores: {
    id: 'scores',
    name: 'Scores',
    attributes: [
      { name: 'event_id', type: 'string', required: true },
      { name: 'team_id', type: 'string', required: true },
      { name: 'game_number', type: 'integer', required: true },
      { name: 'points', type: 'integer', required: true },
      { name: 'user_id', type: 'string', required: false },
      { name: 'created_at', type: 'datetime', required: false },
    ],
  },
  recaps: {
    id: 'recaps',
    name: 'Event Recaps',
    attributes: [
      { name: 'event_id', type: 'string', required: true },
      { name: 'snapshot', type: 'string', required: true }, // JSON stored as string
      { name: 'generated_at', type: 'datetime', required: false },
    ],
  },
  share_links: {
    id: 'share_links',
    name: 'Share Links',
    attributes: [
      { name: 'event_id', type: 'string', required: true },
      { name: 'token', type: 'string', required: true },
      { name: 'is_active', type: 'boolean', required: false },
      { name: 'created_at', type: 'datetime', required: false },
      { name: 'expires_at', type: 'datetime', required: false },
    ],
  },
  templates: {
    id: 'templates',
    name: 'Event Templates',
    attributes: [
      { name: 'user_id', type: 'string', required: true },
      { name: 'template_name', type: 'string', required: true },
      { name: 'event_name_prefix', type: 'string', required: false },
      { name: 'theme_color', type: 'string', required: false },
      { name: 'logo_url', type: 'url', required: false },
      { name: 'allow_negative', type: 'boolean', required: false },
      { name: 'display_mode', type: 'string', required: false },
      { name: 'created_at', type: 'datetime', required: false },
    ],
  },
  event_admins: {
    id: 'event_admins',
    name: 'Event Administrators',
    attributes: [
      { name: 'event_id', type: 'string', required: true },
      { name: 'user_id', type: 'string', required: true },
      { name: 'role', type: 'string', required: true },
      { name: 'user_name', type: 'string', required: false },
      { name: 'user_email', type: 'email', required: false },
      { name: 'created_at', type: 'datetime', required: false },
    ],
  },
  audit_logs: {
    id: 'audit_logs',
    name: 'Audit Logs',
    attributes: [
      { name: 'user_id', type: 'string', required: true },
      { name: 'action', type: 'string', required: true },
      { name: 'entity', type: 'string', required: true },
      { name: 'record_id', type: 'string', required: true },
      { name: 'details', type: 'string', required: false },
      { name: 'ip_address', type: 'string', required: false },
      { name: 'user_agent', type: 'string', required: false },
      { name: 'timestamp', type: 'datetime', required: false },
    ],
  },
};

// Storage buckets
const BUCKETS = {
  avatars: {
    id: 'avatars',
    name: 'Team Avatars',
    maxFileSize: 5242880, // 5MB
  },
  logos: {
    id: 'logos',
    name: 'Event Logos',
    maxFileSize: 10485760, // 10MB
  },
};

async function setupAppwrite() {
  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const databases = new Databases(client);
  const storage = new Storage(client);

  console.log('🚀 Setting up Appwrite for Game Count System...\n');

  try {
    // Setup database
    console.log('📦 Creating database...');
    try {
      await databases.create(DATABASE_ID, 'Game Count System');
      console.log(`  ✓ Database created: ${DATABASE_ID}`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`  ✓ Database already exists: ${DATABASE_ID}`);
      } else {
        throw e;
      }
    }

    // Setup collections
    console.log('\n📋 Creating collections...');
    for (const [key, coll] of Object.entries(COLLECTIONS)) {
      try {
        await databases.createCollection(
          DATABASE_ID,
          coll.id,
          coll.name
        );
        console.log(`  ✓ Collection created: ${coll.id}`);

        // Add attributes
        for (const attr of coll.attributes) {
          try {
            const size = attr.type === 'string' ? 255 : undefined;
            await databases.createStringAttribute(
              DATABASE_ID,
              coll.id,
              attr.name,
              255,
              attr.required
            );
            console.log(`    ✓ Attribute: ${attr.name}`);
          } catch (e) {
            if (e.code === 409) {
              console.log(`    ✓ Attribute already exists: ${attr.name}`);
            } else {
              throw e;
            }
          }
        }
      } catch (e) {
        if (e.code === 409) {
          console.log(`  ✓ Collection already exists: ${coll.id}`);
        } else {
          throw e;
        }
      }
    }

    // Setup storage buckets
    console.log('\n💾 Creating storage buckets...');
    for (const [key, bucket] of Object.entries(BUCKETS)) {
      try {
        await storage.createBucket(
          bucket.id,
          bucket.name,
          [
            Permission.read('any'),
            Permission.create('users'),
            Permission.update('users'),
            Permission.delete('users'),
          ],
          undefined, // fileSecurity
          true, // enabled
          bucket.maxFileSize
        );
        console.log(`  ✓ Bucket created: ${bucket.id}`);
      } catch (e) {
        if (e.code === 409) {
          console.log(`  ✓ Bucket already exists: ${bucket.id}`);
        } else {
          throw e;
        }
      }
    }

    console.log('\n✅ Appwrite setup complete!\n');
    console.log('Environment variables to set:');
    console.log(`  NEXT_PUBLIC_APPWRITE_ENDPOINT=${ENDPOINT}`);
    console.log(`  NEXT_PUBLIC_APPWRITE_PROJECT=${PROJECT_ID}`);
    console.log(`  APPWRITE_API_KEY=<your-api-key-here>`);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupAppwrite();
