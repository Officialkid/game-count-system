'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateResultsPDF } from '@/lib/pdf-export';
import PastEventsSection from '@/components/PastEventsSection';
import { AdminTutorial, resetAdminTutorial } from '@/components/AdminTutorial';
import { EventLinksManager } from '@/components/EventLinksManager';
import { ExpiredEvent, EventNotFoundError } from '@/components/ExpiredEvent';

interface Team {
  id: string;
  name: string;
  color: string;
  avatar_url?: string;
  total_points?: number;
}

interface EventDay {
  id: string;
  day_number: number;
  label: string;
  is_locked: boolean;
  created_at: string;
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
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'expired' | 'not-found' | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#3B82F6');
  const [adding, setAdding] = useState(false);
  
  // Scoring state
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [points, setPoints] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Finalization state
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

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

      // Load event days if camp mode
      if (eventInfo.mode === 'camp') {
        const daysRes = await fetch(`/api/events/${eventInfo.id}/days`);
        if (daysRes.ok) {
          const daysData = await daysRes.json();
          const days = daysData.data?.days || [];
          setEventDays(days);
          
          // Set active day based on current date or first unlocked day
          if (days.length > 0) {
            const firstUnlocked = days.find((d: EventDay) => !d.is_locked);
            setActiveDay(firstUnlocked?.day_number || 1);
          }
        }
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

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !selectedTeamId || !points) return;

    try {
      setSubmitting(true);
      setSuccessMessage('');

      const res = await fetch(`/api/events/${event.id}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token
        },
        body: JSON.stringify({
          team_id: selectedTeamId,
          day_number: event.mode === 'camp' ? activeDay : 1,
          category: category.trim() || 'Score',
          points: parseInt(points)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add score');
      }

      const teamName = teams.find(t => t.id === selectedTeamId)?.name || 'Team';
      setSuccessMessage(`✅ ${points} points added to ${teamName}`);
      setPoints('');
      setCategory('');
      
      setTimeout(() => {
        loadData();
        setSuccessMessage('');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to add score');
    } finally {
      setSubmitting(false);
    }
  };

  const quickAddPoints = async (teamId: string, amount: number) => {
    if (!event) return;

    try {
      const res = await fetch(`/api/events/${event.id}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token
        },
        body: JSON.stringify({
          team_id: teamId,
          day_number: event.mode === 'camp' ? activeDay : 1,
          category: 'Quick Add',
          points: amount
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add score');
      }

      const teamName = teams.find(t => t.id === teamId)?.name || 'Team';
      setSuccessMessage(`✅ ${amount} points added to ${teamName}`);
      
      setTimeout(() => {
        loadData();
        setSuccessMessage('');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to add score');
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

        {/* Camp Day Selector */}
        {event?.mode === 'camp' && eventDays.length > 0 && teams.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-indigo-900">🏕️ Camp Day</h2>
                <p className="text-sm text-indigo-700">Select which day to score for</p>
              </div>
              <div className="text-3xl font-extrabold text-indigo-600">Day {activeDay}</div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {eventDays.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setActiveDay(day.day_number)}
                  disabled={day.is_locked}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    activeDay === day.day_number
                      ? 'border-indigo-600 bg-indigo-100 shadow-md scale-105'
                      : day.is_locked
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                      : 'border-indigo-200 bg-white hover:border-indigo-400 hover:shadow'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs text-gray-500 font-medium">Day</div>
                    <div className="text-2xl font-bold text-gray-900">{day.day_number}</div>
                    {day.is_locked && (
                      <div className="text-xs text-red-600 mt-1">🔒</div>
                    )}
                  </div>
                  {activeDay === day.day_number && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-600 rounded-full m-1"></div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 text-xs text-indigo-600 text-center">
              Scoring to: <strong>{eventDays.find(d => d.day_number === activeDay)?.label || `Day ${activeDay}`}</strong>
            </div>
          </div>
        )}

        {/* Score Entry (Admin can score directly) */}
        {teams.length > 0 && (
          <>
            <div className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold mb-2">Add Score</h2>
              <p className="text-sm text-gray-600 mb-4">Enter positive points for gains or negative values for penalties/deductions.</p>
              <form onSubmit={handleSubmitScore} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Team
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    required
                    disabled={submitting}
                  >
                    <option value="">Choose a team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} — {team.total_points || 0} pts
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      placeholder="50"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason / Game Name <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Round 1, Penalty, Bonus Game"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedTeamId || !points}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                >
                  {submitting ? 'Adding...' : 'Add Score'}
                </button>
              </form>
            </div>

            {/* Quick Add Points */}
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Quick Add Points</h2>
              <div className="space-y-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow"
                        style={{ backgroundColor: team.color }}
                      >
                        {team.total_points || 0}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-600">{team.total_points || 0} points</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {[-25, -10, -5, -1, 1, 5, 10, 25].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => quickAddPoints(team.id, amount)}
                          className={`px-3 py-1 rounded font-medium text-sm transition ${
                            amount < 0
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {amount > 0 ? `+${amount}` : `${amount}`}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bulk Add for All Teams */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow p-6 border border-purple-200">
              <h2 className="text-xl font-bold mb-2">🎯 Bulk Score Entry</h2>
              <p className="text-sm text-gray-700 mb-4">Enter points for multiple teams at once. Use negative values for penalties or deductions.</p>
              <BulkAddForm 
                eventId={event?.id || ''} 
                token={token} 
                teams={teams} 
                dayNumber={event?.mode === 'camp' ? activeDay : 1}
                onDone={() => loadData()} 
              />
            </div>
          </>
        )}

        {/* Team Management Section */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-6">
          <h2 className="text-xl font-bold text-amber-900 mb-2">👥 Team Management</h2>
          <p className="text-amber-800 text-sm">Admin-only section for adding and managing teams.</p>
        </div>

        {/* Add Team Form */}
        <div className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-bold mb-4">Add Team</h2>
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
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding...' : 'Add Team'}
            </button>
          </form>
        </div>

        {/* Teams List */}
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
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {team.name}
                        <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Team</span>
                      </h3>
                      <p className="text-sm text-gray-600">{team.total_points || 0} points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Steps */}
        {teams.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
            <h3 className="font-semibold text-purple-900 mb-2">✅ Ready to start!</h3>
            <p className="text-purple-800 mb-4">
              Teams are set up. You can score directly here or share the scorer link with your score keeper.
            </p>
            <a
              href={`/score/${event?.scorer_token}`}
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition"
            >
              Open Dedicated Scorer Interface
            </a>
          </div>
        )}

        {/* Past Events Section */}
        <PastEventsSection adminToken={token} />
      </div>
    </div>
  );
}

function BulkAddForm({ eventId, token, teams, dayNumber, onDone }: { eventId: string; token: string; teams: Team[]; dayNumber: number; onDone: () => void }) {
  const [category, setCategory] = useState('Bulk Entry');
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const setTeamValue = (teamId: string, val: string) => {
    setValues((prev) => ({ ...prev, [teamId]: val }));
  };

  const submitBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    const items = teams
      .map((t) => ({ team_id: t.id, points: parseInt(values[t.id] ?? '0', 10) }))
      .filter((i) => !Number.isNaN(i.points) && i.points !== 0);
    if (items.length === 0) {
      setMessage('Enter at least one non-zero value.');
      return;
    }
    try {
      setSubmitting(true);
      setMessage('');
      const res = await fetch('/api/scores/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event_id: eventId, day_number: dayNumber, category, items }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Bulk add failed');
      }
      setMessage(`✅ Added ${items.length} entries.`);
      setValues({});
      onDone();
    } catch (err: any) {
      setMessage(err.message || 'Bulk add failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submitBulk} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Reason / Game Name</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., Game 1, Penalty Round, Bonus Challenge"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
        />
      </div>
      <div className="bg-white rounded-lg p-4 space-y-3">
        {teams.map((t) => (
          <div key={t.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center p-2 hover:bg-gray-50 rounded transition">
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center text-white" style={{ backgroundColor: t.color }}>{t.name.charAt(0)}</span>
              {t.name}
            </div>
            <input
              type="number"
              value={values[t.id] ?? ''}
              onChange={(e) => setTeamValue(t.id, e.target.value)}
              placeholder="0"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
            <div className="text-sm text-gray-600">Current: <strong>{t.total_points || 0}</strong> pts</div>
          </div>
        ))}
      </div>
      {message && (
        <div className={`text-sm font-medium p-3 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message}</div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {submitting ? 'Adding...' : 'Submit Bulk Entry'}
      </button>
    </form>
  );
}
