// components/index.ts
// Export all components from a single file for easier imports

export { Button } from './Button';
export { Input } from './Input';
export { PasswordInput } from './PasswordInput';
export { Card } from './Card';
export { ColorPaletteSelector } from './ColorPaletteSelector';
export { DashboardCard, CreateEventForm } from './DashboardCard';
export { EventCard, EventGrid } from './EventCard';
export { TeamCard, TeamList } from './TeamCard';
export { ScoreInputRow, AddTeamForm } from './ScoreInputRow';
export { PublicScoreboard, LoadingScoreboard, ErrorScoreboard } from './PublicScoreboard';
export { EventSetupWizard } from './EventSetupWizard';
export { HistoryList, HistoryFilter } from './HistoryList';
export type { GameScore } from './HistoryList';
export {
  LoadingSpinner,
  LoadingCard,
  LoadingTeamCard,
  LoadingScoreboard as LoadingScoreboardSkeleton,
  LoadingTable,
  LoadingDashboard,
  Skeleton,
  LoadingButton,
  LoadingOverlay,
  LoadingPage,
} from './LoadingStates';
export {
  ErrorMessage,
  ErrorPage,
  ErrorBanner,
  NotFound,
  EmptyState,
} from './ErrorStates';
export { Modal } from './Modal';
export { NumberInput } from './NumberInput';
export { DeleteConfirmationModal } from './DeleteConfirmationModal';
export { SearchFilterToolbar } from './SearchFilterToolbar';
export { ScoresTable } from './ScoresTable';
export { FormInput } from './FormInput';
export { AnalyticsDashboard } from './AnalyticsDashboard';
export { PreferencesMenu } from './PreferencesMenu';
export { BottomTabBar } from './BottomTabBar';
export { AutosaveScoreInput } from './AutosaveScoreInput';
export { SwipeableListItem } from './SwipeableListItem';
export { ThemedEventPage } from './ThemedEventPage';
export { ErrorBoundary } from './ErrorBoundary';
export { ClientSetup } from './ClientSetup';
export { RecapIntroModal } from './RecapIntroModal';

// Mobile-First Responsive Components (CRITICAL FIX #8)
export {
  MobileNavigation,
  MobileHeader,
  MobileDrawer,
  MobileFAB,
  MobilePullToRefresh,
} from './MobileNavigation';
export type { MobileNavItem, MobileNavigationProps, MobileHeaderProps, MobileDrawerProps, MobileFABProps, MobilePullToRefreshProps } from './MobileNavigation';

export {
  TouchScoreInput,
  CompactTouchScoreInput,
  TouchNumberPad,
} from './TouchScoreInput';
export type { TouchScoreInputProps, CompactTouchScoreInputProps, TouchNumberPadProps } from './TouchScoreInput';

export {
  ResponsiveTeamDisplay,
  ResponsiveTeamGrid,
} from './ResponsiveTeamDisplay';
export type { ResponsiveTeamDisplayProps, ResponsiveTeamGridProps, Team } from './ResponsiveTeamDisplay';
export { RecapShareModal } from './RecapShareModal';
export { RecapSlides } from './RecapSlides';
export { IntroSlide, GamesPlayedSlide, TeamsParticipatedSlide, RankingsSlide, WinnerSlide, ClosingSlide } from './RecapSlideComponents';
export { RecapPlayer } from './RecapPlayer';
export type { RecapSlideType, RecapSlide, RecapData } from './RecapPlayerNew';
export { WaitlistSignup } from './WaitlistSignup';
// Coffee tipping components removed in favor of Ko-fi overlay
