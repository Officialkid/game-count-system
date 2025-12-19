// app/public/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Badge, LoadingCardSkeleton } from '@/components/ui';
import { shareLinksService, eventsService, teamsService } from '@/lib/services';
import { getPaletteById } from '@/lib/color-palettes';

interface PublicEvent {
  id: string;
  event_name: string;
  theme_color: string | null;
  logo_url: string | null;
  created_at: string;
  team_count: number;
  share_token: string;
}

export default function PublicEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    loadPublicEvents();
  }, []);

  const loadPublicEvents = async () => {
    try {
      setRetrying(true);
      // List active share links (public)
      const links = await shareLinksService.getUserShareLinks('public');
      if (!links.success || !links.data) {
        setEvents([]);
        setError('');
        return;
      }
      const active = links.data.shareLinks.slice(0, 24);
      const mapped: PublicEvent[] = [];
      for (const sl of active as any[]) {
        const ev = await eventsService.getEvent(sl.event_id);
        if (!ev.success || !ev.data) continue;
        const e: any = ev.data.event;
        const teams = await teamsService.getTeams(sl.event_id);
        mapped.push({
          id: e.$id,
          event_name: e.event_name,
          theme_color: e.theme_color || 'purple',
          logo_url: e.logo_path || e.logo_url || null,
          created_at: e.created_at,
          team_count: teams.success && teams.data ? (teams.data.teams as any[]).length : 0,
          share_token: sl.token,
        });
      }
      setEvents(mapped);
      setError('');
    } catch (err) {
      setError('Network error loading events');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const viewEvent = (token: string) => {
    router.push(`/scoreboard/${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
        <div className="container-safe">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Active Events</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <LoadingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
        <div className="container-safe">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Events</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadPublicEvents}
              className="btn-primary"
              disabled={retrying}
            >
              {retrying ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
        <div className="container-safe">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Events</h2>
            <p className="text-gray-600">Check back later for upcoming events!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
      <div className="container-safe">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏆 Active Events
          </h1>
          <p className="text-xl text-gray-600">
            Click on any event to view the live scoreboard
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const palette = getPaletteById(event.theme_color || 'purple') || getPaletteById('purple')!;
            
            return (
              <Card
                key={event.id}
                interactive
                onClick={() => viewEvent(event.share_token)}
                className="relative overflow-hidden"
              >
                {/* Theme Color Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{ background: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary})` }}
                />

                <CardHeader className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Logo or Icon */}
                    {event.logo_url ? (
                      <img
                        src={event.logo_url}
                        alt={event.event_name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                        style={{ backgroundColor: palette.primary }}
                      >
                        {event.event_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1">
                      <CardTitle className="mb-2">{event.event_name}</CardTitle>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{event.team_count} teams competing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(event.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div
                      className="text-center py-2 px-4 rounded-lg font-medium transition-all hover:brightness-110"
                      style={{ backgroundColor: palette.primary, color: 'white' }}
                    >
                      View Live Scoreboard →
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
