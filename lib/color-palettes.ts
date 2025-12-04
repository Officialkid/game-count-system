// lib/color-palettes.ts
// Predefined color themes for event branding

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  preview: string; // Gradient for visual preview
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'purple',
    name: 'Royal Purple',
    description: 'Professional and elegant',
    primary: '#6b46c1',
    secondary: '#9333ea',
    accent: '#f59e0b',
    background: '#f9fafb',
    text: '#111827',
    preview: 'linear-gradient(135deg, #6b46c1 0%, #9333ea 100%)',
  },
  {
    id: 'blue',
    name: 'Corporate Blue',
    description: 'Trust and reliability',
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#10b981',
    background: '#f0f9ff',
    text: '#1e40af',
    preview: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  },
  {
    id: 'green',
    name: 'Fresh Green',
    description: 'Growth and harmony',
    primary: '#059669',
    secondary: '#10b981',
    accent: '#f59e0b',
    background: '#f0fdf4',
    text: '#064e3b',
    preview: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  },
  {
    id: 'orange',
    name: 'Energetic Orange',
    description: 'Bold and vibrant',
    primary: '#ea580c',
    secondary: '#f97316',
    accent: '#eab308',
    background: '#fff7ed',
    text: '#7c2d12',
    preview: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
  },
  {
    id: 'red',
    name: 'Passionate Red',
    description: 'Energy and excitement',
    primary: '#dc2626',
    secondary: '#ef4444',
    accent: '#f59e0b',
    background: '#fef2f2',
    text: '#7f1d1d',
    preview: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
  },
  {
    id: 'pink',
    name: 'Creative Pink',
    description: 'Fun and playful',
    primary: '#db2777',
    secondary: '#ec4899',
    accent: '#8b5cf6',
    background: '#fdf2f8',
    text: '#831843',
    preview: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)',
  },
  {
    id: 'teal',
    name: 'Modern Teal',
    description: 'Calm and balanced',
    primary: '#0d9488',
    secondary: '#14b8a6',
    accent: '#06b6d4',
    background: '#f0fdfa',
    text: '#134e4a',
    preview: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
  },
  {
    id: 'indigo',
    name: 'Deep Indigo',
    description: 'Sophisticated and modern',
    primary: '#4f46e5',
    secondary: '#6366f1',
    accent: '#a855f7',
    background: '#eef2ff',
    text: '#312e81',
    preview: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Refreshing and cool',
    primary: '#0284c7',
    secondary: '#0ea5e9',
    accent: '#06b6d4',
    background: '#f0f9ff',
    text: '#075985',
    preview: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
  },
  {
    id: 'sunset',
    name: 'Golden Sunset',
    description: 'Warm and inviting',
    primary: '#d97706',
    secondary: '#f59e0b',
    accent: '#ea580c',
    background: '#fffbeb',
    text: '#78350f',
    preview: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural and grounded',
    primary: '#166534',
    secondary: '#16a34a',
    accent: '#84cc16',
    background: '#f7fee7',
    text: '#14532d',
    preview: 'linear-gradient(135deg, #166534 0%, #16a34a 100%)',
  },
  {
    id: 'professional',
    name: 'Professional Gray',
    description: 'Clean and minimalist',
    primary: '#374151',
    secondary: '#6b7280',
    accent: '#3b82f6',
    background: '#f9fafb',
    text: '#111827',
    preview: 'linear-gradient(135deg, #374151 0%, #6b7280 100%)',
  },
];

export function getPaletteById(id: string): ColorPalette | undefined {
  return COLOR_PALETTES.find(palette => palette.id === id);
}

export function getDefaultPalette(): ColorPalette {
  return COLOR_PALETTES[0]; // Royal Purple
}
