'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Copy, Check, Share2, X } from 'lucide-react';
import { generateShareCardHTML, generateShareCardImage, downloadShareCard, copyShareLink } from '@/lib/sharecard-generator';
import type { ShareCardData } from '@/lib/sharecard-generator';

interface RecapShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recapData: {
    winner: string;
    points: number;
    gamesCount: number;
    eventName?: string;
    teams?: Array<{ name: string; points: number }>;
  };
  shareUrl: string;
  branding?: {
    logo?: string;
    brandColor?: string;
    brandName?: string;
  };
}

/**
 * Share Modal Component
 *
 * Features:
 * - Live preview of share card
 * - Download as PNG image
 * - Copy share link to clipboard
 * - Direct social media share buttons (WhatsApp, Twitter, Facebook)
 * - Responsive design
 * - Loading states
 */
export function RecapShareModal({
  isOpen,
  onClose,
  recapData,
  shareUrl,
  branding = { brandName: 'GameScore' },
}: RecapShareModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'share'>('preview');

  const shareCardData: ShareCardData = {
    ...recapData,
    branding,
  };

  // Generate and insert preview
  useEffect(() => {
    if (isOpen && previewRef.current && previewRef.current.children.length === 0) {
      const cardElement = generateShareCardHTML(shareCardData);
      previewRef.current.innerHTML = '';
      previewRef.current.appendChild(cardElement);
    }
  }, [isOpen, shareCardData]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const imageBlob = await generateShareCardImage(shareCardData);
      await downloadShareCard(imageBlob, `gamescore-recap-${recapData.winner}.png`);
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    setCopying(true);
    try {
      await copyShareLink(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link. Please try again.');
    } finally {
      setCopying(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🏆 ${recapData.winner} Wins! Check out this GameScore recap - ${recapData.points} points in ${recapData.gamesCount} games!`;
    const encoded = encodeURIComponent(`${text}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = `🏆 ${recapData.winner} WINS! 🎮 Just scored ${recapData.points} points across ${recapData.gamesCount} games on @GameScore!`;
    const encoded = encodeURIComponent(`${text} ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
  };

  const handleShareFacebook = () => {
    const encoded = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Share Your Recap</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'preview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📸 Preview
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'share'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔗 Share
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'preview' && (
            <div className="flex flex-col items-center gap-6">
              {/* Card Preview */}
              <div className="w-full bg-gray-100 rounded-lg p-4 flex items-center justify-center overflow-auto">
                <div
                  ref={previewRef}
                  className="flex-shrink-0"
                  style={{
                    width: '600px',
                    height: '315px',
                    transform: 'scale(0.5)',
                    transformOrigin: 'top left',
                  }}
                />
              </div>

              {/* Preview Note */}
              <p className="text-sm text-gray-600 text-center">
                This is how your recap will appear in WhatsApp, Twitter, and Facebook previews.
              </p>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {downloading ? 'Downloading...' : 'Download as Image'}
              </button>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="flex flex-col gap-6">
              {/* Share Link Section */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">📋 Share Link</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-mono text-gray-600"
                  />
                  <button
                    onClick={handleCopyLink}
                    disabled={copying}
                    className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
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
                </div>
              </div>

              {/* Social Media Share Buttons */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">🚀 Share to Social Media</h3>
                <div className="grid grid-cols-3 gap-3">
                  {/* WhatsApp */}
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    <span>💬</span>
                    <span className="hidden sm:inline">WhatsApp</span>
                  </button>

                  {/* Twitter */}
                  <button
                    onClick={handleShareTwitter}
                    className="flex items-center justify-center gap-2 bg-blue-400 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    <span>𝕏</span>
                    <span className="hidden sm:inline">Twitter</span>
                  </button>

                  {/* Facebook */}
                  <button
                    onClick={handleShareFacebook}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    <span>f</span>
                    <span className="hidden sm:inline">Facebook</span>
                  </button>
                </div>
              </div>

              {/* Share Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">📊 Share Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Winner</p>
                    <p className="text-lg font-bold text-gray-900">{recapData.winner}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Points</p>
                    <p className="text-lg font-bold text-gray-900">{recapData.points}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Games</p>
                    <p className="text-lg font-bold text-gray-900">{recapData.gamesCount}</p>
                  </div>
                  {recapData.eventName && (
                    <div>
                      <p className="text-sm text-gray-600">Event</p>
                      <p className="text-lg font-bold text-gray-900">{recapData.eventName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">💡 Pro Tips</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✓ WhatsApp shows the full recap card in previews</li>
                  <li>✓ Twitter displays the image prominently in feeds</li>
                  <li>✓ Download the image and share it anywhere</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecapShareModal;
