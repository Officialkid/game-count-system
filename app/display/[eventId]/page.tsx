'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

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
  const eventId = params.eventId;
  const [event, setEvent] = useState<EventMeta | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/public/by-event/${eventId}`);
        const data = await res.json();
        if (!mounted) return;
        if (data?.success && data?.data) {
          setEvent(data.data.event);
          setTeams(data.data.teams || []);
          setScores(data.data.scores || []);
        }
      } catch (e) {
        console.error('Display load error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 7000);
    return () => { mounted = false; clearInterval(id); };
  }, [eventId]);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return a.team_name.localeCompare(b.team_name);
    });
  }, [teams]);

  const rankEmoji = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Event display not available.</p>
      </div>
    );
  }

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
                <span className="text-sm text-gray-500">Updated every 7s</span>
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
                      {team.team_name.charAt(0).toUpperCase()}
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
            <p className="text-gray-500">No games yet.</p>
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
