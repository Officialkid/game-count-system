// components/EventSetupWizard.tsx
// FIXED: Added visual progress stepper indicator (UI-DEBUG-REPORT Issue #11)
// ENHANCED: Added color palette selector and logo upload for event branding
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsService, teamsService } from '@/lib/services';
import { useAuth } from '@/lib/auth-context';
import { useSubmissionLock } from '@/lib/hooks/useSubmissionLock';
import { Button, Input, Card, ColorPaletteSelector } from '@/components';

interface TeamInput {
  id: string;
  name: string;
  // avatar removed for MVP
  // avatar_url: string;
  isValidating?: boolean;
  isDuplicate?: boolean;
  suggestions?: string[];
}

interface EventSetupWizardProps {
  onComplete?: (eventId: string) => void;
  onCancel?: () => void;
  editEventId?: string;
  initialData?: {
    id: string;
    event_name: string;
    start_date?: string | null;
    end_date?: string | null;
    theme_color?: string;
    // logo removed for MVP
    // logo_url?: string;
    allow_negative?: boolean;
    display_mode?: 'cumulative' | 'per_day';
    team_count?: number;
  };
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
      <p className="text-sm text-gray-600 text-center mb-4 font-medium">
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
                    ? 'bg-primary-600 text-white ring-4 ring-primary-200'
                    : step.number < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
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
                    ? 'text-primary-600'
                    : step.number < currentStep
                    ? 'text-green-600'
                    : 'text-gray-500'
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
                    ? 'bg-green-500'
                    : 'bg-gray-200'
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

export function EventSetupWizard({ onComplete, onCancel, editEventId, initialData }: EventSetupWizardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { lock: lockStep1, unlock: unlockStep1, isSubmitting: isStep1Submitting } = useSubmissionLock();
  const { lock: lockStep2, unlock: unlockStep2, isSubmitting: isStep2Submitting } = useSubmissionLock();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isEditMode = !!editEventId;

  // Step 1: Event Details - Initialize with edit data if available
  const [eventName, setEventName] = useState(initialData?.event_name || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [endDate, setEndDate] = useState(initialData?.end_date || '');
  const [brandColor, setBrandColor] = useState(initialData?.theme_color || 'purple'); // Palette ID
  // Branding logo removed for MVP stability
  const [allowNegative, setAllowNegative] = useState(initialData?.allow_negative || false);
  const [displayMode, setDisplayMode] = useState<'cumulative' | 'per_day'>(initialData?.display_mode || 'cumulative');
  const [numTeams, setNumTeams] = useState(initialData?.team_count || 3);

  // Step 2: Team Names
  const [teams, setTeams] = useState<TeamInput[]>([
    { id: '1', name: '' },
    { id: '2', name: '' },
    { id: '3', name: '' },
  ]);
  const [createdEventId, setCreatedEventId] = useState('');

  const handleAddTeam = () => {
    if (teams.length < 20) {
      setTeams([...teams, { id: Date.now().toString(), name: '' }]);
    }
  };

  const handleRemoveTeam = (id: string) => {
    if (teams.length > 2) {
      setTeams(teams.filter(t => t.id !== id));
    }
  };

  const handleTeamChange = (id: string, field: 'name', value: string) => {
    setTeams(teams.map(t => t.id === id ? { ...t, [field]: value } : t));
    
    // Trigger duplicate check for team names
    if (field === 'name' && value.trim()) {
      checkTeamNameAvailability(id, value.trim());
    }
  };

  // Debounced duplicate check
  const checkTeamNameAvailability = async (teamId: string, teamName: string) => {
    // Mark as validating
    setTeams(prev => prev.map(t => 
      t.id === teamId ? { ...t, isValidating: true, isDuplicate: false, suggestions: [] } : t
    ));

    // Check for client-side duplicates first (within current form)
    const localDuplicates = teams.filter(t => 
      t.id !== teamId && t.name.trim().toLowerCase() === teamName.toLowerCase()
    );
    
    if (localDuplicates.length > 0) {
      setTeams(prev => prev.map(t => 
        t.id === teamId ? { 
          ...t, 
          isValidating: false, 
          isDuplicate: true,
          suggestions: [`${teamName} 2`, `${teamName} (2)`, `${teamName} Alpha`]
        } : t
      ));
      return;
    }

    // Debounce server check
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      if (!createdEventId) {
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, isValidating: false } : t));
        return;
      }
      const result = await teamsService.checkTeamName(createdEventId, teamName);
      if (result.success && (result as any).data) {
        setTeams(prev => prev.map(t => 
          t.id === teamId ? {
            ...t,
            isValidating: false,
            isDuplicate: !(result as any).data.available,
            suggestions: (result as any).data.suggestions || []
          } : t
        ));
      } else {
        // Clear validation state on error
        setTeams(prev => prev.map(t => 
          t.id === teamId ? { ...t, isValidating: false, isDuplicate: false, suggestions: [] } : t
        ));
      }
    } catch (error) {
      console.error('Error checking team name:', error);
      setTeams(prev => prev.map(t => 
        t.id === teamId ? { ...t, isValidating: false, isDuplicate: false, suggestions: [] } : t
      ));
    }
  };

  // avatar generation removed for MVP

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (!lockStep1()) return;
    
    setError('');
    setLoading(true);

    try {
      // Only accept http/https URLs under 500 chars. Drop data: URLs to avoid validation errors.
      const eventData = {
        event_name: eventName,
        start_date: startDate || null,
        end_date: endDate || null,
        theme_color: brandColor,
        allow_negative: allowNegative,
        display_mode: displayMode,
        num_teams: numTeams,
      };

      let createdId = '';

      if (isEditMode && editEventId) {
        // Update existing event
        const result = await eventsService.updateEvent(editEventId, {
          event_name: eventData.event_name,
          theme_color: eventData.theme_color || undefined,
          allow_negative: eventData.allow_negative,
          display_mode: (eventData as any).display_mode === 'per_day' ? 'cumulative' : (eventData as any).display_mode,
          num_teams: eventData.num_teams || undefined,
        });

        if (result.success && result.data) {
          // In edit mode, we can skip to completion or load teams for step 2
          // For now, let's complete the edit after step 1
          setCreatedEventId(editEventId);
          
          // Load existing teams if any
          const teamsData = await teamsService.getTeams(editEventId);
          if (teamsData.success && teamsData.data?.teams) {
            const existingTeams: TeamInput[] = (teamsData.data.teams as any[]).map((t: any, idx: number) => ({
              id: t.id || (idx + 1).toString(),
              name: t.team_name || '',
            }));
            setTeams(existingTeams);
          } else {
            // No existing teams, initialize empty ones
            const initialTeams: TeamInput[] = [];
            for (let i = 1; i <= numTeams; i++) {
              initialTeams.push({
                id: i.toString(),
                name: '',
              });
            }
            setTeams(initialTeams);
          }
          
          setStep(2);
        } else {
          setError(result.error || 'Failed to update event');
        }
      } else {
        // Create new event
        if (!user?.id) throw new Error('Not authenticated');
        const result = await eventsService.createEvent(user.id, {
          event_name: eventData.event_name,
          theme_color: eventData.theme_color || undefined,
          allow_negative: !!eventData.allow_negative,
          display_mode: (eventData as any).display_mode === 'per_day' ? 'cumulative' : (eventData as any).display_mode,
          num_teams: eventData.num_teams || 3,
          status: 'active',
        });

        if (result.success && result.data?.event) {
          createdId = result.data.event.$id;
          setCreatedEventId(createdId);
          
          // Initialize teams array based on num_teams
          const initialTeams: TeamInput[] = [];
          for (let i = 1; i <= numTeams; i++) {
            initialTeams.push({
              id: i.toString(),
              name: '',
            });
          }
          setTeams(initialTeams);
          
          setStep(2);
        } else {
          setError(result.error || 'Failed to create event');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Event creation/update error:', err);
      unlockStep1();
    } finally {
      setLoading(false);
      unlockStep1();
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (!lockStep2()) return;
    
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

      // Check for duplicate team names
      const duplicateTeams = teams.filter(t => t.isDuplicate);
      if (duplicateTeams.length > 0) {
        setError('Please resolve duplicate team names before continuing');
        setLoading(false);
        return;
      }

      // Check for client-side duplicates (case-insensitive)
      const nameMap = new Map<string, number>();
      for (const team of teams) {
        const lowerName = team.name.trim().toLowerCase();
        nameMap.set(lowerName, (nameMap.get(lowerName) || 0) + 1);
      }
      const hasDuplicates = Array.from(nameMap.values()).some(count => count > 1);
      if (hasDuplicates) {
        setError('Multiple teams have the same name. Please use unique names.');
        setLoading(false);
        return;
      }

      // Create all teams via Appwrite
      const results = await Promise.all(
        teams.map(async team => {
          const resp = await teamsService.createTeam(user?.id || '', {
            event_id: createdEventId,
            team_name: team.name.trim(),
          } as any);
          return resp;
        })
      );

      const failedTeams = results.filter(r => !r?.success);
      if (failedTeams.length > 0) {
        // Check if any failures were due to duplicates
        const duplicateErrors = failedTeams.filter(r => 
          r?.error && typeof r.error === 'string' && r.error.includes('already exists')
        );
        
        if (duplicateErrors.length > 0) {
          setError('Duplicate team names detected. Please use unique names for all teams.');
          
          // Mark teams as duplicates in the UI
          for (let i = 0; i < results.length; i++) {
            const result = results[i] as any;
            if (!result?.success) {
              const teamId = teams[i].id;
              setTeams(prev => prev.map(t => 
                t.id === teamId ? {
                  ...t,
                  isDuplicate: true,
                  suggestions: []
                } : t
              ));
            }
          }
        } else {
          setError(`Failed to create ${failedTeams.length} team(s). Please try again.`);
        }
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
      unlockStep2();
    } finally {
      setLoading(false);
      unlockStep2();
    }
  };

  if (step === 1) {
    return (
      <Card className="max-w-2xl mx-auto">
        <ProgressStepper currentStep={1} totalSteps={2} />
        <h2 className="text-2xl font-bold mb-6 text-primary-700">{isEditMode ? 'Edit Event' : 'Create New Event'}</h2>
        
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

          {/* Event Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium mb-2">
                Start Date (Optional)
              </label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="Event start date"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium mb-2">
                End Date (Optional)
              </label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                aria-label="Event end date"
              />
              {startDate && endDate && new Date(endDate) < new Date(startDate) && (
                <p className="text-xs text-red-500 mt-1">End date must be after start date</p>
              )}
            </div>
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
          {/* Logo upload removed for MVP */}

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
            <Button type="submit" disabled={loading || isStep1Submitting} aria-label="Continue to team setup">
              {isStep1Submitting ? 'Creating...' : loading ? 'Creating...' : 'Next: Add Teams'}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // Step 2: Team Names
  return (
    <Card className="max-w-2xl mx-auto">
      <ProgressStepper currentStep={2} totalSteps={2} />
      <h2 className="text-2xl font-bold mb-2 text-primary-700">Add Teams</h2>
      <p className="text-sm text-gray-600 mb-6">
        Event: <strong>{eventName}</strong> • {numTeams} teams
      </p>

      <form onSubmit={handleStep2Submit} className="space-y-6">
        <div className="space-y-4">
          {teams.map((team, index) => (
            <div key={team.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 w-8">#{index + 1}</span>
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    value={team.name}
                    onChange={(e) => handleTeamChange(team.id, 'name', e.target.value)}
                    placeholder={`Team ${index + 1} name`}
                    required
                    data-tour={index === 0 ? 'team-name-input' : undefined}
                    className={`pr-10 ${
                      team.isDuplicate 
                        ? 'border-red-500 focus:ring-red-500' 
                        : team.name.trim() && !team.isValidating && !team.isDuplicate
                        ? 'border-green-500 focus:ring-green-500'
                        : ''
                    }`}
                    aria-label={`Team ${index + 1} name`}
                    aria-required="true"
                    aria-invalid={team.isDuplicate}
                  />
                  {/* Validation indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {team.isValidating && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" aria-label="Checking name availability"></div>
                    )}
                    {!team.isValidating && team.name.trim() && !team.isDuplicate && (
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Name available">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {!team.isValidating && team.isDuplicate && (
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Name already exists">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                {teams.length > 2 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleRemoveTeam(team.id)}
                    className="text-red-600 hover:bg-red-50"
                    aria-label={`Remove team ${index + 1}`}
                  >
                    Remove
                  </Button>
                )}
              </div>
              
              {/* Duplicate warning with suggestions */}
              {team.isDuplicate && team.suggestions && team.suggestions.length > 0 && (
                <div className="ml-11 p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
                  <p className="text-sm text-red-700 font-medium mb-2">
                    ⚠️ This team name already exists. Try one of these:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {team.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleTeamChange(team.id, 'name', suggestion)}
                        className="px-3 py-1 text-sm bg-white border border-red-300 rounded-md hover:bg-red-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {teams.length < 20 && (
          <Button
            type="button"
            variant="secondary"
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
            variant="secondary"
            onClick={() => setStep(1)}
            disabled={loading || isStep2Submitting}
            aria-label="Go back to event details"
          >
            Back
          </Button>
          <Button type="submit" disabled={loading || isStep2Submitting} aria-label={isEditMode ? 'Update event with teams' : 'Create event with teams'}>
            {isStep2Submitting ? (isEditMode ? 'Updating...' : 'Creating Teams...') : loading ? (isEditMode ? 'Updating...' : 'Creating Teams...') : (isEditMode ? 'Update Event' : 'Create Event')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
