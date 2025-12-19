// lib/hooks/index.ts
// Barrel export for all safe browser hooks

export {
  useIsBrowser,
  useLocalStorage,
  useSetLocalStorage,
  useDocument,
  useWindow,
  useEventListener,
  usePathname,
  useUserAgent,
  useFeatureDetection,
  useBodyStyle,
  useCSSVariable,
  useFullscreen,
} from './useBrowserSafe';
export { useEventStream } from './useEventStream';
