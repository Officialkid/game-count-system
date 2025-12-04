// components/ui/Avatar.tsx
'use client';

import React from 'react';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt = 'Avatar', fallback, size = 'md', className = '' }: AvatarProps) {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
  };

  const getFallbackText = () => {
    if (fallback) {
      return fallback.substring(0, 2).toUpperCase();
    }
    if (alt) {
      return alt.substring(0, 2).toUpperCase();
    }
    return '?';
  };

  return (
    <div className={`${sizeStyles[size]} rounded-full overflow-hidden flex items-center justify-center ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
          {getFallbackText()}
        </div>
      )}
    </div>
  );
}
