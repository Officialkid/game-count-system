'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';

interface LinkCardProps {
  title: string;
  description: string;
  url: string;
  icon: string;
  color: 'amber' | 'purple' | 'blue';
  dataTutorial?: string;
  canOpen?: boolean;
}

const colorClasses = {
  amber: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    hover: 'hover:border-amber-300',
    button: 'bg-amber-600 hover:bg-amber-700',
  },
  purple: {
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    hover: 'hover:border-purple-300',
    button: 'bg-purple-600 hover:bg-purple-700',
  },
  blue: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    hover: 'hover:border-blue-300',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
};

export function LinkCard({ title, description, url, icon, color, dataTutorial, canOpen = false }: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const colors = colorClasses[color];

  useEffect(() => {
    // Check if Web Share API is available
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <div
      className={`group rounded-xl border-2 ${colors.border} ${colors.bg} p-4 hover:shadow-md transition-all flex flex-col gap-3`}
      data-tutorial={dataTutorial}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{icon}</span>
            <span className="font-semibold text-gray-900 text-sm">{title}</span>
          </div>
          <p className="text-xs text-gray-600 mb-2">{description}</p>
          <div className={`text-xs font-mono ${colors.text} break-all`}>
            {url}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 ${colors.button} text-white rounded-lg transition-colors text-sm font-medium`}
          title="Copy link to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>

        {canShare && (
          <button
            onClick={handleShare}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            title="Share link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}

        {canOpen && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

interface EventLinksManagerProps {
  eventId: string;
  eventName: string;
  adminToken: string;
  scorerToken: string;
  publicToken: string;
}

const STORAGE_KEY = 'event-links-cache';

interface CachedEvent {
  id: string;
  name: string;
  adminToken: string;
  scorerToken: string;
  publicToken: string;
  timestamp: number;
}

export function EventLinksManager({
  eventId,
  eventName,
  adminToken,
  scorerToken,
  publicToken,
}: EventLinksManagerProps) {
  useEffect(() => {
    // Persist event links to localStorage
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const cache: CachedEvent[] = existing ? JSON.parse(existing) : [];
      
      // Remove existing entry for this event
      const filtered = cache.filter(e => e.id !== eventId);
      
      // Add current event to the beginning
      const updated = [
        {
          id: eventId,
          name: eventName,
          adminToken,
          scorerToken,
          publicToken,
          timestamp: Date.now(),
        },
        ...filtered,
      ];
      
      // Keep only last 10 events
      const limited = updated.slice(0, 10);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error('Failed to cache event links:', error);
    }
  }, [eventId, eventName, adminToken, scorerToken, publicToken]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-3" data-tutorial="share-section">
      <LinkCard
        title="Admin Link"
        description="Full control - Manage teams, scores, and settings"
        url={`${baseUrl}/admin/${adminToken}`}
        icon="👑"
        color="amber"
        dataTutorial="admin-link"
        canOpen={false}
      />

      <LinkCard
        title="Scorer Link"
        description="Link to add scores - Perfect for score keepers"
        url={`${baseUrl}/score/${scorerToken}`}
        icon="📝"
        color="purple"
        dataTutorial="scorer-link"
        canOpen={true}
      />

      <LinkCard
        title="Live Scoreboard"
        description="Link for viewers - Share with participants and spectators"
        url={`${baseUrl}/scoreboard/${publicToken}`}
        icon="📺"
        color="blue"
        dataTutorial="public-link"
        canOpen={true}
      />
    </div>
  );
}

// Utility function to get cached event links
export function getCachedEventLinks(): CachedEvent[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Failed to retrieve cached links:', error);
    return [];
  }
}

// Utility function to clear cached links
export function clearCachedEventLinks() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear cached links:', error);
  }
}
