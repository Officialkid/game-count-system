/**
 * Responsive Team Display Component
 * 
 * Card layout on mobile (stacked)
 * Table layout on desktop (grid)
 * Touch-optimized selection and actions
 */

'use client';

import React from 'react';
import { useBreakpoint, useIsTouch } from '@/hooks/useMobile';
import { vibrate } from '@/hooks/useMobile';

export interface Team {
  id: string;
  name: string;
  color: string;
  total_points?: number;
  rank?: number;
  score_count?: number;
}

export interface ResponsiveTeamDisplayProps {
  teams: Team[];
  onTeamClick?: (team: Team) => void;
  showRanks?: boolean;
  showScores?: boolean;
  selectable?: boolean;
  selectedTeamId?: string;
  variant?: 'card' | 'compact' | 'minimal';
  loading?: boolean;
}

export function ResponsiveTeamDisplay({
  teams,
  onTeamClick,
  showRanks = true,
  showScores = true,
  selectable = false,
  selectedTeamId,
  variant = 'card',
  loading = false,
}: ResponsiveTeamDisplayProps) {
  const breakpoint = useBreakpoint();
  const isTouch = useIsTouch();

  const isMobile = ['xs', 'sm'].includes(breakpoint);

  const handleTeamClick = (team: Team) => {
    if (selectable && onTeamClick) {
      onTeamClick(team);
      if (isTouch) vibrate(30);
    }
  };

  if (loading) {
    return <TeamDisplaySkeleton count={3} isMobile={isMobile} />;
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <p className="text-gray-700 text-lg">No teams yet</p>
      </div>
    );
  }

  // Mobile: Card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onClick={() => handleTeamClick(team)}
            selected={selectedTeamId === team.id}
            selectable={selectable}
            showRank={showRanks}
            showScore={showScores}
            variant={variant}
          />
        ))}
      </div>
    );
  }

  // Desktop: Table layout
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            {showRanks && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-16">
                Rank
              </th>
            )}
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Team
            </th>
            {showScores && (
              <>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">
                  Points
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 w-32">
                  Scores
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {teams.map((team) => (
            <tr
              key={team.id}
              onClick={() => handleTeamClick(team)}
              className={`
                transition-colors duration-200
                ${
                  selectable
                    ? 'cursor-pointer hover:bg-purple-50'
                    : ''
                }
                ${
                  selectedTeamId === team.id
                    ? 'bg-purple-100 ring-2 ring-purple-500'
                    : 'bg-white'
                }
              `}
            >
              {showRanks && (
                <td className="px-4 py-4">
                  <RankBadge rank={team.rank || 0} />
                </td>
              )}
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-medium text-gray-900">{team.name}</span>
                </div>
              </td>
              {showScores && (
                <>
                  <td className="px-4 py-4 text-right">
                    <span className="text-2xl font-bold text-gray-900 tabular-nums">
                      {team.total_points || 0}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-gray-600 tabular-nums">
                      {team.score_count || 0}
                    </span>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Team Card Component (Mobile)
 */
interface TeamCardProps {
  team: Team;
  onClick?: () => void;
  selected?: boolean;
  selectable?: boolean;
  showRank?: boolean;
  showScore?: boolean;
  variant?: 'card' | 'compact' | 'minimal';
}

function TeamCard({
  team,
  onClick,
  selected = false,
  selectable = false,
  showRank = true,
  showScore = true,
  variant = 'card',
}: TeamCardProps) {
  const isCompact = variant === 'compact';
  const isMinimal = variant === 'minimal';

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl transition-all duration-200
        ${
          selectable
            ? 'cursor-pointer active:scale-98 touch-manipulation'
            : ''
        }
        ${
          selected
            ? 'bg-purple-100 ring-2 ring-purple-500 shadow-md'
            : 'bg-white shadow-sm hover:shadow-md'
        }
        ${isCompact ? 'p-3' : 'p-4'}
        ${isMinimal ? 'border border-gray-200' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        {showRank && team.rank && (
          <div className="flex-shrink-0">
            <RankBadge rank={team.rank} size={isCompact ? 'sm' : 'md'} />
          </div>
        )}

        {/* Color + Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`rounded-full flex-shrink-0 ${
              isCompact ? 'w-3 h-3' : 'w-4 h-4'
            }`}
            style={{ backgroundColor: team.color }}
          />
          <span
            className={`font-semibold text-gray-900 truncate ${
              isCompact ? 'text-base' : 'text-lg'
            }`}
          >
            {team.name}
          </span>
        </div>

        {/* Score */}
        {showScore && (
          <div className="flex-shrink-0 text-right">
            <div
              className={`font-bold text-gray-900 tabular-nums ${
                isCompact ? 'text-xl' : 'text-3xl'
              }`}
            >
              {team.total_points || 0}
            </div>
            {team.score_count !== undefined && !isMinimal && (
              <div className="text-xs text-gray-700">
                {team.score_count} {team.score_count === 1 ? 'score' : 'scores'}
              </div>
            )}
          </div>
        )}

        {/* Selection indicator */}
        {selectable && (
          <div className="flex-shrink-0">
            <div
              className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center
                transition-colors duration-200
                ${
                  selected
                    ? 'bg-purple-600 border-purple-600'
                    : 'bg-white border-gray-300'
                }
              `}
            >
              {selected && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Rank Badge Component
 */
interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
}

function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const sizeClasses = {
    sm: 'text-lg w-8',
    md: 'text-2xl w-10',
    lg: 'text-3xl w-12',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        font-bold
      `}
    >
      {getRankDisplay(rank)}
    </div>
  );
}

/**
 * Team Display Skeleton (Loading State)
 */
interface TeamDisplaySkeletonProps {
  count?: number;
  isMobile?: boolean;
}

function TeamDisplaySkeleton({ count = 3, isMobile = true }: TeamDisplaySkeletonProps) {
  if (isMobile) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="w-4 h-4 bg-gray-200 rounded-full" />
              <div className="flex-1 h-6 bg-gray-200 rounded" />
              <div className="w-16 h-8 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            <th className="px-4 py-3 w-16"></th>
            <th className="px-4 py-3"></th>
            <th className="px-4 py-3 w-32"></th>
            <th className="px-4 py-3 w-32"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: count }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-200 rounded-full" />
                  <div className="h-6 bg-gray-200 rounded w-32" />
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="h-8 bg-gray-200 rounded w-16 ml-auto" />
              </td>
              <td className="px-4 py-4">
                <div className="h-6 bg-gray-200 rounded w-12 ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Team Grid (Alternative layout)
 */
export interface ResponsiveTeamGridProps {
  teams: Team[];
  onTeamClick?: (team: Team) => void;
  selectedTeamId?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function ResponsiveTeamGrid({
  teams,
  onTeamClick,
  selectedTeamId,
  columns = 2,
}: ResponsiveTeamGridProps) {
  const isTouch = useIsTouch();

  const handleClick = (team: Team) => {
    if (onTeamClick) {
      onTeamClick(team);
      if (isTouch) vibrate(30);
    }
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {teams.map((team) => (
        <button
          key={team.id}
          onClick={() => handleClick(team)}
          className={`
            p-6 rounded-2xl text-left
            transition-all duration-200
            touch-manipulation active:scale-98
            ${
              selectedTeamId === team.id
                ? 'ring-4 ring-purple-500 shadow-xl'
                : 'shadow-md hover:shadow-lg'
            }
          `}
          style={{
            backgroundColor: team.color,
            color: getContrastColor(team.color),
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="text-2xl font-bold">{team.name}</div>
            {team.total_points !== undefined && (
              <div className="text-4xl font-black tabular-nums">
                {team.total_points}
              </div>
            )}
            {team.score_count !== undefined && (
              <div className="text-sm opacity-80">
                {team.score_count} {team.score_count === 1 ? 'score' : 'scores'}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Utility: Get contrasting text color for background
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
}
