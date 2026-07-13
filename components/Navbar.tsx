'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, Sparkles, X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { WaitlistSignup } from '@/components/WaitlistSignup';

const sections = ['home', 'how-it-works', 'features'];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);

      const current = sections.find((section) => {
        const element = document.getElementById(section);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= 120 && rect.bottom >= 120;
      });

      if (current) setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  if (pathname !== '/') return null;

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-40 transition-all duration-300 ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="container-safe">
          <div
            className={`mx-auto flex max-w-6xl items-center justify-between rounded-full border px-4 py-3 transition-all duration-300 ${
              isScrolled
                ? 'glass shadow-[0_18px_40px_rgba(20,33,61,0.12)]'
                : 'border-transparent bg-transparent'
            }`}
          >
            <button
              onClick={() => scrollToSection('home')}
              className="flex items-center gap-3 rounded-full px-2 py-1 text-left transition-transform hover:scale-[1.01]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f766e_0%,#dd8d52_100%)] text-sm font-black text-white shadow-lg">
                GS
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">GameScore</div>
                <div className="text-base font-semibold text-slate-900">Live event command center</div>
              </div>
            </button>

            <div className="hidden items-center gap-2 lg:flex">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-all ${
                    activeSection === section
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  {section.replaceAll('-', ' ')}
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={() => setShowWaitlistModal(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                <Sparkles className="h-4 w-4 text-amber-600" />
                Pro Waitlist
              </button>
              <Link
                href="/events/create"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(20,33,61,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Launch an event
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white/80 text-slate-800 transition hover:bg-white md:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-30 md:hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <div
          className={`absolute left-4 right-4 top-24 rounded-[32px] border border-white/50 bg-[rgba(255,250,241,0.96)] p-5 shadow-[0_24px_70px_rgba(20,33,61,0.18)] transition-all duration-300 ${
            isMobileMenuOpen ? 'translate-y-0' : '-translate-y-6'
          }`}
        >
          <div className="mb-4 px-2">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Navigate</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">Build, score, broadcast</div>
          </div>
          <div className="space-y-2">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`block w-full rounded-2xl px-4 py-3 text-left text-base font-semibold transition ${
                  activeSection === section
                    ? 'bg-slate-900 text-white'
                    : 'bg-white/70 text-slate-700 hover:bg-white'
                }`}
              >
                {section.replaceAll('-', ' ')}
              </button>
            ))}
            <Link
              href="/events/create"
              className="mt-3 flex items-center justify-between rounded-2xl bg-[linear-gradient(135deg,#0f766e_0%,#1f9d8f_100%)] px-4 py-4 text-base font-semibold text-white"
            >
              Launch an event
              <ArrowUpRight className="h-5 w-5" />
            </Link>
            <button
              onClick={() => {
                setShowWaitlistModal(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base font-semibold text-slate-700"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              Join Pro Waitlist
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        title="Join the Pro Waitlist"
        size="md"
      >
        <WaitlistSignup
          source="landing-page"
          onSuccess={() => {
            setTimeout(() => setShowWaitlistModal(false), 2000);
          }}
          title="Join the Pro Waitlist"
          description="Get early access to longer retention, deeper analytics, and premium event presentation tools."
        />
      </Modal>
    </>
  );
}
