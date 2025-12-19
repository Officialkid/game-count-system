// components/ScoreInputRow.tsx
'use client';

import { useState, FormEvent } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { useSubmissionLock } from '@/lib/hooks/useSubmissionLock';

interface Team {
  id: string;
  team_name: string;
}

interface ScoreInputRowProps {
  teams: Team[];
  onSubmit: (teamId: string, gameNumber: number, points: number) => Promise<void>;
  loading?: boolean;
}

export function ScoreInputRow({ teams, onSubmit, loading = false }: ScoreInputRowProps) {
  const [formData, setFormData] = useState({
    team_id: '',
    game_number: 1,
    points: 0,
  });
  const { lock, unlock, isSubmitting } = useSubmissionLock();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (!lock()) return;
    
    try {
      await onSubmit(formData.team_id, formData.game_number, formData.points);
      // Auto-increment game number for next score, reset team and points
      setFormData({ 
        team_id: '', 
        game_number: formData.game_number + 1, 
        points: 0 
      });
    } catch (error) {
      // Keep form data if submission fails
      console.error('Failed to submit score:', error);
      unlock(); // Release lock on error
    } finally {
      unlock(); // Always release the lock
    }
  };

  if (teams.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-gray-600">Add teams first to record scores</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Add Score</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Team</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={formData.team_id}
            onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
            required
          >
            <option value="">Select a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.team_name}
              </option>
            ))}
          </select>
        </div>

        <Input
          type="number"
          label="Game Number"
          value={formData.game_number}
          onChange={(e) =>
            setFormData({ ...formData, game_number: parseInt(e.target.value) || 1 })
          }
          min="1"
          required
        />

        <Input
          type="number"
          label="Points"
          value={formData.points}
          onChange={(e) =>
            setFormData({ ...formData, points: parseInt(e.target.value) || 0 })
          }
          required
        />

        <Button type="submit" fullWidth disabled={loading || isSubmitting}>
          {isSubmitting ? 'Adding Score...' : loading ? 'Loading...' : 'Add Score'}
        </Button>
      </form>
    </Card>
  );
}

interface AddTeamFormProps {
  onSubmit: (teamName: string, avatarUrl: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function AddTeamForm({ onSubmit, onCancel, loading = false }: AddTeamFormProps) {
  const [teamName, setTeamName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const { lock, unlock, isSubmitting } = useSubmissionLock();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (!lock()) return;
    
    try {
      await onSubmit(teamName, avatarUrl);
      setTeamName('');
      setAvatarUrl('');
    } catch (error) {
      console.error('Failed to add team:', error);
      unlock(); // Release lock on error
    } finally {
      unlock(); // Always release the lock
    }
  };

  return (
    <Card className="bg-gray-50 mb-4">
      <h3 className="font-semibold mb-4">Add New Team</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          placeholder="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
          minLength={2}
        />
        <Input
          type="url"
          placeholder="Avatar URL (optional)"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={loading || isSubmitting}>
            {isSubmitting ? 'Adding...' : loading ? 'Loading...' : 'Add Team'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
