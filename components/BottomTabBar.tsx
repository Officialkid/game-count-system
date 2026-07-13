'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, House, PlusCircle, Trophy } from 'lucide-react';

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

export function BottomTabBar({ tabs, showOnDesktop = false }: BottomTabBarProps) {
  const pathname = usePathname();

  const defaultTabs: TabItem[] = [
    { label: 'Home', href: '/', icon: <House size={20} /> },
    {
      label: 'Create',
      href: '/events/create',
      icon: <PlusCircle size={20} />,
      matchPaths: ['/events/create', '/quick-create'],
    },
    {
      label: 'Events',
      href: '/dashboard',
      icon: <Trophy size={20} />,
      matchPaths: ['/dashboard', '/events'],
    },
    { label: 'Explore', href: '/#features', icon: <Compass size={20} /> },
  ];

  const items = tabs && tabs.length > 0 ? tabs : defaultTabs;

  const isActive = (tab: TabItem) => {
    if (pathname === tab.href) return true;
    if (pathname === '/' && tab.href === '/') return true;
    if (tab.href !== '/' && pathname.startsWith(tab.href)) return true;
    if (tab.matchPaths) return tab.matchPaths.some((path) => pathname.startsWith(path));
    return false;
  };

  return (
    <nav
      className={`fixed bottom-3 left-3 right-3 z-50 rounded-[28px] border border-white/50 bg-[rgba(255,250,241,0.92)] shadow-[0_20px_60px_rgba(20,33,61,0.18)] backdrop-blur-xl ${
        showOnDesktop ? '' : 'md:hidden'
      }`}
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="mx-auto grid h-[74px] max-w-screen-xl grid-cols-4 gap-1 p-2">
        {items.map((tab) => {
          const active = isActive(tab);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-[20px] px-2 transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-slate-900 text-white shadow-[0_12px_30px_rgba(20,33,61,0.22)]'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className={`${active ? 'scale-110' : 'scale-100'} transition-transform`}>{tab.icon}</div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
