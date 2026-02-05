/**
 * Custom React Hook: useRealtimeEvent
 * 
 * Subscribes to a single Firebase Firestore event document in real-time using onSnapshot()
 * Structure: events/{eventId}
 * Automatically updates when event data changes (status, finalization, etc.)
 * 
 * Features:
 * - Real-time event updates
 * - Automatic reconnection on network issues
 * - Proper cleanup on unmount
 * - Connection status tracking
 * - Error handling with retry logic
 * 
 * Usage:
 * const { event, loading, error, connected } = useRealtimeEvent(eventId);
 */

import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export interface Event {
  id: string;
  name: string;
  mode: 'game' | 'camp';
  status: 'active' | 'completed' | 'archived' | 'expired';
  token: string;
  adminToken: string;
  scorerToken?: string;
  startDate?: string;
  endDate?: string;
  expiresAt?: string;
  isFinalized?: boolean;
  finalizedAt?: string;
  lockedDays?: number[];
  dayLabels?: Record<number, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UseRealtimeEventResult {
  event: Event | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastUpdate: Date | null;
  reconnect: () => void;
}

/**
 * Hook to subscribe to real-time event updates
 * 
 * @param eventId - The event document ID to subscribe to
 * @returns Event data with loading, error, and connection states
 * 
 * @example
 * ```tsx
 * function EventDetails({ eventId }) {
 *   const { event, loading, error, connected } = useRealtimeEvent(eventId);
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!event) return <div>Event not found</div>;
 *   
 *   return (
 *     <div>
 *       <h1>{event.name}</h1>
 *       <p>Status: {event.status}</p>
 *       <p>Mode: {event.mode}</p>
 *       {connected && <span>🟢 Live</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeEvent(eventId: string | null): UseRealtimeEventResult {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Reconnect function for manual retry
  const reconnect = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
  }, []);

  useEffect(() => {
    // Early return if no eventId
    if (!eventId) {
      setLoading(false);
      setConnected(false);
      setEvent(null);
      return;
    }

    let unsubscribe: Unsubscribe | null = null;
    let isSubscribed = true;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const setupListener = async () => {
      try {
        // Reference to event document
        const eventRef = doc(db, 'events', eventId);

        // Set up real-time listener with onSnapshot
        unsubscribe = onSnapshot(
          eventRef,
          {
            // Include metadata changes to detect pending writes
            includeMetadataChanges: false,
          },
          (snapshot) => {
            if (!isSubscribed) return;

            if (!snapshot.exists()) {
              // Event document doesn't exist
              setEvent(null);
              setLoading(false);
              setConnected(true);
              setError('Event not found');
              setLastUpdate(new Date());
              return;
            }

            // Process event document data
            const data = snapshot.data();
            const eventData: Event = {
              id: snapshot.id,
              name: data.name || 'Unnamed Event',
              mode: data.mode || 'game',
              status: data.status || 'active',
              token: data.token || '',
              adminToken: data.adminToken || '',
              scorerToken: data.scorerToken,
              startDate: data.startDate?.toDate?.()?.toISOString() || data.startDate,
              endDate: data.endDate?.toDate?.()?.toISOString() || data.endDate,
              expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
              isFinalized: data.isFinalized || false,
              finalizedAt: data.finalizedAt?.toDate?.()?.toISOString() || data.finalizedAt,
              lockedDays: data.lockedDays || [],
              dayLabels: data.dayLabels || {},
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            };

            setEvent(eventData);
            setLoading(false);
            setConnected(true);
            setError(null);
            setLastUpdate(new Date());
            setRetryCount(0); // Reset retry count on successful connection

            // Log update for debugging
            if (process.env.NODE_ENV === 'development') {
              console.log('🟢 Event updated:', eventData.name, '| Status:', eventData.status);
            }
          },
          (err) => {
            // Error handler - connection issues, permission denied, etc.
            console.error('❌ Realtime event error:', err);
            
            if (!isSubscribed) return;

            setConnected(false);
            setLoading(false);

            // Determine error type and message
            let errorMessage = 'Connection error';
            
            if (err.code === 'permission-denied') {
              errorMessage = 'Access denied. Please check your permissions.';
            } else if (err.code === 'unavailable') {
              errorMessage = 'Service temporarily unavailable. Retrying...';
            } else if (err.message) {
              errorMessage = err.message;
            }

            setError(errorMessage);

            // Auto-retry on connection errors (max 5 times)
            if (retryCount < 5 && err.code !== 'permission-denied') {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`🔄 Retrying in ${delay}ms (attempt ${retryCount + 1}/5)...`);
              }

              reconnectTimeout = setTimeout(() => {
                if (isSubscribed) {
                  reconnect();
                }
              }, delay);
            }
          }
        );
      } catch (err: any) {
        console.error('❌ Failed to setup event listener:', err);
        
        if (!isSubscribed) return;
        
        setError(err.message || 'Failed to connect to real-time updates');
        setLoading(false);
        setConnected(false);
      }
    };

    setupListener();

    // Cleanup function
    return () => {
      isSubscribed = false;
      
      if (unsubscribe) {
        unsubscribe();
      }
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [eventId, retryCount, reconnect]);

  return {
    event,
    loading,
    error,
    connected,
    lastUpdate,
    reconnect,
  };
}

/**
 * Hook to check if an event is active
 * 
 * @example
 * ```tsx
 * const { event } = useRealtimeEvent(eventId);
 * const isActive = event?.status === 'active';
 * ```
 */
export function useIsEventActive(eventId: string | null): boolean {
  const { event } = useRealtimeEvent(eventId);
  return event?.status === 'active';
}

/**
 * Hook to check if an event is finalized
 * 
 * @example
 * ```tsx
 * const { event } = useRealtimeEvent(eventId);
 * const isFinalized = event?.isFinalized === true;
 * ```
 */
export function useIsEventFinalized(eventId: string | null): boolean {
  const { event } = useRealtimeEvent(eventId);
  return event?.isFinalized === true;
}

/**
 * Hook to check if a specific day is locked
 * 
 * @example
 * ```tsx
 * const { event } = useRealtimeEvent(eventId);
 * const isDayLocked = event?.lockedDays?.includes(dayNumber) || false;
 * ```
 */
export function useIsDayLocked(eventId: string | null, dayNumber: number): boolean {
  const { event } = useRealtimeEvent(eventId);
  return event?.lockedDays?.includes(dayNumber) || false;
}
