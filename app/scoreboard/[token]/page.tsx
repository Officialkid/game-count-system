'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Crown,
  Lock,
  Maximize2,
  Moon,
  RefreshCw,
  Snowflake,
  Sparkles,
  Sun,
  Trophy,
} from 'lucide-react';
import { saveEventToDevice } from '@/lib/device-vault';
import { PoweredByFooter } from '@/components/PoweredByFooter';
import { PresentToScreenButton } from '@/components/PresentToScreenButton';

interface RankedTeam {
  id: string;
  name: string;
  color: string;
  avatar_url: string | null;
  points: number;
  overall_points: number;
  rank: number;
}

interface DayInfo {
  day_number: number;
  label: string;
  is_locked: boolean;
  carry_over_from_previous: boolean;
}

interface ActivityItem {
  id: string;
  team_id: string;
  team_name: string;
  team_color: string;
  category: string;
  points: number;
  day_number: number;
  day_label: string;
  created_at: string;
}

interface PublicBoardPayload {
  event: {
    id: string;
    name: string;
    status: string;
    scoringMode: string;
    numberOfDays: number;
    activeDayNumber: number;
    showPublicActivity: boolean;
    isFinalized: boolean;
  };
  freeze?: {
    active: boolean;
    reason: 'manual' | 'scheduled' | 'none';
    mode: 'cutoff' | 'mystery';
    frozen_at: string | null;
    auto_freeze_time: string | null;
  };
  tv_remote?: {
    mode: 'scoreboard' | 'reveal';
    slideIndex: number;
    theme?: 'dark' | 'light';
  } | null;
  overall_standings: RankedTeam[];
  day_standings: Record<number, RankedTeam[]>;
  scores: ActivityItem[];
  days: DayInfo[];
  waiting: boolean;
  totals: {
    total_teams: number;
    total_scores: number;
    total_points: number;
    total_days: number;
  };
}

function formatRankBadge(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export default function PublicScoreboardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = String(params?.token || '');
  const isTvMode = searchParams?.get('tv') === '1';
  const initialTheme = searchParams?.get('theme');

  const [data, setData] = useState<PublicBoardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedView, setSelectedView] = useState<'overall' | number>(1);
  const [initializedView, setInitializedView] = useState(false);
  const [darkMode, setDarkMode] = useState(
    initialTheme === 'dark' || (isTvMode && initialTheme !== 'light')
  );
  const [showActivity, setShowActivity] = useState(!isTvMode);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchBoard = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) {
        setLoading(true);
        setErrorMsg('');
      }
      try {
        const res = await fetch(`/api/public/${token}`, { cache: 'no-store' });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload.success) {
          if (!silent) {
            setErrorMsg(
              payload?.message || payload?.error || 'Scoreboard not found.'
            );
          }
          return;
        }

        const board: PublicBoardPayload = payload.data;
        setData(board);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        // If running on TV/Projector (?tv=1) and Admin triggered Reveal Show from phone, switch immediately!
        if (isTvMode && board.tv_remote?.mode === 'reveal') {
          router.replace(`/recap/${token}?tv=1`);
          return;
        }

        if (!initializedView) {
          setSelectedView(board.event.activeDayNumber || 1);
          setInitializedView(true);
        }

        saveEventToDevice({
          eventId: board.event.id,
          eventName: board.event.name,
          role: 'viewer',
          token,
          path: `/scoreboard/${token}`,
          numberOfDays: board.event.numberOfDays,
        });
      } catch {
        if (!silent) {
          setErrorMsg('Unable to reach the scoreboard right now. Please retry.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token, initializedView]
  );

  useEffect(() => {
    fetchBoard(false);
  }, [fetchBoard]);

  // Live auto-refresh (fast 1.5s polling in TV mode for instant phone remote response; 6s normally)
  useEffect(() => {
    const id = window.setInterval(() => {
      fetchBoard(true);
    }, isTvMode ? 1500 : 6000);
    return () => window.clearInterval(id);
  }, [fetchBoard, isTvMode]);

  const activeDayNumber = data?.event.activeDayNumber || 1;
  const currentDayViewNumber =
    typeof selectedView === 'number' ? selectedView : activeDayNumber;

  const currentDayInfo = useMemo(() => {
    return (
      data?.days.find((d) => d.day_number === currentDayViewNumber) || {
        day_number: currentDayViewNumber,
        label: `Day ${currentDayViewNumber}`,
        is_locked: false,
        carry_over_from_previous: true,
      }
    );
  }, [data, currentDayViewNumber]);

  const dayStandings: RankedTeam[] = useMemo(() => {
    if (!data) return [];
    return data.day_standings?.[currentDayViewNumber] || [];
  }, [data, currentDayViewNumber]);

  const overallStandings: RankedTeam[] = useMemo(() => {
    return data?.overall_standings || [];
  }, [data]);

  const filteredActivity = useMemo(() => {
    if (!data?.scores) return [];
    if (selectedView === 'overall') return data.scores.slice(0, 20);
    return data.scores.filter((s) => s.day_number === selectedView).slice(0, 20);
  }, [data, selectedView]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Loading live scoreboard…
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Trophy className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">
            Scoreboard Unavailable
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">{errorMsg}</p>
          <button
            type="button"
            onClick={() => fetchBoard(false)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const dayLeader = dayStandings[0];
  const overallLeader = overallStandings[0];
  const maxDayPoints = Math.max(1, ...dayStandings.map((t) => Math.max(0, t.points)));
  const maxOverallPoints = Math.max(
    1,
    ...overallStandings.map((t) => Math.max(0, t.points))
  );

  const shellClass = darkMode
    ? 'min-h-screen bg-slate-950 text-slate-50'
    : 'min-h-screen bg-slate-50 text-slate-900';
  const cardClass = darkMode
    ? 'rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg'
    : 'rounded-2xl border border-slate-200 bg-white shadow-sm';
  const mutedText = darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={shellClass}>
      {/* Top Header */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur ${
          darkMode
            ? 'border-slate-800 bg-slate-950/90'
            : 'border-slate-200 bg-white/95'
        }`}
      >
        <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                {data.event.isFinalized ? 'FINAL RESULTS' : 'LIVE'}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  darkMode
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {data.days.find((d) => d.day_number === activeDayNumber)?.label ||
                  `Day ${activeDayNumber}`}
              </span>
              {lastUpdated && (
                <span className={`text-xs ${mutedText}`}>Updated {lastUpdated}</span>
              )}
            </div>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {data.event.name}
            </h1>
          </div>

          {!isTvMode ? (
            <div className="flex flex-wrap items-center justify-center gap-2 md:absolute md:right-6 md:top-1/2 md:-translate-y-1/2">
              <PresentToScreenButton
                publicToken={token}
                eventName={data.event.name}
                variant={darkMode ? 'dark' : 'default'}
              />
              <Link
                href={`/recap/${token}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700"
              >
                <Sparkles className="h-4 w-4" />
                Reveal Show
              </Link>
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  darkMode
                    ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {darkMode ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-400" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-slate-600" />
                    TV Dark Mode
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
              title="Enter Fullscreen"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-white/5 p-2 text-slate-400 opacity-0 transition hover:opacity-100 focus:opacity-100"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Day Switcher Pills (Hidden in Clean TV Projection Mode) */}
        {!isTvMode && data.days.length > 1 && (
          <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
            <div className="flex items-center gap-1.5 overflow-x-auto md:justify-center">
              {data.days.map((day) => {
                const active = selectedView === day.day_number;
                return (
                  <button
                    key={day.day_number}
                    type="button"
                    onClick={() => setSelectedView(day.day_number)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : darkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {day.label}
                    {day.day_number === activeDayNumber && !active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    )}
                    {day.is_locked && <Lock className="h-3 w-3 opacity-70" />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSelectedView('overall')}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  selectedView === 'overall'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Trophy className="h-3.5 w-3.5" />
                Overall Camp
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {/* Suspense Freeze Banner (Cutoff Mode) */}
        {data.freeze?.active && data.freeze.mode === 'cutoff' && (
          <div
            className={`flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border px-5 py-3.5 text-center text-sm font-bold ${
              darkMode
                ? 'border-sky-500/40 bg-sky-950/60 text-sky-200'
                : 'border-sky-300 bg-sky-50 text-sky-900'
            }`}
          >
            <Snowflake className="h-4 w-4 shrink-0 animate-pulse text-sky-500" />
            <span>
              Scores Frozen
              {data.freeze.frozen_at
                ? ` as of ${new Date(data.freeze.frozen_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : ''}{' '}
              — New marks are hidden until the Reveal Show!
            </span>
          </div>
        )}

        {/* Full Mystery Lock Screen */}
        {data.freeze?.active && data.freeze.mode === 'mystery' ? (
          <div
            className={`${cardClass} mx-auto max-w-2xl p-10 text-center sm:p-14`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-500">
              <Lock className="h-8 w-8 animate-pulse" />
            </div>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.25em] text-sky-500">
              Suspense Mode Active
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-4xl">
              Results Are Locked for the Big Reveal!
            </h2>
            <p className={`mx-auto mt-3 max-w-md text-sm sm:text-base ${mutedText}`}>
              Marks are still being counted behind the scenes. Standings will unlock
              automatically the moment the winners are announced in the Reveal Show!
            </p>
          </div>
        ) : overallStandings.length === 0 ? (
          <div className={`${cardClass} p-12 text-center`}>
            <Trophy className="mx-auto h-12 w-12 text-blue-500 opacity-70" />
            <h2 className="mt-3 text-xl font-bold">Waiting for teams &amp; scores</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              This scoreboard updates automatically as soon as teams and marks are added.
            </p>
          </div>
        ) : (
          <>
            {/* Dual Leader Spotlight (Day Leader + Overall Leader) */}
            {data.days.length > 1 && selectedView !== 'overall' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  className={`rounded-2xl border p-5 ${
                    darkMode
                      ? 'border-blue-500/30 bg-blue-950/40'
                      : 'border-blue-200 bg-blue-50/70'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                    {currentDayInfo.label} Leader
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Crown className="h-6 w-6 text-blue-500" />
                      <span className="text-xl font-extrabold sm:text-2xl">
                        {dayLeader ? dayLeader.name : '—'}
                      </span>
                    </div>
                    <span className="text-2xl font-black tabular-nums text-blue-600 dark:text-blue-400">
                      {dayLeader
                        ? `${dayLeader.points > 0 ? '+' : ''}${dayLeader.points}`
                        : '0'}{' '}
                      <span className="text-xs font-semibold">today</span>
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-5 ${
                    darkMode
                      ? 'border-amber-500/30 bg-amber-950/30'
                      : 'border-amber-200 bg-amber-50/70'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    Overall Camp Leader
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Trophy className="h-6 w-6 text-amber-500" />
                      <span className="text-xl font-extrabold sm:text-2xl">
                        {overallLeader ? overallLeader.name : '—'}
                      </span>
                    </div>
                    <span className="text-2xl font-black tabular-nums text-amber-600 dark:text-amber-400">
                      {overallLeader ? overallLeader.points : 0}{' '}
                      <span className="text-xs font-semibold">total</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Dual Standings Grid */}
            <div
              className={`grid gap-6 ${
                data.days.length > 1 && selectedView !== 'overall'
                  ? 'lg:grid-cols-2'
                  : 'grid-cols-1'
              }`}
            >
              {/* Primary Day Standings Card */}
              {selectedView !== 'overall' && (
                <section className={`${cardClass} p-5 sm:p-6`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold sm:text-xl">
                        {currentDayInfo.label} Marks
                      </h2>
                      <p className={`text-xs ${mutedText}`}>
                        {currentDayInfo.carry_over_from_previous
                          ? 'Marks earned on this day (added to overall camp total)'
                          : 'Fresh daily round starting from 0'}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-bold text-blue-600">
                      Per-Day
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dayStandings.map((team) => {
                      const pct = Math.max(
                        4,
                        Math.min(100, (Math.max(0, team.points) / maxDayPoints) * 100)
                      );
                      return (
                        <div
                          key={team.id}
                          className={`rounded-xl border p-4 ${
                            darkMode
                              ? 'border-slate-800 bg-slate-950/60'
                              : 'border-slate-100 bg-slate-50/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="w-8 text-center text-lg font-extrabold">
                                {formatRankBadge(team.rank)}
                              </span>
                              <span
                                className="h-4 w-4 shrink-0 rounded-full"
                                style={{ backgroundColor: team.color }}
                              />
                              <span className="truncate text-base font-bold sm:text-lg">
                                {team.name}
                              </span>
                            </div>

                            <div className="text-right tabular-nums">
                              <p className="text-xl font-black sm:text-2xl">
                                {team.points > 0 ? `+${team.points}` : team.points}
                              </p>
                              {data.days.length > 1 && (
                                <p className={`text-[11px] font-semibold ${mutedText}`}>
                                  Overall: {team.overall_points}
                                </p>
                              )}
                            </div>
                          </div>

                          <div
                            className={`mt-2.5 h-2 w-full overflow-hidden rounded-full ${
                              darkMode ? 'bg-slate-800' : 'bg-slate-200'
                            }`}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${team.points <= 0 ? 0 : pct}%`,
                                backgroundColor: team.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Overall Camp Standings Card */}
              <section className={`${cardClass} p-5 sm:p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold sm:text-xl">
                      Overall Standings
                    </h2>
                    <p className={`text-xs ${mutedText}`}>
                      Combined total across all {data.event.numberOfDays} day
                      {data.event.numberOfDays > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-600">
                    Overall
                  </span>
                </div>

                <div className="space-y-3">
                  {overallStandings.map((team) => {
                    const pct = Math.max(
                      4,
                      Math.min(100, (Math.max(0, team.points) / maxOverallPoints) * 100)
                    );
                    return (
                      <div
                        key={team.id}
                        className={`rounded-xl border p-4 ${
                          darkMode
                            ? 'border-slate-800 bg-slate-950/60'
                            : 'border-slate-100 bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="w-8 text-center text-lg font-extrabold">
                              {formatRankBadge(team.rank)}
                            </span>
                            <span
                              className="h-4 w-4 shrink-0 rounded-full"
                              style={{ backgroundColor: team.color }}
                            />
                            <span className="truncate text-base font-bold sm:text-lg">
                              {team.name}
                            </span>
                          </div>

                          <div className="text-right tabular-nums">
                            <p className="text-xl font-black sm:text-2xl">{team.points}</p>
                            <p className={`text-[11px] font-semibold ${mutedText}`}>
                              total pts
                            </p>
                          </div>
                        </div>

                        <div
                          className={`mt-2.5 h-2 w-full overflow-hidden rounded-full ${
                            darkMode ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${team.points <= 0 ? 0 : pct}%`,
                              backgroundColor: team.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Collapsible Recent Games & Deductions Activity Feed */}
            {data.event.showPublicActivity && filteredActivity.length > 0 && (
              <section className={`${cardClass} p-5 sm:p-6`}>
                <button
                  type="button"
                  onClick={() => setShowActivity((prev) => !prev)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <h2 className="text-base font-extrabold">
                      Recent Games &amp; Deductions ({filteredActivity.length})
                    </h2>
                    <p className={`text-xs ${mutedText}`}>
                      Transparent log of awards and penalties
                    </p>
                  </div>
                  {showActivity ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                {showActivity && (
                  <div className="mt-4 divide-y divide-slate-200/60 dark:divide-slate-800">
                    {filteredActivity.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: item.team_color }}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {item.team_name}{' '}
                              <span className={`font-normal ${mutedText}`}>
                                · {item.category}
                              </span>
                            </p>
                            <p className={`text-xs ${mutedText}`}>
                              {item.day_label} ·{' '}
                              {new Date(item.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-extrabold tabular-nums ${
                            item.points < 0
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {item.points > 0 ? `+${item.points}` : item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <PoweredByFooter dark={darkMode} className="pt-4" />
      </main>
    </div>
  );
}
