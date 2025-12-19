'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { eventsService, recapsService, scoresService } from '@/lib/services';
import type { Event as AppwriteEvent } from '@/lib/services/appwriteEvents';
import { ProtectedPage } from '@/components/AuthGuard';
import { Home, Trophy, Settings as SettingsIcon, Plus, Sparkles, Users } from 'lucide-react';
import { EventSetupWizard } from '@/components/EventSetupWizard';
import { EventCard } from '@/components/EventCard';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { RecapIntroModal } from '@/components/RecapIntroModal';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import React from 'react';
import { SearchFilterToolbar } from '@/components/SearchFilterToolbar';

// Type alias for Appwrite Event, with id as alias for $id
type Event = AppwriteEvent & { id?: string };

interface User {
  name: string;
  email: string;
  avatar_url?: string;
}

// Helper to convert Appwrite event to EventCard format
const convertEventForCard = (event: AppwriteEvent) => ({
  id: event.$id,
  event_name: event.event_name,
  status: event.status,
  team_count: 0, // Will need to fetch separately if needed
  updated_at: event.updated_at,
});

// Inner component - no auth checks needed, wrapped by AuthGuard
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; eventId: string; eventName: string }>({
    isOpen: false,
    eventId: '',
    eventName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRecapIntro, setShowRecapIntro] = useState(false);
  const [recapSummary, setRecapSummary] = useState<{
    gamesPlayed?: number;
    teamsCompeted?: number;
    winnersCount?: number;
    topTeam?: string;
  } | undefined>();

  // Load dashboard data (auth is already verified by AuthGuard)
  useEffect(() => {
    const loadCritical = async () => {
      try {
        setLoading(true);
        if (!authUser?.id) return;
        
        const eventsRes = await eventsService.getEvents(authUser.id);

        if (eventsRes.success && eventsRes.data?.events) {
          setEvents(eventsRes.data.events);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCritical();
    // Defer non-critical fetches until idle
    const idle = (window as any).requestIdleCallback || ((cb: Function) => setTimeout(() => cb({ timeRemaining: () => 0 }), 200));
    idle(async () => {
      try {
        if (authUser?.id) {
          const r = await recapsService.getSummary(authUser.id);
          if (r.success && r.data) {
            setRecap({ mvpTeam: r.data.mvpTeam, totalGames: r.data.totalGames, topTeam: r.data.topTeam });
          }
        }
      } catch {}
    });
  }, []);

  // Handle ?recap=1 query param - show intro modal on first visit
  useEffect(() => {
    const shouldShowRecap = searchParams?.get('recap') === '1';
    if (!shouldShowRecap || !authUser?.id) return;

    const recapIntroKey = `recap_intro_shown_${authUser.id}`;
    const alreadyShown = typeof window !== 'undefined' ? window.localStorage.getItem(recapIntroKey) : '1';

    if (!alreadyShown) {
      // Fetch recap summary for modal stats
      (async () => {
        try {
          const [eventsRes, recapRes] = await Promise.all([
            eventsService.getEvents(authUser.id, { status: 'completed' }),
            recapsService.getSummary(authUser.id),
          ]);
          const completedEvents = eventsRes?.data?.events || [];
          const summary = recapRes?.data;
          setRecapSummary({
            gamesPlayed: summary?.totalGames ?? 0,
            teamsCompeted: completedEvents.reduce((acc, e) => acc + (e.num_teams || 0), 0),
            winnersCount: completedEvents.length,
            topTeam: summary?.topTeam,
          });
          setShowRecapIntro(true);
        } catch (err) {
          console.error('Failed to load recap summary:', err);
        }
      })();
    }
  }, [searchParams, authUser?.id]);

  const filteredEvents = useMemo(() => {
    const term = (searchQuery || '').toLowerCase();

    const withStatus = events.filter((event) => {
      const name = (event.event_name || '').toLowerCase();
      const matchesSearch = name.includes(term);
      const normalizedStatus = event.status || 'active';
      const isActive = normalizedStatus === 'active';
      const isArchived = normalizedStatus === 'archived';

      const matchesFilter =
        filterStatus === 'all'
          ? true
          : filterStatus === 'active'
            ? isActive
            : filterStatus === 'archived'
              ? isArchived
              : !isActive && !isArchived;

      return matchesSearch && matchesFilter;
    });

    const sorted = [...withStatus].sort((a, b) => {
      if (sortOrder === 'alphabetical') {
        return (a.event_name || '').localeCompare(b.event_name || '');
      }
      const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
      const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
      return sortOrder === 'newest' ? bDate - aDate : aDate - bDate;
    });

    return sorted;
  }, [events, searchQuery, filterStatus, sortOrder]);

  // Quick Stats
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === 'active').length;
  const totalTeams = 0; // Will fetch dynamically
  const [scoresLast7Days, setScoresLast7Days] = useState<number>(0);
  const [recap, setRecap] = useState<{ mvpTeam?: string; totalGames?: number; topTeam?: string } | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(true);
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (authUser?.id) {
          const res = await scoresService.getScoresCountLastDays(authUser.id, 7);
          if (res.success && res.data) {
            setScoresLast7Days(res.data.count || 0);
          }
        }
      } catch {}
      try {
        if (authUser?.id) {
          const r = await recapsService.getSummary(authUser.id);
          if (r.success && r.data) {
            setRecap({ mvpTeam: r.data.mvpTeam, totalGames: r.data.totalGames, topTeam: r.data.topTeam });
          }
        }
      } catch {}
    })();
  }, []);

  const StatCard = ({ label, value }: { label: string; value: number }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      let start: number | null = null;
      const duration = 600;
      const step = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min(1, (ts - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(eased * value));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, [value]);
    return (
      <div className="min-w-[180px] rounded-lg border border-neutral-200 bg-white shadow-sm px-4 py-3">
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-neutral-900">{display}</p>
      </div>
    );
  };

  const handleWizardComplete = (eventId: string) => {
    setShowCreateWizard(false);
    setEditEventId(null);
    
    // Reload events to get the latest data
      if (authUser?.id) {
        eventsService.getEvents(authUser.id).then((res) => {
      if (res.success && res.data?.events) {
        setEvents(res.data.events);
      }
        });
      }
    
    // Navigate to the event detail page
    router.push(`/event/${eventId}`);
  };
  
  const handleWizardCancel = () => {
    setShowCreateWizard(false);
    setEditEventId(null);
  };

  const handleViewEvent = useCallback((eventId: string) => {
    router.push(`/event/${eventId}`);
  }, [router]);

  const handleEditEvent = useCallback((eventId: string) => {
    setEditEventId(eventId);
    setShowCreateWizard(true);
  }, []);

  const handleDeleteClick = useCallback((eventId: string, eventName: string) => {
    setDeleteModal({ isOpen: true, eventId, eventName });
  }, []);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
        const response = await eventsService.deleteEvent(deleteModal.eventId);
        if (response.success) {
            setEvents(events.filter((e) => e.$id !== deleteModal.eventId));
        setDeleteModal({ isOpen: false, eventId: '', eventName: '' });
        liveRef.current?.appendChild(document.createTextNode(`Deleted event ${deleteModal.eventName}.`));
      } else {
        console.error('Failed to delete event');
        liveRef.current?.appendChild(document.createTextNode('Failed to delete event.'));
      }
    } catch (error) {
      console.error('Delete event error:', error);
      liveRef.current?.appendChild(document.createTextNode('Delete error.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateEvent = useCallback(async (eventId: string) => {
    try {
        const result = await eventsService.duplicateEvent(eventId, authUser!.id);
        if (result.success && result.data) {
          // Add the duplicated event to the beginning of the list
          setEvents(prevEvents => [result.data.event, ...prevEvents]);
          liveRef.current?.appendChild(document.createTextNode(`Event duplicated: ${result.data.event.event_name}`));
      } else {
        console.error('Failed to duplicate event');
        liveRef.current?.appendChild(document.createTextNode('Failed to duplicate event.'));
      }
    } catch (error) {
      console.error('Duplicate event error:', error);
      liveRef.current?.appendChild(document.createTextNode('Duplicate error.'));
    }
  }, []);

  const handlePlayRecap = useCallback(() => {
    if (authUser?.id) {
      try {
        window.localStorage.setItem(`recap_intro_shown_${authUser.id}`, '1');
      } catch {}
    }
    setShowRecapIntro(false);
    // Navigate to dedicated recap view or scroll to highlights
    router.push('/recap');
  }, [authUser?.id, router]);

  const handleCloseRecapIntro = useCallback(() => {
    if (authUser?.id) {
      try {
        window.localStorage.setItem(`recap_intro_shown_${authUser.id}`, '1');
      } catch {}
    }
    setShowRecapIntro(false);
    // Remove query param
    router.replace('/dashboard');
  }, [authUser?.id, router]);

  // Show create/edit wizard modal
  if (showCreateWizard) {
    const editEvent = editEventId ? events.find(e => e.$id === editEventId) : null;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="secondary"
            onClick={handleWizardCancel}
            className="mb-6"
          >
            ← Back to Dashboard
          </Button>
          <EventSetupWizard 
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
            editEventId={editEventId || undefined}
            initialData={editEvent as any}
          />
        </div>
      </div>
    );
  }

  // Show loading during data fetch
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 space-y-4">
            <div className="h-10 w-48 bg-neutral-200 rounded-lg animate-pulse" />
            <div className="h-4 w-96 bg-neutral-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-white rounded-xl shadow-sm animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global live region for feedback */}
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only"></div>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 pb-20 md:pb-8">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
          {/* Keyboard shortcuts: '/' focuses search, 'n' opens create */}
          <div className="sr-only" aria-hidden>
            Keyboard shortcuts: Press '/' to focus search. Press 'n' to create event.
          </div>
          <script dangerouslySetInnerHTML={{ __html: `
            (function(){
              var searchInput = null;
              function findSearch(){
                if (!searchInput) {
                  searchInput = document.querySelector('[data-search-input]') || document.querySelector('input[type="search"]');
                }
                return searchInput;
              }
              document.addEventListener('keydown', function(e){
                if (e.key === '/' && !e.defaultPrevented) {
                  var el = findSearch();
                  if (el) { e.preventDefault(); el.focus(); el.select && el.select(); }
                }
                if ((e.key === 'n' || e.key === 'N') && !e.defaultPrevented) {
                  var btn = document.querySelector('[data-create-event]');
                  if (btn) { e.preventDefault(); btn.click(); }
                }
              });
            })();
          ` }} />
          {/* Quick Stats Strip */}
          <div className="mb-6 sm:mb-8">
            <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none]">
              <StatCard label="Total Events" value={totalEvents} />
              <StatCard label="Active Events" value={activeEvents} />
              <StatCard label="Total Teams" value={totalTeams} />
              <StatCard label="Scores in Last 7 Days" value={scoresLast7Days} />
            </div>
          </div>

          {/* Recap Highlights Widget (R5.1) */}
          {recap && (recap.mvpTeam || recap.totalGames || recap.topTeam) ? (
            <div className="mb-6 sm:mb-8 animate-fade-in">
              <div className="relative overflow-hidden rounded-xl border-2 border-amber-200/40 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 p-5 shadow-sm transition-shadow hover:shadow-md">
                {/* Subtle background accent */}
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-amber-200/10 to-orange-200/5 blur-3xl pointer-events-none" />
                
                <div className="relative z-10">
                  {/* Header with Trophy Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100/60 rounded-lg">
                        <Trophy className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h2 className="font-bold text-neutral-900">Recap Highlights</h2>
                        <p className="text-xs text-neutral-500">Your latest event summary</p>
                      </div>
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={() => router.push('/recap')}
                      className="text-xs sm:text-sm"
                    >
                      View Recap →
                    </Button>
                  </div>

                  {/* Winner & Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Winner Card - Large */}
                    <div className="sm:col-span-1 rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-xs hover:shadow-sm transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px] transform-gpu">
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">🏆 Winner</p>
                      <p className="mt-2 text-lg font-bold text-neutral-900 truncate">{recap.mvpTeam ?? '—'}</p>
                    </div>

                    {/* Games Card */}
                    <div className="rounded-lg border border-neutral-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-xs hover:shadow-sm transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px] transform-gpu">
                      <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">📊 Games</p>
                      <p className="mt-2 text-2xl font-bold text-neutral-900">{recap.totalGames ?? 0}</p>
                    </div>

                    {/* Top Team Card */}
                    <div className="rounded-lg border border-neutral-200/50 bg-white/80 backdrop-blur-sm p-4 shadow-xs hover:shadow-sm transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-2px] transform-gpu">
                      <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">⭐ Top Team</p>
                      <p className="mt-2 text-lg font-bold text-neutral-900 truncate">{recap.topTeam ?? '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {/* Simplified Header with Mobile CTA */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Dashboard</h1>
                <p className="text-neutral-600 text-sm sm:text-base">Manage your events and scores</p>
              </div>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-5 h-5" />}
                onClick={() => setShowCreateWizard(true)}
                data-tour="create-event"
                className="flex-shrink-0 sm:hidden"
              >
                Create
              </Button>
              <div className="hidden sm:block flex-shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Plus className="w-5 h-5" />}
                  onClick={() => setShowCreateWizard(true)}
                  data-tour="create-event"
                >
                  Create Event
                </Button>
              </div>
            </div>
          </div>

          {/* Unified Search & Filter Toolbar */}
          <div className="mb-6 sm:mb-8">
            <SearchFilterToolbar
              value={searchQuery}
              onValueChange={setSearchQuery}
              status={filterStatus}
              onStatusChange={(s) => setFilterStatus(s)}
              sort={sortOrder}
              onSortChange={setSortOrder}
              helperText="Search by event name. Filter by status. Sort by newest, oldest, or alphabetical."
            />
          </div>

          {/* Onboarding Checklist */}
          <div className="mb-6">
            <button
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
              aria-expanded={checklistOpen}
              onClick={() => setChecklistOpen((v) => !v)}
            >
              {checklistOpen ? 'Hide' : 'Show'} Onboarding Checklist
            </button>
            {checklistOpen && (
              <div className="mt-2 rounded-lg border border-neutral-200 bg-white p-3">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Create Event', done: events.length > 0 },
                    { label: 'Add Teams', done: false }, // TODO: Fetch teams for first event
                    { label: 'Start Game', done: (events[0]?.status === 'active') },
                    { label: 'View Recap', done: (events.length > 0) },
                  ].map((item) => (
                    <li key={item.label} className="flex items-center gap-2 text-sm">
                      <span className={`inline-block w-2 h-2 rounded-full ${item.done ? 'bg-green-500' : 'bg-neutral-300'}`} aria-hidden />
                      <span className={item.done ? 'text-neutral-800' : 'text-neutral-600'}>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Events Grid - Fluid, mobile-first */}
          {filteredEvents.length === 0 ? (
            <EmptyState
              title="No events yet"
              description="Kick off your first event to start tracking teams, scores, and recaps."
              actionLabel="Create your first event"
              onAction={() => setShowCreateWizard(true)}
              icon={<Sparkles className="w-12 h-12 text-purple-600" aria-hidden />}
              secondaryActionLabel="Create Demo Event"
              onSecondaryAction={async () => {
                try {
                  if (!authUser?.id) return;
                  const create = await eventsService.createEvent(authUser.id, {
                    event_name: 'Demo Event',
                    theme_color: 'purple',
                    allow_negative: false,
                    display_mode: 'cumulative',
                    num_teams: 3,
                    status: 'active',
                  });
                  if (create.success && create.data) {
                    localStorage.setItem('demoActive', 'true');
                    setEvents([create.data.event]);
                  }
                } catch {}
              }}
              tips={[
                'Use the Create Event wizard to set teams and rules quickly.',
                'Swipe cards on mobile to manage events (delete/duplicate).',
                'Visit Your Recap to see highlights once events are active.',
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 will-change-transform" style={{ contentVisibility: 'auto' }}>
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.$id}
                  event={convertEventForCard(event)}
                  onView={() => handleViewEvent(event.$id)}
                  onEdit={() => handleEditEvent(event.$id)}
                  onDelete={() => handleDeleteClick(event.$id, event.event_name)}
                  onDuplicate={() => handleDuplicateEvent(event.$id)}
                />
              ))}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={deleteModal.isOpen}
            title="Delete Event"
            message={`Are you sure you want to delete "${deleteModal.eventName}"? This action cannot be undone.`}
            confirmButtonLabel="Yes, Delete"
            cancelButtonLabel="No, Keep It"
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteModal({ isOpen: false, eventId: '', eventName: '' })}
            isDeleting={isDeleting}
          />

          {/* Recap Intro Modal */}
          <RecapIntroModal
            isOpen={showRecapIntro}
            onClose={handleCloseRecapIntro}
            onPlayRecap={handlePlayRecap}
            summary={recapSummary}
          />
        </div>
      </div>
      {/* Demo banner */}
      {typeof window !== 'undefined' && localStorage.getItem('demoActive') === 'true' ? (
        <div className="fixed bottom-20 left-0 right-0 mx-auto max-w-7xl px-4">
          <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-3 flex items-center justify-between">
            <span className="text-sm">Demo data active</span>
            <button
              className="text-sm font-medium underline"
              onClick={() => {
                localStorage.removeItem('demoActive');
                // Optionally clear demo events from UI
              }}
            >
              Remove Demo
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

// Export the wrapped component with AuthGuard
export default function DashboardPage() {
  return (
    <ProtectedPage returnUrl="/dashboard">
      <DashboardContent />
    </ProtectedPage>
  );
}
