// components/index.ts
// Export all components from a single file for easier imports

export { Button } from './Button';
export { Input } from './Input';
export { PasswordInput } from './PasswordInput';
export { Card } from './Card';
export { Navbar } from './Navbar';
export { ThemeToggle } from './ThemeToggle';
export { ColorPaletteSelector } from './ColorPaletteSelector';
export { LogoUpload } from './LogoUpload';
export { AuthForm } from './AuthForm';
export type { AuthFormData } from './AuthForm';
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
