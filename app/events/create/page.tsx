'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { eventsService } from '@/lib/services';

export default function CreateEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const { user } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.id) return;
      const res = await eventsService.createEvent(user.id, { event_name: name });
      if (res.success && res.data) router.push('/events');
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-neutral-900">Create Event</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">Event Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Summer Championship"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700">Create</button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
