// lib/validations.ts
import { z } from 'zod';

// ============================================================================
// AUTH SCHEMAS
// ============================================================================
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const newPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ============================================================================
// EVENT SCHEMAS
// ============================================================================
export const createEventSchema = z.object({
  event_name: z.string().min(3, 'Event name must be at least 3 characters').max(255),
  start_at: z.string().datetime().nullable().optional(),
  end_at: z.string().datetime().nullable().optional(),
  theme_color: z.string().min(1).max(50).optional().default('purple'),
  allow_negative: z.boolean().optional().default(false),
  display_mode: z.enum(['cumulative', 'per_day']).optional().default('cumulative'),
  num_teams: z.number().int().min(2).max(20).optional().default(3),
});

export const updateEventSchema = z.object({
  event_name: z.string().min(1).max(255).optional(),
  theme_color: z.string().max(50).optional(),
  allow_negative: z.boolean().optional(),
  display_mode: z.enum(['cumulative', 'per_day']).optional(),
  num_teams: z.number().int().min(2).max(20).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const listEventsSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  status: z.enum(['active', 'inactive', 'all']).optional().default('all'),
});

// ============================================================================
// TEAM SCHEMAS
// ============================================================================
export const createTeamSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  team_name: z.string().min(2, 'Team name must be at least 2 characters').max(255),
});

export const updateTeamSchema = z.object({
  team_name: z.string().min(2).max(255).optional(),
});

export const listTeamsSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

// Backward compatibility aliases
export const addTeamSchema = createTeamSchema;

// ============================================================================
// SCORE SCHEMAS
// ============================================================================
export const addScoreSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  team_id: z.string().uuid('Invalid team ID'),
  game_number: z.number().int().positive('Game number must be positive'),
  points: z.number().int('Points must be an integer'),
  game_name: z.string().max(255).optional(),
  submission_id: z.string().max(100).optional(),
});

export const updateScoreSchema = z.object({
  game_number: z.number().int().positive().optional(),
  points: z.number().int().optional(),
  game_name: z.string().max(255).optional(),
});

export const listScoresSchema = z.object({
  event_id: z.string().uuid().optional(),
  team_id: z.string().uuid().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

// Backward compatibility aliases
export const scoresByEventSchema = listScoresSchema;

// ============================================================================
// SETTINGS SCHEMAS
// ============================================================================
export const updateSettingsSchema = z.record(z.any());

export const settingKeySchema = z.string().min(1).max(100);

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================
export const paginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// AUDIT LOG SCHEMAS
// ============================================================================
export const auditLogFiltersSchema = z.object({
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  user_id: z.string().uuid().optional(),
  action: z.string().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

// ============================================================================
// QUERY PARAM SCHEMAS
// ============================================================================
export const filterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Safely parse and validate input with error handling
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } {
  try {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { success: false, error: errors };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: 'Validation error' };
  }
}

/**
 * Validate request query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, query: any): { success: boolean; data?: T; error?: string } {
  return validateInput(schema, query);
}

/**
 * Validate request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: any): { success: boolean; data?: T; error?: string } {
  return validateInput(schema, body);
}

/**
 * Coerce string numbers to actual numbers in query params
 */
export function parseQueryParams(params: Record<string, string | string[] | undefined>) {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    
    if (Array.isArray(value)) {
      result[key] = value[0];
    } else if (value === 'true') {
      result[key] = true;
    } else if (value === 'false') {
      result[key] = false;
    } else if (!isNaN(Number(value))) {
      result[key] = Number(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type AddTeamInput = z.infer<typeof addTeamSchema>;
export type AddScoreInput = z.infer<typeof addScoreSchema>;
