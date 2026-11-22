'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Flame,
  Maximize2,
  Minimize2,
  Monitor,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface RankedTeam {
  id: string;
  name: string;
  color: string;
  points: number;
  overall_points: number;
  rank: number;
}

interface DayInfo {
  day_number: number;
  label: string;
  is_locked: boolean;
  carry_over_from_previous: boolean;
}

interface ActivityItem {
  id: string;
  team_id: string;
  team_name: string;
  team_color: string;
  category: string;
  points: number;
  day_number: number;
  day_label: string;
  created_at: string;
}

interface RecapPayload {
  event: {
    id: string;
    name: string;
    numberOfDays: number;
    activeDayNumber: number;
    isFinalized: boolean;
  };
  overall_standings: RankedTeam[];
  day_standings: Record<number, RankedTeam[]>;
  scores: ActivityItem[];
  days: DayInfo[];
}

type SlideType =
  | { kind: 'intro' }
  | { kind: 'stats' }
  | {
      kind: 'reveal';
      placeIndex: number;
      leadIn: string;
      rankLabel: string;
      medal: string;
      useCountdown: boolean;
      isChampion: boolean;
    }
  | { kind: 'podium' };

// Synthesized Web Audio sound effects (zero external MP3 dependencies)
function createSoundEngine() {
  let ctx: AudioContext | null = null;
  const getCtx = () => {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  const playTone = (
    freq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.18,
    delay = 0
  ) => {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  };

  return {
    tick(num: number) {
      const freqMap: Record<number, number> = {
        5: 280,
        4: 330,
        3: 390,
        2: 460,
        1: 580,
      };
      playTone(freqMap[num] || 360, 0.2, 'sine', 0.22);
    },
    whoosh() {
      playTone(220, 0.22, 'sine', 0.12, 0);
      playTone(440, 0.26, 'triangle', 0.15, 0.08);
    },
    reveal() {
      playTone(392, 0.22, 'triangle', 0.16, 0);
      playTone(523.25, 0.28, 'triangle', 0.18, 0.09);
      playTone(659.25, 0.5, 'triangle', 0.22, 0.18);
    },
    champion() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        playTone(n, 0.5, 'triangle', 0.22, idx * 0.11);
      });
      playTone(1046.5, 1.0, 'sine', 0.2, 0.45);
    },
  };
}

function useAnimatedNumber(target: number, active: boolean, durationMs = 950) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, active, durationMs]);

  return value;
}

function ConfettiCanvas({ burstKey }: { burstKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (burstKey === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      '#FACC15',
      '#3B82F6',
      '#EC4899',
      '#10B981',
      '#F97316',
      '#A855F7',
      '#FFFFFF',
    ];

    const particles = Array.from({ length: 180 }, (_, i) => {
      const fromLeft = i % 2 === 0;
      return {
        x: fromLeft ? 0 : canvas.width,
        y: canvas.height * (0.38 + Math.random() * 0.34),
        vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 15),
        vy: -(9 + Math.random() * 15),
        size: 7 + Math.random() * 8,
        color: colors[i % colors.length],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 16,
        alpha: 1,
      };
    });

    let raf = 0;
    let frame = 0;
    const render = () => {
      frame += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.34;
        p.vx *= 0.985;
        p.rotation += p.vRot;
        if (frame > 95) p.alpha = Math.max(0, p.alpha - 0.014);
        if (p.alpha > 0 && p.y < canvas.height + 40) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }
      }
      if (alive) {
        raf = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [burstKey]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}

export default function CampRecapShowPage() {
  const params = useParams();
  const token = String(params?.token || '');

  const [data, setData] = useState<RecapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Playback & Choreography State
  const [started, setStarted] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  // Reveal stages: 0 = countdown (5..1), 1 = lead-in ("3rd Place goes to..."), 2 = team pops out, 3 = points slam in
  const [countdown, setCountdown] = useState<number | null>(null);
  const [revealStage, setRevealStage] = useState<0 | 1 | 2 | 3>(0);
  // Stats choreography stages: 1 = Activities card, 2 = Total Awarded card, 3 = Biggest Win card
  const [statsStage, setStatsStage] = useState<0 | 1 | 2 | 3>(0);

  const [autoPlay, setAutoPlay] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [confettiBurst, setConfettiBurst] = useState(0);

  const soundRef = useRef<ReturnType<typeof createSoundEngine> | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    soundRef.current = createSoundEngine();
  }, []);

  const loadRecap = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch(`/api/public/${token}`, { cache: 'no-store' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.success) {
        setErrorMsg(payload?.message || payload?.error || 'Recap not found');
        return;
      }
      setData(payload.data as RecapPayload);
    } catch {
      setErrorMsg('Could not load recap data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRecap();
  }, [loadRecap]);

  // Automatically lock recap to the current active day!
  const activeDayNumber = data?.event.activeDayNumber || 1;
  const activeDayLabel = useMemo(() => {
    if (!data) return 'Day 1';
    return (
      data.days.find((d) => d.day_number === activeDayNumber)?.label ||
      `Day ${activeDayNumber}`
    );
  }, [data, activeDayNumber]);

  const standings: RankedTeam[] = useMemo(() => {
    if (!data) return [];
    const dayBoard = data.day_standings?.[activeDayNumber];
    if (dayBoard && dayBoard.length > 0) return dayBoard;
    return data.overall_standings || [];
  }, [data, activeDayNumber]);

  const stats = useMemo(() => {
    const dayScores = (data?.scores || []).filter(
      (s) => s.day_number === activeDayNumber
    );
    const uniqueActivities = new Set(
      dayScores.map((s) => (s.category || 'Game').trim().toLowerCase())
    );
    const totalAwarded = dayScores
      .filter((s) => s.points > 0)
      .reduce((sum, s) => sum + s.points, 0);
    const biggestWin = dayScores
      .filter((s) => s.points > 0)
      .sort((a, b) => b.points - a.points)[0];

    return {
      activitiesCount: uniqueActivities.size,
      entriesCount: dayScores.length,
      totalAwarded,
      biggestWin,
    };
  }, [data, activeDayNumber]);

  // Dynamic slide deck: Intro -> Stats -> #3 (5s countdown) -> #2 (5s countdown) -> #1 (No countdown, royal reveal!) -> Podium
  const slides: SlideType[] = useMemo(() => {
    const list: SlideType[] = [{ kind: 'intro' }, { kind: 'stats' }];
    const count = Math.min(3, standings.length);
    for (let place = count; place >= 1; place--) {
      const idx = place - 1;
      list.push({
        kind: 'reveal',
        placeIndex: idx,
        leadIn:
          place === 1
            ? `And our ${activeDayLabel} Winner goes to…`
            : place === 2
            ? '2nd Place goes to…'
            : '3rd Place goes to…',
        rankLabel:
          place === 1
            ? '1st Place · CHAMPION'
            : place === 2
            ? '2nd Place'
            : '3rd Place',
        medal: place === 1 ? '🏆' : place === 2 ? '🥈' : '🥉',
        useCountdown: place !== 1, // 5-4-3-2-1 for #3 & #2; #1 already known -> dramatic instant coronation!
        isChampion: place === 1,
      });
    }
    list.push({ kind: 'podium' });
    return list;
  }, [standings.length, activeDayLabel]);

  const currentSlide = slides[slideIndex] || slides[0];

  // Staged choreography for Slide 2 (Stats)
  useEffect(() => {
    if (!started || currentSlide?.kind !== 'stats') {
      setStatsStage(0);
      return;
    }
    setStatsStage(1);
    if (soundEnabled) soundRef.current?.whoosh();

    const t1 = window.setTimeout(() => {
      setStatsStage(2);
      if (soundEnabled) soundRef.current?.whoosh();
    }, 850);

    const t2 = window.setTimeout(() => {
      setStatsStage(3);
    }, 1650);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [started, slideIndex, currentSlide, soundEnabled]);

  // Staged choreography for Slides 3, 4, 5 (5-4-3-2-1 Countdown -> Lead-in -> Team Pops Out -> Points Slam In!)
  useEffect(() => {
    if (!started || !currentSlide || currentSlide.kind !== 'reveal') {
      setCountdown(null);
      setRevealStage(0);
      return;
    }

    const timers: number[] = [];

    const runStagedReveal = (offsetMs: number) => {
      // Stage 1: Lead-in ("3rd Place goes to...")
      timers.push(
        window.setTimeout(() => {
          setCountdown(null);
          setRevealStage(1);
          if (soundEnabled) soundRef.current?.whoosh();
        }, offsetMs)
      );

      // Stage 2: Team name 3D pop-burst!
      timers.push(
        window.setTimeout(() => {
          setRevealStage(2);
          if (currentSlide.isChampion) {
            if (soundEnabled) soundRef.current?.champion();
            setConfettiBurst((k) => k + 1);
          } else if (soundEnabled) {
            soundRef.current?.reveal();
          }
        }, offsetMs + 1050)
      );

      // Stage 3: Points slam in & count up!
      timers.push(
        window.setTimeout(() => {
          setRevealStage(3);
        }, offsetMs + 1950)
      );
    };

    if (currentSlide.useCountdown) {
      // 5-second dramatic countdown (5 -> 4 -> 3 -> 2 -> 1)
      setRevealStage(0);
      setCountdown(5);
      if (soundEnabled) soundRef.current?.tick(5);

      [4, 3, 2, 1].forEach((num, idx) => {
        timers.push(
          window.setTimeout(() => {
            setCountdown(num);
            if (soundEnabled) soundRef.current?.tick(num);
          }, (idx + 1) * 950)
        );
      });

      runStagedReveal(5 * 950);
    } else {
      // #1 Champion — skip countdown, go straight to royal lead-in -> explosion!
      setCountdown(null);
      runStagedReveal(50);
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [started, slideIndex, currentSlide, soundEnabled]);

  // Confetti burst on Grand Podium slide
  useEffect(() => {
    if (started && currentSlide?.kind === 'podium') {
      setConfettiBurst((k) => k + 1);
    }
  }, [started, currentSlide]);

  const goNext = useCallback(() => {
    if (!started) {
      setStarted(true);
      setSlideIndex(0);
      return;
    }
    // If mid-countdown or mid-reveal, jump straight to full reveal!
    if (currentSlide?.kind === 'reveal' && revealStage < 3) {
      setCountdown(null);
      setRevealStage(3);
      if (currentSlide.isChampion) {
        if (soundEnabled) soundRef.current?.champion();
        setConfettiBurst((k) => k + 1);
      } else if (soundEnabled) {
        soundRef.current?.reveal();
      }
      return;
    }
    setSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
  }, [started, currentSlide, revealStage, slides.length, soundEnabled]);

  const goPrev = useCallback(() => {
    if (!started) return;
    if (slideIndex === 0) {
      setStarted(false);
      return;
    }
    setSlideIndex((prev) => Math.max(0, prev - 1));
  }, [started, slideIndex]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await (stageRef.current || document.documentElement).requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignore fullscreen denial
    }
  }, []);

  // Optional Auto-Play
  useEffect(() => {
    if (!started || !autoPlay) return;
    if (slideIndex >= slides.length - 1) return;
    const delay =
      currentSlide?.kind === 'reveal'
        ? revealStage === 3
          ? 3800
          : 10000
        : 5500;
    const timer = window.setTimeout(() => {
      goNext();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [started, autoPlay, slideIndex, slides.length, currentSlide, revealStage, goNext]);

  // Presenter Remote & Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
        e.preventDefault();
        goNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'm') {
        setSoundEnabled((s) => !s);
      } else if (e.key.toLowerCase() === 'r' && started) {
        setSlideIndex(0);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, toggleFullscreen, started]);

  const revealedTeam =
    currentSlide?.kind === 'reveal' ? standings[currentSlide.placeIndex] : null;
  const animatedTeamPoints = useAnimatedNumber(
    revealedTeam?.points ?? 0,
    Boolean(revealStage >= 3 && revealedTeam),
    950
  );
  const animatedActivities = useAnimatedNumber(
    stats.activitiesCount,
    started && currentSlide?.kind === 'stats' && statsStage >= 1,
    800
  );
  const animatedAwarded = useAnimatedNumber(
    stats.totalAwarded,
    started && currentSlide?.kind === 'stats' && statsStage >= 2,
    950
  );

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <RefreshCw className="mx-auto h-9 w-9 animate-spin text-indigo-400" />
          <p className="mt-3 text-sm font-semibold text-slate-300">
            Preparing {activeDayLabel} Recap…
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <Trophy className="mx-auto h-10 w-10 text-amber-400" />
          <h1 className="mt-3 text-xl font-bold">Recap Unavailable</h1>
          <p className="mt-2 text-sm text-slate-400">{errorMsg}</p>
          <Link
            href={`/scoreboard/${token}`}
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Scoreboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      className="fixed inset-0 flex h-[100dvh] w-screen flex-col overflow-hidden bg-slate-950 text-white selection:bg-indigo-500/40"
    >
      {/* Ambient Animated 3D Stage Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/25 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-purple-600/25 blur-3xl animate-pulse" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <ConfettiCanvas burstKey={confettiBurst} />

      {/* Top Presenter Bar */}
      <header className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2.5">
          <Link
            href={`/scoreboard/${token}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <Monitor className="h-3.5 w-3.5" />
            Live Board
          </Link>
          <span className="hidden text-xs font-bold uppercase tracking-wider text-indigo-300 sm:inline">
            {data.event.name} · {activeDayLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoPlay((a) => !a)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              autoPlay
                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-200'
                : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {autoPlay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {autoPlay ? 'Auto-Play ON' : 'MC Manual'}
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            title="Toggle Sound (M)"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (F)"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </header>

      {/* Main Centered Stage (Fits Cleanly Inside 100dvh, Zero Bleed) */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 sm:px-8">
        {/* PRE-SHOW LAUNCHPAD (Automatically Locked to Today's Active Day!) */}
        {!started ? (
          <div className="anim-flip-3d w-full max-w-2xl rounded-3xl border border-white/15 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-400/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.22em] text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              {activeDayLabel} Recap Show
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
              {data.event.name}
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm text-slate-300 sm:text-base">
              Get ready for today&apos;s official results reveal with animated highlights,
              5-second countdowns, sound effects, and podium celebration.
            </p>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => {
                  setSlideIndex(0);
                  setStarted(true);
                }}
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 px-9 py-4 text-base font-black text-white shadow-xl shadow-indigo-500/30 transition hover:scale-105 active:scale-95"
              >
                <Play className="h-5 w-5 fill-current" />
                Start {activeDayLabel} Recap
              </button>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              Use <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Space</kbd> or{' '}
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">→</kbd> on your
              keyboard or clicker to control the reveal pace.
            </p>
          </div>
        ) : (
          <div className="flex w-full max-w-4xl flex-col items-center text-center">
            {/* SLIDE 1: HYPE INTRO (Staggered Choreography) */}
            {currentSlide.kind === 'intro' && (
              <div className="space-y-6 py-4">
                <span className="anim-rise-up inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-5 py-2 text-xs font-extrabold uppercase tracking-[0.25em] text-indigo-200">
                  <Flame className="h-4 w-4 text-amber-400" />
                  {activeDayLabel} Recap
                </span>
                <h1
                  className="anim-flip-3d text-4xl font-black tracking-tight sm:text-6xl md:text-7xl"
                  style={{ animationDelay: '180ms' }}
                >
                  {data.event.name}
                </h1>
                <p
                  className="anim-rise-up mx-auto max-w-xl text-lg text-slate-300 sm:text-2xl"
                  style={{ animationDelay: '420ms' }}
                >
                  Are you ready to see how the teams performed today?
                </p>
                <div className="anim-rise-up pt-2" style={{ animationDelay: '650ms' }}>
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-black text-slate-950 shadow-xl transition hover:scale-105"
                  >
                    Let&apos;s See the Numbers
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE 2: BY THE NUMBERS (Activities & Total Marks Awarded ONLY — Staged Slide-In!) */}
            {currentSlide.kind === 'stats' && (
              <div className="w-full space-y-7">
                <div className="anim-rise-up">
                  <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-indigo-300">
                    {activeDayLabel} · By The Numbers
                  </p>
                  <h2 className="mt-2 text-3xl font-black sm:text-5xl">
                    What a Day of Action!
                  </h2>
                </div>

                <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
                  {/* Card 1: Slides in from Left */}
                  {statsStage >= 1 && (
                    <div className="anim-slide-left rounded-3xl border border-indigo-400/30 bg-indigo-500/10 p-7 backdrop-blur-xl">
                      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-indigo-300">
                        Activities Played
                      </p>
                      <p className="mt-3 text-6xl font-black tabular-nums text-white sm:text-7xl">
                        {animatedActivities}
                      </p>
                      <p className="mt-2 text-xs font-medium text-indigo-200/75">
                        Games &amp; challenges completed today
                      </p>
                    </div>
                  )}

                  {/* Card 2: Slides in from Right (850ms later!) */}
                  {statsStage >= 2 && (
                    <div className="anim-slide-right rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-7 backdrop-blur-xl">
                      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-300">
                        Total Marks Awarded
                      </p>
                      <p className="mt-3 text-6xl font-black tabular-nums text-emerald-300 sm:text-7xl">
                        +{animatedAwarded}
                      </p>
                      <p className="mt-2 text-xs font-medium text-emerald-200/75">
                        Points earned across all teams
                      </p>
                    </div>
                  )}
                </div>

                {/* Optional Biggest Win rises up 3rd */}
                {statsStage >= 3 && stats.biggestWin && (
                  <div className="anim-rise-up mx-auto max-w-xl rounded-2xl border border-amber-400/35 bg-amber-400/10 px-6 py-4 backdrop-blur">
                    <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-amber-300">
                      Highlight of the Day
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-white sm:text-xl">
                      {stats.biggestWin.team_name} · {stats.biggestWin.category}{' '}
                      <span className="text-amber-300">+{stats.biggestWin.points} pts</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SLIDES 3, 4, 5: 5-4-3-2-1 COUNTDOWN + STAGED 3D POWERPOINT REVEAL */}
            {currentSlide.kind === 'reveal' && revealedTeam && (
              <div className="flex w-full flex-col items-center justify-center py-2">
                {revealStage === 0 ? (
                  /* 5-SECOND DRAMATIC COUNTDOWN (#3 & #2) */
                  <div className="space-y-6">
                    <p className="anim-rise-up text-sm font-extrabold uppercase tracking-[0.32em] text-amber-300 sm:text-base">
                      Revealing {currentSlide.rankLabel} in…
                    </p>
                    <div
                      key={countdown}
                      className="anim-countdown-beat mx-auto flex h-48 w-48 items-center justify-center rounded-full border-4 border-amber-400/70 bg-gradient-to-br from-indigo-600/45 via-purple-600/45 to-amber-500/30 text-8xl font-black text-white shadow-[0_0_90px_rgba(250,204,21,0.35)] sm:h-60 sm:w-60 sm:text-9xl"
                    >
                      {countdown ?? '…'}
                    </div>
                    <p className="text-xs text-slate-400">
                      Build the suspense… (Press Space to reveal immediately)
                    </p>
                  </div>
                ) : (
                  /* STAGED 3-BEAT REVEAL: 1) Lead-in -> 2) Team 3D Pop -> 3) Points Slam! */
                  <div
                    className={`w-full max-w-2xl rounded-[32px] border-2 p-8 shadow-2xl backdrop-blur-xl transition-all sm:p-12 ${
                      currentSlide.isChampion
                        ? 'border-amber-400 bg-gradient-to-b from-amber-500/25 via-slate-900/90 to-slate-950/95 shadow-[0_0_110px_rgba(250,204,21,0.35)]'
                        : 'border-white/25 bg-gradient-to-b from-white/15 to-slate-900/90'
                    }`}
                  >
                    {/* Beat 1: Lead-In ("3rd Place goes to...") */}
                    <p
                      className={`anim-rise-up text-base font-extrabold uppercase tracking-[0.26em] sm:text-xl ${
                        currentSlide.isChampion ? 'text-amber-300' : 'text-indigo-300'
                      }`}
                    >
                      {currentSlide.leadIn}
                    </p>

                    {/* Beat 2: Medal + Team Name 3D Flip-Burst */}
                    {revealStage >= 2 && (
                      <div className="anim-flip-3d mt-5">
                        <div className="text-6xl sm:text-7xl">{currentSlide.medal}</div>
                        <div className="mt-4 flex items-center justify-center gap-3.5">
                          <span
                            className="h-6 w-6 rounded-full ring-4 ring-white/25"
                            style={{ backgroundColor: revealedTeam.color }}
                          />
                          <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
                            {revealedTeam.name}
                          </h2>
                        </div>
                      </div>
                    )}

                    {/* Beat 3: Points Pop-Slam & Count-Up */}
                    {revealStage >= 3 && (
                      <div className="anim-pop-slam mt-7">
                        <div className="inline-flex items-baseline gap-2.5 rounded-2xl border border-white/15 bg-black/35 px-9 py-4">
                          <span
                            className={`text-5xl font-black tabular-nums sm:text-7xl ${
                              currentSlide.isChampion ? 'text-amber-300' : 'text-white'
                            }`}
                          >
                            {animatedTeamPoints > 0
                              ? `+${animatedTeamPoints}`
                              : animatedTeamPoints}
                          </span>
                          <span className="text-lg font-bold text-slate-300">pts</span>
                        </div>

                        {data.event.numberOfDays > 1 && (
                          <p className="mt-4 text-sm font-semibold text-slate-300">
                            Overall Camp Total:{' '}
                            <span className="font-black text-white">
                              {revealedTeam.overall_points} pts
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SLIDE 6: GRAND ANIMATED 3-STEP PODIUM (Clean, Zero Extra Button Clutter!) */}
            {currentSlide.kind === 'podium' && (
              <div className="w-full space-y-6">
                <div className="anim-rise-up">
                  <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-amber-300">
                    {activeDayLabel} · Official Podium
                  </p>
                  <h2 className="mt-1.5 text-3xl font-black sm:text-5xl">
                    {data.event.name}
                  </h2>
                </div>

                {/* Staggered Rising 3D Podium */}
                <div className="mx-auto flex max-w-3xl items-end justify-center gap-3 pt-4 sm:gap-6">
                  {/* 2nd Place (Left — rises 2nd) */}
                  {standings[1] && (
                    <div
                      className="anim-podium-grow flex w-1/3 flex-col items-center"
                      style={{ animationDelay: '350ms' }}
                    >
                      <span className="text-3xl">🥈</span>
                      <p className="mt-1 truncate text-sm font-extrabold sm:text-lg">
                        {standings[1].name}
                      </p>
                      <p className="text-lg font-black tabular-nums text-slate-200 sm:text-2xl">
                        {standings[1].points} pts
                      </p>
                      <div
                        className="mt-3 flex h-28 w-full items-center justify-center rounded-t-2xl border-t-4 bg-slate-800/90 text-3xl font-black text-slate-300 sm:h-36"
                        style={{ borderTopColor: standings[1].color }}
                      >
                        2
                      </div>
                    </div>
                  )}

                  {/* 1st Place (Center — rises 3rd, tallest with crown!) */}
                  {standings[0] && (
                    <div
                      className="anim-podium-grow flex w-1/3 flex-col items-center"
                      style={{ animationDelay: '700ms' }}
                    >
                      <Crown className="h-9 w-9 text-amber-400 animate-bounce" />
                      <p className="mt-1 truncate text-base font-black text-amber-300 sm:text-2xl">
                        {standings[0].name}
                      </p>
                      <p className="text-2xl font-black tabular-nums text-white sm:text-4xl">
                        {standings[0].points} pts
                      </p>
                      <div className="mt-3 flex h-40 w-full items-center justify-center rounded-t-2xl border-t-4 border-amber-400 bg-gradient-to-b from-amber-500/30 to-slate-800/90 text-5xl font-black text-amber-300 shadow-[0_0_55px_rgba(250,204,21,0.3)] sm:h-52">
                        1
                      </div>
                    </div>
                  )}

                  {/* 3rd Place (Right — rises 1st) */}
                  {standings[2] && (
                    <div
                      className="anim-podium-grow flex w-1/3 flex-col items-center"
                      style={{ animationDelay: '0ms' }}
                    >
                      <span className="text-3xl">🥉</span>
                      <p className="mt-1 truncate text-sm font-extrabold sm:text-lg">
                        {standings[2].name}
                      </p>
                      <p className="text-lg font-black tabular-nums text-slate-200 sm:text-2xl">
                        {standings[2].points} pts
                      </p>
                      <div
                        className="mt-3 flex h-20 w-full items-center justify-center rounded-t-2xl border-t-4 bg-slate-800/80 text-3xl font-black text-amber-600 sm:h-28"
                        style={{ borderTopColor: standings[2].color }}
                      >
                        3
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Bar — Pinned Cleanly to Viewport Bottom (Zero Overflow / Bleed!) */}
      <footer className="relative z-20 shrink-0 border-t border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          {started ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <span className="px-2 text-xs font-semibold text-slate-400 tabular-nums">
                Slide {slideIndex + 1} / {slides.length}
              </span>
              {slideIndex < slides.length - 1 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  {currentSlide.kind === 'reveal' && revealStage < 3
                    ? 'Reveal Now'
                    : 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs font-medium text-slate-400">
              {activeDayLabel} · {standings.length} teams ready
            </div>
          )}

          <div className="text-xs text-slate-400">
            Powered by{' '}
            <a
              href="https://www.eventsslot.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-400 hover:text-blue-300 hover:underline"
            >
              Eventsslot Technologies
            </a>
            <span className="mx-1.5 opacity-50">·</span>
            <a
              href="https://www.eventsslot.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white hover:underline"
            >
              www.eventsslot.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
