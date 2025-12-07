/**
 * Internationalization (i18n) System
 * Simple translation system for English and Arabic
 */

import enTranslations from './translations/en.json';
import arTranslations from './translations/ar.json';

export type Language = 'en' | 'ar';

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

export const defaultLanguage: Language = 'en';

const translations = {
  en: enTranslations,
  ar: arTranslations,
} as const;

/**
 * Get translation for a key
 * @param key - Translation key (e.g., "common.checkIn")
 * @param lang - Language code
 * @param params - Optional parameters to replace in translation
 * @returns Translated string
 */
export function t(key: string, lang: Language = defaultLanguage, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if translation not found
      value = translations[defaultLanguage];
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return key; // Return key if translation not found
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace parameters in translation
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}

/**
 * Get all translations for a namespace
 * @param namespace - Namespace (e.g., "common", "navbar")
 * @param lang - Language code
 * @returns Object with all translations in the namespace
 */
export function getTranslations(namespace: string, lang: Language = defaultLanguage): Record<string, string> {
  const translation = translations[lang] as any;
  return translation[namespace] || {};
}

/**
 * Check if a language is RTL (Right-to-Left)
 */
export function isRTL(lang: Language): boolean {
  return lang === 'ar';
}


