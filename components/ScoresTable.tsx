// components/ScoresTable.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export interface ScoresTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  hiddenOnMobile?: boolean;
}

export interface ScoresTableProps<T extends Record<string, any>> {
  columns: ScoresTableColumn[];
  rows: T[];
  className?: string;
}

export function ScoresTable<T extends Record<string, any>>({ columns, rows, className = '' }: ScoresTableProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeftFade(scrollLeft > 0);
      setShowRightFade(scrollLeft + clientWidth < scrollWidth);
    };
    update();
    el.addEventListener('scroll', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="overflow-x-auto border border-neutral-200 rounded-lg shadow-sm"
      >
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-white z-10 shadow-sm">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2 text-left font-semibold text-neutral-700 border-b border-neutral-200 bg-white ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.hiddenOnMobile ? 'hidden sm:table-cell' : ''}`}
                  scope="col"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'even:bg-neutral-50' : ''}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2 border-b border-neutral-100 ${
                      col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.hiddenOnMobile ? 'hidden sm:table-cell' : ''}`}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gradient edges indicating horizontal scroll */}
      {showLeftFade && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
      )}
      {showRightFade && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
      )}
    </div>
  );
}
