// components/event-tabs/TeamsTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { apiClient, auth } from '@/lib/api-client';
import { Card, CardContent, Avatar, Badge, Button, LoadingSkeleton, useToast } from '@/components/ui';
import { TeamCardSkeletonList } from '@/components/skeletons';
import { TeamCard } from '../ui/TeamCard';
import { getPaletteById } from '@/lib/color-palettes';

interface Team {
  id: string | number;
  team_name: string;
  avatar_url?: string | null;
  total_points?: number;
  total_score?: number;
  histories?: Array<{ game_name: string; game_number: number; points: number; created_at: string }>;
}

interface TeamsTabProps {
  eventId: string;
  event: any;
}

export function TeamsTab({ eventId, event }: TeamsTabProps) {
  const { showToast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState<string | number | null>(null);

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

      if (!response.ok) {
        throw new Error('Failed to load teams');
      }

      const data = await response.json();
      const teamsList = (data.teams || data.data?.teams || []) as Team[];
      
      // Sort teams: first by total points (descending), then alphabetically
      const sortedTeams = teamsList.sort((a, b) => {
        const pointsA = a.total_points ?? a.total_score ?? 0;
        const pointsB = b.total_points ?? b.total_score ?? 0;
        
        if (pointsA !== pointsB) {
          return pointsB - pointsA; // Descending by points
        }
        return a.team_name.localeCompare(b.team_name); // Alphabetical if equal
      });
      
      setTeams(sortedTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
      showToast('Failed to load teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { emoji: '🥇', color: 'bg-yellow-100 text-yellow-800', label: '1st' };
    if (index === 1) return { emoji: '🥈', color: 'bg-gray-100 text-gray-800', label: '2nd' };
    if (index === 2) return { emoji: '🥉', color: 'bg-orange-100 text-orange-800', label: '3rd' };
    return { emoji: '', color: 'bg-blue-100 text-blue-800', label: `${index + 1}th` };
  };

  const palette = getPaletteById(event.theme_color || 'purple') || getPaletteById('purple')!;

  if (loading) {
    return <TeamCardSkeletonList count={4} />;
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Teams Yet</h3>
          <p className="text-gray-600 mb-6">Add teams to start tracking scores!</p>
          <Button onClick={() => showToast('Add team functionality coming soon', 'info')}>
            + Add First Team
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Creative Layout */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">🏆 Team Rankings</h2>
            <p className="text-gray-500 mt-2">Live competitive rankings • Click to view history</p>
          </div>
          <Badge variant="info" className="px-4 py-2 text-base font-semibold">{teams.length} {teams.length === 1 ? 'team' : 'teams'}</Badge>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-4">
        {teams.map((team, index) => {
          const isExpanded = expandedTeam === team.id;
          const points = team.total_points ?? team.total_score ?? 0;

          return (
            <div key={team.id} className="space-y-3 animate-fade-in">
              {/* Team Card */}
              <Card
                className="transition-all duration-300 hover:shadow-2xl cursor-pointer hover:scale-101 border-0"
                onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                style={{
                  boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                  borderLeft: `5px solid ${palette.primary}`
                }}
              >
                <CardContent className="py-4">
                  <TeamCard
                    rank={index + 1}
                    name={team.team_name}
                    score={points}
                    avatarUrl={team.avatar_url}
                    highlight={isExpanded}
                    paletteColor={palette.primary}
                  />
                </CardContent>
              </Card>

              {/* Expanded History Section - Enhanced */}
              {isExpanded && team.histories && team.histories.length > 0 && (
                <Card className="ml-2 bg-gradient-to-br from-slate-50 to-slate-100 border-l-4" style={{ borderLeftColor: palette.accent }}>
                  <CardContent className="py-5">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-lg">📊</span> Scoring History
                    </h4>
                    <div className="space-y-3">
                      {team.histories.map((entry, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all">
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 text-sm">
                              {entry.game_name ? `🎮 ${entry.game_name}` : `Game ${entry.game_number}`}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className={`text-2xl font-black px-3 py-1 rounded-lg ${
                            entry.points >= 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {entry.points > 0 ? '+' : ''}{entry.points}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="mt-8 p-5 rounded-xl border-l-4 bg-gradient-to-r from-blue-50 to-indigo-50" style={{ borderLeftColor: palette.primary }}>
        <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
          <span className="text-lg">💡</span>
          <strong>Teams are sorted by total points.</strong> When points are equal, teams appear alphabetically. Click any team card to see detailed scoring history.
        </p>
      </div>
    </div>
  );
}
