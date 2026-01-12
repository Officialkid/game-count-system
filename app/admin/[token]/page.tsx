'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateResultsPDF } from '@/lib/pdf-export';
import PastEventsSection from '@/components/PastEventsSection';
import { AdminTutorial, resetAdminTutorial } from '@/components/AdminTutorial';
import { EventLinksManager } from '@/components/EventLinksManager';
import { ExpiredEvent, EventNotFoundError } from '@/components/ExpiredEvent';
import { safeInitial } from '@/lib/safe-ui-helpers';

interface Team {
  id: string;
  name: string;
  color: string;
  avatar_url?: string;
  total_points?: number;
}

interface Event {
  id: string;
  name: string;
  mode: string;
  status: string;
  public_token: string;
  scorer_token: string;
  admin_token?: string;
  is_finalized?: boolean;
  finalized_at?: string;
  theme_color?: string;
}

export default function AdminPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'expired' | 'not-found' | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#3B82F6');
  const [adding, setAdding] = useState(false);
  
  // Finalization state
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showLinksDropdown, setShowLinksDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorType(null);

      // Verify token and get event
      const eventRes = await fetch(`/api/event-by-token/${token}`, {
        headers: { 'X-ADMIN-TOKEN': token }
      });

      if (eventRes.status === 410) {
        setErrorType('expired');
        setLoading(false);
        return;
      }
      
      if (eventRes.status === 404) {
        setErrorType('not-found');
        setLoading(false);
        return;
      }

      if (!eventRes.ok) {
        throw new Error('Invalid admin token');
      }

      const eventData = await eventRes.json();
      const eventInfo = eventData.data?.event || eventData.event;
      setEvent(eventInfo);

      // Load teams
      const teamsRes = await fetch(`/api/events/${eventInfo.id}/teams`, {
        headers: { 'X-ADMIN-TOKEN': token }
      });

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.data?.teams || teamsData.teams || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !teamName.trim()) return;

    try {
      setAdding(true);
      const res = await fetch(`/api/events/${event.id}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token
        },
        body: JSON.stringify({
          name: teamName.trim(),
          color: teamColor
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add team');
      }

      setTeamName('');
      setTeamColor('#3B82F6');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add team');
    } finally {
      setAdding(false);
    }
  };

  // Finalize event
  const handleFinalizeEvent = async () => {
    if (!event) return;

    try {
      setFinalizing(true);
      const res = await fetch(`/api/events/${event.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_token: token })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to finalize event');
      }

      setSuccessMessage('✅ Event finalized! Results are now published.');
      setShowFinalizeModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to finalize event');
    } finally {
      setFinalizing(false);
    }
  };

  // Unfinalize event
  const handleUnfinalizeEvent = async () => {
    if (!event) return;

    try {
      setFinalizing(true);
      const res = await fetch(`/api/events/${event.id}/finalize?admin_token=${token}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to unfinalize event');
      }

      setSuccessMessage('✅ Event reopened for editing');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to unfinalize event');
    } finally {
      setFinalizing(false);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    if (!event) return;

    try {
      setExportingPDF(true);
      
      // Fetch scores by day for PDF
      const res = await fetch(`/api/public/${event.public_token}`);
      if (!res.ok) throw new Error('Failed to fetch data for PDF');
      
      const data = await res.json();
      const scoresByDay = data.data?.scores_by_day || [];
      
      generateResultsPDF({
        event: {
          event_name: event.name,
          mode: event.mode as any,
          theme_color: event.theme_color,
          public_token: event.public_token,
          finalized_at: event.finalized_at
        },
        teams: teams.map(t => ({
          id: Number(t.id),
          team_name: t.name,
          avatar_url: t.avatar_url || null,
          total_points: t.total_points || 0
        })),
        scoresByDay,
        includeLink: true
      });
      
      setSuccessMessage('✅ PDF downloaded successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (errorType === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <ExpiredEvent showWaitlist={true} />
      </div>
    );
  }

  if (errorType === 'not-found') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <EventNotFoundError />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-lg shadow p-6 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/events/create')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Create New Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 py-10 px-4">
      {/* Interactive Tutorial */}
      <AdminTutorial />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-amber-500/10" />
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">A</div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{event?.name}</h1>
              </div>
              <button
                onClick={resetAdminTutorial}
                className="px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2"
                title="Restart tutorial"
              >
                <span className="text-lg">❓</span>
                <span className="hidden sm:inline">Tutorial</span>
              </button>
            </div>
            <p className="text-gray-600 mb-4">Admin Control Panel</p>
            
            {/* Event Links Manager */}
            <EventLinksManager
              eventId={event?.id || ''}
              eventName={event?.name || ''}
              adminToken={token}
              scorerToken={event?.scorer_token || ''}
              publicToken={event?.public_token || ''}
            />
            
            {/* Quick Access Links */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`/history/${token}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
              >
                <span>📊</span>
                Score History
              </a>
              <a
                href={`/recap/${event?.public_token}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
              >
                <span>{event?.is_finalized ? '🏆' : '⚡'}</span>
                {event?.is_finalized ? 'Final Results' : 'Live Scores'}
              </a>
            </div>
          </div>
        </div>

        {/* Finalization & Export Section */}
        {event && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Results Management</h2>
            <div className="space-y-4">
              {/* Finalization Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Event Status</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {event.is_finalized 
                      ? `Finalized on ${new Date(event.finalized_at!).toLocaleString()}`
                      : 'Event is still active - scores can be edited'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {event.is_finalized ? (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✓ Finalized
                      </span>
                      <button
                        onClick={handleUnfinalizeEvent}
                        disabled={finalizing}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {finalizing ? 'Reopening...' : 'Reopen for Editing'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowFinalizeModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                    >
                      Publish Final Results
                    </button>
                  )}
                </div>
              </div>

              {/* PDF Export */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Export Results</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Download a PDF with team rankings, scores, and branding
                  </p>
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  <span>{exportingPDF ? '⏳' : '📄'}</span>
                  {exportingPDF ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Finalize Confirmation Modal */}
        {showFinalizeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Publish Final Results?
              </h3>
              <div className="space-y-3 mb-6 text-sm text-gray-600">
                <p>This will:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Mark the event as officially completed</li>
                  <li>Change "Live Scores" label to "Final Results"</li>
                  <li>Allow you to export results as PDF</li>
                  <li>You can still reopen for editing later</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalizeEvent}
                  disabled={finalizing}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {finalizing ? 'Publishing...' : 'Publish Results'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 font-medium">
            {successMessage}
          </div>
        )}

        {/* SECTION 1: Create Teams (Primary Action) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xl">
              +
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Teams</h2>
              <p className="text-sm text-gray-600">Add teams to your event</p>
            </div>
          </div>
          
          <form onSubmit={handleAddTeam} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Red Dragons"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  required
                  minLength={2}
                  disabled={adding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={teamColor}
                  onChange={(e) => setTeamColor(e.target.value)}
                  className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                  disabled={adding}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={adding || !teamName.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {adding ? 'Adding...' : '+ Add Team'}
            </button>
          </form>

          {/* Bulk team creation hint */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> Need to add multiple teams at once? Use the bulk team creator in your admin dashboard.
            </p>
          </div>
        </div>

        {/* SECTION 2: Teams List (Read-only) */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">
            Teams {teams.length > 0 && <span className="text-gray-500 font-normal">({teams.length})</span>}
          </h2>
          {teams.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-3">👥</div>
              <p>No teams yet. Add your first team above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow"
                      style={{ backgroundColor: team.color }}
                    >
                      {safeInitial(team.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-600">{team.total_points || 0} points</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{team.total_points || 0}</div>
                    <div className="text-xs text-gray-500">total points</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: Scorer Link (Primary Operational Link) */}
        {teams.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">📝</div>
              <div>
                <h3 className="text-xl font-bold text-blue-900">Scorer Interface</h3>
                <p className="text-sm text-blue-700">Dedicated interface for adding scores</p>
              </div>
            </div>
            <p className="text-blue-800 mb-4">
              All scores must be added via the scorer link. This keeps scoring separate from admin functions and prevents accidental changes.
            </p>
            <a
              href={`/score/${event?.scorer_token}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition font-semibold"
            >
              <span>🚀</span>
              Open Scorer Interface
              <span className="text-xs opacity-75">↗</span>
            </a>
          </div>
        )}

        {/* SECTION 4: Links Section (Collapsed Dropdown) */}
        <div className="bg-white rounded-xl shadow border border-gray-200">
          <button
            onClick={() => setShowLinksDropdown(!showLinksDropdown)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔗</span>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Event Links</h3>
                <p className="text-sm text-gray-600">Admin, Scorer, and Public URLs</p>
              </div>
            </div>
            <span className={`text-2xl transition-transform ${showLinksDropdown ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {showLinksDropdown && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-200">
              <EventLinksManager
                eventId={event?.id || ''}
                eventName={event?.name || ''}
                adminToken={token}
                scorerToken={event?.scorer_token || ''}
                publicToken={event?.public_token || ''}
              />
              
              {/* Quick Access Buttons */}
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`/history/${token}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                >
                  <span>📊</span>
                  Score History
                </a>
                <a
                  href={`/recap/${event?.public_token}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                >
                  <span>{event?.is_finalized ? '🏆' : '⚡'}</span>
                  {event?.is_finalized ? 'Final Results' : 'Live Scores'}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: Results Management (Export/Finalize) */}
        {event && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span>
              Results Management
            </h2>
            <div className="space-y-4">
              {/* Finalization Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Event Status</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {event.is_finalized 
                      ? `Finalized on ${new Date(event.finalized_at!).toLocaleString()}`
                      : 'Event is still active - scores can be edited'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {event.is_finalized ? (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✓ Finalized
                      </span>
                      <button
                        onClick={handleUnfinalizeEvent}
                        disabled={finalizing}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {finalizing ? 'Reopening...' : 'Reopen for Editing'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowFinalizeModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                    >
                      Publish Final Results
                    </button>
                  )}
                </div>
              </div>

              {/* PDF Export */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Export Results</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Download a PDF with team rankings, scores, and branding
                  </p>
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  <span>{exportingPDF ? '⏳' : '📄'}</span>
                  {exportingPDF ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: Past Events (Read-only, Last Section) */}
        <PastEventsSection adminToken={token} />
      </div>
    </div>
  );
}
