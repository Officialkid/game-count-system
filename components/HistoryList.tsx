// components/HistoryList.tsx
'use client';

import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';

export interface GameScore {
  id: string;
  team_id: string;
  team_name: string;
  game_number: number;
  points: number;
  created_at: string;
  edited_at?: string | null;
}

interface HistoryListProps {
  scores: GameScore[];
  loading?: boolean;
  onEdit?: (score: GameScore) => void;
  onDelete?: (scoreId: string) => void;
  filterByTeam?: string;
  filterByGame?: number;
}

export function HistoryList({
  scores,
  loading = false,
  onEdit,
  onDelete,
  filterByTeam,
  filterByGame,
}: HistoryListProps) {
  const [sortBy, setSortBy] = useState<'game' | 'team' | 'points' | 'date'>('game');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredScores = scores.filter((score) => {
    if (filterByTeam && score.team_name !== filterByTeam) return false;
    if (filterByGame && score.game_number !== filterByGame) return false;
    return true;
  });

  const sortedScores = [...filteredScores].sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'game':
        return (a.game_number - b.game_number) * modifier;
      case 'team':
        return a.team_name.localeCompare(b.team_name) * modifier;
      case 'points':
        return (a.points - b.points) * modifier;
      case 'date':
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * modifier;
      default:
        return 0;
    }
  });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <Card>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (sortedScores.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <p className="text-gray-600">No game history yet</p>
          {(filterByTeam || filterByGame) && (
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Game History</h3>
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => toggleSort('game')}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
            aria-label="Sort by game number"
          >
            Game {getSortIcon('game')}
          </button>
          <button
            onClick={() => toggleSort('team')}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
            aria-label="Sort by team"
          >
            Team {getSortIcon('team')}
          </button>
          <button
            onClick={() => toggleSort('points')}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
            aria-label="Sort by points"
          >
            Points {getSortIcon('points')}
          </button>
          <button
            onClick={() => toggleSort('date')}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
            aria-label="Sort by date"
          >
            Date {getSortIcon('date')}
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedScores.map((score) => (
          <div
            key={score.id}
            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                  Game #{score.game_number}
                </span>
                <span className="font-medium text-gray-900 truncate">{score.team_name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{new Date(score.created_at).toLocaleString()}</span>
                {score.edited_at && (
                  <span className="text-amber-600">(edited)</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold ${
                score.points >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {score.points >= 0 ? '+' : ''}{score.points}
              </span>

              {(onEdit || onDelete) && (
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(score)}
                      className="p-1"
                      aria-label={`Edit score for ${score.team_name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onDelete(score.id)}
                      className="p-1 text-red-600 hover:bg-red-50"
                      aria-label={`Delete score for ${score.team_name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600 flex justify-between items-center">
        <span>Total Entries: {sortedScores.length}</span>
        {filterByTeam || filterByGame ? (
          <span className="text-primary-600">Filtered results</span>
        ) : null}
      </div>
    </Card>
  );
}

interface HistoryFilterProps {
  teams: Array<{ id: string; name: string }>;
  selectedTeam?: string;
  selectedGame?: number;
  onTeamChange: (teamId: string | undefined) => void;
  onGameChange: (gameNumber: number | undefined) => void;
  maxGameNumber?: number;
}

export function HistoryFilter({
  teams,
  selectedTeam,
  selectedGame,
  onTeamChange,
  onGameChange,
  maxGameNumber = 50,
}: HistoryFilterProps) {
  return (
    <Card className="mb-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="team-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Team
          </label>
          <select
            id="team-filter"
            value={selectedTeam || ''}
            onChange={(e) => onTeamChange(e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            aria-label="Filter by team"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="game-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Game
          </label>
          <select
            id="game-filter"
            value={selectedGame || ''}
            onChange={(e) => onGameChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            aria-label="Filter by game number"
          >
            <option value="">All Games</option>
            {Array.from({ length: maxGameNumber }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                Game #{num}
              </option>
            ))}
          </select>
        </div>

        {(selectedTeam || selectedGame) && (
          <Button
            variant="secondary"
            onClick={() => {
              onTeamChange(undefined);
              onGameChange(undefined);
            }}
            aria-label="Clear all filters"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </Card>
  );
}
