'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, Trophy, Info, Settings } from 'lucide-react';

interface TabItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  matchPaths?: string[];
}

interface BottomTabBarProps {
  tabs?: TabItem[];
  showOnDesktop?: boolean;
}

/**
 * Mobile-first bottom tab bar navigation.
 * Shows as fixed bottom bar on mobile, hidden on desktop by default.
 * Provides large touch targets and visual feedback.
 */
export function BottomTabBar({ tabs, showOnDesktop = false }: BottomTabBarProps) {
  const pathname = usePathname();

  const defaultTabs: TabItem[] = [
    { 
      label: 'Home', 
      href: '/', 
      icon: <Home size={24} />,
    },
    { 
      label: 'Create', 
      href: '/events/create', 
      icon: <PlusCircle size={24} />,
      matchPaths: ['/events/create', '/quick-create'],
    },
    { 
      label: 'Events', 
      href: '/dashboard', 
      icon: <Trophy size={24} />,
      matchPaths: ['/dashboard', '/events'],
    },
    { 
      label: 'Settings', 
      href: '/settings', 
      icon: <Settings size={24} />,
    },
  ];

  const items = tabs && tabs.length > 0 ? tabs : defaultTabs;

  const isActive = (tab: TabItem) => {
    if (pathname === tab.href) return true;
    if (pathname === '/' && tab.href === '/') return true;
    if (tab.href !== '/' && pathname.startsWith(tab.href)) return true;
    if (tab.matchPaths) {
      return tab.matchPaths.some(path => pathname.startsWith(path));
    }
    return false;
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50 ${
        showOnDesktop ? '' : 'md:hidden'
      }`}
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="grid grid-cols-4 h-16 max-w-screen-xl mx-auto">
        {items.map((tab) => {
          const active = isActive(tab);
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex flex-col items-center justify-center gap-1
                transition-all duration-200 ease-in-out
                active:scale-95 active:bg-gray-100
                ${active 
                  ? 'text-purple-600 bg-purple-50 border-t-3 border-purple-600' 
                  : 'text-gray-700 hover:text-purple-700 hover:bg-gray-50'
                }
              `}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <div 
                className={`transition-transform ${
                  active ? 'scale-110' : 'scale-100'
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-xs font-medium">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
