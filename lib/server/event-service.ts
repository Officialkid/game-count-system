import { Prisma, TokenType } from '@prisma/client';
import prisma, { withDbRetry } from './prisma';
import { calculateAutoCleanupDate, calculateEndDate, getEventModeConfig, validateModeConstraints } from '@/lib/event-mode-helpers';
import { generateEventTokens, generateShareLink, hashToken } from '@/lib/token-utils';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CreateEventInput = {
  name: string;
  numberOfDays: number;
  scoringMode?: 'continuous' | 'daily';
  eventMode?: 'quick' | 'camp' | 'advanced';
  requiresAuthentication?: boolean;
  organizationId?: string;
  createdBy?: string;
  startAt?: Date;
  themeColor?: string;
  logoUrl?: string;
  dayLabels?: string[];
  showPublicActivity?: boolean;
};

export type EventDaySummary = {
  id: string;
  dayNumber: number;
  label: string;
  date: string | null;
  isLocked: boolean;
  lockedAt: string | null;
  carryOverFromPrevious: boolean;
};

export type EventAccessResult = {
  event: {
    id: string;
    name: string;
    eventMode: string;
    eventStatus: string;
    scoringMode: string;
    numberOfDays: number;
    activeDayNumber: number;
    showPublicActivity: boolean;
    isFinalized: boolean;
    startAt: string;
    endAt: string;
    themeColor: string | null;
    logoUrl: string | null;
    days: EventDaySummary[];
    adminToken?: string | null;
    scorerToken?: string | null;
    publicToken?: string | null;
  };
  tokenType: TokenType;
};

function buildDefaultDayLabel(dayNumber: number, date: Date): string {
  const weekday = WEEKDAY_SHORT[date.getDay()];
  return `Day ${dayNumber} · ${weekday}`;
}

export async function createEventWithTokens(input: CreateEventInput) {
  const eventMode = input.eventMode ?? (input.numberOfDays > 1 ? 'camp' : 'quick');
  const scoringMode = input.scoringMode ?? (input.numberOfDays > 1 ? 'daily' : 'continuous');
  const startAt = input.startAt ?? new Date();
  const modeConfig = getEventModeConfig(eventMode);
  const requiresAuthentication =
    input.requiresAuthentication ?? modeConfig.requiresAuth;

  const validation = validateModeConstraints(
    eventMode,
    input.numberOfDays,
    requiresAuthentication
  );

  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  const tokens = generateEventTokens();
  const endAt = calculateEndDate(eventMode, startAt, input.numberOfDays);
  const autoCleanupAt = calculateAutoCleanupDate(eventMode, startAt);

  const created = await withDbRetry(() =>
    prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          name: input.name.trim(),
          eventMode,
          eventStatus: 'active',
          scoringMode,
          numberOfDays: input.numberOfDays,
          activeDayNumber: 1,
          showPublicActivity: input.showPublicActivity ?? true,
          requiresAuthentication,
          legacyStatus: 'active',
          themeColor: input.themeColor,
          logoUrl: input.logoUrl,
          startAt,
          endAt,
          autoCleanupAt: autoCleanupAt ? new Date(autoCleanupAt) : null,
          createdBy: input.createdBy,
          organizationId: input.organizationId,
        },
      });

      await (tx.eventToken as any).createMany({
        data: [
          {
            eventId: event.id,
            tokenType: 'admin',
            tokenHash: tokens.hashed.admin_token_hash,
            plainToken: tokens.plain.admin_token,
          },
          {
            eventId: event.id,
            tokenType: 'scorer',
            tokenHash: tokens.hashed.scorer_token_hash,
            plainToken: tokens.plain.scorer_token,
          },
          {
            eventId: event.id,
            tokenType: 'viewer',
            tokenHash: tokens.hashed.public_token_hash,
            plainToken: tokens.plain.public_token,
          },
        ],
      });

      // Always create EventDay rows for every event (1-day or multi-day)
      const totalDays = Math.max(1, input.numberOfDays);
      await tx.eventDay.createMany({
        data: Array.from({ length: totalDays }, (_, index) => {
          const date = new Date(startAt);
          date.setDate(date.getDate() + index);
          const customLabel = input.dayLabels?.[index]?.trim();

          return {
            eventId: event.id,
            dayNumber: index + 1,
            label: customLabel || buildDefaultDayLabel(index + 1, date),
            date,
            isLocked: false,
            carryOverFromPrevious: true,
          };
        }),
      });

      return event;
    })
  );

  return {
    event: created,
    tokens: tokens.plain,
    modeInfo: {
      mode: eventMode,
      config: modeConfig,
      autoCleanup: Boolean(autoCleanupAt),
      maxDuration: modeConfig.maxDuration,
    },
  };
}

export async function getEventAccessByToken(token: string): Promise<EventAccessResult | null> {
  const tokenHash = hashToken(token);

  const access = await withDbRetry(() =>
    prisma.eventToken.findFirst({
      where: {
        tokenHash,
        isActive: true,
        revokedAt: null,
      },
      include: {
        event: {
          include: {
            tokens: true,
            eventDays: {
              orderBy: { dayNumber: 'asc' },
            },
          },
        },
      },
    })
  );

  if (!access) {
    return null;
  }

  const accessTokens = access.event.tokens as Array<{
    tokenType: TokenType;
    plainToken?: string | null;
  }>;

  const adminToken = accessTokens.find((item) => item.tokenType === 'admin')?.plainToken ?? null;
  const scorerToken = accessTokens.find((item) => item.tokenType === 'scorer')?.plainToken ?? null;
  const publicToken = accessTokens.find((item) => item.tokenType === 'viewer')?.plainToken ?? null;

  const days: EventDaySummary[] = access.event.eventDays.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    label: day.label || `Day ${day.dayNumber}`,
    date: day.date ? day.date.toISOString() : null,
    isLocked: day.isLocked,
    lockedAt: day.lockedAt ? day.lockedAt.toISOString() : null,
    carryOverFromPrevious: day.carryOverFromPrevious,
  }));

  return {
    event: {
      id: access.event.id,
      name: access.event.name,
      eventMode: access.event.eventMode,
      eventStatus: access.event.eventStatus,
      scoringMode: access.event.scoringMode,
      numberOfDays: access.event.numberOfDays,
      activeDayNumber: access.event.activeDayNumber,
      showPublicActivity: access.event.showPublicActivity,
      isFinalized: access.event.isFinalized,
      startAt: access.event.startAt.toISOString(),
      endAt: access.event.endAt.toISOString(),
      themeColor: access.event.themeColor,
      logoUrl: access.event.logoUrl,
      days,
      adminToken,
      scorerToken,
      publicToken,
    },
    tokenType: access.tokenType,
  };
}

export async function advanceEventDay(input: {
  eventId: string;
  targetDayNumber: number;
  carryOverFromPrevious: boolean;
  lockPreviousDay?: boolean;
  label?: string;
}) {
  return withDbRetry(() =>
    prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: input.eventId },
        include: { eventDays: { orderBy: { dayNumber: 'asc' } } },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.isFinalized || event.eventStatus === 'archived') {
        throw new Error('Cannot change days on a finalized or archived event');
      }

      const maxDay = Math.max(event.numberOfDays, input.targetDayNumber);

      // Lock previous day if requested
      if (input.lockPreviousDay && input.targetDayNumber > 1) {
        const prevDay = input.targetDayNumber - 1;
        await tx.eventDay.upsert({
          where: { eventId_dayNumber: { eventId: input.eventId, dayNumber: prevDay } },
          update: { isLocked: true, lockedAt: new Date() },
          create: {
            eventId: input.eventId,
            dayNumber: prevDay,
            label: `Day ${prevDay}`,
            isLocked: true,
            lockedAt: new Date(),
            carryOverFromPrevious: true,
          },
        });
      }

      // Ensure target day exists and record carryOverFromPrevious preference
      const targetDay = await tx.eventDay.upsert({
        where: {
          eventId_dayNumber: {
            eventId: input.eventId,
            dayNumber: input.targetDayNumber,
          },
        },
        update: {
          carryOverFromPrevious: input.carryOverFromPrevious,
          ...(input.label ? { label: input.label.trim() } : {}),
        },
        create: {
          eventId: input.eventId,
          dayNumber: input.targetDayNumber,
          label: input.label?.trim() || `Day ${input.targetDayNumber}`,
          isLocked: false,
          carryOverFromPrevious: input.carryOverFromPrevious,
        },
      });

      const updatedEvent = await tx.event.update({
        where: { id: input.eventId },
        data: {
          activeDayNumber: input.targetDayNumber,
          numberOfDays: maxDay,
          scoringMode: input.carryOverFromPrevious ? 'continuous' : 'daily',
        },
        include: {
          eventDays: { orderBy: { dayNumber: 'asc' } },
        },
      });

      return {
        event: updatedEvent,
        targetDay,
      };
    })
  );
}

export function buildEventShareLinks(
  eventId: string,
  plainTokens: {
    admin_token: string;
    scorer_token: string;
    public_token: string;
  },
  baseUrl: string
) {
  return {
    admin: generateShareLink(eventId, plainTokens.admin_token, 'admin', baseUrl),
    scorer: generateShareLink(eventId, plainTokens.scorer_token, 'scorer', baseUrl),
    viewer: generateShareLink(eventId, plainTokens.public_token, 'viewer', baseUrl),
  };
}

export async function createAuditLog(data: {
  eventId: string;
  action: Prisma.AuditLogUncheckedCreateInput['action'];
  entityType: string;
  entityId?: string;
  actorTokenType?: TokenType;
  payload?: Prisma.InputJsonValue;
}) {
  return withDbRetry(() =>
    prisma.auditLog.create({
      data: {
        eventId: data.eventId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        actorTokenType: data.actorTokenType,
        payload: data.payload,
      },
    })
  );
}

export async function getEventById(eventId: string) {
  return withDbRetry(() =>
    prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventDays: { orderBy: { dayNumber: 'asc' } },
        teams: {
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
        },
      },
    })
  );
}

export async function updateEventById(input: {
  eventId: string;
  name?: string;
  themeColor?: string;
  showPublicActivity?: boolean;
  activeDayNumber?: number;
}) {
  return withDbRetry(() =>
    prisma.event.update({
      where: { id: input.eventId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.themeColor !== undefined ? { themeColor: input.themeColor } : {}),
        ...(input.showPublicActivity !== undefined
          ? { showPublicActivity: input.showPublicActivity }
          : {}),
        ...(input.activeDayNumber !== undefined
          ? { activeDayNumber: input.activeDayNumber }
          : {}),
      },
    })
  );
}
