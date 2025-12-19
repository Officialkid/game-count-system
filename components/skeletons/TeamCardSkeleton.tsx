// components/skeletons/TeamCardSkeleton.tsx
export function TeamCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-300 rounded flex-1"></div>
        <div className="h-8 bg-gray-300 rounded flex-1"></div>
      </div>
    </div>
  );
}

export function TeamCardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TeamCardSkeleton key={i} />
      ))}
    </>
  );
}
