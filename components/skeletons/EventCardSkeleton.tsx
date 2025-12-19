// components/skeletons/EventCardSkeleton.tsx
export function EventCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 bg-gray-300 rounded flex-1"></div>
        <div className="h-9 bg-gray-300 rounded flex-1"></div>
      </div>
    </div>
  );
}

export function EventCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </>
  );
}
