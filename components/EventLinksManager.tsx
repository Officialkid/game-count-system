'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';

interface LinkCardProps {
  title: string;
  description: string;
  url: string;
  icon: string;
  color: 'purple' | 'blue' | 'green';
  dataTutorial?: string;
  canOpen?: boolean;
  onCopySuccess?: () => void;
}

const colorClasses = {
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
  green: {
    border: 'border-green-200',
    bg: 'bg-green-50',
    text: 'text-green-700',
    hover: 'hover:border-green-300',
    button: 'bg-green-600 hover:bg-green-700',
  },
};

export function LinkCard({ title, description, url, icon, color, dataTutorial, canOpen = false, onCopySuccess }: LinkCardProps) {
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
      if (onCopySuccess) {
        onCopySuccess();
      }
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
      className={`group rounded-xl border-2 ${colors.border} ${colors.bg} p-6 hover:shadow-lg transition-all`}
      data-tutorial={dataTutorial}
    >
      <div className="flex items-start gap-4">
        {/* Large Emoji Icon */}
        <div className="text-4xl" role="img" aria-label={title}>
          {icon}
        </div>
        
        <div className="flex-1">
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-gray-700 mb-3">
            {description}
          </p>
          
          {/* URL Input and Copy Button */}
          <div className="flex gap-2">
            <input 
              type="text"
              value={url}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-700 cursor-default"
              onClick={(e) => e.currentTarget.select()}
            />
            
            <button
              onClick={handleCopy}
              className={`px-4 py-2 font-semibold rounded-lg transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }`}
              title="Copy link to clipboard"
            >
              {copied ? '✅ Copied!' : 'Copy'}
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
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  const handleCopySuccess = () => {
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 3000);
  };

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
    <>
      {/* Floating Success Toast */}
      {showCopyToast && (
        <div className="fixed top-6 right-6 p-4 bg-green-500 text-white rounded-xl shadow-2xl animate-bounce z-50">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <p className="font-bold">Link Copied!</p>
              <p className="text-sm opacity-90">Ready to share</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6" data-tutorial="share-section">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Your Event</h2>
          <p className="text-gray-600">Choose the right link based on what people need to do</p>
        </div>
        
        <LinkCard
          title="Admin Link"
          description="Full control - edit event, add teams, manage everything. Keep this private!"
          url={`${baseUrl}/admin/${adminToken}`}
          icon="👑"
          color="purple"
          dataTutorial="admin-link"
          canOpen={false}
          onCopySuccess={handleCopySuccess}
        />

        <LinkCard
          title="Scorer Link"
          description="Can add scores only - share with scorekeepers and officials"
          url={`${baseUrl}/score/${scorerToken}`}
          icon="🏀"
          color="blue"
          dataTutorial="scorer-link"
          canOpen={true}
          onCopySuccess={handleCopySuccess}
        />

        <LinkCard
          title="Public Scoreboard"
          description="View-only - share with audience, display on projector, safe to post publicly"
          url={`${baseUrl}/scoreboard/${publicToken}`}
          icon="📺"
          color="green"
          dataTutorial="public-link"
          canOpen={true}
          onCopySuccess={handleCopySuccess}
        />
        
        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Quick Tip:</p>
              <p className="text-blue-700">
                Click the input field to select the full URL, or use the Copy button for quick sharing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
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
