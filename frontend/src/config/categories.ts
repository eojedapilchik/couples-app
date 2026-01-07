/**
 * Category definitions for the card library.
 * Categories are derived from groupings returned by the API.
 */

import type { Grouping } from '../api/types';

export interface CategoryFilter {
  groupingSlug?: string;
}

export interface CategoryDefinition {
  id: string;
  label: string;
  emoji: string;
  colors: {
    bg: string;
    text: string;
  };
  filter: CategoryFilter;
  order: number;
}

const STYLE_BY_SLUG: Record<
  string,
  { emoji: string; colors: { bg: string; text: string } }
> = {
  standard: {
    emoji: '💕',
    colors: { bg: 'linear-gradient(135deg, #E8D5B7 0%, #D4A574 100%)', text: '#4A3728' },
  },
  spicy: {
    emoji: '🔥',
    colors: { bg: 'linear-gradient(135deg, #FECACA 0%, #F87171 100%)', text: '#7F1D1D' },
  },
  very_spicy: {
    emoji: '🌶️',
    colors: { bg: 'linear-gradient(135deg, #FCA5A5 0%, #DC2626 100%)', text: '#FFFFFF' },
  },
  extreme: {
    emoji: '⚡',
    colors: { bg: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)', text: '#F9FAFB' },
  },
  romance: {
    emoji: '💝',
    colors: { bg: 'linear-gradient(135deg, #F5E6E8 0%, #D5A6BD 100%)', text: '#6B3A5B' },
  },
  risas: {
    emoji: '😂',
    colors: { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)', text: '#78350F' },
  },
  otras: {
    emoji: '✨',
    colors: { bg: 'linear-gradient(135deg, #E0E7FF 0%, #A5B4FC 100%)', text: '#3730A3' },
  },
};

const FALLBACK_STYLES = [
  {
    emoji: '🎴',
    colors: { bg: 'linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)', text: '#7F1D1D' },
  },
  {
    emoji: '🎯',
    colors: { bg: 'linear-gradient(135deg, #E0F2FE 0%, #93C5FD 100%)', text: '#1E3A8A' },
  },
  {
    emoji: '🌿',
    colors: { bg: 'linear-gradient(135deg, #DCFCE7 0%, #86EFAC 100%)', text: '#14532D' },
  },
  {
    emoji: '✨',
    colors: { bg: 'linear-gradient(135deg, #F5D0FE 0%, #C4B5FD 100%)', text: '#4C1D95' },
  },
];

function hashSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function resolveStyle(slug: string) {
  if (STYLE_BY_SLUG[slug]) {
    return STYLE_BY_SLUG[slug];
  }
  const index = hashSlug(slug) % FALLBACK_STYLES.length;
  return FALLBACK_STYLES[index];
}

export function buildCategoriesFromGroupings(groupings: Grouping[]): CategoryDefinition[] {
  const unique = new Map<string, Grouping>();
  for (const grouping of groupings) {
    if (!unique.has(grouping.slug)) {
      unique.set(grouping.slug, grouping);
    }
  }

  return Array.from(unique.values()).map((grouping) => {
    const style = resolveStyle(grouping.slug);
    return {
      id: grouping.slug,
      label: grouping.name,
      emoji: style.emoji,
      colors: style.colors,
      filter: { groupingSlug: grouping.slug },
      order: grouping.display_order,
    };
  });
}

// Helper to build API query params from a category filter
export function buildFilterParams(filter: CategoryFilter): {
  groupingSlug?: string;
} {
  return {
    groupingSlug: filter.groupingSlug,
  };
}
