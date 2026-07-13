'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui';
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
  };
}

const PALETTE_OPTIONS = ['purple', 'blue', 'green', 'orange', 'red', 'pink', 'teal', 'indigo', 'ocean', 'sunset', 'forest', 'professional'];

export function EditEventModal({ eventId, isOpen, onClose, onSave, initial }: EditEventModalProps) {
  const [name, setName] = useState(initial.event_name);
  const [theme, setTheme] = useState(initial.theme_color);
  const [saving, setSaving] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { showToast } = useToast();
  const palette = getPaletteById(theme || 'purple') || getPaletteById('purple')!;
  const recommendations = getThemeRecommendations(name, 3);

  useEffect(() => {
    if (isOpen) {
      setName(initial.event_name);
      setTheme(initial.theme_color);
    }
  }, [initial, isOpen]);

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
        }),
      });

      if (res.ok) {
        showToast('Event updated successfully', 'success');
        onSave?.();
        onClose();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update event', 'error');
      }
    } catch {
      showToast('Failed to update event', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1" style={{ background: palette.primary }}></div>

        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-3xl font-black text-gray-900">Edit Event</h3>
            <button onClick={onClose} className="text-2xl font-bold text-gray-600 transition hover:text-gray-800">
              x
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-gray-700">Event Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border-2 px-4 py-3 text-lg transition-colors focus:outline-none"
                style={{ borderColor: `${palette.primary}80`, '--tw-ring-color': palette.primary } as React.CSSProperties}
                placeholder="Enter event name..."
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm font-bold uppercase tracking-wide text-gray-700">Theme Color</label>
                {recommendations.length > 0 && recommendations[0].score > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowRecommendations(!showRecommendations)}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-600 transition-colors hover:text-purple-700"
                  >
                    <span>*</span>
                    <span>{showRecommendations ? 'Hide' : 'AI Suggestions'}</span>
                  </button>
                )}
              </div>

              {showRecommendations && recommendations.length > 0 && recommendations[0].score > 0 && (
                <div className="mb-4 rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-purple-900">Recommended for "{name}"</p>
                  <div className="flex gap-3">
                    {recommendations.slice(0, 3).map((rec) => (
                      <button
                        key={rec.palette.id}
                        type="button"
                        onClick={() => {
                          setTheme(rec.palette.id);
                          setShowRecommendations(false);
                        }}
                        className="flex-1 rounded-lg border-2 border-purple-300 p-3 transition-all hover:scale-105 hover:border-purple-500"
                        style={{
                          background: `linear-gradient(135deg, ${rec.palette.primary} 0%, ${rec.palette.secondary} 100%)`,
                        }}
                        title={rec.reason}
                      >
                        <div className="text-sm font-bold text-white drop-shadow">{rec.palette.name}</div>
                        <div className="mt-1 text-xs text-white/80">{rec.reason}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                {PALETTE_OPTIONS.map((palId) => {
                  const paletteOption = getPaletteById(palId) || getPaletteById('purple')!;
                  return (
                    <button
                      key={palId}
                      type="button"
                      onClick={() => setTheme(palId)}
                      className={`rounded-xl border-3 p-4 transition-all hover:scale-110 ${
                        theme === palId ? 'ring-4 ring-offset-2' : 'border-gray-200'
                      }`}
                      style={{
                        borderColor: theme === palId ? paletteOption.primary : '#e5e7eb',
                        background: `linear-gradient(135deg, ${paletteOption.primary} 0%, ${paletteOption.secondary} 100%)`,
                      }}
                      title={paletteOption.name}
                    >
                      <div className="text-lg font-bold text-white drop-shadow">P</div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-700">{palette.name} - {palette.description}</p>
            </div>

            <div className="flex gap-3 border-t-2 border-gray-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-gray-300 px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !name.trim()}
                className="flex-1 rounded-xl px-6 py-3 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: palette.primary }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
