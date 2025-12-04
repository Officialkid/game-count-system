// components/EventSetupWizard.tsx
// FIXED: Added visual progress stepper indicator (UI-DEBUG-REPORT Issue #11)
// ENHANCED: Added color palette selector and logo upload for event branding
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button, Input, Card, ColorPaletteSelector, LogoUpload } from '@/components';

interface TeamInput {
  id: string;
  name: string;
  avatar_url: string;
}

interface EventSetupWizardProps {
  onComplete?: (eventId: string) => void;
}

// Progress Stepper Component
function ProgressStepper({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = [
    { number: 1, label: 'Event Details' },
    { number: 2, label: 'Add Teams' },
  ];

  return (
    <div className="mb-8" role="navigation" aria-label="Event creation progress">
      {/* Step Indicator Text */}
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4 font-medium">
        Step {currentStep} of {totalSteps}
      </p>
      
      {/* Visual Stepper */}
      <div className="flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step.number === currentStep
                    ? 'bg-primary-600 dark:bg-primary-500 text-white ring-4 ring-primary-200 dark:ring-primary-900/50'
                    : step.number < currentStep
                    ? 'bg-green-500 dark:bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
                aria-current={step.number === currentStep ? 'step' : undefined}
              >
                {step.number < currentStep ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <p
                className={`mt-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                  step.number === currentStep
                    ? 'text-primary-600 dark:text-primary-400'
                    : step.number < currentStep
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.label}
              </p>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-1 mx-2 transition-all ${
                  step.number < currentStep
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventSetupWizard({ onComplete }: EventSetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Event Details
  const [eventName, setEventName] = useState('');
  const [brandColor, setBrandColor] = useState('purple'); // Palette ID
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [allowNegative, setAllowNegative] = useState(false);
  const [displayMode, setDisplayMode] = useState<'cumulative' | 'per_day'>('cumulative');
  const [numTeams, setNumTeams] = useState(3);

  // Step 2: Team Names
  const [teams, setTeams] = useState<TeamInput[]>([
    { id: '1', name: '', avatar_url: '' },
    { id: '2', name: '', avatar_url: '' },
    { id: '3', name: '', avatar_url: '' },
  ]);
  const [createdEventId, setCreatedEventId] = useState('');

  const handleAddTeam = () => {
    if (teams.length < 20) {
      setTeams([...teams, { id: Date.now().toString(), name: '', avatar_url: '' }]);
    }
  };

  const handleRemoveTeam = (id: string) => {
    if (teams.length > 2) {
      setTeams(teams.filter(t => t.id !== id));
    }
  };

  const handleTeamChange = (id: string, field: 'name' | 'avatar_url', value: string) => {
    setTeams(teams.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const generateAvatar = (teamName: string) => {
    const seed = teamName.toLowerCase().replace(/\s+/g, '-');
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}`;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Only accept http/https URLs under 500 chars. Drop data: URLs to avoid validation errors.
      const isHttpUrl = (u: string) => /^https?:\/\//i.test(u);
      const safeLogoUrl = logoUrl && isHttpUrl(logoUrl) && logoUrl.length <= 500 ? logoUrl : null;

      const response = await apiClient.post('/api/events/create', {
        event_name: eventName,
        theme_color: brandColor,
        logo_url: safeLogoUrl,
        allow_negative: allowNegative,
        display_mode: displayMode,
        num_teams: numTeams,
      });
      const result = await response.json();

      if (result.success && result.data?.event) {
        setCreatedEventId(result.data.event.id);
        
        // Initialize teams array based on num_teams
        const initialTeams: TeamInput[] = [];
        for (let i = 1; i <= numTeams; i++) {
          initialTeams.push({
            id: i.toString(),
            name: '',
            avatar_url: '',
          });
        }
        setTeams(initialTeams);
        
        setStep(2);
      } else {
        setError(result.error || 'Failed to create event');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Event creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate all team names are filled
      const emptyTeams = teams.filter(t => !t.name.trim());
      if (emptyTeams.length > 0) {
        setError('Please fill in all team names');
        setLoading(false);
        return;
      }

      // Create all teams (parse JSON results)
      const teamPromises = teams.map(async team => {
        const response = await apiClient.post('/api/teams/add', {
          event_id: createdEventId,
          team_name: team.name.trim(),
          avatar_url: team.avatar_url || generateAvatar(team.name),
        });
        try {
          const json = await response.json();
          return json;
        } catch (e) {
          return { success: false, error: 'Invalid server response' };
        }
      });

      const results = await Promise.all(teamPromises);

      const failedTeams = results.filter(r => !r?.success);
      if (failedTeams.length > 0) {
        setError(`Failed to create ${failedTeams.length} team(s)`);
        setLoading(false);
        return;
      }

      // Success! Redirect to event page
      if (onComplete) {
        onComplete(createdEventId);
      } else {
        router.push(`/event/${createdEventId}`);
      }
    } catch (err) {
      setError('An unexpected error occurred while creating teams');
      console.error('Team creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <Card className="max-w-2xl mx-auto dark:bg-gray-800 dark:border-gray-700">
        <ProgressStepper currentStep={1} totalSteps={2} />
        <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-400">Create New Event</h2>
        
        <form onSubmit={handleStep1Submit} className="space-y-6">
          {/* Event Name */}
          <div>
            <label htmlFor="event-name" className="block text-sm font-medium mb-2">
              Event Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="event-name"
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., Jewels Bootcamp Q4 2025"
              required
              aria-required="true"
              aria-label="Event name"
            />
          </div>

          {/* Number of Teams */}
          <div>
            <label htmlFor="num-teams" className="block text-sm font-medium mb-2">
              Number of Teams <span className="text-red-500">*</span>
            </label>
            <Input
              id="num-teams"
              type="number"
              min="2"
              max="20"
              value={numTeams}
              onChange={(e) => setNumTeams(Number(e.target.value))}
              required
              aria-required="true"
              aria-label="Number of teams"
            />
            <p className="text-xs text-gray-500 mt-1">Choose between 2 and 20 teams</p>
          </div>

          {/* Event Theme Color */}
          <ColorPaletteSelector
            selectedPalette={brandColor}
            onChange={setBrandColor}
            label="Event Theme Color"
          />

          {/* Event Logo (Optional) */}
          <LogoUpload
            currentLogoUrl={logoUrl}
            onLogoChange={(file, previewUrl) => {
              setLogoFile(file);
              setLogoUrl(previewUrl || '');
            }}
            label="Event Logo (Optional)"
            maxSizeMB={10}
          />

          {/* Allow Negative Points */}
          <div className="flex items-center gap-3">
            <input
              id="allow-negative"
              type="checkbox"
              checked={allowNegative}
              onChange={(e) => setAllowNegative(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              aria-label="Allow negative points"
            />
            <label htmlFor="allow-negative" className="text-sm font-medium">
              Allow Negative Points
            </label>
          </div>

          {/* Display Mode */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Display Mode
            </label>
            <div className="space-y-2" role="radiogroup" aria-label="Score display mode">
              <div className="flex items-center gap-3">
                <input
                  id="mode-cumulative"
                  type="radio"
                  name="display_mode"
                  value="cumulative"
                  checked={displayMode === 'cumulative'}
                  onChange={(e) => setDisplayMode(e.target.value as 'cumulative')}
                  className="w-4 h-4 text-primary-600"
                  aria-label="Cumulative mode"
                />
                <label htmlFor="mode-cumulative" className="text-sm">
                  Cumulative (Show running totals)
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="mode-per-day"
                  type="radio"
                  name="display_mode"
                  value="per_day"
                  checked={displayMode === 'per_day'}
                  onChange={(e) => setDisplayMode(e.target.value as 'per_day')}
                  className="w-4 h-4 text-primary-600"
                  aria-label="Per day mode"
                />
                <label htmlFor="mode-per-day" className="text-sm">
                  Per Day (Show daily scores)
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button type="submit" disabled={loading} aria-label="Continue to team setup">
              {loading ? 'Creating...' : 'Next: Add Teams'}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // Step 2: Team Names
  return (
    <Card className="max-w-2xl mx-auto dark:bg-gray-800 dark:border-gray-700">
      <ProgressStepper currentStep={2} totalSteps={2} />
      <h2 className="text-2xl font-bold mb-2 text-primary-700 dark:text-primary-400">Add Teams</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Event: <strong className="dark:text-gray-200">{eventName}</strong> • {numTeams} teams
      </p>

      <form onSubmit={handleStep2Submit} className="space-y-6">
        <div className="space-y-3">
          {teams.map((team, index) => (
            <div key={team.id} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 w-8">#{index + 1}</span>
              <Input
                type="text"
                value={team.name}
                onChange={(e) => handleTeamChange(team.id, 'name', e.target.value)}
                placeholder={`Team ${index + 1} name`}
                required
                className="flex-1"
                aria-label={`Team ${index + 1} name`}
                aria-required="true"
              />
              {teams.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRemoveTeam(team.id)}
                  className="text-red-600 hover:bg-red-50"
                  aria-label={`Remove team ${index + 1}`}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>

        {teams.length < 20 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTeam}
            className="w-full"
            aria-label="Add another team"
          >
            + Add Another Team
          </Button>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" role="alert">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(1)}
            disabled={loading}
            aria-label="Go back to event details"
          >
            Back
          </Button>
          <Button type="submit" disabled={loading} aria-label="Create event with teams">
            {loading ? 'Creating Teams...' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
