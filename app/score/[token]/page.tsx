'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  CloudUpload,
  History,
  Lock,
  Monitor,
  RefreshCw,
  Send,
  Shield,
  Trash2,
  Trophy,
  Wifi,
} from 'lucide-react';
import { saveEventToDevice } from '@/lib/device-vault';
import { PoweredByFooter } from '@/components/PoweredByFooter';
import {
  enqueueOfflineScore,
  flushPendingScores,
  getPendingScores,
  loadEventSnapshot,
  PendingScoreBatch,
  removePendingScore,
  saveEventSnapshot,
} from '@/lib/offline-sync';

interface EventDay {
  id: string;
  day_number: number;
  label: string;
  is_locked: boolean;
  carry_over_from_previous: boolean;
}

interface ScorerEvent {
  id: string;
  name: string;
  status: string;
  number_of_days: number;
  active_day_number: number;
  is_finalized: boolean;
  public_token?: string;
  token_type?: 'admin' | 'scorer';
  days: EventDay[];
}

interface TeamSummary {
  id: string;
  name: string;
  color: string;
  total_points: number;
  day_totals?: Record<number, number>;
}

const PRESET_REASONS = [
  { label: 'Relay Race', defaultPoints: 100 },
  { label: 'Quiz Round', defaultPoints: 50 },
  { label: 'Teamwork Bonus', defaultPoints: 20 },
  { label: 'Misbehavior', defaultPoints: -10 },
  { label: 'Noise Penalty', defaultPoints: -10 },
  { label: 'Rule Violation', defaultPoints: -50 },
];

const QUICK_DELTAS = [-50, -10, 0, +10, +50, +100];

export default function ScorerPage() {
  const params = useParams();
  const token = String(params?.token || '');

  const [event, setEvent] = useState<ScorerEvent | null>(null);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'none' | 'denied' | 'network'>('none');
  const [errorMessage, setErrorMessage] = useState('');

  // Scoring form state
  const [category, setCategory] = useState('');
  const [teamInputs, setTeamInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Offline / Sync state
  const [isOnline, setIsOnline] = useState(true);
  const [pendingQueue, setPendingQueue] = useState<PendingScoreBatch[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [usingOfflineCache, setUsingOfflineCache] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
  }, []);

  const refreshPendingQueue = useCallback(async (eventId: string) => {
    const pending = await getPendingScores(eventId);
    setPendingQueue(pending);
  }, []);

  const loadData = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) {
        setLoading(true);
        setErrorType('none');
        setErrorMessage('');
      }

      try {
        const res = await fetch(`/api/event-by-token/${token}`, {
          headers: { 'X-SCORER-TOKEN': token },
          cache: 'no-store',
        });

        if (res.status === 401 || res.status === 403 || res.status === 404) {
          setErrorType('denied');
          setErrorMessage('This Scorer link is invalid or has expired.');
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const payload = await res.json();
        const loadedEvent: ScorerEvent = payload?.data?.event;
        if (!loadedEvent) {
          setErrorType('denied');
          setErrorMessage('Event not found for this link.');
          setLoading(false);
          return;
        }

        const teamsRes = await fetch(`/api/events/${loadedEvent.id}/teams`, {
          headers: { 'X-SCORER-TOKEN': token },
          cache: 'no-store',
        });
        const teamsPayload = teamsRes.ok ? await teamsRes.json() : { data: { teams: [] } };
        const loadedTeams: TeamSummary[] = teamsPayload?.data?.teams || [];

        setEvent(loadedEvent);
        setTeams(loadedTeams);
        setUsingOfflineCache(false);
        setSelectedDay((prev) =>
          silent ? prev : loadedEvent.active_day_number || 1
        );

        // Save to Zero-Signup Device Vault & IndexedDB Offline Snapshot
        saveEventToDevice({
          eventId: loadedEvent.id,
          eventName: loadedEvent.name,
          role: loadedEvent.token_type === 'admin' ? 'admin' : 'scorer',
          token,
          path: `/score/${token}`,
          numberOfDays: loadedEvent.number_of_days,
        });
        await saveEventSnapshot(token, loadedEvent, loadedTeams);
        await refreshPendingQueue(loadedEvent.id);
      } catch {
        // Fallback to cached IndexedDB snapshot when offline!
        const cached = await loadEventSnapshot(token);
        if (cached?.event) {
          setEvent(cached.event);
          setTeams(cached.teams || []);
          setUsingOfflineCache(true);
          setSelectedDay((prev) =>
            silent ? prev : cached.event.active_day_number || 1
          );
          await refreshPendingQueue(cached.event.id);
        } else if (!silent) {
          setErrorType('network');
          setErrorMessage(
            'Unable to connect to the server. Once you load this page online once, it will work offline.'
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token, refreshPendingQueue]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automatic Background Sync when internet returns!
  const runSync = useCallback(
    async (showToast = false) => {
      if (!event?.id || syncing) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const existing = await getPendingScores(event.id);
      if (existing.length === 0) return;

      setSyncing(true);
      try {
        const result = await flushPendingScores(event.id);
        await refreshPendingQueue(event.id);
        if (result.syncedCount > 0) {
          toast.success(
            `Synced ${result.syncedCount} offline score batch${
              result.syncedCount > 1 ? 'es' : ''
            }!`
          );
          await loadData(true);
        } else if (showToast && result.lastError) {
          toast.error(`Sync paused: ${result.lastError}`);
        }
      } finally {
        setSyncing(false);
      }
    },
    [event?.id, syncing, refreshPendingQueue, loadData]
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      runSync(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    const handleFocus = () => {
      if (navigator.onLine) {
        setIsOnline(true);
        runSync(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);

    const interval = window.setInterval(() => {
      if (navigator.onLine) {
        runSync(false);
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(interval);
    };
  }, [runSync]);

  // Compute optimistic totals (server totals + pending offline queue)
  const optimisticTeams = useMemo(() => {
    const pendingOverallDelta: Record<string, number> = {};
    const pendingDayDelta: Record<string, number> = {};

    for (const batch of pendingQueue) {
      for (const item of batch.items) {
        pendingOverallDelta[item.team_id] =
          (pendingOverallDelta[item.team_id] || 0) + item.points;
        if (batch.dayNumber === selectedDay) {
          pendingDayDelta[item.team_id] =
            (pendingDayDelta[item.team_id] || 0) + item.points;
        }
      }
    }

    return teams.map((team) => ({
      ...team,
      displayOverall: team.total_points + (pendingOverallDelta[team.id] || 0),
      displayDay:
        (team.day_totals?.[selectedDay] ?? 0) + (pendingDayDelta[team.id] || 0),
    }));
  }, [teams, pendingQueue, selectedDay]);

  const currentDayInfo = useMemo(() => {
    return (
      event?.days?.find((d) => d.day_number === selectedDay) || {
        day_number: selectedDay,
        label: `Day ${selectedDay}`,
        is_locked: false,
      }
    );
  }, [event, selectedDay]);

  const isDayLocked = Boolean(currentDayInfo.is_locked || event?.is_finalized);

  const adjustTeamInput = (teamId: string, delta: number) => {
    if (delta === 0) {
      setTeamInputs((prev) => ({ ...prev, [teamId]: '0' }));
      return;
    }
    setTeamInputs((prev) => {
      const current = Number.parseInt(prev[teamId] || '0', 10);
      const safeCurrent = Number.isNaN(current) ? 0 : current;
      const next = safeCurrent + delta;
      return { ...prev, [teamId]: String(next) };
    });
  };

  const toggleSign = (teamId: string) => {
    setTeamInputs((prev) => {
      const raw = (prev[teamId] || '').trim();
      if (!raw || raw === '0') return { ...prev, [teamId]: '-' };
      if (raw === '-') return { ...prev, [teamId]: '' };
      if (raw.startsWith('-')) return { ...prev, [teamId]: raw.slice(1) };
      return { ...prev, [teamId]: `-${raw}` };
    });
  };

  const enteredItems = useMemo(() => {
    return teams
      .map((team) => {
        const raw = (teamInputs[team.id] ?? '').trim();
        if (raw === '' || raw === '-') return null;
        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed)) return null;
        return {
          team_id: team.id,
          team_name: team.name,
          points: parsed,
        };
      })
      .filter((x): x is { team_id: string; team_name: string; points: number } =>
        Boolean(x)
      );
  }, [teams, teamInputs]);

  const handleSubmitMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (isDayLocked) {
      toast.error(`Day ${selectedDay} is locked`);
      return;
    }
    if (enteredItems.length === 0) {
      toast.error('Enter marks (positive or negative) for at least one team');
      return;
    }

    const label =
      category.trim() ||
      (enteredItems.every((i) => i.points < 0) ? 'Deduction' : 'Game Round');

    try {
      setSubmitting(true);

      // 1. Always save durably to IndexedDB first (offline-first!)
      await enqueueOfflineScore({
        eventId: event.id,
        token,
        role: event.token_type === 'admin' ? 'admin' : 'scorer',
        dayNumber: selectedDay,
        category: label,
        items: enteredItems,
      });

      // Reset inputs immediately for rapid entry
      setTeamInputs({});
      setCategory('');
      await refreshPendingQueue(event.id);

      // 2. If online, flush immediately; if offline, reassure user it's safely queued
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const result = await flushPendingScores(event.id);
        await refreshPendingQueue(event.id);
        if (result.syncedCount > 0) {
          toast.success(`Saved "${label}" to Day ${selectedDay}!`);
          await loadData(true);
        } else {
          toast('Saved on device — will auto-sync when connection returns', {
            icon: '📡',
          });
        }
      } else {
        toast('Offline: marks saved on your phone! Auto-syncs on Wi-Fi.', {
          icon: '📱',
        });
      }
    } catch {
      toast.error('Could not save marks');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePending = async (submissionKey: string) => {
    if (!event) return;
    await removePendingScore(submissionKey);
    await refreshPendingQueue(event.id);
    toast.success('Removed unsynced entry');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading Scorer Pad…</p>
        </div>
      </div>
    );
  }

  if (errorType === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <Shield className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-1.5 text-sm text-slate-600">{errorMessage}</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (errorType === 'network' || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Connection Issue</h1>
          <p className="mt-1.5 text-sm text-slate-600">{errorMessage}</p>
          <button
            type="button"
            onClick={() => loadData(false)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const daysList =
    event.days && event.days.length > 0
      ? event.days
      : Array.from({ length: Math.max(1, event.number_of_days || 1) }, (_, idx) => ({
          id: `day-${idx + 1}`,
          day_number: idx + 1,
          label: `Day ${idx + 1}`,
          is_locked: false,
          carry_over_from_previous: true,
        }));

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white"
                title="GamesCo Home"
              >
                <Trophy className="h-4 w-4" />
              </Link>
              <span className="truncate text-base font-extrabold text-slate-900">
                {event.name}
              </span>
            </div>
          </div>

          {/* Sync & Nav Controls */}
          <div className="flex items-center gap-2">
            {/* Offline / Sync Pill */}
            {syncing ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Syncing…
              </span>
            ) : !isOnline || usingOfflineCache ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                <CloudOff className="h-3.5 w-3.5" />
                Offline{pendingQueue.length > 0 ? ` · ${pendingQueue.length} queued` : ''}
              </span>
            ) : pendingQueue.length > 0 ? (
              <button
                type="button"
                onClick={() => runSync(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200"
              >
                <CloudUpload className="h-3.5 w-3.5" />
                Sync {pendingQueue.length} now
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Wifi className="h-3.5 w-3.5" />
                Synced
              </span>
            )}

            <Link
              href={`/history/${token}`}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <History className="h-3.5 w-3.5" />
              History
            </Link>

            {event.public_token && (
              <Link
                href={`/scoreboard/${event.public_token}`}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Monitor className="h-3.5 w-3.5" />
                Board
              </Link>
            )}
          </div>
        </div>

        {/* Day Selector Strip */}
        <div className="mx-auto max-w-3xl border-t border-slate-100 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {daysList.map((day) => {
              const active = day.day_number === selectedDay;
              return (
                <button
                  key={day.day_number}
                  type="button"
                  onClick={() => setSelectedDay(day.day_number)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {day.label}
                  {day.is_locked && <Lock className="h-3 w-3 opacity-80" />}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6">
        {/* Locked Day Warning */}
        {isDayLocked && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Lock className="h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold">
                {event.is_finalized
                  ? 'This event is finalized'
                  : `${currentDayInfo.label} is locked`}
              </p>
              <p className="text-xs text-amber-800">
                Select another unlocked day above or ask the Event Admin to unlock this day.
              </p>
            </div>
          </div>
        )}

        {/* Scoring Form */}
        <form onSubmit={handleSubmitMarks} className="space-y-4">
          {/* Game Name / Deduction Reason */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <label
              htmlFor="game-reason"
              className="block text-sm font-bold text-slate-900"
            >
              Game Name
            </label>
            <input
              id="game-reason"
              type="text"
              disabled={isDayLocked}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Sack Race, Bible Quiz, Extra Marks..."
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
            />

            {/* Quick Preset Chips */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  disabled={isDayLocked}
                  onClick={() => setCategory(preset.label)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                    preset.defaultPoints < 0
                      ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          {/* Teams Scoring Pad */}
          <section className="space-y-3">
            {optimisticTeams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No teams yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Ask the Event Admin to add teams first.
                </p>
              </div>
            ) : (
              optimisticTeams.map((team) => {
                const rawVal = teamInputs[team.id] ?? '';
                const numericVal = Number.parseInt(rawVal, 10);
                const hasVal = rawVal.trim() !== '' && rawVal.trim() !== '-' && !Number.isNaN(numericVal);

                return (
                  <div
                    key={team.id}
                    className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                      hasVal
                        ? numericVal < 0
                          ? 'border-red-300 ring-1 ring-red-100'
                          : numericVal === 0
                          ? 'border-blue-300 ring-1 ring-blue-100'
                          : 'border-emerald-300 ring-1 ring-emerald-100'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-4 w-4 shrink-0 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-base font-bold text-slate-900">
                          {team.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs tabular-nums">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                          Day {selectedDay}: {team.displayDay}
                        </span>
                        <span className="font-bold text-slate-900">
                          Overall: {team.displayOverall}
                        </span>
                      </div>
                    </div>

                    {/* Input Row: +/- Toggle + Number Input */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isDayLocked}
                        onClick={() => toggleSign(team.id)}
                        title="Switch between positive (+) and negative (-)"
                        className={`flex h-11 w-12 shrink-0 items-center justify-center rounded-xl border text-base font-extrabold transition disabled:opacity-50 ${
                          rawVal.startsWith('-')
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {rawVal.startsWith('-') ? '−' : '+'}
                      </button>

                      <input
                        type="number"
                        inputMode="numeric"
                        disabled={isDayLocked}
                        value={rawVal}
                        onChange={(e) =>
                          setTeamInputs((prev) => ({
                            ...prev,
                            [team.id]: e.target.value,
                          }))
                        }
                        placeholder="0 (e.g., 100 or -10)"
                        className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3.5 text-base font-bold text-slate-900 tabular-nums placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
                      />
                    </div>

                    {/* Wrapping Quick-Tap Buttons (Zero Overflow!) */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {QUICK_DELTAS.map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          disabled={isDayLocked}
                          onClick={() => adjustTeamInput(team.id, delta)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold tabular-nums transition active:scale-95 disabled:opacity-50 ${
                            delta < 0
                              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                              : delta === 0
                              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </button>
                      ))}
                      {rawVal && (
                        <button
                          type="button"
                          onClick={() =>
                            setTeamInputs((prev) => ({ ...prev, [team.id]: '' }))
                          }
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* Submit Action Bar */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting || isDayLocked || enteredItems.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              <Send className="h-5 w-5" />
              {submitting
                ? 'Saving Marks…'
                : enteredItems.length > 0
                ? `Save Marks for ${enteredItems.length} Team${
                    enteredItems.length > 1 ? 's' : ''
                  } (Day ${selectedDay})`
                : 'Enter marks above to save'}
            </button>
          </div>
        </form>

        {/* Pending Offline Queue */}
        {pendingQueue.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CloudUpload className="h-5 w-5 text-amber-700" />
                <div>
                  <h2 className="text-sm font-bold text-amber-950">
                    Waiting to Sync ({pendingQueue.length})
                  </h2>
                  <p className="text-xs text-amber-800">
                    Safely stored on your phone. Auto-syncs when internet returns.
                  </p>
                </div>
              </div>
              {isOnline && (
                <button
                  type="button"
                  onClick={() => runSync(true)}
                  disabled={syncing}
                  className="rounded-xl bg-amber-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
                >
                  {syncing ? 'Syncing…' : 'Sync Now'}
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {pendingQueue.map((batch) => (
                <div
                  key={batch.submissionKey}
                  className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-white p-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">
                      {batch.category} · Day {batch.dayNumber}
                    </p>
                    <p className="mt-0.5 text-slate-600">
                      {batch.items
                        .map(
                          (i) =>
                            `${i.team_name}: ${i.points > 0 ? `+${i.points}` : i.points}`
                        )
                        .join(' · ')}
                    </p>
                    {batch.lastError && (
                      <p className="mt-1 font-medium text-red-600">{batch.lastError}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePending(batch.submissionKey)}
                    title="Delete unsynced entry"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Helpful Footer Note */}
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          This event is saved on your device — you can reopen it anytime from GamesCo Home.
        </p>
        <PoweredByFooter />
      </main>
    </div>
  );
}
