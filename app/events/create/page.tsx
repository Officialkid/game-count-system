'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Plus,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { saveEventToDevice } from '@/lib/device-vault';

const DAY_PRESETS = [
  { days: 1, label: '1 Day' },
  { days: 2, label: '2 Days' },
  { days: 3, label: '3 Days' },
  { days: 4, label: '4 Days' },
  { days: 5, label: '5 Days' },
  { days: 7, label: '7 Days' },
];

const TEAM_COLORS = [
  '#2563EB',
  '#DC2626',
  '#16A34A',
  '#D97706',
  '#9333EA',
  '#0891B2',
  '#EA580C',
  '#DB2777',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(4);
  const [startDate, setStartDate] = useState(getTodayIso);
  const [teams, setTeams] = useState<string[]>(['', '', '']);
  const [creating, setCreating] = useState(false);

  const previewDayLabels = useMemo(() => {
    const base = startDate ? new Date(`${startDate}T08:00:00`) : new Date();
    const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
    return Array.from({ length: Math.max(1, Math.min(14, numberOfDays)) }, (_, idx) => {
      const d = new Date(safeBase);
      d.setDate(d.getDate() + idx);
      return `Day ${idx + 1} · ${WEEKDAYS[d.getDay()]}`;
    });
  }, [numberOfDays, startDate]);

  const handleTeamChange = (index: number, value: string) => {
    setTeams((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const handleAddTeamSlot = () => {
    setTeams((prev) => [...prev, '']);
  };

  const handleRemoveTeamSlot = (index: number) => {
    setTeams((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    if (!name.trim()) {
      toast.error('Please enter an event name');
      return;
    }
    setStep(2);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter an event name');
      setStep(1);
      return;
    }

    const cleanedTeams = teams.map((t) => t.trim()).filter(Boolean);

    try {
      setCreating(true);
      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          number_of_days: numberOfDays,
          eventMode: numberOfDays > 1 ? 'camp' : 'quick',
          scoringMode: numberOfDays > 1 ? 'daily' : 'continuous',
          startDate,
          dayLabels: previewDayLabels,
          teamNames: cleanedTeams,
          showPublicActivity: true,
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.success) {
        const msg =
          payload?.error?.message ||
          payload?.error ||
          'Failed to create event';
        throw new Error(typeof msg === 'string' ? msg : 'Failed to create event');
      }

      const data = payload.data;
      const adminToken = data.tokens.admin_token;

      // Save Admin access permanently in this device's vault
      saveEventToDevice({
        eventId: data.event.id,
        eventName: data.event.name,
        role: 'admin',
        token: adminToken,
        path: `/admin/${adminToken}`,
        numberOfDays: data.event.number_of_days ?? numberOfDays,
      });

      // Store launchpad payload for /events/success
      try {
        window.sessionStorage.setItem(
          'gamesco_created_event',
          JSON.stringify({
            event: data.event,
            tokens: data.tokens,
            shareLinks: data.shareLinks,
            teams: data.teams || [],
          })
        );
      } catch {
        // Ignore storage errors
      }

      toast.success('Event created!');
      router.push('/events/success');
    } catch (err: any) {
      toast.error(err?.message || 'Could not create event. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">GamesCo</span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Step {step} of 2
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Progress Indicator */}
        <div className="mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              step === 1
                ? 'bg-blue-600 text-white'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {step > 1 ? <Check className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
            1. Event &amp; Days
          </button>
          <div className="h-px flex-1 bg-slate-200" />
          <button
            type="button"
            onClick={() => name.trim() && setStep(2)}
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              step === 2
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            2. Teams
          </button>
        </div>

        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Set up your event
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Name your event and choose how many days it runs.
                </p>
              </div>

              {/* Event Name */}
              <div>
                <label
                  htmlFor="event-name"
                  className="mb-1.5 block text-sm font-semibold text-slate-800"
                >
                  Event Name
                </label>
                <input
                  id="event-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Jewels Kids Camp 2026"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>

              {/* Number of Days */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  How many days?
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {DAY_PRESETS.map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setNumberOfDays(preset.days)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                        numberOfDays === preset.days
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <label htmlFor="custom-days" className="text-xs font-medium text-slate-500">
                    Or custom days:
                  </label>
                  <input
                    id="custom-days"
                    type="number"
                    min={1}
                    max={14}
                    value={numberOfDays}
                    onChange={(e) =>
                      setNumberOfDays(Math.max(1, Math.min(14, Number(e.target.value) || 1)))
                    }
                    className="w-20 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label
                  htmlFor="start-date"
                  className="mb-1.5 block text-sm font-semibold text-slate-800"
                >
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-56"
                />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {previewDayLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Next: Add Teams
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Add your teams
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Enter team names for <strong className="text-slate-900">{name}</strong>.
                  You can also add or edit teams later in the Admin panel.
                </p>
              </div>

              <div className="space-y-2.5">
                {teams.map((team, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: TEAM_COLORS[idx % TEAM_COLORS.length] }}
                    />
                    <input
                      type="text"
                      value={team}
                      onChange={(e) => handleTeamChange(idx, e.target.value)}
                      placeholder={`Team ${idx + 1} name (e.g., ${
                        ['Lions', 'Eagles', 'Sharks', 'Falcons'][idx] || `Team ${idx + 1}`
                      })`}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {teams.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamSlot(idx)}
                        aria-label="Remove team"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddTeamSlot}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                <Plus className="h-4 w-4" />
                Add another team
              </button>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {creating ? 'Creating Event...' : 'Launch Event'}
                  {!creating && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
