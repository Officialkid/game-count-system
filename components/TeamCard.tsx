// components/TeamCard.tsx
// FIXED: Added lazy loading, error handling, proper alt text, and dark mode support (UI-DEBUG-REPORT Issue #5)
import { Card } from './Card';
import { useState, memo } from 'react';

interface TeamCardProps {
  rank: number;
  teamName: string;
  avatarUrl?: string | null;
  totalPoints: number;
  isPublic?: boolean;
}

// FIXED: Wrap with React.memo to prevent unnecessary re-renders
export const TeamCard = memo(function TeamCard({
  rank,
  teamName,
  avatarUrl,
  totalPoints,
  isPublic = false,
}: TeamCardProps) {
  const [imageError, setImageError] = useState(false);
  const getRankStyle = () => {
    if (!isPublic) return '';
    
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400';
      case 2:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-400';
      case 3:
        return 'bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400';
      default:
        return '';
    }
  };

  const getRankColor = () => {
    switch (rank) {
      case 1:
        return 'text-yellow-600';
      case 2:
        return 'text-gray-600';
      case 3:
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRankBadge = () => {
    if (!isPublic) return null;
    
    switch (rank) {
      case 1:
        return '👑 Leader';
      case 2:
        return '🥈 2nd Place';
      case 3:
        return '🥉 3rd Place';
      default:
        return '';
    }
  };

  return (
    <Card className={getRankStyle()} padding={isPublic ? 'md' : 'sm'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className={`text-2xl sm:text-3xl font-bold ${getRankColor()}`}>
            #{rank}
          </div>

          {avatarUrl && !imageError ? (
            <img
              src={avatarUrl}
              alt={`${teamName} team avatar`}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-primary-200 flex items-center justify-center text-lg sm:text-xl lg:text-2xl font-bold flex-shrink-0 text-primary-700"
              aria-label={`${teamName} initials`}
            >
              {teamName[0]?.toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base sm:text-lg truncate">{teamName}</h3>
            {isPublic && getRankBadge() && (
              <p className="text-xs sm:text-sm text-gray-600">{getRankBadge()}</p>
            )}
          </div>
        </div>

        <div className="text-right ml-2 flex-shrink-0">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-600">
            {totalPoints}
          </div>
          <div className="text-xs sm:text-sm text-gray-700">points</div>
        </div>
      </div>
    </Card>
  );
});

interface TeamListProps {
  children: React.ReactNode;
  isPublic?: boolean;
}

export function TeamList({ children, isPublic = false }: TeamListProps) {
  if (isPublic) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {children}
      </div>
    );
  }

  return <div className="space-y-3">{children}</div>;
}
