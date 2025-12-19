import { useEffect, useRef, useState } from 'react';
import { client } from '@/lib/appwrite';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';

type ScoreEvent = {
  type: 'score_added' | 'score_updated' | 'score_deleted';
  document: any;
  timestamp: number;
};

/**
 * useEventStream
 * Subscribes to Appwrite Realtime for score changes for a given event_id.
 * Returns connection status and last update event.
 * Falls back gracefully if Appwrite is disabled.
 */
export function useEventStream(eventId: string | null, enabled: boolean = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ScoreEvent | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // If not enabled, no eventId, or not in browser, do nothing
    if (typeof window === 'undefined' || !eventId || !enabled) {
      setIsConnected(false);
      return;
    }

    // If Appwrite services disabled, skip
    const useAppwrite = process.env.NEXT_PUBLIC_USE_APPWRITE_SERVICES === 'true';
    if (!useAppwrite) {
      setIsConnected(false);
      return;
    }

    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.SCORES}.documents`;

    try {
      const unsub = client.subscribe(channel, (response: any) => {
        try {
          const payload = response.payload || {};
          // Filter by event_id
          if (!payload || payload.event_id !== eventId) return;

          const events: string[] = response.events || [];
          const evtType = events.some((e) => e.endsWith('.create'))
            ? 'score_added'
            : events.some((e) => e.endsWith('.delete'))
            ? 'score_deleted'
            : 'score_updated';

          setLastUpdate({
            type: evtType,
            document: payload,
            timestamp: Date.now(),
          });
        } catch {
          // no-op
        }
      });

      unsubRef.current = unsub;
      setIsConnected(true);
    } catch (err) {
      console.warn('Failed to subscribe to Appwrite Realtime:', err);
      setIsConnected(false);
    }

    return () => {
      try {
        if (unsubRef.current) {
          unsubRef.current();
          unsubRef.current = null;
        }
      } catch {
        // ignore
      }
      setIsConnected(false);
    };
  }, [eventId, enabled]);

  return { isConnected, lastUpdate };
}
