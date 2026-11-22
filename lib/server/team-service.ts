import prisma, { withDbRetry } from './prisma';

const CURATED_TEAM_COLORS = [
  '#2563EB', // Royal Blue
  '#DC2626', // Crimson Red
  '#16A34A', // Emerald Green
  '#D97706', // Amber Gold
  '#9333EA', // Vivid Purple
  '#0891B2', // Ocean Cyan
  '#EA580C', // Burnt Orange
  '#DB2777', // Magenta Pink
  '#4F46E5', // Indigo
  '#0D9488', // Teal
];

export type EventTeamSummary = {
  id: string;
  event_id: string;
  name: string;
  color: string;
  avatar_url: string | null;
  total_points: number;
  day_totals: Record<number, number>;
  created_at: string;
  updated_at: string;
};

function calculateScoreValue(score: {
  points: number;
  penalty: number | null;
  bonus: number | null;
}) {
  return score.points + (score.bonus ?? 0) - (score.penalty ?? 0);
}

export async function getTeamsForEvent(eventId: string): Promise<EventTeamSummary[]> {
  const teams = await withDbRetry(() =>
    prisma.team.findMany({
      where: { eventId },
      include: {
        scores: {
          select: {
            points: true,
            penalty: true,
            bonus: true,
            eventDay: {
              select: {
                dayNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  );

  return teams.map((team) => {
    const dayTotals: Record<number, number> = {};
    let totalPoints = 0;

    for (const score of team.scores) {
      const value = calculateScoreValue(score);
      totalPoints += value;
      const dayNum = score.eventDay?.dayNumber ?? 1;
      dayTotals[dayNum] = (dayTotals[dayNum] ?? 0) + value;
    }

    return {
      id: team.id,
      event_id: team.eventId,
      name: team.name,
      color: team.color,
      avatar_url: team.avatarUrl,
      total_points: totalPoints,
      day_totals: dayTotals,
      created_at: team.createdAt.toISOString(),
      updated_at: team.updatedAt.toISOString(),
    };
  });
}

export async function getTeamForEvent(eventId: string, teamId: string) {
  return withDbRetry(() =>
    prisma.team.findFirst({
      where: {
        id: teamId,
        eventId,
      },
    })
  );
}

export async function createTeamsForEvent(
  eventId: string,
  teams: Array<{ name: string; color?: string }>
) {
  if (teams.length === 0) {
    return [];
  }

  const existingCount = await withDbRetry(() =>
    prisma.team.count({ where: { eventId } })
  );

  const created = await withDbRetry(() =>
    prisma.$transaction(
      teams.map((team, idx) =>
        prisma.team.create({
          data: {
            eventId,
            name: team.name.trim(),
            color:
              team.color && team.color.trim()
                ? team.color.trim()
                : CURATED_TEAM_COLORS[(existingCount + idx) % CURATED_TEAM_COLORS.length],
          },
        })
      )
    )
  );

  return created.map((team) => ({
    id: team.id,
    event_id: team.eventId,
    name: team.name,
    color: team.color,
    avatar_url: team.avatarUrl,
    total_points: 0,
    day_totals: {},
    created_at: team.createdAt.toISOString(),
    updated_at: team.updatedAt.toISOString(),
  }));
}
