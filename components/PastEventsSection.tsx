'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NoEventsEmpty } from '@/components/EmptyStates';

interface PastEvent {
  event_id: string;
  name: string;
  mode: 'quick' | 'camp' | 'advanced';
  finalized_at: string | null;
  is_finalized: boolean;
  public_token: string;
  total_teams: number;
  total_days: number | null;
  summary: {
    winning_team: string | null;
    winning_points: number;
    highest_score: number;
    total_points: number;
  };
}

interface PastEventsSectionProps {
  adminToken: string;
}

export default function PastEventsSection({ adminToken }: PastEventsSectionProps) {
  const router = useRouter();
  const [events, setEvents] = useState<PastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPastEvents();
  }, [adminToken]);

  const fetchPastEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/events/past', {
        headers: {
          'X-ADMIN-TOKEN': adminToken,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch past events');
      }

      const { data } = await response.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load past events');
      console.error('Error fetching past events:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not finalized';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getModeDisplay = (mode: string) => {
    const modes: Record<string, string> = {
      quick: 'Quick',
      camp: 'Camp',
      advanced: 'Advanced',
    };
    return modes[mode] || mode;
  };

  const handleViewResults = (publicToken: string) => {
    router.push(`/recap/${publicToken}`);
  };

  const handleExportCSV = async (eventId: string, eventName: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/export-csv`, {
        headers: {
          'X-ADMIN-TOKEN': adminToken,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      // Get the CSV blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Final_Results.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export CSV: ' + err.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-2xl">📚</span>
          Past Events
        </h2>
        <p className="text-gray-600 mt-2">View finalized events and their results</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-indigo-500 animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading past events...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error loading past events</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <NoEventsEmpty onCreateEvent={() => router.push('/events/create')} />
      )}

      {/* Events Grid */}
      {!loading && !error && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event.event_id}
              className="group relative bg-gradient-to-br from-gray-50 to-indigo-50 border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
            >
              {/* Archived Badge */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                  📦 Archived
                </span>
              </div>

              {/* Event Info */}
              <div className="pr-24">
                {/* Event Name */}
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-3">
                  {event.name}
                </h3>

                {/* Mode Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    {getModeDisplay(event.mode)}
                  </span>
                  {event.total_days !== null && (
                    <span className="text-xs text-gray-600">
                      • {event.total_days} days
                    </span>
                  )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div className="text-gray-700">
                    <span className="font-semibold text-gray-900">{event.total_teams}</span>
                    <span className="text-gray-600"> teams</span>
                  </div>
                </div>

                {/* Summary Stats */}
                {event.summary && event.summary.winning_team && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Winner:</span>
                        <span className="font-semibold text-gray-900 truncate ml-2">
                          {event.summary.winning_team}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Winning Points:</span>
                        <span className="font-semibold text-indigo-700">
                          {event.summary.winning_points}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Highest Score:</span>
                        <span className="font-semibold text-green-700">
                          {event.summary.highest_score}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Points:</span>
                        <span className="font-semibold text-gray-900">
                          {event.summary.total_points}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Finalized Date */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 font-medium">Finalized</p>
                  <p className="text-sm text-gray-900 font-semibold">
                    {formatDate(event.finalized_at)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleViewResults(event.public_token)}
                  className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
                >
                  View Final Results
                </button>
                <button
                  onClick={() => handleExportCSV(event.event_id, event.name)}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                >
                  <span>📥</span>
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Hover Indicator */}
              <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-transparent group-hover:border-indigo-300 transition-colors duration-300" />
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      {!loading && !error && events.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{events.length}</p>
              <p className="text-sm text-gray-600 mt-1">Past Events</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {events.reduce((sum, e) => sum + e.total_teams, 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Teams</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {events.filter((e) => e.is_finalized).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Finalized</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
