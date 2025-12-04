'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { auth } from '@/lib/api-client';
import { getPaletteById } from '@/lib/color-palettes';

interface Team {
  id: number;
  team_name: string;
  total_score: number;
}

interface Event {
  id: number;
  event_name: string;
  theme_color: string;
  allow_negative: boolean;
}

interface ScoreEntry {
  team_id: string;
  points: string;
}

interface ScoringTabProps {
  eventId: string;
  event: Event;
}

export function ScoringTab({ eventId, event }: ScoringTabProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const palette = getPaletteById(event.theme_color || 'purple') || getPaletteById('purple')!;

  // Form state - Single Score Entry
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [gameNumber, setGameNumber] = useState<string>('');
  const [gameName, setGameName] = useState<string>('');
  const [points, setPoints] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  
  // Batch scoring state
  const [batchMode, setBatchMode] = useState(false);
  const [batchGameNumber, setBatchGameNumber] = useState<string>('');
  const [batchGameName, setBatchGameName] = useState<string>('');
  const [batchScores, setBatchScores] = useState<ScoreEntry[]>([]);
  const [batchError, setBatchError] = useState<string>('');
  
  // Success notification state
  const [lastSuccess, setLastSuccess] = useState<{ gameNum: string; gameName: string } | null>(null);

  useEffect(() => {
    loadTeams();
  }, [eventId]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const token = auth.getToken();
      const response = await fetch(`/api/events/${eventId}/teams`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error('Failed to load teams');
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error('Error loading teams:', error);
      showToast('Failed to load teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (amount: number) => {
    if (!selectedTeamId) {
      showToast('Please select a team first', 'warning');
      return;
    }
    setPoints(amount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedTeamId || !gameNumber || !points) {
      setFormError('Please fill in all required fields');
      return;
    }

    const pointsValue = parseInt(points);
    if (isNaN(pointsValue)) {
      setFormError('Points must be a valid number');
      return;
    }

    if (!event.allow_negative && pointsValue < 0) {
      setFormError('Negative points are not allowed for this event');
      return;
    }

    try {
      setSubmitting(true);
      const token = auth.getToken();
      const response = await fetch(`/api/events/${eventId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          team_id: parseInt(selectedTeamId),
          game_number: parseInt(gameNumber),
          points: pointsValue,
          game_name: gameName || null,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setFormError(result.error || 'Failed to add score');
        return;
      }

      const selectedTeam = teams.find(t => t.id === parseInt(selectedTeamId));
      const displayGameName = gameName || `Game ${gameNumber}`;
      
      // Show success notification with game info
      showToast(
        `✅ ${displayGameName}: +${pointsValue} to ${selectedTeam?.team_name}`,
        'success'
      );
      
      // Set success state for banner
      setLastSuccess({ gameNum: gameNumber, gameName: displayGameName });
      setTimeout(() => setLastSuccess(null), 5000); // Clear after 5 seconds

      // Reset form
      setGameNumber('');
      setGameName('');
      setPoints('');
      setSelectedTeamId('');
      
      // Reload teams to update scores
      await loadTeams();
    } catch (error) {
      console.error('Error adding score:', error);
      setFormError('Failed to add score');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchError('');

    if (!batchGameNumber) {
      setBatchError('Please enter a game number');
      return;
    }

    const validScores = batchScores.filter(
      s => s.team_id && s.points && !isNaN(parseInt(s.points))
    );

    if (validScores.length === 0) {
      setBatchError('Please enter at least one score');
      return;
    }

    // Validate scores
    for (const score of validScores) {
      const pointsValue = parseInt(score.points);
      if (!event.allow_negative && pointsValue < 0) {
        setBatchError(`Negative points not allowed: ${pointsValue}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const token = auth.getToken();

      // Submit all scores in parallel
      const responses = await Promise.all(
        validScores.map(score =>
          fetch(`/api/events/${eventId}/scores`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              team_id: parseInt(score.team_id),
              game_number: parseInt(batchGameNumber),
              points: parseInt(score.points),
              game_name: batchGameName || null,
            }),
          })
        )
      );

      const results = await Promise.all(responses.map(r => r.json()));
      const failures = results.filter(r => !r.success);

      if (failures.length > 0) {
        setBatchError(`${failures.length} score(s) failed to save`);
        return;
      }

      const displayGameName = batchGameName || `Game ${batchGameNumber}`;
      showToast(
        `✅ ${displayGameName}: ${validScores.length} scores added successfully!`,
        'success'
      );

      setLastSuccess({ gameNum: batchGameNumber, gameName: displayGameName });
      setTimeout(() => setLastSuccess(null), 5000);

      // Reset batch form
      setBatchGameNumber('');
      setBatchGameName('');
      setBatchScores([]);
      
      // Reload teams
      await loadTeams();
    } catch (error) {
      console.error('Error adding batch scores:', error);
      setBatchError('Failed to add scores');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchScoreChange = (index: number, field: keyof ScoreEntry, value: string) => {
    const newScores = [...batchScores];
    newScores[index] = { ...newScores[index], [field]: value };
    setBatchScores(newScores);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500 mb-4">
            No teams yet. Add teams first to start scoring.
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {lastSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-900">{lastSuccess.gameName}</p>
              <p className="text-sm text-green-700">Points successfully awarded!</p>
            </div>
          </div>
          <button
            onClick={() => setLastSuccess(null)}
            className="text-green-600 hover:text-green-800 font-bold text-xl"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={!batchMode ? 'primary' : 'secondary'}
          onClick={() => setBatchMode(false)}
          className="flex-1"
        >
          ➕ Single Score
        </Button>
        <Button
          variant={batchMode ? 'primary' : 'secondary'}
          onClick={() => setBatchMode(true)}
          className="flex-1"
        >
          📦 Batch Scoring
        </Button>
      </div>

      {/* Single Score Entry */}
      {!batchMode && (
        <Card>
          <CardHeader>
            <CardTitle>Add Single Score</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Team Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ outlineColor: palette.primary, boxShadow: `0 0 0 0 ${palette.primary}00` }}
                  required
                >
                  <option value="">Select a team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.team_name} (Current: {team.total_score} pts)
                    </option>
                  ))}
                </select>
              </div>

              {/* Game Number and Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Game Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={gameNumber}
                    onChange={(e) => setGameNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ outlineColor: palette.primary }}
                    placeholder="1, 2, 3..."
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Game Name <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ outlineColor: palette.primary }}
                    placeholder="e.g., Quiz Round, Puzzle Challenge"
                  />
                </div>
              </div>

              {/* Points Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ outlineColor: palette.primary }}
                  placeholder="Enter points..."
                  required
                  min={event.allow_negative ? undefined : 0}
                />
              </div>

              {/* Quick Add Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Add
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickAdd(10)}
                  >
                    +10
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickAdd(20)}
                  >
                    +20
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickAdd(50)}
                  >
                    +50
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickAdd(100)}
                  >
                    +100
                  </Button>
                  {event.allow_negative && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleQuickAdd(-5)}
                      >
                        -5
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleQuickAdd(-10)}
                      >
                        -10
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm" role="alert">
                  {formError}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setGameNumber('');
                    setGameName('');
                    setPoints('');
                    setSelectedTeamId('');
                    setFormError('');
                  }}
                  disabled={submitting}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  disabled={submitting}
                >
                  Add Score
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Batch Scoring Entry */}
      {batchMode && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Scoring - Add Multiple Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              {/* Batch Game Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Game Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={batchGameNumber}
                    onChange={(e) => setBatchGameNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ outlineColor: palette.primary }}
                    placeholder="1, 2, 3..."
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Game Name <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={batchGameName}
                    onChange={(e) => setBatchGameName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ outlineColor: palette.primary }}
                    placeholder="e.g., Trivia Round 1"
                  />
                </div>
              </div>

              {/* Batch Scores Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 px-2 font-semibold text-gray-700">Team</th>
                      <th className="text-right py-2 px-2 font-semibold text-gray-700">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team, index) => (
                      <tr key={team.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-2 px-2">{team.team_name}</td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={batchScores[index]?.points || ''}
                            onChange={(e) =>
                              handleBatchScoreChange(index, 'points', e.target.value)
                            }
                            onFocus={(e) => {
                              if (!batchScores[index]) {
                                handleBatchScoreChange(index, 'team_id', team.id.toString());
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 text-right"
                            style={{ outlineColor: palette.primary }}
                            placeholder="0"
                            min={event.allow_negative ? undefined : 0}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Error Display */}
              {batchError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm" role="alert">
                  {batchError}
                </div>
              )}

              {/* Summary */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-sm">
                💡 Enter points for the teams you want to score. Leave blank to skip.
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setBatchGameNumber('');
                    setBatchGameName('');
                    setBatchScores([]);
                    setBatchError('');
                  }}
                  disabled={submitting}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  disabled={submitting}
                >
                  Add All Scores
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Current Team Standings */}
      <Card>
        <CardHeader>
          <CardTitle>Current Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {teams
              .sort((a, b) => {
                if (b.total_score !== a.total_score) {
                  return b.total_score - a.total_score;
                }
                return a.team_name.localeCompare(b.team_name);
              })
              .map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-400 w-6">
                      {index + 1}
                    </span>
                    <span className="font-medium">{team.team_name}</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">
                    {team.total_score}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
