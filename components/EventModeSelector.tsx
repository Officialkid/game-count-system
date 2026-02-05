'use client';

import { useState } from 'react';
import { EventMode, EVENT_MODE_CONFIGS } from '@/lib/firebase-collections';
import { 
  getModeName, 
  getModeDescription, 
  getModeColor,
  isFeatureAvailable 
} from '@/lib/event-mode-helpers';

interface EventModeSelectorProps {
  selectedMode: EventMode;
  onModeChange: (mode: EventMode) => void;
  disabled?: boolean;
}

export default function EventModeSelector({
  selectedMode,
  onModeChange,
  disabled = false,
}: EventModeSelectorProps) {
  const modes: EventMode[] = ['quick', 'camp', 'advanced'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Event Mode
        </label>
        <p className="text-sm text-gray-700">
          Choose the type of event you want to create
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const config = EVENT_MODE_CONFIGS[mode];
          const isSelected = selectedMode === mode;
          const color = getModeColor(mode);

          return (
            <button
              key={mode}
              type="button"
              onClick={() => !disabled && onModeChange(mode)}
              disabled={disabled}
              className={`
                relative p-6 rounded-lg border-2 transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Mode Badge */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: color }}
                >
                  {getModeName(mode)}
                </span>
                {isSelected && (
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 text-left">
                {getModeDescription(mode)}
              </p>

              {/* Features */}
              <div className="space-y-2">
                <FeatureItem
                  icon="🔒"
                  text={config.requiresAuth ? 'Auth Required' : 'No Auth Needed'}
                  enabled={!config.requiresAuth || config.requiresAuth}
                />
                <FeatureItem
                  icon="📅"
                  text={
                    config.maxDuration
                      ? `Up to ${config.maxDuration} days`
                      : 'Unlimited Duration'
                  }
                  enabled={true}
                />
                <FeatureItem
                  icon="🗑️"
                  text={config.autoCleanup ? 'Auto-cleanup' : 'Manual Archive'}
                  enabled={true}
                />
                <FeatureItem
                  icon="🏢"
                  text="Organizations"
                  enabled={config.features.organizations}
                />
                <FeatureItem
                  icon="📊"
                  text="Advanced Analytics"
                  enabled={config.features.advancedAnalytics}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-blue-500 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              {getModeName(selectedMode)} Selected
            </h4>
            <p className="text-sm text-blue-700">
              {getModeDescription(selectedMode)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  text,
  enabled,
}: {
  icon: string;
  text: string;
  enabled: boolean;
}) {
  return (
    <div
      className={`flex items-center space-x-2 text-xs ${
        enabled ? 'text-gray-700' : 'text-gray-600 line-through'
      }`}
    >
      <span>{icon}</span>
      <span>{text}</span>
      {enabled && (
        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
}
