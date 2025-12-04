// lib/validations.ts
import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Event validation schemas
export const createEventSchema = z.object({
  event_name: z.string().min(3, 'Event name must be at least 3 characters').max(255),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  theme_color: z.string().min(1).max(50).optional().default('purple'), // Color palette ID
  logo_url: z.string().url('Invalid URL').max(500).nullable().optional(),
  allow_negative: z.boolean().optional().default(false),
  display_mode: z.enum(['cumulative', 'per_day']).optional().default('cumulative'),
  num_teams: z.number().int().min(2).max(20).optional().default(3),
});

// Team validation schemas
export const addTeamSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  team_name: z.string().min(2, 'Team name must be at least 2 characters').max(255),
  avatar_url: z.string().url('Invalid avatar URL').nullable().optional(),
});

export const listTeamsSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
});

// Score validation schemas
export const addScoreSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  team_id: z.string().uuid('Invalid team ID'),
  game_number: z.number().int().positive('Game number must be positive'),
  points: z.number().int('Points must be an integer'),
  submission_id: z.string().max(100).optional(),
});

export const updateEventSchema = z.object({
  event_name: z.string().min(1).max(255).optional(),
  brand_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color').optional(),
  logo_url: z.string().url('Invalid URL').max(500).nullable().optional(),
  allow_negative: z.boolean().optional(),
  display_mode: z.enum(['cumulative', 'per_day']).optional(),
  num_teams: z.number().int().min(2).max(20).optional(),
});

export const scoresByEventSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type AddTeamInput = z.infer<typeof addTeamSchema>;
export type AddScoreInput = z.infer<typeof addScoreSchema>;
