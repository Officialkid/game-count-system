// lib/event-utils.ts
// Utility functions for event management including auto-deactivation

import { db } from './db';

/**
 * Check and deactivate events that have passed their end date
 * Returns the number of events that were deactivated
 */
export async function deactivateExpiredEvents(): Promise<number> {
  try {
    const client = await db.pool.connect();
    try {
      const result = await client.query(`
        UPDATE events
        SET status = 'inactive'
        WHERE status = 'active'
          AND end_date IS NOT NULL
          AND end_date < CURRENT_DATE
        RETURNING id
      `);
      
      return result.rows.length;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deactivating expired events:', error);
    return 0;
  }
}

/**
 * Check if a specific event should be deactivated based on its end date
 * Returns true if the event was deactivated
 */
export async function checkAndDeactivateEvent(eventId: string): Promise<boolean> {
  try {
    const client = await db.pool.connect();
    try {
      const result = await client.query(`
        UPDATE events
        SET status = 'inactive'
        WHERE id = $1
          AND status = 'active'
          AND end_date IS NOT NULL
          AND end_date < CURRENT_DATE
        RETURNING id
      `, [eventId]);
      
      return result.rows.length > 0;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error checking event expiration:', error);
    return false;
  }
}

/**
 * Check if an event is expired (past its end date)
 */
export function isEventExpired(endDate: string | null | undefined): boolean {
  if (!endDate) return false;
  
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return end < today;
}

/**
 * Get the number of days until an event ends
 * Returns null if no end date is set
 * Returns negative number if event has already ended
 */
export function getDaysUntilEnd(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}
