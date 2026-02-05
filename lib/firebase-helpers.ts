/**
 * Firebase Firestore Helper Functions
 * 
 * Reusable utilities for common Firestore operations in API routes
 */

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Event, Team, Score } from '@/hooks/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FirestoreError extends Error {
  code?: string;
}

export interface QueryOptions {
  orderBy?: string;
  direction?: 'asc' | 'desc';
  limit?: number;
  where?: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }>;
}

// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================

/**
 * Get a single document by ID
 * Returns null if document doesn't exist
 */
export async function getDocument<T = any>(
  collection: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  try {
    const doc = await db.collection(collection).doc(docId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data() as T
    };
  } catch (error) {
    console.error(`Error getting document ${collection}/${docId}:`, error);
    throw error;
  }
}

/**
 * Get a document from a subcollection
 */
export async function getSubDocument<T = any>(
  parentCollection: string,
  parentId: string,
  subCollection: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  try {
    const doc = await db
      .collection(parentCollection)
      .doc(parentId)
      .collection(subCollection)
      .doc(docId)
      .get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data() as T
    };
  } catch (error) {
    console.error(`Error getting subdocument ${parentCollection}/${parentId}/${subCollection}/${docId}:`, error);
    throw error;
  }
}

/**
 * Query documents with a single WHERE clause
 */
export async function queryDocuments<T = any>(
  collection: string,
  field: string,
  operator: FirebaseFirestore.WhereFilterOp,
  value: any,
  options?: Omit<QueryOptions, 'where'>
): Promise<Array<T & { id: string }>> {
  try {
    let query = db.collection(collection).where(field, operator, value);
    
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.direction || 'asc') as any;
    }
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as T
    }));
  } catch (error) {
    console.error(`Error querying ${collection}:`, error);
    throw error;
  }
}

/**
 * Get all documents from a subcollection
 */
export async function getSubCollection<T = any>(
  parentCollection: string,
  parentId: string,
  subCollection: string,
  options?: QueryOptions
): Promise<Array<T & { id: string }>> {
  try {
    let query: any = db
      .collection(parentCollection)
      .doc(parentId)
      .collection(subCollection);
    
    // Apply where clauses
    if (options?.where) {
      for (const condition of options.where) {
        query = query.where(condition.field, condition.operator, condition.value);
      }
    }
    
    // Apply orderBy
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.direction || 'asc');
    }
    
    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data() as T
    }));
  } catch (error) {
    console.error(`Error getting subcollection ${parentCollection}/${parentId}/${subCollection}:`, error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a document with auto-generated ID
 */
export async function createDocument<T = any>(
  collection: string,
  data: T
): Promise<{ id: string } & T> {
  try {
    const docRef = db.collection(collection).doc();
    const docData = {
      ...data,
      createdAt: FieldValue.serverTimestamp()
    };
    
    await docRef.set(docData);
    
    return {
      id: docRef.id,
      ...docData as T,
      createdAt: new Date() // For immediate return
    };
  } catch (error) {
    console.error(`Error creating document in ${collection}:`, error);
    throw error;
  }
}

/**
 * Create a document in a subcollection
 */
export async function createSubDocument<T = any>(
  parentCollection: string,
  parentId: string,
  subCollection: string,
  data: T
): Promise<{ id: string } & T> {
  try {
    const docRef = db
      .collection(parentCollection)
      .doc(parentId)
      .collection(subCollection)
      .doc();
    
    const docData = {
      ...data,
      createdAt: FieldValue.serverTimestamp()
    };
    
    await docRef.set(docData);
    
    return {
      id: docRef.id,
      ...docData as T,
      createdAt: new Date()
    };
  } catch (error) {
    console.error(`Error creating subdocument in ${parentCollection}/${parentId}/${subCollection}:`, error);
    throw error;
  }
}

/**
 * Create multiple documents in a batch
 */
export async function batchCreateDocuments<T = any>(
  collection: string,
  documents: T[]
): Promise<Array<{ id: string } & T>> {
  try {
    const batch = db.batch();
    const results: Array<{ id: string } & T> = [];
    
    for (const data of documents) {
      const docRef = db.collection(collection).doc();
      const docData = {
        ...data,
        createdAt: FieldValue.serverTimestamp()
      };
      
      batch.set(docRef, docData);
      
      results.push({
        id: docRef.id,
        ...docData as T,
        createdAt: new Date()
      });
    }
    
    await batch.commit();
    
    return results;
  } catch (error) {
    console.error(`Error batch creating documents in ${collection}:`, error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update a document
 */
export async function updateDocument(
  collection: string,
  docId: string,
  data: Record<string, any>
): Promise<void> {
  try {
    await db.collection(collection).doc(docId).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating document ${collection}/${docId}:`, error);
    throw error;
  }
}

/**
 * Update a document in a subcollection
 */
export async function updateSubDocument(
  parentCollection: string,
  parentId: string,
  subCollection: string,
  docId: string,
  data: Record<string, any>
): Promise<void> {
  try {
    await db
      .collection(parentCollection)
      .doc(parentId)
      .collection(subCollection)
      .doc(docId)
      .update({
        ...data,
        updatedAt: FieldValue.serverTimestamp()
      });
  } catch (error) {
    console.error(`Error updating subdocument ${parentCollection}/${parentId}/${subCollection}/${docId}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a document
 */
export async function deleteDocument(
  collection: string,
  docId: string
): Promise<void> {
  try {
    await db.collection(collection).doc(docId).delete();
  } catch (error) {
    console.error(`Error deleting document ${collection}/${docId}:`, error);
    throw error;
  }
}

/**
 * Delete a document and all its subcollections
 */
export async function deleteDocumentWithSubcollections(
  collection: string,
  docId: string,
  subcollections: string[]
): Promise<void> {
  try {
    const batch = db.batch();
    const docRef = db.collection(collection).doc(docId);
    
    // Delete all subcollections
    for (const subcollection of subcollections) {
      const snapshot = await docRef.collection(subcollection).get();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }
    
    // Delete main document
    batch.delete(docRef);
    
    await batch.commit();
  } catch (error) {
    console.error(`Error deleting document with subcollections ${collection}/${docId}:`, error);
    throw error;
  }
}

/**
 * Delete all documents in a subcollection
 */
export async function deleteSubCollection(
  parentCollection: string,
  parentId: string,
  subCollection: string
): Promise<void> {
  try {
    const snapshot = await db
      .collection(parentCollection)
      .doc(parentId)
      .collection(subCollection)
      .get();
    
    if (snapshot.empty) {
      return;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error(`Error deleting subcollection ${parentCollection}/${parentId}/${subCollection}:`, error);
    throw error;
  }
}

// ============================================================================
// TRANSACTION HELPERS
// ============================================================================

/**
 * Update a team's total points in a transaction
 * Used when adding/updating scores
 */
export async function updateTeamPointsTransaction(
  eventId: string,
  teamId: string,
  pointsDelta: number
): Promise<void> {
  await db.runTransaction(async (transaction) => {
    const teamRef = db
      .collection('events')
      .doc(eventId)
      .collection('teams')
      .doc(teamId);
    
    const teamDoc = await transaction.get(teamRef);
    
    if (!teamDoc.exists) {
      throw new Error('Team not found');
    }
    
    const currentPoints = teamDoc.data()?.totalPoints || 0;
    const newTotal = currentPoints + pointsDelta;
    
    transaction.update(teamRef, {
      totalPoints: newTotal,
      updatedAt: FieldValue.serverTimestamp()
    });
  });
}

/**
 * Recalculate team total points from all scores
 * Useful for finalization or manual recalculation
 */
export async function recalculateTeamPoints(
  eventId: string,
  teamId: string
): Promise<number> {
  const scoresSnapshot = await db
    .collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(teamId)
    .collection('scores')
    .get();
  
  const totalPoints = scoresSnapshot.docs.reduce(
    (sum, doc) => sum + (doc.data().points || 0),
    0
  );
  
  // Update team document
  await db
    .collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(teamId)
    .update({
      totalPoints,
      updatedAt: FieldValue.serverTimestamp()
    });
  
  return totalPoints;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate admin token for an event
 */
export async function validateAdminToken(
  eventId: string,
  adminToken: string
): Promise<boolean> {
  const event = await getDocument<Event>('events', eventId);
  
  if (!event) {
    return false;
  }
  
  return event.adminToken === adminToken;
}

/**
 * Validate public token for an event
 */
export async function validatePublicToken(token: string): Promise<Event | null> {
  const events = await queryDocuments<Event>('events', 'token', '==', token, { limit: 1 });
  
  if (events.length === 0) {
    return null;
  }
  
  return events[0];
}

/**
 * Check if event is active
 */
export function isEventActive(event: Event): boolean {
  return event.status === 'active';
}

/**
 * Check if event is finalized
 */
export function isEventFinalized(event: Event): boolean {
  return event.isFinalized === true;
}

/**
 * Check if day is locked
 */
export function isDayLocked(event: Event, dayNumber: number): boolean {
  if (!event.lockedDays) return false;
  return event.lockedDays.includes(dayNumber);
}

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Get HTTP status code from Firestore error
 */
export function getFirestoreErrorStatus(error: FirestoreError): number {
  switch (error.code) {
    case 'permission-denied':
      return 403;
    case 'not-found':
      return 404;
    case 'already-exists':
      return 409;
    case 'invalid-argument':
      return 400;
    case 'deadline-exceeded':
      return 504;
    case 'resource-exhausted':
      return 429;
    case 'unauthenticated':
      return 401;
    case 'unavailable':
      return 503;
    default:
      return 500;
  }
}

/**
 * Get user-friendly error message from Firestore error
 */
export function getFirestoreErrorMessage(error: FirestoreError): string {
  switch (error.code) {
    case 'permission-denied':
      return 'Permission denied';
    case 'not-found':
      return 'Resource not found';
    case 'already-exists':
      return 'Resource already exists';
    case 'invalid-argument':
      return 'Invalid request data';
    case 'deadline-exceeded':
      return 'Request timeout';
    case 'resource-exhausted':
      return 'Rate limit exceeded';
    case 'unauthenticated':
      return 'Authentication required';
    case 'unavailable':
      return 'Service temporarily unavailable';
    default:
      return 'An error occurred';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: any): Date | null {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return null;
}

/**
 * Prepare event data for API response
 * Converts Firestore timestamps to ISO strings
 */
export function prepareEventForResponse(event: any): any {
  return {
    ...event,
    createdAt: timestampToDate(event.createdAt)?.toISOString() || null,
    updatedAt: timestampToDate(event.updatedAt)?.toISOString() || null,
    startDate: timestampToDate(event.startDate)?.toISOString() || null,
    endDate: timestampToDate(event.endDate)?.toISOString() || null,
    finalizedAt: timestampToDate(event.finalizedAt)?.toISOString() || null,
    expiresAt: timestampToDate(event.expiresAt)?.toISOString() || null
  };
}

/**
 * Prepare team data for API response
 */
export function prepareTeamForResponse(team: any): any {
  return {
    ...team,
    createdAt: timestampToDate(team.createdAt)?.toISOString() || null,
    updatedAt: timestampToDate(team.updatedAt)?.toISOString() || null
  };
}

/**
 * Prepare score data for API response
 */
export function prepareScoreForResponse(score: any): any {
  return {
    ...score,
    createdAt: timestampToDate(score.createdAt)?.toISOString() || null,
    updatedAt: timestampToDate(score.updatedAt)?.toISOString() || null
  };
}
