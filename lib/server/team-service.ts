import prisma from './prisma';

export type EventTeamSummary = {
  id: string;
  event_id: string;
  name: string;
  color: string;
  avatar_url: string | null;
  total_points: number;
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
  const teams = await prisma.team.findMany({
    where: { eventId },
    include: {
      scores: {
        select: {
          points: true,
          penalty: true,
          bonus: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return teams.map((team) => ({
    id: team.id,
    event_id: team.eventId,
    name: team.name,
    color: team.color,
    avatar_url: team.avatarUrl,
    total_points: team.scores.reduce((sum, score) => sum + calculateScoreValue(score), 0),
    created_at: team.createdAt.toISOString(),
    updated_at: team.updatedAt.toISOString(),
  }));
}

export async function getTeamForEvent(eventId: string, teamId: string) {
  return prisma.team.findFirst({
    where: {
      id: teamId,
      eventId,
    },
  });
}

export async function createTeamsForEvent(
  eventId: string,
  teams: Array<{ name: string; color?: string }>
) {
  if (teams.length === 0) {
    return [];
  }

  const created = await prisma.$transaction(
    teams.map((team) =>
      prisma.team.create({
        data: {
          eventId,
          name: team.name.trim(),
          color: team.color || '#3B82F6',
        },
      })
    )
  );

  return created.map((team) => ({
    id: team.id,
    event_id: team.eventId,
    name: team.name,
    color: team.color,
    avatar_url: team.avatarUrl,
    total_points: 0,
    created_at: team.createdAt.toISOString(),
    updated_at: team.updatedAt.toISOString(),
  }));
}
