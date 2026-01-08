'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ScoreEntry {
  id: string;
  team_id: string;
  team_name: string;
  team_color: string;
  points: number;
  category: string | null;
  created_at: string;
  updated_at: string;
  day_number?: number;
  day_label?: string;
}

interface Event {
  id: string;
  name: string;
}

export default function HistoryPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [event, setEvent] = useState<Event | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingScore, setEditingScore] = useState<ScoreEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Verify token and get event
      const eventRes = await fetch(`/api/event-by-token/${token}`, {
        headers: { 'X-ADMIN-TOKEN': token, 'X-SCORER-TOKEN': token }
      });

      if (!eventRes.ok) {
        throw new Error('Invalid token');
      }

      const eventData = await eventRes.json();
      const eventInfo = eventData.data?.event || eventData.event;
      setEvent(eventInfo);

      // Load score history
      const historyRes = await fetch(`/api/events/${eventInfo.id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setScores(historyData.data?.scores || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (scoreId: string, points: number, category: string) => {
    try {
      const res = await fetch('/api/scores/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          score_id: scoreId,
          points: parseInt(points.toString(), 10),
          category: category.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      setEditingScore(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update score');
    }
  };

  const handleDelete = async (scoreId: string) => {
    try {
      const res = await fetch(`/api/scores/update?score_id=${scoreId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      setDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete score');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-500/10" />
          <div className="relative p-8">
            <button
              onClick={() => router.back()}
              className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">H</div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{event?.name}</h1>
                <p className="text-gray-600">Score History & Corrections</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-semibold">{scores.length}</span> total entries
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">📜 Chronological History</h2>
          {scores.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-3">📊</div>
              <p>No score entries yet. Start adding scores!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((score) => (
                <div
                  key={score.id}
                  className="relative border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50"
                >
                  {editingScore?.id === score.id ? (
                    <EditScoreForm
                      score={editingScore}
                      onSave={(points, category) => handleEdit(score.id, points, category)}
                      onCancel={() => setEditingScore(null)}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow shrink-0"
                            style={{ backgroundColor: score.team_color }}
                          >
                            {score.team_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900">{score.team_name}</h3>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  score.points >= 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {score.points > 0 ? '+' : ''}{score.points} pts
                              </span>
                              {score.day_number && (
                                <span className="text-xs text-gray-500">Day {score.day_number}</span>
                              )}
                            </div>
                            {score.category && (
                              <p className="text-sm text-gray-600 mt-1">📝 {score.category}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(score.created_at).toLocaleString()}
                              {score.updated_at !== score.created_at && ' (edited)'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => setEditingScore(score)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                          >
                            Edit
                          </button>
                          {deleteConfirm === score.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDelete(score.id)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(score.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditScoreForm({
  score,
  onSave,
  onCancel,
}: {
  score: ScoreEntry;
  onSave: (points: number, category: string) => void;
  onCancel: () => void;
}) {
  const [points, setPoints] = useState(score.points.toString());
  const [category, setCategory] = useState(score.category || '');

  return (
    <div className="space-y-3 bg-white p-4 rounded border-2 border-blue-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(parseInt(points, 10), category)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
