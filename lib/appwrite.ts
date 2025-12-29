/**
 * Appwrite SDK Configuration
 * 
 * This file initializes and exports configured Appwrite client instances
 * for use throughout the application.
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_APPWRITE_ENDPOINT: Your Appwrite endpoint URL
 * - NEXT_PUBLIC_APPWRITE_PROJECT: Your Appwrite project ID
 * - APPWRITE_API_KEY: Server-only API key (for server-side operations)
 */

import { Client, Account, Databases, Storage, Functions } from 'appwrite';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
  throw new Error('Missing NEXT_PUBLIC_APPWRITE_ENDPOINT environment variable');
}

if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID environment variable');
}

/**
 * Client-side Appwrite Client
 * Used for browser-based operations (auth, realtime, etc.)
 */
export const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

/**
 * Account SDK
 * Handles authentication, sessions, and user account management
 * 
 * Methods:
 * - create(): Register new user
 * - createEmailSession(): Login with email/password
 * - get(): Get current session
 * - deleteSession(): Logout
 * - createVerification(): Email verification
 * - updatePassword(): Change password
 */
export const account = new Account(client);

/**
 * Databases SDK
 * Handles all database operations (CRUD for events, teams, scores, etc.)
 * 
 * Methods:
 * - listDocuments(databaseId, collectionId, queries?)
 * - getDocument(databaseId, collectionId, documentId)
 * - createDocument(databaseId, collectionId, documentId, data, permissions?)
 * - updateDocument(databaseId, collectionId, documentId, data, permissions?)
 * - deleteDocument(databaseId, collectionId, documentId)
 */
export const databases = new Databases(client);

/**
 * Storage SDK
 * Handles file uploads (team avatars, event logos)
 * 
 * Methods:
 * - createFile(bucketId, fileId, file, permissions?)
 * - getFilePreview(bucketId, fileId, width?, height?, quality?)
 * - deleteFile(bucketId, fileId)
 */
export const storage = new Storage(client);

/**
 * Functions SDK
 * Handles Appwrite Cloud Functions (for complex server-side logic)
 * 
 * Methods:
 * - createExecution(functionId, data?, async?)
 */
export const functions = new Functions(client);

/**
 * Server-side Client (API Routes Only)
 * 
 * For use in Next.js API routes or Server Components where you need
 * server-level permissions (e.g., admin operations, bypassing user permissions)
 * 
 * IMPORTANT: Never expose APPWRITE_API_KEY to the client!
 * 
 * Usage Example (API Route):
 * ```typescript
 * import { getServerClient } from '@/lib/appwrite';
 * 
 * export async function GET() {
 *   const { databases } = getServerClient();
 *   const result = await databases.listDocuments('db-id', 'collection-id');
 *   return Response.json(result);
 * }
 * ```
 */
export function getServerClient() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerClient() can only be called on the server side');
  }

  if (!process.env.APPWRITE_API_KEY) {
    console.warn('⚠️  APPWRITE_API_KEY not set - server operations may be limited');
    // Return regular client if no API key (development mode)
    return {
      client,
      account: new Account(client),
      databases: new Databases(client),
      storage: new Storage(client),
      functions: new Functions(client),
    };
  }

  const serverClient = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  // Note: In Appwrite SDK for Web, API key authentication is handled
  // differently than in server SDKs. For Next.js API routes, you may
  // need to use the Node.js SDK instead, or handle auth via JWT tokens.
  // For now, we'll use the standard client and rely on user sessions.

  return {
    client: serverClient,
    account: new Account(serverClient),
    databases: new Databases(serverClient),
    storage: new Storage(serverClient),
    functions: new Functions(serverClient),
  };
}

/**
 * Database IDs (to be set up in Appwrite Console)
 * 
 * TODO: After creating your database and collections in Appwrite,
 * replace these placeholders with actual IDs from your Appwrite project.
 */
export const DATABASE_ID = 'main'; // Replace with your database ID
export const COLLECTIONS = {
  USERS: 'users',           // Replace with your users collection ID
  EVENTS: 'events',         // Replace with your events collection ID
  TEAMS: 'teams',           // Replace with your teams collection ID
  SCORES: 'scores',         // Replace with your scores collection ID
  SHARE_LINKS: 'share_links', // Replace with your share_links collection ID
  ADMINS: 'event_admins',   // Replace with your event_admins collection ID
};

/**
 * Storage Bucket IDs (to be set up in Appwrite Console)
 * 
 * TODO: After creating your storage buckets in Appwrite,
 * replace these placeholders with actual bucket IDs.
 */
export const BUCKETS = {
  AVATARS: 'avatars',       // For team avatars
  LOGOS: 'logos',           // For event logos
};

/**
 * Type exports for better TypeScript support
 */
export type { Models } from 'appwrite';
