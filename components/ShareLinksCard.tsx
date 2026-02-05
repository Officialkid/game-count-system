'use client';

import { useState } from 'react';
import { TokenType, getTokenTypeName, getTokenTypeDescription, getTokenTypeColor } from '@/lib/token-utils';

interface ShareLink {
  type: TokenType;
  token: string;
  url: string;
}

interface ShareLinksCardProps {
  eventId: string;
  eventName: string;
  tokens: {
    admin_token: string;
    scorer_token: string;
    public_token: string;
  };
  shareLinks: {
    admin: string;
    scorer: string;
    viewer: string;
  };
}

export default function ShareLinksCard({ eventId, eventName, tokens, shareLinks }: ShareLinksCardProps) {
  const [copiedType, setCopiedType] = useState<TokenType | null>(null);

  const links: ShareLink[] = [
    { type: 'admin', token: tokens.admin_token, url: shareLinks.admin },
    { type: 'scorer', token: tokens.scorer_token, url: shareLinks.scorer },
    { type: 'viewer', token: tokens.public_token, url: shareLinks.viewer },
  ];

  const copyToClipboard = async (text: string, type: TokenType) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Event Created Successfully!</h2>
        <p className="text-blue-100 text-sm mt-1">{eventName}</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-50 border-l-4 border-red-500 px-6 py-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-red-500 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-red-800">
              Important: Save These Links!
            </h3>
            <p className="text-sm text-red-700 mt-1">
              These access links will not be shown again. Copy and save them in a secure location.
            </p>
          </div>
        </div>
      </div>

      {/* Share Links */}
      <div className="px-6 py-6 space-y-4">
        {links.map((link) => {
          const isCopied = copiedType === link.type;
          const color = getTokenTypeColor(link.type);

          return (
            <div
              key={link.type}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span
                    className="px-3 py-1 rounded-full text-white text-xs font-semibold"
                    style={{ backgroundColor: color }}
                  >
                    {getTokenTypeName(link.type)}
                  </span>
                  {link.type === 'admin' && (
                    <span className="text-xs text-gray-700">Full Control</span>
                  )}
                  {link.type === 'scorer' && (
                    <span className="text-xs text-gray-700">Score Entry</span>
                  )}
                  {link.type === 'viewer' && (
                    <span className="text-xs text-gray-700">View Only</span>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(link.url, link.type)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium
                    transition-colors
                    ${
                      isCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {isCopied ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">
                {getTokenTypeDescription(link.type)}
              </p>

              {/* URL Display */}
              <div className="bg-gray-50 rounded-md p-3 font-mono text-xs text-gray-700 break-all border border-gray-200">
                {link.url}
              </div>

              {/* Token Display (Collapsible) */}
              <details className="mt-3">
                <summary className="text-xs text-gray-700 cursor-pointer hover:text-gray-700">
                  Show raw token
                </summary>
                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-2 font-mono text-xs text-gray-700 break-all">
                  {link.token}
                </div>
              </details>
            </div>
          );
        })}
      </div>

      {/* Footer Tips */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Security Tips:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Share the <strong>Admin</strong> link only with event organizers</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Share the <strong>Scorer</strong> link with score keepers and judges</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Share the <strong>Viewer</strong> link publicly for live scoreboards</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Tokens cannot be recovered if lost - save them securely!</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
