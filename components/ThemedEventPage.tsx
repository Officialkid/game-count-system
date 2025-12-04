// components/ThemedEventPage.tsx
'use client';

import { useEffect } from 'react';

interface ThemedEventPageProps {
  brandColor?: string;
  logoUrl?: string | null;
  eventName: string;
  children: React.ReactNode;
}

export function ThemedEventPage({
  brandColor = '#6b46c1',
  logoUrl,
  eventName,
  children,
}: ThemedEventPageProps) {
  useEffect(() => {
    // FIXED: Guard DOM access for SSR
    if (typeof document !== 'undefined') {
      // Inject brand color as CSS variable
      document.documentElement.style.setProperty('--event-theme-color', brandColor);
    }
    
    // Cleanup on unmount
    return () => {
      if (typeof document !== 'undefined') {
        document.documentElement.style.removeProperty('--event-theme-color');
      }
    };
  }, [brandColor]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50"
      style={{
        ['--tw-gradient-from' as any]: `${brandColor}10`,
        ['--tw-gradient-to' as any]: `${brandColor}05`,
      }}
    >
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Event Header */}
        <div className="mb-8 text-center">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${eventName} logo`}
              className="h-20 md:h-24 mx-auto mb-4 object-contain"
            />
          )}
          <h1
            className="text-4xl md:text-5xl font-bold mb-2"
            style={{ color: brandColor }}
          >
            {eventName}
          </h1>
          <div
            className="w-32 h-1 mx-auto rounded-full"
            style={{ backgroundColor: brandColor }}
          ></div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

interface BrandedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  brandColor?: string;
  variant?: 'solid' | 'outline';
  children: React.ReactNode;
}

export function BrandedButton({
  brandColor = '#6b46c1',
  variant = 'solid',
  children,
  className = '',
  ...props
}: BrandedButtonProps) {
  const solidStyle = {
    backgroundColor: brandColor,
    borderColor: brandColor,
    color: '#ffffff',
  };

  const outlineStyle = {
    backgroundColor: 'transparent',
    borderColor: brandColor,
    color: brandColor,
  };

  return (
    <button
      className={`px-4 py-2 rounded-md font-medium border-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={variant === 'solid' ? solidStyle : outlineStyle}
      {...props}
    >
      {children}
    </button>
  );
}

interface BrandedCardProps {
  brandColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function BrandedCard({ brandColor = '#6b46c1', children, className = '' }: BrandedCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border-t-4 ${className}`}
      style={{ borderTopColor: brandColor }}
    >
      {children}
    </div>
  );
}
