// components/PublicScoreboard.tsx
// FIXED: Race condition in useEffect, replaced Math.max with reduce, added countdown timer, theme rendering (RENDERING-DEBUG-REPORT Issues #1, #2, #12)
'use client';

import { useState, useEffect, useRef } from 'react';
import { TeamCard, TeamList } from './TeamCard';
import { Card } from './Card';
import { getPaletteById } from '@/lib/color-palettes';
import { safeName, safeNumber } from '@/lib/safe-ui-helpers';

interface Team {
  id: string;
  team_name: string;
  // avatar removed for MVP
  // avatar_url: string | null;
  total_points: number;
}

interface Score {
  id: string;
  team_id: string;
  team_name: string;
  game_number: number;
  points: number;
  created_at: string;
}

interface Event {
  id: string;
  event_name: string;
  created_at: string;
  theme_color?: string | null;
  // logo removed for MVP
  // logo_url?: string | null;
}

interface PublicScoreboardProps {
  initialEvent: Event;
  initialTeams: Team[];
  initialScores: Score[];
  onRefresh: () => Promise<{ event: Event; teams: Team[]; scores: Score[] }>;
}

export function PublicScoreboard({
  initialEvent,
  initialTeams,
  initialScores,
  onRefresh,
}: PublicScoreboardProps) {
  const [event, setEvent] = useState(initialEvent);
  const [teams, setTeams] = useState(initialTeams);
  const [scores, setScores] = useState(initialScores);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [countdown, setCountdown] = useState(10);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // FIXED: Race condition - use refs to prevent stale closures and cleanup properly
  useEffect(() => {
    // Clear existing intervals first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (!autoRefresh) {
      setCountdown(10);
      return;
    }

    // Reset countdown
    setCountdown(10);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 10;
        return prev - 1;
      });
    }, 1000);

    // Refresh data interval
    intervalRef.current = setInterval(async () => {
      setRefreshing(true);
      try {
        const data = await onRefresh();
        setEvent(data.event);
        setTeams(data.teams);
        setScores(data.scores);
        setLastUpdate(new Date());
        setCountdown(10); // Reset countdown after refresh
      } catch (error) {
        console.error('Failed to refresh scoreboard:', error);
      } finally {
        setRefreshing(false);
      }
    }, 10000); // Refresh every 10 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, onRefresh]);

  // FIXED: Replace Math.max with reduce to prevent crash on large arrays
  const getLatestGameNumber = () => {
    if (scores.length === 0) return 0;
    return scores.reduce((max, score) => Math.max(max, score.game_number), 0);
  };

  const getLatestScores = () => {
    const latestGameNumber = getLatestGameNumber();
    return scores.filter((s) => s.game_number === latestGameNumber);
  };

  const latestScores = getLatestScores();

  // Theme rendering with theme_color palette (logo removed)
  const palette = getPaletteById(event.theme_color || 'purple') || getPaletteById('purple')!;

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{
        background: `linear-gradient(135deg, ${palette.background} 0%, ${palette.secondary}20 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          {/* Logo removed for MVP */}
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-4 animate-pulse">
            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
            LIVE SCOREBOARD
          </div>
          
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 transition-colors duration-300"
            style={{ color: palette.primary }}
          >
            {safeName(event?.event_name, 'Game Event')}
          </h1>
          
          <div className="flex items-center justify-center gap-3 text-sm sm:text-base text-gray-500">
            <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-primary-600">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </span>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded focus:ring-2"
                style={{ 
                  accentColor: palette.primary
                }}
              />
              <span className="text-gray-700">Auto-refresh</span>
            </label>
            
            {autoRefresh && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Next refresh in <strong className="font-semibold">{countdown}s</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {teams.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-4xl mb-2">⏳</div>
              <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
              <p className="text-gray-600">
                The event organizer hasn't added teams yet. Check back soon!
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Leaderboard */}
            <div className="mb-6 sm:mb-8">
              <h2 
                className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center transition-colors duration-300"
                style={{ color: palette.primary }}
              >
                🏆 Leaderboard
              </h2>
              <TeamList isPublic>
                {teams.map((team, index) => (
                  <TeamCard
                    key={team.id}
                    rank={index + 1}
                    teamName={team.team_name}
                    // avatar removed for MVP
                    avatarUrl={undefined}
                    totalPoints={team.total_points}
                    isPublic
                  />
                ))}
              </TeamList>
            </div>

            {/* Latest Game */}
            {latestScores.length > 0 && (
              <Card className="bg-blue-50">
                <h3 className="text-lg sm:text-xl font-bold mb-4">
                  📊 Latest Game (Game {getLatestGameNumber()})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {latestScores.map((score) => (
                    <div
                      key={score.id}
                      className="bg-white p-3 sm:p-4 rounded-lg flex justify-between items-center border"
                    >
                      <span className="font-semibold text-sm sm:text-base truncate mr-2">
                        {score.team_name}
                      </span>
                      <span
                        className={`text-xl sm:text-2xl font-bold flex-shrink-0 ${
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
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12 text-gray-500 text-xs sm:text-sm">
          <p>Powered by Game Count System</p>
          <p className="mt-2">
            Total Games Played: {getLatestGameNumber()}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoadingScoreboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16" role="status" aria-live="polite">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" aria-hidden="true"></div>
        <p className="text-xl text-gray-600">Loading scoreboard...</p>
        <span className="sr-only">Loading scoreboard data</span>
      </div>
    </div>
  );
}

export function ErrorScoreboard({ error }: { error: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <Card>
        <div className="text-center py-12" role="alert" aria-live="assertive">
          <div className="text-4xl mb-4" aria-hidden="true">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </Card>
    </div>
  );
}
