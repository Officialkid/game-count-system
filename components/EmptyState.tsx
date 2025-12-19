// components/EmptyState.tsx
'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './ui/Card';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: ReactNode;
  tips?: string[];
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  tips = [],
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const primaryButton = actionHref ? (
    <Link href={actionHref}>
      <Button variant="primary" size="md" className="shadow-md">
        {actionLabel}
      </Button>
    </Link>
  ) : (
    <Button variant="primary" size="md" onClick={onAction} className="shadow-md">
      {actionLabel}
    </Button>
  );

  return (
    <div className="flex items-center justify-center py-12 sm:py-16">
      <Card className="w-full max-w-2xl text-center shadow-xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50">
        <div className="text-center space-y-4 px-6 py-8 sm:px-10 sm:py-12">
          {icon ? (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-600 shadow-inner">
              {icon}
            </div>
          ) : null}
          <div>
            <h3 className="text-xl font-bold text-neutral-900">{title}</h3>
            <p className="text-neutral-600 mt-2 max-w-md mx-auto">{description}</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {primaryButton}
            {secondaryActionLabel && onSecondaryAction ? (
              <Button
                variant="secondary"
                size="md"
                onClick={onSecondaryAction}
                className="shadow-sm hover:shadow-md"
              >
                {secondaryActionLabel}
              </Button>
            ) : null}
          </div>

          {tips.length > 0 && (
            <div className="mt-6 text-left inline-block bg-neutral-50 border border-neutral-200 rounded-lg p-4 w-full max-w-md shadow-inner">
              <p className="text-sm font-semibold text-neutral-800 mb-2">Quick tips</p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
