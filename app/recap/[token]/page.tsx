import { notFound } from 'next/navigation';
import { Trophy, Calendar, Target, Award } from 'lucide-react';
import type { Metadata } from 'next';
import { safeInitial } from '@/lib/safe-ui-helpers';

type EventData = {
  success: boolean;
  data: {
    event: {
      id: string;
      name: string;
      mode: string;
      status: string;
      start_at: string;
      end_at: string | null;
    };
    days: Array<{
      day_number: number;
      label: string;
      is_locked: boolean;
    }>;
    teams: Array<{
      id: string;
      name: string;
      color: string;
      avatar_url: string | null;
      total_points: number;
    }>;
    breakdown: Record<
      string,
      Array<{
        team_name: string;
        points: number;
      }>
    >;
  };
};

async function getEventResults(token: string): Promise<EventData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://game-count-system.onrender.com';
    const res = await fetch(`${baseUrl}/events/${token}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch event results:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  // Skip metadata fetching during build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return {
      title: 'Event Results - Game Count System',
      description: 'View event results and standings',
    };
  }
  
  const data = await getEventResults(params.token);

  if (!data?.success) {
    return {
      title: 'Event Results Not Found',
    };
  }

  return {
    title: `${data.data.event.name} - Game Results`,
    description: `View final standings and results for ${data.data.event.name}`,
  };
}

export default async function RecapPage({
  params,
}: {
  params: { token: string };
}) {
  const data = await getEventResults(params.token);

  if (!data?.success || !data.data) {
    notFound();
  }

  const { event, teams, days, breakdown } = data.data;

  // Sort teams by total points (descending)
  const rankedTeams = [...teams].sort((a, b) => b.total_points - a.total_points);

  // Add rank to teams
  const teamsWithRank = rankedTeams.map((team, index) => ({
    ...team,
    rank: index + 1,
  }));

  const topTeam = teamsWithRank[0];
  const hasMultipleDays = days.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 mb-6 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">
            Game Results
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
            {event.name}
          </h2>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(event.start_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="capitalize">{event.mode} Mode</span>
            </div>
          </div>
        </div>

        {/* Champion Banner */}
        {topTeam && (
          <div className="mb-12 relative">
            <div
              className="rounded-2xl p-8 shadow-2xl relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${topTeam.color}15 0%, ${topTeam.color}30 100%)`,
                borderLeft: `8px solid ${topTeam.color}`,
              }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
                <Trophy className="w-full h-full" />
              </div>
              <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: topTeam.color }}
                  >
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      🏆 Champion
                    </p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {topTeam.name}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Total Points
                  </p>
                  <p className="text-5xl font-bold" style={{ color: topTeam.color }}>
                    {topTeam.total_points.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Standings */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-500" />
            Final Standings
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Total Points
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {teamsWithRank.map((team) => (
                    <tr
                      key={team.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {team.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                          {team.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                          {team.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            #{team.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                            style={{ backgroundColor: team.color }}
                          >
                            <span className="text-white font-bold text-sm">
                              {safeInitial(team.name)}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white text-lg">
                            {team.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-2xl font-bold" style={{ color: team.color }}>
                          {team.total_points.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Daily Breakdown */}
        {hasMultipleDays && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-500" />
              Daily Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {days.map((day) => (
                <div key={day.day_number} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">Day {day.day_number}</p>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">{day.label}</h4>
                    </div>
                    {day.is_locked && (
                      <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                        Locked
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {breakdown[`day_${day.day_number}`]?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">#{index + 1}</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{item.team_name}</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-300">{item.points.toLocaleString()} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points Breakdown */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-purple-500" />
            Points Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(breakdown).map(([dayKey, scores]) => (
              <div key={dayKey} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">{dayKey.replace('day_', 'Day ')}</p>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Top Scores</h4>
                  </div>
                </div>
                <div className="space-y-3">
                  {scores.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">#{index + 1}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{item.team_name}</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-300">{item.points.toLocaleString()} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Want your own event page?</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-6">Create, score, and share events with your team in minutes.</p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-amber-700 transition-colors"
          >
            Start an Event
          </a>
        </div>
      </div>
    </div>
  );
}