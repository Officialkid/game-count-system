// lib/theme-recommendations.ts
// AI-powered theme recommendations based on event names and types

import { COLOR_PALETTES, ColorPalette } from './color-palettes';

interface ThemeKeyword {
  keywords: string[];
  paletteIds: string[];
  weight: number;
}

// Keyword patterns for theme matching
const THEME_PATTERNS: ThemeKeyword[] = [
  {
    keywords: ['corporate', 'business', 'professional', 'office', 'enterprise', 'meeting', 'conference'],
    paletteIds: ['professional', 'blue', 'indigo'],
    weight: 1.0,
  },
  {
    keywords: ['sport', 'game', 'competition', 'tournament', 'championship', 'league', 'match'],
    paletteIds: ['green', 'orange', 'red'],
    weight: 1.0,
  },
  {
    keywords: ['tech', 'technology', 'digital', 'cyber', 'innovation', 'startup', 'hackathon'],
    paletteIds: ['blue', 'indigo', 'purple', 'teal'],
    weight: 0.9,
  },
  {
    keywords: ['party', 'celebration', 'festival', 'birthday', 'anniversary', 'gala'],
    paletteIds: ['pink', 'purple', 'sunset', 'orange'],
    weight: 0.9,
  },
  {
    keywords: ['nature', 'eco', 'green', 'environment', 'garden', 'outdoor', 'camping'],
    paletteIds: ['green', 'forest', 'teal'],
    weight: 0.9,
  },
  {
    keywords: ['ocean', 'beach', 'sea', 'water', 'surf', 'marine', 'aqua'],
    paletteIds: ['ocean', 'teal', 'blue'],
    weight: 0.9,
  },
  {
    keywords: ['sunset', 'warm', 'summer', 'tropical', 'vacation'],
    paletteIds: ['sunset', 'orange', 'red'],
    weight: 0.8,
  },
  {
    keywords: ['creative', 'art', 'design', 'artist', 'studio', 'craft'],
    paletteIds: ['purple', 'pink', 'indigo', 'sunset'],
    weight: 0.8,
  },
  {
    keywords: ['education', 'school', 'university', 'college', 'learning', 'academy', 'class'],
    paletteIds: ['blue', 'indigo', 'professional'],
    weight: 0.8,
  },
  {
    keywords: ['health', 'medical', 'fitness', 'wellness', 'clinic', 'hospital'],
    paletteIds: ['green', 'blue', 'teal'],
    weight: 0.8,
  },
  {
    keywords: ['music', 'concert', 'band', 'performance', 'show', 'entertainment'],
    paletteIds: ['purple', 'pink', 'indigo', 'red'],
    weight: 0.8,
  },
  {
    keywords: ['food', 'restaurant', 'cooking', 'chef', 'cuisine', 'dining', 'culinary'],
    paletteIds: ['orange', 'red', 'sunset'],
    weight: 0.7,
  },
  {
    keywords: ['luxury', 'premium', 'elite', 'vip', 'exclusive', 'upscale'],
    paletteIds: ['professional', 'purple', 'indigo'],
    weight: 0.9,
  },
  {
    keywords: ['charity', 'fundraiser', 'donation', 'volunteer', 'community', 'social'],
    paletteIds: ['green', 'blue', 'pink'],
    weight: 0.8,
  },
  {
    keywords: ['winter', 'snow', 'ice', 'holiday', 'christmas', 'festive'],
    paletteIds: ['blue', 'indigo', 'teal'],
    weight: 0.7,
  },
];

export interface ThemeRecommendation {
  palette: ColorPalette;
  score: number;
  reason: string;
}

/**
 * Analyze event name and return recommended color palettes
 * @param eventName The name of the event
 * @param limit Maximum number of recommendations to return
 * @returns Array of theme recommendations sorted by relevance
 */
export function getThemeRecommendations(
  eventName: string,
  limit: number = 3
): ThemeRecommendation[] {
  const normalizedName = eventName.toLowerCase();
  const scores = new Map<string, { score: number; reasons: string[] }>();

  // Initialize scores for all palettes
  COLOR_PALETTES.forEach(palette => {
    scores.set(palette.id, { score: 0, reasons: [] });
  });

  // Analyze against patterns
  THEME_PATTERNS.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      if (normalizedName.includes(keyword)) {
        pattern.paletteIds.forEach(paletteId => {
          const entry = scores.get(paletteId);
          if (entry) {
            entry.score += pattern.weight;
            entry.reasons.push(`Matches "${keyword}"`);
          }
        });
      }
    });
  });

  // Bonus for exact word matches
  THEME_PATTERNS.forEach(pattern => {
    pattern.keywords.forEach(keyword => {
      const wordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (wordRegex.test(normalizedName)) {
        pattern.paletteIds.forEach(paletteId => {
          const entry = scores.get(paletteId);
          if (entry) {
            entry.score += 0.3; // Bonus for exact word match
          }
        });
      }
    });
  });

  // Convert to recommendations array
  const recommendations: ThemeRecommendation[] = [];

  scores.forEach((data, paletteId) => {
    const palette = COLOR_PALETTES.find(p => p.id === paletteId);
    if (palette && data.score > 0) {
      recommendations.push({
        palette,
        score: data.score,
        reason: data.reasons.length > 0
          ? data.reasons.slice(0, 2).join(', ')
          : 'General recommendation',
      });
    }
  });

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  // If no matches, return top 3 popular themes
  if (recommendations.length === 0) {
    return [
      {
        palette: COLOR_PALETTES.find(p => p.id === 'purple')!,
        score: 0,
        reason: 'Popular choice',
      },
      {
        palette: COLOR_PALETTES.find(p => p.id === 'blue')!,
        score: 0,
        reason: 'Professional and trusted',
      },
      {
        palette: COLOR_PALETTES.find(p => p.id === 'green')!,
        score: 0,
        reason: 'Fresh and energetic',
      },
    ];
  }

  return recommendations.slice(0, limit);
}

/**
 * Get quick theme suggestion (top match only)
 */
export function suggestTheme(eventName: string): ColorPalette {
  const recommendations = getThemeRecommendations(eventName, 1);
  return recommendations[0]?.palette || COLOR_PALETTES[0];
}
