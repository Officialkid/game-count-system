'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (
        username: string,
        options: Record<string, string>
      ) => void;
    };
  }
}

// Embeds Ko-fi floating chat/button overlay globally
// Username: danielmwaliliofficial
export function KofiEmbed() {
  const username = 'danielmwaliliofficial';
  const pathname = usePathname();
  const drawOptions = {
    'type': 'floating-chat',
    'floating-chat.donateButton.text': 'Support me',
    'floating-chat.donateButton.background-color': '#29abe0',
    'floating-chat.donateButton.text-color': '#ffffff',
  } as Record<string, string>;

  // Visibility control: allow only on home and admin dashboard
  const allow = pathname === '/' || (pathname?.startsWith('/admin/'));

  useEffect(() => {
    if (!allow) return;
    try {
      window.kofiWidgetOverlay?.draw(username, drawOptions);
    } catch (_) {
      // no-op
    }
  }, [allow]);

  if (!allow) return null;

  return (
    <>
      <Script
        id="kofi-overlay-script"
        src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            window.kofiWidgetOverlay?.draw(username, drawOptions);
          } catch (_) {
            // no-op
          }
        }}
      />
      {/* Fallback simple link if script fails */}
      <noscript>
        <a
          href={`https://ko-fi.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Support me on Ko-fi"
        >
          ☕ Support this project
        </a>
      </noscript>
    </>
  );
}
