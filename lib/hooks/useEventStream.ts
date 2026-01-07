import { useEffect, useRef, useState } from 'react';

type ScoreEvent = {
  type: 'score_added' | 'score_updated' | 'score_deleted';
  document: any;
  timestamp: number;
};

/**
 * useEventStream
 * Polls for score changes for a given event using public token.
 * Returns connection status and last update event.
 * 
 * In a real implementation, this would use SSE (Server-Sent Events)
 * or WebSockets for true real-time updates.
 */
export function useEventStream(publicToken: string | null, enabled: boolean = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ScoreEvent | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If not enabled, no publicToken, or not in browser, do nothing
    if (typeof window === 'undefined' || !publicToken || !enabled) {
      setIsConnected(false);
      return;
    }

    const pollScoreboard = async () => {
      try {
        const response = await fetch(`/events/${publicToken}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setLastUpdate({
              type: 'score_updated',
              document: data.data,
              timestamp: Date.now(),
            });
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.warn('Failed to poll scoreboard:', err);
        setIsConnected(false);
      }
    };

    // Initial fetch
    pollScoreboard();

    // Poll every 5 seconds
    intervalRef.current = setInterval(pollScoreboard, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
    };
  }, [publicToken, enabled]);

  return { isConnected, lastUpdate };
}
