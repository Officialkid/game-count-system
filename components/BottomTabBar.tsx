'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TabItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface BottomTabBarProps {
  tabs?: TabItem[];
  showOnDesktop?: boolean;
}

/**
 * Mobile-first bottom tab bar navigation.
 * Shows as fixed bottom bar on mobile, hidden on desktop by default.
 * Provides large touch targets (py-3 px-4) and visual feedback.
 */
export function BottomTabBar({ tabs, showOnDesktop = false }: BottomTabBarProps) {
  const pathname = usePathname();

  const defaultTabs: TabItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <span className="block w-6 h-6" aria-hidden /> },
    { label: 'Events', href: '/events', icon: <span className="block w-6 h-6" aria-hidden /> },
    { label: 'Recap', href: '/recap', icon: <span className="block w-6 h-6" aria-hidden /> },
    { label: 'History', href: '/history', icon: <span className="block w-6 h-6" aria-hidden /> },
    { label: 'Settings', href: '/settings', icon: <span className="block w-6 h-6" aria-hidden /> },
  ];

  const items = tabs && tabs.length > 0 ? tabs : defaultTabs;

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-40 ${
        showOnDesktop ? '' : 'md:hidden'
      }`}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {items.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center justify-center py-2 px-3 text-xs font-medium transition-colors ${
              isActive(tab.href)
                ? 'text-purple-600 border-t-2 border-purple-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
            aria-current={isActive(tab.href) ? 'page' : undefined}
          >
            <div className="w-6 h-6 mb-1">{tab.icon}</div>
            <span className="text-xs">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
