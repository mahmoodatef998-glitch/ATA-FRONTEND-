"use client";

import { createContext, useContext, ReactNode } from "react";

interface I18nContextType {
  t: (key: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const t = (key: string) => {
    // Simple translation fallback - return key as-is
    // In production, this would use a translation library
    return key;
  };

  return (
    <I18nContext.Provider value={{ t, locale: "en", setLocale: () => {} }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return { t: (key: string) => key, locale: "en", setLocale: () => {} };
  }
  return context;
}



