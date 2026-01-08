// lib/offline-manager.ts
/**
 * Offline Manager for Scorer Interface
 * Handles caching, queue management, and sync
 */

export interface CachedData {
  event: any;
  teams: any[];
  timestamp: number;
  token: string;
}

export interface QueuedScore {
  id: string;
  eventId: string;
  teamId: string;
  points: number;
  category: string;
  dayNumber: number;
  timestamp: number;
  type: 'single' | 'quick' | 'bulk';
  bulkItems?: Array<{ team_id: string; points: number }>;
}

const CACHE_KEY_PREFIX = 'scorer_cache_';
const QUEUE_KEY = 'scorer_queue';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

/**
 * Save data to localStorage cache
 */
export function saveToCache(token: string, event: any, teams: any[]): void {
  try {
    const cacheData: CachedData = {
      event,
      teams,
      timestamp: Date.now(),
      token,
    };
    localStorage.setItem(CACHE_KEY_PREFIX + token, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to save to cache:', error);
  }
}

/**
 * Load data from localStorage cache
 */
export function loadFromCache(token: string): CachedData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + token);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    
    // Check if cache is still valid
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY_PREFIX + token);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load from cache:', error);
    return null;
  }
}

/**
 * Add score to offline queue
 */
export function queueScore(score: Omit<QueuedScore, 'id' | 'timestamp'>): void {
  try {
    const queue = getQueue();
    const queuedScore: QueuedScore = {
      ...score,
      id: generateId(),
      timestamp: Date.now(),
    };
    queue.push(queuedScore);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to queue score:', error);
  }
}

/**
 * Get all queued scores
 */
export function getQueue(): QueuedScore[] {
  try {
    const queue = localStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Failed to get queue:', error);
    return [];
  }
}

/**
 * Clear the queue
 */
export function clearQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('Failed to clear queue:', error);
  }
}

/**
 * Remove specific score from queue
 */
export function removeFromQueue(scoreId: string): void {
  try {
    const queue = getQueue();
    const filtered = queue.filter(s => s.id !== scoreId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from queue:', error);
  }
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Generate unique ID for queued items
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Update cached team totals locally (optimistic update)
 */
export function updateCachedTeamPoints(token: string, teamId: string, pointsDelta: number): void {
  try {
    const cached = loadFromCache(token);
    if (!cached) return;

    const updatedTeams = cached.teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          total_points: (team.total_points || 0) + pointsDelta
        };
      }
      return team;
    });

    saveToCache(token, cached.event, updatedTeams);
  } catch (error) {
    console.error('Failed to update cached team points:', error);
  }
}
