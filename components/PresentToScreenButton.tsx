'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Cast,
  ExternalLink,
  Monitor,
  MonitorPlay,
  Sparkles,
  Tv,
  X,
} from 'lucide-react';

interface DetectedScreen {
  id: string;
  label: string;
  isPrimary: boolean;
  isInternal?: boolean;
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
}

interface PresentToScreenButtonProps {
  publicToken: string;
  eventName?: string;
  variant?: 'default' | 'dark';
}

export function PresentToScreenButton({
  publicToken,
  eventName,
  variant = 'default',
}: PresentToScreenButtonProps) {
  const [open, setOpen] = useState(false);
  const [screens, setScreens] = useState<DetectedScreen[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectionNote, setDetectionNote] = useState('');
  const [targetView, setTargetView] = useState<'scoreboard' | 'recap'>('scoreboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const buildTargetUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/scoreboard/${publicToken}?tv=1&theme=${theme}`;
  };

  const detectDisplays = async () => {
    setDetecting(true);
    setDetectionNote('');
    try {
      const win = window as any;
      if (typeof win.getScreenDetails === 'function') {
        const details = await win.getScreenDetails();
        const list: DetectedScreen[] = (details.screens || []).map(
          (s: any, idx: number) => ({
            id: `${idx}-${s.label || 'screen'}`,
            label:
              s.label ||
              (s.isPrimary
                ? 'Primary Display (This Device)'
                : `External Display ${idx + 1} (TV / Projector)`),
            isPrimary: Boolean(s.isPrimary),
            isInternal: Boolean(s.isInternal),
            availLeft: s.availLeft ?? s.left ?? 0,
            availTop: s.availTop ?? s.top ?? 0,
            availWidth: s.availWidth ?? s.width ?? 1280,
            availHeight: s.availHeight ?? s.height ?? 720,
          })
        );
        setScreens(list);
        if (list.length <= 1) {
          setDetectionNote(
            'Only 1 screen detected right now. Plug in an HDMI TV/projector (Win + P → Extend) or use Wireless Cast below.'
          );
        }
      } else {
        setScreens([]);
        setDetectionNote(
          'Automatic monitor detection is available in Chrome & Edge on desktop. You can still use Wireless Cast or Open Clean TV Window below.'
        );
      }
    } catch {
      setScreens([]);
      setDetectionNote(
        'Allow "Window management" permission in Chrome/Edge to pick a specific external monitor, or open the Clean TV Window below.'
      );
    } finally {
      setDetecting(false);
    }
  };

  const handleOpenModal = () => {
    setOpen(true);
    detectDisplays();
  };

  const launchOnScreen = (screen: DetectedScreen) => {
    const url = buildTargetUrl();
    const features = [
      'popup=yes',
      `left=${Math.round(screen.availLeft)}`,
      `top=${Math.round(screen.availTop)}`,
      `width=${Math.round(screen.availWidth)}`,
      `height=${Math.round(screen.availHeight)}`,
      'menubar=no',
      'toolbar=no',
      'location=no',
      'status=no',
    ].join(',');

    const popup = window.open(url, 'gamesco_live_display', features);
    if (!popup) {
      toast.error('Pop-up blocked — allow pop-ups for this site to launch on your 2nd screen.');
      return;
    }
    try {
      popup.moveTo(Math.round(screen.availLeft), Math.round(screen.availTop));
      popup.resizeTo(Math.round(screen.availWidth), Math.round(screen.availHeight));
      popup.focus();
    } catch {
      // Some browsers ignore moveTo/resizeTo after open
    }
    toast.success(`Launched on ${screen.label}! Press F11 on that screen for full screen.`);
    setOpen(false);
  };

  const launchWirelessCast = async () => {
    const url = buildTargetUrl();
    const win = window as any;
    if (typeof win.PresentationRequest !== 'function') {
      toast.error(
        'Wireless Cast picker is supported in Chrome & Edge. Opening Clean TV Window instead.'
      );
      launchCleanWindow();
      return;
    }

    try {
      const request = new win.PresentationRequest([url]);
      await request.start();
      toast.success('Presenting live scoreboard to selected device!');
      setOpen(false);
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') {
        return;
      }
      toast.error(
        'No wireless Cast receivers found on this network. Use an Extended Display or Clean TV Window.'
      );
    }
  };

  const launchCleanWindow = () => {
    const url = buildTargetUrl();
    const popup = window.open(
      url,
      'gamesco_live_display',
      'popup=yes,width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    );
    if (!popup) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    toast.success('Opened Clean TV Display! Drag to your projector & press F11.');
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-sm transition ${
          variant === 'dark'
            ? 'border-blue-500/40 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30'
            : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
        }`}
      >
        <Cast className="h-3.5 w-3.5" />
        Present to Screen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
                  <Tv className="h-4 w-4" />
                  Live Projection &amp; Cast
                </div>
                <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                  Present to TV / Projector
                </h2>
                {eventName && (
                  <p className="text-xs text-slate-500">
                    Projecting <strong>{eventName}</strong> cleanly — audience never sees
                    your Admin or Scorer screen.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Choose TV Screen Theme */}
            <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
              <span className="font-semibold text-slate-700">TV Screen Theme</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`rounded-lg px-2.5 py-1 font-bold ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  Dark TV
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`rounded-lg px-2.5 py-1 font-bold ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  Bright Light
                </button>
              </div>
            </div>

            {/* Step 2: Detected Connected Displays */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Connected Displays
                </p>
                <button
                  type="button"
                  onClick={detectDisplays}
                  disabled={detecting}
                  className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                >
                  {detecting ? 'Scanning…' : 'Refresh Displays'}
                </button>
              </div>

              {screens.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  {screens.map((scr) => (
                    <button
                      key={scr.id}
                      type="button"
                      onClick={() => launchOnScreen(scr)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
                        !scr.isPrimary
                          ? 'border-blue-300 bg-blue-50/70 hover:bg-blue-100/70'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MonitorPlay
                          className={`h-5 w-5 ${
                            !scr.isPrimary ? 'text-blue-600' : 'text-slate-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{scr.label}</p>
                          <p className="text-xs text-slate-500">
                            {scr.availWidth} × {scr.availHeight}
                            {!scr.isPrimary ? ' · Recommended External Screen' : ' · This Device'}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                        Send Here
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {detectionNote && (
                <p className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  {detectionNote}
                </p>
              )}
            </div>

            {/* Step 3: Wireless Cast & Clean TV Window */}
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={launchWirelessCast}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Cast className="h-4 w-4" />
                Cast to Wireless TV
              </button>
              <button
                type="button"
                onClick={launchCleanWindow}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-4 w-4" />
                Open Clean TV Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
