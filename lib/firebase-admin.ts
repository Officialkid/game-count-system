/**
 * Firebase Admin SDK Configuration
 * Used for server-side Firebase operations with elevated privileges
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials for server-side operations
 */
export function initializeFirebaseAdmin(): { app: App; db: Firestore } {
  if (getApps().length === 0) {
    // Option 1: Use service account JSON (for local development)
    // Place your service account JSON file in the root and add to .gitignore
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      adminApp = initializeApp({
        credential: cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
      });
    }
    // Option 2: Use service account key as environment variable (for production)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        
        // Fix private key formatting - replace literal \n with actual newlines
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        
        adminApp = initializeApp({
          credential: cert(serviceAccount),
        });
      } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        throw new Error('Invalid Firebase service account configuration');
      }
    }
    // Option 3: Use Application Default Credentials (for Google Cloud environments)
    else {
      adminApp = initializeApp();
    }

    adminDb = getFirestore(adminApp);
  } else {
    adminApp = getApps()[0];
    adminDb = getFirestore(adminApp);
  }

  return { app: adminApp, db: adminDb };
}

// Export singleton instances
export const getAdminDb = (): Firestore => {
  if (!adminDb) {
    const { db } = initializeFirebaseAdmin();
    return db;
  }
  return adminDb;
};

export const getAdminApp = (): App => {
  if (!adminApp) {
    const { app } = initializeFirebaseAdmin();
    return app;
  }
  return adminApp;
};

// Export db for direct import convenience
export const db = (() => {
  const { db } = initializeFirebaseAdmin();
  return db;
})();
