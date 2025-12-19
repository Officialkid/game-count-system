/**
 * Appwrite Admins Service
 */

import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = 'main';
const ADMINS_COLLECTION = 'event_admins';

export interface EventAdminDoc {
  $id: string;
  event_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'judge' | 'scorer';
  user_name?: string;
  user_email?: string;
  created_at: string;
}

export async function getAdmins(eventId: string) {
  try {
    const res = await databases.listDocuments(DATABASE_ID, ADMINS_COLLECTION, [
      Query.equal('event_id', eventId),
    ]);
    return { success: true, data: { admins: res.documents as unknown as EventAdminDoc[] } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to load admins' };
  }
}

export async function removeAdmin(eventId: string, userId: string) {
  try {
    const res = await databases.listDocuments(DATABASE_ID, ADMINS_COLLECTION, [
      Query.equal('event_id', eventId),
      Query.equal('user_id', userId),
    ]);
    for (const doc of res.documents) {
      await databases.deleteDocument(DATABASE_ID, ADMINS_COLLECTION, (doc as any).$id);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove admin' };
  }
}
