'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CalendarDays,
  Link2,
  Monitor,
  PencilLine,
  Plus,
  Shield,
  Trash2,
  Trophy,
  Tv,
  WifiOff,
  Zap,
} from 'lucide-react';
import {
  getSavedEvents,
  removeSavedEvent,
  SavedEventEntry,
} from '@/lib/device-vault';
import { PoweredByFooter } from '@/components/PoweredByFooter';

interface GroupedEvent {
  eventId: string;
  eventName: string;
  numberOfDays?: number;
  lastOpenedAt: string;
  admin?: SavedEventEntry;
  scorer?: SavedEventEntry;
  viewer?: SavedEventEntry;
}

export default function HomePage() {
  const router = useRouter();
  const [savedEvents, setSavedEvents] = useState<SavedEventEntry[]>([]);
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [pasteLink, setPasteLink] = useState('');

  useEffect(() => {
    setSavedEvents(getSavedEvents());
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalonePwa(standalone);
    setHydrated(true);
  }, []);

  // Group saved role links into 1 clean card per event
  const groupedEvents: GroupedEvent[] = useMemo(() => {
    const map = new Map<string, GroupedEvent>();
    for (const entry of savedEvents) {
      const existing = map.get(entry.eventId) || {
        eventId: entry.eventId,
        eventName: entry.eventName,
        numberOfDays: entry.numberOfDays,
        lastOpenedAt: entry.lastOpenedAt,
      };
      if (entry.role === 'admin') existing.admin = entry;
      if (entry.role === 'scorer') existing.scorer = entry;
      if (entry.role === 'viewer') existing.viewer = entry;
      if (entry.lastOpenedAt > existing.lastOpenedAt) {
        existing.lastOpenedAt = entry.lastOpenedAt;
      }
      map.set(entry.eventId, existing);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    );
  }, [savedEvents]);

  const handleRemoveWholeEvent = (group: GroupedEvent) => {
    let next = savedEvents;
    if (group.admin) next = removeSavedEvent(group.eventId, 'admin');
    if (group.scorer) next = removeSavedEvent(group.eventId, 'scorer');
    if (group.viewer) next = removeSavedEvent(group.eventId, 'viewer');
    setSavedEvents(next);
    toast.success(`Removed ${group.eventName} from this device`);
  };

  const handleOpenPastedLink = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = pasteLink.trim();
    if (!raw) return;

    try {
      const parsed = raw.startsWith('http')
        ? new URL(raw)
        : new URL(raw, window.location.origin);
      const path = parsed.pathname;
      if (
        path.startsWith('/admin/') ||
        path.startsWith('/score/') ||
        path.startsWith('/scoreboard/') ||
        path.startsWith('/recap/') ||
        path.startsWith('/public/')
      ) {
        router.push(path);
        return;
      }
    } catch {
      // Fall through
    }
    toast.error('Please paste a valid Admin, Scorer, or Public Scoreboard link');
  };

  const showAppWorkspace = hydrated && (groupedEvents.length > 0 || isStandalonePwa);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Clean Mobile-First Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              GamesCo
            </span>
          </Link>

          <Link
            href="/events/create"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>New Event</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {showAppWorkspace ? (
          /* ===== PURE APP WORKSPACE (NO MARKETING WEBSITE CLUTTER!) ===== */
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  My Events
                </p>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Saved on This Device
                </h1>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {groupedEvents.length} event{groupedEvents.length === 1 ? '' : 's'}
              </span>
            </div>

            {groupedEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <Trophy className="mx-auto h-10 w-10 text-blue-600 opacity-80" />
                <h2 className="mt-3 text-lg font-bold text-slate-900">
                  No events saved yet
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Create a new event or paste a link shared with you below.
                </p>
                <Link
                  href="/events/create"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Event
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedEvents.map((group) => (
                  <div
                    key={group.eventId}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-extrabold text-slate-900">
                          {group.eventName}
                        </h2>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {group.numberOfDays
                            ? `${group.numberOfDays} day${group.numberOfDays > 1 ? 's' : ''}`
                            : 'Event'}{' '}
                          · Saved on this device
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveWholeEvent(group)}
                        title="Remove from this device"
                        aria-label={`Remove ${group.eventName}`}
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Clean Action Buttons — Wraps Gracefully on Narrow Phones */}
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                      {group.scorer && (
                        <Link
                          href={group.scorer.path}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <PencilLine className="h-4 w-4" />
                          Enter Marks
                        </Link>
                      )}
                      {group.admin && (
                        <Link
                          href={group.admin.path}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      {group.viewer && (
                        <Link
                          href={group.viewer.path}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                        >
                          <Monitor className="h-4 w-4" />
                          Public Board
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Open Another Event via Link */}
            <form
              onSubmit={handleOpenPastedLink}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <label
                htmlFor="join-link"
                className="flex items-center gap-2 text-sm font-bold text-slate-900"
              >
                <Link2 className="h-4 w-4 text-blue-600" />
                Open Another Event Link
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Paste an Admin, Scorer, or Public link shared with you to save it here.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  id="join-link"
                  type="text"
                  value={pasteLink}
                  onChange={(e) => setPasteLink(e.target.value)}
                  placeholder="https://.../score/..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!pasteLink.trim()}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Open
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ===== FIRST-TIME WEB VISITOR LANDING ===== */
          <>
            <section className="mx-auto max-w-3xl py-6 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
                <Zap className="h-3.5 w-3.5" />
                Zero Sign-Up · Offline-Ready PWA · Live Public Display
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Live scoreboards for camps, games, and multi-day events.
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Create an event in 30 seconds, award points or record deductions outdoors
                even without internet, and display crystal-clear daily and overall standings
                publicly.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/events/create"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
                >
                  Create Your Event
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </section>

            <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Multi-Day &amp; Carry-Over
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Run 1-day tournaments or 4-day camps. Choose each morning whether to
                  continue totals or start fresh.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <WifiOff className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Works Outdoors Offline
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Enter marks for hours without internet. The moment you return to Wi-Fi,
                  scores auto-sync with zero duplicates.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Monitor className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Today + Overall Public View
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Show who won today alongside who leads overall, with a projector-ready
                  dark TV mode and live Reveal Show.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  No Accounts Needed
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Share one Scorer link and one Public link. Open it once and GamesCo
                  remembers your event right on your device.
                </p>
              </div>
            </section>
          </>
        )}
      </main>

      <PoweredByFooter />
    </div>
  );
}
