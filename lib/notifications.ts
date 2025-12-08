/**
 * Event Status Transition Notifications
 * Sends notifications when events transition between statuses
 */

import { EventStatus } from '@/lib/dateUtils';

export interface StatusTransitionNotification {
  eventId: string;
  eventName: string;
  previousStatus: EventStatus;
  newStatus: EventStatus;
  timestamp: Date;
  message: string;
}

/**
 * Generate notification message based on status transition
 */
export function generateStatusTransitionMessage(
  eventName: string,
  oldStatus: EventStatus,
  newStatus: EventStatus
): string {
  const transitionMap: Record<string, Record<string, string>> = {
    scheduled: {
      active: `"${eventName}" has started! 🎉 Event is now active.`,
      completed: `"${eventName}" has ended. Event is now completed. 🏁`,
      inactive: `"${eventName}" has been deactivated.`,
    },
    active: {
      completed: `"${eventName}" has ended. Great event! 🎊`,
      inactive: `"${eventName}" has been deactivated.`,
    },
    completed: {
      inactive: `"${eventName}" has been deactivated.`,
    },
    inactive: {
      scheduled: `"${eventName}" is scheduled for later. ⏰`,
      active: `"${eventName}" is now active! 🚀`,
    },
  };

  return transitionMap[oldStatus]?.[newStatus] || 
    `"${eventName}" status changed from ${oldStatus} to ${newStatus}`;
}

/**
 * Store notification in localStorage (for client-side toast display)
 */
export function storeNotification(notification: StatusTransitionNotification): void {
  try {
    const notifications = JSON.parse(localStorage.getItem('statusNotifications') || '[]');
    notifications.push({
      ...notification,
      timestamp: notification.timestamp.toISOString(),
    });
    // Keep only last 50 notifications
    localStorage.setItem('statusNotifications', JSON.stringify(notifications.slice(-50)));
  } catch (error) {
    console.error('Failed to store notification:', error);
  }
}

/**
 * Get unread status transition notifications
 */
export function getUnreadNotifications(): StatusTransitionNotification[] {
  try {
    const stored = JSON.parse(localStorage.getItem('statusNotifications') || '[]');
    return stored.map((n: any) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }));
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
}

/**
 * Clear all notifications
 */
export function clearNotifications(): void {
  try {
    localStorage.removeItem('statusNotifications');
  } catch (error) {
    console.error('Failed to clear notifications:', error);
  }
}
