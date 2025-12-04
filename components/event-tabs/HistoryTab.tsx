'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { LoadingSkeleton, LoadingTableSkeleton } from '../ui/LoadingSkeleton';
import { ScoreHistorySkeleton } from '@/components/skeletons';
import { auth } from '@/lib/api-client';
import { getPaletteById } from '@/lib/color-palettes';

interface GameScore {
  id: number;
  game_number: number;
  game_name: string | null;
  points: number;
  team_name: string;
  added_by: string | null;
  created_at: string;
  is_edited: boolean;
  updated_at: string | null;
}

interface HistoryTabProps {
  eventId: string;
  event?: {
    id: number;
    event_name: string;
    theme_color: string;
  };
}

export function HistoryTab({ eventId, event }: HistoryTabProps) {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'created_at' | 'game_number' | 'team_name'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterGame, setFilterGame] = useState<string>('all');
  const { showToast } = useToast();
  const palette = getPaletteById(event?.theme_color || 'purple') || getPaletteById('purple')!;

  useEffect(() => {
    loadHistory();
  }, [eventId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const token = auth.getToken();
      const response = await fetch(`/api/events/${eventId}/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error('Failed to load history');
      const data = await response.json();
      setScores(data.scores || []);
    } catch (error) {
      console.error('Error loading history:', error);
      showToast('Failed to load history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedScores = scores
    .filter((score) => {
      if (filterTeam !== 'all' && score.team_name !== filterTeam) return false;
      if (filterGame !== 'all' && score.game_number.toString() !== filterGame) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const uniqueTeams = Array.from(new Set(scores.map((s) => s.team_name))).sort();
  const uniqueGames = Array.from(new Set(scores.map((s) => s.game_number))).sort((a, b) => a - b);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTeamTotalPoints = (teamName: string) => {
    return scores
      .filter(s => s.team_name === teamName)
      .reduce((sum, s) => sum + s.points, 0);
  };

  if (loading) {
    return <ScoreHistorySkeleton count={8} />;
  }

  if (scores.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500 mb-2">No game history yet.</p>
          <p className="text-sm text-gray-400">
            Scores will appear here as you add them in the Scoring tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-3xl font-bold text-gray-900">{scores.length}</p>
              </div>
              <span className="text-4xl">📝</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Games</p>
                <p className="text-3xl font-bold text-gray-900">{uniqueGames.length}</p>
              </div>
              <span className="text-4xl">🎮</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Teams</p>
                <p className="text-3xl font-bold text-gray-900">{uniqueTeams.length}</p>
              </div>
              <span className="text-4xl">👥</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-gray-900">Filter & Sort</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Team
                </label>
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ outlineColor: palette.primary }}
                >
                  <option value="all">All Teams ({uniqueTeams.length})</option>
                  {uniqueTeams.map((team) => (
                    <option key={team} value={team}>
                      {team} ({getTeamTotalPoints(team)} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Game
                </label>
                <select
                  value={filterGame}
                  onChange={(e) => setFilterGame(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ outlineColor: palette.primary }}
                >
                  <option value="all">All Games ({uniqueGames.length})</option>
                  {uniqueGames.map((game) => (
                    <option key={game} value={game.toString()}>
                      Game {game}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Complete Game Log ({filteredAndSortedScores.length} {filteredAndSortedScores.length === 1 ? 'entry' : 'entries'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-900 text-xs">
            💡 Click column headers to sort. Headers show current sort direction (↑ ascending, ↓ descending).
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('game_number')}
                    title="Click to sort by game number"
                  >
                    Game {sortField === 'game_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('team_name')}
                    title="Click to sort by team name"
                  >
                    Team {sortField === 'team_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added By
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('created_at')}
                    title="Click to sort by time"
                  >
                    Timestamp {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedScores.map((score) => (
                  <tr key={score.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900">Game {score.game_number}</span>
                        {score.game_name && (
                          <div className="text-xs text-gray-500 italic">{score.game_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{score.team_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold text-lg ${
                          score.points > 0
                            ? 'text-green-600'
                            : score.points < 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {score.points > 0 ? '+' : ''}
                        {score.points}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {score.added_by || <span className="text-gray-400 italic">Unknown</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600" title={new Date(score.created_at).toLocaleString()}>
                      {formatTimestamp(score.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {score.is_edited ? (
                        <div title={`Edited at ${score.updated_at ? formatTimestamp(score.updated_at) : 'unknown'}`}>
                          <Badge variant="warning" size="sm">
                            ✏️ Edited
                          </Badge>
                        </div>
                      ) : (
                        <div title="Original entry">
                          <Badge variant="default" size="sm">
                            ✓ Original
                          </Badge>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
