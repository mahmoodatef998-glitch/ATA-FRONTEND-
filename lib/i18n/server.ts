/**
 * Server-side i18n utilities
 * For use in Server Components and API routes
 */

import { cookies } from 'next/headers';
import { Language, defaultLanguage, t } from './index';

/**
 * Get language from cookies (for Server Components)
 * Falls back to default language if cookie not found
 */
export async function getServerLanguage(): Promise<Language> {
  try {
    const cookieStore = await cookies();
    const language = cookieStore.get('ata-crm-language')?.value as Language | undefined;
    
    if (language && (language === 'en' || language === 'ar')) {
      return language;
    }
  } catch (error) {
    // Cookies might not be available in some contexts
    console.warn('Could not read language cookie:', error);
  }
  
  return defaultLanguage;
}

/**
 * Get translation in Server Components
 */
export async function getTranslation(key: string, params?: Record<string, string | number>): Promise<string> {
  const language = await getServerLanguage();
  return t(key, language, params);
}

/**
 * Get all translations for a namespace in Server Components
 */
export async function getServerTranslations(namespace: string): Promise<Record<string, string>> {
  const language = await getServerLanguage();
  const translations = await import(`./translations/${language}.json`);
  return translations.default[namespace] || {};
}

