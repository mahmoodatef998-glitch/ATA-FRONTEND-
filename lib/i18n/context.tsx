'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, defaultLanguage, t, isRTL } from './index';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'ata-crm-language';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
        setLanguageState(savedLanguage);
      }
      setMounted(true);
    }
  }, []);

  // Update document direction and lang attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr';
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  };

  const translate = (key: string, params?: Record<string, string | number>) => {
    return t(key, language, params);
  };

  // Always provide context, even before mount to avoid errors
  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t: translate,
        isRTL: isRTL(language),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}


