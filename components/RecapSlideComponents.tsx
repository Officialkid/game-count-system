'use client';

import { useEffect, useState } from 'react';
import { Trophy, Share2, RotateCcw, Home, User } from 'lucide-react';

/**
 * OPTIMIZED Recap Slide Components with Animation System
 * 
 * PRINCIPLES ENFORCED:
 * ✅ Transform + Opacity only (no layout shifts)
 * ✅ Entry: ease-out, Exit: ease-in
 * ✅ Durations: 300-600ms (within smooth range)
 * ✅ GPU accelerated
 * ✅ Respects prefers-reduced-motion
 */

// =============================================================================
// SLIDE 1: INTRO SLIDE
// =============================================================================
export function IntroSlide({ 
  userName, 
  onAnimationComplete 
}: { 
  userName?: string; 
  onAnimationComplete?: () => void 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => onAnimationComplete?.(), 1200);
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 gpu-accelerated">
      <div
        className={`text-center will-animate transform transition-all duration-500 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        {/* Bouncing emoji - celebratory not layout-shifting */}
        <div className="mb-8 text-6xl inline-block" style={{
          animation: 'bounce 1s cubic-bezier(0.34, 1.56, 0.64, 1) infinite',
        }}>
          🎮
        </div>
        
        <h2 className="text-5xl sm:text-6xl font-bold text-white mb-4 animate-fade-in" style={{
          animationDelay: '200ms',
        }}>
          This was your
        </h2>
        
        <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-300 via-amber-300 to-purple-300 bg-clip-text text-transparent mb-6 animate-fade-in" style={{
          animationDelay: '300ms',
        }}>
          GameScore Journey
        </p>
        
        {userName && (
          <div className="flex items-center justify-center gap-2 mt-8 text-xl text-white/70 animate-fade-in" style={{
            animationDelay: '400ms',
          }}>
            <User className="w-5 h-5" />
            <span>{userName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SLIDE 2: GAMES PLAYED SLIDE
// =============================================================================
export function GamesPlayedSlide({
  gamesCount,
  eventName,
  onAnimationComplete,
}: {
  gamesCount: number;
  eventName?: string;
  onAnimationComplete?: () => void;
}) {
  const [displayCount, setDisplayCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Optimized counter: visual animation on static number
  useEffect(() => {
    if (!isVisible) return;

    let current = 0;
    const increment = Math.ceil(gamesCount / 20);
    const interval = setInterval(() => {
      current = Math.min(current + increment, gamesCount);
      setDisplayCount(current);
      
      if (current >= gamesCount) {
        clearInterval(interval);
        // Let the progress bar animation complete before moving to next slide
        setTimeout(() => onAnimationComplete?.(), 300);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isVisible, gamesCount, onAnimationComplete]);

  const progressPercent = Math.min((displayCount / 100) * 100, 100);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 gpu-accelerated">
      <div className="max-w-2xl w-full">
        {/* Heading with slide-up animation */}
        <div
          className="text-center mb-8 animate-slide-up"
          style={{ animationDuration: '500ms' }}
        >
          <p className="text-white/70 text-lg mb-4">🎯 Games Played</p>
          <div className="inline-block">
            <div className="text-7xl sm:text-8xl font-bold text-white tabular-nums">
              {displayCount}
            </div>
          </div>
          <p className="text-2xl sm:text-3xl text-white/80 mt-6">
            You ran {displayCount} games{eventName ? ` in ${eventName}` : ''}
          </p>
        </div>

        {/* Progress bar: uses scaleX transform for smooth animation */}
        <div
          className="mt-12 p-6 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-in will-animate"
          style={{ 
            animationDuration: '500ms',
            animationDelay: '200ms',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Games Complete</span>
            <span className="text-white font-semibold">{Math.min(displayCount, 100)}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-amber-500 animate-progress will-animate"
              style={{ 
                width: `${progressPercent}%`,
                transform: `scaleX(${progressPercent / 100})`,
                transformOrigin: 'left',
                transition: 'width 100ms linear, transform 100ms linear',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SLIDE 3: TEAMS PARTICIPATED SLIDE
// =============================================================================
export function TeamsParticipatedSlide({
  teams,
  onAnimationComplete,
}: {
  teams: Array<{ id: string; name: string; avatar?: string; points: number }>;
  onAnimationComplete?: () => void;
}) {
  const [visibleTeams, setVisibleTeams] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Stagger animation: 75ms per team, max 9 total animation duration
  useEffect(() => {
    if (!isVisible) return;

    teams.forEach((team, idx) => {
      const delay = Math.min(idx * 75, 675);
      const timeout = setTimeout(() => {
        setVisibleTeams((prev) => [...prev, team.id]);
      }, delay);
    });

    const completeTimer = setTimeout(() => onAnimationComplete?.(), Math.min(teams.length * 75, 675) + 400);

    return () => clearTimeout(completeTimer);
  }, [isVisible, teams, onAnimationComplete]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 gpu-accelerated">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12 animate-slide-up" style={{ animationDuration: '500ms' }}>
          <p className="text-white/70 text-lg mb-2">👥 Teams Participated</p>
          <h3 className="text-5xl sm:text-6xl font-bold text-white">{teams.length}</h3>
          <p className="text-xl text-white/70 mt-2">teams competed</p>
        </div>

        {/* Team Grid with staggered reveal */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {teams.map((team, idx) => (
            <div
              key={team.id}
              className="will-animate"
              style={{
                animation: visibleTeams.includes(team.id)
                  ? 'fadeIn 400ms ease-out forwards'
                  : 'fadeOut 0ms',
                animationDelay: `${Math.min(idx * 75, 675)}ms`,
              }}
            >
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-amber-500/20 border border-white/10 backdrop-blur-sm text-center hover:border-white/20 transition-colors">
                {team.avatar ? (
                  <img
                    src={team.avatar}
                    alt={team.name}
                    className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-white/10 flex items-center justify-center">
                    <span className="text-lg">🎯</span>
                  </div>
                )}
                <p className="text-white font-semibold text-sm line-clamp-2">{team.name}</p>
                <p className="text-white/60 text-xs mt-1">{team.points} pts</p>
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fadeOut {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 0;
              transform: scale(0.95);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

// =============================================================================
// SLIDE 4: RANKINGS SLIDE (Last to First) — DRAMATIC REVEAL
// =============================================================================
export function RankingsSlide({
  rankings,
  onAnimationComplete,
}: {
  rankings: Array<{
    id: string;
    name: string;
    points: number;
    rank: number;
    avatar?: string;
  }>;
  onAnimationComplete?: () => void;
}) {
  const [revealedRanks, setRevealedRanks] = useState<number[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [pulsingRank, setPulsingRank] = useState<number | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Animate from bottom-to-top (last rank → first rank) for dramatic reveal
  useEffect(() => {
    if (!isVisible) return;

    const sortedByRank = [...rankings].sort((a, b) => b.rank - a.rank);

    sortedByRank.forEach((team, idx) => {
      // Stagger: 150ms per team (faster than before for more dramatic effect)
      const delay = idx * 150;
      const timeout = setTimeout(() => {
        setRevealedRanks((prev) => [...prev, team.rank]);
        
        // Trigger pulsing glow on the winner (rank 1)
        if (team.rank === 1) {
          setPulsingRank(1);
        }
      }, delay);
    });

    // Total animation time: last reveal + bounce animation
    const completeTimer = setTimeout(
      () => onAnimationComplete?.(),
      sortedByRank.length * 150 + 600 // Stagger + winner bounce time
    );

    return () => clearTimeout(completeTimer);
  }, [isVisible, rankings, onAnimationComplete]);

  const sortedRankings = [...rankings].sort((a, b) => a.rank - b.rank);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 gpu-accelerated">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8 animate-slide-up" style={{ animationDuration: '500ms' }}>
          <p className="text-white/70 text-lg mb-2">🏆 Final Rankings</p>
          <h3 className="text-4xl sm:text-5xl font-bold text-white">The Standings</h3>
        </div>

        {/* Rankings list: bottom-to-top reveal with bounce & glow */}
        <div className="space-y-3">
          {sortedRankings.map((team, idx) => {
            const isWinner = team.rank === 1;
            const animationDelay = idx * 150;
            const isRevealed = revealedRanks.includes(team.rank);

            return (
              <div
                key={team.id}
                className="will-animate"
                style={{
                  animation: isRevealed
                    ? isWinner
                      ? 'bounceInWinner 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                      : 'bounceInRank 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                    : 'hidden',
                  animationDelay: `${animationDelay}ms`,
                }}
              >
                {/* Glow effect for winner */}
                {isWinner && pulsingRank === 1 && (
                  <div
                    className="absolute inset-0 rounded-lg blur-lg -z-10"
                    style={{
                      background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4), transparent)',
                      animation: 'pulseGlowWinner 2s ease-in-out infinite',
                    }}
                  />
                )}

                <div
                  className={`flex items-center gap-4 p-4 rounded-lg backdrop-blur-sm border transition-all will-animate relative ${
                    isWinner
                      ? 'bg-gradient-to-r from-yellow-500/40 to-amber-500/40 border-yellow-300/70 shadow-lg shadow-yellow-500/30'
                      : team.rank === 2
                        ? 'bg-gradient-to-r from-gray-400/25 to-gray-500/25 border-gray-400/40'
                        : team.rank === 3
                          ? 'bg-gradient-to-r from-orange-600/25 to-red-600/25 border-orange-400/40'
                          : 'bg-white/5 border-white/10'
                  }`}
                  style={{
                    transform: isWinner && isRevealed ? 'scale(1.05)' : 'scale(1)',
                    transition: isWinner ? 'transform 300ms ease-out' : 'none',
                  }}
                >
                  {/* Rank Medal with animation */}
                  <div
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg will-animate"
                    style={{
                      animation: isWinner && isRevealed
                        ? 'medallionPulse 2s ease-in-out infinite'
                        : 'none',
                    }}
                  >
                    {team.rank === 1 && <span className="text-2xl">🥇</span>}
                    {team.rank === 2 && <span className="text-2xl">🥈</span>}
                    {team.rank === 3 && <span className="text-2xl">🥉</span>}
                    {team.rank > 3 && (
                      <span className="text-white/70 font-bold">#{team.rank}</span>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${
                      isWinner ? 'text-lg text-yellow-200' : 'text-white text-base'
                    }`}>
                      {team.name}
                    </p>
                    <p className={isWinner ? 'text-white/70 text-sm font-medium' : 'text-white/60 text-sm'}>
                      {team.points} points
                    </p>
                  </div>

                  {/* Points Display - Larger for winner */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`font-bold ${
                      isWinner ? 'text-3xl text-yellow-200' : 'text-2xl text-white'
                    }`}>
                      {team.points}
                    </p>
                    <p className={isWinner ? 'text-xs text-white/70 font-semibold' : 'text-xs text-white/60'}>
                      {isWinner ? 'POINTS' : 'pts'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <style jsx>{`
          @keyframes bounceInRank {
            from {
              opacity: 0;
              transform: translateY(24px) scale(0.95);
            }
            50% {
              transform: translateY(-4px) scale(1.02);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes bounceInWinner {
            from {
              opacity: 0;
              transform: translateY(24px) scale(0.9);
            }
            50% {
              transform: translateY(-8px) scale(1.08);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1.05);
            }
          }

          @keyframes medallionPulse {
            0%, 100% {
              transform: scale(1);
              filter: drop-shadow(0 0 0px rgba(251, 191, 36, 0.6));
            }
            50% {
              transform: scale(1.1);
              filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.8));
            }
          }

          @keyframes pulseGlowWinner {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.05);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

// =============================================================================
// SLIDE 5: WINNER HIGHLIGHT SLIDE
// =============================================================================
export function WinnerSlide({
  winner,
  onAnimationComplete,
}: {
  winner: { name: string; points: number; avatar?: string };
  onAnimationComplete?: () => void;
}) {
  const [showContent, setShowContent] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  const [trophyPhase, setTrophyPhase] = useState<'enter' | 'bounce'>('enter');

  useEffect(() => {
    const timer1 = setTimeout(() => setShowContent(true), 200);
    const timer2 = setTimeout(() => {
      setShowTrophy(true);
      setTrophyPhase('bounce');
    }, 600);
    const timer3 = setTimeout(() => onAnimationComplete?.(), 1600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onAnimationComplete]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 gpu-accelerated">
      {/* Trophy Animation: scale up, then gentle bounce */}
      <div
        className="mb-8 will-animate"
        style={{
          animation: showTrophy
            ? trophyPhase === 'enter'
              ? 'trophyEnter 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
              : 'trophyBounce 600ms ease-in-out infinite'
            : 'hidden',
        }}
      >
        <div className="text-8xl select-none pointer-events-none">🏆</div>
      </div>

      {/* Content with fade/scale */}
      <div
        className="text-center max-w-2xl will-animate"
        style={{
          animation: showContent
            ? 'scaleInContent 500ms ease-out forwards'
            : 'hidden',
        }}
      >
        <h2 className="text-5xl sm:text-6xl font-bold text-white mb-4">And the Winner is...</h2>

        {/* Winner Card */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-purple-600/40 to-amber-600/40 border-2 border-purple-400/50 backdrop-blur-sm">
          {winner.avatar && (
            <img
              src={winner.avatar}
              alt={winner.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
            />
          )}
          <p className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-purple-300 to-amber-300 bg-clip-text text-transparent mb-4">
            {winner.name}
          </p>
          <p className="text-2xl text-white/80 font-semibold">{winner.points} Points</p>
        </div>

        {/* Confetti effect: transform-based only */}
        <div className="mt-8 flex justify-center gap-1 flex-wrap">
          {['🎉', '✨', '🎊', '⭐', '🌟', '💫'].map((emoji, i) => (
            <div
              key={i}
              className="text-2xl will-animate"
              style={{
                animation: showTrophy
                  ? `confettiBounce 500ms ease-in-out infinite`
                  : 'hidden',
                animationDelay: `${i * 60}ms`,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes trophyEnter {
          from {
            opacity: 0;
            transform: scale(0.3) rotateZ(-45deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotateZ(0deg);
          }
        }

        @keyframes trophyBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-12px) scale(1.02);
          }
        }

        @keyframes scaleInContent {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes confettiBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// SLIDE 6: CLOSING / SHARE SLIDE
// =============================================================================
export function ClosingSlide({
  onShare,
  onReplay,
  onDashboard,
}: {
  onShare?: () => void;
  onReplay?: () => void;
  onDashboard?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 gpu-accelerated">
      <div
        className="text-center max-w-xl will-animate"
        style={{
          animation: isVisible
            ? 'fadeAndScale 500ms ease-out forwards'
            : 'hidden',
        }}
      >
        <div className="mb-8 text-6xl inline-block" style={{
          animation: 'bounce 1s cubic-bezier(0.34, 1.56, 0.64, 1) infinite',
        }}>
          🙌
        </div>
        
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Thanks for Competing!
        </h2>
        
        <p className="text-lg text-white/70 mb-12">
          Your journey was amazing. Share it with your team or dive into another event.
        </p>

        {/* CTA Buttons with hover transform */}
        <div className="space-y-3 sm:space-y-0 sm:space-x-3 flex flex-col sm:flex-row items-center justify-center">
          <button
            onClick={onShare}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold transition-transform duration-300 hover:scale-105 will-animate shadow-lg hover:shadow-xl"
          >
            <Share2 className="w-5 h-5" />
            Share Recap
          </button>
          <button
            onClick={onReplay}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-transform duration-300 hover:scale-105 will-animate border border-white/20"
          >
            <RotateCcw className="w-5 h-5" />
            Replay
          </button>
          <button
            onClick={onDashboard}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-transform duration-300 hover:scale-105 will-animate border border-white/20"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </button>
        </div>

        {/* Social hint */}
        <p className="text-sm text-white/50 mt-8">
          Keyboard: Space to pause, ← → to skip, Esc to exit
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeAndScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
