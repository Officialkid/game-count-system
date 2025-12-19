'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles, Trophy, Users } from 'lucide-react';

interface RecapIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayRecap: () => void;
  summary?: {
    gamesPlayed?: number;
    teamsCompeted?: number;
    winnersCount?: number;
    topTeam?: string;
  };
}

/**
 * First-time Recap Introduction Modal
 * 
 * Purpose: Set emotional context for the recap experience
 * Shows only once per user, introduces what recap contains
 * 
 * UX: Subtle fade + scale animation, celebratory tone
 */
export function RecapIntroModal({ isOpen, onClose, onPlayRecap, summary }: RecapIntroModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger entrance animation
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handlePlayRecap = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onPlayRecap();
    }, 200);
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
      style={{
        animation: isAnimating ? 'fadeIn 300ms ease-out forwards' : 'fadeOut 300ms ease-in forwards',
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden transform will-animate"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: isAnimating
            ? 'scaleAndFade 300ms ease-out forwards'
            : 'scaleAndFadeOut 300ms ease-in forwards',
        }}
      >
        <style jsx>{`
          @keyframes scaleAndFade {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes scaleAndFadeOut {
            from {
              opacity: 1;
              transform: scale(1);
            }
            to {
              opacity: 0;
              transform: scale(0.95);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes fadeOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }
        `}</style>
        {/* Header Gradient */}
        <div className="relative h-32 bg-gradient-to-br from-purple-600 via-purple-500 to-amber-500 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-4 right-4 w-40 h-40 rounded-full bg-amber-300/20 blur-3xl" />
          </div>
          <div className="relative h-full flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors flex items-center justify-center border border-white/30"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Content */}
        <div className="p-8 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Your GameScore Recap is Ready 🎉
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Relive your greatest moments and celebrate your journey
          </p>

          {/* Stats Preview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-100">
              <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{summary?.gamesPlayed ?? 0}</p>
              <p className="text-xs text-gray-600 mt-1">Games Played</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-100">
              <Users className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{summary?.teamsCompeted ?? 0}</p>
              <p className="text-xs text-gray-600 mt-1">Teams Competed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-100">
              <Sparkles className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{summary?.winnersCount ?? 0}</p>
              <p className="text-xs text-gray-600 mt-1">Winners Crowned</p>
            </div>
          </div>

          {summary?.topTeam && (
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-amber-50 border border-purple-200">
              <p className="text-sm text-gray-600 text-center">
                MVP Team:{' '}
                <span className="font-semibold text-purple-700">{summary.topTeam}</span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handlePlayRecap}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold hover:from-purple-700 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl"
            >
              Play My Recap ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
