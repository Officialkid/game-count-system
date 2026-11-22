'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Monitor,
  Plus,
  Shield,
  Trash2,
  Trophy,
  WifiOff,
  Zap,
} from 'lucide-react';
import {
  getSavedEvents,
  removeSavedEvent,
  SavedEventEntry,
} from '@/lib/device-vault';
import { PoweredByFooter } from '@/components/PoweredByFooter';

const ROLE_LABELS: Record<SavedEventEntry['role'], { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  scorer: { label: 'Scorer', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  viewer: { label: 'Public View', color: 'bg-amber-100 text-amber-800 border-amber-200' },
};

export default function HomePage() {
  const [savedEvents, setSavedEvents] = useState<SavedEventEntry[]>([]);

  useEffect(() => {
    setSavedEvents(getSavedEvents());
  }, []);

  const handleRemoveSaved = (entry: SavedEventEntry) => {
    const next = removeSavedEvent(entry.eventId, entry.role);
    setSavedEvents(next);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              GamesCo
            </span>
          </Link>

          <Link
            href="/events/create"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Saved Events on This Device (Zero-Signup Persistence) */}
        {savedEvents.length > 0 && (
          <section className="mb-10 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Saved on This Device
                </p>
                <h2 className="text-lg font-bold text-slate-900">
                  Continue Your Event
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                No login needed
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {savedEvents.map((entry) => {
                const badge = ROLE_LABELS[entry.role];
                return (
                  <div
                    key={`${entry.eventId}-${entry.role}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-blue-300 hover:bg-white"
                  >
                    <Link href={entry.path} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        {entry.numberOfDays && entry.numberOfDays > 1 && (
                          <span className="text-xs text-slate-500">
                            {entry.numberOfDays} days
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-base font-bold text-slate-900">
                        {entry.eventName}
                      </p>
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={entry.path}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemoveSaved(entry)}
                        title="Remove from this device"
                        aria-label={`Remove ${entry.eventName}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700">
            <Zap className="h-3.5 w-3.5" />
            Zero Sign-Up · Offline-Ready PWA · Live Public Display
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Live scoreboards for camps, games, and multi-day events.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Create an event in 30 seconds, award points or record deductions outdoors even
            without internet, and display crystal-clear daily and overall standings publicly.
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

        {/* Core Capabilities */}
        <section className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Multi-Day &amp; Carry-Over
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Run 1-day tournaments or 4-day camps. Choose each morning whether to continue
              from yesterday&apos;s totals or start fresh.
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
              Keep entering marks and penalties for hours without internet. The moment you
              return to Wi-Fi, scores auto-sync with zero duplicates.
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
              Show who won today&apos;s games alongside who leads the overall camp, with a
              projector-ready dark TV mode.
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
              Share one Scorer link and one Public link. Open it once and GamesCo remembers
              your event right on your device.
            </p>
          </div>
        </section>
      </main>
      <PoweredByFooter />
    </div>
  );
}
