// components/DashboardCard.tsx
import Link from 'next/link';
import { Card } from './Card';
import { Button } from './Button';

interface DashboardCardProps {
  isEmpty?: boolean;
  onCreateEvent?: () => void;
}

export function DashboardCard({ isEmpty = false, onCreateEvent }: DashboardCardProps) {
  if (isEmpty) {
    return (
      <Card className="text-center py-12">
        <div className="text-6xl mb-4">🎮</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800">No events yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first event to start tracking scores!
        </p>
        {onCreateEvent && (
          <Button onClick={onCreateEvent} size="lg" data-tour="create-event">
            + Create Event
          </Button>
        )}
      </Card>
    );
  }

  return null;
}

interface CreateEventFormProps {
  eventName: string;
  onEventNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CreateEventForm({
  eventName,
  onEventNameChange,
  onSubmit,
  onCancel,
  loading = false,
}: CreateEventFormProps) {
  return (
    <Card className="max-w-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="text"
          className="input-field"
          placeholder="e.g., Summer Games 2025"
          value={eventName}
          onChange={(e) => onEventNameChange(e.target.value)}
          required
          minLength={3}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
