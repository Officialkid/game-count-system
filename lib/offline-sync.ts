/**
 * Offline-First Score Queue & Snapshot Cache (IndexedDB)
 * Designed for outdoor camp scoring with hours of zero connectivity:
 * - Saves event + teams snapshots locally so /score/[token] opens offline.
 * - Persists every score/deduction batch to IndexedDB with a unique submissionKey.
 * - Auto-syncs to POST /api/scores/bulk when connectivity returns, with zero duplicates.
 */

const DB_NAME = 'gamesco_offline_v1';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'snapshots';
const STORE_QUEUE = 'pending_scores';

export interface OfflineScoreItem {
  team_id: string;
  team_name: string;
  points: number;
}

export interface PendingScoreBatch {
  submissionKey: string;
  eventId: string;
  token: string;
  role: 'admin' | 'scorer';
  dayNumber: number;
  category: string;
  items: OfflineScoreItem[];
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  lastError?: string;
}

export interface CachedEventSnapshot {
  token: string;
  event: any;
  teams: any[];
  cachedAt: string;
}

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'token' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'submissionKey' });
        queueStore.createIndex('by_event', 'eventId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export function generateSubmissionKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `gs_${crypto.randomUUID()}`;
  }
  return `gs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveEventSnapshot(
  token: string,
  event: any,
  teams: any[]
): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
      tx.objectStore(STORE_SNAPSHOTS).put({
        token,
        event,
        teams,
        cachedAt: new Date().toISOString(),
      } satisfies CachedEventSnapshot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Non-fatal cache write error
  }
}

export async function loadEventSnapshot(token: string): Promise<CachedEventSnapshot | null> {
  if (!isIndexedDbAvailable()) return null;
  try {
    const db = await openDatabase();
    const result = await new Promise<CachedEventSnapshot | null>((resolve, reject) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
      const req = tx.objectStore(STORE_SNAPSHOTS).get(token);
      req.onsuccess = () => resolve((req.result as CachedEventSnapshot) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

export async function enqueueOfflineScore(
  batch: Omit<PendingScoreBatch, 'submissionKey' | 'createdAt' | 'status'> & {
    submissionKey?: string;
  }
): Promise<PendingScoreBatch> {
  const entry: PendingScoreBatch = {
    ...batch,
    submissionKey: batch.submissionKey || generateSubmissionKey(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  if (!isIndexedDbAvailable()) {
    return entry;
  }

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    tx.objectStore(STORE_QUEUE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return entry;
}

export async function getPendingScores(eventId: string): Promise<PendingScoreBatch[]> {
  if (!isIndexedDbAvailable()) return [];
  try {
    const db = await openDatabase();
    const entries = await new Promise<PendingScoreBatch[]>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly');
      const index = tx.objectStore(STORE_QUEUE).index('by_event');
      const req = index.getAll(eventId);
      req.onsuccess = () => resolve((req.result as PendingScoreBatch[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return entries.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function removePendingScore(submissionKey: string): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      tx.objectStore(STORE_QUEUE).delete(submissionKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore
  }
}

async function updatePendingEntry(entry: PendingScoreBatch): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    tx.objectStore(STORE_QUEUE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export interface FlushSyncResult {
  syncedCount: number;
  failedCount: number;
  remainingCount: number;
  lastError?: string;
}

/**
 * Sends all queued offline score batches for an event to the server in chronological order.
 * Safe to call repeatedly — server enforces unique submission_key idempotency.
 */
export async function flushPendingScores(eventId: string): Promise<FlushSyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const pending = await getPendingScores(eventId);
    return { syncedCount: 0, failedCount: 0, remainingCount: pending.length };
  }

  const queue = await getPendingScores(eventId);
  let syncedCount = 0;
  let failedCount = 0;
  let lastError: string | undefined;

  for (const batch of queue) {
    try {
      await updatePendingEntry({ ...batch, status: 'syncing', lastError: undefined });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (batch.role === 'admin') {
        headers['X-ADMIN-TOKEN'] = batch.token;
        headers['X-SCORER-TOKEN'] = batch.token;
      } else {
        headers['X-SCORER-TOKEN'] = batch.token;
      }

      const response = await fetch('/api/scores/bulk', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event_id: batch.eventId,
          day_number: batch.dayNumber,
          category: batch.category,
          submission_key: batch.submissionKey,
          source_type: 'sync',
          items: batch.items.map((i) => ({
            team_id: i.team_id,
            points: i.points,
          })),
        }),
      });

      if (response.ok) {
        await removePendingScore(batch.submissionKey);
        syncedCount += 1;
      } else {
        const errBody = await response.json().catch(() => ({}));
        const errMsg = errBody?.error || `HTTP ${response.status}`;
        await updatePendingEntry({
          ...batch,
          status: 'failed',
          lastError: errMsg,
        });
        failedCount += 1;
        lastError = errMsg;
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Network unavailable';
      await updatePendingEntry({
        ...batch,
        status: 'pending',
        lastError: errMsg,
      });
      // Stop trying remaining items if network dropped
      lastError = errMsg;
      break;
    }
  }

  const remaining = await getPendingScores(eventId);
  return {
    syncedCount,
    failedCount,
    remainingCount: remaining.length,
    lastError,
  };
}
