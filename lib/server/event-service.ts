import { Prisma, TokenType } from '@prisma/client';
import prisma from './prisma';
import { calculateAutoCleanupDate, calculateEndDate, getEventModeConfig, validateModeConstraints } from '@/lib/event-mode-helpers';
import { generateEventTokens, generateShareLink, hashToken } from '@/lib/token-utils';

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
};

export type EventAccessResult = {
  event: {
    id: string;
    name: string;
    eventMode: string;
    eventStatus: string;
    scoringMode: string;
    numberOfDays: number;
    isFinalized: boolean;
    startAt: string;
    endAt: string;
    themeColor: string | null;
    logoUrl: string | null;
    adminToken?: string | null;
    scorerToken?: string | null;
    publicToken?: string | null;
  };
  tokenType: TokenType;
};

export async function createEventWithTokens(input: CreateEventInput) {
  const eventMode = input.eventMode ?? 'quick';
  const scoringMode = input.scoringMode ?? 'continuous';
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

  const created = await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        name: input.name.trim(),
        eventMode,
        eventStatus: 'active',
        scoringMode,
        numberOfDays: input.numberOfDays,
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

    if (scoringMode === 'daily') {
      await tx.eventDay.createMany({
        data: Array.from({ length: input.numberOfDays }, (_, index) => {
          const date = new Date(startAt);
          date.setDate(date.getDate() + index);

          return {
            eventId: event.id,
            dayNumber: index + 1,
            label: `Day ${index + 1}`,
            date,
            isLocked: false,
          };
        }),
      });
    }

    return event;
  });

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

  const access = await prisma.eventToken.findFirst({
    where: {
      tokenHash,
      isActive: true,
      revokedAt: null,
    },
    include: {
      event: {
        include: {
          tokens: true,
        },
      },
    },
  });

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

  return {
    event: {
      id: access.event.id,
      name: access.event.name,
      eventMode: access.event.eventMode,
      eventStatus: access.event.eventStatus,
      scoringMode: access.event.scoringMode,
      numberOfDays: access.event.numberOfDays,
      isFinalized: access.event.isFinalized,
      startAt: access.event.startAt.toISOString(),
      endAt: access.event.endAt.toISOString(),
      themeColor: access.event.themeColor,
      logoUrl: access.event.logoUrl,
      adminToken,
      scorerToken,
      publicToken,
    },
    tokenType: access.tokenType,
  };
}

export function buildEventShareLinks(eventId: string, plainTokens: {
  admin_token: string;
  scorer_token: string;
  public_token: string;
}, baseUrl: string) {
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
  return prisma.auditLog.create({
    data: {
      eventId: data.eventId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      actorTokenType: data.actorTokenType,
      payload: data.payload,
    },
  });
}

export async function getEventById(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
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
  });
}

export async function updateEventById(input: {
  eventId: string;
  name?: string;
  themeColor?: string;
}) {
  return prisma.event.update({
    where: { id: input.eventId },
    data: {
      name: input.name?.trim(),
      themeColor: input.themeColor,
    },
  });
}
