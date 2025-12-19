"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
// Server sync disabled for session-based auth diagnostics

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
}

interface TutorialStatus {
  completed: boolean;
  step: number;
}

const LOCAL_STORAGE_KEY = 'gcs_onboarding_status_v1';

const tutorialSteps: TutorialStep[] = [
  {
    id: 'create-event',
    title: 'Create an event',
    description: 'Start by launching the event wizard. You can add teams and set rules in a few clicks.',
    targetSelector: '[data-tour="create-event"]',
  },
  {
    id: 'event-card',
    title: 'Dashboard event card',
    description: 'Each card shows status, teams, and quick actions. Open one to manage scoring.',
    targetSelector: '[data-tour="event-card"]',
  },
  {
    id: 'score-entry',
    title: 'Score entry',
    description: 'Use Add Score inside an event to log points for each game or round.',
    targetSelector: '[data-tour="add-score-button"]',
  },
  {
    id: 'recap-feature',
    title: 'Recap highlights',
    description: 'Visit Recap to see wrapped-style highlights once an event is completed.',
    targetSelector: '[data-tour="recap-feature"]',
  },
];

function readLocalStatus(): TutorialStatus {
  if (typeof window === 'undefined') return { completed: false, step: 0 };
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return { completed: false, step: 0 };
    const parsed = JSON.parse(saved);
    return {
      completed: Boolean(parsed.completed),
      step: Number.isFinite(parsed.step) ? Math.max(0, Math.min(parsed.step, tutorialSteps.length - 1)) : 0,
    };
  } catch (error) {
    console.warn('Failed to read onboarding status:', error);
    return { completed: false, step: 0 };
  }
}

async function persistStatus(status: TutorialStatus, isAuthenticated: boolean) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(status));
  } catch (error) {
    console.warn('Failed to persist onboarding status locally:', error);
  }
  // In Appwrite session mode, skip server sync on client
}

export function OnboardingTutorial() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<TutorialStatus>({ completed: false, step: 0 });
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const currentStep = useMemo(() => tutorialSteps[status.step] || tutorialSteps[0], [status.step]);
  const progress = ((status.step + 1) / tutorialSteps.length) * 100;

  // Load persisted status (local first, server if available)
  useEffect(() => {
    const local = readLocalStatus();
    setStatus(local);

    const fetchServerStatus = async () => {
      // Skip server sync in diagnostics phase; rely on local state
      setLoaded(true);
    };

    fetchServerStatus();
  }, [isAuthenticated]);

  // Auto-open when not completed
  useEffect(() => {
    if (!loaded) return;
    if (!isAuthenticated) return;
    const onDashboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard');
    if (onDashboard && !status.completed) {
      setIsOpen(true);
    }
  }, [loaded, isAuthenticated, status.completed]);

  // Allow external launcher
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      setStatus((prev) => ({ ...prev, completed: false, step: prev.step || 0 }));
    };
    window.addEventListener('onboarding:start', handler as EventListener);
    return () => window.removeEventListener('onboarding:start', handler as EventListener);
  }, []);

  // Trap scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // Track target element for highlight
  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const selector = currentStep.targetSelector;
    if (!selector) {
      setTargetRect(null);
      return;
    }

    const computeRect = () => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        setTargetRect(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    };

    computeRect();
    window.addEventListener('resize', computeRect);
    window.addEventListener('scroll', computeRect, true);
    return () => {
      window.removeEventListener('resize', computeRect);
      window.removeEventListener('scroll', computeRect, true);
    };
  }, [isOpen, currentStep.targetSelector]);

  const updateStatus = useCallback(
    (next: TutorialStatus) => {
      setStatus(next);
      persistStatus(next, isAuthenticated);
    },
    [isAuthenticated]
  );

  const handleNext = () => {
    if (status.step >= tutorialSteps.length - 1) {
      updateStatus({ completed: true, step: tutorialSteps.length - 1 });
      setIsOpen(false);
      return;
    }
    const nextStep = status.step + 1;
    updateStatus({ completed: false, step: nextStep });
  };

  const handleBack = () => {
    if (status.step === 0) return;
    const prevStep = Math.max(0, status.step - 1);
    updateStatus({ completed: false, step: prevStep });
  };

  const handleSkip = () => {
    updateStatus({ completed: true, step: status.step });
    setIsOpen(false);
  };

  const handleRestart = () => {
    const next = { completed: false, step: 0 };
    updateStatus(next);
    setIsOpen(true);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleRestart}
        className="fixed bottom-6 right-6 z-40 px-3 py-2 rounded-full bg-white border border-gray-200 shadow-md text-sm font-medium text-primary-700 hover:bg-primary-50"
        aria-label="Show onboarding tutorial"
      >
        Show Tutorial
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <div className="absolute inset-0 bg-black/40" />

      {targetRect && (
        <div
          className="absolute border-2 border-primary-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          aria-label={`Highlight for ${currentStep.title}`}
        />
      )}

      <div className="fixed bottom-6 right-6 max-w-md w-[90vw] sm:w-96 bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 pointer-events-auto">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Step {status.step + 1} of {tutorialSteps.length}</div>
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-purple-600 to-amber-500" style={{ width: `${progress}%` }} />
          </div>
          <h3 className="text-lg font-semibold text-primary-700 mb-1">{currentStep.title}</h3>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">{currentStep.description}</p>
          <div className="flex justify-between items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={status.step === 0}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 text-white font-medium shadow hover:shadow-lg transition"
            >
              {status.step === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
