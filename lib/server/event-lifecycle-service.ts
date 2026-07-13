import prisma from './prisma';
import { TokenType } from '@prisma/client';
import { hashToken } from '@/lib/token-utils';

export async function finalizeEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.eventStatus === 'archived') {
    throw new Error('Event archived');
  }

  if (event.isFinalized) {
    throw new Error('Event already finalized');
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      isFinalized: true,
      finalizedAt: new Date(),
      eventStatus: 'completed',
    },
  });

  return updated;
}

export async function unfinalizeEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      isFinalized: false,
      finalizedAt: null,
      eventStatus: 'active',
    },
  });

  return updated;
}

export async function getPastEventsForAdminToken(adminToken: string) {
  const tokenHash = hashToken(adminToken);

  const adminAccess = await prisma.eventToken.findMany({
    where: {
      tokenType: 'admin',
      tokenHash,
      isActive: true,
      revokedAt: null,
    },
    include: {
      event: {
        include: {
          teams: true,
          tokens: true,
        },
      },
    },
  });

  return adminAccess
    .map((entry) => {
      const publicToken = entry.event.tokens.find((token) => token.tokenType === 'viewer')?.plainToken ?? null;

      return {
        id: entry.event.id,
        name: entry.event.name,
        mode: entry.event.eventMode,
        status: entry.event.eventStatus,
        is_finalized: entry.event.isFinalized,
        finalized_at: entry.event.finalizedAt?.toISOString() ?? null,
        created_at: entry.event.createdAt.toISOString(),
        number_of_days: entry.event.numberOfDays,
        team_count: entry.event.teams.length,
        public_token: publicToken,
      };
    })
    .filter((event) => event.is_finalized || event.status === 'archived')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getPublicEventByToken(token: string) {
  const tokenHash = hashToken(token);

  return prisma.eventToken.findFirst({
    where: {
      tokenType: 'viewer',
      tokenHash,
      isActive: true,
      revokedAt: null,
    },
    include: {
      event: {
        include: {
          teams: {
            include: {
              scores: {
                include: {
                  eventDay: true,
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { name: 'asc' },
          },
          eventDays: {
            orderBy: { dayNumber: 'asc' },
          },
        },
      },
    },
  });
}

export function calculateTeamTotal(scores: Array<{
  points: number;
  penalty: number | null;
  bonus: number | null;
}>) {
  return scores.reduce((sum, score) => {
    return sum + score.points + (score.bonus ?? 0) - (score.penalty ?? 0);
  }, 0);
}

export async function archiveEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.eventStatus === 'archived') {
    throw new Error('Event already archived');
  }

  return prisma.event.update({
    where: { id: eventId },
    data: {
      eventStatus: 'archived',
      legacyStatus: 'expired',
      archivedAt: new Date(),
    },
  });
}

export async function updateEventStatus(eventId: string, status: 'draft' | 'active' | 'completed' | 'archived') {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  return prisma.event.update({
    where: { id: eventId },
    data: {
      eventStatus: status,
      isFinalized: status === 'completed' ? true : event.isFinalized,
      finalizedAt: status === 'completed' && !event.finalizedAt ? new Date() : event.finalizedAt,
      archivedAt: status === 'archived' ? new Date() : event.archivedAt,
      legacyStatus:
        status === 'archived' ? 'expired' :
        status === 'completed' ? 'finalized' :
        status,
    },
  });
}

export async function getEventStatusInfo(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return null;
  }

  return {
    currentStatus: event.eventStatus,
    eventMode: event.eventMode,
    isFinalized: event.isFinalized,
  };
}

export async function setDayLockStatus(eventId: string, dayNumber: number, action: 'lock' | 'unlock') {
  const day = await prisma.eventDay.findFirst({
    where: {
      eventId,
      dayNumber,
    },
  });

  if (!day) {
    throw new Error('Day not found');
  }

  return prisma.eventDay.update({
    where: { id: day.id },
    data: {
      isLocked: action === 'lock',
      lockedAt: action === 'lock' ? new Date() : null,
    },
  });
}

export async function getDayLockStatus(eventId: string, dayNumber: number) {
  return prisma.eventDay.findFirst({
    where: {
      eventId,
      dayNumber,
    },
  });
}

export async function exportEventAsCsvData(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      teams: {
        include: {
          scores: {
            include: {
              eventDay: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      },
      eventDays: {
        orderBy: {
          dayNumber: 'asc',
        },
      },
    },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const teams = event.teams
    .map((team) => ({
      id: team.id,
      name: team.name,
      total_points: calculateTeamTotal(team.scores),
    }))
    .sort((a, b) => b.total_points - a.total_points);

  const scores = event.teams
    .flatMap((team) =>
      team.scores.map((score) => ({
        id: score.id,
        team_id: team.id,
        team_name: team.name,
        day_number: score.eventDay?.dayNumber ?? 1,
        category: score.category ?? 'Score',
        points: score.points,
        created_at: score.createdAt.toISOString(),
      }))
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return {
    event,
    teams,
    scores,
    days: event.eventDays.map((day) => day.dayNumber),
  };
}

export async function getRecapEventByViewerToken(token: string) {
  const access = await getPublicEventByToken(token);

  if (!access) {
    return null;
  }

  const event = access.event;
  const teams = event.teams.map((team) => ({
    id: team.id,
    name: team.name,
    color: team.color,
    avatar_url: team.avatarUrl,
    total_points: calculateTeamTotal(team.scores),
  }));

  const days = event.eventDays.map((day) => ({
    day_number: day.dayNumber,
    label: day.label || `Day ${day.dayNumber}`,
    is_locked: day.isLocked,
  }));

  const breakdown = Object.fromEntries(
    days.map((day) => {
      const ranked = event.teams
        .map((team) => {
          const dayScores = team.scores.filter((score) => score.eventDay?.dayNumber === day.day_number);
          const points = calculateTeamTotal(dayScores);
          return {
            team_name: team.name,
            points,
          };
        })
        .sort((a, b) => b.points - a.points);

      return [`day_${day.day_number}`, ranked];
    })
  );

  return {
    event: {
      id: event.id,
      name: event.name,
      mode: event.eventMode,
      status: event.eventStatus,
      start_at: event.startAt.toISOString(),
      end_at: event.endAt?.toISOString() ?? null,
    },
    days,
    teams,
    breakdown,
  };
}

export async function cleanupExpiredQuickEvents() {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      eventMode: 'quick',
      autoCleanupAt: {
        lte: now,
      },
      eventStatus: {
        not: 'archived',
      },
    },
    orderBy: {
      autoCleanupAt: 'asc',
    },
  });

  const results = {
    checked: events.length,
    deleted: 0,
    failed: 0,
    events: [] as Array<{
      id: string;
      name: string;
      mode: string;
      deleted: boolean;
      reason?: string;
    }>,
  };

  for (const event of events) {
    try {
      await prisma.event.delete({
        where: { id: event.id },
      });

      results.deleted++;
      results.events.push({
        id: event.id,
        name: event.name,
        mode: event.eventMode,
        deleted: true,
      });
    } catch (error) {
      results.failed++;
      results.events.push({
        id: event.id,
        name: event.name,
        mode: event.eventMode,
        deleted: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}
