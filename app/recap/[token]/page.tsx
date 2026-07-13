import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Award, Calendar, Target, Trophy } from 'lucide-react';
import { getRecapEventByViewerToken } from '@/lib/server/event-lifecycle-service';
import { safeInitial } from '@/lib/safe-ui-helpers';

async function getEventResults(token: string) {
  return getRecapEventByViewerToken(token);
}

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return { title: 'Event Results - Game Count System', description: 'View event results and standings' };
  }

  const data = await getEventResults(params.token);
  if (!data) return { title: 'Event Results Not Found' };

  return {
    title: `${data.event.name} - Game Results`,
    description: `View final standings and results for ${data.event.name}`,
  };
}

export default async function RecapPage({ params }: { params: { token: string } }) {
  const data = await getEventResults(params.token);
  if (!data) notFound();

  const { event, teams, days, breakdown } = data;
  const teamsWithRank = [...teams].sort((a, b) => b.total_points - a.total_points).map((team, index) => ({ ...team, rank: index + 1 }));
  const topTeam = teamsWithRank[0];
  const hasMultipleDays = days.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl">Game Results</h1>
          <h2 className="mb-4 text-2xl font-semibold text-slate-700 dark:text-slate-300 md:text-3xl">{event.name}</h2>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>{new Date(event.start_at).toLocaleDateString()}</span></div>
            <div className="flex items-center gap-2"><Target className="h-4 w-4" /><span className="capitalize">{event.mode} Mode</span></div>
          </div>
        </div>

        {topTeam && (
          <div className="relative mb-12">
            <div className="relative overflow-hidden rounded-2xl p-8 shadow-2xl" style={{ background: `linear-gradient(135deg, ${topTeam.color}15 0%, ${topTeam.color}30 100%)`, borderLeft: `8px solid ${topTeam.color}` }}>
              <div className="absolute right-0 top-0 h-64 w-64 opacity-5"><Trophy className="h-full w-full" /></div>
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: topTeam.color }}><Award className="h-8 w-8 text-white" /></div>
                  <div><p className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Champion</p><h3 className="text-3xl font-bold text-slate-900 dark:text-white">{topTeam.name}</h3></div>
                </div>
                <div className="text-right"><p className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Points</p><p className="text-5xl font-bold" style={{ color: topTeam.color }}>{topTeam.total_points.toLocaleString()}</p></div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-12">
          <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white"><Trophy className="h-6 w-6 text-amber-500" />Final Standings</h3>
          <div className="overflow-hidden rounded-xl bg-white shadow-lg dark:bg-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50"><tr><th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Rank</th><th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Team</th><th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">Total Points</th></tr></thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {teamsWithRank.map((team) => (
                    <tr key={team.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="whitespace-nowrap px-6 py-4"><span className="text-lg font-bold text-slate-900 dark:text-white">#{team.rank}</span></td>
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full shadow-md" style={{ backgroundColor: team.color }}><span className="text-sm font-bold text-white">{safeInitial(team.name)}</span></div><span className="text-lg font-semibold text-slate-900 dark:text-white">{team.name}</span></div></td>
                      <td className="px-6 py-4 text-right"><span className="text-2xl font-bold" style={{ color: team.color }}>{team.total_points.toLocaleString()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {hasMultipleDays && (
          <div className="mb-12">
            <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white"><Calendar className="h-6 w-6 text-blue-500" />Daily Breakdown</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {days.map((day) => (
                <div key={day.day_number} className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                  <div className="mb-4 flex items-center justify-between"><div><p className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Day {day.day_number}</p><h4 className="text-xl font-bold text-slate-900 dark:text-white">{day.label}</h4></div>{day.is_locked && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Locked</span>}</div>
                  <div className="space-y-3">{breakdown[`day_${day.day_number}`]?.map((item, index) => (<div key={`${day.day_number}-${item.team_name}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50"><div className="flex items-center gap-3"><span className="text-sm font-semibold text-slate-500 dark:text-slate-400">#{index + 1}</span><span className="font-semibold text-slate-900 dark:text-white">{item.team_name}</span></div><span className="text-lg font-bold text-blue-600 dark:text-blue-300">{item.points.toLocaleString()} pts</span></div>))}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
