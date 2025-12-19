/**
 * Appwrite Share Links Service
 * 
 * Manages public share links for events (scoreboard access)
 * Phase E: Share Links
 */

import { databases } from '@/lib/appwrite';
import { Query, ID, Permission, Role } from 'appwrite';
import crypto from 'crypto';

const DATABASE_ID = 'main';
const COLLECTION_ID = 'share_links';

export interface ShareLink {
  $id: string;
  event_id: string;
  token: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

/**
 * Generate a secure random token for share links
 * 
 * @param length - Token length (default: 32)
 * @returns Random URL-safe token
 */
export function generateShareToken(length: number = 32): string {
  // Generate random bytes and convert to URL-safe base64
  if (typeof window !== 'undefined') {
    // Browser environment
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, length);
  } else {
    // Node.js environment
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  }
}

/**
 * Create a share link for an event
 * 
 * @param eventId - The event ID to create a share link for
 * @param userId - The user ID (event owner)
 * @param regenerate - If true, deactivate existing links and create new one
 * @returns ShareLink with token
 */
export async function createShareLink(
  eventId: string,
  userId: string,
  regenerate: boolean = false
): Promise<{ success: boolean; data?: { shareLink: ShareLink }; error?: string }> {
  try {
    // Check if share link already exists
    const existingLinks = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('event_id', eventId), Query.equal('is_active', true)]
    );

    if (existingLinks.total > 0 && !regenerate) {
      // Return existing active link
      return {
        success: true,
        data: { shareLink: existingLinks.documents[0] as unknown as ShareLink },
      };
    }

    // If regenerating, deactivate existing links
    if (regenerate && existingLinks.total > 0) {
      for (const link of existingLinks.documents) {
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID, link.$id, {
          is_active: false,
        });
      }
    }

    // Generate unique token
    const token = generateShareToken();
    const now = new Date().toISOString();

    // Create new share link with PUBLIC read permission
    const permissions = [
      Permission.read(Role.any()), // Public read access for scoreboard
      Permission.update(Role.user(userId)), // Owner can update
      Permission.delete(Role.user(userId)), // Owner can delete
    ];

    const shareLink = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        event_id: eventId,
        token,
        is_active: true,
        created_at: now,
      },
      permissions
    );

    return {
      success: true,
      data: { shareLink: shareLink as unknown as ShareLink },
    };
  } catch (err: any) {
    console.error('Error creating share link:', err);
    return {
      success: false,
      error: err.message || 'Failed to create share link',
    };
  }
}

/**
 * Get share link by token (public access)
 * 
 * @param token - The share token
 * @returns ShareLink if found and active
 */
export async function getShareLinkByToken(
  token: string
): Promise<{ success: boolean; data?: { shareLink: ShareLink }; error?: string }> {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('token', token), Query.equal('is_active', true)]
    );

    if (result.total === 0) {
      return {
        success: false,
        error: 'Share link not found or inactive',
      };
    }

    return {
      success: true,
      data: { shareLink: result.documents[0] as unknown as ShareLink },
    };
  } catch (err: any) {
    console.error('Error getting share link:', err);
    return {
      success: false,
      error: err.message || 'Failed to get share link',
    };
  }
}

/**
 * Get share link for an event
 * 
 * @param eventId - The event ID
 * @returns ShareLink if exists
 */
export async function getShareLinkByEvent(
  eventId: string
): Promise<{ success: boolean; data?: { shareLink: ShareLink }; error?: string }> {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('event_id', eventId), Query.equal('is_active', true)]
    );

    if (result.total === 0) {
      return {
        success: false,
        error: 'No active share link found for this event',
      };
    }

    return {
      success: true,
      data: { shareLink: result.documents[0] as unknown as ShareLink },
    };
  } catch (err: any) {
    console.error('Error getting share link by event:', err);
    return {
      success: false,
      error: err.message || 'Failed to get share link',
    };
  }
}

/**
 * Delete (deactivate) share link for an event
 * 
 * @param eventId - The event ID
 * @param userId - The user ID (for permission check)
 * @returns Success status
 */
export async function deleteShareLink(
  eventId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find active share links for this event
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('event_id', eventId), Query.equal('is_active', true)]
    );

    if (result.total === 0) {
      return {
        success: false,
        error: 'No active share link found',
      };
    }

    // Deactivate all active links
    for (const link of result.documents) {
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, link.$id, {
        is_active: false,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting share link:', err);
    return {
      success: false,
      error: err.message || 'Failed to delete share link',
    };
  }
}

/**
 * Resolve share token to event ID (for public scoreboard access)
 * 
 * @param token - The share token
 * @returns Event ID if valid
 */
export async function resolveShareToken(
  token: string
): Promise<{ success: boolean; data?: { eventId: string }; error?: string }> {
  try {
    const result = await getShareLinkByToken(token);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Invalid or inactive share link',
      };
    }

    return {
      success: true,
      data: { eventId: result.data.shareLink.event_id },
    };
  } catch (err: any) {
    console.error('Error resolving share token:', err);
    return {
      success: false,
      error: err.message || 'Failed to resolve share token',
    };
  }
}

/**
 * Get all share links for a user (admin view)
 * 
 * @param userId - The user ID
 * @returns List of share links
 */
export async function getUserShareLinks(
  userId: string
): Promise<{ success: boolean; data?: { shareLinks: ShareLink[] }; error?: string }> {
  try {
    // Note: This requires querying events first to get event_ids,
    // then querying share_links. For now, return all with proper permissions.
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('is_active', true), Query.orderDesc('created_at')]
    );

    return {
      success: true,
      data: { shareLinks: result.documents as unknown as ShareLink[] },
    };
  } catch (err: any) {
    console.error('Error getting user share links:', err);
    return {
      success: false,
      error: err.message || 'Failed to get share links',
    };
  }
}
