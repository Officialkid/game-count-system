'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ChartNoAxesCombined, Gauge, LayoutGrid, Link2, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HeroCarousel from '@/components/HeroCarousel';

const tutorialSteps = [
  {
    title: 'Create the event shell',
    description: 'Spin up an event, get secure links, and move straight into operations without sign-up friction.',
    icon: '01',
  },
  {
    title: 'Run scoring like a control room',
    description: 'Separate admin control from scoring input so operators stay fast and mistakes stay low.',
    icon: '02',
  },
  {
    title: 'Broadcast polished live results',
    description: 'Share a scoreboard that looks intentional on phones, projectors, and recap views.',
    icon: '03',
  },
];

export default function HomePage() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      const timer = window.setTimeout(() => setShowTutorial(true), 1800);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  return (
    <div className="site-shell">
      <Navbar />

      <main className="relative z-10">
        <section id="home" className="container-safe pt-28 pb-16 md:pt-36">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="section-label">Next-generation event scoring</div>
                <h1 className="mt-6 text-balance text-[clamp(3rem,7vw,6.25rem)] font-black leading-[0.92] text-slate-950">
                  Redesigning live scoring into a product people trust on sight.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                  GameScore helps you launch events, run scoring cleanly, and present standings with a stronger modern
                  interface from admin control to public scoreboard.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:max-w-xl">
                {[
                  ['Launch', 'Tokenized setup'],
                  ['Operate', 'Separate scorer flow'],
                  ['Share', 'Audience-ready output'],
                ].map(([label, value]) => (
                  <div key={label} className="metric-card">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</div>
                    <div className="mt-2 text-lg font-bold text-slate-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <HeroCarousel />

            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row">
              <Link href="/events/create" className="btn-primary text-center text-base md:text-lg">
                Start a live event
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button onClick={() => setShowTutorial(true)} className="btn-secondary text-base md:text-lg">
                See the 60-second product tour
              </button>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="container-safe py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="section-label">How the product flows</div>
                <h2 className="mt-5 text-4xl font-black text-slate-950 md:text-5xl">Three clear stages, one calm workflow.</h2>
              </div>
              <p className="max-w-xl text-lg text-slate-600">
                The redesign is built around operational clarity so setup, scoring, and public display each get the right level of focus.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {tutorialSteps.map((step) => (
                <article key={step.icon} className="surface-panel rounded-[32px] p-8">
                  <div className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-black tracking-[0.24em] text-slate-500">
                    {step.icon}
                  </div>
                  <h3 className="mt-6 text-2xl font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-4 text-base leading-7 text-slate-600">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="container-safe py-16 md:py-20">
          <div className="mx-auto max-w-6xl rounded-[40px] border border-white/50 bg-[rgba(255,250,241,0.72)] p-8 shadow-[0_30px_90px_rgba(20,33,61,0.1)] backdrop-blur-xl md:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
              <div>
                <div className="section-label">What the redesign is optimizing</div>
                <h2 className="mt-5 text-4xl font-black text-slate-950 md:text-5xl">Less clutter. More confidence. Better event energy.</h2>
                <p className="mt-5 text-lg leading-8 text-slate-600">
                  We are pushing the app away from “utility page” styling and into a sharper product identity with clearer hierarchy, stronger motion, and better live-event presence.
                </p>
                <div className="mt-8 grid gap-3">
                  {[
                    'Cleaner information grouping for admins and scorers',
                    'Premium public scoreboard feel for shared links and projectors',
                    'More intentional color, typography, spacing, and motion across the product',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/80 px-4 py-4">
                      <Sparkles className="mt-0.5 h-5 w-5 text-amber-600" />
                      <span className="text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: 'Operator clarity',
                    description: 'Admin pages behave like a command center, not a loose form collection.',
                    icon: Gauge,
                  },
                  {
                    title: 'Faster setup',
                    description: 'Event creation stays quick while the visual system feels far more premium.',
                    icon: LayoutGrid,
                  },
                  {
                    title: 'Shareable outputs',
                    description: 'Public scoreboard and recap views feel polished enough to project confidently.',
                    icon: Link2,
                  },
                  {
                    title: 'Better insight surfaces',
                    description: 'Standings, score history, and metrics get clearer emphasis and visual rhythm.',
                    icon: ChartNoAxesCombined,
                  },
                ].map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <article key={feature.title} className="surface-strong rounded-[28px] p-6">
                      <div className="inline-flex rounded-2xl bg-slate-900 p-3 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 text-xl font-bold text-slate-950">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="container-safe pb-24 pt-6">
          <div className="mx-auto max-w-5xl rounded-[42px] bg-[linear-gradient(135deg,#14213d_0%,#234662_100%)] px-8 py-12 text-center text-white shadow-[0_30px_100px_rgba(20,33,61,0.22)] md:px-12">
            <div className="section-label mx-auto w-fit border-white/10 bg-white/10 text-white">Ready to launch</div>
            <h2 className="mt-6 text-balance text-4xl font-black md:text-5xl">Create an event that already feels production-ready.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/75">
              Start with the redesigned flow, get your secure links instantly, and run the event with a much stronger UI foundation.
            </p>
            <div className="mt-8">
              <Link
                href="/events/create"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-lg font-bold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-2xl"
              >
                Create free event
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="surface-strong w-full max-w-xl rounded-[36px] p-8 md:p-10">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="section-label">Quick walkthrough</div>
                <h3 className="mt-4 text-3xl font-black text-slate-950">{tutorialSteps[tutorialStep].title}</h3>
              </div>
              <button
                onClick={closeTutorial}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Close
              </button>
            </div>

            <p className="text-lg leading-8 text-slate-600">{tutorialSteps[tutorialStep].description}</p>

            <div className="mt-8 flex gap-2">
              {tutorialSteps.map((step, index) => (
                <div
                  key={step.icon}
                  className={`h-2 rounded-full transition-all ${
                    index === tutorialStep ? 'w-16 bg-slate-900' : 'w-8 bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {tutorialStep < tutorialSteps.length - 1 ? (
                <>
                  <button onClick={closeTutorial} className="btn-secondary">
                    Skip for now
                  </button>
                  <button onClick={() => setTutorialStep((step) => step + 1)} className="btn-primary">
                    Next step
                  </button>
                </>
              ) : (
                <Link href="/events/create" onClick={closeTutorial} className="btn-primary text-center">
                  Launch my first event
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
