'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import * as appwriteEvents from '@/lib/services/appwriteEvents';
import { useAuth } from '@/lib/auth-context';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';

type EventStatus = 'active' | 'completed' | 'archived' | string;

interface EventItem {
  id: string;
  event_name: string;
  status?: EventStatus;
  theme_color?: string;
  logo_url?: string | null;
  created_at?: string;
}

export default function EventsPage() {
  const { user, authReady } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rawDocs, setRawDocs] = useState<Record<string, any>>({});
  const [showRawDocs, setShowRawDocs] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!authReady || !user) return; // wait for auth
        const res = await appwriteEvents.getEvents(user.id);
        if (!mounted) return;
        if (res.success && res.data?.events) {
          // map Appwrite Event -> EventItem
          const docs = res.data.events || [];
          const rawMap: Record<string, any> = {};
          const items = docs.map((e: any) => {
            const mapped = {
              id: e.$id || e.id,
              event_name: e.event_name,
              status: e.status,
              theme_color: e.theme_color,
              logo_url: e.logo_path || null,
              created_at: e.created_at,
            } as EventItem;
            rawMap[mapped.id] = e;
            return mapped;
          });
          console.debug('[events/page] getEvents -> mapped', {
            count: items.length,
            docIds: items.map((i) => i.id),
          });
          setEvents(items);
          setRawDocs(rawMap);
        } else {
          setError(res.error || 'Failed to load events');
        }
      } catch (err) {
        if (mounted) setError('Failed to load events');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authReady, user]);

  const { activeEvents, completedEvents, archivedEvents } = useMemo(() => {
    const byStatus = (status: EventStatus) => events.filter((e) => (e.status || 'active') === status);
    return {
      activeEvents: byStatus('active'),
      completedEvents: byStatus('completed'),
      archivedEvents: byStatus('archived'),
    };
  }, [events]);

  const allEmpty = !loading && (events.length === 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 w-40 bg-neutral-200 rounded animate-pulse" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white rounded-lg shadow-sm border border-neutral-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (allEmpty) {
    return (
      <EmptyState
        title="No events yet"
        description="Create your first event to start managing teams, scores, and history."
        actionLabel="Create Event"
        actionHref="/events/create"
      />
    );
  }

  const renderSection = (title: string, items: EventItem[]) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-8" aria-label={`${title} events`}>
        <h2 className="text-xl font-semibold text-neutral-900 mb-3">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((event) => (
            <div key={event.id} className="space-y-2">
              <Card interactive>
                <CardHeader className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg text-neutral-900 line-clamp-2">{event.event_name}</CardTitle>
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {event.status || 'active'}
                  </span>
                </CardHeader>
                <CardContent className="text-sm text-neutral-600">
                  <p className="mb-1">Theme: {event.theme_color || 'purple'}</p>
                  {event.created_at ? (
                    <p className="text-xs text-neutral-500">Created {new Date(event.created_at).toLocaleDateString()}</p>
                  ) : null}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Link href={`/event/${event.id}`} className="text-primary-600 text-sm font-semibold hover:underline">
                    View event
                  </Link>
                  <Link href={`/event/${event.id}/history`} className="text-neutral-600 text-xs hover:underline">
                    History
                  </Link>
                </CardFooter>
              </Card>
              {showRawDocs && rawDocs[event.id] ? (
                <pre className="text-xs bg-neutral-900 text-green-100 rounded-lg p-3 overflow-auto max-h-64 border border-neutral-800">
                  {JSON.stringify(rawDocs[event.id], null, 2)}
                </pre>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Events</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-neutral-600">Browse and manage your events.</p>
          <label className="inline-flex items-center gap-2 text-sm text-neutral-700 bg-neutral-100 border border-neutral-200 rounded-full px-3 py-1">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
              checked={showRawDocs}
              onChange={(e) => setShowRawDocs(e.target.checked)}
            />
            <span>Show raw Appwrite docs (dev)</span>
          </label>
        </div>
      </header>

      {error ? (
        <div className="mb-6 text-sm text-red-600">{error}</div>
      ) : null}

      {renderSection('Active', activeEvents)}
      {renderSection('Completed', completedEvents)}
      {renderSection('Archived', archivedEvents)}

      {/* If all sections empty but events array not empty (unexpected status) show catch-all */}
      {activeEvents.length === 0 && completedEvents.length === 0 && archivedEvents.length === 0 && events.length > 0 ? (
        <section aria-label="Other events">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">Other</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <div key={event.id} className="space-y-2">
                <Card interactive>
                  <CardHeader className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg text-neutral-900 line-clamp-2">{event.event_name}</CardTitle>
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                      {event.status || 'unknown'}
                    </span>
                  </CardHeader>
                  <CardContent className="text-sm text-neutral-600">
                    <p className="mb-1">Theme: {event.theme_color || 'purple'}</p>
                    {event.created_at ? (
                      <p className="text-xs text-neutral-500">Created {new Date(event.created_at).toLocaleDateString()}</p>
                    ) : null}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Link href={`/event/${event.id}`} className="text-primary-600 text-sm font-semibold hover:underline">
                      View event
                    </Link>
                    <Link href={`/event/${event.id}/history`} className="text-neutral-600 text-xs hover:underline">
                      History
                    </Link>
                  </CardFooter>
                </Card>
                {showRawDocs && rawDocs[event.id] ? (
                  <pre className="text-xs bg-neutral-900 text-green-100 rounded-lg p-3 overflow-auto max-h-64 border border-neutral-800">
                    {JSON.stringify(rawDocs[event.id], null, 2)}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
