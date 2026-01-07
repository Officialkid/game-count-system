'use client';

import React, { useEffect, useState } from 'react';
import { Button, useToast } from '@/components/ui';
import { getPaletteById } from '@/lib/color-palettes';
import { getThemeRecommendations } from '@/lib/theme-recommendations';

interface EditEventModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  initial: {
    event_name: string;
    theme_color: string;
    allow_negative: boolean;
    display_mode: string;
  };
}

const PALETTE_OPTIONS = ['purple', 'blue', 'green', 'orange', 'red', 'pink', 'teal', 'indigo', 'ocean', 'sunset', 'forest', 'professional'];

export function EditEventModal({ eventId, isOpen, onClose, onSave, initial }: EditEventModalProps) {
  const [name, setName] = useState(initial.event_name);
  const [theme, setTheme] = useState(initial.theme_color);
  // logo removed for MVP
  const [allowNegative, setAllowNegative] = useState(initial.allow_negative);
  const [displayMode, setDisplayMode] = useState(initial.display_mode || 'standard');
  const [saving, setSaving] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { showToast } = useToast();
  const palette = getPaletteById(theme || 'purple') || getPaletteById('purple')!;
  
  // AI Theme recommendations based on event name
  const recommendations = getThemeRecommendations(name, 3);

  useEffect(() => {
    if (isOpen) {
      setName(initial.event_name);
      setTheme(initial.theme_color);
      // logo removed for MVP
      setAllowNegative(initial.allow_negative);
      setDisplayMode(initial.display_mode || 'standard');
    }
  }, [isOpen, initial]);

  const save = async () => {
    if (!name.trim()) {
      showToast('Event name cannot be empty', 'warning');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          event_name: name,
          theme_color: theme,
          // logo removed for MVP
          allow_negative: allowNegative,
          display_mode: displayMode,
        }),
      });

      setSaving(false);
      if (res.ok) {
        showToast('Event updated successfully', 'success');
        if (onSave) onSave();
        onClose();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update event', 'error');
      }
    } catch (err) {
      setSaving(false);
      showToast('Failed to update event', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header with color accent */}
        <div className="h-1" style={{ background: palette.primary }}></div>

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-3xl font-black text-gray-900">⚙️ Edit Event</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition">✕</button>
          </div>

          <div className="space-y-6">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Event Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-lg transition-colors"
                style={{ borderColor: `${palette.primary}80`, "--tw-ring-color": palette.primary } as React.CSSProperties}
                placeholder="Enter event name..."
              />
            </div>

            {/* Theme Color Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Theme Color</label>
                {recommendations.length > 0 && recommendations[0].score > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowRecommendations(!showRecommendations)}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                  >
                    <span>✨</span>
                    <span>{showRecommendations ? 'Hide' : 'AI Suggestions'}</span>
                  </button>
                )}
              </div>

              {/* AI Recommendations */}
              {showRecommendations && recommendations.length > 0 && recommendations[0].score > 0 && (
                <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                  <p className="text-xs font-bold text-purple-900 mb-3 uppercase tracking-wide">🤖 Recommended for "{name}"</p>
                  <div className="flex gap-3">
                    {recommendations.slice(0, 3).map((rec) => (
                      <button
                        key={rec.palette.id}
                        type="button"
                        onClick={() => {
                          setTheme(rec.palette.id);
                          setShowRecommendations(false);
                        }}
                        className="flex-1 p-3 rounded-lg border-2 border-purple-300 hover:border-purple-500 transition-all hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${rec.palette.primary} 0%, ${rec.palette.secondary} 100%)`,
                        }}
                        title={rec.reason}
                      >
                        <div className="text-white font-bold text-sm drop-shadow">{rec.palette.name}</div>
                        <div className="text-white/80 text-xs mt-1">{rec.reason}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {PALETTE_OPTIONS.map((palId) => {
                  const p = getPaletteById(palId) || getPaletteById('purple')!;
                  return (
                    <button
                      key={palId}
                      type="button"
                      onClick={() => setTheme(palId)}
                      className={`p-4 rounded-xl border-3 transition-all transform hover:scale-110 ${
                        theme === palId ? 'ring-4 ring-offset-2' : 'border-gray-200'
                      }`}
                      style={{
                        borderColor: theme === palId ? p.primary : '#e5e7eb',
                        background: `linear-gradient(135deg, ${p.primary} 0%, ${p.secondary} 100%)`,
                      }}
                      title={p.name}
                    >
                      <div className="text-lg font-bold text-white drop-shadow">P</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">{palette.name} - {palette.description}</p>
            </div>

            {/* Logo removed for MVP */}

            {/* Options Section */}
            <div className="space-y-4 pt-4 border-t-2 border-gray-100">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Settings</label>

              {/* Allow Negative Scoring */}
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: `${palette.primary}08` }}>
                <input
                  id="neg"
                  type="checkbox"
                  checked={allowNegative}
                  onChange={(e) => setAllowNegative(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <label htmlFor="neg" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-gray-900">Allow Negative Scoring</div>
                  <div className="text-xs text-gray-600">Teams can have negative point totals</div>
                </label>
                <span className="text-2xl">{allowNegative ? '✓' : '✗'}</span>
              </div>

              {/* Display Mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Display Mode</label>
                <select
                  value={displayMode}
                  onChange={(e) => setDisplayMode(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors"
                  style={{ borderColor: `${palette.primary}80`, "--tw-ring-color": palette.primary } as React.CSSProperties}
                >
                  <option value="standard">📊 Standard - Full team information</option>
                  <option value="compact">📱 Compact - Minimal display</option>
                  <option value="leaderboard">🏆 Leaderboard - Ranking focused</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !name.trim()}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: palette.primary }}
              >
                {saving ? '💾 Saving...' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
