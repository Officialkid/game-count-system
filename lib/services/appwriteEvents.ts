/**
 * Appwrite Events Service
 * 
 * CRUD operations for events collection
 * APPWRITE HOOK: Replace mockEventsService with this when NEXT_PUBLIC_USE_APPWRITE_SERVICES=true
 */

import { databases, client } from '@/lib/appwrite';
import { Query, ID, Permission } from 'appwrite';

const DATABASE_ID = 'main';
const COLLECTION_ID = 'events';

export interface EventData {
  event_name: string;
  theme_color?: string;
  allow_negative?: boolean;
  display_mode?: 'cumulative' | 'per-game';
  num_teams?: number;
  status?: 'draft' | 'active' | 'completed' | 'archived';
}

export interface Event extends EventData {
  $id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export async function getEvents(userId: string, filters?: { status?: string; limit?: number; offset?: number }) {
  try {
    const queries = [Query.equal('user_id', userId)];
    
    if (filters?.status) {
      queries.push(Query.equal('status', filters.status));
    }
    
    queries.push(Query.orderDesc('created_at'));
    
    if (filters?.limit) {
      queries.push(Query.limit(filters.limit));
    }
    if (filters?.offset) {
      queries.push(Query.offset(filters.offset));
    }

    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, queries);
    
    return {
      success: true,
      data: {
        events: result.documents as unknown as Event[],
        total: result.total,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch events' };
  }
}

export async function getEvent(eventId: string) {
  try {
    const event = await databases.getDocument(DATABASE_ID, COLLECTION_ID, eventId);
    return { success: true, data: { event: event as unknown as Event } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Event not found' };
  }
}

export async function createEvent(userId: string, eventData: EventData) {
  try {
    const now = new Date().toISOString();
    const docId = ID.unique();

    const payload = {
      user_id: userId,
      event_name: eventData.event_name,
      theme_color: eventData.theme_color || '#7c3aed',
      allow_negative: eventData.allow_negative ?? false,
      display_mode: eventData.display_mode || 'cumulative',
      num_teams: eventData.num_teams || 2,
      status: eventData.status || 'draft',
      created_at: now,
      updated_at: now,
    };

    // Document-level permission: creator only
    const permissions = [
      Permission.read(`user:${userId}`),
      Permission.update(`user:${userId}`),
      Permission.delete(`user:${userId}`),
    ];

    console.debug('[appwriteEvents.createEvent] request', {
      docId,
      userId,
      payload,
    });

    const event = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      docId,
      payload,
      permissions
    );

    console.debug('[appwriteEvents.createEvent] response', {
      docId,
      returned: event,
    });

    return { success: true, data: { event: event as unknown as Event } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create event' };
  }
}

export async function updateEvent(eventId: string, updates: Partial<EventData>) {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    console.debug('[appwriteEvents.updateEvent] request', {
      eventId,
      payload,
    });

    const event = await databases.updateDocument(DATABASE_ID, COLLECTION_ID, eventId, payload);

    console.debug('[appwriteEvents.updateEvent] response', {
      eventId,
      returned: event,
    });
    return { success: true, data: { event: event as unknown as Event } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update event' };
  }
}

export async function deleteEvent(eventId: string) {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, eventId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete event' };
  }
}

export async function duplicateEvent(eventId: string, userId: string) {
  try {
    // Get original event
    const original = await databases.getDocument(DATABASE_ID, COLLECTION_ID, eventId);
    
    const now = new Date().toISOString();
    const docId = ID.unique();
    
    const payload = {
      user_id: userId,
      event_name: `${original.event_name} (Copy)`,
      theme_color: original.theme_color,
      allow_negative: original.allow_negative,
      display_mode: original.display_mode,
      num_teams: original.num_teams,
      status: 'draft', // Always start as draft
      created_at: now,
      updated_at: now,
    };

    const permissions = [`user:${userId}`];

    const newEvent = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      docId,
      payload,
      permissions
    );

    return { success: true, data: { event: newEvent as unknown as Event } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to duplicate event' };
  }
}

export async function getEventStats(eventId: string) {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('$id', eventId),
    ]);

    if (result.documents.length === 0) {
      return { success: false, error: 'Event not found' };
    }

    // TODO: Implement real aggregation with teams/scores queries
    // For now, return basic event data
    const event = result.documents[0] as unknown as Event;
    
    return {
      success: true,
      data: {
        event,
        totalGames: 0, // Will be calculated from scores
        completedGames: 0,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch stats' };
  }
}
