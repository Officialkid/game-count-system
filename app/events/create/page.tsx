'use client';

import { useState } from 'react';

export default function CreateEventPage() {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'quick' | 'camp' | 'advanced'>('quick');
  const [startAt, setStartAt] = useState('2026-01-08T09:00');
  const [retention, setRetention] = useState<'manual' | 'auto_expire' | 'archive'>('manual');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mode,
          start_at: new Date(startAt).toISOString(),
          retention_policy: retention,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create event');
      }
      setResult(data.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Create Event</h1>
        <p className="text-neutral-600 mt-2">No login required — generates admin, scorer, public, and recap links.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 bg-white border rounded-lg p-4 shadow-sm">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700">Event Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Summer Championship"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            >
              <option value="quick">Quick</option>
              <option value="camp">Camp</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">Retention</label>
            <select
              value={retention}
              onChange={(e) => setRetention(e.target.value as any)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
            >
              <option value="manual">Manual</option>
              <option value="auto_expire">Auto-expire</option>
              <option value="archive">Archive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Start Time</label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create Event'}
        </button>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>

      {result && (
        <div className="space-y-2 bg-white border rounded-lg p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Event created</h2>
          <p className="text-sm text-neutral-600">Share these links:</p>
          <div className="space-y-1 text-sm">
            <div><span className="font-semibold">Admin:</span> {result.admin_url}</div>
            <div><span className="font-semibold">Scorer:</span> {result.scorer_url}</div>
            <div><span className="font-semibold">Public:</span> {result.public_url}</div>
            <div><span className="font-semibold">Recap:</span> {result.public_url?.replace('/events/', '/recap/')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
