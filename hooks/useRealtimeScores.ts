/**
 * Custom React Hook: useRealtimeScores
 * 
 * Subscribes to Firebase Firestore scores subcollections in real-time using onSnapshot()
 * Structure: events/{eventId}/teams/{teamId}/scores/{scoreId}
 * Automatically updates when scores are added, modified, or deleted
 * 
 * Features:
 * - Real-time updates within 2 seconds
 * - Automatic reconnection on network issues
 * - Proper cleanup on unmount
 * - Connection status tracking
 * - Error handling with retry logic
 * 
 * Usage:
 * const { scores, loading, error, connected } = useRealtimeScores(eventId);
 */

import { useEffect, useState, useCallback } from 'react';
import { collection, query, collectionGroup, where, onSnapshot, orderBy, Unsubscribe, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

export interface Score {
  id: string;
  event_id: string;
  team_id: string;
  team_name?: string;
  points: number;
  penalty: number;
  final_score: number;
  day_number?: number;
  game_number?: number;
  game_name?: string;
  notes?: string;
  scorer_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface UseRealtimeScoresResult {
  scores: Score[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastUpdate: Date | null;
  reconnect: () => void;
}

/**
 * Hook to subscribe to real-time score updates for an event
 */
export function useRealtimeScores(eventId: string | null): UseRealtimeScoresResult {
  const [scores, setScores] = useState<Score[]>([]);
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
      return;
    }

    let unsubscribe: Unsubscribe | null = null;
    let isSubscribed = true;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const setupListener = async () => {
      try {
        // Query all scores from all teams under this event
        // Using collectionGroup to query across all 'scores' subcollections
        const q = query(
          collectionGroup(db, 'scores'),
          where('eventId', '==', eventId),
          orderBy('createdAt', 'desc')
        );

        // Set up real-time listener with onSnapshot
        unsubscribe = onSnapshot(
          q,
          {
            // Include metadata changes to detect pending writes
            includeMetadataChanges: false,
          },
          (snapshot) => {
            if (!isSubscribed) return;

            // Process all documents in snapshot
            const scoresData: Score[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                event_id: data.eventId || eventId || '',
                team_id: data.teamId || '',
                team_name: data.teamName,
                points: data.points || 0,
                penalty: data.penalty || 0,
                final_score: data.finalScore || (data.points - (data.penalty || 0)),
                day_number: data.dayNumber,
                game_number: data.gameNumber,
                game_name: data.gameName,
                notes: data.notes,
                scorer_name: data.scorerName,
                created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updated_at: data.updatedAt?.toDate?.()?.toISOString(),
              };
            });

            setScores(scoresData);
            setLoading(false);
            setConnected(true);
            setError(null);
            setLastUpdate(new Date());
            setRetryCount(0); // Reset retry count on successful connection

            // Log changes for debugging
            if (process.env.NODE_ENV === 'development') {
              snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                  console.log('🟢 New score:', change.doc.data());
                }
                if (change.type === 'modified') {
                  console.log('🟡 Modified score:', change.doc.data());
                }
                if (change.type === 'removed') {
                  console.log('🔴 Removed score:', change.doc.id);
                }
              });
            }
          },
          (err) => {
            // Error handler - connection issues, permission denied, etc.
            console.error('❌ Realtime scores error:', err);
            
            if (!isSubscribed) return;

            setConnected(false);
            setLoading(false);

            // Determine error type and message
            let errorMessage = 'Connection error. Retrying...';
            
            if (err.code === 'permission-denied') {
              errorMessage = 'Access denied. Please check your permissions.';
              setError(errorMessage);
              return; // Don't retry on permission errors
            } else if (err.code === 'unavailable') {
              errorMessage = 'Network unavailable. Will retry when connection restores.';
            } else if (err.code === 'failed-precondition') {
              errorMessage = 'Database offline. Please check your connection.';
            }

            setError(errorMessage);

            // Exponential backoff retry (max 5 attempts)
            if (retryCount < 5) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
              console.log(`⏳ Retrying connection in ${delay}ms (attempt ${retryCount + 1}/5)`);
              
              reconnectTimeout = setTimeout(() => {
                if (isSubscribed) {
                  setRetryCount(prev => prev + 1);
                }
              }, delay);
            } else {
              setError('Connection failed after multiple attempts. Please refresh the page.');
            }
          }
        );
      } catch (err: any) {
        console.error('❌ Failed to setup listener:', err);
        setError(err.message || 'Failed to connect to real-time updates');
        setLoading(false);
        setConnected(false);
      }
    };

    // Initialize listener
    setupListener();

    // Cleanup function - CRITICAL to prevent memory leaks
    return () => {
      isSubscribed = false;
      
      // Unsubscribe from Firestore listener
      if (unsubscribe) {
        console.log('🔌 Unsubscribing from realtime scores');
        unsubscribe();
      }
      
      // Clear any pending reconnection timeouts
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [eventId, retryCount]); // Re-run effect when eventId or retryCount changes

  return {
    scores,
    loading,
    error,
    connected,
    lastUpdate,
    reconnect,
  };
}

/**
 * Hook to get real-time score count (lightweight version)
 * Useful for displays that only need the count, not full data
 */
export function useRealtimeScoreCount(eventId: string | null): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!eventId) return;

    const scoresRef = collection(db, 'scores');
    const q = query(scoresRef, where('event_id', '==', eventId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [eventId]);

  return count;
}
