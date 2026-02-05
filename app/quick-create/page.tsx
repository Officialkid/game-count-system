'use client';

/**
 * Quick Create Page
 * One-click event creation flow
 * From landing to scoring in under 30 seconds
 */

import { useState } from 'react';
import QuickEventForm from '@/components/QuickEventForm';
import QuickEventSuccess from '@/components/QuickEventSuccess';
import { QuickEventResponse } from '@/lib/quick-event-helpers';

export default function QuickCreatePage() {
  const [eventData, setEventData] = useState<QuickEventResponse | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = (data: QuickEventResponse) => {
    setEventData(data);
    setShowSuccess(true);
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleError = (error: string) => {
    console.error('Quick create error:', error);
    // Error is handled in the form component
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center space-x-2">
              <span className="text-2xl">⚡</span>
              <h1 className="text-2xl font-bold text-gray-900">Quick Event Creator</h1>
            </a>
            <a
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!showSuccess ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span className="text-6xl">⚡</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Create Your Event in Seconds
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                No complex setup. No waiting. Just name your event, add teams, and start scoring.
              </p>
              <div className="mt-6 flex items-center justify-center space-x-8 text-sm text-gray-700">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Under 30 seconds
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Instant shareable links
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  No account needed
                </div>
              </div>
            </div>

            {/* Form */}
            <QuickEventForm onSuccess={handleSuccess} onError={handleError} />

            {/* Features Grid */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-4xl mb-3">🚀</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Setup</h3>
                <p className="text-sm text-gray-600">
                  Create event, generate tokens, and add teams in a single click
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-4xl mb-3">🔗</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Sharing</h3>
                <p className="text-sm text-gray-600">
                  Get shareable links and QR codes for admin, scorers, and viewers
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-4xl mb-3">⏱️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Auto-Cleanup</h3>
                <p className="text-sm text-gray-600">
                  Events automatically delete 24 hours after they end
                </p>
              </div>
            </div>

            {/* Use Cases */}
            <div className="mt-12 bg-white rounded-lg shadow-md p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Perfect For:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">🏀</div>
                  <p className="text-sm font-medium text-gray-700">Tournaments</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">🎮</div>
                  <p className="text-sm font-medium text-gray-700">Game Nights</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">🏕️</div>
                  <p className="text-sm font-medium text-gray-700">Camp Activities</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">🎯</div>
                  <p className="text-sm font-medium text-gray-700">Competitions</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Success View */
          <>
            <QuickEventSuccess data={eventData!} />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-700">
            <p className="mb-2">
              Made with ❤️ for quick and easy event scoring
            </p>
            <p>
              Need advanced features?{' '}
              <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                Try Camp Mode or Advanced Mode
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
