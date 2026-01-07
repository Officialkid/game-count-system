'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useEventStream } from '@/hooks/useEventStream';
import { Badge, LoadingSkeleton } from '@/components/ui';
import Link from 'next/link';

interface Team {
  id: number;
  team_name: string;
  avatar_url: string | null;
  total_points: number;
  previousRank?: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [live, setLive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [rankChanges, setRankChanges] = useState<RankChange[]>([]);
  const prevTeamsRef = useRef<Map<number, number>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [reloadCounter, setReloadCounter] = useState(0);

  // Auto-refresh every 5-8 seconds
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setError('');
        // Quick token verify
        const v = await fetch(`/api/public/verify/${token}`);
        if (v.status === 404) {
          if (mounted) { setInvalid('Invalid or expired link'); setLoading(false); }
          return;
        }
        if (!v.ok && v.status >= 500) {
          if (mounted) { setError('Server error verifying link. Please try again later.'); setLoading(false); }
          return;
        }
        // Fetch unified public data
        const res = await fetch(`/api/public/scoreboard/${token}`);
        if (!res.ok) {
          if (res.status >= 500) {
            throw new Error('Server error');
          }
          throw new Error('Failed to load');
        }
        const payload = await res.json();
        const data = payload?.data ?? payload;
        if (!mounted) return;
        
        setEvent(data.event || null);
        const newTeams = data.teams || [];
        
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
        if (mounted) {
          const msg = e?.message === 'Server error' ? 'Server error. Please try again later.' : 'Network error. Please check your connection and retry.';
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 6000); // 6 second refresh
    return () => { mounted = false; clearInterval(id); };
  }, [token, reloadCounter]);

  // Live updates via SSE when we know the eventId (from public API)
  const eventStream = useEventStream(event?.id ? String(event.id) : '', !!event?.id);
  const connectionStatus = eventStream?.status ?? 'idle';
  const statusBadge = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return { label: 'Live', variant: 'success', dot: 'bg-green-600' } as const;
      case 'connecting':
        return { label: 'Connecting', variant: 'info', dot: 'bg-blue-600' } as const;
      case 'error':
        return { label: 'Reconnecting...', variant: 'warning', dot: 'bg-yellow-500' } as const;
      case 'disconnected':
        return { label: 'Disconnected', variant: 'default', dot: 'bg-gray-400' } as const;
      default:
        return { label: 'Standby', variant: 'default', dot: 'bg-gray-400' } as const;
    }
  }, [connectionStatus]);
  
  useEffect(() => {
    if (!eventStream) return;
    setLive(eventStream.isConnected);
    if (eventStream.lastUpdate?.type === 'score_added') {
      // Minimal refetch to update leaderboard and history
      (async () => {
        try {
          const res = await fetch(`/api/public/scoreboard/${token}`);
          if (!res.ok) return;
          const payload = await res.json();
          const data = payload?.data ?? payload;
          const newTeams = data.teams || [];
          
          // Track rank changes
          const changes: RankChange[] = [];
          newTeams.forEach((team: Team, newRank: number) => {
            const oldRank = prevTeamsRef.current.get(team.id);
            if (oldRank !== undefined && oldRank !== newRank) {
              changes.push({ teamId: team.id, oldRank, newRank });
            }
          });
          
          if (changes.length > 0) {
            setRankChanges(changes);
            setTimeout(() => setRankChanges([]), 1000);
          }
          
          const newMap = new Map<number, number>();
          newTeams.forEach((team: Team, idx: number) => {
            newMap.set(team.id, idx);
          });
          prevTeamsRef.current = newMap;
          
          setTeams(newTeams);
          setHistory((data.scores || data.history) || []);
          setLastUpdate(Date.now());
        } catch {}
      })();
    }
  }, [eventStream?.isConnected, eventStream?.lastUpdate, token]);

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

  if (invalid) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">{invalid}</p>
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
                        connectionStatus === 'connected' ? 'animate-pulse' : ''
                      }`}
                    ></span>
                    {statusBadge.label}
                  </Badge>
                  <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    {live ? 'Live events enabled' : 'Fallback: refresh every 6s'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard - Main Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r p-6 text-white" style={{ 
                background: `linear-gradient(135deg, ${event?.theme_color || '#6b46c1'}dd 0%, ${event?.theme_color || '#6b46c1'} 100%)`
              }}>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  🏆 Team Leaderboard
                </h2>
                <p className="text-sm opacity-90 mt-1">Ranked by total points • Updated live</p>
              </div>
              
              <div className="p-6 space-y-3">
                {sortedTeams.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Waiting for teams to join...</p>
                  </div>
                ) : (
                  sortedTeams.map((team, idx) => {
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
                                    {team.team_name.charAt(0).toUpperCase()}
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
