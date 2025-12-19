// lib/hooks/useBrowserSafe.ts
// Collection of hooks for safe browser API access
// Prevents SSR crashes and hydration mismatches

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Check if code is running in browser (not SSR)
 * @returns true if running in browser, false if SSR
 */
export const useIsBrowser = () => {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  return isBrowser;
};

/**
 * Safe localStorage access hook
 * Returns null on SSR, prevents hydration warnings
 *
 * @param key - localStorage key
 * @returns value or null if not available
 *
 * Usage:
 * const token = useLocalStorage('token');
 */
export const useLocalStorage = (key: string): string | null => {
  const [value, setValue] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(key);
      setValue(stored);
    } catch (error) {
      console.error(`Failed to read localStorage[${key}]:`, error);
      setValue(null);
    }
  }, [key]);

  // Return null during SSR to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return value;
};

/**
 * Safe localStorage write hook
 * Returns setter function that only works in browser
 *
 * @param key - localStorage key
 * @returns setter function
 *
 * Usage:
 * const setToken = useSetLocalStorage('token');
 * setToken('my-token-value');
 */
export const useSetLocalStorage = (key: string) => {
  const isBrowser = useIsBrowser();

  return useCallback(
    (value: string | null) => {
      if (!isBrowser) return;

      try {
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value);
        }
      } catch (error) {
        console.error(`Failed to write localStorage[${key}]:`, error);
      }
    },
    [key, isBrowser]
  );
};

/**
 * Safe document access hook
 * Returns reference to document, null on SSR
 *
 * Usage:
 * const doc = useDocument();
 * if (doc) doc.body.style.overflow = 'hidden';
 */
export const useDocument = () => {
  const [doc, setDoc] = useState<Document | null>(null);

  useEffect(() => {
    setDoc(document);
  }, []);

  return doc;
};

/**
 * Safe window access hook
 * Returns reference to window, null on SSR
 *
 * Usage:
 * const win = useWindow();
 * if (win) console.log(win.location.pathname);
 */
export const useWindow = () => {
  const [win, setWin] = useState<Window | null>(null);

  useEffect(() => {
    setWin(window);
  }, []);

  return win;
};

/**
 * Safe event listener registration
 * Automatically cleaned up on unmount
 *
 * @param target - EventTarget (window, document, etc.)
 * @param event - Event name
 * @param handler - Event handler
 * @param options - Event listener options
 *
 * Usage:
 * useEventListener(window, 'resize', handleResize);
 */
export const useEventListener = (
  target: EventTarget | null,
  event: string,
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
) => {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target) return;

    const listener = (e: Event) => handlerRef.current(e);
    target.addEventListener(event, listener, options);

    return () => {
      target.removeEventListener(event, listener, options);
    };
  }, [target, event, options]);
};

/**
 * Safe window location access
 * Returns current pathname, empty string on SSR
 *
 * Usage:
 * const pathname = usePathname();
 */
export const usePathname = () => {
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return pathname;
};

/**
 * Safe navigator access
 * Returns user agent, empty string on SSR
 *
 * Usage:
 * const userAgent = useUserAgent();
 */
export const useUserAgent = () => {
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    setUserAgent(navigator.userAgent);
  }, []);

  return userAgent;
};

/**
 * Safe feature detection
 * Check if browser supports a specific API
 *
 * @param feature - Feature name (e.g., 'localStorage', 'fullscreenEnabled')
 * @returns true if feature is available
 *
 * Usage:
 * const hasFullscreen = useFeatureDetection('fullscreenEnabled');
 * if (hasFullscreen) element.requestFullscreen();
 */
export const useFeatureDetection = (feature: string) => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    try {
      // Check window features
      if (feature in window) {
        setIsSupported(true);
        return;
      }

      // Check document features
      if (feature in document) {
        setIsSupported(true);
        return;
      }

      // Check navigator features
      if (feature in navigator) {
        setIsSupported(true);
        return;
      }

      setIsSupported(false);
    } catch (error) {
      console.error(`Feature detection failed for ${feature}:`, error);
      setIsSupported(false);
    }
  }, [feature]);

  return isSupported;
};

/**
 * Safe document body style management
 * Prevents SSR mismatches when modifying body styles
 *
 * @param styles - CSS property object
 *
 * Usage:
 * useBodyStyle({ overflow: 'hidden' });
 */
export const useBodyStyle = (styles: Record<string, string | undefined>) => {
  useEffect(() => {
    const originalStyles: Record<string, string> = {};

    // Store original values
    Object.keys(styles).forEach((key) => {
      originalStyles[key] = (document.body.style as any)[key];
    });

    // Apply new styles
    Object.entries(styles).forEach(([key, value]) => {
      if (value !== undefined) {
        (document.body.style as any)[key] = value;
      }
    });

    // Restore on unmount
    return () => {
      Object.entries(originalStyles).forEach(([key, value]) => {
        (document.body.style as any)[key] = value;
      });
    };
  }, [styles]);
};

/**
 * Safe CSS variable setting on document root
 * Prevents SSR crashes when setting CSS vars
 *
 * @param variable - CSS variable name (e.g., '--primary-color')
 * @param value - CSS variable value
 *
 * Usage:
 * useCSSVariable('--theme-color', '#ff0000');
 */
export const useCSSVariable = (variable: string, value: string) => {
  useEffect(() => {
    try {
      document.documentElement.style.setProperty(variable, value);

      return () => {
        document.documentElement.style.removeProperty(variable);
      };
    } catch (error) {
      console.error(`Failed to set CSS variable ${variable}:`, error);
    }
  }, [variable, value]);
};

/**
 * Safe fullscreen API access
 * Checks for browser support before attempting fullscreen
 *
 * @returns object with { isSupported, request, exit, isFullscreen }
 *
 * Usage:
 * const { request, exit, isSupported } = useFullscreen();
 * if (isSupported) await request(element);
 */
export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check for fullscreen support
    const supported =
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled;

    setIsSupported(!!supported);

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const request = useCallback(async (element: HTMLElement) => {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error);
    }
  }, []);

  const exit = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen exit failed:', error);
    }
  }, []);

  return {
    isFullscreen,
    isSupported,
    request,
    exit,
  };
};
