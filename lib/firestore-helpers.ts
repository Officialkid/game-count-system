/**
 * Firebase Firestore Query Helpers
 * Utility functions for common Firestore operations
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query as firestoreQuery,
  where,
  orderBy,
  limit,
  QueryConstraint,
  Timestamp,
  writeBatch,
  runTransaction,
  WhereFilterOp,
  DocumentData,
  QueryDocumentSnapshot,
  CollectionReference
} from 'firebase/firestore';
import { db } from './firebase-config';

/**
 * Generic query builder for Firestore
 */
export async function queryCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const q = firestoreQuery(collectionRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as T));
}

/**
 * Get a single document by ID
 */
export async function getDocumentById<T = DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...docSnap.data()
  } as T;
}

/**
 * Create a new document
 */
export async function createDocument<T = DocumentData>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> {
  const collectionRef = collection(db, collectionName);
  const dataWithTimestamp = {
    ...data,
    created_at: Timestamp.now(),
  };
  
  const docRef = await addDoc(collectionRef, dataWithTimestamp);
  return docRef.id;
}

/**
 * Update an existing document
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  const dataWithTimestamp = {
    ...data,
    updated_at: Timestamp.now(),
  };
  
  await updateDoc(docRef, dataWithTimestamp);
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

/**
 * Query with WHERE clause
 */
export async function queryWhere<T = DocumentData>(
  collectionName: string,
  field: string,
  operator: WhereFilterOp,
  value: any
): Promise<T[]> {
  return queryCollection<T>(collectionName, [where(field, operator, value)]);
}

/**
 * Batch write operations (up to 500 operations)
 */
export async function batchWrite(
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    id?: string;
    data?: any;
  }>
): Promise<void> {
  const batch = writeBatch(db);
  
  for (const op of operations) {
    if (op.type === 'create') {
      const collectionRef = collection(db, op.collection);
      const docRef = doc(collectionRef);
      batch.set(docRef, {
        ...op.data,
        created_at: Timestamp.now(),
      });
    } else if (op.type === 'update' && op.id) {
      const docRef = doc(db, op.collection, op.id);
      batch.update(docRef, {
        ...op.data,
        updated_at: Timestamp.now(),
      });
    } else if (op.type === 'delete' && op.id) {
      const docRef = doc(db, op.collection, op.id);
      batch.delete(docRef);
    }
  }
  
  await batch.commit();
}

/**
 * Transaction helper for atomic operations
 */
export async function executeTransaction<T>(
  callback: (transaction: any) => Promise<T>
): Promise<T> {
  return runTransaction(db, callback);
}

/**
 * Convert Firestore Timestamp to ISO string
 */
export function timestampToISO(timestamp: Timestamp | undefined): string | undefined {
  if (!timestamp) return undefined;
  return timestamp.toDate().toISOString();
}

/**
 * Convert ISO string to Firestore Timestamp
 */
export function isoToTimestamp(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso));
}

/**
 * Pagination helper
 */
export async function queryWithPagination<T = DocumentData>(
  collectionName: string,
  pageSize: number = 20,
  constraints: QueryConstraint[] = []
): Promise<{
  data: T[];
  hasMore: boolean;
}> {
  const results = await queryCollection<T>(collectionName, [
    ...constraints,
    limit(pageSize + 1)
  ]);
  
  const hasMore = results.length > pageSize;
  const data = hasMore ? results.slice(0, pageSize) : results;
  
  return { data, hasMore };
}
