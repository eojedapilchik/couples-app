/**
 * App configuration - Centralized settings
 *
 * Environment variables:
 * - VITE_CURRENCY_NAME: Name of the couple's currency (default: "Venus")
 * - VITE_CURRENCY_NAME_PLURAL: Plural form (default: same as singular in Spanish)
 */

export const APP_CONFIG = {
  // Currency/points system
  currency: {
    name: import.meta.env.VITE_CURRENCY_NAME || 'Venus',
    namePlural: import.meta.env.VITE_CURRENCY_NAME_PLURAL || import.meta.env.VITE_CURRENCY_NAME || 'Venus',
    nameLower: (import.meta.env.VITE_CURRENCY_NAME || 'Venus').toLowerCase(),
    namePluralLower: (import.meta.env.VITE_CURRENCY_NAME_PLURAL || import.meta.env.VITE_CURRENCY_NAME || 'Venus').toLowerCase(),
  },

  // Limits
  maxCreditCost: 7,
  minCreditCost: 1,
} as const;

// Helper to get formatted currency text
export function formatCurrency(amount: number): string {
  const { name } = APP_CONFIG.currency;
  return `${amount} ${name}`;
}

// Export individual values for convenience
export const CURRENCY_NAME = APP_CONFIG.currency.name;
export const CURRENCY_NAME_LOWER = APP_CONFIG.currency.nameLower;
