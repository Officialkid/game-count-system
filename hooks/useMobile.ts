/**
 * Mobile Utilities and Hooks
 * 
 * Provides utilities for detecting mobile devices, touch support,
 * and responsive breakpoints
 * 
 * TypeScript Notes:
 * - Uses type assertions for non-standard browser APIs (webkit, screen.orientation)
 * - These APIs are supported but not in standard TypeScript definitions
 */

import { useEffect, useState } from 'react';

// ============================================================================
// TYPE DEFINITIONS FOR NON-STANDARD BROWSER APIS
// ============================================================================

/**
 * Webkit-specific CSS properties for iOS Safari optimization
 * These properties are not in standard TypeScript CSSStyleDeclaration
 */
interface WebkitCSSProperties {
  webkitOverflowScrolling?: string;
  webkitTapHighlightColor?: string;
  webkitTouchCallout?: string;
  webkitUserSelect?: string;
}

/**
 * Screen Orientation API types
 * Note: OrientationLockType is the correct type name, but TypeScript may not recognize it
 * Valid values: 'portrait', 'landscape', 'portrait-primary', 'landscape-primary', etc.
 */
type ScreenOrientationLock = 
  | 'portrait' 
  | 'landscape' 
  | 'portrait-primary' 
  | 'portrait-secondary' 
  | 'landscape-primary' 
  | 'landscape-secondary' 
  | 'natural' 
  | 'any';

/**
 * Screen Orientation API interface
 * Used for locking/unlocking screen orientation
 */
interface ScreenOrientationAPI {
  lock: (orientation: ScreenOrientationLock) => Promise<void>;
  unlock: () => void;
  type?: string;
  angle?: number;
}

/**
 * Hook to detect if user is on a mobile device
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook to detect if device supports touch
 */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
  }, []);

  return isTouch;
}

/**
 * Hook to get current screen size breakpoint
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 1024) setBreakpoint('md');
      else if (width < 1280) setBreakpoint('lg');
      else if (width < 1536) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Hook to detect device orientation
 */
export type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return orientation;
}

/**
 * Hook to get safe area insets for notched devices
 */
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const checkInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
      });
    };

    checkInsets();
    window.addEventListener('resize', checkInsets);
    return () => window.removeEventListener('resize', checkInsets);
  }, []);

  return insets;
}

/**
 * Utility to get responsive class based on breakpoint
 */
export function getResponsiveClass(
  classes: Partial<Record<Breakpoint, string>>,
  currentBreakpoint: Breakpoint
): string {
  return classes[currentBreakpoint] || classes.xs || '';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Prevent pull-to-refresh on mobile
 */
export function preventPullToRefresh(): void {
  if (typeof window === 'undefined') return;

  let lastTouchY = 0;
  let preventPull = false;

  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) return;
      lastTouchY = e.touches[0].clientY;
      preventPull = window.pageYOffset === 0;
    },
    { passive: false }
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      const touchY = e.touches[0].clientY;
      const touchYDelta = touchY - lastTouchY;
      lastTouchY = touchY;

      if (preventPull && touchYDelta > 0) {
        e.preventDefault();
        return;
      }
    },
    { passive: false }
  );
}

/**
 * Enable smooth scrolling on iOS
 * Uses webkit-specific CSS property for better scroll performance on iOS devices
 */
export function enableSmoothScrolling(): void {
  if (typeof window === 'undefined') return;
  
  // Type assertion to access webkit-specific properties
  const style = document.body.style as CSSStyleDeclaration & WebkitCSSProperties;
  style.webkitOverflowScrolling = 'touch';
}

/**
 * Get viewport height accounting for mobile browser chrome
 */
export function getActualViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.visualViewport?.height || window.innerHeight;
}

/**
 * Vibrate device (if supported)
 */
export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Lock screen orientation (for games/full-screen experiences)
 * 
 * Supported orientations:
 * - 'portrait' or 'landscape' (general)
 * - 'portrait-primary', 'portrait-secondary' (specific)
 * - 'landscape-primary', 'landscape-secondary' (specific)
 * - 'natural' (device's natural orientation)
 * - 'any' (allow all orientations)
 * 
 * @param orientation - The desired screen orientation
 * @returns Promise that resolves when orientation is locked
 * 
 * @example
 * ```typescript
 * // Lock to landscape for game
 * await lockOrientation('landscape');
 * 
 * // Lock to portrait for reading
 * await lockOrientation('portrait');
 * ```
 */
export async function lockOrientation(orientation: ScreenOrientationLock): Promise<void> {
  // Type assertion to access Screen Orientation API
  const screenOrientation = (screen as any).orientation as ScreenOrientationAPI | undefined;
  
  if (screenOrientation?.lock) {
    try {
      await screenOrientation.lock(orientation);
    } catch (err) {
      console.warn('Screen orientation lock not supported or denied:', err);
    }
  }
}

/**
 * Unlock screen orientation
 * Allows the screen to rotate freely again
 * 
 * @example
 * ```typescript
 * // Unlock after game ends
 * unlockOrientation();
 * ```
 */
export function unlockOrientation(): void {
  // Type assertion to access Screen Orientation API
  const screenOrientation = (screen as any).orientation as ScreenOrientationAPI | undefined;
  
  if (screenOrientation?.unlock) {
    screenOrientation.unlock();
  }
}
