'use client';

import React from 'react';

interface TeamCardProps {
  rank: number;
  name: string;
  score: number;
  avatarUrl?: string | null;
  highlight?: boolean;
  paletteColor?: string;
}

export function TeamCard({ rank, name, score, avatarUrl, highlight, paletteColor = '#6b46c1' }: TeamCardProps) {
  const rankDisplay = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  const isMedal = rank <= 3;
  const medalColors = {
    1: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.5)', glow: 'rgba(251,191,36,0.3)' },
    2: { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.5)', glow: 'rgba(156,163,175,0.3)' },
    3: { bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.5)', glow: 'rgba(244,114,182,0.3)' },
  };
  const colors = isMedal ? medalColors[rank as 1 | 2 | 3] : { bg: 'rgba(229,231,235,0.05)', border: 'rgba(229,231,235,0.3)', glow: 'rgba(59,130,246,0.2)' };

  return (
    <div
      className="flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-102 relative overflow-hidden"
      style={{
        borderColor: colors.border,
        background: highlight 
          ? `linear-gradient(135deg, ${colors.glow} 0%, transparent 100%)`
          : `linear-gradient(135deg, ${colors.bg} 0%, transparent 100%)`,
        boxShadow: highlight ? `0 0 20px ${colors.glow}` : '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Animated background glow for highlight */}
      {highlight && (
        <div 
          className="absolute inset-0 opacity-20 animate-pulse"
          style={{ background: colors.glow }}
        />
      )}
      
      <div className="flex items-center gap-4 relative z-10">
        {/* Rank Badge */}
        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full" 
          style={{ 
            background: isMedal ? colors.bg : 'rgba(229,231,235,0.5)',
            border: `2px solid ${colors.border}`,
          }}
        >
          <div className="text-2xl">{rankDisplay}</div>
        </div>
        
        {/* Avatar */}
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={name} 
            className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 shadow-md"
            style={{ borderColor: paletteColor, outline: `2px solid ${paletteColor}` }}
          />
        ) : (
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
            style={{ background: paletteColor }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* Team Name */}
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900 truncate">{name}</div>
          <div className="text-xs text-gray-500 mt-0.5">Rank #{rank}</div>
        </div>
      </div>
      
      {/* Score Display */}
      <div className="text-right relative z-10">
        <div 
          className="text-3xl font-black tracking-tight score-update"
          style={{ color: paletteColor }}
        >
          {score}
        </div>
        <div className="text-xs font-semibold text-gray-500 mt-1">POINTS</div>
      </div>
    </div>
  );
}
