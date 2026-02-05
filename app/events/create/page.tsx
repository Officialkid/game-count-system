'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearCache, clearQueue } from '@/lib/offline-manager';
import { ChevronDown, Zap, Calendar, Settings, Info, CheckCircle2 } from 'lucide-react';

// Helper to get current datetime in local format for input
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Smart logic to determine event mode based on user selections
function determineEventMode(numberOfDays: number, duration: string): 'quick' | 'camp' | 'advanced' {
  if (numberOfDays > 1) {
    return 'camp';
  }
  if (duration === 'custom' || numberOfDays > 7) {
    return 'advanced';
  }
  return 'quick'; // default for single-day, simple events
}

export default function CreateEventPage() {
  const router = useRouter();
  
  // Essential fields (visible by default)
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState(getCurrentDateTimeLocal());
  
  // Advanced options (hidden in collapsed section)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [duration, setDuration] = useState<'24h' | '48h' | '7d' | 'custom'>('24h');
  
  // UI state
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModeHelp, setShowModeHelp] = useState(false);

  // Get current mode based on selections
  const currentMode = determineEventMode(numberOfDays, duration);
  
  // Mode information
  const modeInfo = {
    quick: {
      icon: <Zap className="w-6 h-6" />,
      name: 'Quick Event',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      description: 'Perfect for short events lasting a few hours to one day',
      examples: ['School sports day', 'Church game night', 'Office tournament', 'Birthday party games'],
      bestFor: 'Events under 24 hours'
    },
    camp: {
      icon: <Calendar className="w-6 h-6" />,
      name: 'Multi-Day Event',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      description: 'For events spanning multiple days with daily competitions and cumulative scoring',
      examples: ['Summer camp (3-7 days)', 'Basketball tournament', 'School spirit week', 'Weekend retreat'],
      bestFor: 'Events 2-30 days'
    },
    advanced: {
      icon: <Settings className="w-6 h-6" />,
      name: 'Advanced',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      description: 'For organizations running multiple events with custom requirements',
      examples: ['School district (recurring)', 'Sports league (season)', 'Multiple locations', 'Complex scoring rules'],
      bestFor: 'Professional use'
    }
  };

  const currentModeData = modeInfo[currentMode];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Determine mode automatically based on selections
      const eventMode = determineEventMode(numberOfDays, duration);
      
      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          number_of_days: numberOfDays,
          scoringMode: 'continuous',
          eventMode: eventMode,
          // Smart defaults (not shown to user):
          // - retention_policy: 'manual' (set server-side)
          // - status: 'active' (set server-side)
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to create event');
      }

      // Drop any stale scorer caches or queued scores so the new event opens fresh
      clearCache();
      clearQueue();
      
      // Map response for UI
      const mappedResult = {
        id: data.data.event.id,
        name: data.data.event.name,
        admin_url: data.data.shareLinks.admin,
        scorer_url: data.data.shareLinks.scorer,
        public_url: data.data.shareLinks.viewer,
      };
      
      setResult(mappedResult);
    } catch (err: any) {
      setError(err?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 bg-clip-text text-transparent mb-4">
            Create Your Event
          </h1>
          <p className="text-gray-600 text-lg">Get started in 60 seconds — no signup required</p>
        </div>

        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-8">
          {/* FIELD 1: Event Name */}
          <div className="bg-white border-2 border-purple-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <label htmlFor="eventName" className="block text-2xl font-bold text-gray-900 mb-3">
              🎯 Event Name <span className="text-red-500">*</span>
            </label>
            <input
              id="eventName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Basketball Tournament"
              className="w-full px-6 py-5 text-xl border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all"
              autoFocus
              required
            />
          </div>

          {/* FIELD 2: Start Time */}
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <label htmlFor="startTime" className="block text-2xl font-bold text-gray-900 mb-3">
              📅 Start Time
            </label>
            <input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-6 py-5 text-xl border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500 bg-gray-50 text-gray-900 transition-all"
            />
            <p className="text-base text-gray-600 mt-3 flex items-center gap-2">
              <span>💡</span>
              <span>Defaults to right now — adjust if needed</span>
            </p>
          </div>

          {/* ADVANCED OPTIONS (Collapsed) */}
          <details 
            className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl overflow-hidden"
            open={showAdvanced}
            onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
          >
            <summary className="px-8 py-6 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between text-lg font-semibold text-purple-700">
              <span className="flex items-center gap-2">
                <span>⚙️</span>
                <span>Need more options?</span>
                <span className="text-sm font-normal text-gray-600">(multi-day, custom duration)</span>
              </span>
              <ChevronDown className={`w-6 h-6 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </summary>
            
            <div className="px-8 pb-8 pt-4 space-y-6">
              {/* Smart Mode Indicator */}
              <div className={`${currentModeData.bgColor} border-2 ${currentModeData.borderColor} rounded-xl p-6`}>
                <div className="flex items-start gap-4">
                  <div className={`${currentModeData.color} mt-1`}>
                    {currentModeData.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`text-lg font-bold ${currentModeData.color}`}>
                        {currentModeData.name}
                      </h4>
                      <CheckCircle2 className={`w-5 h-5 ${currentModeData.color}`} />
                      <button
                        type="button"
                        onClick={() => setShowModeHelp(!showModeHelp)}
                        className="p-1 hover:bg-white rounded-full transition"
                        aria-label="Learn more about this mode"
                      >
                        <Info className="w-5 h-5 text-gray-600 hover:text-gray-600" />
                      </button>
                    </div>
                    <p className="text-base text-gray-700">
                      {currentModeData.description}
                    </p>
                    
                    {/* Expandable Help Panel */}
                    {showModeHelp && (
                      <div className="mt-4 bg-white rounded-lg p-4 border-2 border-gray-200">
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            ✨ {currentModeData.bestFor}
                          </p>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Perfect for:</p>
                          <ul className="text-sm space-y-1">
                            {currentModeData.examples.map((example, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className={currentModeData.color}>•</span>
                                <span className="text-gray-700">{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setShowModeHelp(false)}
                          className={`text-sm font-semibold ${currentModeData.color} hover:underline`}
                        >
                          Got it! ✓
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Number of Days */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-lg font-semibold text-gray-900">
                    {numberOfDays === 1 ? '📅' : '🏕️'} Number of Days
                  </label>
                </div>
                
                {/* Helper text with dynamic mode indicator */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span>
                      {numberOfDays === 1 ? (
                        <>
                          <strong>Single-day event</strong> — Great for tournaments, game nights, or one-day competitions. 
                          <span className="text-blue-600 font-semibold"> Using Quick Mode</span>
                        </>
                      ) : (
                        <>
                          <strong>Multi-day event</strong> — Perfect for camps, retreats, or week-long competitions with daily scores. 
                          <span className="text-purple-600 font-semibold"> Using Camp Mode</span>
                        </>
                      )}
                    </span>
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setNumberOfDays(Math.max(1, numberOfDays - 1))}
                    className="px-6 py-4 bg-white border-2 border-purple-300 rounded-xl font-bold text-xl text-purple-700 hover:bg-purple-50 transition active:scale-95 min-w-[60px]"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="text-5xl font-bold text-purple-900">{numberOfDays}</div>
                    <div className="text-base text-purple-600 mt-2 font-medium">
                      {numberOfDays === 1 ? 'Day' : 'Days'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNumberOfDays(Math.min(30, numberOfDays + 1))}
                    className="px-6 py-4 bg-white border-2 border-purple-300 rounded-xl font-bold text-xl text-purple-700 hover:bg-purple-50 transition active:scale-95 min-w-[60px]"
                  >
                    +
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {[3, 5, 7, 14].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNumberOfDays(preset)}
                      className={`px-4 py-3 rounded-xl border-2 font-semibold transition active:scale-95 ${
                        numberOfDays === preset
                          ? 'border-purple-500 bg-purple-100 text-purple-900 shadow-md'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {preset}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Presets */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-lg font-semibold text-gray-900">
                    ⏰ Event Duration (per day)
                  </label>
                </div>
                
                {/* Helper text */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                    <span>
                      Choose how long your event will run. For multi-day events, this applies to each day.
                    </span>
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: '24h' as const, label: '24 Hours', desc: 'Full day', icon: '🌞' },
                    { value: '48h' as const, label: '48 Hours', desc: '2 days', icon: '🌙' },
                    { value: '7d' as const, label: '7 Days', desc: '1 week', icon: '📅' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDuration(option.value)}
                      className={`p-4 rounded-xl border-2 transition active:scale-95 group relative ${
                        duration === option.value
                          ? 'border-amber-500 bg-amber-100 shadow-md'
                          : 'border-gray-300 bg-white hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="font-bold text-gray-900 text-base">{option.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </details>

          {/* MODE SUMMARY - Shows current mode selection */}
          <div className={`${currentModeData.bgColor} border-2 ${currentModeData.borderColor} rounded-2xl p-6`}>
            <div className="flex items-center gap-4">
              <div className={`${currentModeData.color} p-3 bg-white rounded-xl`}>
                {currentModeData.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 mb-1">Your event will use:</p>
                <h3 className={`text-xl font-bold ${currentModeData.color}`}>
                  {currentModeData.name}
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  {numberOfDays === 1 
                    ? `Single-day event • ${duration === '24h' ? '24 hours' : duration === '48h' ? '48 hours' : '7 days'}`
                    : `${numberOfDays} days • Daily scoring`}
                </p>
              </div>
              <CheckCircle2 className={`w-8 h-8 ${currentModeData.color}`} />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-6 px-8 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-2xl rounded-2xl hover:from-purple-700 hover:via-pink-700 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Event...</span>
              </div>
            ) : (
              <span>Create Event & Add Teams →</span>
            )}
          </button>

          {/* Info Text */}
          <p className="text-center text-gray-600 text-base">
            <span className="font-semibold">Smart setup:</span> We automatically configure the best mode based on your selections
          </p>
        </form>

        {result && (
          <div className="mt-12 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-10 shadow-2xl animate-in fade-in duration-500">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-4xl">✅</span>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-green-900 text-center mb-3">Event Created Successfully!</h2>
            <p className="text-green-800 text-lg text-center mb-8">Your event is ready. Here are your access links:</p>
            
            <div className="space-y-4">
              {/* Admin Link */}
              <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">👑</span>
                      <p className="font-bold text-xl text-gray-900">Admin Link</p>
                    </div>
                    <p className="text-base text-gray-600 mb-3">Manage teams, settings, and view analytics</p>
                    <a 
                      href={result.admin_url} 
                      className="text-sm text-purple-600 hover:underline break-all font-mono"
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
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold whitespace-nowrap text-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    Open →
                  </a>
                </div>
              </div>

              {/* Scorer Link */}
              <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📝</span>
                      <p className="font-bold text-xl text-gray-900">Scorer Link</p>
                    </div>
                    <p className="text-base text-gray-600 mb-3">Add and update scores during the event</p>
                    <a 
                      href={result.scorer_url} 
                      className="text-sm text-blue-600 hover:underline break-all font-mono"
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
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap text-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    Open →
                  </a>
                </div>
              </div>

              {/* Public Scoreboard */}
              <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📺</span>
                      <p className="font-bold text-xl text-gray-900">Public Scoreboard</p>
                    </div>
                    <p className="text-base text-gray-600 mb-3">Share with everyone - updates in real-time</p>
                    <a 
                      href={result.public_url} 
                      className="text-sm text-blue-600 hover:underline break-all font-mono"
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
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold whitespace-nowrap text-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    View →
                  </a>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-6 mt-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <p className="font-bold text-lg text-yellow-900 mb-3">Next Steps:</p>
                  <ol className="text-base text-yellow-800 space-y-2 list-decimal list-inside">
                    <li className="font-medium">Click "Open" on the <strong>Admin link</strong> to add teams</li>
                    <li className="font-medium">Use the <strong>Scorer link</strong> to enter points during your event</li>
                    <li className="font-medium">Share the <strong>Public Scoreboard</strong> with your audience</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Save Your Links */}
            <div className="mt-6 bg-red-50 border-2 border-red-300 rounded-xl p-5">
              <p className="text-base text-red-900 font-bold text-center">
                ⚠️ Save these links! There's no login system to retrieve them later.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
