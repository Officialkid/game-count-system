'use client';

import { useEffect, useState } from 'react';
import { Activity, RadioTower, Trophy, Users } from 'lucide-react';

const slides = [
  {
    eyebrow: 'Scoreboard Experience',
    title: 'A sharper live-scoring interface for real events.',
    description:
      'Keep operators focused, audiences engaged, and score history visible without burying people under clutter.',
    stats: [
      { label: 'Control', value: 'Admin-ready', icon: Users },
      { label: 'Rhythm', value: 'Live updates', icon: Activity },
      { label: 'Display', value: 'Broadcast feel', icon: RadioTower },
    ],
    accent: 'from-[#0f766e] to-[#1f9d8f]',
  },
  {
    eyebrow: 'Operator Workflow',
    title: 'Create, seed, score, and publish from one clear system.',
    description:
      'The redesign turns the product into a modern command center instead of a stack of utility pages.',
    stats: [
      { label: 'Setup', value: '60 sec', icon: Activity },
      { label: 'Team ops', value: 'Bulk-ready', icon: Users },
      { label: 'Results', value: 'Shareable', icon: Trophy },
    ],
    accent: 'from-[#c96a3d] to-[#dd8d52]',
  },
  {
    eyebrow: 'Audience Layer',
    title: 'Public scoreboards that feel event-worthy, not improvised.',
    description:
      'Standings, recaps, and score history should feel premium on phones, projectors, and shared links.',
    stats: [
      { label: 'Layout', value: 'Responsive', icon: RadioTower },
      { label: 'Mood', value: 'Premium', icon: Trophy },
      { label: 'Trust', value: 'Clear status', icon: Activity },
    ],
    accent: 'from-[#14213d] to-[#244c67]',
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[40px] border border-white/50 bg-[rgba(255,250,241,0.72)] px-6 py-8 shadow-[0_30px_100px_rgba(20,33,61,0.12)] backdrop-blur-xl md:px-10 md:py-10">
      <div className="hero-orb left-[-6rem] top-[-4rem] h-40 w-40 bg-[rgba(201,106,61,0.3)]" />
      <div className="hero-orb bottom-[-5rem] right-[-4rem] h-44 w-44 bg-[rgba(15,118,110,0.26)]" />

      <div className="grid gap-8 lg:grid-cols-[1.25fr_0.95fr] lg:items-center">
        <div className="relative min-h-[24rem]">
          {slides.map((slide, index) => (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-all duration-700 ${
                currentSlide === index
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-6 opacity-0'
              }`}
            >
              <div className="max-w-3xl pt-3">
                <div className="section-label">{slide.eyebrow}</div>
                <h1 className="display-title mt-6 max-w-4xl text-balance text-slate-950">
                  {slide.title}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                  {slide.description}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {slide.stats.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="metric-card">
                        <div className={`inline-flex rounded-full bg-gradient-to-r ${slide.accent} p-2 text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {item.label}
                        </div>
                        <div className="mt-2 text-xl font-bold text-slate-900">{item.value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="surface-dark rounded-[36px] p-6 md:p-8">
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-white/60">Live production preview</div>
              <div className="mt-1 text-lg font-semibold text-white">Command Center</div>
            </div>
            <div className="badge bg-emerald-400/15 text-emerald-200">Live</div>
          </div>

          <div className="mt-6 rounded-[28px] bg-white/6 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.22em] text-white/55">Featured event</div>
                <div className="mt-2 text-2xl font-bold text-white">Bootcamp Finals</div>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/80">Day 4</div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { name: 'Falcons', score: 142, color: '#F4B63D' },
                { name: 'Comets', score: 136, color: '#39A0ED' },
                { name: 'Raiders', score: 119, color: '#F97316' },
              ].map((team, index) => (
                <div
                  key={team.name}
                  className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/6 px-4 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-slate-950"
                      style={{ backgroundColor: team.color }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-base font-semibold text-white">{team.name}</div>
                      <div className="text-sm text-white/55">Momentum on</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white">{team.score}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/45">points</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/50">Entries</div>
                <div className="mt-2 text-2xl font-bold text-white">58</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/50">Updated</div>
                <div className="mt-2 text-2xl font-bold text-white">Now</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                onClick={() => setCurrentSlide(index)}
                className={`rounded-full transition-all ${
                  index === currentSlide ? 'h-3 w-12 bg-white' : 'h-3 w-3 bg-white/35 hover:bg-white/55'
                }`}
                aria-label={`Show slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
