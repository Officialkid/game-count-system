'use client';

import Link from 'next/link';
import { ArrowRight, Link2, ShieldCheck } from 'lucide-react';

export default function PublicEventsPage() {
  return (
    <div className="site-shell px-4 py-16">
      <div className="container-safe">
        <div className="mx-auto max-w-4xl rounded-[36px] border border-white/50 bg-[rgba(255,250,241,0.78)] p-8 shadow-[0_24px_80px_rgba(20,33,61,0.12)] backdrop-blur-xl md:p-12">
          <div className="section-label">Public directory</div>
          <h1 className="mt-6 text-4xl font-black text-slate-950 md:text-5xl">Public event listing is no longer the main product path.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            The system now centers on secure tokenized links for admin, scoring, and public scoreboard access. That keeps each event cleaner, safer, and easier to share.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Public link',
                body: 'Share the live scoreboard or recap link generated for each event.',
                icon: Link2,
              },
              {
                title: 'Protected operations',
                body: 'Admin and scorer actions stay behind the event-specific token flow.',
                icon: ShieldCheck,
              },
              {
                title: 'New event',
                body: 'Create an event to generate the full set of links instantly.',
                icon: ArrowRight,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="surface-strong rounded-[28px] p-6">
                  <div className="inline-flex rounded-2xl bg-slate-900 p-3 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-slate-950">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/events/create" className="btn-primary text-center">
              Create event
            </Link>
            <Link href="/" className="btn-secondary text-center">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
