'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  Unlock,
  Zap,
} from 'lucide-react';

export interface TvRemoteState {
  mode: 'scoreboard' | 'reveal';
  slideIndex: number;
  revealNowNonce: number;
  confettiNonce: number;
  theme: 'dark' | 'light';
  updatedAt: string;
}

interface TvRemoteControlProps {
  eventId: string;
  adminToken: string;
  teamCount: number;
  initialState?: TvRemoteState | null;
  isFrozen?: boolean;
  onFreezeToggle: () => void;
  updatingFreeze?: boolean;
}

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

export function TvRemoteControl({
  eventId,
  adminToken,
  teamCount,
  initialState,
  isFrozen,
  onFreezeToggle,
  updatingFreeze,
}: TvRemoteControlProps) {
  const [state, setState] = useState<TvRemoteState>(
    initialState || {
      mode: 'scoreboard',
      slideIndex: 0,
      revealNowNonce: 0,
      confettiNonce: 0,
      theme: 'dark',
      updatedAt: '',
    }
  );
  const [sending, setSending] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const recognitionRef = useRef<any>(null);

  const slideLabels = getSlideLabels(teamCount);
  const maxSlide = slideLabels.length - 1;

  const sendCommand = useCallback(
    async (
      patch: {
        mode?: 'scoreboard' | 'reveal';
        slideIndex?: number;
        revealNow?: boolean;
        fireConfetti?: boolean;
        theme?: 'dark' | 'light';
      },
      successMsg?: string
    ) => {
      try {
        setSending(true);
        const res = await fetch(`/api/events/${eventId}/tv-remote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-ADMIN-TOKEN': adminToken,
          },
          body: JSON.stringify(patch),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload.success) {
          throw new Error(payload?.error || 'Command failed');
        }
        setState(payload.data.tv_remote);
        if (successMsg) toast.success(successMsg);
      } catch (err: any) {
        toast.error(err?.message || 'Could not reach TV');
      } finally {
        setSending(false);
      }
    },
    [eventId, adminToken]
  );

  // Voice Command Engine (Web Speech API)
  const stateRef = useRef(state);
  stateRef.current = state;

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

      const cur = stateRef.current;

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
        sendCommand({ mode: 'reveal', slideIndex: 0 }, 'Voice: Launching Reveal Show on TV!');
      } else if (
        transcript.includes('next') ||
        transcript.includes('continue') ||
        transcript.includes('forward')
      ) {
        const nextIdx = Math.min(maxSlide, cur.slideIndex + 1);
        sendCommand({ mode: 'reveal', slideIndex: nextIdx }, `Voice: ${slideLabels[nextIdx]}`);
      } else if (transcript.includes('back') || transcript.includes('previous')) {
        const prevIdx = Math.max(0, cur.slideIndex - 1);
        sendCommand({ mode: 'reveal', slideIndex: prevIdx }, `Voice: ${slideLabels[prevIdx]}`);
      } else if (transcript.includes('confetti') || transcript.includes('celebrate')) {
        sendCommand({ fireConfetti: true }, 'Voice: Confetti!');
      } else if (
        transcript.includes('live board') ||
        transcript.includes('scoreboard') ||
        transcript.includes('exit show')
      ) {
        sendCommand({ mode: 'scoreboard' }, 'Voice: Switched TV to Live Board!');
      }
    };

    rec.onerror = () => {
      setVoiceActive(false);
    };

    rec.onend = () => {
      setVoiceActive(false);
    };

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

  const isRevealActive = state.mode === 'reveal';
  const currentLabel = slideLabels[state.slideIndex] || `Slide ${state.slideIndex + 1}`;
  const nextLabel =
    state.slideIndex < maxSlide ? slideLabels[state.slideIndex + 1] : null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Live TV Status Card */}
      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
            <Tv className="h-4 w-4" />
            Connected TV / Projector Status
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              isRevealActive
                ? 'bg-purple-500/25 text-purple-200'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
            {isRevealActive ? 'REVEAL SHOW' : 'LIVE BOARD'}
          </span>
        </div>

        <p className="mt-2.5 text-lg font-extrabold">
          {isRevealActive ? currentLabel : 'Showing Clean Live Scoreboard'}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Keep your laptop open on <strong>Present to Screen</strong> (TV Mode). Every tap
          or voice command here controls the big screen within ~1.5 seconds!
        </p>
      </div>

      {/* Primary Big Remote Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        {!isRevealActive ? (
          <button
            type="button"
            disabled={sending}
            onClick={() =>
              sendCommand(
                { mode: 'reveal', slideIndex: 0 },
                'TV switched to Reveal Show!'
              )
            }
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 px-6 py-5 text-base font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
          >
            <Sparkles className="h-5 w-5" />
            Launch Reveal Show on TV
          </button>
        ) : (
          <>
            {/* Giant Next / Back Presenter Pad */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={sending || state.slideIndex <= 0}
                onClick={() =>
                  sendCommand({
                    mode: 'reveal',
                    slideIndex: Math.max(0, state.slideIndex - 1),
                  })
                }
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-slate-300 bg-slate-50 py-5 text-sm font-bold text-slate-800 transition hover:bg-slate-100 active:scale-95 disabled:opacity-40"
              >
                <ArrowLeft className="h-6 w-6" />
                Back
              </button>

              <button
                type="button"
                disabled={sending || state.slideIndex >= maxSlide}
                onClick={() =>
                  sendCommand({
                    mode: 'reveal',
                    slideIndex: Math.min(maxSlide, state.slideIndex + 1),
                  })
                }
                className="col-span-2 flex flex-col items-center justify-center gap-1 rounded-2xl bg-indigo-600 px-4 py-5 text-base font-black text-white shadow-md transition hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 disabled:text-slate-500"
              >
                <span className="inline-flex items-center gap-1.5">
                  Next Slide
                  <ArrowRight className="h-5 w-5" />
                </span>
                {nextLabel && (
                  <span className="text-[11px] font-semibold text-indigo-100">
                    Up next: {nextLabel}
                  </span>
                )}
              </button>
            </div>

            {/* Reveal Now & Confetti Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={sending}
                onClick={() =>
                  sendCommand({ mode: 'reveal', revealNow: true }, 'Revealing now!')
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-95"
              >
                <Zap className="h-4 w-4 text-amber-600" />
                Skip Countdown
              </button>

              <button
                type="button"
                disabled={sending}
                onClick={() => sendCommand({ fireConfetti: true }, 'Confetti fired!')}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50 px-3 py-3 text-xs font-bold text-pink-800 hover:bg-pink-100 active:scale-95"
              >
                <PartyPopper className="h-4 w-4 text-pink-600" />
                Fire Confetti
              </button>
            </div>

            {/* Return TV to Live Scoreboard */}
            <button
              type="button"
              disabled={sending}
              onClick={() =>
                sendCommand(
                  { mode: 'scoreboard', slideIndex: 0 },
                  'TV returned to Live Scoreboard!'
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <Monitor className="h-4 w-4" />
              Return TV to Live Scoreboard
            </button>
          </>
        )}

        {/* Voice Control + Freeze Shortcut Row */}
        <div className="grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={toggleVoiceControl}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold transition ${
              voiceActive
                ? 'border-red-400 bg-red-50 text-red-700 animate-pulse'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {voiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {voiceActive ? 'Listening… Tap Stop' : 'Voice Control'}
          </button>

          <button
            type="button"
            disabled={updatingFreeze}
            onClick={onFreezeToggle}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-bold transition ${
              isFrozen
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            {isFrozen ? <Unlock className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
            {isFrozen ? 'Unfreeze Board' : 'Freeze Board'}
          </button>
        </div>

        {voiceActive && (
          <div className="rounded-xl bg-slate-900 p-3 text-center text-xs text-slate-200">
            <p className="font-bold text-emerald-400">
              Say: &quot;Reveal&quot; · &quot;Next&quot; · &quot;Back&quot; ·
              &quot;Confetti&quot; · &quot;Live board&quot;
            </p>
            {lastHeard && (
              <p className="mt-1 text-slate-400">Last heard: &ldquo;{lastHeard}&rdquo;</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
