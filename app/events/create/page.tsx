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
        <div className="space-y-4 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-3xl">✅</span>
            <h2 className="text-2xl font-bold text-green-900">Event Created!</h2>
          </div>
          
          <p className="text-green-800 font-medium">Your event is ready. Here are your access links:</p>
          
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">👑 Admin Link</p>
                  <p className="text-xs text-gray-600 mb-2">Manage teams and settings</p>
                  <a 
                    href={result.admin_url} 
                    className="text-sm text-purple-600 hover:underline break-all"
                    target="_blank"
                  >
                    {result.admin_url}
                  </a>
                </div>
                <a
                  href={result.admin_url}
                  target="_blank"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium whitespace-nowrap ml-4"
                >
                  Open →
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">📝 Scorer Link</p>
                  <p className="text-xs text-gray-600 mb-2">Add scores during the event</p>
                  <a 
                    href={result.scorer_url} 
                    className="text-sm text-blue-600 hover:underline break-all"
                    target="_blank"
                  >
                    {result.scorer_url}
                  </a>
                </div>
                <a
                  href={result.scorer_url}
                  target="_blank"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium whitespace-nowrap ml-4"
                >
                  Open →
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">📺 Public Scoreboard</p>
                  <p className="text-xs text-gray-600 mb-2">Share with everyone</p>
                  <a 
                    href={result.public_url} 
                    className="text-sm text-blue-600 hover:underline break-all"
                    target="_blank"
                  >
                    {result.public_url}
                  </a>
                </div>
                <a
                  href={result.public_url}
                  target="_blank"
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium whitespace-nowrap ml-4"
                >
                  View →
                </a>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-900 font-medium">💡 Next Steps:</p>
            <ol className="text-sm text-yellow-800 mt-2 space-y-1 list-decimal list-inside">
              <li>Click "Open" on the Admin link to add teams</li>
              <li>Use the Scorer link to enter points during your event</li>
              <li>Share the Public Scoreboard with your audience</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
