'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Badge, LoadingSkeleton } from '@/components/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { safeName, safeNumber, safeInitial } from '@/lib/safe-ui-helpers';
import { NoScoresEmpty } from '@/components/EmptyStates';

interface Team {
  id: number;
  team_name: string;
  avatar_url: string | null;
  total_points: number;
}

interface HistoryItem {
  id: number;
  game_number: number;
  game_name: string | null;
  points: number;
  team_name: string;
  created_at: string;
}

interface EventMeta {
  id: number;
  event_name: string;
  theme_color: string;
  logo_url: string | null;
  created_at: string;
}

export default function EventDisplayPage({ params }: { params: { eventId: string } }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📺</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Display Error</h1>
            <p className="text-gray-600 mb-6">
              Unable to load the live display. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <DisplayPageContent params={params} />
    </ErrorBoundary>
  );
}

// State for error handling
interface ErrorState {
  type: '404' | '410' | '500' | null;
  message?: string;
  expiredAt?: string;
}

// Waiting for scores state component
function WaitingForScoresState({ eventName, onRefresh }: { eventName: string; onRefresh: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4 animate-pulse">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Scores Coming Soon</h1>
        <p className="text-gray-600 mb-2">
          <span className="font-semibold">{eventName}</span> is active
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Waiting for the first scores to be added. This page will update automatically every 60 seconds.
        </p>
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          🔄 Check for Scores Now
        </button>
      </div>
    </div>
  );
}

// Expired event state component
function ExpiredEventState({ expiredAt }: { expiredAt?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-rose-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-red-200">
        <div className="text-6xl mb-4">⏰</div>
        <h1 className="text-2xl font-bold text-red-900 mb-2">Event Expired</h1>
        <p className="text-red-700 mb-6">
          {expiredAt 
            ? `This event ended on ${new Date(expiredAt).toLocaleDateString()} and is no longer available.`
            : 'This event is no longer active.'}
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}

// Event not found state component
function EventNotFoundState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-200">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
        <p className="text-gray-600 mb-6">
          This event link is invalid or no longer exists. Please check your link and try again.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}

function DisplayPageContent({ params }: { params: { eventId: string } }) {
  const eventId = params.eventId;
  const [event, setEvent] = useState<EventMeta | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>({ type: null });
  const [hasScores, setHasScores] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError({ type: null });
      
      const res = await fetch(`/api/public/by-event/${eventId}`);
      const data = await res.json();

      // Handle 404 - Event not found
      if (res.status === 404) {
        setError({ type: '404' });
        setLoading(false);
        return;
      }

      // Handle 410 - Event expired
      if (res.status === 410) {
        setError({ type: '410', message: data.message, expiredAt: data.expired_at });
        setLoading(false);
        return;
      }

      // Handle other errors
      if (!res.ok || !data?.success || !data?.data) {
        setError({ type: '500', message: data.message || 'Failed to load event' });
        setLoading(false);
        return;
      }

      // Success - populate data
      setEvent(data.data.event);
      setTeams(data.data.teams || []);
      setScores(data.data.scores || []);
      setHasScores(data.data.event.has_scores || data.data.totals?.scores > 0);
      setError({ type: null });
    } catch (e) {
      console.error('Display load error:', e);
      setError({ type: '500', message: 'Unable to load the event. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 60 seconds to catch new scores
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [eventId]);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return a.team_name.localeCompare(b.team_name);
    });
  }, [teams]);

  const rankEmoji = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`);

  // Handle loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  // Handle error states
  if (error.type === '404') {
    return <EventNotFoundState />;
  }

  if (error.type === '410') {
    return <ExpiredEventState expiredAt={error.expiredAt} />;
  }

  if (error.type === '500') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">{error.message || 'Unable to load the event.'}</p>
      </div>
    );
  }

  // No event data
  if (!event) {
    return <EventNotFoundState />;
  }

  // Event is active but has no scores yet - show waiting state
  if (!hasScores) {
    return <WaitingForScoresState eventName={event.event_name} onRefresh={load} />;
  }

  // Full scoreboard with data
  return (
    <div className="min-h-screen" style={{ background: '#f7f7fb' }}>
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {event.logo_url && (
              <img src={event.logo_url} alt={event.event_name} className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-3xl font-bold">{event.event_name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="primary">Client Display</Badge>
                <span className="text-sm text-gray-500">Updating every 30s</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-gray-300" style={{ backgroundColor: event.theme_color }} title="Theme" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
          <div className="space-y-3">
            {sortedTeams.map((team, idx) => (
              <div key={team.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="text-2xl w-10 text-center">{rankEmoji(idx + 1)}</div>
                  {team.avatar_url ? (
                    <img src={team.avatar_url} alt={team.team_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                      {safeInitial(team.team_name)}
                    </div>
                  )}
                  <div className="text-lg font-semibold">{team.team_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{team.total_points}</div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Game History</h2>
          {scores.length === 0 ? (
            <NoScoresEmpty showShareButton={false} />
          ) : (
            <div className="space-y-2">
              {scores.slice(0, 50).map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded border bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Badge variant="info">Game {h.game_number}</Badge>
                    <span className="font-medium">{h.team_name}</span>
                    {h.game_name && <span className="text-sm text-gray-500">{h.game_name}</span>}
                  </div>
                  <div className={h.points >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                    {h.points >= 0 ? '+' : ''}{h.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
