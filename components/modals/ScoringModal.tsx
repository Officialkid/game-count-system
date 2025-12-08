'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { soundManager } from '@/lib/sound';
import { triggerConfetti } from '@/lib/confetti';
import { getPaletteById } from '@/lib/color-palettes';
import { getFriendlyError } from '@/lib/error-messages';

interface Team {
  id: number;
  team_name: string;
  total_score: number;
}

interface ScoringModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  event?: { theme_color?: string };
  onScoreAdded?: () => void;
}

export function ScoringModal({ eventId, isOpen, onClose, event, onScoreAdded }: ScoringModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [gameNumber, setGameNumber] = useState<string>('');
  const [gameName, setGameName] = useState<string>('');
  const [points, setPoints] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const palette = getPaletteById(event?.theme_color || 'purple') || getPaletteById('purple')!;

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/events/${eventId}/teams`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    })();
  }, [isOpen, eventId]);

  const quickAddPoints = (amount: number) => {
    const current = parseInt(points) || 0;
    setPoints(String(current + amount));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!selectedTeamId) {
      showToast('Please select a team', 'warning');
      return;
    }
    if (!gameNumber || parseInt(gameNumber) < 1) {
      showToast('Please enter a valid game number (1+)', 'warning');
      return;
    }
    if (!points || isNaN(parseInt(points))) {
      showToast('Please enter a valid score', 'warning');
      return;
    }
    
    const pointsValue = parseInt(points);
    if (pointsValue < -1000 || pointsValue > 1000) {
      showToast('Score must be between -1000 and 1000', 'warning');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Authentication token missing. Please log in again.', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/scores`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          team_id: parseInt(selectedTeamId), 
          game_number: parseInt(gameNumber), 
          points: pointsValue, 
          game_name: gameName || null 
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        const team = teams.find(t => t.id === parseInt(selectedTeamId));
        showToast(`✓ Added ${pointsValue} to ${team?.team_name || 'team'}`, 'success');
        soundManager?.playSuccess();
        
        const confettiEnabled = localStorage.getItem('confetti_enabled');
        if (Math.abs(pointsValue) >= 50 && (confettiEnabled === null || confettiEnabled === 'true')) {
          triggerConfetti();
        }
        
        setSelectedTeamId('');
        setGameNumber('');
        setGameName('');
        setPoints('');
        
        // Notify parent to refresh team scores in real-time
        if (onScoreAdded) {
          onScoreAdded();
        }
        
        onClose();
      } else {
        // Extract error message from response
        const errorMsg = data.error?.message || data.message || 'Failed to add score';
        const errorCode = data.error?.code || 'UNKNOWN';

        const friendly = getFriendlyError({
          status: res.status,
          code: errorCode,
          message: errorMsg,
          context: 'score',
        });

        const combined = friendly.suggestion
          ? `${friendly.message}\n${friendly.suggestion}`
          : friendly.message;

        showToast(combined, friendly.type === 'warning' ? 'warning' : 'error', {
          learnMoreHref: friendly.learnMoreHref,
          duration: friendly.type === 'warning' ? 6000 : 8000,
        });
        
        console.error('Score submission error:', { status: res.status, errorCode, errorMsg });
        soundManager?.playError();
      }
    } catch (error) {
      console.error('Network error during score submission:', error);
      showToast('Network error. Please check your connection and try again.', 'error', {
        learnMoreHref: '/docs/troubleshooting',
      });
      soundManager?.playError();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedTeam = teams.find(t => t.id === parseInt(selectedTeamId));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header with color accent */}
        <div className="h-2" style={{ background: palette.primary }}></div>
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-3xl font-black text-gray-900">⚡ Add Points</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition">✕</button>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Step 1: Team Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Step 1: Choose Team</label>
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {teams.map(team => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSelectedTeamId(String(team.id))}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedTeamId === String(team.id)
                        ? 'border-current scale-105 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      borderColor: selectedTeamId === String(team.id) ? palette.primary : undefined,
                      background: selectedTeamId === String(team.id) ? `${palette.primary}15` : '#f9fafb',
                    }}
                  >
                    <div className="font-bold text-gray-900 truncate">{team.team_name}</div>
                    <div className="text-xs text-gray-500 mt-1">{team.total_score} pts</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Game Info */}
            {selectedTeamId && (
              <div className="space-y-3 pt-4 border-t-2 border-gray-100">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Step 2: Game Details</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Game #</label>
                    <input 
                      type="number" 
                      value={gameNumber} 
                      onChange={(e) => setGameNumber(e.target.value)} 
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-2xl font-bold transition-colors"
                      style={{ borderColor: `${palette.primary}80`, "--tw-ring-color": palette.primary } as React.CSSProperties}
                      placeholder="1"
                      min="1" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Game Name</label>
                    <input 
                      type="text" 
                      value={gameName} 
                      onChange={(e) => setGameName(e.target.value)} 
                      className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors"
                      style={{ borderColor: `${palette.primary}80`, "--tw-ring-color": palette.primary } as React.CSSProperties}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Points Input with Quick Add Buttons */}
            {selectedTeamId && (
              <div className="space-y-4 pt-4 border-t-2 border-gray-100">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Step 3: Enter Points</label>
                
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <input 
                      type="number" 
                      value={points} 
                      onChange={(e) => setPoints(e.target.value)} 
                      className="w-full px-6 py-4 border-2 rounded-xl focus:outline-none text-4xl font-black text-center transition-colors"
                      style={{ borderColor: `${palette.primary}80`, "--tw-ring-color": palette.primary } as React.CSSProperties}
                      placeholder="0"
                      required 
                    />
                    <div className="text-center text-xs text-gray-500 mt-2 font-medium">POINTS</div>
                  </div>
                </div>

                {/* Quick Add Buttons - Large and Grid */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-3 uppercase tracking-wide">Quick Add</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '+10', value: 10, emoji: '🟢' },
                      { label: '+20', value: 20, emoji: '🟡' },
                      { label: '+50', value: 50, emoji: '🔴' },
                      { label: '-5', value: -5, emoji: '⚪' },
                      { label: 'Clear', value: 0, emoji: '❌' },
                      { label: 'Set to 0', value: -999, emoji: '🔵' },
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => btn.value === -999 ? setPoints('0') : quickAddPoints(btn.value)}
                        className="py-3 px-2 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95 border-2 border-gray-200 hover:border-current"
                        style={{
                          background: `${palette.primary}10`,
                          borderColor: palette.primary,
                          color: palette.primary,
                        }}
                      >
                        <span>{btn.emoji}</span>
                        <div className="text-sm">{btn.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
              <button type="button" onClick={onClose} className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!selectedTeamId || !gameNumber || !points || submitting}
                className="flex-1 px-6 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: palette.primary }}
              >
                {submitting ? 'Adding...' : '✓ Confirm & Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
