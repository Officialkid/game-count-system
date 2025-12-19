'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LogOut, Calendar, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { eventsService } from '@/lib/services';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, authReady } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasRecap, setHasRecap] = useState(false);

  const now = useMemo(() => new Date(), []);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Navigation for authenticated users
  const authNavLinks: NavLink[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="w-5 h-5" /> },
    { label: 'Events', href: '/events', icon: <Calendar className="w-5 h-5" /> },
    ...(hasRecap ? [{ label: 'Recap', href: '/recap', icon: <Home className="w-5 h-5" /> }] : []),
  ];

  // Navigation for public pages
  const publicNavLinks: NavLink[] = [
    { label: 'Home', href: '/', icon: <Home className="w-5 h-5" /> },
    { label: 'Public Events', href: '/public', icon: <Calendar className="w-5 h-5" /> },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  // Determine which nav links to show
  const navLinks = isAuthenticated ? authNavLinks : publicNavLinks;

  // Check if recap is available (at least one event exists)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Wait for auth to be fully ready to avoid 401s during initialization
        if (!authReady || !isAuthenticated || !user?.id) return;
        const res = await eventsService.getEvents(user.id);
        const events = res?.data?.events || [];
        if (active) setHasRecap(Array.isArray(events) && events.length > 0);
      } catch {
        // keep hidden if error
        if (active) setHasRecap(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id, authReady, isAuthenticated]);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 flex items-center justify-center">
              <img src="/logo.png" alt="GameScore" className="w-6 h-6" />
            </div>
            <span className="font-bold text-neutral-900 hidden sm:inline group-hover:text-purple-600 transition-colors">
              GameScore
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-tour={link.label === 'Recap' ? 'recap-feature' : undefined}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive(link.href)
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {link.icon}
                <span className={link.label === 'Recap' && hasRecap ? 'relative' : ''}>
                  {link.label}
                  {link.label === 'Recap' && hasRecap ? (
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-purple-500 via-amber-500 to-purple-500 opacity-80"
                    />
                  ) : null}
                </span>
                {link.label === 'Recap' && hasRecap ? (
                  <span aria-hidden className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                ) : null}
              </Link>
            ))}
          </div>

          {/* User Menu or Auth Buttons */}
          <div className="flex items-center gap-2 md:gap-4">
            {isAuthenticated && user ? (
              <>
                {/* Desktop: User greeting + avatar dropdown */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">{greeting}, {user.name}</p>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="User menu"
                        className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/profile')}>
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <LogOut className="w-4 h-4 mr-2" /> Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                {/* Desktop: Auth Buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors font-medium"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors font-medium"
                  >
                    <UserPlus className="w-4 h-4" /> Sign Up
                  </Link>
                </div>
              </>
            )}

            {/* Mobile: Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-neutral-700" />
              ) : (
                <Menu className="w-6 h-6 text-neutral-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-neutral-50 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive(link.href)
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            <div className="border-t border-neutral-200 pt-2 mt-2">
              {isAuthenticated && user ? (
                <>
                  <div className="px-4 py-2 mb-2">
                    <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100 font-medium transition-all"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100 font-medium transition-all w-full"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium transition-all w-full mt-2"
                  >
                    <UserPlus className="w-4 h-4" /> Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
