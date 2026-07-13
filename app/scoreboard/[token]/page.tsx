'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, CalendarDays, Crown, RefreshCw, Timer } from 'lucide-react';
import { ExpiredEvent, EventNotFoundError } from '@/components/ExpiredEvent';
import { LoadingSkeleton } from '@/components/ui';
import { safeInitial } from '@/lib/safe-ui-helpers';

type EventMeta = {
  id: string;
  event_name: string;
  mode: string;
  status: string;
  start_date: string;
  end_date: string;
};

type Team = {
  id: string;
  team_name: string;
  color: string;
  avatar_url: string | null;
  total_points: number;
};

type DayScore = {
  day_number: number;
  day_label: string;
  scores: Array<{
    id: string;
    team_id: string;
    team_name: string;
    points: number;
    penalty: number | null;
    bonus: number | null;
    created_at: string;
  }>;
};

type HistoryItem = {
  id: string;
  team_id: string;
  team_name: string;
  points: number;
  penalty: number | null;
  bonus: number | null;
  notes: string | null;
  day_number: number | null;
  created_at: string;
};

export default function PublicScoreboardPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const [event, setEvent] = useState<EventMeta | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [scoresByDay, setScoresByDay] = useState<DayScore[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | 'cumulative'>('cumulative');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState<'expired' | 'not-found' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setError('');
        const response = await fetch(`/api/public/${token}`, { cache: 'no-store' });

        if (response.status === 404) {
          if (isMounted) {
            setInvalid('not-found');
            setLoading(false);
          }
          return;
        }

        if (response.status === 410) {
          if (isMounted) {
            setInvalid('expired');
            setLoading(false);
          }
          return;
        }

        if (!response.ok) throw new Error('Unable to load scoreboard');

        const payload = await response.json();
        const data = payload?.data;
        if (!data) throw new Error('Missing scoreboard payload');
        if (!isMounted) return;

        setEvent({
          id: data.event.id,
          event_name: data.event.name,
          mode: data.event.mode,
          status: data.event.status,
          start_date: data.event.startDate,
          end_date: data.event.endDate,
        });
        setTeams(
          (data.teams ?? []).map((team: any) => ({
            id: String(team.id),
            team_name: team.name,
            color: team.color || '#0f766e',
            avatar_url: team.avatar_url || null,
            total_points: Number(team.total_points || 0),
          }))
        );
        setScoresByDay(data.scores_by_day ?? []);
        setHistory(data.scores ?? []);
        setInvalid(null);
        setLastUpdated(Date.now());
      } catch (loadError) {
        console.error(loadError);
        if (isMounted) setError(loadError instanceof Error ? loadError.message : 'Unable to load scoreboard');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    const intervalId = window.setInterval(loadData, 300000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [token]);

  const dayOptions = useMemo(() => scoresByDay.map((day) => day.day_number), [scoresByDay]);

  const visibleTeams = useMemo(() => {
    if (selectedDay === 'cumulative') {
      return [...teams].sort((a, b) => b.total_points - a.total_points || a.team_name.localeCompare(b.team_name));
    }

    const pointsByTeam = new Map<string, number>();
    const selected = scoresByDay.find((day) => day.day_number === selectedDay);

    selected?.scores.forEach((score) => {
      const total = pointsByTeam.get(score.team_id) ?? 0;
      pointsByTeam.set(score.team_id, total + score.points + (score.bonus ?? 0) - (score.penalty ?? 0));
    });

    return teams
      .map((team) => ({ ...team, total_points: pointsByTeam.get(team.id) ?? 0 }))
      .filter((team) => team.total_points !== 0)
      .sort((a, b) => b.total_points - a.total_points || a.team_name.localeCompare(b.team_name));
  }, [scoresByDay, selectedDay, teams]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-lg font-semibold text-slate-800">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (invalid === 'expired') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <ExpiredEvent showWaitlist={true} />
      </div>
    );
  }

  if (invalid === 'not-found') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <EventNotFoundError />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-slate-500">Scoreboard not available.</p>
        <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-teal-700 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const updatedAt = new Date(lastUpdated).toLocaleTimeString();

  return (
    <div className="site-shell">
      <div className="scoreboard-header">
        <div className="container-safe py-5">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[30px] border border-white/50 bg-[rgba(255,250,241,0.82)] p-5 shadow-[0_20px_60px_rgba(20,33,61,0.1)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="section-label">Public scoreboard</div>
              <h1 className="mt-4 text-3xl font-black text-slate-950 md:text-5xl">{event.event_name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
                <span className="badge badge-primary">{event.mode}</span>
                <span className="badge badge-warning">{event.status}</span>
              </div>
            </div>

            <div className="dashboard-grid w-full max-w-3xl">
              <div className="metric-card">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <UsersIcon />
                  Teams
                </div>
                <div className="mt-3 text-3xl font-black text-slate-950">{teams.length}</div>
              </div>
              <div className="metric-card">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <Activity className="h-4 w-4" />
                  Updates
                </div>
                <div className="mt-3 text-3xl font-black text-slate-950">{history.length}</div>
              </div>
              <div className="metric-card">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <RefreshCw className="h-4 w-4" />
                  Last sync
                </div>
                <div className="mt-3 text-xl font-bold text-slate-950">{updatedAt}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-safe py-8">
        {event.mode === 'camp' && dayOptions.length > 0 && (
          <div className="surface-panel mb-8 rounded-[30px] p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDay('cumulative')}
                className={`pill-tab ${selectedDay === 'cumulative' ? 'pill-tab-active' : 'pill-tab-idle'}`}
              >
                Overall
              </button>
              {dayOptions.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`pill-tab ${selectedDay === day ? 'pill-tab-active' : 'pill-tab-idle'}`}
                >
                  Day {day}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[1.65fr_0.95fr]">
          <section className="surface-dark rounded-[34px] p-6 md:p-8">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Standings</div>
                <h2 className="mt-2 text-3xl font-black text-white">
                  {selectedDay === 'cumulative' ? 'Overall leaderboard' : `Day ${selectedDay} leaderboard`}
                </h2>
              </div>
              <div className="text-sm text-white/55">Live ranking by net points</div>
            </div>

            <div className="mt-6 space-y-3">
              {visibleTeams.length === 0 ? (
                <p className="rounded-[28px] border border-white/10 bg-white/5 py-12 text-center text-white/65">
                  No scores yet for this view.
                </p>
              ) : (
                visibleTeams.map((team, index) => (
                  <div
                    key={team.id}
                    className={`rounded-[28px] border px-5 py-5 transition-all ${
                      index === 0
                        ? 'border-amber-300/30 bg-[linear-gradient(135deg,rgba(244,182,61,0.18),rgba(255,255,255,0.04))]'
                        : 'border-white/10 bg-white/6'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`${index === 0 ? 'bg-amber-300 text-slate-950' : 'score-rank'} h-11 w-11`}>
                          {index === 0 ? <Crown className="h-5 w-5" /> : index + 1}
                        </div>
                        {team.avatar_url ? (
                          <img src={team.avatar_url} alt={team.team_name} className="h-14 w-14 rounded-2xl object-cover" />
                        ) : (
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-black text-white shadow-lg"
                            style={{ backgroundColor: team.color }}
                          >
                            {safeInitial(team.team_name)}
                          </div>
                        )}
                        <div>
                          <p className="text-xl font-bold text-white">{team.team_name}</p>
                          <p className="text-sm text-white/55">
                            {selectedDay === 'cumulative' ? 'Total campaign score' : `Day ${selectedDay} score`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-4xl font-black" style={{ color: index === 0 ? '#f4b63d' : '#ffffff' }}>
                          {team.total_points}
                        </p>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/45">points</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <div className="surface-panel rounded-[30px] p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                <CalendarDays className="h-4 w-4" />
                Event window
              </div>
              <div className="mt-4 text-2xl font-black text-slate-950">{new Date(event.start_date).toLocaleDateString()}</div>
              <div className="mt-2 text-sm text-slate-600">to {new Date(event.end_date).toLocaleDateString()}</div>
            </div>

            <div className="surface-panel rounded-[30px] p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                <Timer className="h-4 w-4" />
                Score pulse
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[22px] bg-white/70 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Day groups</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{scoresByDay.length}</div>
                </div>
                <div className="rounded-[22px] bg-white/70 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest sync</div>
                  <div className="mt-2 text-xl font-bold text-slate-950">{updatedAt}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="surface-panel mt-8 rounded-[34px] p-6 md:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Timeline</div>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Recent score history</h2>
            </div>
            <div className="text-sm text-slate-500">Latest submissions first</div>
          </div>

          <div className="mt-4 divide-y divide-slate-200/70">
            {history.length === 0 ? (
              <p className="py-12 text-center text-slate-500">No score entries yet.</p>
            ) : (
              history
                .slice()
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-950">{item.team_name}</p>
                      <p className="text-sm text-slate-500">
                        {item.day_number ? `Day ${item.day_number} · ` : ''}
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-full bg-slate-900 px-4 py-2 text-center text-white">
                      <p className="text-lg font-black">{item.points + (item.bonus ?? 0) - (item.penalty ?? 0)}</p>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">net points</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
