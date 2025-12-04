// components/skeletons/ScoreHistorySkeleton.tsx
interface ScoreHistorySkeletonProps {
  count?: number;
}

export function ScoreHistorySkeleton({ count = 5 }: ScoreHistorySkeletonProps = {}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
          </div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}
