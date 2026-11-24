'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  History,
  Lock,
  Monitor,
  Pencil,
  PencilLine,
  Plus,
  RefreshCw,
  Settings,
  Share2,
  Shield,
  Snowflake,
  Sparkles,
  Trophy,
  Tv,
  Unlock,
  Users,
  X,
} from 'lucide-react';
import { saveEventToDevice } from '@/lib/device-vault';
import { generateResultsPDF } from '@/lib/pdf-export';
import { PoweredByFooter } from '@/components/PoweredByFooter';
import { PresentToScreenButton } from '@/components/PresentToScreenButton';
import { TvRemoteControl } from '@/components/TvRemoteControl';

const TEAM_COLOR_CHOICES = [
  '#2563EB',
  '#DC2626',
  '#16A34A',
  '#D97706',
  '#9333EA',
  '#0891B2',
  '#EA580C',
  '#DB2777',
];

interface EventDay {
  id: string;
  day_number: number;
  label: string;
  is_locked: boolean;
  carry_over_from_previous: boolean;
}

interface AdminEvent {
  id: string;
  name: string;
  mode: string;
  status: string;
  scoringMode: string;
  number_of_days: number;
  active_day_number: number;
  show_public_activity: boolean;
  is_frozen?: boolean;
  freeze_reason?: 'manual' | 'scheduled' | 'none';
  freeze_mode?: 'cutoff' | 'mystery';
  frozen_at?: string | null;
  auto_freeze_time?: string | null;
  is_finalized: boolean;
  start_at: string;
  end_at: string;
  admin_token?: string;
  scorer_token?: string;
  public_token?: string;
  days: EventDay[];
}

interface TeamSummary {
  id: string;
  name: string;
  color: string;
  total_points: number;
  day_totals?: Record<number, number>;
}

type AdminTab = 'overview' | 'teams' | 'share' | 'results';

export default function AdminDashboardPage() {
  const params = useParams();
  const token = String(params?.token || '');

  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'none' | 'denied' | 'network'>('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [origin, setOrigin] = useState('');

  // Team creation & editing state
  const [singleTeamName, setSingleTeamName] = useState('');
  const [bulkTeamText, setBulkTeamText] = useState('');
  const [addingTeams, setAddingTeams] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamColor, setEditTeamColor] = useState('#2563EB');
  const [savingTeamEdit, setSavingTeamEdit] = useState(false);

  // Day transition modal state
  const [showNextDayModal, setShowNextDayModal] = useState(false);
  const [nextDayCarryOver, setNextDayCarryOver] = useState(true);
  const [lockPrevDay, setLockPrevDay] = useState(true);
  const [switchingDay, setSwitchingDay] = useState(false);
  const [lockingDayNum, setLockingDayNum] = useState<number | null>(null);

  // Finalize & export state
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Suspense Freeze state
  const [freezeTimeInput, setFreezeTimeInput] = useState('');
  const [freezeModeInput, setFreezeModeInput] = useState<'cutoff' | 'mystery'>('cutoff');
  const [updatingFreeze, setUpdatingFreeze] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorType('none');
      setErrorMessage('');

      const eventRes = await fetch(`/api/event-by-token/${token}`, {
        headers: { 'X-ADMIN-TOKEN': token },
        cache: 'no-store',
      });

      if (eventRes.status === 401 || eventRes.status === 403 || eventRes.status === 404) {
        setErrorType('denied');
        setErrorMessage('This Admin link is invalid or has expired.');
        return;
      }

      if (!eventRes.ok) {
        const body = await eventRes.json().catch(() => ({}));
        setErrorType('network');
        setErrorMessage(
          body?.error?.message ||
            body?.error ||
            'Temporary server issue. Please tap Retry.'
        );
        return;
      }

      const eventPayload = await eventRes.json();
      const loadedEvent: AdminEvent = eventPayload?.data?.event;

      if (!loadedEvent || loadedEvent.admin_token !== token) {
        setErrorType('denied');
        setErrorMessage('This link does not have Admin permissions.');
        return;
      }

      setEvent(loadedEvent);
      setFreezeTimeInput(loadedEvent.auto_freeze_time || '');
      setFreezeModeInput(loadedEvent.freeze_mode === 'mystery' ? 'mystery' : 'cutoff');

      // Remember this event permanently on this device (Zero-Signup Vault)
      saveEventToDevice({
        eventId: loadedEvent.id,
        eventName: loadedEvent.name,
        role: 'admin',
        token,
        path: `/admin/${token}`,
        numberOfDays: loadedEvent.number_of_days,
      });

      const teamsRes = await fetch(`/api/events/${loadedEvent.id}/teams`, {
        headers: { 'X-ADMIN-TOKEN': token },
        cache: 'no-store',
      });
      if (teamsRes.ok) {
        const teamsPayload = await teamsRes.json();
        setTeams(teamsPayload?.data?.teams || []);
      }
    } catch {
      setErrorType('network');
      setErrorMessage('Could not reach the server. Check your internet and tap Retry.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddSingleTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !singleTeamName.trim()) return;
    try {
      setAddingTeams(true);
      const res = await fetch('/api/teams/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token,
        },
        body: JSON.stringify({
          event_id: event.id,
          teams: [{ name: singleTeamName.trim() }],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || data?.error || 'Failed to add team');
      }
      setSingleTeamName('');
      toast.success('Team added!');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add team');
    } finally {
      setAddingTeams(false);
    }
  };

  const handleBulkAddTeams = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    const names = bulkTeamText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) {
      toast.error('Enter at least one team name');
      return;
    }

    try {
      setAddingTeams(true);
      const res = await fetch('/api/teams/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token,
        },
        body: JSON.stringify({
          event_id: event.id,
          teams: names.map((name) => ({ name })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || data?.error || 'Failed to add teams');
      }
      setBulkTeamText('');
      toast.success(`Added ${names.length} team${names.length > 1 ? 's' : ''}!`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add teams');
    } finally {
      setAddingTeams(false);
    }
  };

  const handleStartEditTeam = (team: TeamSummary) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamColor(team.color || '#2563EB');
  };

  const handleSaveTeamEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !editingTeamId || !editTeamName.trim()) return;
    try {
      setSavingTeamEdit(true);
      const res = await fetch(`/api/events/${event.id}/teams/${editingTeamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token,
        },
        body: JSON.stringify({
          name: editTeamName.trim(),
          color: editTeamColor,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to rename team');
      }
      toast.success('Team updated!');
      setEditingTeamId(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Could not update team');
    } finally {
      setSavingTeamEdit(false);
    }
  };

  const handleToggleDayLock = async (dayNumber: number, currentlyLocked: boolean) => {
    if (!event) return;
    try {
      setLockingDayNum(dayNumber);
      const res = await fetch(`/api/events/${event.id}/days/${dayNumber}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token,
        },
        body: JSON.stringify({
          action: currentlyLocked ? 'unlock' : 'lock',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to update day lock');
      }
      toast.success(currentlyLocked ? `Day ${dayNumber} unlocked` : `Day ${dayNumber} locked`);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Could not update day lock');
    } finally {
      setLockingDayNum(null);
    }
  };

  const handleAdvanceDay = async (targetDayNumber: number, carryOver: boolean, lockPrev: boolean) => {
    if (!event) return;
    try {
      setSwitchingDay(true);
      const res = await fetch(`/api/events/${event.id}/days/advance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token,
        },
        body: JSON.stringify({
          target_day_number: targetDayNumber,
          carry_over_from_previous: carryOver,
          lock_previous_day: lockPrev,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to switch day');
      }
      setShowNextDayModal(false);
      toast.success(
        `Switched to Day ${targetDayNumber} (${
          carryOver ? 'continuing totals' : 'starting fresh'
        })`
      );
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to switch day');
    } finally {
      setSwitchingDay(false);
    }
  };

  const handleFinalizeEvent = async () => {
    if (!event) return;
    try {
      setFinalizing(true);
      const res = await fetch(`/api/events/${event.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token,
        },
        body: JSON.stringify({ admin_token: token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        const msg =
          typeof data?.error === 'string'
            ? data.error
            : data?.error?.message || 'Failed to finalize event';
        throw new Error(msg);
      }
      setShowFinalizeModal(false);
      toast.success('Final results published!');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish final results');
    } finally {
      setFinalizing(false);
    }
  };

  const handleUnfinalizeEvent = async () => {
    if (!event) return;
    try {
      setFinalizing(true);
      const res = await fetch(`/api/events/${event.id}/finalize`, {
        method: 'DELETE',
        headers: {
          'X-ADMIN-TOKEN': token,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        const msg =
          typeof data?.error === 'string'
            ? data.error
            : data?.error?.message || 'Failed to reopen event';
        throw new Error(msg);
      }
      toast.success('Event reopened for scoring');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reopen event');
    } finally {
      setFinalizing(false);
    }
  };

  const handleTogglePublicActivity = async () => {
    if (!event) return;
    try {
      setUpdatingSettings(true);
      const nextVal = !event.show_public_activity;
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token,
        },
        body: JSON.stringify({ show_public_activity: nextVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed to update setting');
      }
      setEvent((prev) => (prev ? { ...prev, show_public_activity: nextVal } : prev));
      toast.success(
        nextVal
          ? 'Public activity feed enabled'
          : 'Public activity feed hidden (totals only)'
      );
    } catch (err: any) {
      toast.error(err?.message || 'Could not update setting');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleFreezeAction = async (
    action: 'freeze' | 'unfreeze' | 'configure',
    overrides?: { auto_freeze_time?: string | null; freeze_mode?: 'cutoff' | 'mystery' }
  ) => {
    if (!event) return;
    try {
      setUpdatingFreeze(true);
      const tzOffset = new Date().getTimezoneOffset() * -1; // minutes ahead of UTC
      const res = await fetch(`/api/events/${event.id}/freeze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token,
        },
        body: JSON.stringify({
          action,
          freeze_mode: overrides?.freeze_mode ?? freezeModeInput,
          auto_freeze_time:
            overrides?.auto_freeze_time !== undefined
              ? overrides.auto_freeze_time
              : freezeTimeInput || null,
          timezone_offset: tzOffset,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.success) {
        throw new Error(payload?.error || 'Failed to update Suspense Freeze');
      }
      if (action === 'freeze') {
        toast.success('Public scoreboard frozen! New marks are hidden until Reveal.');
      } else if (action === 'unfreeze') {
        toast.success('Public scoreboard unfrozen — live results are visible!');
      } else {
        toast.success('Suspense Freeze settings saved!');
      }
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Could not update freeze settings');
    } finally {
      setUpdatingFreeze(false);
    }
  };

  const handleExportPdf = async () => {
    if (!event) return;
    try {
      setExportingPdf(true);
      const ranked = [...teams].sort((a, b) => b.total_points - a.total_points);
      await generateResultsPDF({
        event: {
          event_name: event.name,
          mode: (event.mode as 'quick' | 'camp' | 'advanced') || 'camp',
          theme_color: '#2563eb',
          public_token: event.public_token || '',
          finalized_at: event.is_finalized ? new Date().toISOString() : undefined,
        },
        teams: ranked.map((t, index) => ({
          id: index + 1,
          team_name: t.name,
          avatar_url: null,
          total_points: t.total_points,
        })),
        includeLink: true,
      });
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const copyLink = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast.success('Link copied!');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading Admin Dashboard…</p>
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
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
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
            onClick={loadData}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeDay = event.active_day_number || 1;
  const sortedOverall = [...teams].sort((a, b) => b.total_points - a.total_points);
  const overallLeader = sortedOverall[0];
  const nextDayNumber = activeDay + 1;
  const hasNextDay = nextDayNumber <= Math.max(event.number_of_days, event.days.length);

  const scorerUrl = `${origin}/score/${event.scorer_token || ''}`;
  const publicUrl = `${origin}/scoreboard/${event.public_token || ''}`;
  const adminUrl = `${origin}/admin/${token}`;

  const tabs: Array<{ id: AdminTab; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview & Days', icon: CalendarDays },
    { id: 'teams', label: `Teams (${teams.length})`, icon: Users },
    { id: 'share', label: 'Share & QR', icon: Share2 },
    { id: 'results', label: 'Results & Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white"
                title="GamesCo Home"
              >
                <Trophy className="h-4 w-4" />
              </Link>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                Admin
              </span>
              {event.is_finalized ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Finalized
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  Day {activeDay} of {event.number_of_days}
                </span>
              )}
              {event.is_frozen && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                  <Snowflake className="h-3 w-3" />
                  Frozen
                </span>
              )}
            </div>
            <h1 className="mt-1 truncate text-lg font-extrabold text-slate-900 sm:text-xl">
              {event.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {event.scorer_token && (
              <Link
                href={`/score/${event.scorer_token}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <PencilLine className="h-3.5 w-3.5" />
                Enter Scores
              </Link>
            )}
            {event.public_token && (
              <>
                <PresentToScreenButton
                  publicToken={event.public_token}
                  eventName={event.name}
                />
                <Link
                  href={`/scoreboard/${event.public_token}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Public Board
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Clean 4-Tab Bar */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto border-t border-slate-100 pt-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* TAB 1: OVERVIEW & DAYS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Day
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {event.days.find((d) => d.day_number === activeDay)?.label ||
                    `Day ${activeDay}`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  of {event.number_of_days} total day{event.number_of_days > 1 ? 's' : ''}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Overall Leader
                </p>
                <p className="mt-1 truncate text-2xl font-extrabold text-slate-900">
                  {overallLeader ? overallLeader.name : 'No teams yet'}
                </p>
                <p className="mt-1 text-xs font-semibold text-blue-600 tabular-nums">
                  {overallLeader ? `${overallLeader.total_points} pts overall` : 'Add teams to begin'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Teams &amp; History
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {teams.length} Teams
                </p>
                <Link
                  href={`/history/${token}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <History className="h-3.5 w-3.5" />
                  View &amp; Edit Score History
                </Link>
              </div>
            </div>

            {/* Day Management & Transition */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Day Schedule &amp; Locking
                  </h2>
                  <p className="text-sm text-slate-600">
                    Lock finished days to prevent accidental edits, and move to the next day
                    with carry-over or a fresh start.
                  </p>
                </div>

                {!event.is_finalized && hasNextDay && (
                  <button
                    type="button"
                    onClick={() => {
                      setNextDayCarryOver(true);
                      setLockPrevDay(true);
                      setShowNextDayModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    Start Day {nextDayNumber}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {event.days.map((day) => {
                  const isActiveDay = day.day_number === activeDay;
                  return (
                    <div
                      key={day.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${
                        isActiveDay
                          ? 'border-blue-300 bg-blue-50/60'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{day.label}</span>
                          {isActiveDay && (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                              Active
                            </span>
                          )}
                          {day.is_locked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              <Lock className="h-3 w-3" />
                              Locked
                            </span>
                          )}
                        </div>
                        {day.day_number > 1 && (
                          <p className="mt-1 text-xs text-slate-500">
                            {day.carry_over_from_previous
                              ? 'Continues from previous day totals'
                              : 'Starts fresh at 0 (overall still tracked)'}
                          </p>
                        )}
                      </div>

                      {!event.is_finalized && (
                        <div className="flex items-center gap-1.5">
                          {!isActiveDay && !day.is_locked && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAdvanceDay(
                                  day.day_number,
                                  day.carry_over_from_previous,
                                  false
                                )
                              }
                              disabled={switchingDay}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Set Active
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleDayLock(day.day_number, day.is_locked)
                            }
                            disabled={lockingDayNum === day.day_number}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                              day.is_locked
                                ? 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {day.is_locked ? (
                              <>
                                <Unlock className="h-3.5 w-3.5" />
                                Unlock
                              </>
                            ) : (
                              <>
                                <Lock className="h-3.5 w-3.5" />
                                Lock
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick Standings Preview */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Current Standings</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('teams')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Manage Teams →
                </button>
              </div>
              {teams.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No teams added yet. Switch to the Teams tab to add your teams.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {sortedOverall.map((team, idx) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-sm font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <span
                          className="h-3.5 w-3.5 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-semibold text-slate-900">{team.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right tabular-nums">
                        <span className="text-xs text-slate-500">
                          Day {activeDay}:{' '}
                          <strong className="text-slate-800">
                            {team.day_totals?.[activeDay] ?? 0}
                          </strong>
                        </span>
                        <span className="text-base font-extrabold text-slate-900">
                          {team.total_points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: TEAMS */}
        {activeTab === 'teams' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Existing Teams */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Teams ({teams.length})
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Distinct team colors are automatically assigned.
              </p>

              <div className="mt-4 space-y-2.5">
                {teams.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No teams yet. Add your first team on the right.
                  </p>
                ) : (
                  teams.map((team) => {
                    const isEditing = editingTeamId === team.id;
                    if (isEditing) {
                      return (
                        <form
                          key={team.id}
                          onSubmit={handleSaveTeamEdit}
                          className="space-y-3 rounded-xl border border-blue-300 bg-blue-50/50 p-3.5"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editTeamName}
                              onChange={(e) => setEditTeamName(e.target.value)}
                              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="submit"
                              disabled={savingTeamEdit || !editTeamName.trim()}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {savingTeamEdit ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTeamId(null)}
                              aria-label="Cancel edit"
                              className="rounded-lg p-2 text-slate-500 hover:bg-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-slate-600">Color:</span>
                            {TEAM_COLOR_CHOICES.map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => setEditTeamColor(hex)}
                                className={`h-6 w-6 rounded-full transition ${
                                  editTeamColor === hex
                                    ? 'ring-2 ring-slate-900 ring-offset-2'
                                    : 'opacity-80 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: hex }}
                                aria-label={`Select color ${hex}`}
                              />
                            ))}
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div
                        key={team.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="h-4 w-4 shrink-0 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="truncate font-semibold text-slate-900">
                            {team.name}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-bold text-slate-700 tabular-nums">
                            {team.total_points} pts
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEditTeam(team)}
                            title="Rename team or change color"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Add Teams */}
            <div className="space-y-5">
              <form
                onSubmit={handleAddSingleTeam}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <h3 className="text-base font-bold text-slate-900">Quick Add Team</h3>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={singleTeamName}
                    onChange={(e) => setSingleTeamName(e.target.value)}
                    placeholder="e.g., Team Eagles"
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={addingTeams || !singleTeamName.trim()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </form>

              <form
                onSubmit={handleBulkAddTeams}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <h3 className="text-base font-bold text-slate-900">Bulk Add Teams</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Paste multiple team names separated by new lines or commas.
                </p>
                <textarea
                  rows={4}
                  value={bulkTeamText}
                  onChange={(e) => setBulkTeamText(e.target.value)}
                  placeholder={'Team Alpha\nTeam Beta\nTeam Gamma'}
                  className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={addingTeams || !bulkTeamText.trim()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {addingTeams ? 'Adding…' : 'Add All Teams'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: SHARE & QR */}
        {activeTab === 'share' && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4 md:col-span-2">
              {[
                {
                  key: 'scorer',
                  title: 'Scorer Link (Share with Admins / Scorers)',
                  desc: 'Opens the offline-ready scoring pad. Once opened on their phone, it stays saved.',
                  url: scorerUrl,
                },
                {
                  key: 'public',
                  title: 'Public Scoreboard Link',
                  desc: 'Read-only live standings showing Today’s Leader and Overall Leader.',
                  url: publicUrl,
                },
                {
                  key: 'admin',
                  title: 'Owner / Admin Link (Keep Private)',
                  desc: 'Full control over teams, days, locking, and publishing final results.',
                  url: adminUrl,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-600">{item.desc}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={item.url}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink(item.key, item.url)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      {copiedKey === item.key ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Public Scoreboard QR
              </p>
              <div className="my-4 rounded-xl border border-slate-100 p-3">
                {publicUrl && <QRCodeSVG value={publicUrl} size={168} />}
              </div>
              <Link
                href={`/scoreboard/${event.public_token || ''}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                Open Public Scoreboard
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* TAB 4: RESULTS & SETTINGS */}
        {activeTab === 'results' && (
          <div className="space-y-5">
            {/* Single Non-Duplicated Results Management Card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Results Management</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Publish final standings when the event concludes, or download an official
                    PDF report anytime.
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    event.is_finalized
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {event.is_finalized ? 'Finalized' : 'Active'}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {!event.is_finalized ? (
                  <button
                    type="button"
                    onClick={() => setShowFinalizeModal(true)}
                    disabled={finalizing}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Publish Final Results
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleUnfinalizeEvent}
                    disabled={finalizing}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                  >
                    <Unlock className="h-4 w-4" />
                    {finalizing ? 'Reopening…' : 'Reopen Event for Editing'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {exportingPdf ? 'Generating PDF…' : 'Download PDF'}
                  </span>
                </button>

                {event.public_token && (
                  <Link
                    href={`/recap/${event.public_token}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <Trophy className="h-4 w-4" />
                    View Event Recap
                  </Link>
                )}
              </div>
            </section>

            {/* Suspense Freeze Card (Hide Public Marks Until Reveal Show) */}
            <section className="rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-600">
                    <Snowflake className="h-4 w-4" />
                    Suspense Freeze · Auto-Unfreezes on Reveal
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    Hide Public Marks Before the Reveal Show
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Freeze the public scoreboard manually or automatically at a set time each
                    day. Scorers keep entering marks privately, and the moment you reveal{' '}
                    <strong>#1 Champion</strong> in the Reveal Show, the public board
                    automatically unfreezes!
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    event.is_frozen
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {event.is_frozen ? '❄️ Public Board Frozen' : '🟢 Public Board Live'}
                </span>
              </div>

              {/* Instant Freeze / Unfreeze Button */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {!event.is_frozen ? (
                  <button
                    type="button"
                    disabled={updatingFreeze}
                    onClick={() => handleFreezeAction('freeze')}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
                  >
                    <Snowflake className="h-4 w-4" />
                    {updatingFreeze ? 'Freezing…' : 'Freeze Public Scores Now'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updatingFreeze}
                    onClick={() => handleFreezeAction('unfreeze')}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Unlock className="h-4 w-4" />
                    {updatingFreeze ? 'Unfreezing…' : 'Unfreeze & Show Live Results'}
                  </button>
                )}
              </div>

              {/* Daily Auto-Freeze Schedule & Display Style */}
              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="auto-freeze-time"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Daily Auto-Freeze Time (Optional)
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500">
                    e.g., set <strong>19:00</strong> (7:00 PM) so evening marks stay secret
                    until you run the Reveal Show.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      id="auto-freeze-time"
                      type="time"
                      value={freezeTimeInput}
                      onChange={(e) => setFreezeTimeInput(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={updatingFreeze}
                      onClick={() =>
                        handleFreezeAction('configure', {
                          auto_freeze_time: freezeTimeInput || null,
                        })
                      }
                      className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      Save Time
                    </button>
                    {freezeTimeInput && (
                      <button
                        type="button"
                        disabled={updatingFreeze}
                        onClick={() => {
                          setFreezeTimeInput('');
                          handleFreezeAction('configure', { auto_freeze_time: null });
                        }}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    What Public Sees While Frozen
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={updatingFreeze}
                      onClick={() => {
                        setFreezeModeInput('cutoff');
                        handleFreezeAction('configure', { freeze_mode: 'cutoff' });
                      }}
                      className={`rounded-xl border p-3 text-left text-xs transition ${
                        freezeModeInput === 'cutoff'
                          ? 'border-sky-600 bg-sky-50 text-sky-900'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <p className="font-bold">Frozen at Cutoff</p>
                      <p className="mt-0.5 opacity-80">
                        Keeps pre-freeze scores; hides new marks
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={updatingFreeze}
                      onClick={() => {
                        setFreezeModeInput('mystery');
                        handleFreezeAction('configure', { freeze_mode: 'mystery' });
                      }}
                      className={`rounded-xl border p-3 text-left text-xs transition ${
                        freezeModeInput === 'mystery'
                          ? 'border-sky-600 bg-sky-50 text-sky-900'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <p className="font-bold">Full Mystery Lock</p>
                      <p className="mt-0.5 opacity-80">
                        Hides all marks behind a lock screen
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Public Display Privacy Toggle */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Show Game &amp; Deduction Activity Publicly
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    When enabled, viewers on the public scoreboard can expand the recent
                    activity feed to see individual game awards and penalties.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePublicActivity}
                  disabled={updatingSettings}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                    event.show_public_activity ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle public activity feed"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      event.show_public_activity ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
      <PoweredByFooter />

      {/* Guided Next-Day Transition Modal */}
      {showNextDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">
              Start Day {nextDayNumber}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              How should Day {nextDayNumber} handle Day {activeDay}&apos;s marks?
            </p>

            <div className="mt-4 space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                  nextDayCarryOver
                    ? 'border-blue-600 bg-blue-50/70'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="carryOverMode"
                  checked={nextDayCarryOver}
                  onChange={() => setNextDayCarryOver(true)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Continue from Day {activeDay} totals (Recommended)
                  </p>
                  <p className="text-xs text-slate-600">
                    Day {nextDayNumber} marks add onto previous days. Public display shows
                    both Day {nextDayNumber} Leader and Overall Camp Leader.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                  !nextDayCarryOver
                    ? 'border-blue-600 bg-blue-50/70'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="carryOverMode"
                  checked={!nextDayCarryOver}
                  onChange={() => setNextDayCarryOver(false)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Start Day {nextDayNumber} fresh at 0
                  </p>
                  <p className="text-xs text-slate-600">
                    Focus the public board on Day {nextDayNumber}&apos;s fresh competition
                    from 0 (Overall totals remain available below).
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 pt-1 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={lockPrevDay}
                  onChange={(e) => setLockPrevDay(e.target.checked)}
                />
                Lock Day {activeDay} so past scores aren&apos;t edited accidentally
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowNextDayModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={switchingDay}
                onClick={() =>
                  handleAdvanceDay(nextDayNumber, nextDayCarryOver, lockPrevDay)
                }
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {switchingDay ? 'Switching…' : `Start Day ${nextDayNumber}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize Confirmation Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Publish Final Results?</h2>
            <p className="mt-2 text-sm text-slate-600">
              This marks <strong>{event.name}</strong> as completed and locks further
              scoring. You can reopen it later if needed.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={finalizing}
                onClick={handleFinalizeEvent}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {finalizing ? 'Publishing…' : 'Publish Results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
