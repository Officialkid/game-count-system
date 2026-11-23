'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  Monitor,
  PartyPopper,
  Snowflake,
  Sparkles,
  Tv,
  Unlink,
  Unlock,
  Zap,
} from 'lucide-react';
import { PoweredByFooter } from '@/components/PoweredByFooter';

interface PairedTvSession {
  event_id: string;
  event_name: string;
  team_count: number;
  is_frozen: boolean;
  pair_code: string;
  tv_remote: {
    mode: 'scoreboard' | 'reveal';
    slideIndex: number;
    revealNowNonce: number;
    confettiNonce: number;
    theme: 'dark' | 'light';
  };
}

const SESSION_KEY = 'gamesco_paired_tv_v1';

function getSlideLabels(teamCount: number): string[] {
  const labels = ['1. Hype Intro', '2. By The Numbers'];
  const count = Math.min(3, Math.max(1, teamCount));
  for (let p = count; p >= 1; p--) {
    if (p === 3) labels.push('3rd Place (5-4-3-2-1)');
    else if (p === 2) labels.push('2nd Place (5-4-3-2-1)');
    else labels.push('🏆 #1 CHAMPION!');
  }
  labels.push('Official Podium');
  return labels;
}

export default function PhoneTvRemotePage() {
  const [codeInput, setCodeInput] = useState('');
  const [pairing, setPairing] = useState(false);
  const [session, setSession] = useState<PairedTvSession | null>(null);
  const [sending, setSending] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [lastHeard, setLastHeard] = useState('');

  const recognitionRef = useRef<any>(null);
  const sessionRef = useRef<PairedTvSession | null>(null);
  sessionRef.current = session;

  // Auto-reconnect if phone was paired recently OR ?code=XXXX in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code')?.replace(/[^0-9]/g, '');
    if (urlCode && urlCode.length === 4) {
      setCodeInput(urlCode);
      pairWithCode(urlCode, true);
      return;
    }

    try {
      const saved = window.localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PairedTvSession;
        if (parsed?.pair_code) {
          setSession(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const pairWithCode = async (rawCode: string, silent = false) => {
    const clean = rawCode.replace(/[^0-9]/g, '').slice(0, 4);
    if (clean.length !== 4) {
      if (!silent) toast.error('Enter the 4-digit code shown on the TV');
      return;
    }

    try {
      setPairing(true);
      const res = await fetch('/api/tv-remote/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.success) {
        throw new Error(payload?.error || 'Could not pair with TV');
      }
      const nextSession = payload.data as PairedTvSession;
      setSession(nextSession);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      toast.success(`Connected to ${nextSession.event_name} TV!`);
    } catch (err: any) {
      if (!silent) toast.error(err?.message || 'Pairing failed');
    } finally {
      setPairing(false);
    }
  };

  const handleDisconnect = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore
    }
    setVoiceActive(false);
    setSession(null);
    setCodeInput('');
    window.localStorage.removeItem(SESSION_KEY);
    toast('Disconnected from TV');
  };

  const sendCommand = useCallback(
    async (
      patch: {
        mode?: 'scoreboard' | 'reveal';
        slideIndex?: number;
        revealNow?: boolean;
        fireConfetti?: boolean;
        freezeAction?: 'freeze' | 'unfreeze';
      },
      successMsg?: string
    ) => {
      const cur = sessionRef.current;
      if (!cur) return;
      try {
        setSending(true);
        const res = await fetch('/api/tv-remote/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: cur.pair_code,
            ...patch,
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload.success) {
          throw new Error(payload?.error || 'Command failed');
        }
        const updated: PairedTvSession = {
          ...cur,
          tv_remote: payload.data.tv_remote,
          is_frozen: payload.data.is_frozen,
        };
        setSession(updated);
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        if (successMsg) toast.success(successMsg);
      } catch (err: any) {
        toast.error(err?.message || 'Could not reach TV');
      } finally {
        setSending(false);
      }
    },
    []
  );

  const toggleVoiceControl = () => {
    if (voiceActive) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
      setVoiceActive(false);
      toast('Voice control paused', { icon: '🎙️' });
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice commands work in Chrome / Edge / Android Chrome.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      const latest = event.results[event.results.length - 1];
      if (!latest?.isFinal) return;
      const transcript = String(latest[0]?.transcript || '')
        .trim()
        .toLowerCase();
      setLastHeard(transcript);

      const cur = sessionRef.current;
      if (!cur) return;
      const labels = getSlideLabels(cur.team_count);
      const maxIdx = labels.length - 1;

      if (
        transcript.includes('reveal now') ||
        transcript.includes('skip countdown') ||
        transcript.includes('open now')
      ) {
        sendCommand({ mode: 'reveal', revealNow: true }, 'Voice: Reveal Now!');
      } else if (
        transcript.includes('reveal') ||
        transcript.includes('start show') ||
        transcript.includes('recap')
      ) {
        sendCommand({ mode: 'reveal', slideIndex: 0 }, 'Voice: Launching Reveal on TV!');
      } else if (
        transcript.includes('next') ||
        transcript.includes('continue') ||
        transcript.includes('forward')
      ) {
        const nextIdx = Math.min(maxIdx, (cur.tv_remote.slideIndex ?? 0) + 1);
        sendCommand({ mode: 'reveal', slideIndex: nextIdx }, `Voice: ${labels[nextIdx]}`);
      } else if (transcript.includes('back') || transcript.includes('previous')) {
        const prevIdx = Math.max(0, (cur.tv_remote.slideIndex ?? 0) - 1);
        sendCommand({ mode: 'reveal', slideIndex: prevIdx }, `Voice: ${labels[prevIdx]}`);
      } else if (transcript.includes('confetti') || transcript.includes('celebrate')) {
        sendCommand({ fireConfetti: true }, 'Voice: Confetti on TV!');
      } else if (
        transcript.includes('live board') ||
        transcript.includes('scoreboard') ||
        transcript.includes('main marks') ||
        transcript.includes('exit')
      ) {
        sendCommand({ mode: 'scoreboard', slideIndex: 0 }, 'Voice: TV back to Live Board!');
      }
    };

    rec.onerror = () => setVoiceActive(false);
    rec.onend = () => setVoiceActive(false);

    try {
      rec.start();
      recognitionRef.current = rec;
      setVoiceActive(true);
      toast.success('Listening! Say "Reveal", "Next", "Back", "Confetti", or "Live board"');
    } catch {
      toast.error('Could not start microphone');
    }
  };

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
    };
  }, []);

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950 px-4 py-8 text-white">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className="rounded-3xl border border-white/15 bg-white/5 p-7 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Tv className="h-7 w-7" />
            </div>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.25em] text-blue-400">
              GamesCo TV Remote
            </p>
            <h1 className="mt-1.5 text-2xl font-black">Connect to Your TV Screen</h1>
            <p className="mt-2 text-sm text-slate-300">
              Enter the <strong>4-digit TV Code</strong> shown on your laptop/projector
              scoreboard to control it wirelessly from anywhere in the room.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                pairWithCode(codeInput);
              }}
              className="mt-6 space-y-4"
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0000"
                className="w-full rounded-2xl border-2 border-white/20 bg-black/40 px-4 py-4 text-center font-mono text-4xl font-black tracking-[0.45em] text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                autoFocus
              />

              <button
                type="submit"
                disabled={pairing || codeInput.length !== 4}
                className="w-full rounded-2xl bg-blue-600 py-4 text-base font-black text-white shadow-lg transition hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400"
              >
                {pairing ? 'Connecting…' : 'Connect to TV'}
              </button>
            </form>

            <Link
              href="/"
              className="mt-5 inline-block text-xs font-semibold text-slate-400 hover:text-white"
            >
              ← Back to My Events
            </Link>
          </div>
        </div>
        <PoweredByFooter dark />
      </div>
    );
  }

  const slideLabels = getSlideLabels(session.team_count);
  const maxSlide = slideLabels.length - 1;
  const isReveal = session.tv_remote.mode === 'reveal';
  const currentLabel =
    slideLabels[session.tv_remote.slideIndex] ||
    `Slide ${session.tv_remote.slideIndex + 1}`;
  const nextLabel =
    session.tv_remote.slideIndex < maxSlide
      ? slideLabels[session.tv_remote.slideIndex + 1]
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 px-4 py-5 text-white">
      <div className="mx-auto w-full max-w-md flex-1 space-y-4">
        {/* Connected Header */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                Connected · TV #{session.pair_code}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
            >
              <Unlink className="h-3 w-3" />
              Disconnect
            </button>
          </div>
          <h1 className="mt-1.5 truncate text-lg font-black text-white">
            {session.event_name}
          </h1>
          <p className="text-xs text-slate-300">
            TV is showing:{' '}
            <strong className="text-amber-300">
              {isReveal ? `Reveal Show · ${currentLabel}` : 'Live Scoreboard'}
            </strong>
          </p>
        </div>

        {/* Big Voice Command Button */}
        <button
          type="button"
          onClick={toggleVoiceControl}
          className={`flex w-full items-center justify-center gap-3 rounded-2xl border-2 px-5 py-4 text-base font-black transition ${
            voiceActive
              ? 'border-red-400 bg-red-500/20 text-red-200 animate-pulse'
              : 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25'
          }`}
        >
          {voiceActive ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          {voiceActive ? 'Listening… Tap to Stop' : 'Tap for Voice Control'}
        </button>

        {voiceActive && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center text-xs">
            <p className="font-bold text-emerald-300">
              Say: &ldquo;Reveal&rdquo; · &ldquo;Next&rdquo; · &ldquo;Back&rdquo; ·
              &ldquo;Confetti&rdquo; · &ldquo;Live board&rdquo;
            </p>
            {lastHeard && (
              <p className="mt-1 text-slate-400">Heard: &ldquo;{lastHeard}&rdquo;</p>
            )}
          </div>
        )}

        {/* Main Touch Controls */}
        <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
          {!isReveal ? (
            <button
              type="button"
              disabled={sending}
              onClick={() =>
                sendCommand(
                  { mode: 'reveal', slideIndex: 0 },
                  'TV switched to Reveal Show!'
                )
              }
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 px-6 py-6 text-lg font-black text-white shadow-xl active:scale-95 disabled:opacity-60"
            >
              <Sparkles className="h-6 w-6" />
              REVEAL ON TV NOW
            </button>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={sending || session.tv_remote.slideIndex <= 0}
                  onClick={() =>
                    sendCommand({
                      mode: 'reveal',
                      slideIndex: Math.max(0, session.tv_remote.slideIndex - 1),
                    })
                  }
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/15 bg-white/10 py-6 text-sm font-bold text-white active:scale-95 disabled:opacity-35"
                >
                  <ArrowLeft className="h-6 w-6" />
                  Back
                </button>

                <button
                  type="button"
                  disabled={sending || session.tv_remote.slideIndex >= maxSlide}
                  onClick={() =>
                    sendCommand({
                      mode: 'reveal',
                      slideIndex: Math.min(maxSlide, session.tv_remote.slideIndex + 1),
                    })
                  }
                  className="col-span-2 flex flex-col items-center justify-center gap-1 rounded-2xl bg-indigo-600 px-4 py-6 text-lg font-black text-white shadow-lg active:scale-95 disabled:bg-slate-700 disabled:text-slate-400"
                >
                  <span className="inline-flex items-center gap-1.5">
                    NEXT SLIDE
                    <ArrowRight className="h-5 w-5" />
                  </span>
                  {nextLabel && (
                    <span className="text-xs font-semibold text-indigo-100">
                      Up next: {nextLabel}
                    </span>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() =>
                    sendCommand({ mode: 'reveal', revealNow: true }, 'Revealing now!')
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/20 py-3.5 text-xs font-bold text-amber-200 active:scale-95"
                >
                  <Zap className="h-4 w-4" />
                  Skip Countdown
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => sendCommand({ fireConfetti: true }, 'Confetti fired!')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-pink-400/40 bg-pink-500/20 py-3.5 text-xs font-bold text-pink-200 active:scale-95"
                >
                  <PartyPopper className="h-4 w-4" />
                  Fire Confetti
                </button>
              </div>

              <button
                type="button"
                disabled={sending}
                onClick={() =>
                  sendCommand(
                    { mode: 'scoreboard', slideIndex: 0 },
                    'TV returned to Live Scoreboard!'
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3.5 text-sm font-bold text-white hover:bg-white/15"
              >
                <Monitor className="h-4 w-4" />
                Return TV to Live Scoreboard
              </button>
            </>
          )}

          <button
            type="button"
            disabled={sending}
            onClick={() =>
              sendCommand(
                { freezeAction: session.is_frozen ? 'unfreeze' : 'freeze' },
                session.is_frozen ? 'Public board unfrozen!' : 'Public board frozen!'
              )
            }
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold ${
              session.is_frozen
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                : 'border-sky-400/40 bg-sky-500/15 text-sky-200'
            }`}
          >
            {session.is_frozen ? <Unlock className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
            {session.is_frozen ? 'Unfreeze Public Board' : 'Freeze Public Board'}
          </button>
        </div>
      </div>

      <PoweredByFooter dark />
    </div>
  );
}
