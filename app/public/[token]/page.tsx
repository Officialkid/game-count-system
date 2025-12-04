// app/public/[token]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { PublicScoreboard } from '@/components/PublicScoreboard';

interface Team {
  id: string;
  team_name: string;
  avatar_url: string | null;
  total_points: number;
}

interface Score {
  id: string;
  team_id: string;
  team_name: string;
  game_number: number;
  points: number;
  created_at: string;
}

interface EventData {
  id: string;
  event_name: string;
  created_at: string;
  theme_color?: string | null;
  logo_url?: string | null;
}

export default function PublicScoreboardPage() {
  const params = useParams();
  const token = params?.token as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (token) {
      loadScoreboard();
    }
  }, [token]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadScoreboard(true);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, token]);

  const loadScoreboard = async (silent = false) => {
    // FIXED: Cancel previous request to prevent race condition
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (!silent) setLoading(true);

    try {
      const response = await apiClient.getPublicScoreboard(token);
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) return;
      
      if (response.success) {
        setEvent(response.data?.event);
        setTeams(response.data?.teams || []);
        setScores(response.data?.scores || []);
        setError('');
      } else {
        setError(response.error || 'Failed to load scoreboard');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return; // Ignore abort errors
      setError('Failed to load scoreboard');
    } finally {
      setLoading(false);
    }
  };

  const getLatestScores = () => {
    // Get the most recent game number
    const latestGameNumber = Math.max(
      ...scores.map((s) => s.game_number),
      0
    );
    return scores.filter((s) => s.game_number === latestGameNumber);
  };

  const latestScores = getLatestScores();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="animate-pulse text-xl">Loading scoreboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="card text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="card text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-gray-600">This event does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Use the PublicScoreboard component with branding support
  return (
    <PublicScoreboard
      initialEvent={event}
      initialTeams={teams}
      initialScores={scores}
      onRefresh={async () => {
        await loadScoreboard(true);
        return { event: event!, teams, scores };
      }}
    />
  );
}
