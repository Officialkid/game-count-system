/**
 * Empty State: No Scores
 * Displayed when an event has teams but no scores recorded yet
 * Provides guidance on how to start scoring
 */

interface NoScoresEmptyProps {
  scorerLink?: string;
  showShareButton?: boolean;
}

export function NoScoresEmpty({ scorerLink, showShareButton = true }: NoScoresEmptyProps) {
  const handleCopyLink = () => {
    if (scorerLink) {
      navigator.clipboard.writeText(scorerLink);
      // Could add a toast notification here if you have a toast system
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Large emoji for visual clarity (elderly-friendly) */}
      <div className="text-6xl mb-4" role="img" aria-label="Chart">
        📊
      </div>

      {/* Clear heading */}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        No Scores Yet
      </h3>

      {/* Helpful description */}
      <p className="text-lg text-gray-700 mb-6 text-center max-w-md">
        Scores will appear here once scorers start adding them
      </p>

      {/* Conditional CTA for scorer link */}
      {showShareButton && scorerLink && (
        <button
          onClick={handleCopyLink}
          className="px-8 py-4 text-lg font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl mb-8"
        >
          📋 Copy Scorer Link
        </button>
      )}

      {/* Instructional steps */}
      <div className="mt-4 max-w-md w-full space-y-4">
        <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="text-2xl flex-shrink-0" role="img" aria-label="Step 1">
            1️⃣
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Share Scorer Link</p>
            <p className="text-sm text-gray-700">
              Send the scorer link to people who will be recording scores
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="text-2xl flex-shrink-0" role="img" aria-label="Step 2">
            2️⃣
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Start Scoring</p>
            <p className="text-sm text-gray-700">
              Scorers can add points as the game progresses
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="text-2xl flex-shrink-0" role="img" aria-label="Step 3">
            3️⃣
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-1">Watch Live Updates</p>
            <p className="text-sm text-gray-700">
              All scores update in real-time across all devices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
