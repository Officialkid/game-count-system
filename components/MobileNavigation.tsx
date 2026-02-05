/**
 * Mobile Navigation Component
 * 
 * Bottom tab bar navigation optimized for mobile thumb reach
 * Sticky bottom positioning with safe area insets
 * Large touch targets (min 44px)
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIsMobile, useSafeAreaInsets } from '@/hooks/useMobile';

export interface MobileNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  active?: boolean;
}

export interface MobileNavigationProps {
  items: MobileNavItem[];
  hideOnDesktop?: boolean;
}

export function MobileNavigation({ items, hideOnDesktop = true }: MobileNavigationProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const insets = useSafeAreaInsets();

  // Don't render on desktop if hideOnDesktop is true
  if (!isMobile && hideOnDesktop) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-bottom"
      style={{
        paddingBottom: `${insets.bottom}px`,
      }}
    >
      <div className="flex items-center justify-around max-w-screen-xl mx-auto">
        {items.map((item) => {
          const isActive = item.active !== undefined ? item.active : pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                min-w-[80px] min-h-[56px] px-3 py-2
                touch-manipulation
                transition-colors duration-200
                ${isActive 
                  ? 'text-purple-600' 
                  : 'text-gray-600 active:text-purple-600'
                }
              `}
            >
              <div className="relative">
                <div className="text-2xl mb-1">{item.icon}</div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Mobile Header Component
 * Sticky top header with back button and actions
 */
export interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  transparent?: boolean;
}

export function MobileHeader({
  title,
  showBack = false,
  onBack,
  actions,
  transparent = false,
}: MobileHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <header
      className={`
        sticky top-0 left-0 right-0 z-40
        ${transparent ? 'bg-transparent' : 'bg-white border-b border-gray-200 shadow-sm'}
      `}
      style={{
        paddingTop: `${insets.top}px`,
      }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Back button or spacer */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={onBack || (() => window.history.back())}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors touch-manipulation"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Center: Title */}
        <h1 className="text-lg font-bold text-gray-900 truncate flex-1 text-center">
          {title}
        </h1>

        {/* Right: Actions */}
        <div className="w-10 flex justify-end">{actions}</div>
      </div>
    </header>
  );
}

/**
 * Mobile Drawer/Sheet Component
 * Bottom sheet that slides up from bottom
 */
export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
}

export function MobileDrawer({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
}: MobileDrawerProps) {
  const insets = useSafeAreaInsets();

  const heightClasses = {
    auto: 'max-h-[80vh]',
    half: 'h-[50vh]',
    full: 'h-screen',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`
          absolute bottom-0 left-0 right-0
          bg-white rounded-t-3xl shadow-2xl
          ${heightClasses[height]}
          animate-slide-up
        `}
        style={{
          paddingBottom: `${insets.bottom}px`,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

/**
 * Mobile FAB (Floating Action Button)
 * Primary action button that floats above content
 */
export interface MobileFABProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  variant?: 'primary' | 'secondary';
}

export function MobileFAB({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  variant = 'primary',
}: MobileFABProps) {
  const insets = useSafeAreaInsets();

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-20 left-4',
  };

  const variantClasses = {
    primary: 'bg-purple-600 text-white shadow-purple-200 active:bg-purple-700',
    secondary: 'bg-white text-purple-600 border-2 border-purple-600 active:bg-purple-50',
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed z-40
        ${positionClasses[position]}
        ${variantClasses[variant]}
        min-w-[56px] min-h-[56px]
        rounded-full shadow-lg
        flex items-center justify-center gap-2
        px-4
        touch-manipulation
        transition-all duration-200
        active:scale-95
      `}
      style={{
        marginBottom: `${insets.bottom}px`,
      }}
      aria-label={label || 'Action button'}
    >
      <span className="text-2xl">{icon}</span>
      {label && <span className="font-semibold whitespace-nowrap">{label}</span>}
    </button>
  );
}

/**
 * Mobile Pull to Refresh
 * Pull down gesture to refresh content
 */
export interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function MobilePullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: MobilePullToRefreshProps) {
  const [pulling, setPulling] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);

  const startY = React.useRef(0);
  const maxPull = 80;
  const triggerDistance = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || refreshing) return;
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || refreshing || startY.current === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && window.scrollY === 0) {
      setPulling(true);
      setPullDistance(Math.min(distance, maxPull));
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || refreshing) return;

    if (pullDistance >= triggerDistance) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }

    setPulling(false);
    setPullDistance(0);
    startY.current = 0;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pulling || refreshing) && (
        <div
          className="flex justify-center py-4 transition-opacity"
          style={{ height: `${pullDistance}px` }}
        >
          <div
            className={`
              w-8 h-8 rounded-full border-4 border-purple-600 border-t-transparent
              ${refreshing ? 'animate-spin' : ''}
            `}
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      )}

      {children}
    </div>
  );
}
