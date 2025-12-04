// components/EventCard.tsx
import Link from 'next/link';
import { Card } from './Card';

interface EventCardProps {
  id: string;
  name: string;
  createdAt: string;
  hasShareToken: boolean;
}

export function EventCard({ id, name, createdAt, hasShareToken }: EventCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={`/event/${id}`}>
      <Card hover className="h-full">
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-800 line-clamp-2">
              {name}
            </h3>
            {hasShareToken && (
              <span className="flex-shrink-0 ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                ✓ Shared
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            Created {formattedDate}
          </p>

          <div className="mt-auto pt-4 border-t border-gray-100">
            <span className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1">
              View Details
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

interface EventGridProps {
  children: React.ReactNode;
}

export function EventGrid({ children }: EventGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {children}
    </div>
  );
}
