/**
 * Zero-Signup Device Vault
 * Remembers events & role tokens on this device so Admins, Scorers, and Viewers
 * can reopen the installed GamesCo PWA and jump straight back into their event
 * without creating an account or digging through chat links.
 */

export type SavedEventRole = 'admin' | 'scorer' | 'viewer';

export interface SavedEventEntry {
  eventId: string;
  eventName: string;
  role: SavedEventRole;
  token: string;
  path: string;
  numberOfDays?: number;
  lastOpenedAt: string;
}

const STORAGE_KEY = 'gamesco_saved_events_v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getSavedEvents(): SavedEventEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort(
      (a, b) =>
        new Date(b.lastOpenedAt || 0).getTime() - new Date(a.lastOpenedAt || 0).getTime()
    );
  } catch {
    return [];
  }
}

export function saveEventToDevice(entry: Omit<SavedEventEntry, 'lastOpenedAt'>): SavedEventEntry[] {
  if (!isBrowser()) return [];
  const current = getSavedEvents();
  const nextEntry: SavedEventEntry = {
    ...entry,
    lastOpenedAt: new Date().toISOString(),
  };

  // Deduplicate by eventId + role (keep highest-privilege or update existing)
  const filtered = current.filter(
    (item) => !(item.eventId === entry.eventId && item.role === entry.role)
  );
  const updated = [nextEntry, ...filtered].slice(0, 12);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore quota errors
  }

  return updated;
}

export function removeSavedEvent(eventId: string, role: SavedEventRole): SavedEventEntry[] {
  if (!isBrowser()) return [];
  const updated = getSavedEvents().filter(
    (item) => !(item.eventId === eventId && item.role === role)
  );
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
  return updated;
}

export function getMostRecentSavedEvent(): SavedEventEntry | null {
  const list = getSavedEvents();
  return list.length > 0 ? list[0] : null;
}
