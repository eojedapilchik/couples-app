/**
 * Locale configuration for the app.
 * Cards are stored in English, translations are loaded for other locales.
 */

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Default locale (cards stored in English)
export const DEFAULT_LOCALE: SupportedLocale = 'en';

// Local storage key for user's locale preference
const LOCALE_STORAGE_KEY = 'app_locale';

/**
 * Get the current locale.
 * Priority: localStorage > browser language > default
 */
export function getLocale(): SupportedLocale {
  // Check localStorage first
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
    return stored as SupportedLocale;
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale;
  }

  // Default to Spanish for this app (since it's a couples app for Spanish speakers)
  return 'es';
}

/**
 * Set the locale preference.
 */
export function setLocale(locale: SupportedLocale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

/**
 * Get locale for API calls.
 * Always returns 'es' for Spanish translations since this is a Spanish app.
 */
export function getApiLocale(): string {
  return 'es';
}
