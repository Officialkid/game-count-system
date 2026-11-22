import React from 'react';

interface PoweredByFooterProps {
  dark?: boolean;
  className?: string;
}

export function PoweredByFooter({ dark = false, className = '' }: PoweredByFooterProps) {
  return (
    <footer
      className={`py-6 text-center text-xs ${
        dark ? 'text-slate-400' : 'text-slate-500'
      } ${className}`}
    >
      <span>Powered by </span>
      <a
        href="https://www.eventsslot.com"
        target="_blank"
        rel="noopener noreferrer"
        className={`font-bold transition hover:underline ${
          dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
        }`}
      >
        Eventsslot Technologies
      </a>
      <span className="mx-1.5 opacity-50">·</span>
      <a
        href="https://www.eventsslot.com"
        target="_blank"
        rel="noopener noreferrer"
        className={`font-medium transition hover:underline ${
          dark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        www.eventsslot.com
      </a>
    </footer>
  );
}
