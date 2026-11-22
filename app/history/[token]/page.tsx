'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Lock,
  Pencil,
  RefreshCw,
  Shield,
  Trash2,
  Trophy,
} from 'lucide-react';

interface ScoreEntry {
  id: string;
  team_id: string;
  team_name: string;
  team_color: string;
  points: number;
  category: string | null;
  source_type?: string;
  created_at: string;
  day_number: number;
  day_label: string;
  day_locked?: boolean;
}

interface EventHeader {
  id: string;
  name: string;
  token_type?: 'admin' | 'scorer';
  is_finalized?: boolean;
}

export default function ScoreHistoryPage() {
  const params = useParams();
  const token = String(params?.token || '');

  const [event, setEvent] = useState<EventHeader | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [dayFilter, setDayFilter] = useState<'all' | number>('all');

  // Edit modal state
  const [editing, setEditing] = useState<ScoreEntry | null>(null);
  const [editPoints, setEditPoints] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg('');

      const eventRes = await fetch(`/api/event-by-token/${token}`, {
        cache: 'no-store',
      });
      if (eventRes.status === 401 || eventRes.status === 403 || eventRes.status === 404) {
        setErrorMsg('Access denied — this link is invalid or expired.');
        return;
      }
      if (!eventRes.ok) {
        throw new Error('Temporary server error');
      }

      const eventPayload = await eventRes.json();
      const loadedEvent: EventHeader = eventPayload?.data?.event;
      if (!loadedEvent) {
        setErrorMsg('Event not found.');
        return;
      }

      setEvent(loadedEvent);

      const historyRes = await fetch(`/api/events/${loadedEvent.id}/history`, {
        headers: {
          'X-ADMIN-TOKEN': token,
          'X-SCORER-TOKEN': token,
        },
        cache: 'no-store',
      });
      const historyPayload = await historyRes.json();
      if (!historyRes.ok || !historyPayload.success) {
        setErrorMsg(historyPayload?.error || 'Could not load score history.');
        return;
      }

      setScores(historyPayload?.data?.scores || []);
    } catch {
      setErrorMsg('Could not reach the server. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !event) return;
    const parsed = Number.parseInt(editPoints, 10);
    if (Number.isNaN(parsed)) {
      toast.error('Enter a valid whole number');
      return;
    }

    try {
      setSavingEdit(true);
      const res = await fetch(`/api/events/${event.id}/scores/${editing.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token,
          'X-SCORER-TOKEN': token,
        },
        body: JSON.stringify({
          points: parsed,
          category: editCategory.trim() || editing.category,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || data?.error || 'Failed to update score');
      }
      toast.success('Score updated');
      setEditing(null);
      await loadHistory();
    } catch (err: any) {
      toast.error(err?.message || 'Unable to update score');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (entry: ScoreEntry) => {
    if (!event) return;
    if (!window.confirm(`Delete ${entry.points} pts for ${entry.team_name}?`)) return;
    try {
      const res = await fetch(`/api/events/${event.id}/scores/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'X-ADMIN-TOKEN': token,
          'X-SCORER-TOKEN': token,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || data?.error || 'Failed to delete score');
      }
      toast.success('Entry deleted');
      await loadHistory();
    } catch (err: any) {
      toast.error(err?.message || 'Unable to delete entry');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (errorMsg || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <Shield className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">History Unavailable</h1>
          <p className="mt-1.5 text-sm text-slate-600">{errorMsg}</p>
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

  const backHref =
    event.token_type === 'admin' ? `/admin/${token}` : `/score/${token}`;
  const uniqueDays = Array.from(new Set(scores.map((s) => s.day_number))).sort(
    (a, b) => a - b
  );
  const visibleScores =
    dayFilter === 'all' ? scores : scores.filter((s) => s.day_number === dayFilter);

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 sm:text-lg">
                Score History
              </h1>
              <p className="text-xs text-slate-500">{event.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadHistory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
        {uniqueDays.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setDayFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                dayFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              All Days ({scores.length})
            </button>
            {uniqueDays.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDayFilter(d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  dayFilter === d
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                Day {d}
              </button>
            ))}
          </div>
        )}

        {visibleScores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Trophy className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">
              No scores recorded yet
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visibleScores.map((entry) => {
              const canMutate =
                !entry.day_locked &&
                !event.is_finalized &&
                (event.token_type === 'admin' || event.token_type === 'scorer');
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.team_color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {entry.team_name}{' '}
                        <span className="font-normal text-slate-500">
                          · {entry.category || 'Score'}
                        </span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <span>{entry.day_label || `Day ${entry.day_number}`}</span>
                        {entry.day_locked && <Lock className="h-3 w-3" />}
                        <span>·</span>
                        <span>
                          {new Date(entry.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-sm font-extrabold tabular-nums ${
                        entry.points < 0
                          ? 'bg-red-50 text-red-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {entry.points > 0 ? `+${entry.points}` : entry.points}
                    </span>

                    {canMutate && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(entry);
                            setEditPoints(String(entry.points));
                            setEditCategory(entry.category || '');
                          }}
                          aria-label="Edit score"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry)}
                          aria-label="Delete score"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Score Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Edit Score — {editing.team_name}
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Game / Reason
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Points (positive or negative)
                </label>
                <input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold tabular-nums"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
