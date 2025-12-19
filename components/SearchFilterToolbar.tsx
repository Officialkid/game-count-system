"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SortAsc } from 'lucide-react';

type Status = 'all' | 'active' | 'inactive' | 'archived';
type Sort = 'newest' | 'oldest' | 'alphabetical';

export function SearchFilterToolbar({
  value,
  onValueChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  helperText,
}: {
  value: string;
  onValueChange: (v: string) => void;
  status: Status;
  onStatusChange: (s: Status) => void;
  sort: Sort;
  onSortChange: (s: Sort) => void;
  helperText?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [input, setInput] = useState(value);

  // Initialize from URL on mount
  useEffect(() => {
    const q = params.get('q') ?? '';
    const s = (params.get('status') as Status) ?? 'all';
    const sortParam = (params.get('sort') as Sort) ?? 'newest';
    setInput(q);
    onValueChange(q);
    onStatusChange(['all', 'active', 'inactive', 'archived'].includes(s) ? s : 'all');
    onSortChange(['newest', 'oldest', 'alphabetical'].includes(sortParam) ? sortParam : 'newest');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUrl = (q: string, s: Status, sortValue: Sort) => {
    const usp = new URLSearchParams(params.toString());
    if (q) usp.set('q', q); else usp.delete('q');
    if (s) usp.set('status', s); else usp.delete('status');
    if (sortValue) usp.set('sort', sortValue); else usp.delete('sort');
    router.replace(`${pathname}?${usp.toString()}`);
  };

  // Instant input changes (no debounce per requirement)
  useEffect(() => {
    onValueChange(input);
    setUrl(input, status, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  // Update URL when status changes
  useEffect(() => {
    setUrl(input, status, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Update URL when sort changes
  useEffect(() => {
    setUrl(input, status, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-base bg-white"
            aria-label="Search events by name"
          />
        </div>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as Status)}
          className="w-full sm:w-56 px-4 py-3 rounded-lg border border-neutral-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-base bg-white"
          aria-label="Filter events by status"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
        <div className="w-full sm:w-56">
          <label className="sr-only" htmlFor="sort-events">Sort events</label>
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <select
              id="sort-events"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as Sort)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-base bg-white"
              aria-label="Sort events"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>
      {/* Quick Filter Chips */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onStatusChange(status === 'active' ? 'all' : 'active')}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            status === 'active'
              ? 'bg-purple-100 border-purple-300 text-purple-700'
              : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
          }`}
          aria-pressed={status === 'active'}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => onStatusChange(status === 'inactive' ? 'all' : 'inactive')}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            status === 'inactive'
              ? 'bg-purple-100 border-purple-300 text-purple-700'
              : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
          }`}
          aria-pressed={status === 'inactive'}
        >
          Inactive
        </button>
        <button
          type="button"
          onClick={() => onStatusChange(status === 'archived' ? 'all' : 'archived')}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            status === 'archived'
              ? 'bg-purple-100 border-purple-300 text-purple-700'
              : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
          }`}
          aria-pressed={status === 'archived'}
        >
          Archived
        </button>
        {/* Saved Views placeholder */}
        <div className="ml-auto">
          <span className="text-xs text-neutral-400">Saved Views coming soon</span>
        </div>
      </div>
      {helperText && (
        <p className="text-xs text-neutral-500">{helperText}</p>
      )}
    </div>
  );
}
