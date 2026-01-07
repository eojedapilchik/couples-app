/**
 * Category definitions for the card library.
 * Each category maps to a grouping slug.
 */

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

export const CATEGORIES: CategoryDefinition[] = [
  // === INTENSITY-BASED (No overlap - purely by intensity) ===
  {
    id: 'cat_estandar',
    label: 'Estandar',
    emoji: '💕',
    colors: {
      bg: 'linear-gradient(135deg, #E8D5B7 0%, #D4A574 100%)',
      text: '#4A3728',
    },
    filter: {
      groupingSlug: 'standard',
    },
    order: 1,
  },
  {
    id: 'cat_caliente',
    label: 'Caliente',
    emoji: '🔥',
    colors: {
      bg: 'linear-gradient(135deg, #FECACA 0%, #F87171 100%)',
      text: '#7F1D1D',
    },
    filter: {
      groupingSlug: 'spicy',
    },
    order: 2,
  },
  {
    id: 'cat_muy_caliente',
    label: 'Muy Caliente',
    emoji: '🌶️',
    colors: {
      bg: 'linear-gradient(135deg, #FCA5A5 0%, #DC2626 100%)',
      text: '#FFFFFF',
    },
    filter: {
      groupingSlug: 'very_spicy',
    },
    order: 3,
  },
  {
    id: 'cat_extreme',
    label: 'Extremo',
    emoji: '⚡',
    colors: {
      bg: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
      text: '#F9FAFB',
    },
    filter: {
      groupingSlug: 'extreme',
    },
    order: 4,
  },

  // === CATEGORY-BASED (Non-calientes) ===
  {
    id: 'cat_romance',
    label: 'Romance',
    emoji: '💝',
    colors: {
      bg: 'linear-gradient(135deg, #F5E6E8 0%, #D5A6BD 100%)',
      text: '#6B3A5B',
    },
    filter: {
      groupingSlug: 'romance',
    },
    order: 5,
  },
  {
    id: 'cat_risas',
    label: 'Risas',
    emoji: '😂',
    colors: {
      bg: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
      text: '#78350F',
    },
    filter: {
      groupingSlug: 'risas',
    },
    order: 6,
  },
  {
    id: 'cat_otras',
    label: 'Otras',
    emoji: '✨',
    colors: {
      bg: 'linear-gradient(135deg, #E0E7FF 0%, #A5B4FC 100%)',
      text: '#3730A3',
    },
    filter: {
      groupingSlug: 'otras',
    },
    order: 7,
  },
];

// Helper to get category by ID
export function getCategoryById(id: string): CategoryDefinition | undefined {
  return CATEGORIES.find(cat => cat.id === id);
}

// Helper to build API query params from a category filter
export function buildFilterParams(filter: CategoryFilter): {
  groupingSlug?: string;
} {
  return {
    groupingSlug: filter.groupingSlug,
  };
}
