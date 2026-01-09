'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Badge, LoadingSkeleton } from '@/components/ui';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ExpiredEvent, EventNotFoundError } from '@/components/ExpiredEvent';
import { safeName, safeNumber, safeColor, safeInitial } from '@/lib/safe-ui-helpers';

interface Team {
  id: number;
  team_name: string;
  avatar_url: string | null;
  total_points: number;
  previousRank?: number;
}

interface DayScore {
  day_number: number;
  day_label: string | null;
  team_name: string;
  team_id: string;
  points: number;
}

interface HistoryItem {
  id: number;
  game_number: number;
  game_name: string | null;
  points: number;
  team_name: string;
  created_at: string;
}

interface EventMeta {
  id: number;
  event_name: string;
  mode?: string;
  theme_color: string;
  logo_url: string | null;
  created_at: string;
}

interface RankChange {
  teamId: number;
  oldRank: number;
  newRank: number;
}

export default function PublicScoreboardPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const [event, setEvent] = useState<EventMeta | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [scoresByDay, setScoresByDay] = useState<DayScore[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | 'cumulative'>('cumulative');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [rankChanges, setRankChanges] = useState<RankChange[]>([]);
  const prevTeamsRef = useRef<Map<number, number>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [reloadCounter, setReloadCounter] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Wrap entire component in error boundary
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Scoreboard Error</h1>
            <p className="text-gray-600 mb-6">
              Unable to load the scoreboard. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <ScoreboardContent token={token} />
    </ErrorBoundary>
  );
}

function ScoreboardContent({ token }: { token: string }) {
  const [event, setEvent] = useState<EventMeta | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [scoresByDay, setScoresByDay] = useState<DayScore[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | 'cumulative'>('cumulative');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [rankChanges, setRankChanges] = useState<RankChange[]>([]);
  const prevTeamsRef = useRef<Map<number, number>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [reloadCounter, setReloadCounter] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data loading function
  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      setError('');
      // Quick token verify
      const v = await fetch(`/api/public/verify/${token}`);
      
      // Handle 404 - event not found
      if (v.status === 404) {
        setInvalid('not-found');
        setLoading(false);
        return;
      }
      
      // Handle 410 - event expired
      if (v.status === 410) {
        setInvalid('expired');
        setLoading(false);
        return;
      }
      
      if (!v.ok && v.status >= 500) {
        setError('Server error. Please try again later.');
        setLoading(false);
        return;
      }
        // Fetch unified public data
        const res = await fetch(`/api/public/${token}`);
        if (!res.ok) {
          if (res.status >= 500) {
            throw new Error('Server error');
          }
          throw new Error('Failed to load');
        }
      const payload = await res.json();
      const data = payload?.data ?? payload;
      
      setEvent(data.event || null);
        const newTeams = data.teams || [];
        const scoresByDayData = data.scores_by_day || [];
        setScoresByDay(scoresByDayData);
        
        // Track rank changes for animation
        const changes: RankChange[] = [];
        newTeams.forEach((team: Team, newRank: number) => {
          const oldRank = prevTeamsRef.current.get(team.id);
          if (oldRank !== undefined && oldRank !== newRank) {
            changes.push({ teamId: team.id, oldRank, newRank });
          }
        });
        
        // Update prev ranks
        const newMap = new Map<number, number>();
        newTeams.forEach((team: Team, idx: number) => {
          newMap.set(team.id, idx);
        });
        prevTeamsRef.current = newMap;
        
        if (changes.length > 0) {
          setRankChanges(changes);
          setTimeout(() => setRankChanges([]), 1000);
        }
        
        setTeams(newTeams);
        const scores = data.scores || data.history || [];
      setHistory(scores);
      setInvalid(null);
      setLastUpdate(Date.now());
    } catch (e: any) {
      console.error(e);
      const msg = e?.message === 'Server error' ? 'Server error. Please try again later.' : 'Network error. Please check your connection and retry.';
      setError(msg);
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    loadData(true);
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    loadData();
    const id = setInterval(() => loadData(), 300000); // 5 minute refresh (300000ms)
    return () => { clearInterval(id); };
  }, [token, reloadCounter]);

  // Format relative time for last update
  const getRelativeTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'a while ago';
  };

  const [relativeTime, setRelativeTime] = useState(getRelativeTime(lastUpdate));

  // Update relative time every 10 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setRelativeTime(getRelativeTime(lastUpdate));
    }, 10000);
    return () => clearInterval(id);
  }, [lastUpdate]);

  // Simple polling-based updates (no SSE needed)
  const statusBadge = useMemo(() => {
    if (loading) return { label: 'Loading', variant: 'info' as const, dot: 'bg-blue-600' };
    if (error) return { label: 'Error', variant: 'warning' as const, dot: 'bg-yellow-500' };
    return { label: 'Live', variant: 'success' as const, dot: 'bg-green-600' };
  }, [loading, error]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return a.team_name.localeCompare(b.team_name);
    });
  }, [teams]);

  // Get unique days from scores
  const availableDays = useMemo(() => {
    const days = new Set<number>();
    scoresByDay.forEach(score => days.add(score.day_number));
    return Array.from(days).sort((a, b) => a - b);
  }, [scoresByDay]);

  // Compute per-day rankings
  const dayRankings = useMemo(() => {
    if (selectedDay === 'cumulative') return sortedTeams;
    
    // Group scores by team for selected day
    const teamScores = new Map<string, number>();
    scoresByDay
      .filter(score => score.day_number === selectedDay)
      .forEach(score => {
        const current = teamScores.get(score.team_name) || 0;
        teamScores.set(score.team_name, current + score.points);
      });
    
    // Create ranking from day scores
    const rankings = Array.from(teamScores.entries())
      .map(([team_name, points]) => {
        const team = teams.find(t => t.team_name === team_name);
        return {
          id: team?.id || 0,
          team_name,
          avatar_url: team?.avatar_url || null,
          total_points: points,
        };
      })
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        return a.team_name.localeCompare(b.team_name);
      });
    
    return rankings;
  }, [selectedDay, scoresByDay, teams, sortedTeams]);

  const rankEmoji = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`);
  
  const getRankChangeIndicator = (teamId: number) => {
    const change = rankChanges.find(c => c.teamId === teamId);
    if (!change) return null;
    if (change.newRank < change.oldRank) {
      return <span className="text-green-500 text-sm font-bold ml-2">↑</span>;
    } else if (change.newRank > change.oldRank) {
      return <span className="text-red-500 text-sm font-bold ml-2">↓</span>;
    }
    return null;
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-700 font-semibold mb-3">{error}</p>
        <button
          onClick={() => setReloadCounter((c) => c + 1)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (invalid === 'expired') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <ExpiredEvent showWaitlist={true} />
      </div>
    );
  }

  if (invalid === 'not-found') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <EventNotFoundError />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Scoreboard not available.</p>
        <Link href="/public" className="text-purple-600 hover:underline">Browse public events</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7fb' }}>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse-scale {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes rank-up {
          0% { color: #10b981; transform: translateY(0); }
          100% { color: #10b981; transform: translateY(-20px); opacity: 0; }
        }
        @keyframes rank-down {
          0% { color: #ef4444; transform: translateY(0); }
          100% { color: #ef4444; transform: translateY(20px); opacity: 0; }
        }
        .team-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .team-card-hover:hover {
          transform: translateY(-4px);
        }
        .history-item {
          animation: slideDown 0.3s ease-out;
        }
        .rank-change-up {
          animation: rank-up 0.6s ease-out forwards;
        }
        .rank-change-down {
          animation: rank-down 0.6s ease-out forwards;
        }
        .score-update {
          animation: pulse-scale 0.6s ease-out;
        }
      `}</style>
      
      {/* Header with Logo & Theme */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {event?.logo_url && (
                <img 
                  src={event.logo_url} 
                  alt={event?.event_name} 
                  className="w-14 h-14 rounded-lg object-cover shadow-sm border border-gray-200" 
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900">{event?.event_name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="primary" className="gap-1">
                    <span className="text-xs">🌐</span> Public Scoreboard
                  </Badge>
                  <Badge variant={statusBadge.variant} className="gap-2">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${statusBadge.dot} ${
                        !loading && !error ? 'animate-pulse' : ''
                      }`}
                    ></span>
                    {statusBadge.label}
                  </Badge>
                  <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    ⏱️ Auto-refresh: 5m
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    Updated {relativeTime}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button 
                onClick={toggleFullscreen} 
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {isFullscreen ? '✕ Exit' : '⛶ Fullscreen'}
              </button>
              <div 
                className="w-12 h-12 rounded-lg shadow-sm border-2 border-gray-200 cursor-pointer hover:shadow-md transition-shadow" 
                style={{ backgroundColor: event?.theme_color || '#6b46c1' }} 
                title={`Theme: ${event?.theme_color}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Camp Day Tabs (only for camp mode) */}
        {event?.mode === 'camp' && availableDays.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-gray-700">📅 View Scores:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDay('cumulative')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedDay === 'cumulative'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏆 Cumulative Total
              </button>
              {availableDays.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedDay === day
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Day {day}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard - Main Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r p-6 text-white" style={{ 
                background: `linear-gradient(135deg, ${event?.theme_color || '#6b46c1'}dd 0%, ${event?.theme_color || '#6b46c1'} 100%)`
              }}>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  🏆 Team Leaderboard
                  {selectedDay !== 'cumulative' && (
                    <span className="text-sm font-normal opacity-90">• Day {selectedDay}</span>
                  )}
                </h2>
                <p className="text-sm opacity-90 mt-1">
                  {selectedDay === 'cumulative' 
                    ? 'Ranked by total points • Updated live'
                    : `Day ${selectedDay} rankings only`
                  }
                </p>
              </div>
              
              <div className="p-6 space-y-3">
                {dayRankings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      {selectedDay === 'cumulative' 
                        ? 'Waiting for teams to join...'
                        : `No scores yet for Day ${selectedDay}`
                      }
                    </p>
                  </div>
                ) : (
                  dayRankings.map((team, idx) => {
                    const isTopThree = idx < 3;
                    const isAnimating = rankChanges.some(c => c.teamId === team.id);
                    
                    return (
                      <div
                        key={team.id}
                        className={`team-card team-card-hover p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-102 overflow-hidden relative ${
                          isAnimating ? 'scale-105' : ''
                        }`}
                        style={{
                          borderColor: isTopThree ? event?.theme_color + '60' : '#e5e7eb',
                          borderLeft: `6px solid ${event?.theme_color}`,
                          background: isTopThree
                            ? idx === 0
                              ? 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, transparent 100%)'
                              : idx === 1
                              ? 'linear-gradient(135deg, rgba(156,163,175,0.12) 0%, transparent 100%)'
                              : 'linear-gradient(135deg, rgba(244,114,182,0.12) 0%, transparent 100%)'
                            : '#fafafa',
                          boxShadow: isTopThree ? `0 0 20px ${event?.theme_color}20` : undefined,
                        }}
                      >
                        {/* Animated glow for rank changes */}
                        {isAnimating && (
                          <div className="absolute inset-0 bg-yellow-200 opacity-10 animate-pulse"></div>
                        )}
                        
                        <div className="flex items-center justify-between gap-6 relative z-10">
                          {/* Left: Rank Badge & Info */}
                          <div className="flex items-center gap-5 flex-1 min-w-0">
                            {/* Rank Medal */}
                            <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full font-black text-3xl flex-shrink-0" 
                              style={{ 
                                background: isTopThree 
                                  ? idx === 0 
                                    ? 'rgba(251,191,36,0.2)' 
                                    : idx === 1 
                                    ? 'rgba(156,163,175,0.2)' 
                                    : 'rgba(244,114,182,0.2)'
                                  : 'rgba(229,231,235,0.6)',
                                border: `3px solid ${event?.theme_color}40`,
                              }}
                            >
                              {rankEmoji(idx + 1)}
                            </div>
                            
                            {/* Avatar & Team Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                {team.avatar_url ? (
                                  <img 
                                    src={team.avatar_url} 
                                    alt={team.team_name} 
                                    className="w-12 h-12 rounded-full object-cover border-3 shadow-md"
                                    style={{ borderColor: `${event?.theme_color}50` }}
                                  />
                                ) : (
                                  <div 
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md"
                                    style={{ backgroundColor: event?.theme_color || '#6b46c1' }}
                                  >
                                    {safeInitial(team.team_name)}
                                  </div>
                                )}
                                <div className="truncate">
                                  <div className="text-base font-black text-gray-900 truncate">
                                    {team.team_name}
                                    {getRankChangeIndicator(team.id)}
                                  </div>
                                  <div className="text-xs text-gray-500 font-semibold">
                                    #{idx + 1}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right: Score Display */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-5xl font-black score-update transition-all" style={{ color: event?.theme_color }}>
                              {team.total_points}
                            </div>
                            <div className="text-xs font-bold text-gray-500 mt-1 tracking-wide">PTS</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-5 border-l-4" style={{ borderLeftColor: event?.theme_color }}>
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Teams</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">{teams.length}</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-5 border-l-4" style={{ borderLeftColor: event?.theme_color }}>
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total Points</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {teams.reduce((sum, t) => sum + t.total_points, 0)}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-5 border-l-4" style={{ borderLeftColor: event?.theme_color }}>
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Game Entries</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">{history.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Game History - Full Width */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r p-6 text-white" style={{ 
              background: `linear-gradient(135deg, ${event?.theme_color || '#6b46c1'}dd 0%, ${event?.theme_color || '#6b46c1'} 100%)`
            }}>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                📜 Full Game History
              </h2>
              <p className="text-sm opacity-90 mt-1">{history.length} entries • Most recent first</p>
            </div>
            
            <div className="p-6">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No game entries yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.map((h, idx) => (
                    <div 
                      key={h.id} 
                      className="history-item flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div 
                          className="inline-flex items-center px-2.5 py-0.5 text-sm font-medium rounded-full whitespace-nowrap"
                          style={{ backgroundColor: event?.theme_color + '15', color: event?.theme_color || '#6b46c1' }}
                        >
                          Game {h.game_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{h.team_name}</div>
                          {h.game_name && (
                            <div className="text-xs text-gray-500 truncate">{h.game_name}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 ml-4">
                        <div className={`text-right flex-1 ${
                          h.points > 0 ? 'text-green-600' : h.points < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          <div className="text-lg font-bold">
                            {h.points > 0 ? '+' : ''}{h.points}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 text-right whitespace-nowrap">
                          {formatTimeAgo(h.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>Last updated: {new Date(lastUpdate).toLocaleTimeString()} • Public access • Live updates via SSE</p>
        </div>
      </div>
    </div>
  );
}
