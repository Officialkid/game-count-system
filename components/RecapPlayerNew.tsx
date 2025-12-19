'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, Share2 } from 'lucide-react';
import {
  IntroSlide,
  GamesPlayedSlide,
  TeamsParticipatedSlide,
  RankingsSlide,
  WinnerSlide,
  ClosingSlide,
} from './RecapSlideComponents';
import { RecapShareModal } from './RecapShareModal';

/**
 * Legacy Slide Types for backward compatibility
 */
export type RecapSlideType = 'stats' | 'leaderboard' | 'highlights' | 'mvp' | 'winner' | 'summary';

export interface RecapSlide {
  type: RecapSlideType;
  title: string;
  data: any;
}

/**
 * Recap Data Structure - New format for mandatory slide order
 */
export interface RecapData {
  userName?: string;
  gamesCount: number;
  eventName?: string;
  teams: Array<{ id: string; name: string; avatar?: string; points: number }>;
  rankings: Array<{
    id: string;
    name: string;
    points: number;
    rank: number;
    avatar?: string;
  }>;
  winner: { name: string; points: number; avatar?: string };
}

interface RecapPlayerProps {
  recapData?: RecapData;
  slides?: RecapSlide[];
  autoplayDuration?: number;
  onClose?: () => void;
  onShare?: () => void;
  onReplay?: () => void;
}

/**
 * Full-screen Recap Player with Mandatory Slide Order
 *
 * Slide Structure:
 * 1. Intro - "This was your GameScore journey"
 * 2. Games Played - Animated counter
 * 3. Teams Participated - Staggered team reveal
 * 4. Rankings - Animated from last to first
 * 5. Winner Highlight - Trophy animation
 * 6. Closing - Share / Replay / Dashboard CTAs
 *
 * Features:
 * - Full viewport immersion
 * - Auto-play with manual skip
 * - Keyboard navigation
 * - Background scroll disabled
 * - Smooth slide animations
 */
export function RecapPlayer({
  recapData,
  slides: legacySlides,
  autoplayDuration = 6000,
  onClose,
  onShare,
  onReplay,
}: RecapPlayerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Build mandatory slide order from recapData
  const slideComponents = recapData
    ? [
        {
          type: 'intro' as const,
          title: 'Intro',
          component: IntroSlide,
          props: { userName: recapData.userName },
        },
        {
          type: 'games' as const,
          title: 'Games Played',
          component: GamesPlayedSlide,
          props: {
            gamesCount: recapData.gamesCount,
            eventName: recapData.eventName,
          },
        },
        {
          type: 'teams' as const,
          title: 'Teams Participated',
          component: TeamsParticipatedSlide,
          props: { teams: recapData.teams },
        },
        {
          type: 'rankings' as const,
          title: 'Rankings',
          component: RankingsSlide,
          props: { rankings: recapData.rankings },
        },
        {
          type: 'winner' as const,
          title: 'Winner',
          component: WinnerSlide,
          props: { winner: recapData.winner },
        },
        {
          type: 'closing' as const,
          title: 'Closing',
          component: ClosingSlide,
          props: {
            onShare,
            onReplay,
            onDashboard: onClose,
          },
        },
      ]
    : [];

  const slides = slideComponents.length > 0 ? slideComponents : [];
  const totalSlides = slides.length;
  const currentSlideData = slides[currentSlide];

  /**
   * Disable scroll while player is open
   */
  useEffect(() => {
    const originalOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = originalOverflow;
      document.body.style.overflow = originalBodyOverflow;
    };
  }, []);

  /**
   * Slide navigation
   */
  const goToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, totalSlides - 1));
    setCurrentSlide(clamped);
    setProgress(0);
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    } else {
      goToSlide(0);
    }
  }, [currentSlide, totalSlides, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  /**
   * Auto-play timer
   */
  useEffect(() => {
    if (!isAutoplay || !slides.length) return;

    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }

    let elapsed = 0;
    autoplayTimerRef.current = setInterval(() => {
      elapsed += 100;
      setProgress((elapsed / autoplayDuration) * 100);

      if (elapsed >= autoplayDuration) {
        nextSlide();
        elapsed = 0;
      }
    }, 100);

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [isAutoplay, autoplayDuration, nextSlide, slides.length]);

  /**
   * Keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAutoplay(!isAutoplay);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, onClose, isAutoplay]);

  /**
   * Helper to render slide components dynamically
   */
  const renderSlide = (slide: any) => {
    const { component: Component, props } = slide;
    return <Component {...props} />;
  };

  if (!slides.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="text-center">
          <p className="text-white text-lg mb-4">No recap data available</p>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onClick={(e) => {
        if (e.target === rootRef.current) {
          setIsAutoplay(!isAutoplay);
        }
      }}
    >
      {/* Dark Gradient Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-900 via-black to-gray-950" />

      {/* Animated Background Accent */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Header Controls */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-sm font-medium">
            Slide {currentSlide + 1} of {totalSlides}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all"
            aria-label="Share recap"
            title="Share this recap"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Share</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all"
            aria-label="Close recap player"
          >
            <X className="w-5 h-5" />
            <span className="text-sm">Exit</span>
          </button>
        </div>
      </div>

      {/* Main Slide Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Slide Renderer - Optimized animations */}
        <div className="w-full h-full flex items-center justify-center" style={{
          animation: 'fadeIn 500ms ease-out forwards',
        }}>
          {currentSlideData ? renderSlide(currentSlideData) : <div className="text-white">Loading...</div>}
        </div>

        {/* Navigation Overlays */}
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
            currentSlide === 0
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'bg-white/10 hover:bg-white/20 text-white hover:scale-110'
          }`}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white hover:scale-110 transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsAutoplay(!isAutoplay)}
          className="absolute bottom-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          aria-label={isAutoplay ? 'Pause autoplay' : 'Resume autoplay'}
        >
          {isAutoplay ? (
            <>
              <Pause className="w-4 h-4" />
              <span className="text-sm">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span className="text-sm">Play</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar - Uses scaleX transform for smooth animation */}
      <div className="relative z-10 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-amber-500 to-purple-500 will-animate"
          style={{ 
            width: `${progress}%`,
            transformOrigin: 'left',
            transition: 'width 100ms linear',
          }}
        />
      </div>

      {/* Footer Navigation */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-sm border-t border-white/10">
        <div className="text-white/70 text-sm">
          {currentSlideData?.title}
        </div>
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentSlide ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Keyboard Hint */}
      <div className="sr-only">
        Keyboard shortcuts: Arrow Left/Right to navigate, Space to toggle autoplay, Escape to close
      </div>

      {/* Share Modal */}
      {recapData && (
        <RecapShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          recapData={{
            winner: recapData.winner.name,
            points: recapData.winner.points,
            gamesCount: recapData.gamesCount,
            eventName: recapData.eventName,
            teams: recapData.teams,
          }}
          shareUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/recap/${recapData.winner.name.toLowerCase().replace(/\s+/g, '-')}`}
          branding={{ brandName: 'GameScore' }}
        />
      )}
    </div>
  );
}
