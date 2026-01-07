'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
}

export default function ScorerPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [points, setPoints] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Verify token and get event
      const eventRes = await fetch(`/api/event-by-token/${token}`, {
        headers: { 'X-SCORER-TOKEN': token }
      });

      if (!eventRes.ok) {
        throw new Error('Invalid scorer token');
      }

      const eventData = await eventRes.json();
      const eventInfo = eventData.data?.event || eventData.event;
      setEvent(eventInfo);

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
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
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
          'X-SCORER-TOKEN': token
        },
        body: JSON.stringify({
          team_id: selectedTeamId,
          day_number: 1,
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
      
      // Reload teams to show updated totals
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
          'X-SCORER-TOKEN': token
        },
        body: JSON.stringify({
          team_id: teamId,
          day_number: 1,
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{event?.name}</h1>
          <p className="text-gray-600">Score Entry Interface</p>
          <div className="mt-4 pt-4 border-t">
            <a
              href={`/scoreboard/${event?.public_token}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline"
            >
              View Live Scoreboard →
            </a>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 font-medium">
            {successMessage}
          </div>
        )}

        {/* Score Entry Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Add Score</h2>
          <form onSubmit={handleSubmitScore} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={submitting}
              >
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Game 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedTeamId || !points}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
            >
              {submitting ? 'Adding...' : 'Add Score'}
            </button>
          </form>
        </div>

        {/* Quick Add Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Quick Add Points</h2>
          <div className="space-y-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
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
                  {[1, 5, 10, 25].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => quickAddPoints(team.id, amount)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium text-sm"
                    >
                      +{amount}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
