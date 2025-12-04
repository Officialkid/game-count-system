// components/AnalyticsDashboard.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { Card, Button } from '@/components';

interface TeamScore {
  team_id: string;
  team_name: string;
  game_number: number;
  points: number;
  cumulative_points: number;
}

interface AnalyticsDashboardProps {
  eventId: string;
  eventName: string;
  teams: Array<{ id: string; team_name: string; total_points: number; avatar_url?: string }>;
  scores: TeamScore[];
}

const COLORS = ['#6b46c1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export function AnalyticsDashboard({ eventId, eventName, teams, scores }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month'>('all');
  const [viewMode, setViewMode] = useState<'cumulative' | 'per-game'>('cumulative');

  // FIXED: Wrap expensive calculations in useMemo
  // Prepare data for cumulative line chart
  const cumulativeData = useMemo(() => {
    const gameNumbers = [...new Set(scores.map(s => s.game_number))].sort((a, b) => a - b);
    
    return gameNumbers.map(gameNum => {
      const dataPoint: any = { game: `Game ${gameNum}` };
      
      teams.forEach(team => {
        const teamScores = scores
          .filter(s => s.team_id === team.id && s.game_number <= gameNum)
          .reduce((sum, s) => sum + s.points, 0);
        dataPoint[team.team_name] = teamScores;
      });
      
      return dataPoint;
    });
  }, [scores, teams]);

  // Prepare data for per-game bar chart
  const perGameData = useMemo(() => {
    const gameNumbers = [...new Set(scores.map(s => s.game_number))].sort((a, b) => a - b);
    
    return gameNumbers.map(gameNum => {
      const dataPoint: any = { game: `Game ${gameNum}` };
      
      teams.forEach(team => {
        const gameScore = scores.find(s => s.team_id === team.id && s.game_number === gameNum);
        dataPoint[team.team_name] = gameScore?.points || 0;
      });
      
      return dataPoint;
    });
  }, [scores, teams]);

  // Prepare data for team distribution pie chart
  const pieData = useMemo(() => 
    teams.map(team => ({
      name: team.team_name,
      value: team.total_points,
    })).filter(t => t.value > 0),
  [teams]);

  // Calculate statistics
  const stats = useMemo(() => ({
    totalGames: [...new Set(scores.map(s => s.game_number))].length,
    totalPoints: scores.reduce((sum, s) => sum + s.points, 0),
    avgPointsPerGame: scores.length > 0 ? (scores.reduce((sum, s) => sum + s.points, 0) / scores.length).toFixed(1) : 0,
    // FIXED: Use reduce instead of spread operator for large arrays
    highestScore: scores.length > 0 ? scores.reduce((max, s) => Math.max(max, s.points), -Infinity) : 0,
    lowestScore: scores.length > 0 ? scores.reduce((min, s) => Math.min(min, s.points), Infinity) : 0,
  }), [scores]);

  const exportToCSV = () => {
    // FIXED: Guard DOM access for SSR
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    
    const csvContent = [
      ['Game Number', 'Team', 'Points', 'Cumulative Points'],
      ...scores.map(s => [s.game_number, s.team_name, s.points, s.cumulative_points]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventName}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} aria-label="Export data to CSV">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Games</p>
            <p className="text-3xl font-bold text-primary-600">{stats.totalGames}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Points</p>
            <p className="text-3xl font-bold text-green-600">{stats.totalPoints}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Avg Points/Game</p>
            <p className="text-3xl font-bold text-blue-600">{stats.avgPointsPerGame}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Highest Score</p>
            <p className="text-3xl font-bold text-amber-600">{stats.highestScore}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Lowest Score</p>
            <p className="text-3xl font-bold text-red-600">{stats.lowestScore}</p>
          </div>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cumulative'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="View cumulative scores"
            >
              Cumulative
            </button>
            <button
              onClick={() => setViewMode('per-game')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'per-game'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label="View per-game scores"
            >
              Per Game
            </button>
          </div>
        </div>
      </Card>

      {/* Line Chart - Cumulative Scores */}
      {viewMode === 'cumulative' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Score Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="game" />
              <YAxis />
              <Tooltip />
              <Legend />
              {teams.map((team, index) => (
                <Line
                  key={team.id}
                  type="monotone"
                  dataKey={team.team_name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Bar Chart - Per Game Scores */}
      {viewMode === 'per-game' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Per Game Scores</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={perGameData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="game" />
              <YAxis />
              <Tooltip />
              <Legend />
              {teams.map((team, index) => (
                <Bar
                  key={team.id}
                  dataKey={team.team_name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Pie Chart - Point Distribution */}
      {pieData.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Point Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Team Comparison Table */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Rank</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Team</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Total Points</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Games Played</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-900">Avg Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teams
                .sort((a, b) => b.total_points - a.total_points)
                .map((team, index) => {
                  const teamScores = scores.filter(s => s.team_id === team.id);
                  const avgPoints = teamScores.length > 0
                    ? (teamScores.reduce((sum, s) => sum + s.points, 0) / teamScores.length).toFixed(1)
                    : 0;

                  return (
                    <tr key={team.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">#{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{team.team_name}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-primary-600">
                        {team.total_points}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{teamScores.length}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{avgPoints}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
