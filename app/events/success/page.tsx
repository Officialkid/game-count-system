'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, Copy, Share2, ExternalLink } from 'lucide-react';

export default function EventSuccessPage() {
  return (
    <Suspense fallback={<SuccessPageFallback />}>
      <EventSuccessContent />
    </Suspense>
  );
}

function SuccessPageFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse" />
            <h1 className="text-3xl font-bold text-white mb-2">Preparing your event...</h1>
            <p className="text-green-100 text-lg">Loading details</p>
          </div>
          <div className="p-8">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6 animate-pulse" />
            <div className="h-14 bg-gray-100 rounded-xl mb-6 animate-pulse" />
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EventSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLinksExpanded, setIsLinksExpanded] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Get event data from URL params
  const eventId = searchParams.get('eventId');
  const eventName = searchParams.get('eventName');
  const adminToken = searchParams.get('adminToken');
  const scorerToken = searchParams.get('scorerToken');
  const publicToken = searchParams.get('publicToken');
  const adminLink = searchParams.get('adminLink');
  const scorerLink = searchParams.get('scorerLink');
  const publicLink = searchParams.get('publicLink');

  useEffect(() => {
    // Redirect if missing required params
    if (!eventId || !adminToken) {
      router.push('/events/create');
    }
  }, [eventId, adminToken, router]);

  const handleCopy = async (url: string, linkType: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(linkType);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleOpenAdmin = () => {
    if (adminLink) {
      window.location.href = adminLink;
    }
  };

  if (!eventId || !adminToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Event Created Successfully!</h1>
            <p className="text-green-100 text-lg">{eventName}</p>
          </div>

          {/* Main Content */}
          <div className="p-8">
            {/* Next Steps */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Next Steps:</h3>
                  <ol className="text-amber-800 space-y-1 text-sm">
                    <li>1. Click "Open Admin Panel" below to add teams</li>
                    <li>2. Use the Scorer link to enter points during your event</li>
                    <li>3. Share the Public Scoreboard with your audience</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Primary Action */}
            <button
              onClick={handleOpenAdmin}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl mb-6"
            >
              <span className="text-2xl">👑</span>
              <span>Open Admin Panel</span>
              <ExternalLink className="w-5 h-5" />
            </button>

            {/* Collapsible Links Section */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setIsLinksExpanded(!isLinksExpanded)}
                className="w-full bg-gray-50 hover:bg-gray-100 px-6 py-4 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Share Links</span>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    Save these links!
                  </span>
                </div>
                {isLinksExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {isLinksExpanded && (
                <div className="p-6 space-y-4 bg-white">
                  {/* Admin Link */}
                  {adminLink && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">👑</span>
                        <div>
                          <h4 className="font-semibold text-purple-900">Admin Link</h4>
                          <p className="text-xs text-purple-700">Full control – edit event, add teams, manage everything</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={adminLink}
                          readOnly
                          className="flex-1 bg-white border border-purple-300 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono"
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                          onClick={() => handleCopy(adminLink, 'admin')}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          {copiedLink === 'admin' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Scorer Link */}
                  {scorerLink && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🏀</span>
                        <div>
                          <h4 className="font-semibold text-blue-900">Scorer Link</h4>
                          <p className="text-xs text-blue-700">Can add scores only – share with scorekeepers and officials</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={scorerLink}
                          readOnly
                          className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono"
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                          onClick={() => handleCopy(scorerLink, 'scorer')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          {copiedLink === 'scorer' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Public Link */}
                  {publicLink && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📺</span>
                        <div>
                          <h4 className="font-semibold text-green-900">Public Scoreboard</h4>
                          <p className="text-xs text-green-700">View-only – share with audience, display on projector</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={publicLink}
                          readOnly
                          className="flex-1 bg-white border border-green-300 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono"
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                          onClick={() => handleCopy(publicLink, 'public')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          {copiedLink === 'public' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Save these links!</h4>
                <p className="text-sm text-red-800">
                  There's no login system to retrieve them later. Copy them now and save them somewhere safe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 text-sm underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
