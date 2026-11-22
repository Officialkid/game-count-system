'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Monitor,
  PencilLine,
  Shield,
  Trophy,
} from 'lucide-react';

interface CreatedEventPayload {
  event: {
    id: string;
    name: string;
    number_of_days?: number;
  };
  tokens: {
    admin_token: string;
    scorer_token: string;
    public_token: string;
  };
  teams?: Array<{ id: string; name: string; color: string }>;
}

export default function EventCreatedSuccessPage() {
  const [data, setData] = useState<CreatedEventPayload | null>(null);
  const [origin, setOrigin] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      const raw = window.sessionStorage.getItem('gamesco_created_event');
      if (raw) {
        setData(JSON.parse(raw));
      }
    } catch {
      // Ignore
    }
  }, []);

  const copyLink = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast.success('Link copied!');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Unable to copy automatically');
    }
  };

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Trophy className="mx-auto h-10 w-10 text-blue-600" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">No recent event found</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Create a new event or open one saved on your device from the Home page.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Go Home
            </Link>
            <Link
              href="/events/create"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create Event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const base = origin || '';
  const adminPath = `/admin/${data.tokens.admin_token}`;
  const scorerPath = `/score/${data.tokens.scorer_token}`;
  const publicPath = `/scoreboard/${data.tokens.public_token}`;

  const adminUrl = `${base}${adminPath}`;
  const scorerUrl = `${base}${scorerPath}`;
  const publicUrl = `${base}${publicPath}`;

  const links = [
    {
      key: 'admin',
      title: 'Admin Link (Private)',
      description: 'Manage teams, switch days, lock days, publish results & export PDF.',
      url: adminUrl,
      path: adminPath,
      icon: Shield,
      accent: 'border-blue-200 bg-blue-50/50',
      badge: 'Saved on this device',
    },
    {
      key: 'scorer',
      title: 'Scorer Link (Share with Team)',
      description: 'Enter game marks & deductions (works offline outdoors).',
      url: scorerUrl,
      path: scorerPath,
      icon: PencilLine,
      accent: 'border-emerald-200 bg-emerald-50/50',
      badge: 'Works offline',
    },
    {
      key: 'public',
      title: 'Public Scoreboard Link',
      description: 'Read-only live standings for projectors, TVs, and parents.',
      url: publicUrl,
      path: publicPath,
      icon: Monitor,
      accent: 'border-amber-200 bg-amber-50/50',
      badge: 'Read-only',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Success Banner */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {data.event.name} is ready!
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Your Admin access is automatically saved on this device. Share the Scorer and
            Public links below.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={adminPath}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Open Admin Dashboard
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href={scorerPath}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Start Scoring Now
              <PencilLine className="h-4 w-4" />
            </Link>
            <Link
              href={publicPath}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              View Public Scoreboard
              <Monitor className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Share Links + QR */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 md:col-span-2">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className={`rounded-2xl border p-4 shadow-sm ${item.accent}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-700" />
                      <h2 className="text-sm font-bold text-slate-900">{item.title}</h2>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 shadow-sm">
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={item.url}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink(item.key, item.url)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      {copiedKey === item.key ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Public QR Code */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Public Scoreboard QR
            </p>
            <div className="my-4 rounded-xl border border-slate-100 bg-white p-3">
              {publicUrl && <QRCodeSVG value={publicUrl} size={152} />}
            </div>
            <p className="text-xs text-slate-600">
              Scan to view live daily &amp; overall results on any phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
