// app/dashboard/page.tsx
// FIXED: Consolidated dashboard-enhanced into main dashboard folder to prevent routing confusion (UI-DEBUG-REPORT Issue #3)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, clearAuth } from '@/lib/api-client';
import { Event } from '@/lib/types';
import { Button, Card } from '@/components';
import { EventSetupWizard } from '@/components/EventSetupWizard';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  // FIXED: Use 'initializing' state to prevent flashing loading screen
  const [loading, setLoading] = useState('initializing' as 'initializing' | 'loading' | 'done');
  const [error, setError] = useState('');
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  // FIXED: Prevent hydration mismatch with localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadEvents = useCallback(async () => {
    // Don't load until client has mounted (to access localStorage)
    if (!mounted) return;
    
    setLoading('loading');
    try {
      const response = await apiClient.get('/api/events/list');
      if (response.success && response.data.events) {
        setEvents(response.data.events);
      } else {
        setError(response.error || 'Failed to load events');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading('done');
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      loadEvents();
    }
  }, [mounted, loadEvents]);

  const handleWizardComplete = (eventId: string) => {
    setShowCreateWizard(false);
    router.push(`/event/${eventId}`);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // FIXED: Prevent hydration mismatch - don't render until mounted
  // FIXED: Only show loading screen after initializing to prevent flash
  if (!mounted || loading === 'initializing') {
    return null;
  }

  if (loading === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-pulse text-primary-600 dark:text-primary-400 font-medium">Loading your events...</div>
      </div>
    );
  }

  if (showCreateWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setShowCreateWizard(false)}
            className="mb-4"
            aria-label="Cancel event creation"
          >
            ← Back to Dashboard
          </Button>
          <EventSetupWizard onComplete={handleWizardComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary-800 dark:text-primary-300 mb-2">My Events</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your challenge events and scoring</p>
          </div>
          <Button onClick={handleLogout} variant="outline" aria-label="Logout">
            Logout
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400" role="alert">
            {error}
          </div>
        )}

        <Button 
          onClick={() => setShowCreateWizard(true)} 
          className="mb-6"
          aria-label="Create new event"
        >
          + Create New Event
        </Button>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.length === 0 ? (
            <Card className="col-span-full dark:bg-gray-800 dark:border-gray-700">
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No events yet. Create your first event to get started!
                </p>
                <Button onClick={() => setShowCreateWizard(true)}>
                  Create Your First Event
                </Button>
              </div>
            </Card>
          ) : (
            events.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700"
                onClick={() => router.push(`/event/${event.id}`)}
                style={{ borderTopColor: event.brand_color || '#6b46c1', borderTopWidth: '4px' }}
              >
                <div className="flex flex-col h-full">
                  {event.logo_url && (
                    <img
                      src={event.logo_url}
                      alt={`${event.event_name} logo`}
                      className="w-full h-32 object-cover rounded-t-lg mb-4"
                    />
                  )}
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {event.event_name}
                  </h3>
                  
                  <div className="flex-1 space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <p>
                      <span className="font-medium">Teams:</span> {event.num_teams || 3}
                    </p>
                    <p>
                      <span className="font-medium">Mode:</span>{' '}
                      {event.display_mode === 'per_day' ? 'Per Day' : 'Cumulative'}
                    </p>
                    <p>
                      <span className="font-medium">Negative Points:</span>{' '}
                      {event.allow_negative ? 'Allowed' : 'Not Allowed'}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.created_at).toLocaleDateString()}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/event/${event.id}`);
                      }}
                      aria-label={`View ${event.event_name}`}
                    >
                      View →
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
