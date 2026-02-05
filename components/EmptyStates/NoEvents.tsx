/**
 * Empty State: No Events
 * Displayed when user has no events created yet
 * Shows features and encourages first event creation
 */

interface NoEventsEmptyProps {
  onCreateEvent: () => void;
}

export function NoEventsEmpty({ onCreateEvent }: NoEventsEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Large emoji for visual clarity (elderly-friendly) */}
      <div className="text-6xl mb-4" role="img" aria-label="Target">
        🎯
      </div>

      {/* Clear heading */}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        No Events Yet
      </h3>

      {/* Helpful description */}
      <p className="text-lg text-gray-700 mb-8 text-center max-w-md">
        Create your first event to start tracking game scores
      </p>

      {/* Primary CTA - large button (56px height minimum) */}
      <button
        onClick={onCreateEvent}
        className="px-8 py-4 text-lg font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl mb-12"
      >
        Create Your First Event →
      </button>

      {/* Feature showcase - 3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
          <div className="text-4xl mb-3" role="img" aria-label="Trophy">
            🏆
          </div>
          <h4 className="font-bold text-gray-900 mb-2 text-lg">
            Live Scoring
          </h4>
          <p className="text-sm text-gray-700">
            Track scores in real-time with multiple scorers
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
          <div className="text-4xl mb-3" role="img" aria-label="Chart">
            📊
          </div>
          <h4 className="font-bold text-gray-900 mb-2 text-lg">
            Analytics
          </h4>
          <p className="text-sm text-gray-700">
            See detailed stats and scoring patterns
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
          <div className="text-4xl mb-3" role="img" aria-label="Display">
            📺
          </div>
          <h4 className="font-bold text-gray-900 mb-2 text-lg">
            Public Display
          </h4>
          <p className="text-sm text-gray-700">
            Share live scoreboard with spectators
          </p>
        </div>
      </div>
    </div>
  );
}
