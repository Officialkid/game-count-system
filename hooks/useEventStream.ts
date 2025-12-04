// hooks/useEventStream.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { auth } from '@/lib/api-client';

interface StreamData {
  type: string;
  [key: string]: any;
}

export function useEventStream(eventId: string, enabled: boolean = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<StreamData | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || !eventId) return;

    const token = auth.getToken();
    if (!token) return;

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new EventSource connection
      const url = new URL(`/api/events/${eventId}/stream`, window.location.origin);
      const eventSource = new EventSource(url.toString());

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE message received:', data);
          setLastUpdate(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        eventSource.close();

        // Attempt reconnection with exponential backoff
        const maxAttempts = 5;
        const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

        if (reconnectAttemptsRef.current < maxAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Reconnecting in ${backoffTime}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, backoffTime);
        } else {
          console.log('Max reconnection attempts reached');
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Error creating EventSource:', error);
      setIsConnected(false);
    }
  }, [eventId, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    lastUpdate,
    reconnect: connect,
    disconnect,
  };
}
