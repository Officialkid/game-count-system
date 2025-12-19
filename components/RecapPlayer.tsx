'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react';

/**
 * Recap Slide Types
 * Each slide tells one part of the recap story
 */
export type RecapSlideType = 'stats' | 'leaderboard' | 'highlights' | 'mvp' | 'winner' | 'summary';

export interface RecapSlide {
  type: RecapSlideType;
  title: string;
  data: any; // Flexible payload for different slide types
}

interface RecapPlayerProps {
  slides: RecapSlide[];
  autoplayDuration?: number; // ms per slide (default 6000ms)
  onClose?: () => void;
}

/**
 * Full-screen Recap Player
 *
 * Immersive, slide-based experience for viewing recap moments.
 * Features:
 * - Full viewport coverage with dark gradient background
 * - Keyboard navigation (arrow keys, Escape)
 * - Auto-play with manual skip
 * - Disables background scroll while open
 * - Minimal UI chrome (only nav controls + close button)
 */
export function RecapPlayer({ slides, autoplayDuration = 6000, onClose }: RecapPlayerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [progress, setProgress] = useState(0);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const totalSlides = slides.length;
  const currentSlideData = slides[currentSlide];

  /**
   * Disable scroll on root when player is open
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
   * Handle slide navigation
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
      // Last slide - optionally restart or close
      // For now, restart from beginning
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

    // Clear existing timer
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
        // Click on empty areas to toggle autoplay
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
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header Controls */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-sm font-medium">
            Slide {currentSlide + 1} of {totalSlides}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all"
          aria-label="Close recap player"
        >
          <X className="w-5 h-5" />
          <span className="text-sm">Exit</span>
        </button>
      </div>

      {/* Main Slide Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Slide Renderer */}
        <div className="w-full h-full flex items-center justify-center animate-in fade-in duration-500">
          <RecapSlideRenderer slide={currentSlideData} />
        </div>

        {/* Navigation Overlays */}
        {/* Left Arrow */}
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

        {/* Right Arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white hover:scale-110 transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Center Play/Pause Indicator */}
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

      {/* Progress Bar */}
      <div className="relative z-10 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-amber-500 to-purple-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Footer Navigation */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-sm border-t border-white/10">
        <div className="text-white/70 text-sm">
          {currentSlideData?.title}
        </div>
        <div className="flex items-center gap-3">
          {/* Slide Dots */}
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
      </div>

      {/* Keyboard Hint */}
      <div className="sr-only">
        Keyboard shortcuts: Arrow Left/Right to navigate, Space to toggle autoplay, Escape to close
      </div>
    </div>
  );
}

/**
 * Render individual slide based on type
 */
function RecapSlideRenderer({ slide }: { slide: RecapSlide }) {
  switch (slide.type) {
    case 'stats':
      return <StatsSlide data={slide.data} />;
    case 'leaderboard':
      return <LeaderboardSlide data={slide.data} />;
    case 'highlights':
      return <HighlightsSlide data={slide.data} />;
    case 'mvp':
      return <MVPSlide data={slide.data} />;
    case 'winner':
      return <WinnerSlide data={slide.data} />;
    case 'summary':
      return <SummarySlide data={slide.data} />;
    default:
      return <DefaultSlide title={slide.title} />;
  }
}

// Slide Components
function StatsSlide({ data }: { data: any }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-6 text-center">
      <h2 className="text-5xl sm:text-6xl font-bold text-white mb-12">{data.title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {data.stats?.map((stat: any, idx: number) => (
          <div
            key={idx}
            className="p-6 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all"
          >
            <p className="text-white/70 text-sm mb-2">{stat.label}</p>
            <p className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardSlide({ data }: { data: any }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-6">
      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8 text-center">{data.title}</h2>
      <div className="space-y-3">
        {data.leaderboard?.map((entry: any, idx: number) => (
          <div
            key={idx}
            className={`flex items-center justify-between p-4 rounded-lg backdrop-blur-sm border transition-all ${
              idx === 0
                ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/30'
                : idx === 1
                  ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30'
                  : idx === 2
                    ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-400/30'
                    : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 font-bold text-white">
                {idx + 1}
              </div>
              <span className="text-white font-semibold">{entry.name}</span>
            </div>
            <span className="text-xl font-bold text-white">{entry.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HighlightsSlide({ data }: { data: any }) {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 text-center">
      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">{data.title}</h2>
      <div className="space-y-4">
        {data.highlights?.map((highlight: string, idx: number) => (
          <div
            key={idx}
            className="p-6 rounded-lg bg-gradient-to-r from-purple-500/20 to-amber-500/20 border border-white/10 backdrop-blur-sm"
          >
            <p className="text-lg sm:text-xl text-white">{highlight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MVPSlide({ data }: { data: any }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-6 text-center">
      <p className="text-white/70 text-lg mb-4">🏆 MVP 🏆</p>
      <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6">{data.name}</h2>
      <div className="inline-block p-8 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 backdrop-blur-sm">
        <p className="text-3xl font-bold text-amber-300 mb-2">{data.points} Points</p>
        <p className="text-white/70">{data.team}</p>
      </div>
    </div>
  );
}

function WinnerSlide({ data }: { data: any }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-6 text-center">
      <div className="mb-8 text-6xl animate-bounce">🎉</div>
      <h2 className="text-5xl sm:text-7xl font-bold text-white mb-4">And the Winner is...</h2>
      <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-purple-600/40 to-amber-600/40 border-2 border-purple-400/50 backdrop-blur-sm">
        <p className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-purple-300 to-amber-300 bg-clip-text text-transparent mb-4">
          {data.name}
        </p>
        <p className="text-2xl text-white/80">{data.event}</p>
      </div>
    </div>
  );
}

function SummarySlide({ data }: { data: any }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-6 text-center">
      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">{data.title}</h2>
      <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-8">{data.message}</p>
      <button
        className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold hover:from-purple-700 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
        onClick={() => {
          // Navigation will be handled by player wrapper
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

function DefaultSlide({ title }: { title: string }) {
  return (
    <div className="text-center">
      <h2 className="text-4xl sm:text-5xl font-bold text-white">{title}</h2>
    </div>
  );
}
