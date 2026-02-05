/**
 * Database Validation Functions
 * Input validation and schema validators
 */

import { z } from 'zod';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const CreateEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  eventMode: z.enum(['quick', 'multi-day', 'custom']),
  numberOfDays: z.number().int().positive(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

export const CreateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
});

export const CreateScoreSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  points: z.number(),
  day: z.number().int().positive(),
  penalty: z.number().optional(),
  bonus: z.number().optional(),
  notes: z.string().optional(),
});

export const CreateTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  type: z.enum(['admin', 'scorer', 'viewer']),
});

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidEventMode(mode: any): mode is 'quick' | 'multi-day' | 'custom' {
  return ['quick', 'multi-day', 'custom'].includes(mode);
}

export function isValidEventStatus(status: any): status is 'active' | 'completed' | 'archived' {
  return ['active', 'completed', 'archived'].includes(status);
}

export function isValidTokenType(type: any): type is 'admin' | 'scorer' | 'viewer' {
  return ['admin', 'scorer', 'viewer'].includes(type);
}

export function isValidDay(day: any, maxDays: number): boolean {
  return typeof day === 'number' && day >= 1 && day <= maxDays;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEventData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Event name is required and must be a string');
  }
  
  if (!data.eventMode || !isValidEventMode(data.eventMode)) {
    errors.push('Valid event mode is required (quick, multi-day, or custom)');
  }
  
  if (typeof data.numberOfDays !== 'number' || data.numberOfDays < 1) {
    errors.push('Number of days must be a positive number');
  }
  
  // Optional fields with validation
  if (data.status && !isValidEventStatus(data.status)) {
    errors.push('Event status must be active, completed, or archived');
  }
  
  // Date validation
  if (data.startDate && !isValidDate(data.startDate)) {
    errors.push('Start date must be a valid ISO date string');
  }
  
  if (data.endDate && !isValidDate(data.endDate)) {
    errors.push('End date must be a valid ISO date string');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateTeamData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Team name is required and must be a string');
  }
  
  if (!data.color || typeof data.color !== 'string') {
    errors.push('Team color is required and must be a string');
  }
  
  // Color format validation (hex color)
  if (data.color && !/^#[0-9A-F]{6}$/i.test(data.color)) {
    errors.push('Team color must be a valid hex color (e.g., #FF0000)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateScoreData(data: any, maxDays: number): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.teamId || typeof data.teamId !== 'string') {
    errors.push('Team ID is required and must be a string');
  }
  
  if (typeof data.points !== 'number') {
    errors.push('Points must be a number');
  }
  
  if (!isValidDay(data.day, maxDays)) {
    errors.push(`Day must be a number between 1 and ${maxDays}`);
  }
  
  // Optional fields with validation
  if (data.penalty !== undefined && typeof data.penalty !== 'number') {
    errors.push('Penalty must be a number');
  }
  
  if (data.bonus !== undefined && typeof data.bonus !== 'number') {
    errors.push('Bonus must be a number');
  }
  
  if (data.notes !== undefined && typeof data.notes !== 'string') {
    errors.push('Notes must be a string');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateTokenData(data: any): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.token || typeof data.token !== 'string') {
    errors.push('Token value is required and must be a string');
  }
  
  if (!data.type || !isValidTokenType(data.type)) {
    errors.push('Token type must be admin, scorer, or viewer');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isValidDate(dateString: any): boolean {
  if (typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function isValidId(id: any): boolean {
  return typeof id === 'string' && id.length > 0;
}

export function isValidNumber(value: any, min?: number, max?: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

export function sanitizeString(str: any): string {
  if (typeof str !== 'string') return '';
  return str.trim();
}

export function sanitizeNumber(num: any, defaultValue: number = 0): number {
  const parsed = parseFloat(num);
  return isNaN(parsed) ? defaultValue : parsed;
}

// ============================================================================
// BATCH VALIDATION
// ============================================================================

export function validateBulkTeams(teams: any[]): { valid: boolean; errors: Record<number, string[]> } {
  if (!Array.isArray(teams)) {
    return { valid: false, errors: { 0: ['Teams must be an array'] } };
  }
  
  const errors: Record<number, string[]> = {};
  
  teams.forEach((team, index) => {
    const validation = validateTeamData(team);
    if (!validation.valid) {
      errors[index] = validation.errors;
    }
  });
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateBulkScores(scores: any[], maxDays: number): { valid: boolean; errors: Record<number, string[]> } {
  if (!Array.isArray(scores)) {
    return { valid: false, errors: { 0: ['Scores must be an array'] } };
  }
  
  const errors: Record<number, string[]> = {};
  
  scores.forEach((score, index) => {
    const validation = validateScoreData(score, maxDays);
    if (!validation.valid) {
      errors[index] = validation.errors;
    }
  });
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
