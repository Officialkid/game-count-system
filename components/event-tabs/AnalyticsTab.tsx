// components/event-tabs/AnalyticsTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { auth } from '@/lib/api-client';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  calculateTeamPerformance,
  calculateScoreDistribution,
  calculateGameProgress,
  calculateWinProbabilities,
  getInsights,
  type TeamPerformance,
} from '@/lib/analytics';

interface Team {
  team_name: string;
  total_points: number;
}

interface GameScore {
  id: number;
  game_number: number;
  points: number;
  team_name: string;
  created_at: string;
}

interface AnalyticsTabProps {
  eventId: string;
}

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export function AnalyticsTab({ eventId }: AnalyticsTabProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [performances, setPerformances] = useState<TeamPerformance[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [eventId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = auth.getToken();

      // Fetch teams
      const teamsResponse = await fetch(`/api/events/${eventId}/teams`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const teamsData = await teamsResponse.json();

      // Fetch game history
      const historyResponse = await fetch(`/api/events/${eventId}/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const historyData = await historyResponse.json();

      const teamsList = teamsData.teams || [];
      const scoresList = historyData.scores || [];

      setTeams(teamsList);
      setScores(scoresList);
      setPerformances(calculateTeamPerformance(teamsList, scoresList));
    } catch (error) {
      console.error('Error loading analytics:', error);
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (teams.length === 0 || scores.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Data Yet
          </h3>
          <p className="text-gray-600">
            Analytics will appear once games have been played
          </p>
        </CardContent>
      </Card>
    );
  }

  const scoreDistribution = calculateScoreDistribution(scores);
  const gameProgress = calculateGameProgress(teams, scores);
  const winProbabilities = calculateWinProbabilities(teams, scores);
  const insights = getInsights(teams, scores);

  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💡 Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm"
                >
                  {insight}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Team
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Games
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Avg
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    High
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Low
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {performances.map((perf, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {perf.teamName}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {perf.totalPoints}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {perf.gamesPlayed}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {perf.averageScore.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {perf.highestScore}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {perf.lowestScore}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {perf.trend === 'improving' && (
                        <Badge variant="success">📈 Up</Badge>
                      )}
                      {perf.trend === 'declining' && (
                        <Badge variant="error">📉 Down</Badge>
                      )}
                      {perf.trend === 'stable' && (
                        <Badge variant="default">➡️ Stable</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Game Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Score Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gameProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="gameNumber"
                label={{ value: 'Game Number', position: 'insideBottom', offset: -5 }}
              />
              <YAxis label={{ value: 'Total Points', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {teams.map((team, index) => (
                <Line
                  key={team.team_name}
                  type="monotone"
                  dataKey={team.team_name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win Probabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Win Probability</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={winProbabilities}
                  dataKey="winProbability"
                  nameKey="teamName"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(props: any) =>
                    `${props.name}: ${Number(props.value).toFixed(1)}%`
                  }
                >
                  {winProbabilities.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
