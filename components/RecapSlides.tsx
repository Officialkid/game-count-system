// components/RecapSlides.tsx - Spotify Wrapped-style animated slides
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Share2, Trophy, TrendingUp, Sparkles } from 'lucide-react';

interface RecapSlidesProps {
  totalEvents: number;
  totalGames: number;
  mvpTeam: { team_name: string; total_points: number } | null;
  topTeams: Array<{ rank: number; team_name: string; total_points: number }>;
  biggestComeback?: { team_name: string; comeback: number };
  onShare?: () => void;
}

export function RecapSlides({
  totalEvents,
  totalGames,
  mvpTeam,
  topTeams,
  biggestComeback,
  onShare,
}: RecapSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const slides = [
    // Slide 1: Welcome
    {
      id: 'welcome',
      gradient: 'from-purple-600 via-purple-700 to-purple-900',
      content: (
        <div className="text-center space-y-6 animate-fade-in">
          <Sparkles className="w-16 h-16 mx-auto text-white animate-pulse" />
          <h1 className="text-5xl sm:text-6xl font-black text-white">
            Your GameScore
            <br />
            Wrapped
          </h1>
          <p className="text-xl text-purple-100">
            Let's see what you accomplished
          </p>
        </div>
      ),
    },
    // Slide 2: Total Events
    {
      id: 'total-events',
      gradient: 'from-blue-600 via-blue-700 to-blue-900',
      content: (
        <div className="text-center space-y-6 animate-fade-in">
          <p className="text-2xl text-blue-100 font-medium">You hosted</p>
          <div className="relative">
            <div className="text-9xl font-black text-white animate-count-up">
              {totalEvents}
            </div>
            <div className="absolute inset-0 bg-white opacity-10 blur-3xl rounded-full"></div>
          </div>
          <p className="text-3xl text-blue-100 font-semibold">
            {totalEvents === 1 ? 'Event' : 'Events'}
          </p>
        </div>
      ),
    },
    // Slide 3: Total Games
    {
      id: 'total-games',
      gradient: 'from-amber-600 via-amber-700 to-amber-900',
      content: (
        <div className="text-center space-y-6 animate-fade-in">
          <p className="text-2xl text-amber-100 font-medium">And ran</p>
          <div className="relative">
            <div className="text-9xl font-black text-white animate-count-up">
              {totalGames}
            </div>
            <div className="absolute inset-0 bg-white opacity-10 blur-3xl rounded-full"></div>
          </div>
          <p className="text-3xl text-amber-100 font-semibold">
            {totalGames === 1 ? 'Game' : 'Games'}
          </p>
        </div>
      ),
    },
    // Slide 4: MVP Team
    mvpTeam && {
      id: 'mvp',
      gradient: 'from-green-600 via-green-700 to-green-900',
      content: (
        <div className="text-center space-y-8 animate-fade-in">
          <Trophy className="w-20 h-20 mx-auto text-yellow-300 animate-bounce-slow" />
          <div>
            <p className="text-2xl text-green-100 font-medium mb-4">MVP Team</p>
            <h2 className="text-5xl sm:text-6xl font-black text-white mb-3">
              {mvpTeam.team_name}
            </h2>
            <p className="text-3xl text-green-100">
              {mvpTeam.total_points.toLocaleString()} points
            </p>
          </div>
        </div>
      ),
    },
    // Slide 5: Top 3 Countdown (Reverse order)
    topTeams.length >= 3 && {
      id: 'top-3-countdown',
      gradient: 'from-pink-600 via-pink-700 to-pink-900',
      content: (
        <div className="text-center space-y-8 animate-fade-in">
          <p className="text-2xl text-pink-100 font-medium">Top Teams</p>
          <div className="space-y-6">
            {[...topTeams].slice(0, 3).reverse().map((team, idx) => {
              const actualRank = 3 - idx;
              return (
                <div
                  key={team.rank}
                  className="transform transition-all duration-500 animate-slide-up"
                  style={{ animationDelay: `${idx * 200}ms` }}
                >
                  <div className="flex items-center justify-center gap-4 px-8 py-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <span className="text-4xl font-black text-white">#{actualRank}</span>
                    <div className="text-left flex-1">
                      <p className="text-2xl font-bold text-white">{team.team_name}</p>
                      <p className="text-pink-100">{team.total_points} pts</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    // Slide 6: Biggest Comeback (if available)
    biggestComeback && {
      id: 'comeback',
      gradient: 'from-red-600 via-red-700 to-red-900',
      content: (
        <div className="text-center space-y-8 animate-fade-in">
          <TrendingUp className="w-20 h-20 mx-auto text-white animate-pulse" />
          <div>
            <p className="text-2xl text-red-100 font-medium mb-4">Biggest Comeback</p>
            <h2 className="text-5xl sm:text-6xl font-black text-white mb-3">
              {biggestComeback.team_name}
            </h2>
            <p className="text-3xl text-red-100">
              +{biggestComeback.comeback} point surge!
            </p>
          </div>
        </div>
      ),
    },
    // Slide 7: Share
    {
      id: 'share',
      gradient: 'from-purple-600 via-purple-700 to-purple-900',
      content: (
        <div className="text-center space-y-8 animate-fade-in">
          <Share2 className="w-16 h-16 mx-auto text-white" />
          <div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Share Your Recap
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Show off your tournament highlights
            </p>
            <button
              onClick={onShare}
              className="px-8 py-4 bg-white text-purple-700 font-bold text-lg rounded-full hover:scale-105 transition-transform shadow-lg"
            >
              Share Recap
            </button>
          </div>
        </div>
      ),
    },
  ].filter(Boolean) as any[];

  // Auto-play slides
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // 4 seconds per slide
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  // Trigger confetti on MVP slide
  useEffect(() => {
    if (slides[currentSlide]?.id === 'mvp') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [currentSlide, slides]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && <ConfettiEffect />}

      {/* Slide Background with Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.gradient} transition-all duration-700`}
      />

      {/* Slide Content */}
      <div className="relative z-10 h-full flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          {currentSlideData.content}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-20">
        <div className="max-w-4xl mx-auto px-8 flex items-center justify-between">
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Progress Dots */}
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentSlide(idx);
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Slide Counter */}
      <div className="absolute top-8 right-8 z-20 text-white/60 font-medium">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
}

// Lightweight confetti component
function ConfettiEffect() {
  useEffect(() => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '100%';
    container.style.height = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';

    const colors = ['#9333ea', '#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#ec4899'];
    const count = 80;
    
    for (let i = 0; i < count; i++) {
      const conf = document.createElement('div');
      const size = Math.random() * 10 + 5;
      conf.style.width = `${size}px`;
      conf.style.height = `${size * 0.6}px`;
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.position = 'absolute';
      conf.style.left = `${Math.random() * 100}%`;
      conf.style.top = '0';
      conf.style.opacity = '0.9';
      conf.style.transform = `rotate(${Math.random() * 360}deg)`;
      conf.style.borderRadius = '2px';
      conf.style.transition = 'transform 1.5s ease, top 1.5s ease, opacity 1.5s ease';
      conf.style.willChange = 'transform, opacity';
      container.appendChild(conf);

      requestAnimationFrame(() => {
        conf.style.top = `${30 + Math.random() * 50}%`;
        conf.style.transform = `translate3d(${(Math.random() - 0.5) * 200}px, ${Math.random() * 300}px, 0) rotate(${Math.random() * 720}deg)`;
        conf.style.opacity = '0';
      });
    }
    
    document.body.appendChild(container);
    const timeout = setTimeout(() => container.remove(), 1600);
    
    return () => {
      clearTimeout(timeout);
      container.remove();
    };
  }, []);

  return null;
}
