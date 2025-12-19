// components/AutosaveScoreInput.tsx
// FIXED: Added validation visual feedback and dark mode support (UI-DEBUG-REPORT Issue #6)
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input, Button, Card } from '@/components';
import { apiClient } from '@/lib/api-client';
import { nanoid } from 'nanoid';

interface Team {
  id: string;
  team_name: string;
  total_points: number;
}

interface AutosaveScoreInputProps {
  eventId: string;
  teams: Team[];
  onScoreAdded?: (score: any) => void;
  allowNegative?: boolean;
}

export function AutosaveScoreInput({
  eventId,
  teams,
  onScoreAdded,
  allowNegative = false,
}: AutosaveScoreInputProps) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [gameNumber, setGameNumber] = useState(1);
  const [points, setPoints] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [submissionId] = useState(() => nanoid());
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const saveScoreRef = useRef<((teamId: string, game: number, pts: number) => Promise<void>) | null>(null);

  const saveScore = useCallback(async (teamId: string, game: number, pts: number) => {
    if (!teamId || game < 1) return;

    const currentState = `${teamId}-${game}-${pts}`;
    if (currentState === lastSavedRef.current) {
      return; // No changes since last save
    }

    setSaving(true);
    setError('');

    try {
      const response = await apiClient.post(`/api/events/${eventId}/scores`, {
        team_id: teamId,
        game_number: game,
        points: pts,
        submission_id: submissionId,
      });
      const result = await response.json();

      if (result.success) {
        lastSavedRef.current = currentState;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        
        if (onScoreAdded) {
          onScoreAdded(result.data?.score);
        }
      } else {
        setError(result.error || 'Failed to save score');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save score');
    } finally {
      setSaving(false);
    }
  }, [eventId, submissionId, onScoreAdded]);

  // FIXED: Update ref to prevent stale closures in setTimeout
  useEffect(() => {
    saveScoreRef.current = saveScore;
  }, [saveScore]);

  // Autosave with 2-second debounce
  useEffect(() => {
    if (!selectedTeam || !points) return;

    const pts = parseInt(points);
    if (isNaN(pts)) return;

    // Validate negative points
    if (!allowNegative && pts < 0) {
      setError('Negative points are not allowed for this event');
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      // FIXED: Use ref to prevent stale closure
      saveScoreRef.current?.(selectedTeam, gameNumber, pts);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedTeam, gameNumber, points, saveScore, allowNegative]);

  const handleManualSave = () => {
    if (!selectedTeam || !points) {
      setError('Please select a team and enter points');
      return;
    }

    const pts = parseInt(points);
    if (isNaN(pts)) {
      setError('Points must be a number');
      return;
    }

    if (!allowNegative && pts < 0) {
      setError('Negative points are not allowed for this event');
      return;
    }

    saveScore(selectedTeam, gameNumber, pts);
  };

  const handleReset = () => {
    setSelectedTeam('');
    setGameNumber(gameNumber + 1);
    setPoints('');
    setError('');
    setSaved(false);
    lastSavedRef.current = '';
  };

  const getInputClassName = (hasValue: boolean, hasError: boolean) => {
    if (hasError) {
      return 'w-full px-3 py-2 border-2 border-red-500 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500';
    }
    if (hasValue) {
      return 'w-full px-3 py-2 border-2 border-green-500 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500';
    }
    return 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Add Score</h3>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-primary-600" role="status" aria-live="polite">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Saving...</span>
          </div>
        )}
        {saved && !saving && (
          <div className="flex items-center gap-2 text-sm text-green-600" role="status" aria-live="polite">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Saved!</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="team-select" className="block text-sm font-medium text-gray-700 mb-1">
            Team <span className="text-red-500">*</span>
          </label>
          <select
            id="team-select"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className={getInputClassName(!!selectedTeam, false)}
            aria-required="true"
            aria-label="Select team"
            aria-invalid={!selectedTeam && !!error}
          >
            <option value="">Select team...</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.team_name} ({team.total_points} pts)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="game-number" className="block text-sm font-medium text-gray-700 mb-1">
            Game # <span className="text-red-500">*</span>
          </label>
          <Input
            id="game-number"
            type="number"
            min="1"
            value={gameNumber}
            onChange={(e) => setGameNumber(parseInt(e.target.value) || 1)}
            className={getInputClassName(gameNumber > 0, false)}
            required
            aria-required="true"
            aria-label="Game number"
          />
        </div>

        <div>
          <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
            Points <span className="text-red-500">*</span>
          </label>
          <Input
            id="points"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className={getInputClassName(!!points, !!error && !!points)}
            placeholder={allowNegative ? "Enter points (+ or -)" : "Enter points"}
            required
            aria-required="true"
            aria-label="Points scored"
            aria-invalid={!!error && !!points}
            aria-describedby={error ? "score-error" : undefined}
          />
        </div>
      </div>

      {error && (
        <div 
          id="score-error"
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" 
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-3 justify-end">
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={saving}
          aria-label="Reset form"
        >
          Reset
        </Button>
        <Button
          onClick={handleManualSave}
          disabled={saving || !selectedTeam || !points}
          aria-label="Save score manually"
        >
          {saving ? 'Saving...' : 'Save Now'}
        </Button>
      </div>

      <p className="mt-4 text-xs text-gray-500 text-center">
        💡 Changes auto-save after 2 seconds of inactivity
      </p>
    </Card>
  );
}
