// lib/cache.ts
type CacheEntry<T> = {
  value: T;
  expires: number;
};

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 100, defaultTTL: number = 60000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const iterator = this.cache.keys().next();
      if (!iterator.done) {
        const firstKey: string = iterator.value as string;
        this.cache.delete(firstKey);
      }
    }

    // Delete existing to move to end
    this.cache.delete(key);

    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl || this.defaultTTL),
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Delete all keys matching a pattern
  invalidatePattern(pattern: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }
}

// Create cache instances
export const eventsListCache = new LRUCache<any>(50, 30000); // 30 seconds TTL
export const publicScoreboardCache = new LRUCache<any>(200, 10000); // 10 seconds TTL
export const eventDetailCache = new LRUCache<any>(100, 60000); // 1 minute TTL

// Helper to invalidate related caches
export function invalidateEventCaches(eventId: string) {
  eventDetailCache.delete(`event:${eventId}`);
  publicScoreboardCache.invalidatePattern(eventId);
  eventsListCache.clear(); // Clear all events lists
}

export function invalidateUserEventsList(userId: string) {
  eventsListCache.delete(`user:${userId}`);
}

// Wrapper for cached API calls
export async function withCache<T>(
  cache: LRUCache<T>,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = cache.get(key);
  if (cached !== null) {
    console.log(`✅ Cache HIT: ${key}`);
    return cached;
  }

  console.log(`❌ Cache MISS: ${key}`);
  // Fetch and cache
  const value = await fetcher();
  // Only cache successful, non-null results
  if (value !== null && value !== undefined) {
    cache.set(key, value, ttl);
  }
  return value;
}
