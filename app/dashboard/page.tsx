// app/dashboard/page.tsx - COMPLETELY REDESIGNED
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, clearAuth } from '@/lib/api-client';
import { Event } from '@/lib/types';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  Badge, 
  Avatar,
  LoadingCardSkeleton,
  ConfirmDialog,
  useToast
} from '@/components/ui';
import { EventCardSkeletonList } from '@/components/skeletons';
import { EventSetupWizard } from '@/components/EventSetupWizard';
import { UseTemplateModal } from '@/components/modals';
import { getPaletteById } from '@/lib/color-palettes';

interface ExtendedEvent extends Event {
  team_count?: number;
  status?: string;
  public_url?: string;
}

interface UserProfile {
  name: string;
  email: string;
  avatar_url?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [showUseTemplate, setShowUseTemplate] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!mounted) return;
    
    setLoading(true);
    setError('');
    try {
      // Load user info and events in parallel
      const [eventsResponse, userResponse] = await Promise.all([
        apiClient.get('/api/events/list'),
        apiClient.get('/api/auth/me')
      ]);

      // Parse JSON responses
      const eventsData = await eventsResponse.json();
      const userData = await userResponse.json();

      if (eventsData.success && eventsData.data?.events) {
        setEvents(eventsData.data.events);
      } else {
        console.error('Failed to load events:', eventsData.error);
        setError(eventsData.error || 'Failed to load events');
      }

      if (userData.success && userData.data?.user) {
        setUser(userData.data.user);
      }
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      const errorMsg = 'Failed to load dashboard';
      setError(errorMsg);
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [mounted, showToast]);

  useEffect(() => {
    if (mounted) {
      loadDashboard();
    }
  }, [mounted, loadDashboard]);

  const handleDeleteEvent = async () => {
    if (!deleteEventId) return;

    setDeleting(true);
    try {
      const response = await apiClient.delete(`/api/events/${deleteEventId}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(events.filter(e => e.id !== deleteEventId));
        showToast('Event deleted successfully', 'success');
      } else {
        showToast(data.error || 'Failed to delete event', 'error');
      }
    } catch (err) {
      console.error('Delete event error:', err);
      showToast('Failed to delete event', 'error');
    } finally {
      setDeleting(false);
      setDeleteEventId(null);
    }
  };

  const handleWizardComplete = (eventId: string) => {
    setShowCreateWizard(false);
    showToast('Event created successfully!', 'success');
    router.push(`/event/${eventId}`);
  };

  const handleUseTemplate = async (templateId: number, eventName: string) => {
    try {
      const response = await apiClient.post('/api/events/create-from-template', {
        template_id: templateId,
        event_name: eventName,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event from template');
      }

      setShowUseTemplate(false);
      showToast('Event created from template!', 'success');
      
      // Refresh events list
      await loadDashboard();
      
      // Navigate to the new event
      router.push(`/event/${data.event.event_id}`);
    } catch (error) {
      console.error('Error creating event from template:', error);
      showToast('Failed to create event from template', 'error');
    }
  };

  const handleLogout = () => {
    clearAuth();
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.event_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const purplePalette = getPaletteById('purple');
  const bluePalette = getPaletteById('blue');
  const bgGradient = `linear-gradient(135deg, ${purplePalette!.background} 0%, ${bluePalette!.background} 100%)`;

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12">
        <div className="container-safe">
          <div className="mb-8 flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <EventCardSkeletonList count={6} />
        </div>
      </div>
    );
  }

  if (showCreateWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="secondary"
            onClick={() => setShowCreateWizard(false)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <EventSetupWizard onComplete={handleWizardComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: bgGradient }}>
      <div className="container-safe py-8">
        {/* Header Section with User Profile */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={user?.avatar_url}
                alt={user?.name || 'User'}
                fallback={user?.name}
                size="xl"
              />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">
                  Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateWizard(true)}
                size="lg"
              >
                + Create New Event
              </Button>
              <Button
                onClick={() => setShowUseTemplate(true)}
                variant="secondary"
                size="lg"
              >
                📋 Use Template
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(() => {
              const palettes = [getPaletteById('purple')!, getPaletteById('blue')!, getPaletteById('green')!];
              const statData = [
                { label: 'Total Events', value: events.length, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                { label: 'Active Events', value: events.filter(e => e.status === 'active' || !e.status).length, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                { label: 'Total Teams', value: events.reduce((sum, e) => sum + (e.team_count || e.num_teams || 0), 0), icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
              ];
              return statData.map((stat, idx) => (
                <Card key={idx} style={{ background: `linear-gradient(135deg, ${palettes[idx].primary}f0 0%, ${palettes[idx].secondary}f0 100%)`, borderTop: `4px solid ${palettes[idx].primary}` }} className="text-white overflow-hidden">
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="opacity-90 text-sm font-medium">{stat.label}</p>
                        <p className="text-4xl font-bold mt-2">{stat.value}</p>
                      </div>
                      <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ focusRingColor: getPaletteById('purple')!.primary }}
                onFocus={(e) => e.currentTarget.style.borderColor = getPaletteById('purple')!.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'primary' : 'secondary'}
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'primary' : 'secondary'}
                onClick={() => setFilterStatus('active')}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'primary' : 'secondary'}
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </Button>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No events found' : 'No events yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search or filter'
                  : 'Create your first event to get started tracking scores!'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateWizard(true)} size="lg">
                  Create Your First Event
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const palette = getPaletteById(event.theme_color || 'purple') || getPaletteById('purple')!;
              
              return (
                <Card key={event.id} interactive className="relative overflow-hidden group">
                  {/* Theme Color Bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary})` }}
                  />

                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {/* Logo or Avatar */}
                      {event.logo_url ? (
                        <img
                          src={event.logo_url}
                          alt={event.event_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                          style={{ backgroundColor: palette.primary }}
                        >
                          {event.event_name.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <CardTitle className="mb-2 truncate">{event.event_name}</CardTitle>
                        <Badge variant={event.status === 'completed' ? 'default' : 'success'}>
                          {event.status === 'completed' ? 'Completed' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{event.team_count || event.num_teams || 0} teams</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(event.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <span style={{ color: palette.primary }} className="font-medium">
                          {palette.name} theme
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="flex-1 min-w-[100px]"
                      onClick={() => router.push(`/event/${event.id}`)}
                      title="View and manage event details"
                    >
                      📊 View
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 min-w-[100px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/event/${event.id}?tab=settings`);
                      }}
                      title="Edit event settings"
                    >
                      ⚙️ Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="accent"
                      className="flex-1 min-w-[100px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        if ((event as any).share_token) {
                          window.open(`/scoreboard/${(event as any).share_token}`, '_blank');
                        } else {
                          showToast('Create a share link in Settings first', 'info');
                        }
                      }}
                      disabled={!(event as any).share_token}
                      title={(event as any).share_token ? 'Open public scoreboard in new tab' : 'Create share link in Settings tab first'}
                    >
                      👁️ Public
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteEventId(event.id);
                      }}
                      title="Delete this event permanently"
                    >
                      🗑️
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteEventId !== null}
        onClose={() => setDeleteEventId(null)}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        message="Are you sure you want to delete this event? This will permanently remove all teams, scores, and share links associated with this event."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* Use Template Modal */}
      <UseTemplateModal
        isOpen={showUseTemplate}
        onClose={() => setShowUseTemplate(false)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
