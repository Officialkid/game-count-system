import prisma from './prisma';
import { TokenType } from '@prisma/client';

export type CreateScoreInput = {
  eventId: string;
  teamId: string;
  day: number;
  points: number;
  penalty?: number;
  bonus?: number;
  notes?: string;
  category?: string;
  tokenType?: TokenType;
};

export async function ensureEventDay(eventId: string, dayNumber: number) {
  const existing = await prisma.eventDay.findFirst({
    where: {
      eventId,
      dayNumber,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.eventDay.create({
    data: {
      eventId,
      dayNumber,
      label: `Day ${dayNumber}`,
      isLocked: false,
    },
  });
}

export async function getEventDayInfo(eventId: string, dayNumber: number) {
  return prisma.eventDay.findFirst({
    where: {
      eventId,
      dayNumber,
    },
  });
}

export async function addScoreForEvent(input: CreateScoreInput) {
  const event = await prisma.event.findUnique({
    where: { id: input.eventId },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const team = await prisma.team.findFirst({
    where: {
      id: input.teamId,
      eventId: input.eventId,
    },
  });

  if (!team) {
    throw new Error('Team not found for this event');
  }

  const day = await ensureEventDay(input.eventId, input.day);

  if (day.isLocked) {
    throw new Error(`Day ${input.day} is locked`);
  }

  const score = await prisma.score.create({
    data: {
      eventId: input.eventId,
      teamId: input.teamId,
      eventDayId: day.id,
      category: input.category ?? 'Score',
      points: input.points,
      penalty: input.penalty,
      bonus: input.bonus,
      notes: input.notes,
      createdByTokenType: input.tokenType,
    },
  });

  return {
    id: score.id,
    eventId: score.eventId,
    teamId: score.teamId,
    day: input.day,
    points: score.points,
    penalty: score.penalty,
    bonus: score.bonus,
    notes: score.notes,
    created_at: score.createdAt.toISOString(),
  };
}

export async function addBulkScoresForEvent(input: {
  eventId: string;
  items: Array<{ team_id: string; points: number }>;
  category?: string;
  day?: number;
  tokenType?: TokenType;
}) {
  const dayNumber = input.day ?? 1;
  const day = await ensureEventDay(input.eventId, dayNumber);

  if (day.isLocked) {
    throw new Error(`Day ${dayNumber} is locked`);
  }

  const batch = await prisma.scoreBatch.create({
    data: {
      eventId: input.eventId,
      category: input.category ?? 'Bulk Entry',
      sourceType: 'bulk_entry',
      createdByTokenType: input.tokenType,
    },
  });

  const createdScores = await prisma.$transaction(
    input.items.map((item) =>
      prisma.score.create({
        data: {
          eventId: input.eventId,
          teamId: item.team_id,
          eventDayId: day.id,
          scoreBatchId: batch.id,
          category: input.category ?? 'Bulk Entry',
          points: item.points,
          sourceType: 'bulk_entry',
          createdByTokenType: input.tokenType,
        },
      })
    )
  );

  return createdScores.map((score) => ({
    id: score.id,
    eventId: score.eventId,
    teamId: score.teamId,
    points: score.points,
    created_at: score.createdAt.toISOString(),
  }));
}

export async function getScoreHistoryForEvent(eventId: string) {
  const scores = await prisma.score.findMany({
    where: { eventId },
    include: {
      team: true,
      eventDay: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return scores.map((score) => ({
    id: score.id,
    team_id: score.teamId,
    team_name: score.team.name,
    team_color: score.team.color,
    points: score.points,
    category: score.category,
    created_at: score.createdAt.toISOString(),
    updated_at: score.updatedAt.toISOString(),
    day_number: score.eventDay?.dayNumber,
    day_label: score.eventDay?.label ?? null,
  }));
}

export async function updateScoreForEvent(input: {
  scoreId: string;
  eventId: string;
  points: number;
  category?: string;
  tokenType?: TokenType;
}) {
  const score = await prisma.score.findFirst({
    where: {
      id: input.scoreId,
      eventId: input.eventId,
    },
    include: {
      team: true,
      eventDay: true,
    },
  });

  if (!score) {
    throw new Error('Score not found');
  }

  if (score.eventDay?.isLocked) {
    throw new Error(`Day ${score.eventDay.dayNumber} is locked`);
  }

  const updated = await prisma.score.update({
    where: { id: input.scoreId },
    data: {
      points: input.points,
      category: input.category ?? score.category,
      sourceType: 'correction',
      createdByTokenType: input.tokenType ?? score.createdByTokenType,
    },
    include: {
      team: true,
      eventDay: true,
    },
  });

  return {
    id: updated.id,
    team_id: updated.teamId,
    team_name: updated.team.name,
    team_color: updated.team.color,
    points: updated.points,
    category: updated.category,
    created_at: updated.createdAt.toISOString(),
    updated_at: updated.updatedAt.toISOString(),
    day_number: updated.eventDay?.dayNumber ?? null,
    day_label: updated.eventDay?.label ?? null,
  };
}

export async function deleteScoreForEvent(input: {
  scoreId: string;
  eventId: string;
}) {
  const score = await prisma.score.findFirst({
    where: {
      id: input.scoreId,
      eventId: input.eventId,
    },
    include: {
      eventDay: true,
    },
  });

  if (!score) {
    throw new Error('Score not found');
  }

  if (score.eventDay?.isLocked) {
    throw new Error(`Day ${score.eventDay.dayNumber} is locked`);
  }

  await prisma.score.delete({
    where: { id: input.scoreId },
  });

  return {
    id: score.id,
    team_id: score.teamId,
    points: score.points,
  };
}
