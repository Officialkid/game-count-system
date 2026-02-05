'use client';

import { useState } from 'react';
import { Button, Card, CardContent, useToast } from '@/components/ui';
import { Input } from '@/components/Input';
import { Trash2, Plus } from 'lucide-react';

interface TeamRow {
  id: string;
  name: string;
  color: string;
}

interface BulkTeamCreatorProps {
  eventId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DEFAULT_COLORS = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export function BulkTeamCreator({ eventId, onSuccess, onCancel }: BulkTeamCreatorProps) {
  const { showToast } = useToast();
  const [teams, setTeams] = useState<TeamRow[]>([
    { id: '1', name: '', color: DEFAULT_COLORS[0] }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTeamRow = () => {
    const nextColorIndex = teams.length % DEFAULT_COLORS.length;
    setTeams([
      ...teams,
      {
        id: Date.now().toString(),
        name: '',
        color: DEFAULT_COLORS[nextColorIndex]
      }
    ]);
  };

  const removeTeamRow = (id: string) => {
    if (teams.length === 1) {
      showToast('At least one team is required', 'error');
      return;
    }
    setTeams(teams.filter(team => team.id !== id));
  };

  const updateTeam = (id: string, field: 'name' | 'color', value: string) => {
    setTeams(teams.map(team => 
      team.id === id ? { ...team, [field]: value } : team
    ));
  };

  const validateTeams = (): { valid: boolean; message?: string } => {
    // Check for empty names
    const emptyNames = teams.filter(t => !t.name.trim());
    if (emptyNames.length > 0) {
      return { valid: false, message: 'All teams must have a name' };
    }

    // Check for duplicate names (case-insensitive)
    const names = teams.map(t => t.name.trim().toLowerCase());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      const duplicateName = teams.find(t => t.name.trim().toLowerCase() === duplicates[0])?.name;
      return { valid: false, message: `Duplicate team name: "${duplicateName}"` };
    }

    // Check name length
    const tooLong = teams.find(t => t.name.trim().length > 100);
    if (tooLong) {
      return { valid: false, message: 'Team names must be 100 characters or less' };
    }

    return { valid: true };
  };

  const handleSubmit = async () => {
    // Validate before submitting
    const validation = validateTeams();
    if (!validation.valid) {
      showToast(validation.message || 'Invalid team data', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem('admin_token');
      
      if (!adminToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/teams/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': adminToken,
        },
        body: JSON.stringify({
          event_id: eventId,
          teams: teams.map(t => ({
            name: t.name.trim(),
            color: t.color
          }))
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create teams');
      }

      const result = await response.json();
      showToast(`✓ Created ${result.data?.count || teams.length} team(s)`, 'success');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create teams:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to create teams',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Create Teams</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add multiple teams at once
            </p>
          </div>
          <Button
            onClick={addTeamRow}
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </Button>
        </div>

        <div className="space-y-3 mb-6">
          {teams.map((team, index) => (
            <div
              key={team.id}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Team Name"
                  value={team.name}
                  onChange={(e) => updateTeam(team.id, 'name', e.target.value)}
                  disabled={isSubmitting}
                  className="w-full"
                  maxLength={100}
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">Color:</label>
                <input
                  type="color"
                  value={team.color}
                  onChange={(e) => updateTeam(team.id, 'color', e.target.value)}
                  disabled={isSubmitting}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
              </div>

              <Button
                onClick={() => removeTeamRow(team.id)}
                variant="ghost"
                size="sm"
                disabled={isSubmitting || teams.length === 1}
                className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Creating...' : `Create ${teams.length} Team${teams.length > 1 ? 's' : ''}`}
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>

        {teams.length > 1 && (
          <p className="text-xs text-gray-700 text-center mt-4">
            💡 Tip: Team names must be unique
          </p>
        )}
      </CardContent>
    </Card>
  );
}
