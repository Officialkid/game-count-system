/**
 * Real-Time Scoreboard Page (CRITICAL FIX #7)
 * 
 * Features:
 * - Real-time score updates via Firebase onSnapshot()
 * - Live indicator showing connection status
 * - Animated highlights when scores change
 * - Rank change animations
 * - Auto-reconnection on network issues
 * - Updates within 2 seconds of score submission
 * 
 * Usage: /scoreboard/[token]
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LiveIndicator, LiveBadge } from '@/components/LiveIndicator';
import { ScoreUpdateHighlight, RankChangeIndicator, ScoreItemSkeleton } from '@/components/ScoreUpdateHighlight';
import { useRealtimeTeams } from '@/hooks/useRealtimeTeams';
import { useRealtimeScores } from '@/hooks/useRealtimeScores';

interface EventMeta {
  id: string;
  name: string;
  eventMode?: string;
  scoringMode?: string;
  start_at?: string;
  end_at?: string;
  eventStatus?: string;
}

export default function RealtimeScoreboardPage({ params }: { params: { token: string } }) {
  const token = params.token;
  
  if (!token || token === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Missing Token</h1>
          <p className="text-gray-600 mb-6">
            No event token was provided. Please check your link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">
              Unable to load the scoreboard. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Refresh
            </button>
          </div>
        </div>
      }
    >
      <RealtimeScoreboardContent token={token} />
    </ErrorBoundary>
  );
}

function RealtimeScoreboardContent({ token }: { token: string }) {
  const [event, setEvent] = useState<EventMeta | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  
  // Real-time hooks (only activate after we have eventId)
  const {
    teams,
    loading: teamsLoading,
    error: teamsError,
    connected: teamsConnected,
    rankChanges,
  } = useRealtimeTeams(eventId);
  
  const {
    scores,
    loading: scoresLoading,
    error: scoresError,
    connected: scoresConnected,
    lastUpdate,
    reconnect,
  } = useRealtimeScores(eventId);

  // Fetch initial event metadata (one-time)
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setEventLoading(true);
        
        // Verify token and get event info
        const res = await fetch(`/api/public/verify/${token}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setEventError('Event not found');
          } else if (res.status === 410) {
            setEventError('Event expired');
          } else {
            setEventError('Failed to load event');
          }
          setEventLoading(false);
          return;
        }
        
        const data = await res.json();
        const eventData = data.data?.event || data.event;
        
        if (!eventData) {
          setEventError('Invalid event data');
          setEventLoading(false);
          return;
        }
        
        setEvent(eventData);
        setEventId(eventData.id);
        setEventError(null);
      } catch (err: any) {
        console.error('Failed to fetch event:', err);
        setEventError(err.message || 'Network error');
      } finally {
        setEventLoading(false);
      }
    };

    fetchEvent();
  }, [token]);

  // Combined loading state
  const loading = eventLoading || (eventId ? (teamsLoading || scoresLoading) : false);
  const error = eventError || teamsError || scoresError;
  const connected = teamsConnected && scoresConnected;

  // Show error state
  if (eventError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{eventError}</h1>
          <p className="text-gray-600 mb-6">
            Please check your link or contact the event organizer.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading skeleton
  if (loading && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="h-16 bg-gray-200 rounded-lg mb-6 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <ScoreItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header with live indicator */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {event?.name || 'Scoreboard'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {teams.length} teams · {scores.length} scores
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <LiveBadge connected={connected} />
              <LiveIndicator
                connected={connected}
                loading={loading}
                error={error}
                lastUpdate={lastUpdate}
                onReconnect={reconnect}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🏆 Leaderboard
              {connected && <span className="text-xs bg-white/20 px-2 py-1 rounded">LIVE</span>}
            </h2>
          </div>

          {/* Teams list */}
          <div className="divide-y divide-gray-200">
            {teams.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-lg font-medium">No teams yet</p>
                <p className="text-sm mt-2">Teams will appear here as they're added</p>
              </div>
            ) : (
              teams.map((team, index) => {
                const rank = index + 1;
                const rankChange = rankChanges.find(rc => rc.teamId === team.id);
                const teamScoreKey = `${team.id}-${team.total_points}`;
                
                return (
                  <ScoreUpdateHighlight
                    key={team.id}
                    scoreKey={teamScoreKey}
                    highlightColor="green"
                    duration={1500}
                  >
                    <div className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-16 text-center">
                          <div className="text-3xl font-bold">
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                          </div>
                          {rankChange && (
                            <RankChangeIndicator
                              direction={rankChange.direction}
                              fromRank={rankChange.oldRank}
                              toRank={rankChange.newRank}
                            />
                          )}
                        </div>

                        {/* Team color badge */}
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Team name */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                          <p className="text-sm text-gray-500">Rank #{rank}</p>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-3xl font-bold text-purple-600">
                            {team.total_points}
                          </div>
                          <p className="text-sm text-gray-500">points</p>
                        </div>
                      </div>
                    </div>
                  </ScoreUpdateHighlight>
                );
              })
            )}
          </div>
        </div>

        {/* Recent activity */}
        {scores.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">📊 Recent Activity</h2>
            </div>
            
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {scores.slice(0, 10).map((score, index) => {
                const team = teams.find(t => t.id === score.team_id);
                const scoreKey = `${score.id}-${index}`;
                
                return (
                  <ScoreUpdateHighlight
                    key={score.id}
                    scoreKey={scoreKey}
                    highlightColor="blue"
                    duration={1000}
                  >
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow"
                        style={{ backgroundColor: team?.color || '#3B82F6' }}
                      >
                        {score.team_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {score.team_name || 'Unknown Team'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {score.game_name || `Score #${score.game_number || ''}`}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600">
                          {score.final_score > 0 ? '+' : ''}{score.final_score}
                        </div>
                        {score.penalty > 0 && (
                          <p className="text-xs text-red-500">-{score.penalty} penalty</p>
                        )}
                      </div>
                    </div>
                  </ScoreUpdateHighlight>
                );
              })}
            </div>
          </div>
        )}

        {/* Connection status footer */}
        {(teamsError || scoresError) && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-yellow-800">Connection Issue</p>
                <p className="text-sm text-yellow-700">
                  {teamsError || scoresError}
                </p>
              </div>
              {reconnect && (
                <button
                  onClick={reconnect}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
