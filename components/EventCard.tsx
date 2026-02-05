// components/EventCard.tsx
'use client';

import React from 'react';
import { Trash2, Edit, Copy, Eye, Users, Clock } from 'lucide-react';
import { getEventStatus, STATUS_BADGE_CONFIG, formatDateRange, type EventStatus } from '@/lib/dateUtils';

export interface EventCardProps {
  event: {
    id: string;
    event_name: string;
    status?: string;
    team_count?: number;
    start_at?: string | null;
    end_at?: string | null;
    is_active?: boolean;
    updated_at?: string | null;
  };
  onView: (eventId: string) => void;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  onDuplicate: (eventId: string) => void;
}

export const EventCard = React.memo(function EventCard({
  event,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
}: EventCardProps) {
  // Calculate event status based on dates
  const calculatedStatus = getEventStatus(
    event.start_at || null,
    event.end_at || null,
    event.is_active !== false
  ) as EventStatus;

  const statusConfig = STATUS_BADGE_CONFIG[calculatedStatus];
  const hasDateRange = event.start_at && event.end_at;

  const lastUpdated = event.updated_at
    ? new Date(event.updated_at)
    : null;

  const isActive = calculatedStatus === 'active';
  const cardBase = 'group bg-white rounded-xl border transition-transform transition-opacity duration-200 overflow-hidden';
  const stateClasses = isActive
    ? 'border-purple-300 hover:-translate-y-0.5 hover:opacity-95 shadow-sm hover:shadow-md'
    : 'border-neutral-200 opacity-95 hover:opacity-100';

  return (
    <div
      className={`${cardBase} ${stateClasses}`}
      style={isActive ? { boxShadow: '0 0 0 2px rgba(107,70,193,0.15) inset' } : undefined}
      data-tour="event-card"
    >
      {/* Compact Header with status badge */}
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm sm:text-base font-semibold text-neutral-900 line-clamp-2 group-hover:text-purple-600 transition-colors flex-1">
            {event.event_name}
          </h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border flex-shrink-0 ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.textColor}`}>
            <span className={`inline-block mr-0.5 ${statusConfig.dotColor}`}>●</span>
            {statusConfig.label}
          </span>
        </div>
        
        {/* Metadata row - Single line, truncated */}
        <div className={`flex items-center gap-3 text-xs sm:text-sm ${isActive ? 'text-neutral-600' : 'text-neutral-500'}`}>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Users className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
            {event.team_count ?? 0} teams
          </span>
          {lastUpdated && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap hidden sm:inline-flex">
              <Clock className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
              {lastUpdated.toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer - Compact Action Buttons (Icons only on mobile) */}
      <div className="bg-neutral-50 border-t border-neutral-200 p-2 sm:p-3 flex gap-1.5 sm:gap-2" role="toolbar" aria-label="Event actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(event.id);
          }}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded transition-colors"
          title="View event details"
          aria-label="View event"
          onKeyDown={(ke) => { if (ke.key === 'Enter' || ke.key === ' ') { ke.preventDefault(); onView(event.id); } }}
        >
          <Eye size={14} className="sm:hidden" />
          <Eye size={16} className="hidden sm:block" />
          <span className="hidden sm:inline">View</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(event.id);
          }}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded transition-colors"
          title="Edit event"
          aria-label="Edit event"
          onKeyDown={(ke) => { if (ke.key === 'Enter' || ke.key === ' ') { ke.preventDefault(); onEdit(event.id); } }}
        >
          <Edit size={14} className="sm:hidden" />
          <Edit size={16} className="hidden sm:block" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(event.id);
          }}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium rounded transition-colors"
          title="Duplicate event"
          aria-label="Duplicate event"
          onKeyDown={(ke) => { if (ke.key === 'Enter' || ke.key === ' ') { ke.preventDefault(); onDuplicate(event.id); } }}
        >
          <Copy size={14} className="sm:hidden" />
          <Copy size={16} className="hidden sm:block" />
          <span className="hidden sm:inline">Copy</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(event.id);
          }}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded transition-colors"
          title="Delete event"
          aria-label="Delete event"
          onKeyDown={(ke) => { if (ke.key === 'Enter' || ke.key === ' ') { ke.preventDefault(); onDelete(event.id); } }}
        >
          <Trash2 size={14} className="sm:hidden" />
          <Trash2 size={16} className="hidden sm:block" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  );
});

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
