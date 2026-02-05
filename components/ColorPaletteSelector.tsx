// components/ColorPaletteSelector.tsx
'use client';

import { useState } from 'react';
import { COLOR_PALETTES, ColorPalette } from '@/lib/color-palettes';

interface ColorPaletteSelectorProps {
  selectedPalette: string;
  onChange: (paletteId: string) => void;
  label?: string;
  showPreview?: boolean;
}

export function ColorPaletteSelector({
  selectedPalette,
  onChange,
  label = 'Color Theme',
  showPreview = true,
}: ColorPaletteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPaletteObj = COLOR_PALETTES.find(p => p.id === selectedPalette) || COLOR_PALETTES[0];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Selected Palette Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors bg-white"
      >
        <div className="flex items-center gap-3">
          {/* Color Preview */}
          <div
            className="w-12 h-12 rounded-lg shadow-sm"
            style={{ background: selectedPaletteObj.preview }}
          />
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {selectedPaletteObj.name}
            </div>
            <div className="text-sm text-gray-700">
              {selectedPaletteObj.description}
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Palette Grid */}
      {isOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
          {COLOR_PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              onClick={() => {
                onChange(palette.id);
                setIsOpen(false);
              }}
              className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                palette.id === selectedPalette
                  ? 'border-primary-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              } bg-white`}
            >
              {/* Color Gradient Preview */}
              <div
                className="w-full h-16 rounded-md mb-2 shadow-sm"
                style={{ background: palette.preview }}
              />
              
              {/* Palette Name */}
              <div className="text-sm font-medium text-gray-900 text-center">
                {palette.name}
              </div>
              
              {/* Description */}
              <div className="text-xs text-gray-700 text-center mt-1">
                {palette.description}
              </div>
              
              {/* Color Swatches */}
              {showPreview && (
                <div className="flex gap-1 mt-2 justify-center">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: palette.primary }}
                    title="Primary"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: palette.secondary }}
                    title="Secondary"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: palette.accent }}
                    title="Accent"
                  />
                </div>
              )}
              
              {/* Selected Indicator */}
              {palette.id === selectedPalette && (
                <div className="mt-2 flex items-center justify-center gap-1 text-primary-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-medium">Selected</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
