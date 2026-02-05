/**
 * Hook for mode-aware component rendering
 * Provides utilities to show/hide features based on event mode
 */

import { useMemo } from 'react';
import {
  getModeFeatures,
  getModeName,
  getModeDescription,
  getModeIcon,
  isQuickMode,
  isMultiDayMode,
  isCustomMode,
} from '@/lib/firebase-frontend-helpers';

interface Event {
  id: string;
  name: string;
  eventMode?: string;
  mode?: string;
  numberOfDays?: number;
  number_of_days?: number;
  [key: string]: any;
}

export interface EventModeState {
  /** Current mode (quick | multi-day | custom) */
  mode: string | undefined;
  
  /** User-friendly mode name (e.g., "Quick Event") */
  modeName: string;
  
  /** Description of mode (e.g., "Single day, auto-cleanup after 7 days") */
  modeDescription: string;
  
  /** Emoji icon for mode */
  modeIcon: string;
  
  /** Available features for this mode */
  features: {
    dayLocking: boolean;
    multiDay: boolean;
    customDuration: boolean;
    advancedScoring: boolean;
    autoCleanup: boolean;
  };
  
  /** Quick mode check */
  isQuick: boolean;
  
  /** Multi-day mode check */
  isMultiDay: boolean;
  
  /** Custom mode check */
  isCustom: boolean;
  
  /** Number of days (1 for quick, 2-3 for multi-day, custom for advanced) */
  numberOfDays: number;
}

/**
 * Hook to access event mode information and features
 * 
 * @example
 * ```tsx
 * function MyComponent({ event }) {
 *   const { features, isMultiDay, modeName } = useEventMode(event);
 *   
 *   return (
 *     <div>
 *       <h1>{event.name} ({modeName})</h1>
 *       
 *       {features.multiDay && (
 *         <DaySelector days={numberOfDays} />
 *       )}
 *       
 *       {features.dayLocking && (
 *         <DayLockManager eventId={event.id} />
 *       )}
 *       
 *       {features.autoCleanup && (
 *         <div className="text-yellow-600">
 *           ⚠️ Auto-deletes 7 days after event ends
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useEventMode(event: Event | null | undefined): EventModeState {
  // Get mode from event (supports both eventMode and mode field names)
  const mode = event?.eventMode || event?.mode;
  
  // Get number of days (supports both numberOfDays and number_of_days)
  const numberOfDays = event?.numberOfDays || event?.number_of_days || 1;
  
  // Memoize computed values
  const features = useMemo(() => getModeFeatures(mode), [mode]);
  const modeName = useMemo(() => getModeName(mode), [mode]);
  const modeDescription = useMemo(() => getModeDescription(mode), [mode]);
  const modeIcon = useMemo(() => getModeIcon(mode), [mode]);
  
  const isQuick = useMemo(() => isQuickMode(mode), [mode]);
  const isMultiDay = useMemo(() => isMultiDayMode(mode), [mode]);
  const isCustom = useMemo(() => isCustomMode(mode), [mode]);
  
  return {
    mode,
    modeName,
    modeDescription,
    modeIcon,
    features,
    isQuick,
    isMultiDay,
    isCustom,
    numberOfDays,
  };
}

/**
 * Check if a specific feature is available for an event
 * 
 * @example
 * ```tsx
 * const canLockDays = useEventFeature(event, 'dayLocking');
 * if (canLockDays) {
 *   return <DayLockManager />;
 * }
 * ```
 */
export function useEventFeature(
  event: Event | null | undefined,
  feature: keyof EventModeState['features']
): boolean {
  const { features } = useEventMode(event);
  return features[feature];
}

/**
 * Get conditional CSS classes based on event mode
 * 
 * @example
 * ```tsx
 * const modeClasses = useEventModeClasses(event);
 * return <div className={modeClasses.container}>...</div>;
 * ```
 */
export function useEventModeClasses(event: Event | null | undefined) {
  const { isQuick, isMultiDay, isCustom } = useEventMode(event);
  
  return useMemo(() => ({
    container: isQuick
      ? 'border-l-4 border-yellow-500'
      : isMultiDay
      ? 'border-l-4 border-blue-500'
      : 'border-l-4 border-purple-500',
    
    badge: isQuick
      ? 'bg-yellow-100 text-yellow-800'
      : isMultiDay
      ? 'bg-blue-100 text-blue-800'
      : 'bg-purple-100 text-purple-800',
    
    button: isQuick
      ? 'bg-yellow-600 hover:bg-yellow-700'
      : isMultiDay
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-purple-600 hover:bg-purple-700',
  }), [isQuick, isMultiDay, isCustom]);
}
