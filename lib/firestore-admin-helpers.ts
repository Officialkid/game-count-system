/**
 * Firebase Admin Helpers
 * Server-side Firestore operations using Admin SDK
 */

import { getAdminDb } from './firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

/**
 * Get admin Firestore instance
 */
export function getDb() {
  return getAdminDb();
}

/**
 * Query collection (server-side)
 */
export async function adminQueryCollection<T = any>(
  collectionName: string,
  filters?: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }>
): Promise<T[]> {
  const db = getDb();
  let query: FirebaseFirestore.Query = db.collection(collectionName);
  
  if (filters) {
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as T));
}

/**
 * Get document by ID (server-side)
 */
export async function adminGetDocument<T = any>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const db = getDb();
  const docRef = db.collection(collectionName).doc(docId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    return null;
  }
  
  return {
    id: doc.id,
    ...doc.data()
  } as T;
}

/**
 * Create document (server-side)
 */
export async function adminCreateDocument<T = any>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> {
  const db = getDb();
  const collectionRef = db.collection(collectionName);
  
  const dataWithTimestamp = {
    ...data,
    created_at: FieldValue.serverTimestamp(),
  };
  
  const docRef = await collectionRef.add(dataWithTimestamp);
  return docRef.id;
}

/**
 * Update document (server-side)
 */
export async function adminUpdateDocument(
  collectionName: string,
  docId: string,
  data: any
): Promise<void> {
  const db = getDb();
  const docRef = db.collection(collectionName).doc(docId);
  
  await docRef.update({
    ...data,
    updated_at: FieldValue.serverTimestamp(),
  });
}

/**
 * Delete document (server-side)
 */
export async function adminDeleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const db = getDb();
  const docRef = db.collection(collectionName).doc(docId);
  await docRef.delete();
}

/**
 * Batch operations (server-side)
 */
export async function adminBatchWrite(
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    id?: string;
    data?: any;
  }>
): Promise<void> {
  const db = getDb();
  const batch = db.batch();
  
  for (const op of operations) {
    if (op.type === 'create') {
      const docRef = db.collection(op.collection).doc();
      batch.set(docRef, {
        ...op.data,
        created_at: FieldValue.serverTimestamp(),
      });
    } else if (op.type === 'update' && op.id) {
      const docRef = db.collection(op.collection).doc(op.id);
      batch.update(docRef, {
        ...op.data,
        updated_at: FieldValue.serverTimestamp(),
      });
    } else if (op.type === 'delete' && op.id) {
      const docRef = db.collection(op.collection).doc(op.id);
      batch.delete(docRef);
    }
  }
  
  await batch.commit();
}

/**
 * Transaction (server-side)
 */
export async function adminTransaction<T>(
  callback: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  const db = getDb();
  return db.runTransaction(callback);
}

/**
 * Query with ordering and limiting
 */
export async function adminQueryWithOptions<T = any>(
  collectionName: string,
  options: {
    where?: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }>;
    orderBy?: { field: string; direction?: 'asc' | 'desc' };
    limit?: number;
  }
): Promise<T[]> {
  const db = getDb();
  let query: FirebaseFirestore.Query = db.collection(collectionName);
  
  if (options.where) {
    options.where.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
  }
  
  if (options.orderBy) {
    query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'asc');
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as T));
}

/**
 * Convert Firestore Timestamp to ISO string
 */
export function adminTimestampToISO(timestamp: any): string | undefined {
  if (!timestamp) return undefined;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return undefined;
}
