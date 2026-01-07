'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
}

export default function AdminPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#3B82F6');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Verify token and get event
      const eventRes = await fetch(`/api/event-by-token/${token}`, {
        headers: { 'X-ADMIN-TOKEN': token }
      });

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{event?.name}</h1>
          <p className="text-gray-600">Admin Control Panel</p>
          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            <div>
              <span className="font-semibold">Scorer Link:</span>{' '}
              <a href={`/score/${event?.scorer_token}`} className="text-purple-600 hover:underline" target="_blank">
                {window.location.origin}/score/{event?.scorer_token}
              </a>
            </div>
            <div>
              <span className="font-semibold">Public Scoreboard:</span>{' '}
              <a href={`/scoreboard/${event?.public_token}`} className="text-purple-600 hover:underline" target="_blank">
                {window.location.origin}/scoreboard/{event?.public_token}
              </a>
            </div>
            <div>
              <span className="font-semibold">Recap:</span>{' '}
              <a href={`/recap/${event?.public_token}`} className="text-purple-600 hover:underline" target="_blank">
                {window.location.origin}/recap/{event?.public_token}
              </a>
            </div>
          </div>
        </div>

        {/* Add Team Form */}
        <div className="bg-white rounded-lg shadow p-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  disabled={adding}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={adding || !teamName.trim()}
              className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? 'Adding...' : 'Add Team'}
            </button>
          </form>
        </div>

        {/* Teams List */}
        <div className="bg-white rounded-lg shadow p-6">
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
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: team.color }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
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
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-purple-900 mb-2">✅ Ready to start!</h3>
            <p className="text-purple-800 mb-4">
              Teams are set up. Share the scorer link with your score keeper or open it yourself to start recording points.
            </p>
            <a
              href={`/score/${event?.scorer_token}`}
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Open Scorer Interface
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
