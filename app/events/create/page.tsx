'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'quick' | 'camp' | 'advanced'>('quick');
  const [duration, setDuration] = useState<'24h' | '48h' | '7d' | 'custom'>('24h');
  const [startAt, setStartAt] = useState('2026-01-08T09:00');
  const [retention, setRetention] = useState<'manual' | 'auto_expire' | 'archive'>('manual');
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateEndTime = () => {
    const start = new Date(startAt);
    switch (duration) {
      case '24h':
        start.setHours(start.getHours() + 24);
        break;
      case '48h':
        start.setHours(start.getHours() + 48);
        break;
      case '7d':
        start.setDate(start.getDate() + 7);
        break;
      default:
        return null;
    }
    return start.toISOString();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const endTime = calculateEndTime();
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mode,
          start_at: new Date(startAt).toISOString(),
          end_at: endTime,
          retention_policy: retention,
          number_of_days: mode === 'camp' ? numberOfDays : undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 bg-clip-text text-transparent mb-4">
            Create Your Event
          </h1>
          <p className="text-gray-600 text-lg">Get started in seconds — no signup required</p>
        </div>

        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Event Name Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <label className="block text-purple-900 font-semibold mb-3 text-lg">
              🎯 Event Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Basketball Tournament"
              required
              className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Mode Selector Card */}
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <label className="block text-pink-900 font-semibold mb-3 text-lg">
              🎮 Event Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'quick' as const, label: 'Quick', emoji: '⚡', desc: 'Simple scoring' },
                { value: 'camp' as const, label: 'Camp', emoji: '🏕️', desc: 'Multi-day events' },
                { value: 'advanced' as const, label: 'Advanced', emoji: '🎯', desc: 'Full features' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    mode === option.value
                      ? 'border-pink-500 bg-pink-100 shadow-md scale-105'
                      : 'border-pink-200 bg-white hover:border-pink-300 hover:shadow-sm'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.emoji}</div>
                  <div className="font-semibold text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Camp Days Configuration (only for camp mode) */}
          {mode === 'camp' && (
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <label className="block text-indigo-900 font-semibold mb-3 text-lg">
                🏕️ Number of Days
              </label>
              <p className="text-sm text-indigo-700 mb-4">How many days will your camp event last?</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setNumberOfDays(Math.max(1, numberOfDays - 1))}
                  className="px-4 py-2 bg-white border-2 border-indigo-300 rounded-lg font-bold text-indigo-700 hover:bg-indigo-50 transition"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <div className="text-4xl font-bold text-indigo-900">{numberOfDays}</div>
                  <div className="text-sm text-indigo-600 mt-1">{numberOfDays === 1 ? 'Day' : 'Days'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNumberOfDays(Math.min(30, numberOfDays + 1))}
                  className="px-4 py-2 bg-white border-2 border-indigo-300 rounded-lg font-bold text-indigo-700 hover:bg-indigo-50 transition"
                >
                  +
                </button>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[3, 5, 7, 14].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNumberOfDays(preset)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition ${
                      numberOfDays === preset
                        ? 'border-indigo-500 bg-indigo-100 text-indigo-900'
                        : 'border-indigo-200 bg-white text-indigo-700 hover:border-indigo-300'
                    }`}
                  >
                    {preset} days
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 
          {/* Duration Selector Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <label className="block text-amber-900 font-semibold mb-3 text-lg">
              ⏰ Event Duration
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: '24h' as const, label: '24 Hours' },
                { value: '48h' as const, label: '48 Hours' },
                { value: '7d' as const, label: '7 Days' },
                { value: 'custom' as const, label: 'Custom' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDuration(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    duration === option.value
                      ? 'border-amber-500 bg-amber-100 shadow-md scale-105'
                      : 'border-amber-200 bg-white hover:border-amber-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Time Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <label className="block text-blue-900 font-semibold mb-3 text-lg">
              📅 Start Time
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>

          {/* Retention Policy Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <label className="block text-green-900 font-semibold mb-3 text-lg">
              📦 Data Retention
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'manual' as const, label: 'Manual', emoji: '🔧', desc: 'Delete manually' },
                { value: 'auto_expire' as const, label: 'Auto Expire', emoji: '⏱️', desc: 'Auto-delete after event' },
                { value: 'archive' as const, label: 'Archive', emoji: '📁', desc: 'Keep forever' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRetention(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    retention === option.value
                      ? 'border-green-500 bg-green-100 shadow-md scale-105'
                      : 'border-green-200 bg-white hover:border-green-300 hover:shadow-sm'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.emoji}</div>
                  <div className="font-semibold text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-lg rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Event...</span>
              </div>
            ) : (
              <span>✨ Create Event</span>
            )}
          </button>
        </form>

        {result && (
          <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8 shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <span className="text-3xl">✅</span>
              <h2 className="text-2xl font-bold text-green-900 ml-2">Event Created!</h2>
            </div>
            
            <p className="text-green-800 font-medium text-center mb-6">Your event is ready. Here are your access links:</p>
            
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">👑 Admin Link</p>
                    <p className="text-xs text-gray-600 mb-2">Manage teams and settings</p>
                    <a 
                      href={result.admin_url} 
                      className="text-sm text-purple-600 hover:underline break-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {result.admin_url}
                    </a>
                  </div>
                  <a
                    href={result.admin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium whitespace-nowrap ml-4"
                  >
                    Open →
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">📝 Scorer Link</p>
                    <p className="text-xs text-gray-600 mb-2">Add scores during the event</p>
                    <a 
                      href={result.scorer_url} 
                      className="text-sm text-blue-600 hover:underline break-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {result.scorer_url}
                    </a>
                  </div>
                  <a
                    href={result.scorer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium whitespace-nowrap ml-4"
                  >
                    Open →
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">📺 Public Scoreboard</p>
                    <p className="text-xs text-gray-600 mb-2">Share with everyone</p>
                    <a 
                      href={result.public_url} 
                      className="text-sm text-blue-600 hover:underline break-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {result.public_url}
                    </a>
                  </div>
                  <a
                    href={result.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium whitespace-nowrap ml-4"
                  >
                    View →
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
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
    </div>
  );
}
