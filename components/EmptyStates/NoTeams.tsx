/**
 * Empty State: No Teams
 * Displayed when an event has no teams yet
 * Provides guidance and quick action for adding teams
 */

interface NoTeamsEmptyProps {
  onAddTeams: () => void;
}

export function NoTeamsEmpty({ onAddTeams }: NoTeamsEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Large emoji for visual clarity (elderly-friendly) */}
      <div className="text-6xl mb-4" role="img" aria-label="Basketball">
        🏀
      </div>

      {/* Clear heading */}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        No Teams Yet
      </h3>

      {/* Helpful description */}
      <p className="text-lg text-gray-700 mb-6 text-center max-w-md">
        Add teams to start tracking scores for your event
      </p>

      {/* Primary CTA - large button (56px height minimum) */}
      <button
        onClick={onAddTeams}
        className="px-8 py-4 text-lg font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
      >
        Add Your First Team →
      </button>

      {/* Helpful tip card */}
      <div className="mt-8 p-4 bg-purple-50 rounded-lg max-w-md border border-purple-100">
        <p className="text-sm text-purple-900 font-semibold mb-2">
          💡 Quick Tip:
        </p>
        <p className="text-sm text-gray-700">
          You can paste multiple team names at once instead of adding one by one!
        </p>
      </div>
    </div>
  );
}
