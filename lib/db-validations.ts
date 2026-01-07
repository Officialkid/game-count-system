/**
 * Input Validation Schemas
 * Zod schemas for all database operations
 */

import { z } from 'zod';

// Event schemas
export const CreateEventSchema = z.object({
  name: z.string().min(1).max(200),
  mode: z.enum(['quick', 'camp', 'advanced']),
  start_at: z.string().datetime().or(z.date()),
  end_at: z.string().datetime().or(z.date()).nullable().optional(),
  retention_policy: z.enum(['auto_expire', 'manual', 'archive']),
  expires_at: z.string().datetime().or(z.date()).nullable().optional(),
});

export const UpdateEventSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['active', 'completed', 'expired', 'archived']).optional(),
  end_at: z.string().datetime().or(z.date()).nullable().optional(),
});

// Event day schemas
export const CreateEventDaySchema = z.object({
  event_id: z.string().uuid(),
  day_number: z.number().int().positive(),
  label: z.string().max(100).nullable().optional(),
});

export const LockEventDaySchema = z.object({
  day_id: z.string().uuid(),
  is_locked: z.boolean(),
});

// Team schemas
export const CreateTeamSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().max(20).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});

export const UpdateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().max(20).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});

// Score schemas
export const CreateScoreSchema = z.object({
  event_id: z.string().uuid(),
  day_id: z.string().uuid().nullable().optional(),
  team_id: z.string().uuid(),
  category: z.string().min(1).max(100),
  points: z.number().int().min(0),
});

// Token validation
export const TokenSchema = z.string().min(32).max(128);

// Query parameters
export const EventIdSchema = z.string().uuid();
export const TeamIdSchema = z.string().uuid();
export const DayIdSchema = z.string().uuid();

// Type exports
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type CreateEventDayInput = z.infer<typeof CreateEventDaySchema>;
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>;
export type CreateScoreInput = z.infer<typeof CreateScoreSchema>;
