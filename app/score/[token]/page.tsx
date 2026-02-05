'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WifiOff, Wifi, RefreshCw, LogOut } from 'lucide-react';
import { ExpiredEvent, EventNotFoundError } from '@/components/ExpiredEvent';
import { safeInitial } from '@/lib/safe-ui-helpers';
import { 
  saveToCache, 
  loadFromCache, 
  queueScore, 
  getQueue, 
  clearQueue,
  removeFromQueue,
  updateCachedTeamPoints,
  pruneQueueForEvent,
  type QueuedScore
} from '@/lib/offline-manager';

interface Team {
  id: string;
  name: string;
  color: string;
  total_points?: number;
}

interface Event {
  id: string;
  name: string;
  mode: string;
  status: string;
  public_token: string;
  start_time?: string;
  number_of_days?: number;
}

export default function ScorerPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'expired' | 'not-found' | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [points, setPoints] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  // Offline state
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queuedScores, setQueuedScores] = useState<QueuedScore[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [usingCache, setUsingCache] = useState(false);

  // Update queue count from localStorage
  useEffect(() => {
    const updateQueueCount = () => {
      setQueuedScores(getQueue());
    };
    updateQueueCount();
    const interval = setInterval(updateQueueCount, 1000);
    return () => clearInterval(interval);
  }, []);

  // Online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored');
      setIsOnline(true);
      syncQueue();
    };
    
    const handleOffline = () => {
      console.log('Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorType(null);
      setUsingCache(false);

      // Verify token and get event
      const eventRes = await fetch(`/api/event-by-token/${token}`, {
        headers: { 'X-SCORER-TOKEN': token }
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
        throw new Error('Invalid scorer token');
      }

      const eventData = await eventRes.json();
      const eventInfo = eventData.data?.event || eventData.event;
      setEvent(eventInfo);

      // Drop queued items from other events when switching tokens
      pruneQueueForEvent(eventInfo.id);
      setQueuedScores(getQueue());

      // Load teams
      const teamsRes = await fetch(`/api/events/${eventInfo.id}/teams`, {
        headers: { 'X-SCORER-TOKEN': token }
      });

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        const loadedTeams = teamsData.data?.teams || teamsData.teams || [];
        setTeams(loadedTeams);
        if (loadedTeams.length > 0 && !selectedTeamId) {
          setSelectedTeamId(loadedTeams[0].id);
        }
        
        // Save to cache on successful load
        saveToCache(token, eventInfo, loadedTeams);
      }
    } catch (err: any) {
      console.error('Load error:', err);
      
      // Try to load from cache if network error
      const cached = loadFromCache(token);
      if (cached) {
        console.log('Loading from cache...');
        setEvent(cached.event);
        setTeams(cached.teams);
        setUsingCache(true);
        setError('Using cached data - network unavailable');
        if (cached.event?.id) {
          pruneQueueForEvent(cached.event.id);
          setQueuedScores(getQueue());
        }
        if (cached.teams.length > 0 && !selectedTeamId) {
          setSelectedTeamId(cached.teams[0].id);
        }
      } else {
        setError(err.message || 'Failed to load event');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync queued scores when online
  const syncQueue = async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    console.log(`Syncing ${queue.length} queued scores...`);

    for (const queuedScore of queue) {
      try {
        if (queuedScore.type === 'bulk') {
          // Bulk submission
          await fetch('/api/scores/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              event_id: queuedScore.eventId,
              category: queuedScore.category,
              items: queuedScore.bulkItems || []
            })
          });
        } else {
          // Single or quick submission
          await fetch(`/api/events/${queuedScore.eventId}/scores`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-SCORER-TOKEN': token
            },
            body: JSON.stringify({
              team_id: queuedScore.teamId,
              day_number: queuedScore.dayNumber,
              category: queuedScore.category,
              points: queuedScore.points
            })
          });
        }
        
        // Remove from queue on success
        removeFromQueue(queuedScore.id);
      } catch (error) {
        console.error('Failed to sync score:', error);
        // Keep in queue to retry later
      }
    }

    setSyncing(false);
    
    // Reload data after sync
    if (getQueue().length === 0) {
      setSuccessMessage('All scores synced successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    }
  };

  // Auto-detect current day based on event start time
  const getCurrentDay = (): number => {
    if (!event?.start_time) return 1;
    const now = new Date();
    const startTime = new Date(event.start_time);
    const daysPassed = Math.floor(
      (now.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.min(daysPassed + 1, event.number_of_days || 1);
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !selectedTeamId || !points) return;

    const pointsValue = parseInt(points);
    const currentDay = getCurrentDay();
    
    // If offline, queue the score
    if (!isOnline) {
      queueScore({
        eventId: event.id,
        teamId: selectedTeamId,
        points: pointsValue,
        category: 'Score',
        dayNumber: currentDay,
        type: 'single'
      });
      
      // Update cached team points for optimistic UI
      updateCachedTeamPoints(token, selectedTeamId, pointsValue);
      
      // Update local state
      setTeams(prevTeams => prevTeams.map(team => 
        team.id === selectedTeamId 
          ? { ...team, total_points: (team.total_points || 0) + pointsValue }
          : team
      ));
      
      const teamName = teams.find(t => t.id === selectedTeamId)?.name || 'Team';
      setSuccessMessage(`✓ Queued: ${pointsValue} points for ${teamName} (will sync when online)`);
      setJustAdded(true);
      setTimeout(() => {
        setSuccessMessage('');
        setJustAdded(false);
      }, 3000);
      
      // Reset form
      setPoints('');
      setSelectedTeamId('');
      return;
    }

    try {
      setSubmitting(true);
      setSuccessMessage('');

      const res = await fetch(`/api/events/${event.id}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SCORER-TOKEN': token
        },
        body: JSON.stringify({
          team_id: selectedTeamId,
          day_number: currentDay,
          category: 'Score',
          points: pointsValue
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add score');
      }

      const teamName = teams.find(t => t.id === selectedTeamId)?.name || 'Team';
      setSuccessMessage(`✅ ${points} points added to ${teamName}`);
      setJustAdded(true);
      setPoints('');
      setSelectedTeamId('');
      
      // Reload teams to show updated totals
      setTimeout(() => {
        loadData();
        setSuccessMessage('');
        setJustAdded(false);
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add score');
    } finally {
      setSubmitting(false);
    }
  };

  const quickAddPoints = async (teamId: string, amount: number) => {
    if (!event) return;
    const currentDay = getCurrentDay();

    // If offline, queue the score
    if (!isOnline) {
      queueScore({
        eventId: event.id,
        teamId: teamId,
        points: amount,
        category: 'Quick Add',
        dayNumber: currentDay,
        type: 'quick'
      });
      
      // Update cached team points for optimistic UI
      updateCachedTeamPoints(token, teamId, amount);
      
      // Update local state
      setTeams(prevTeams => prevTeams.map(team => 
        team.id === teamId 
          ? { ...team, total_points: (team.total_points || 0) + amount }
          : team
      ));
      
      const teamName = teams.find(t => t.id === teamId)?.name || 'Team';
      setSuccessMessage(`✓ Queued: ${amount > 0 ? '+' : ''}${amount} points for ${teamName}`);
      setJustAdded(true);
      setTimeout(() => {
        setSuccessMessage('');
        setJustAdded(false);
      }, 3000);
      return;
    }

    try {
      const res = await fetch(`/api/events/${event.id}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SCORER-TOKEN': token
        },
        body: JSON.stringify({
          team_id: teamId,
          day_number: currentDay,
          category: 'Quick Add',
          points: amount
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add score');
      }

      const teamName = teams.find(t => t.id === teamId)?.name || 'Team';
      setSuccessMessage(`✅ ${amount > 0 ? '+' : ''}${amount} points added to ${teamName}`);
      setJustAdded(true);
      
      setTimeout(() => {
        loadData();
        setSuccessMessage('');
        setJustAdded(false);
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add score');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Event
          </button>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-lg shadow p-6 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h1 className="text-2xl font-bold mb-2">No Teams Yet</h1>
          <p className="text-gray-600 mb-4">
            Teams need to be added before you can record scores. Ask the event admin to add teams first.
          </p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Offline/Sync Status Banner */}
        {!isOnline && (
          <div className="rounded-xl bg-yellow-50 border-2 border-yellow-400 p-4">
            <div className="flex items-center gap-3">
              <WifiOff className="w-6 h-6 text-yellow-600" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-900">Offline Mode</p>
                <p className="text-sm text-yellow-700">
                  Scores will be queued and synced when connection is restored
                </p>
              </div>
            </div>
          </div>
        )}
        
        {syncing && (
          <div className="rounded-xl bg-blue-50 border-2 border-blue-400 p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Syncing Scores...</p>
                <p className="text-sm text-blue-700">
                  Uploading {queuedScores.length} queued score(s) to server
                </p>
              </div>
            </div>
          </div>
        )}
        
        {queuedScores.length > 0 && !syncing && (
          <div className="rounded-xl bg-orange-50 border-2 border-orange-400 p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-orange-600" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900">
                  {queuedScores.length} Score(s) Pending
                </p>
                <p className="text-sm text-orange-700">
                  {isOnline 
                    ? 'Will sync automatically' 
                    : 'Waiting for connection to sync'}
                </p>
              </div>
              {isOnline && (
                <button
                  onClick={syncQueue}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Sync Now
                </button>
              )}
            </div>
          </div>
        )}

        {usingCache && (
          <div className="rounded-xl bg-gray-50 border-2 border-gray-400 p-4">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-gray-600" />
              <p className="text-sm text-gray-700">
                Showing cached data - {isOnline ? 'reconnecting...' : 'offline'}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-500/10" />
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">S</div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{event?.name}</h1>
              </div>
              {/* Online/Offline Indicator */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isOnline ? (
                  <><Wifi className="w-4 h-4" /><span className="text-sm font-medium">Online</span></>
                ) : (
                  <><WifiOff className="w-4 h-4" /><span className="text-sm font-medium">Offline</span></>
                )}
              </div>
            </div>
            <p className="text-gray-600">Score Entry Interface</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`/scoreboard/${event?.public_token}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <span>View Live Scoreboard</span>
                <span>→</span>
              </a>
              <a
                href={`/history/${token}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                <span>📜 Score History</span>
              </a>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 font-medium">
            {successMessage}
          </div>
        )}

        {/* Score Entry Form - Simplified */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Add Score</h2>
          
          <form onSubmit={handleSubmitScore} className="space-y-6">
            {/* STEP 1: Select Team (Large Buttons) */}
            <div>
              <label className="text-lg font-semibold mb-3 block text-gray-900">
                Step 1: Select Team
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`
                      p-4 text-left rounded-xl border-2 transition-all
                      ${selectedTeamId === team.id
                        ? 'border-purple-600 bg-purple-50 shadow-md scale-[1.02]'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                        style={{ backgroundColor: team.color }}
                      >
                        {safeInitial(team.name)}
                      </div>
                      <div className="flex-1">
                        <span className="text-lg font-semibold block text-gray-900">
                          {team.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {team.total_points || 0} points
                        </span>
                      </div>
                      {selectedTeamId === team.id && (
                        <div className="text-purple-600 font-bold text-2xl">
                          ✓
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: Enter Points (Large Input with Presets) */}
            {selectedTeamId && (
              <div>
                <label htmlFor="points" className="text-lg font-semibold mb-3 block text-gray-900">
                  Step 2: Enter Points
                </label>
                
                {/* Quick Preset Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[10, 20, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPoints(preset.toString())}
                      className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
                
                <input 
                  id="points"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="0"
                  className="w-full px-6 py-6 text-3xl text-center font-bold border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-white"
                  autoFocus
                  required
                  disabled={submitting}
                />
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Enter positive number for points, negative for penalties
                </p>
              </div>
            )}

            {/* STEP 3: Submit (Big Button) */}
            {selectedTeamId && points && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-8 py-6 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : `Add ${points} Points to ${teams.find(t => t.id === selectedTeamId)?.name} →`}
              </button>
            )}
          </form>
        </div>

        {/* Success Feedback - Animated */}
        {justAdded && (
          <div className="fixed bottom-6 right-6 p-6 bg-green-500 text-white rounded-xl shadow-2xl animate-bounce z-50 max-w-sm">
            <div className="flex items-center gap-4">
              <div className="text-4xl">✅</div>
              <div>
                <p className="font-bold text-lg">Score Added!</p>
                <p className="text-sm opacity-90">Updated successfully</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Section */}
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
                <div className="flex gap-2">
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
          <p className="text-sm text-gray-700 mb-4">Enter points for multiple teams at once. Use negative values for penalties or deductions. Perfect for recording all teams' scores from a single game!</p>
          <BulkAddForm 
            eventId={event?.id || ''} 
            token={token} 
            teams={teams} 
            onDone={() => loadData()} 
            isOnline={isOnline}
            onQueueScore={(bulkItems, category) => {
              queueScore({
                eventId: event?.id || '',
                teamId: '', // not needed for bulk
                points: 0, // not needed for bulk
                category: category,
                dayNumber: 1,
                type: 'bulk',
                bulkItems: bulkItems
              });
              
              // Update local state optimistically
              setTeams(prevTeams => prevTeams.map(team => {
                const item = bulkItems.find(i => i.team_id === team.id);
                if (item) {
                  return { ...team, total_points: (team.total_points || 0) + item.points };
                }
                return team;
              }));
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface BulkAddFormProps {
  eventId: string;
  token: string;
  teams: Team[];
  onDone: () => void;
  isOnline: boolean;
  onQueueScore: (items: Array<{ team_id: string; points: number }>, category: string) => void;
}

function BulkAddForm({ eventId, token, teams, onDone, isOnline, onQueueScore }: BulkAddFormProps) {
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
    
    // If offline, queue the bulk scores
    if (!isOnline) {
      onQueueScore(items, category);
      setMessage(`✓ Queued ${items.length} entries (will sync when online)`);
      setValues({});
      setTimeout(() => setMessage(''), 5000);
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
        body: JSON.stringify({ event_id: eventId, category, items }),
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
              <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center text-white" style={{ backgroundColor: t.color }}>{safeInitial(t.name)}</span>
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
        {submitting ? 'Submitting…' : '✅ Submit Bulk Scores'}
      </button>
    </form>
  );
}
