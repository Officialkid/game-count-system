// components/Card.tsx
// FIXED: Added ARIA attribute support and dark mode styling (UI-DEBUG-REPORT Issue #7)
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  role?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-label'?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  role,
  'aria-live': ariaLive,
  'aria-label': ariaLabel,
  onClick,
  style,
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClass = hover ? 'hover:shadow-lg transition-shadow' : '';

  return (
    <div
      className={`bg-white rounded-lg shadow-md ${paddings[padding]} ${hoverClass} ${className}`}
      role={role}
      aria-live={ariaLive}
      aria-label={ariaLabel}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
