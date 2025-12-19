'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trophy, Play, Crown, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TeamCard, TeamList } from '@/components/TeamCard';
import { EmptyState } from '@/components/EmptyState';
import { RecapSlides } from '@/components/RecapSlides';
import * as appwriteEvents from '@/lib/services/appwriteEvents';
import * as appwriteTeams from '@/lib/services/appwriteTeams';
import * as appwriteRecaps from '@/lib/services/appwriteRecaps';
import { useAuth } from '@/lib/auth-context';

type EventItem = {
  id: string;
  event_name: string;
  created_at: string;
  logo_url: string | null;
  team_count: number;
  status?: string;
};

type TeamItem = {
  id: string;
  event_id: string;
  team_name: string;
  avatar_url: string | null;
  total_points: number;
};

type RecapSummary = {
  topTeam?: { name: string; points: number };
  totalGames?: number;
  mvpTeam?: { name: string; delta: number };
};

type VerificationMismatch = {
  team_id: string;
  team_name: string;
  kind: 'missing' | 'extra' | 'points' | 'rank';
  expectedPoints?: number;
  actualPoints?: number;
  expectedRank?: number;
  actualRank?: number;
};

type VerificationResult = {
  snapshot: any;
  recap: { id: string; generated_at: string } | null;
  computed: {
    totalTeams: number;
    totalGames: number;
    leaderboard: Array<{ team_id: string; team_name: string; total_points: number; rank: number }>;
  };
  validation: { schemaValid: boolean; errors: string[] };
  mismatches: {
    leaderboard: VerificationMismatch[];
    totals: Array<{ field: 'totalGames' | 'totalTeams'; expected: number; actual: number }>;
  };
};

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  return mounted;
}

function CountUp({ end, duration = 1200, className = '' }: { end: number; duration?: number; className?: string }) {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const progress = Math.min((time - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * end));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration]);

  return <span className={className}>{value.toLocaleString()}</span>;
}

export default function RecapPage() {
  const { user, authReady } = useAuth();
  const mounted = useMounted();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [recapSummary, setRecapSummary] = useState<RecapSummary | null>(null);
  const [showSlides, setShowSlides] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!authReady || !user) return;
        const [eventsRes, recapRes, teamsRes] = await Promise.all([
          appwriteEvents.getEvents(user.id),
          appwriteRecaps.getSummary(user.id),
          appwriteTeams.getTeams(user.id),
        ]);

        if (!active) return;
        const evts = (eventsRes.data?.events || []).map((e: any) => ({
          id: e.$id || e.id,
          event_name: e.event_name,
          created_at: e.created_at,
          logo_url: e.logo_path || null,
          team_count: e.num_teams || 0,
          status: e.status,
        })) as EventItem[];
        setEvents(evts);
        const rs: any = recapRes.data || null;
        if (rs) {
          setRecapSummary({
            topTeam: rs.topTeam ? { name: rs.topTeam, points: 0 } : undefined,
            totalGames: rs.totalGames ?? 0,
            mvpTeam: rs.mvpTeam ? { name: rs.mvpTeam, delta: 0 } : undefined,
          });
        } else {
          setRecapSummary(null);
        }
        const tms = (teamsRes.data?.teams || []).map((t: any) => ({
          id: t.$id || t.id,
          event_id: t.event_id,
          team_name: t.team_name,
          avatar_url: t.avatar_path || null,
          total_points: t.total_points ?? 0,
        })) as TeamItem[];
        setTeams(tms);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || 'Failed to load recap');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [authReady, user]);

  const completedEvents = useMemo(() => events.filter((event) => event.status === 'completed'), [events]);
  const sortedEvents = useMemo(() => {
    const ordered = [...completedEvents, ...events.filter((event) => event.status !== 'completed')];
    return ordered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [events, completedEvents]);

  useEffect(() => {
    if (!selectedEventId && sortedEvents[0]) {
      setSelectedEventId(sortedEvents[0].id);
    }
  }, [selectedEventId, sortedEvents]);

  const selectedEvent = useMemo(
    () => sortedEvents.find((e) => e.id === selectedEventId) || sortedEvents[0] || null,
    [selectedEventId, sortedEvents],
  );

  const recapEvent = selectedEvent;
  const teamsForRecap = useMemo(
    () => (recapEvent ? teams.filter((team) => team.event_id === recapEvent.id) : teams),
    [recapEvent, teams],
  );

  const snapshotLeaderboard = verification?.snapshot?.final_leaderboard as
    | Array<{ team_id: string; team_name: string; total_points: number; rank: number }>
    | undefined;

  const rankedTeams = useMemo(() => {
    if (snapshotLeaderboard && snapshotLeaderboard.length) {
      const avatarLookup = new Map<string, string | null>();
      teamsForRecap.forEach((t) => avatarLookup.set(String(t.id), t.avatar_url));

      return [...snapshotLeaderboard]
        .sort((a, b) => a.rank - b.rank)
        .map((entry) => ({
          id: entry.team_id,
          event_id: recapEvent?.id || '',
          team_name: entry.team_name,
          avatar_url: avatarLookup.get(String(entry.team_id)) ?? null,
          total_points: entry.total_points,
          rank: entry.rank,
        }));
    }

    if (!teamsForRecap.length) return [] as Array<TeamItem & { rank: number }>;

    return [...teamsForRecap]
      .sort((a, b) => b.total_points - a.total_points)
      .map((team, idx) => ({ ...team, rank: idx + 1 }));
  }, [snapshotLeaderboard, teamsForRecap, recapEvent?.id]);

  const totalEvents = events.length;
  const totalGames = verification?.snapshot?.total_games ?? recapSummary?.totalGames ?? 0;
  const winner = recapSummary?.topTeam || (rankedTeams[0] ? { name: rankedTeams[0].team_name, points: rankedTeams[0].total_points } : null);
  const topScorer = rankedTeams[0] || null;
  const hasRecap = (recapSummary && (recapSummary.totalGames ?? 0) > 0) || completedEvents.length > 0 || rankedTeams.length > 0;

  useEffect(() => {
    if (!winner || !mounted) return;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '100%';
    container.style.height = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';

    const colors = ['#9333ea', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444'];
    const count = 60;
    for (let i = 0; i < count; i++) {
      const conf = document.createElement('div');
      const size = Math.random() * 8 + 4;
      conf.style.width = `${size}px`;
      conf.style.height = `${size * 0.6}px`;
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.position = 'absolute';
      conf.style.left = `${Math.random() * 100}%`;
      conf.style.top = '0';
      conf.style.opacity = '0.9';
      conf.style.transform = `rotate(${Math.random() * 360}deg)`;
      conf.style.borderRadius = '2px';
      conf.style.transition = 'transform 1.2s ease, top 1.2s ease, opacity 1.2s ease';
      conf.style.willChange = 'transform, opacity';
      container.appendChild(conf);

      requestAnimationFrame(() => {
        conf.style.top = `${20 + Math.random() * 40}%`;
        conf.style.transform = `translate3d(0, ${Math.random() * 200}px, 0) rotate(${Math.random() * 360}deg)`;
        conf.style.opacity = '0';
      });
    }
    document.body.appendChild(container);
    const t = setTimeout(() => {
      container.remove();
    }, 1400);
    return () => clearTimeout(t);
  }, [winner, mounted]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 bg-neutral-200 rounded" />
            <div className="h-24 w-full bg-neutral-200 rounded" />
            <div className="h-24 w-full bg-neutral-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Recap Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasRecap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <EmptyState
          title="No completed events yet"
          description="Wrap up an event to unlock your GameScore Wrapped recap."
          actionLabel="Go to events"
          actionHref="/events"
          tips={['Finish at least one event', 'Add team scores to generate rankings', 'Come back here to celebrate your winner']}
        />
      </div>
    );
  }

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My GameScore Wrapped', url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link Copied!');
      }
    } catch {}
  };

  const biggestComeback = rankedTeams.length >= 2
    ? {
        team_name: rankedTeams[rankedTeams.length - 1]?.team_name || '',
        comeback: Math.max(20, rankedTeams[0].total_points - rankedTeams[rankedTeams.length - 1].total_points),
      }
    : undefined;

  if (showSlides) {
    return (
      <RecapSlides
        totalEvents={Math.max(totalEvents, 1)}
        totalGames={totalGames || rankedTeams.length}
        mvpTeam={winner ? { team_name: winner.name, total_points: winner.points } : null}
        topTeams={rankedTeams.slice(0, 5).map((team) => ({
          rank: team.rank,
          team_name: team.team_name,
          total_points: team.total_points,
        }))}
        biggestComeback={biggestComeback}
        onShare={share}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className={`transform-gpu will-change-transform transition-transform transition-opacity ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} duration-500`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 flex items-center gap-2">
                GameScore Wrapped
                <Trophy className="w-6 h-6 text-amber-500" />
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-neutral-600">
                  {recapEvent ? `Highlights from ${recapEvent.event_name}` : 'Your latest highlights'}
                </p>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="text-sm border border-neutral-300 rounded-md px-2 py-1 bg-white"
                >
                  {sortedEvents.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.event_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowSlides(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-md"
            >
              <Play className="w-5 h-5" />
              <span className="hidden sm:inline">Play Slides</span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Verification Panel */}
          <Card className="md:col-span-2 xl:col-span-2">
            <CardHeader>
              <CardTitle>Recap Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!selectedEventId) return;
                    setVerificationError(null);
                    setVerificationLoading(true);
                    setVerification(null);
                    try {
                      const res = await fetch(`/api/recap/verify/${selectedEventId}`);
                      if (!res.ok) {
                        const j = await res.json().catch(() => ({}));
                        throw new Error(j?.error || `Failed (${res.status})`);
                      }
                      const j = await res.json();
                      setVerification(j?.data || null);
                    } catch (err: any) {
                      setVerificationError(err?.message || 'Verification failed');
                    } finally {
                      setVerificationLoading(false);
                    }
                  }}
                  className="px-3 py-2 bg-neutral-900 text-white rounded-md text-sm"
                >
                  {verificationLoading ? 'Verifying…' : 'Verify Recap'}
                </button>
                {verification?.validation && (
                  <span className={`text-sm font-medium ${verification.validation.schemaValid ? 'text-green-600' : 'text-red-600'}`}>
                    Schema: {verification.validation.schemaValid ? 'Valid' : 'Invalid'}
                  </span>
                )}
              </div>
              {verificationError && (
                <p className="mt-2 text-sm text-red-600">{verificationError}</p>
              )}

              {verification && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border border-neutral-200 p-3">
                      <p className="text-xs text-neutral-500">Snapshot Total Games</p>
                      <p className="mt-1 font-semibold">{verification.snapshot?.total_games ?? 0}</p>
                    </div>
                    <div className="rounded-md border border-neutral-200 p-3">
                      <p className="text-xs text-neutral-500">Live Total Games</p>
                      <p className="mt-1 font-semibold">{verification.computed.totalGames}</p>
                    </div>
                    <div className="rounded-md border border-neutral-200 p-3">
                      <p className="text-xs text-neutral-500">Snapshot Teams</p>
                      <p className="mt-1 font-semibold">{verification.snapshot?.total_teams ?? 0}</p>
                    </div>
                    <div className="rounded-md border border-neutral-200 p-3">
                      <p className="text-xs text-neutral-500">Live Teams</p>
                      <p className="mt-1 font-semibold">{verification.computed.totalTeams}</p>
                    </div>
                  </div>

                  {/* Mismatch Table */}
                  <div className="rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="bg-neutral-50 px-3 py-2 text-sm font-semibold">Leaderboard Mismatches</div>
                    <div className="max-h-56 overflow-y-auto">
                      {verification.mismatches.leaderboard.length === 0 ? (
                        <p className="p-3 text-sm text-neutral-600">No mismatches found.</p>
                      ) : (
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left">
                              <th className="px-3 py-2">Team</th>
                              <th className="px-3 py-2">Type</th>
                              <th className="px-3 py-2">Expected</th>
                              <th className="px-3 py-2">Actual</th>
                            </tr>
                          </thead>
                          <tbody>
                            {verification.mismatches.leaderboard.map((m, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-3 py-2">{m.team_name}</td>
                                <td className="px-3 py-2 capitalize">{m.kind}</td>
                                <td className="px-3 py-2">
                                  {m.kind === 'rank' ? `#${m.expectedRank}` : m.expectedPoints ?? '—'}
                                </td>
                                <td className="px-3 py-2">
                                  {m.kind === 'rank' ? `#${m.actualRank}` : m.actualPoints ?? '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Totals Mismatch */}
                  <div className="rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="bg-neutral-50 px-3 py-2 text-sm font-semibold">Totals Mismatches</div>
                    <div className="max-h-40 overflow-y-auto">
                      {verification.mismatches.totals.length === 0 ? (
                        <p className="p-3 text-sm text-neutral-600">No mismatches found.</p>
                      ) : (
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left">
                              <th className="px-3 py-2">Field</th>
                              <th className="px-3 py-2">Expected</th>
                              <th className="px-3 py-2">Actual</th>
                            </tr>
                          </thead>
                          <tbody>
                            {verification.mismatches.totals.map((t, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-3 py-2">{t.field}</td>
                                <td className="px-3 py-2">{t.expected}</td>
                                <td className="px-3 py-2">{t.actual}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className={`transform-gpu will-change-transform transition-transform transition-opacity ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} duration-700`}>
            <CardHeader>
              <CardTitle>Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-purple-700">
                <CountUp end={Math.max(totalEvents, 1)} />
              </div>
            </CardContent>
          </Card>

          <Card className={`transform-gpu will-change-transform transition-transform transition-opacity ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} duration-700 delay-75`}>
            <CardHeader>
              <CardTitle>Total Games Played</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-purple-700">
                <CountUp end={Math.max(totalGames, rankedTeams.length)} />
              </div>
            </CardContent>
          </Card>

          <Card className={`transform-gpu will-change-transform transition-transform transition-opacity ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} duration-700 delay-100`}>
            <CardHeader>
              <CardTitle>Winner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-neutral-900">
                <Crown className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="font-bold">{winner?.name || 'TBD'}</p>
                  <p className="text-sm text-neutral-600">{winner?.points || 0} pts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`transform-gpu will-change-transform transition-transform transition-opacity ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} duration-700 delay-150`}>
            <CardHeader>
              <CardTitle>Top Scorer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-neutral-900">
                <Star className="w-6 h-6 text-purple-500" />
                <div>
                  <p className="font-bold">{topScorer?.team_name || 'TBD'}</p>
                  <p className="text-sm text-neutral-600">{topScorer?.total_points ?? 0} pts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <div className={`mb-4 transform-gpu will-change-transform transition-transform transition-opacity ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} duration-700`}>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Top Teams</h2>
            <p className="text-neutral-600">Ranked by total points</p>
          </div>
          <TeamList>
            {rankedTeams.map((team) => (
              <div
                key={team.id}
                className={`transform-gpu will-change-transform transition-transform transition-opacity ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} duration-700`}
                style={{ transitionDelay: `${team.rank * 90}ms` }}
              >
                <TeamCard
                  rank={team.rank}
                  teamName={team.team_name}
                  avatarUrl={team.avatar_url}
                  totalPoints={team.total_points}
                  isPublic
                />
              </div>
            ))}
          </TeamList>
        </div>

        {winner && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={`transform-gpu will-change-transform transition-transform transition-opacity ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} duration-700`}>
              <CardHeader>
                <CardTitle>MVP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  <span className="font-bold text-neutral-900">{winner.name}</span>
                  <span className="text-neutral-600">{winner.points} pts</span>
                </div>
              </CardContent>
            </Card>

            <Card className={`transform-gpu will-change-transform transition-transform transition-opacity ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} duration-700 delay-100`}>
              <CardHeader>
                <CardTitle>Share Recap</CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={share}
                  className="inline-flex items-center justify-center px-4 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all"
                >
                  Share Recap
                </button>
                <p className="text-xs text-neutral-500 mt-2">Copies a link or opens the Web Share panel.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
