/**
 * Server-side Suspense Freeze evaluation logic.
 * Determines whether public scoreboard marks are currently frozen (via manual freeze
 * OR daily scheduled autoFreezeTime), and computes the exact UTC cutoff timestamp.
 */

export interface FreezeConfigInput {
  isFrozen: boolean;
  frozenAt: Date | null;
  autoFreezeTime: string | null; // "HH:mm" in local event timezone
  freezeMode: string; // "cutoff" | "mystery"
  freezeTimezoneOffset: number; // minutes ahead of UTC (e.g., +180 for UTC+3)
  lastUnfrozenAt: Date | null;
}

export interface EvaluatedFreezeState {
  active: boolean;
  reason: 'manual' | 'scheduled' | 'none';
  mode: 'cutoff' | 'mystery';
  frozenAt: Date | null;
  autoFreezeTime: string | null;
}

export function evaluateEventFreeze(
  event: FreezeConfigInput,
  now: Date = new Date()
): EvaluatedFreezeState {
  const mode: 'cutoff' | 'mystery' =
    event.freezeMode === 'mystery' ? 'mystery' : 'cutoff';

  // 1. Explicit manual freeze always takes priority
  if (event.isFrozen) {
    return {
      active: true,
      reason: 'manual',
      mode,
      frozenAt: event.frozenAt ?? now,
      autoFreezeTime: event.autoFreezeTime,
    };
  }

  // 2. Daily scheduled auto-freeze (e.g., "19:00" in event local timezone)
  if (event.autoFreezeTime && /^\d{2}:\d{2}$/.test(event.autoFreezeTime)) {
    const [hours, minutes] = event.autoFreezeTime.split(':').map(Number);
    const offsetMs = (event.freezeTimezoneOffset ?? 180) * 60 * 1000;

    // Shift "now" into the event's local wall-clock calendar
    const localNow = new Date(now.getTime() + offsetMs);
    const localFreezeToday = new Date(
      Date.UTC(
        localNow.getUTCFullYear(),
        localNow.getUTCMonth(),
        localNow.getUTCDate(),
        hours,
        minutes,
        0,
        0
      )
    );

    // Convert today's scheduled local freeze time back to real UTC Date
    const scheduledFreezeUtc = new Date(localFreezeToday.getTime() - offsetMs);

    if (now.getTime() >= scheduledFreezeUtc.getTime()) {
      // If Admin/Reveal Show already unfroze AFTER today's scheduled freeze time, stay unfrozen!
      const unfrozenAfterTodayFreeze =
        event.lastUnfrozenAt &&
        event.lastUnfrozenAt.getTime() >= scheduledFreezeUtc.getTime();

      if (!unfrozenAfterTodayFreeze) {
        return {
          active: true,
          reason: 'scheduled',
          mode,
          frozenAt: scheduledFreezeUtc,
          autoFreezeTime: event.autoFreezeTime,
        };
      }
    }
  }

  return {
    active: false,
    reason: 'none',
    mode,
    frozenAt: null,
    autoFreezeTime: event.autoFreezeTime,
  };
}
