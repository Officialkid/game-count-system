import prisma, { withDbRetry } from './prisma';
import { ScoreSourceType, TokenType } from '@prisma/client';

export type CreateScoreInput = {
  eventId: string;
  teamId: string;
  day?: number;
  points: number;
  penalty?: number;
  bonus?: number;
  notes?: string;
  category?: string;
  submissionKey?: string;
  sourceType?: ScoreSourceType;
  tokenType?: TokenType;
};

export async function ensureEventDay(eventId: string, dayNumber: number) {
  const existing = await withDbRetry(() =>
    prisma.eventDay.findFirst({
      where: {
        eventId,
        dayNumber,
      },
    })
  );

  if (existing) {
    return existing;
  }

  return withDbRetry(() =>
    prisma.eventDay.create({
      data: {
        eventId,
        dayNumber,
        label: `Day ${dayNumber}`,
        isLocked: false,
        carryOverFromPrevious: true,
      },
    })
  );
}

export async function getEventDayInfo(eventId: string, dayNumber: number) {
  return withDbRetry(() =>
    prisma.eventDay.findFirst({
      where: {
        eventId,
        dayNumber,
      },
    })
  );
}

export async function addScoreForEvent(input: CreateScoreInput) {
  // Idempotency check for offline sync retries
  if (input.submissionKey) {
    const existing = await withDbRetry(() =>
      prisma.score.findUnique({
        where: { submissionKey: input.submissionKey },
        include: { eventDay: true },
      })
    );
    if (existing) {
      return {
        id: existing.id,
        eventId: existing.eventId,
        teamId: existing.teamId,
        day: existing.eventDay?.dayNumber ?? input.day ?? 1,
        points: existing.points,
        penalty: existing.penalty,
        bonus: existing.bonus,
        category: existing.category,
        notes: existing.notes,
        created_at: existing.createdAt.toISOString(),
        deduplicated: true,
      };
    }
  }

  const event = await withDbRetry(() =>
    prisma.event.findUnique({
      where: { id: input.eventId },
    })
  );

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.isFinalized || event.eventStatus !== 'active') {
    throw new Error('Event is not active');
  }

  const team = await withDbRetry(() =>
    prisma.team.findFirst({
      where: {
        id: input.teamId,
        eventId: input.eventId,
      },
    })
  );

  if (!team) {
    throw new Error('Team not found for this event');
  }

  const dayNumber = input.day ?? event.activeDayNumber ?? 1;
  const day = await ensureEventDay(input.eventId, dayNumber);

  if (day.isLocked) {
    throw new Error(`Day ${dayNumber} is locked`);
  }

  const score = await withDbRetry(() =>
    prisma.score.create({
      data: {
        eventId: input.eventId,
        teamId: input.teamId,
        eventDayId: day.id,
        category: input.category?.trim() || 'Score',
        points: input.points,
        penalty: input.penalty,
        bonus: input.bonus,
        notes: input.notes,
        submissionKey: input.submissionKey,
        sourceType: input.sourceType ?? 'manual',
        createdByTokenType: input.tokenType,
      },
    })
  );

  return {
    id: score.id,
    eventId: score.eventId,
    teamId: score.teamId,
    day: dayNumber,
    points: score.points,
    penalty: score.penalty,
    bonus: score.bonus,
    category: score.category,
    notes: score.notes,
    created_at: score.createdAt.toISOString(),
    deduplicated: false,
  };
}

export async function addBulkScoresForEvent(input: {
  eventId: string;
  items: Array<{ team_id: string; points: number; notes?: string }>;
  category?: string;
  day?: number;
  submissionKey?: string;
  sourceType?: ScoreSourceType;
  tokenType?: TokenType;
}) {
  // Idempotency check for offline bulk sync retries
  if (input.submissionKey) {
    const existingBatch = await withDbRetry(() =>
      prisma.scoreBatch.findUnique({
        where: { submissionKey: input.submissionKey },
        include: { scores: true },
      })
    );
    if (existingBatch) {
      return existingBatch.scores.map((score) => ({
        id: score.id,
        eventId: score.eventId,
        teamId: score.teamId,
        points: score.points,
        category: score.category,
        created_at: score.createdAt.toISOString(),
        deduplicated: true,
      }));
    }
  }

  const event = await withDbRetry(() =>
    prisma.event.findUnique({ where: { id: input.eventId } })
  );
  if (!event) {
    throw new Error('Event not found');
  }
  if (event.isFinalized || event.eventStatus !== 'active') {
    throw new Error('Event is not active');
  }

  const dayNumber = input.day ?? event.activeDayNumber ?? 1;
  const day = await ensureEventDay(input.eventId, dayNumber);

  if (day.isLocked) {
    throw new Error(`Day ${dayNumber} is locked`);
  }

  const categoryLabel = input.category?.trim() || 'Game Round';
  const sourceType = input.sourceType ?? 'bulk_entry';

  const batch = await withDbRetry(() =>
    prisma.scoreBatch.create({
      data: {
        eventId: input.eventId,
        category: categoryLabel,
        submissionKey: input.submissionKey,
        sourceType,
        createdByTokenType: input.tokenType,
      },
    })
  );

  const createdScores = await withDbRetry(() =>
    prisma.$transaction(
      input.items.map((item, index) =>
        prisma.score.create({
          data: {
            eventId: input.eventId,
            teamId: item.team_id,
            eventDayId: day.id,
            scoreBatchId: batch.id,
            category: categoryLabel,
            points: item.points,
            notes: item.notes,
            submissionKey: input.submissionKey
              ? `${input.submissionKey}:${index}:${item.team_id}`
              : undefined,
            sourceType,
            createdByTokenType: input.tokenType,
          },
        })
      )
    )
  );

  return createdScores.map((score) => ({
    id: score.id,
    eventId: score.eventId,
    teamId: score.teamId,
    points: score.points,
    category: score.category,
    created_at: score.createdAt.toISOString(),
    deduplicated: false,
  }));
}

export async function getScoreHistoryForEvent(eventId: string) {
  const scores = await withDbRetry(() =>
    prisma.score.findMany({
      where: { eventId },
      include: {
        team: true,
        eventDay: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  );

  return scores.map((score) => ({
    id: score.id,
    team_id: score.teamId,
    team_name: score.team.name,
    team_color: score.team.color,
    points: score.points,
    category: score.category,
    notes: score.notes,
    source_type: score.sourceType,
    created_at: score.createdAt.toISOString(),
    updated_at: score.updatedAt.toISOString(),
    day_number: score.eventDay?.dayNumber ?? 1,
    day_label: score.eventDay?.label ?? 'Day 1',
    day_locked: score.eventDay?.isLocked ?? false,
  }));
}

export async function updateScoreForEvent(input: {
  scoreId: string;
  eventId: string;
  points: number;
  category?: string;
  tokenType?: TokenType;
}) {
  const score = await withDbRetry(() =>
    prisma.score.findFirst({
      where: {
        id: input.scoreId,
        eventId: input.eventId,
      },
      include: {
        team: true,
        eventDay: true,
      },
    })
  );

  if (!score) {
    throw new Error('Score not found');
  }

  if (score.eventDay?.isLocked) {
    throw new Error(`Day ${score.eventDay.dayNumber} is locked`);
  }

  const updated = await withDbRetry(() =>
    prisma.score.update({
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
    })
  );

  return {
    id: updated.id,
    team_id: updated.teamId,
    team_name: updated.team.name,
    team_color: updated.team.color,
    points: updated.points,
    category: updated.category,
    created_at: updated.createdAt.toISOString(),
    updated_at: updated.updatedAt.toISOString(),
    day_number: updated.eventDay?.dayNumber ?? 1,
    day_label: updated.eventDay?.label ?? 'Day 1',
    day_locked: updated.eventDay?.isLocked ?? false,
  };
}

export async function deleteScoreForEvent(input: {
  scoreId: string;
  eventId: string;
}) {
  const score = await withDbRetry(() =>
    prisma.score.findFirst({
      where: {
        id: input.scoreId,
        eventId: input.eventId,
      },
      include: {
        eventDay: true,
      },
    })
  );

  if (!score) {
    throw new Error('Score not found');
  }

  if (score.eventDay?.isLocked) {
    throw new Error(`Day ${score.eventDay.dayNumber} is locked`);
  }

  await withDbRetry(() =>
    prisma.score.delete({
      where: { id: input.scoreId },
    })
  );

  return {
    id: score.id,
    team_id: score.teamId,
    points: score.points,
  };
}
