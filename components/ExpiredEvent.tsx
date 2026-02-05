'use client';

import { useState } from 'react';
import { Button, Card, CardContent } from '@/components/ui';
import { Clock } from 'lucide-react';
import { WaitlistSignup } from '@/components/WaitlistSignup';

interface ExpiredEventProps {
  title?: string;
  message?: string;
  showWaitlist?: boolean;
}

export function ExpiredEvent({ 
  title = "This Event Has Expired",
  message = "This event has ended and is no longer accessible. Events are automatically removed after their scheduled duration to keep our platform running smoothly.",
  showWaitlist = true 
}: ExpiredEventProps) {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          {!showSignup ? (
            <>
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-purple-600" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                {title}
              </h1>

              {/* Message */}
              <p className="text-gray-600 leading-relaxed mb-6 text-center">
                {message}
              </p>

              {/* Waitlist CTA */}
              {showWaitlist && (
                <>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Want Longer Event Storage?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Join the waitlist for our Pro version with extended event storage, advanced analytics, and unlimited teams.
                    </p>
                    <Button
                      onClick={() => setShowSignup(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Join Pro Waitlist
                    </Button>
                  </div>

                  <p className="text-xs text-gray-700 text-center">
                    Or <a href="/" className="text-purple-600 hover:text-purple-700 font-medium">create a new event</a> to get started
                  </p>
                </>
              )}

              {!showWaitlist && (
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="secondary"
                  className="w-full"
                >
                  Create New Event
                </Button>
              )}
            </>
          ) : (
            <>
              <WaitlistSignup
                source="expired-event"
                onSuccess={() => {
                  // Keep showing success state, option to go back
                  setTimeout(() => setShowSignup(false), 3000);
                }}
                title="Join Pro Waitlist"
                description="Be the first to know when premium features, event restoration, and advanced analytics launch."
              />
              <button
                onClick={() => setShowSignup(false)}
                className="w-full mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function EventNotFoundError({ 
  title = "Event Not Found",
  message = "We couldn't find the event you're looking for. The link may be incorrect or the event may have been removed."
}: { title?: string; message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="text-6xl mb-4">🔍</div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {title}
          </h1>

          {/* Message */}
          <p className="text-gray-600 leading-relaxed mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Create New Event
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="secondary"
              className="w-full"
            >
              Go Back
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-700 mt-6">
            Double-check your link or contact the event organizer for the correct URL
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
