'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useToast } from '../ui/Toast';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { useSubmissionLock } from '@/lib/hooks/useSubmissionLock';
import { auth } from '@/lib/api-client';
import { getPaletteById } from '@/lib/color-palettes';
import { safeCompare, safeNumber } from '@/lib/safe-ui-helpers';
import { nanoid } from 'nanoid';

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

type SubmissionStatus = 'success' | 'duplicate' | 'error';

interface SubmissionLogEntry {
  id: string;
  team: string;
  gameNumber: number;
  points: number;
  status: SubmissionStatus;
  message?: string;
  timestamp: number;
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
  const { lock: lockSingleScore, unlock: unlockSingleScore, isSubmitting: isSingleScoreSubmitting } = useSubmissionLock();
  const { lock: lockBatchScore, unlock: unlockBatchScore, isSubmitting: isBatchScoreSubmitting } = useSubmissionLock();
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
  const [submissionLog, setSubmissionLog] = useState<SubmissionLogEntry[]>([]);

  const makeClientScoreId = useCallback(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return nanoid();
  }, []);

  const appendSubmissionLog = useCallback((entry: SubmissionLogEntry) => {
    setSubmissionLog((prev) => [entry, ...prev].slice(0, 10));
  }, []);

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
      // API returns { success: true, data: { teams: [...] } }
      setTeams(data.data?.teams || data.teams || []);
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
    if (!lockSingleScore()) return; // Prevent duplicate submissions
    setFormError('');

    if (!selectedTeamId || !gameNumber || !points) {
      setFormError('Please fill in all required fields');
      unlockSingleScore();
      return;
    }

    const pointsValue = parseInt(points);
    if (isNaN(pointsValue)) {
      setFormError('Points must be a valid number');
      unlockSingleScore();
      return;
    }

    if (!event.allow_negative && pointsValue < 0) {
      setFormError('Negative points are not allowed for this event');
      unlockSingleScore();
      return;
    }

    const clientScoreId = makeClientScoreId();

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
          submission_id: clientScoreId,
        }),
      });

      const result = await response.json();
      const duplicate = response.status === 409 || result?.error?.code === 'CONFLICT';
      if (!response.ok || !result.success) {
        const message = result.error || 'Failed to add score';
        setFormError(message);
        appendSubmissionLog({
          id: clientScoreId,
          team: selectedTeamId,
          gameNumber: parseInt(gameNumber),
          points: pointsValue,
          status: duplicate ? 'duplicate' : 'error',
          message: typeof message === 'string' ? message : message?.message,
          timestamp: Date.now(),
        });
        unlockSingleScore();
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

      appendSubmissionLog({
        id: clientScoreId,
        team: selectedTeam?.team_name || selectedTeamId,
        gameNumber: parseInt(gameNumber),
        points: pointsValue,
        status: 'success',
        message: result?.data?.action,
        timestamp: Date.now(),
      });

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
      appendSubmissionLog({
        id: clientScoreId,
        team: selectedTeamId,
        gameNumber: parseInt(gameNumber),
        points: pointsValue,
        status: 'error',
        message: 'Network or server error',
        timestamp: Date.now(),
      });
      unlockSingleScore();
    } finally {
      setSubmitting(false);
      unlockSingleScore();
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockBatchScore()) return; // Prevent duplicate submissions
    setBatchError('');

    if (!batchGameNumber) {
      setBatchError('Please enter a game number');
      unlockBatchScore();
      return;
    }

    const validScores = batchScores.filter(
      s => s.team_id && s.points && !isNaN(parseInt(s.points))
    );

    if (validScores.length === 0) {
      setBatchError('Please enter at least one score');
      unlockBatchScore();
      return;
    }

    // Validate scores
    for (const score of validScores) {
      const pointsValue = parseInt(score.points);
      if (!event.allow_negative && pointsValue < 0) {
        setBatchError(`Negative points not allowed: ${pointsValue}`);
        unlockBatchScore();
        return;
      }
    }

    try {
      setSubmitting(true);
      const token = auth.getToken();

      const scoresWithIds = validScores.map(score => ({
        ...score,
        submission_id: makeClientScoreId(),
      }));

      // Submit all scores in parallel
      const responses = await Promise.all(
        scoresWithIds.map(score =>
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
              submission_id: score.submission_id,
            }),
          })
        )
      );

      const results = await Promise.all(responses.map(r => r.json()));
      const failures = results.filter(r => !r.success);

      if (failures.length > 0) {
        setBatchError(`${failures.length} score(s) failed to save`);
        scoresWithIds.forEach((score, idx) => {
          const result = results[idx];
          const duplicate = responses[idx].status === 409 || result?.error?.code === 'CONFLICT';
          if (!result?.success) {
            const teamName = teams.find(t => t.id === parseInt(score.team_id))?.team_name || score.team_id;
            appendSubmissionLog({
              id: score.submission_id,
              team: teamName,
              gameNumber: parseInt(batchGameNumber),
              points: parseInt(score.points),
              status: duplicate ? 'duplicate' : 'error',
              message: result?.error || 'Failed to add score',
              timestamp: Date.now(),
            });
          }
        });
        unlockBatchScore();
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
      
      scoresWithIds.forEach((score, idx) => {
        const teamName = teams.find(t => t.id === parseInt(score.team_id))?.team_name || score.team_id;
        appendSubmissionLog({
          id: score.submission_id,
          team: teamName,
          gameNumber: parseInt(batchGameNumber),
          points: parseInt(score.points),
          status: 'success',
          message: results[idx]?.data?.action,
          timestamp: Date.now(),
        });
      });

      // Reload teams
      await loadTeams();
    } catch (error) {
      console.error('Error adding batch scores:', error);
      setBatchError('Failed to add scores');
      validScores.forEach((score) => {
        const teamName = teams.find(t => t.id === parseInt(score.team_id))?.team_name || score.team_id;
        appendSubmissionLog({
          id: makeClientScoreId(),
          team: teamName,
          gameNumber: parseInt(batchGameNumber),
          points: parseInt(score.points),
          status: 'error',
          message: 'Network or server error',
          timestamp: Date.now(),
        });
      });
      unlockBatchScore();
    } finally {
      setSubmitting(false);
      unlockBatchScore();
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
                  data-tour="add-score-button"
                  loading={submitting || isSingleScoreSubmitting}
                  disabled={submitting || isSingleScoreSubmitting}
                >
                  {submitting || isSingleScoreSubmitting ? 'Adding score...' : 'Add Score'}
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
                  loading={submitting || isBatchScoreSubmitting}
                  disabled={submitting || isBatchScoreSubmitting}
                >
                  {submitting || isBatchScoreSubmitting ? 'Creating scores...' : 'Add All Scores'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Debug: Last 10 submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug: Last 10 score submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissionLog.length === 0 ? (
            <p className="text-sm text-gray-600">No submissions yet. New writes will show here with their clientScoreId.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Time</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">clientScoreId</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Team</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-700">Game #</th>
                    <th className="text-right py-2 px-2 font-semibold text-gray-700">Points</th>
                    <th className="text-left py-2 px-2 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionLog.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-100">
                      <td className="py-2 px-2 text-gray-600 whitespace-nowrap">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2 px-2 font-mono text-xs text-gray-800 break-all">{entry.id}</td>
                      <td className="py-2 px-2 text-gray-800">{entry.team}</td>
                      <td className="py-2 px-2 text-right text-gray-800">{entry.gameNumber}</td>
                      <td className="py-2 px-2 text-right text-gray-800">{entry.points}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          entry.status === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : entry.status === 'duplicate'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {entry.status}
                        </span>
                        {entry.message ? (
                          <div className="text-xs text-gray-500 mt-1">{String(entry.message)}</div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Team Standings */}
      <Card>
        <CardHeader>
          <CardTitle>Current Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {teams
              .sort((a, b) => {
                const scoreA = safeNumber(a.total_score);
                const scoreB = safeNumber(b.total_score);
                if (scoreB !== scoreA) {
                  return scoreB - scoreA;
                }
                return safeCompare(a.team_name, b.team_name);
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
