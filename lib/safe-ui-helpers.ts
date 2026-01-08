/**
 * Safe UI Helpers
 * Defensive utilities to prevent crashes from undefined/null API data
 */

/**
 * Safely get first character of a string for avatars/initials
 * @param str - String to extract character from
 * @param fallback - Fallback character (default: "?")
 * @returns First uppercase character or fallback
 */
export function safeInitial(str: string | null | undefined, fallback: string = '?'): string {
  return str?.trim()?.charAt(0)?.toUpperCase() || fallback;
}

/**
 * Safely display a name with fallback
 * @param name - Name to display
 * @param fallback - Fallback name (default: "Unknown")
 * @returns Name or fallback
 */
export function safeName(name: string | null | undefined, fallback: string = 'Unknown'): string {
  return name?.trim() || fallback;
}

/**
 * Safely compare strings for sorting
 * @param a - First string
 * @param b - Second string
 * @returns Comparison result (-1, 0, 1)
 */
export function safeCompare(
  a: string | null | undefined,
  b: string | null | undefined
): number {
  const strA = (a || '').trim().toLowerCase();
  const strB = (b || '').trim().toLowerCase();
  return strA.localeCompare(strB);
}

/**
 * Safely get a number with fallback
 * @param value - Value to convert to number
 * @param fallback - Fallback number (default: 0)
 * @returns Number or fallback
 */
export function safeNumber(value: number | null | undefined, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  return fallback;
}

/**
 * Safely get array length
 * @param arr - Array to check
 * @returns Length or 0
 */
export function safeLength(arr: any[] | null | undefined): number {
  return Array.isArray(arr) ? arr.length : 0;
}

/**
 * Safely get color with fallback
 * @param color - Color string
 * @param fallback - Fallback color (default: "#6B7280" - gray)
 * @returns Color or fallback
 */
export function safeColor(color: string | null | undefined, fallback: string = '#6B7280'): string {
  return color?.trim() || fallback;
}

/**
 * Safely format date
 * @param date - Date to format
 * @param fallback - Fallback string (default: "Invalid date")
 * @returns Formatted date or fallback
 */
export function safeDate(
  date: string | Date | null | undefined,
  fallback: string = 'Invalid date'
): string {
  try {
    if (!date) return fallback;
    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString();
  } catch {
    return fallback;
  }
}

/**
 * Safely get team data with all fallbacks
 */
export interface SafeTeam {
  id: string;
  name: string;
  initial: string;
  color: string;
  points: number;
}

export function safeTeam(team: any): SafeTeam {
  return {
    id: team?.id || team?.team_id || 'unknown',
    name: safeName(team?.name || team?.team_name, 'Unknown Team'),
    initial: safeInitial(team?.name || team?.team_name),
    color: safeColor(team?.color || team?.team_color),
    points: safeNumber(team?.total_points || team?.points),
  };
}

/**
 * Safely get score data with all fallbacks
 */
export interface SafeScore {
  id: string;
  teamName: string;
  teamInitial: string;
  teamColor: string;
  points: number;
  category: string;
  createdAt: string;
}

export function safeScore(score: any): SafeScore {
  return {
    id: score?.id || 'unknown',
    teamName: safeName(score?.team_name),
    teamInitial: safeInitial(score?.team_name),
    teamColor: safeColor(score?.team_color),
    points: safeNumber(score?.points),
    category: score?.category?.trim() || 'Uncategorized',
    createdAt: safeDate(score?.created_at),
  };
}

/**
 * Check if data is empty/invalid
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}
