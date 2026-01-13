'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to Your Admin Dashboard!',
    description: 'This quick tutorial will show you how to manage your event and share it with others. You can skip this anytime.',
    targetSelector: '',
    position: 'bottom',
  },
  {
    id: 'admin-link',
    title: '👑 Admin Link',
    description: 'This is YOUR admin link. It gives you full control: add teams, record scores, manage settings, and finalize results. Keep it private!',
    targetSelector: '[data-tutorial="admin-link"]',
    position: 'bottom',
  },
  {
    id: 'scorer-link',
    title: '📝 Scorer Link',
    description: 'Share this link with score keepers! They can enter points but cannot modify teams or settings. Perfect for delegating scoring duties.',
    targetSelector: '[data-tutorial="scorer-link"]',
    position: 'bottom',
  },
  {
    id: 'public-link',
    title: '📺 Public/Live Link',
    description: 'Share this link with participants and spectators! They can view live scores in real-time but cannot make any changes. Great for displays and audiences.',
    targetSelector: '[data-tutorial="public-link"]',
    position: 'bottom',
  },
  {
    id: 'sharing',
    title: '🔗 How Sharing Works',
    description: 'Each link has different permissions: Admin (full control), Scorer (enter scores only), Public (view only). Copy links and share via text, email, or QR code!',
    targetSelector: '[data-tutorial="share-section"]',
    position: 'top',
  },
];

const TUTORIAL_STORAGE_KEY = 'admin-tutorial-completed';

// Export function to reset tutorial
export function resetAdminTutorial() {
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  window.location.reload();
}

export function AdminTutorial() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if tutorial has been completed
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!completed) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setIsVisible(true);
      }, 800);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateSpotlight();
      // Update spotlight on window resize
      window.addEventListener('resize', updateSpotlight);
      return () => window.removeEventListener('resize', updateSpotlight);
    }
  }, [isVisible, currentStep]);

  const updateSpotlight = () => {
    const step = TUTORIAL_STEPS[currentStep];
    if (!step.targetSelector) {
      setSpotlightRect(null);
      return;
    }

    const element = document.querySelector(step.targetSelector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setSpotlightRect(rect);
    } else {
      setSpotlightRect(null);
    }
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      // Center on screen for welcome step
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10002,
      };
    }

    const padding = 20;
    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10002,
    };

    switch (step.position) {
      case 'bottom':
        style.top = spotlightRect.bottom + padding;
        style.left = spotlightRect.left + spotlightRect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'top':
        style.bottom = window.innerHeight - spotlightRect.top + padding;
        style.left = spotlightRect.left + spotlightRect.width / 2;
        style.transform = 'translateX(-50%)';
        break;
      case 'right':
        style.top = spotlightRect.top + spotlightRect.height / 2;
        style.left = spotlightRect.right + padding;
        style.transform = 'translateY(-50%)';
        break;
      case 'left':
        style.top = spotlightRect.top + spotlightRect.height / 2;
        style.right = window.innerWidth - spotlightRect.left + padding;
        style.transform = 'translateY(-50%)';
        break;
    }

    return style;
  };

  return (
    <>
      {/* Overlay with spotlight */}
      <div
        className="fixed inset-0 bg-black transition-opacity duration-300"
        style={{
          zIndex: 10000,
          opacity: 0.75,
        }}
        onClick={handleSkip}
      >
        {/* Spotlight cutout */}
        {spotlightRect && (
          <div
            className="absolute border-4 border-blue-500 rounded-lg animate-pulse"
            style={{
              top: spotlightRect.top - 8,
              left: spotlightRect.left - 8,
              width: spotlightRect.width + 16,
              height: spotlightRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Tutorial tooltip */}
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
        style={{ ...getTooltipStyle(), display: 'flex', flexDirection: 'column', maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar (top) */}
        <div className="h-2 bg-gray-200 rounded-t-xl overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Scrollable content area */}
        <div style={{ padding: 16, overflow: 'auto', maxHeight: '56vh' }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-3">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {step.description}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Close tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-blue-500'
                    : index < currentStep
                    ? 'w-2 bg-blue-300'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Additional content placeholder: target explanation or longer text could go here */}
        </div>

        {/* Fixed footer with navigation buttons */}
        <div style={{ borderTop: '1px solid #eee', padding: 12, background: 'white', position: 'sticky', bottom: 0 }}>
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={handleSkip}
              variant="ghost"
              size="sm"
              className="text-gray-600"
            >
              Skip Tutorial
            </Button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  onClick={handlePrevious}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}

              <Button
                onClick={handleNext}
                size="sm"
                className="flex items-center gap-1"
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? (
                  'Got it!'
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step counter */}
          <p className="text-center text-sm text-gray-500 mt-2">
            Step {currentStep + 1} of {TUTORIAL_STEPS.length}
          </p>
        </div>
      </div>
    </>
  );
}
