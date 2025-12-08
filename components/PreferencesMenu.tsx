// components/PreferencesMenu.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { soundManager } from '@/lib/sound';

export function PreferencesMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [confettiEnabled, setConfettiEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Load preferences
    if (typeof window !== 'undefined') {
      const soundPref = localStorage.getItem('sound_enabled');
      const confettiPref = localStorage.getItem('confetti_enabled');
      
      setSoundEnabled(soundPref === null || soundPref === 'true');
      setConfettiEnabled(confettiPref === null || confettiPref === 'true');
    }

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('sound_enabled', String(newValue));
    soundManager?.setEnabled(newValue);
    
    // Play test sound if enabling
    if (newValue) {
      soundManager?.playSuccess();
    }
  };

  const toggleConfetti = () => {
    const newValue = !confettiEnabled;
    setConfettiEnabled(newValue);
    localStorage.setItem('confetti_enabled', String(newValue));
  };

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Preferences"
        title="Preferences"
      >
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Preferences</h3>
          </div>

          {/* Sound Toggle */}
          <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔊</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Sound Effects
                  </div>
                  <div className="text-xs text-gray-500">
                    Play sounds on actions
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  soundEnabled ? 'bg-primary-600' : 'bg-gray-300'
                }`}
                aria-label="Toggle sound effects"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Confetti Toggle */}
          <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Confetti
                  </div>
                  <div className="text-xs text-gray-500">
                    Celebrate big scores
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleConfetti}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  confettiEnabled ? 'bg-primary-600' : 'bg-gray-300'
                }`}
                aria-label="Toggle confetti"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    confettiEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
