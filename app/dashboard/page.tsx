'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, auth, clearAuth } from '@/lib/api-client';
import { Navbar } from '@/components/Navbar';
import { EventSetupWizard } from '@/components/EventSetupWizard';

interface Event {
  id: string;
  event_name: string;
  status?: string;
  team_count?: number;
}

interface User {
  name: string;
  email: string;
  avatar_url?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = auth.getToken();
    if (!token) {
      router.push('/login?returnUrl=/dashboard');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!mounted) return;
    
    // Check if user is authenticated before making API calls
    const token = auth.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [eventsRes, userRes] = await Promise.all([
          apiClient.get('/api/events/list'),
          apiClient.get('/api/auth/me'),
        ]);

        const eventsData = await eventsRes.json();
        const userData = await userRes.json();

        if (eventsData.success && eventsData.data?.events) {
          setEvents(eventsData.data.events);
        }
        if (userData.success && userData.data?.user) {
          setUser(userData.data.user);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [mounted]);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.event_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleWizardComplete = (eventId: string) => {
    setShowCreateWizard(false);
    router.push(`/event/${eventId}`);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Show create wizard modal
  if (showCreateWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-amber-50 to-pink-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
          <button
            onClick={() => setShowCreateWizard(false)}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all"
          >
            ← Back to Dashboard
          </button>
          <EventSetupWizard onComplete={handleWizardComplete} />
        </div>
      </div>
    );
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-amber-50 to-pink-50">
        <Navbar />
        <div className="container-safe py-8 mt-20">
          <div className="mb-8 flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-white/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-amber-50 to-pink-50">
      <Navbar />
      <div className="container-safe py-8 mt-20">
        {/* Header Section with User Profile - Premium Glass Design */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
                  Welcome back, {user?.name || 'User'}
                </h1>
                <p className="text-gray-600 text-sm">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
            >
              Logout
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
              <p className="text-gray-600 text-sm font-medium mb-2">Total Events</p>
              <p className="text-4xl font-bold text-purple-600">{events.length}</p>
            </div>
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
              <p className="text-gray-600 text-sm font-medium mb-2">Active Events</p>
              <p className="text-4xl font-bold text-amber-500">{events.filter(e => e.status !== 'inactive').length}</p>
            </div>
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
              <p className="text-gray-600 text-sm font-medium mb-2">Total Teams</p>
              <p className="text-4xl font-bold text-pink-500">{events.reduce((sum, e) => sum + (e.team_count || 0), 0)}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/40 backdrop-blur-xl border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder-gray-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 bg-white/40 backdrop-blur-xl border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-700"
          >
            <option value="all">All Events</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:scale-105 whitespace-nowrap"
          >
            + New Event
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-12 border border-white/20 shadow-lg">
                <p className="text-gray-500 text-lg mb-6">
                  {searchQuery || filterStatus !== 'all'
                    ? 'No events match your search'
                    : 'No events yet. Create your first event!'}
                </p>
                <button
                  onClick={() => setShowCreateWizard(true)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:scale-105"
                >
                  Create Your First Event
                </button>
              </div>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/event/${event.id}`)}
                className="group bg-white/40 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {event.event_name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                      event.status === 'inactive'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {event.status === 'inactive' ? 'Inactive' : 'Active'}
                  </span>
                </div>

                {/* Card Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-t border-b border-white/20">
                  <div>
                    <p className="text-gray-600 text-xs font-medium">Teams</p>
                    <p className="text-2xl font-bold text-purple-600">{event.team_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-medium">Event ID</p>
                    <p className="text-sm font-mono text-gray-600 truncate">{event.id.slice(0, 8)}...</p>
                  </div>
                </div>

                {/* Card Actions */}
                <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-lg font-medium hover:shadow-lg transition-all transform group-hover:scale-105">
                  View Event
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
