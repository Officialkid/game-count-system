// components/EventCard.tsx
'use client';

import React from 'react';
import { Trash2, Edit, Copy, Eye } from 'lucide-react';
import { getEventStatus, STATUS_BADGE_CONFIG, formatDateRange, type EventStatus } from '@/lib/dateUtils';

export interface EventCardProps {
  event: {
    id: string;
    event_name: string;
    status?: string;
    team_count?: number;
    start_date?: string | null;
    end_date?: string | null;
    is_active?: boolean;
  };
  onView: (eventId: string) => void;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  onDuplicate: (eventId: string) => void;
}

export function EventCard({
  event,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
}: EventCardProps) {
  // Calculate event status based on dates
  const calculatedStatus = getEventStatus(
    event.start_date || null,
    event.end_date || null,
    event.is_active !== false
  ) as EventStatus;

  const statusConfig = STATUS_BADGE_CONFIG[calculatedStatus];
  const hasDateRange = event.start_date && event.end_date;

  return (
    <div className="group bg-white/50 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
      {/* Card Header with Status Badge */}
      <div className="bg-gradient-to-r from-purple-600/10 to-amber-500/10 border-b border-white/20 p-6">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors flex-1">
            {event.event_name}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.textColor}`}>
            <span className={`inline-block mr-1 ${statusConfig.dotColor}`}>●</span>
            {statusConfig.label}
          </span>
        </div>
        <p className="text-sm text-gray-500 font-mono">ID: {event.id.slice(0, 12)}...</p>
      </div>

      {/* Card Body - Stats & Date Range */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50/50 rounded-lg p-3 border border-purple-100/50">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Teams</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{event.team_count || 0}</p>
          </div>
          <div className={`${statusConfig.bgColor} rounded-lg p-3 border ${statusConfig.borderColor}`}>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Status</p>
            <p className={`text-sm font-semibold ${statusConfig.textColor} mt-1 capitalize`}>
              {statusConfig.label}
            </p>
          </div>
        </div>

        {/* Date Range Display */}
        {hasDateRange && (
          <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100/50">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Dates</p>
            <p className="text-sm font-semibold text-blue-700 mt-1">
              {formatDateRange(event.start_date!, event.end_date!)}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer - Action Buttons */}
      <div className="bg-gray-50/50 border-t border-white/20 p-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(event.id);
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="View event details"
        >
          <Eye size={16} />
          <span className="hidden sm:inline">View</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(event.id);
          }}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Edit event"
        >
          <Edit size={16} />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(event.id);
          }}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Duplicate event"
        >
          <Copy size={16} />
          <span className="hidden sm:inline">Copy</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(event.id);
          }}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Delete event"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
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
