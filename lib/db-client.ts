/**
 * Database Client - Firestore Connection
 * Server-side database operations using Firebase Admin SDK
 */

import { getAdminDb, initializeFirebaseAdmin } from './firebase-admin';
import { Firestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeFirebaseAdmin();

// Get Firestore instance
export const db = getAdminDb();

/**
 * Helper to convert Firestore Timestamp to ISO string
 */
export function timestampToISO(timestamp: any): string | null {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return null;
}

/**
 * Helper to convert document data with timestamps to JSON-friendly format
 */
export function convertTimestamps(data: any): any {
  if (!data) return data;
  
  const converted: any = { ...data };
  
  // Convert common timestamp fields
  if (converted.created_at) {
    converted.created_at = timestampToISO(converted.created_at);
  }
  if (converted.updated_at) {
    converted.updated_at = timestampToISO(converted.updated_at);
  }
  if (converted.startDate) {
    converted.startDate = timestampToISO(converted.startDate);
  }
  if (converted.endDate) {
    converted.endDate = timestampToISO(converted.endDate);
  }
  if (converted.completedAt) {
    converted.completedAt = timestampToISO(converted.completedAt);
  }
  if (converted.archivedAt) {
    converted.archivedAt = timestampToISO(converted.archivedAt);
  }
  
  return converted;
}

/**
 * Query helper - Get document by ID
 */
export async function getDocById(collection: string, id: string) {
  const docRef = db.collection(collection).doc(id);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data())
  };
}

/**
 * Query helper - Get all documents in a collection
 */
export async function getAllDocs(collection: string, orderBy?: string) {
  let query = db.collection(collection);
  
  if (orderBy) {
    query = query.orderBy(orderBy) as any;
  }
  
  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  }));
}

/**
 * Query helper - Get documents with where clause
 */
export async function getDocsWhere(
  collection: string,
  field: string,
  operator: FirebaseFirestore.WhereFilterOp,
  value: any
) {
  const snapshot = await db.collection(collection)
    .where(field, operator, value)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  }));
}

/**
 * Query helper - Create document
 */
export async function createDoc(collection: string, data: any, id?: string) {
  const timestamp = new Date().toISOString();
  const docData = {
    ...data,
    created_at: timestamp,
    updated_at: timestamp
  };
  
  if (id) {
    await db.collection(collection).doc(id).set(docData);
    return { id, ...docData };
  } else {
    const docRef = await db.collection(collection).add(docData);
    return { id: docRef.id, ...docData };
  }
}

/**
 * Query helper - Update document
 */
export async function updateDoc(collection: string, id: string, data: any) {
  const docRef = db.collection(collection).doc(id);
  const updateData = {
    ...data,
    updated_at: new Date().toISOString()
  };
  
  await docRef.update(updateData);
  
  const updated = await docRef.get();
  return {
    id: updated.id,
    ...convertTimestamps(updated.data())
  };
}

/**
 * Query helper - Delete document
 */
export async function deleteDoc(collection: string, id: string) {
  await db.collection(collection).doc(id).delete();
  return { id, deleted: true };
}

/**
 * Transaction helper
 */
export async function runTransaction<T>(
  callback: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  return db.runTransaction(callback);
}

/**
 * Batch helper
 */
export function getBatch() {
  return db.batch();
}

// ============================================================================
// BACKWARDS COMPATIBILITY
// ============================================================================

/**
 * Legacy query function (for PostgreSQL compatibility)
 * Now just a wrapper that throws error - routes should use specific functions
 */
export async function query(sql: string, params?: any[]) {
  throw new Error('Direct SQL queries not supported with Firestore. Use db-access.ts functions instead.');
}

/**
 * Legacy transaction export
 */
export const transaction = runTransaction;

// Export Firestore types
export { Timestamp, FieldValue };
export type { Firestore };
