'use client';

/**
 * Quick Event Success Component
 * Shows shareable links, QR codes, and quick actions
 * Appears immediately after event creation
 */

import { useState } from 'react';
import { QuickEventResponse } from '@/lib/quick-event-helpers';

interface QuickEventSuccessProps {
  data: QuickEventResponse;
}

export default function QuickEventSuccess({ data }: QuickEventSuccessProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(label);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const { event, tokens, teams, links, summary } = data;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center mb-2">
          <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h2 className="text-2xl font-bold">Event Created Successfully! 🎉</h2>
        </div>
        <p className="text-green-100 text-lg">
          {summary.name} is ready for scoring
        </p>
      </div>

      {/* Event Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-700">Duration</p>
            <p className="text-base font-medium text-gray-900">{summary.days} day{summary.days !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-sm text-gray-700">Teams</p>
            <p className="text-base font-medium text-gray-900">{summary.teams} team{summary.teams !== 1 ? 's' : ''}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-700">Auto-cleanup</p>
            <p className="text-base font-medium text-gray-900">{summary.cleanup}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href={links.admin}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-center"
        >
          🎯 Go to Admin Dashboard
        </a>
        <a
          href={links.scoreboard}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-center"
        >
          📊 View Scoreboard
        </a>
      </div>

      {/* Shareable Links */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Share These Links</h3>
        <div className="space-y-4">
          {/* Admin Link */}
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-2">👑</span>
                <div>
                  <h4 className="font-semibold text-red-800">Admin Link (Keep Private)</h4>
                  <p className="text-sm text-red-600">Full control - manage everything</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(links.admin, 'admin')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                {copiedLink === 'admin' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <input
              type="text"
              value={links.admin}
              readOnly
              className="w-full px-3 py-2 bg-white border border-red-300 rounded text-sm font-mono"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>

          {/* Scorer Link */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-2">✏️</span>
                <div>
                  <h4 className="font-semibold text-blue-800">Scorer Link</h4>
                  <p className="text-sm text-blue-600">Share with score keepers</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(links.scorer, 'scorer')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {copiedLink === 'scorer' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <input
              type="text"
              value={links.scorer}
              readOnly
              className="w-full px-3 py-2 bg-white border border-blue-300 rounded text-sm font-mono"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>

          {/* Viewer Link */}
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-2">👀</span>
                <div>
                  <h4 className="font-semibold text-green-800">Viewer Link (Public)</h4>
                  <p className="text-sm text-green-600">Share with spectators</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(links.viewer, 'viewer')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                {copiedLink === 'viewer' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <input
              type="text"
              value={links.viewer}
              readOnly
              className="w-full px-3 py-2 bg-white border border-green-300 rounded text-sm font-mono"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      </div>

      {/* QR Codes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Share QR Codes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Admin QR */}
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(links.admin)}`}
              alt="Admin QR Code"
              className="w-full max-w-[200px] mx-auto mb-2"
            />
            <p className="text-sm font-medium text-red-600">👑 Admin</p>
          </div>

          {/* Scorer QR */}
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(links.scorer)}`}
              alt="Scorer QR Code"
              className="w-full max-w-[200px] mx-auto mb-2"
            />
            <p className="text-sm font-medium text-blue-600">✏️ Scorer</p>
          </div>

          {/* Viewer QR */}
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(links.viewer)}`}
              alt="Viewer QR Code"
              className="w-full max-w-[200px] mx-auto mb-2"
            />
            <p className="text-sm font-medium text-green-600">👀 Viewer</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 text-center mt-4">
          Print or display these QR codes for easy mobile access
        </p>
      </div>

      {/* Teams Created */}
      {teams.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Teams Ready ({teams.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center p-3 rounded-lg border border-gray-200"
                style={{ borderLeftColor: team.color, borderLeftWidth: '4px' }}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: team.color }}
                />
                <span className="text-sm font-medium text-gray-800 truncate">
                  {team.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
          <span className="text-2xl mr-2">💡</span>
          Pro Tips
        </h3>
        <ul className="space-y-2 text-sm text-yellow-700">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Keep the Admin Link private</strong> - It has full control over the event</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Share Scorer Link</strong> with anyone who needs to enter scores</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Share Viewer Link</strong> publicly - spectators can see live scores</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Bookmark the Admin Link</strong> - You'll need it to manage the event</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Event auto-deletes</strong> 24 hours after it ends to keep things clean</span>
          </li>
        </ul>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-center space-x-4">
        <a
          href="/"
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Create Another Event
        </a>
        <a
          href={links.admin}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Start Scoring Now →
        </a>
      </div>
    </div>
  );
}
