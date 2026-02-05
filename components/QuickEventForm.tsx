'use client';

/**
 * Quick Event Form Component
 * Streamlined form for instant event creation
 * Just name + days + teams = DONE
 */

import { useState, FormEvent } from 'react';
import { parseTeamNames, validateQuickEventInput } from '@/lib/quick-event-helpers';

interface QuickEventFormProps {
  onSuccess: (data: any) => void;
  onError?: (error: string) => void;
}

export default function QuickEventForm({ onSuccess, onError }: QuickEventFormProps) {
  const [eventName, setEventName] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [teamNames, setTeamNames] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    try {
      // Parse team names
      const parsedTeams = parseTeamNames(teamNames);

      // Validate input
      const validation = validateQuickEventInput(eventName, numberOfDays, parsedTeams);
      if (!validation.valid) {
        setErrors(validation.errors);
        setIsLoading(false);
        return;
      }

      // Call API
      const response = await fetch('/api/events/quick-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: eventName,
          numberOfDays,
          teamNames: parsedTeams
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create event');
      }

      // Success! Pass data to parent
      onSuccess(data);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create event';
      setErrors([message]);
      if (onError) onError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Count teams as user types
  const teamCount = parseTeamNames(teamNames).length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Name */}
        <div>
          <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-2">
            Event Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Summer Games 2026"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            required
            disabled={isLoading}
            maxLength={100}
          />
          <p className="mt-1 text-sm text-gray-700">
            Give your event a memorable name
          </p>
        </div>

        {/* Number of Days */}
        <div>
          <label htmlFor="numberOfDays" className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <select
            id="numberOfDays"
            value={numberOfDays}
            onChange={(e) => setNumberOfDays(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            disabled={isLoading}
          >
            <option value={1}>Single Day Event (Today)</option>
            <option value={2}>2-Day Event (Today + Tomorrow)</option>
            <option value={3}>3-Day Event (3 Days)</option>
          </select>
          <p className="mt-1 text-sm text-gray-700">
            Quick events start today and auto-cleanup 24 hours after they end
          </p>
        </div>

        {/* Team Names */}
        <div>
          <label htmlFor="teamNames" className="block text-sm font-medium text-gray-700 mb-2">
            Team Names <span className="text-gray-600">(Optional)</span>
          </label>
          <textarea
            id="teamNames"
            value={teamNames}
            onChange={(e) => setTeamNames(e.target.value)}
            placeholder="Team Red, Team Blue, Team Green"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
            disabled={isLoading}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Separate team names with commas
            </p>
            {teamCount > 0 && (
              <p className="text-sm font-medium text-blue-600">
                {teamCount} team{teamCount !== 1 ? 's' : ''} ready
              </p>
            )}
          </div>
          {teamNames && teamCount === 0 && (
            <p className="mt-1 text-sm text-red-500">
              No valid team names detected. Check your comma separators.
            </p>
          )}
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Please fix the following errors:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 mb-1">
                Quick Event Features:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✓ Instant setup - under 30 seconds</li>
                <li>✓ Shareable links for admin, scorers, and viewers</li>
                <li>✓ Add more teams anytime</li>
                <li>✓ Auto-cleanup 24 hours after event ends</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !eventName.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-lg shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Your Event...
            </span>
          ) : (
            <>🚀 Create Event & Start Scoring</>
          )}
        </button>

        {/* Skip Teams Note */}
        {teamCount === 0 && (
          <p className="text-center text-sm text-gray-700">
            Skip teams now? You can add them later from the dashboard.
          </p>
        )}
      </form>
    </div>
  );
}
