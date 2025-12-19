'use client';

import { useEffect, useRef, useState } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  enableHaptic?: boolean;
}

interface TouchPosition {
  x: number;
  y: number;
}

/**
 * Hook to detect swipe gestures on touch devices.
 * Supports haptic feedback via Vibration API.
 * Returns a ref to attach to the element you want to track.
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
  enableHaptic = true,
}: SwipeOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setTouchEnd(null);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return;

      const x = e.changedTouches[0].clientX;
      const y = e.changedTouches[0].clientY;

      setTouchEnd({ x, y });

      const deltaX = touchStart.x - x;
      const deltaY = touchStart.y - y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Haptic feedback
      if (enableHaptic && navigator.vibrate && (absDeltaX > minSwipeDistance || absDeltaY > minSwipeDistance)) {
        navigator.vibrate(10);
      }

      // Horizontal swipe
      if (absDeltaX > minSwipeDistance) {
        if (deltaX > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX < 0 && onSwipeRight) {
          onSwipeRight();
        }
      }

      // Vertical swipe
      if (absDeltaY > minSwipeDistance) {
        if (deltaY > 0 && onSwipeUp) {
          onSwipeUp();
        } else if (deltaY < 0 && onSwipeDown) {
          onSwipeDown();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance, enableHaptic]);

  return ref;
}

/**
 * Hook to detect and respond to long press gestures.
 * Useful for context menus or alternative actions on mobile.
 */
export function useLongPress({
  onLongPress,
  duration = 500,
  enableHaptic = true,
}: {
  onLongPress: () => void;
  duration?: number;
  enableHaptic?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = () => {
      timeoutRef.current = setTimeout(() => {
        if (enableHaptic && navigator.vibrate) {
          navigator.vibrate([20, 10, 20]);
        }
        onLongPress();
      }, duration);
    };

    const handleTouchEnd = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    const handleTouchCancel = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchCancel);
    element.addEventListener('mousedown', handleTouchStart);
    element.addEventListener('mouseup', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
      element.removeEventListener('mousedown', handleTouchStart);
      element.removeEventListener('mouseup', handleTouchEnd);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onLongPress, duration, enableHaptic]);

  return ref;
}

/**
 * Hook to detect if the device is mobile/tablet.
 * Returns a boolean indicating if the viewport width is less than 768px (Tailwind md breakpoint).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
